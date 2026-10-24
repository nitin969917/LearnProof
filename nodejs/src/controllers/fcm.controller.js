const prisma = require('../lib/prisma');
const admin = require('../lib/firebaseAdmin');
const axios = require('axios');

/**
 * Converts a native Apple APNs device token (64 hex characters) to an FCM registration token.
 */
const convertApnsToFcmToken = async (apnsToken) => {
    try {
        if (!admin || admin.apps.length === 0) return apnsToken;
        const tokenObj = await admin.app().options.credential.getAccessToken();
        const accessToken = tokenObj.access_token;
        if (!accessToken) return apnsToken;

        const bundleId = 'com.learnproof.learnProof';
        
        // Try production (TestFlight/App Store) first, then fallback to sandbox (Xcode direct run)
        for (const isSandbox of [false, true]) {
            try {
                const response = await axios.post('https://iid.googleapis.com/iid/v1:batchImport', {
                    application: bundleId,
                    sandbox: isSandbox,
                    apns_tokens: [apnsToken]
                }, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'access_token_auth': 'true',
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && response.data.results && response.data.results[0]?.status === 'OK') {
                    const registrationToken = response.data.results[0].registration_token;
                    console.log(`[APNs Converter] Converted APNs token ${apnsToken.substring(0, 10)}... (sandbox: ${isSandbox}) to FCM token ${registrationToken.substring(0, 15)}...`);
                    return registrationToken;
                }
            } catch (importErr) {
                console.warn(`[APNs Converter] Attempt with sandbox=${isSandbox} failed:`, importErr.response?.data || importErr.message);
            }
        }
    } catch (err) {
        console.warn('[APNs Converter] Could not convert APNs token to FCM token:', err.response?.data || err.message);
    }
    return apnsToken;
};

/**
 * Saves or updates an FCM token for the authenticated user.
 * Expects { token: string, deviceType?: string, timezone?: string } in body.
 */
const saveFcmToken = async (req, res) => {
    let { token, deviceType, timezone } = req.body;
    const user = req.user; // populated by authMiddleware

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        // If token is an iOS APNs device token (64-char hex string), attempt conversion to FCM registration token
        if (/^[0-9a-fA-F]{64}$/.test(token)) {
            const converted = await convertApnsToFcmToken(token);
            if (converted && converted !== token) {
                token = converted;
            }
        }

        // Upsert the token to associate it with the logged-in user
        // and update deviceType/timezone if they have changed.
        const fcmToken = await prisma.userFcmToken.upsert({
            where: { token },
            update: {
                userId: user.id,
                deviceType: deviceType || 'web',
                timezone: timezone || 'UTC',
                updated_at: new Date()
            },
            create: {
                token,
                userId: user.id,
                deviceType: deviceType || 'web',
                timezone: timezone || 'UTC'
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'FCM token saved successfully', 
            data: fcmToken 
        });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Admin endpoint to explicitly send push notifications to a user or all users.
 * Expects { receiverUid?: string, isBroadcast?: boolean, title: string, body: string } in body.
 */
const sendExplicitPush = async (req, res) => {
    const { receiverUid, isBroadcast, title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        let tokens = [];

        if (isBroadcast) {
            // Fetch all registered user tokens
            const userTokens = await prisma.userFcmToken.findMany({
                select: { token: true }
            });
            // Fetch all anonymous device tokens
            const anonymousTokens = await prisma.anonymousDevice.findMany({
                select: { token: true }
            });

            // Combine them, ensuring uniqueness
            const combinedTokens = new Set([
                ...userTokens.map(r => r.token),
                ...anonymousTokens.map(r => r.token)
            ]);
            tokens = Array.from(combinedTokens);
        } else {
            let targetUser = null;
            const trimmedUid = receiverUid ? String(receiverUid).trim() : '';

            // 1. If receiverUid is empty, 'me', or 'self', default to currently authenticated admin user
            if (!trimmedUid || trimmedUid === 'me' || trimmedUid === 'self') {
                if (req.user?.id) {
                    targetUser = await prisma.userProfile.findUnique({
                        where: { id: req.user.id },
                        include: { fcmTokens: { select: { token: true } } }
                    });
                }
            }

            // 2. Search by UID string (Primary: Google / Firebase auth UID, e.g. "115932470826165331971")
            if (!targetUser && trimmedUid) {
                targetUser = await prisma.userProfile.findUnique({
                    where: { uid: trimmedUid },
                    include: { fcmTokens: { select: { token: true } } }
                });
            }

            // 3. Search by numeric integer database ID (only if safe 32-bit positive integer: 1 to 2147483647)
            if (!targetUser && trimmedUid) {
                const numVal = Number(trimmedUid);
                if (Number.isInteger(numVal) && numVal > 0 && numVal <= 2147483647 && String(numVal) === trimmedUid) {
                    targetUser = await prisma.userProfile.findUnique({
                        where: { id: numVal },
                        include: { fcmTokens: { select: { token: true } } }
                    });
                }
            }

            // 4. Search by email address
            if (!targetUser && trimmedUid && trimmedUid.includes('@')) {
                targetUser = await prisma.userProfile.findUnique({
                    where: { email: trimmedUid.toLowerCase() },
                    include: { fcmTokens: { select: { token: true } } }
                });
            }

            // 5. Fallback to logged-in user if still not found
            if (!targetUser && req.user?.id) {
                targetUser = await prisma.userProfile.findUnique({
                    where: { id: req.user.id },
                    include: { fcmTokens: { select: { token: true } } }
                });
            }

            if (!targetUser) {
                return res.status(404).json({ error: 'Target user not found in LearnProof database.' });
            }

            const targetRecipientName = targetUser.name || targetUser.email || `User #${targetUser.id}`;
            tokens = targetUser.fcmTokens.map(r => r.token).filter(Boolean);

            if (tokens.length === 0) {
                return res.status(200).json({ 
                    success: false, 
                    message: `Target user "${targetRecipientName}" exists, but has 0 active push notification tokens. The user must click "Allow" on the notification prompt in their browser or mobile app.`, 
                    sentCount: 0,
                    user: {
                        id: targetUser.id,
                        name: targetUser.name,
                        email: targetUser.email
                    }
                });
            }

            // Interpolate dynamic template tags with real learner values
            title = title
                .replace(/{name}/g, targetUser.name || 'Learner')
                .replace(/{streak}/g, String(targetUser.streak_count || 1))
                .replace(/{remaining}/g, '2');
            body = body
                .replace(/{name}/g, targetUser.name || 'Learner')
                .replace(/{streak}/g, String(targetUser.streak_count || 1))
                .replace(/{remaining}/g, '2');
        }

        if (tokens.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No registered device tokens found to send notifications to.', 
                sentCount: 0 
            });
        }

        // Check if Firebase Admin is initialized
        if (!admin || admin.apps.length === 0) {
            return res.status(503).json({ 
                error: 'Firebase service unavailable. Admin SDK is not initialized.' 
            });
        }

        // Send to multiple tokens using sendEachForMulticast
        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            notification: { title, body },
            webpush: {
                notification: {
                    icon: 'https://learnproofai.com/LP_M_logo.png',
                    badge: 'https://learnproofai.com/LP_M_logo.png'
                }
            },
            android: {
                priority: 'high',
                notification: {
                    icon: 'ic_stat_notification',
                    color: '#F97316',
                    channelId: 'learnproof_notifications',
                    defaultSound: true,
                    defaultVibrateTimings: true
                }
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                    'apns-push-type': 'alert'
                },
                payload: {
                    aps: {
                        alert: {
                            title,
                            body
                        },
                        badge: 1,
                        sound: 'default'
                    }
                }
            }
        });

        console.log(`[Admin Push] Sent ${response.successCount} messages successfully. Failure count: ${response.failureCount}`);

        // Cleanup invalid/expired tokens returned in the multicast response
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errCode = resp.error?.code;
                    if (errCode === 'messaging/registration-token-not-registered' || 
                        errCode === 'messaging/invalid-registration-token') {
                        failedTokens.push(tokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                console.log(`[Admin Push] Cleaning up ${failedTokens.length} expired/invalid FCM tokens from DB.`);
                await prisma.userFcmToken.deleteMany({
                    where: { token: { in: failedTokens } }
                });
                await prisma.anonymousDevice.deleteMany({
                    where: { token: { in: failedTokens } }
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Dispatched push notifications. Success: ${response.successCount}, Failed: ${response.failureCount}`,
            data: {
                successCount: response.successCount,
                failureCount: response.failureCount
            }
        });

    } catch (error) {
        console.error('Error sending explicit push notification:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Endpoint to retrieve all system notification templates.
 */
const getNotificationTemplates = async (req, res) => {
    try {
        const templates = await prisma.notificationTemplate.findMany({
            orderBy: { hour: 'asc' }
        });
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching notification templates:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Endpoint to update an existing notification template or toggle its status.
 * Supports:
 * - Master Switch toggle: { action: 'toggleMasterSwitch', enabled: boolean } or { toggleAll: true, enabled: boolean }
 * - Quick individual toggle: { type: string, enabled: boolean }
 * - Full template update: { type: string, title: string, body: string, hour: number, minute: number, enabled: boolean }
 */
const updateNotificationTemplate = async (req, res) => {
    const { action, toggleAll, type, title, body, hour, minute, enabled } = req.body;

    try {
        // 1. Master System Switch: Enable or Disable ALL notification templates at once
        if (action === 'toggleMasterSwitch' || toggleAll !== undefined) {
            const enabledState = enabled !== undefined ? !!enabled : false;
            await prisma.notificationTemplate.updateMany({
                data: { enabled: enabledState, updated_at: new Date() }
            });
            const allTemplates = await prisma.notificationTemplate.findMany({
                orderBy: { hour: 'asc' }
            });
            return res.status(200).json({
                success: true,
                message: `Automated Notification System ${enabledState ? 'ENABLED' : 'DISABLED'} successfully!`,
                data: allTemplates,
                systemEnabled: enabledState
            });
        }

        // 2. Quick toggle of a single template's enabled state
        if (type && enabled !== undefined && (!title || !body)) {
            const existing = await prisma.notificationTemplate.findUnique({ where: { type } });
            if (existing) {
                const updated = await prisma.notificationTemplate.update({
                    where: { type },
                    data: { enabled: !!enabled, updated_at: new Date() }
                });
                return res.status(200).json({
                    success: true,
                    message: `Template ${type} ${enabled ? 'enabled' : 'disabled'} successfully!`,
                    data: updated
                });
            }
        }

        // 3. Full template update
        if (!type || !title || !body || hour === undefined || minute === undefined) {
            return res.status(400).json({ error: 'All fields (type, title, body, hour, minute) are required' });
        }

        const template = await prisma.notificationTemplate.upsert({
            where: { type },
            update: {
                title,
                body,
                hour: parseInt(hour),
                minute: parseInt(minute),
                enabled: enabled !== undefined ? !!enabled : true,
                updated_at: new Date()
            },
            create: {
                type,
                title,
                body,
                hour: parseInt(hour),
                minute: parseInt(minute),
                enabled: enabled !== undefined ? !!enabled : true
            }
        });

        res.status(200).json({ 
            success: true, 
            message: `Template ${type} updated successfully!`, 
            data: template 
        });
    } catch (error) {
        console.error('Error updating notification template:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Saves or updates an FCM token for an anonymous user (no authentication).
 * Expects { token: string, deviceType?: string, timezone?: string } in body.
 */
const saveAnonymousFcmToken = async (req, res) => {
    let { token, deviceType, timezone } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        // If token is an iOS APNs device token (64-char hex string), attempt conversion to FCM registration token
        if (/^[0-9a-fA-F]{64}$/.test(token)) {
            const converted = await convertApnsToFcmToken(token);
            if (converted && converted !== token) {
                token = converted;
            }
        }

        const anonymousDevice = await prisma.anonymousDevice.upsert({
            where: { token },
            update: {
                deviceType: deviceType || 'web',
                timezone: timezone || 'UTC',
                updated_at: new Date()
            },
            create: {
                token,
                deviceType: deviceType || 'web',
                timezone: timezone || 'UTC'
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Anonymous FCM token saved successfully', 
            data: anonymousDevice 
        });
    } catch (error) {
        console.error('Error saving anonymous FCM token:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    saveFcmToken,
    sendExplicitPush,
    getNotificationTemplates,
    updateNotificationTemplate,
    saveAnonymousFcmToken
};
