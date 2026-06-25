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

    // 3. Compute relative clickAction URL based on data type
    let clickAction = '/dashboard';
    if (data && data.type) {
      if (data.type === 'CHAT_MESSAGE' && data.senderId) {
        clickAction = `/dashboard/social?tab=chat&chatType=direct&chatId=${data.senderId}`;
      } else if (data.type === 'GROUP_MESSAGE' && data.groupId) {
        clickAction = `/dashboard/social?tab=chat&chatType=group&chatId=${data.groupId}`;
      } else if (data.type === 'LIVE_ROOM_CREATED' && data.roomName) {
        clickAction = `/dashboard/live-rooms/${data.roomName}`;
      }
    }

    // Serialize all values to string to comply with FCM data payload requirements
    const serializedData = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          serializedData[key] = String(value);
        }
      }
    }
    serializedData.clickAction = clickAction;

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
            clickAction: clickAction,
            data: serializedData
          }
        }
      });

      console.log(`[Push Notification] Dispatched successfully. Success: ${response.successCount}, Failure: ${response.failureCount}`);

      // Cleanup invalid tokens
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
