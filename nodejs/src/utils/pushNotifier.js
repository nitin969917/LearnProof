const datingPrisma = require('./datingPrisma');
const prisma = require('../lib/prisma');
const admin = require('../lib/firebaseAdmin');

/**
 * Resolves a list of SQLite user IDs to their main PostgreSQL user profiles (via email),
 * queries their registered FCM push tokens, and dispatches a multicast message.
 * Falls back to mock logs if the Firebase Admin SDK is not initialized.
 */
const sendPushNotification = async (receiverUserIds, title, body, data = {}) => {
  if (!receiverUserIds || receiverUserIds.length === 0) return;

  try {
    // 1. Get emails of target users in dating SQLite database
    const sqliteUsers = await datingPrisma.user.findMany({
      where: { id: { in: receiverUserIds } },
      select: { email: true }
    });
    
    if (sqliteUsers.length === 0) return;
    const emails = sqliteUsers.map(u => u.email);

    // 2. Fetch active FCM tokens of corresponding users from PG database
    const tokenRecords = await prisma.userFcmToken.findMany({
      where: {
        user: {
          email: { in: emails }
        }
      },
      select: { token: true }
    });

    const tokens = tokenRecords.map(r => r.token);
    if (tokens.length === 0) {
      console.log(`[Push Notification] No registered device tokens found for users: ${emails.join(', ')}`);
      return;
    }

    // 3. Compute relative clickAction URL based on data type or roomName
    let clickAction = '/dashboard';
    if (data) {
      if (data.roomName) {
        clickAction = `/dashboard/live-rooms/${data.roomName}`;
      } else if (data.type === 'CHAT_MESSAGE' && data.senderId) {
        clickAction = `/dashboard/social/chats/direct/${data.senderId}`;
      } else if (data.type === 'GROUP_MESSAGE' && data.groupId) {
        clickAction = `/dashboard/social/chats/group/${data.groupId}`;
      } else if (data.clickAction || data.click_action) {
        clickAction = data.clickAction || data.click_action;
      }
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://learnproofai.com';
    const fullTargetUrl = clickAction.startsWith('http') ? clickAction : `${baseUrl}${clickAction}`;

    // Serialize all values to string to comply with FCM data payload requirements (max 4KB total)
    const serializedData = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          const strVal = String(value);
          // Exclude base64 image strings or huge values that exceed FCM 4KB limit
          if (strVal.startsWith('data:image') || strVal.length > 800) {
            continue;
          }
          serializedData[key] = strVal;
        }
      }
    }
    serializedData.title = String(title || 'LearnProof');
    serializedData.body = String(body || '');
    serializedData.clickAction = clickAction;
    serializedData.targetUrl = clickAction;
    serializedData.url = clickAction;
    serializedData.path = clickAction;
    serializedData.fullUrl = fullTargetUrl;
    if (data && data.roomName) {
      serializedData.roomName = String(data.roomName);
    }

    // 4. Dispatch FCM Push Notifications
    if (admin && admin.apps.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: serializedData,
        webpush: {
          notification: {
            icon: 'https://learnproofai.com/LP_M_logo.png',
            badge: 'https://learnproofai.com/LP_M_logo.png',
            data: serializedData
          },
          fcmOptions: {
            link: fullTargetUrl
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
          },
          data: serializedData
        }
      });

      console.log(`[Push Notification] Dispatched successfully. Success: ${response.successCount}, Failure: ${response.failureCount}`);

      // Cleanup invalid tokens and log any failures
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`[Push Notification Failure for token ${tokens[idx]?.substring(0, 15)}...]:`, resp.error);
            const errCode = resp.error?.code;
            if (errCode === 'messaging/registration-token-not-registered' || 
                errCode === 'messaging/invalid-registration-token') {
              failedTokens.push(tokens[idx]);
            }
          }
        });
        if (failedTokens.length > 0) {
          console.log(`[Push Notification] Cleaning up ${failedTokens.length} stale tokens from database.`);
          await prisma.userFcmToken.deleteMany({
            where: { token: { in: failedTokens } }
          });
        }
      }
    } else {
      console.log(`[Push Notification] [Mock/Dry Run] Would send notification to tokens: [${tokens.join(', ')}]. Title: "${title}", Body: "${body}", Data:`, data);
    }
  } catch (err) {
    console.error('[Push Notification] Error sending notification:', err.message);
  }
};

module.exports = { sendPushNotification };
