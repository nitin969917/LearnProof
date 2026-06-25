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

    // 3. Dispatch FCM Push Notifications
    if (admin && admin.apps.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data || {},
        webpush: {
          notification: {
            icon: 'https://learnproofai.com/LP_M_logo.png',
            badge: 'https://learnproofai.com/LP_M_logo.png'
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
