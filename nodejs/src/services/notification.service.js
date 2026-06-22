const cron = require('node-cron');
const prisma = require('../lib/prisma');
const admin = require('../lib/firebaseAdmin');

/**
 * Helper to retrieve local date-time parts in a given timezone.
 * Falls back to UTC if the timezone is invalid.
 */
const getLocalDateParts = (date, timeZone) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(date);
        const dateObj = {};
        parts.forEach(p => {
            dateObj[p.type] = p.value;
        });
        
        return {
            year: parseInt(dateObj.year),
            month: parseInt(dateObj.month),
            day: parseInt(dateObj.day),
            hour: parseInt(dateObj.hour),
            minute: parseInt(dateObj.minute),
            second: parseInt(dateObj.second)
        };
    } catch (e) {
        // Fallback to UTC if timezone is invalid or unsupported
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const second = date.getUTCSeconds();
        return { year, month, day, hour, minute, second };
    }
};

/**
 * Calculates time difference in milliseconds between a specific timezone and UTC.
 */
const getTimezoneOffset = (timeZone, date = new Date()) => {
    try {
        const dateString = date.toLocaleString("en-US", { timeZone });
        const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
        const diffMs = new Date(dateString) - new Date(utcString);
        return isNaN(diffMs) ? 0 : diffMs;
    } catch (e) {
        return 0;
    }
};

/**
 * Gets a user's local start of day (00:00:00) converted to a UTC Date object.
 */
const getStartOfDayInUTC = (timeZone, referenceDate = new Date()) => {
    const parts = getLocalDateParts(referenceDate, timeZone);
    const pad = (n) => String(n).padStart(2, '0');
    
    // Construct local midnight values as if in UTC
    const localMidnightUTCVal = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
    const offsetMs = getTimezoneOffset(timeZone, referenceDate);
    
    // Subtract offset to find the exact UTC timestamp of local midnight
    return new Date(localMidnightUTCVal - offsetMs);
};

/**
 * Executes checking logic for daily notifications.
 * Scans all registered FCM tokens, checks local timezone time,
 * verifies activity today, and dispatches messages if appropriate.
 */
const sendDailyNotifications = async () => {
    console.log('[Notification Cron] Running checks for daily notifications...');
    
    try {
        // Query enabled template configurations from the database
        const templates = await prisma.notificationTemplate.findMany({
            where: { enabled: true }
        });

        if (templates.length === 0) {
            return; // No active templates configured
        }

        const userTokens = await prisma.userFcmToken.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        streak_count: true,
                        name: true
                    }
                }
            }
        });
        
        const now = new Date();
        
        for (const userToken of userTokens) {
            const { token, timezone, user } = userToken;
            if (!user) continue;
            
            // Get local date-time parts for this token's timezone
            const localParts = getLocalDateParts(now, timezone);
            const localHour = localParts.hour;
            const localMinute = localParts.minute;
            const localMinutes = localHour * 60 + localMinute;
            
            for (const template of templates) {
                const { type, hour, minute, title, body } = template;

                // Match local time slot using a 10-minute active window relative to scheduled minutes
                const scheduledMinutes = hour * 60 + minute;
                const diff = localMinutes - scheduledMinutes;
                const isMatchingTime = (diff >= 0 && diff < 10);
                if (!isMatchingTime) continue;

                // Calculate today's bounds in UTC for this timezone
                const startOfTodayUTC = getStartOfDayInUTC(timezone, now);
                const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 86400000 - 1000);

                // Check if user has logged any activity today in their timezone
                const activitiesCount = await prisma.userActivityLog.count({
                    where: {
                        userId: user.id,
                        timestamp: {
                            gte: startOfTodayUTC,
                            lte: endOfTodayUTC
                        }
                    }
                });
                
                const isInactiveToday = activitiesCount === 0;

                // Interpolate dynamic template tags (e.g. replace {streak} and {name} placeholders)
                const formattedTitle = title
                    .replace(/{streak}/g, user.streak_count)
                    .replace(/{name}/g, user.name || '');
                const formattedBody = body
                    .replace(/{streak}/g, user.streak_count)
                    .replace(/{name}/g, user.name || '');

                if (type === 'STREAK_KEEP_ALIVE' && isInactiveToday) {
                    await attemptSendNotification(user.id, token, type, formattedTitle, formattedBody, startOfTodayUTC, endOfTodayUTC);
                } else if (type === 'STREAK_AT_RISK' && user.streak_count > 0 && isInactiveToday) {
                    await attemptSendNotification(user.id, token, type, formattedTitle, formattedBody, startOfTodayUTC, endOfTodayUTC);
                }
            }
        }
    } catch (err) {
        console.error('[Notification Cron] Error in daily notification execution:', err);
    }
};

/**
 * Handles checking limits, duplicate prevention, and calling FCM send API.
 */
const attemptSendNotification = async (userId, token, type, title, body, startOfTodayUTC, endOfTodayUTC) => {
    try {
        // Prevent duplicate messages of the same type to the same user today
        const existingNotification = await prisma.sentNotification.findFirst({
            where: {
                userId,
                type,
                sentAt: {
                    gte: startOfTodayUTC,
                    lte: endOfTodayUTC
                }
            }
        });
        
        if (existingNotification) {
            return; // Duplicate prevented
        }
        
        // Enforce maximum 2 notifications per user per day rule
        const dailySentCount = await prisma.sentNotification.count({
            where: {
                userId,
                sentAt: {
                    gte: startOfTodayUTC,
                    lte: endOfTodayUTC
                }
            }
        });
        
        if (dailySentCount >= 2) {
            console.log(`[Notification Cron] Skipping: User ${userId} reached daily limit of 2 notifications.`);
            return;
        }
        
        // Dispatch FCM Push Notification via firebase-admin SDK (if initialized)
        if (admin && admin.apps.length > 0) {
            const message = {
                notification: {
                    title,
                    body
                },
                webpush: {
                    notification: {
                        icon: 'https://learnproofai.com/LP_M_logo.png',
                        badge: 'https://learnproofai.com/LP_M_logo.png'
                    }
                },
                token
            };
            
            await admin.messaging().send(message);
            console.log(`[Notification Cron] Successfully sent ${type} notification to user ${userId}`);
        } else {
            console.log(`[Notification Cron] [Mock/Dry Run] Would send ${type} notification to user ${userId}: token=${token}`);
        }
        
        // Log notification dispatch in database
        await prisma.sentNotification.create({
            data: {
                userId,
                type,
                sentAt: new Date()
            }
        });
        
    } catch (error) {
        // Handle expired, un-registered, or invalid FCM tokens
        if (error.code === 'messaging/registration-token-not-registered' || 
            error.code === 'messaging/invalid-registration-token') {
            console.log(`[Notification Cron] Removing invalid/expired token from DB: ${token}`);
            try {
                await prisma.userFcmToken.delete({
                    where: { token }
                });
            } catch (delErr) {
                console.error('[Notification Cron] Error removing invalid token:', delErr.message);
            }
        } else {
            console.error(`[Notification Cron] Error sending ${type} to user ${userId}:`, error.message);
        }
    }
};

// Seed default dynamic templates to database on start if they are missing
const ensureDefaultTemplates = async () => {
    try {
        await prisma.notificationTemplate.upsert({
            where: { type: 'STREAK_KEEP_ALIVE' },
            update: {},
            create: {
                type: 'STREAK_KEEP_ALIVE',
                title: '📚 Keep your streak alive',
                body: 'Start your daily learning to maintain your streak!',
                hour: 8,
                minute: 0,
                enabled: true
            }
        });

        await prisma.notificationTemplate.upsert({
            where: { type: 'STREAK_AT_RISK' },
            update: {},
            create: {
                type: 'STREAK_AT_RISK',
                title: '🔥 Your streak is at risk',
                body: 'Keep up the momentum! Your {streak}-day learning streak is at risk of resetting.',
                hour: 21,
                minute: 30,
                enabled: true
            }
        });
        console.log('[Notification Cron] Default templates checked and seeded successfully.');
    } catch (e) {
        console.error('[Notification Cron] Error seeding templates on startup:', e.message);
    }
};

ensureDefaultTemplates();

// Schedule check cron to run every 5 minutes
cron.schedule('*/5 * * * *', sendDailyNotifications);

console.log('[Notification Cron] Daily notifications service initialized (scheduled every 5 mins).');

module.exports = {
    sendDailyNotifications,
    getLocalDateParts,
    getTimezoneOffset,
    getStartOfDayInUTC
};
