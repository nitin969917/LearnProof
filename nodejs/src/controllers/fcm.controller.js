const prisma = require('../lib/prisma');
const admin = require('../lib/firebaseAdmin');

/**
 * Saves or updates an FCM token for the authenticated user.
 * Expects { token: string, deviceType?: string, timezone?: string } in body.
 */
const saveFcmToken = async (req, res) => {
    const { token, deviceType, timezone } = req.body;
    const user = req.user; // populated by authMiddleware

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
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
        let tokenRecords = [];

        if (isBroadcast) {
            // Fetch all tokens
            tokenRecords = await prisma.userFcmToken.findMany({
                select: { token: true }
            });
        } else {
            if (!receiverUid) {
                return res.status(400).json({ error: 'Receiver UID is required for targeted push notifications' });
            }
            
            const targetUser = await prisma.userProfile.findUnique({
                where: { uid: receiverUid },
                include: { fcmTokens: { select: { token: true } } }
            });

            if (!targetUser) {
                return res.status(404).json({ error: 'Target user not found' });
            }

            tokenRecords = targetUser.fcmTokens;
        }

        const tokens = tokenRecords.map(r => r.token);

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
            notification: { title, body }
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
                console.log(`[Admin Push] Cleaning up ${failedTokens.length} stale tokens from database.`);
                await prisma.userFcmToken.deleteMany({
                    where: { token: { in: failedTokens } }
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Notifications sent successfully to ${response.successCount} devices.`,
            sentCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (error) {
        console.error('Error sending admin push notifications:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Admin endpoint to fetch all daily notification templates.
 */
const getNotificationTemplates = async (req, res) => {
    try {
        const templates = await prisma.notificationTemplate.findMany({
            orderBy: { id: 'asc' }
        });
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching notification templates:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Admin endpoint to update a daily notification template.
 */
const updateNotificationTemplate = async (req, res) => {
    const { type, title, body, hour, minute, enabled } = req.body;

    if (!type || !title || !body || hour === undefined || minute === undefined) {
        return res.status(400).json({ error: 'Type, title, body, hour, and minute are required' });
    }

    try {
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

module.exports = {
    saveFcmToken,
    sendExplicitPush,
    getNotificationTemplates,
    updateNotificationTemplate
};
