const datingPrisma = require('./datingPrisma');
const prisma = require('../lib/prisma');
const admin = require('../lib/firebaseAdmin');
const redis = require('../lib/redis');

const isCriticalAlert = (type) => {
  if (!type) return false;
  const upper = String(type).toUpperCase();
  const critical = [
    'FRIEND_REQUEST_RECEIVED',
    'FRIEND_REQUEST',
    'FRIEND_REQUEST_ACCEPTED',
    'FRIEND_ACCEPTED',
    'ROOM_INVITE',
    'LIVE_ROOM_INVITE',
    'ADMIN_ALERT'
  ];
  return critical.includes(upper);
};

/**
 * Resolves a list of SQLite user IDs to their main PostgreSQL user profiles (via email),
 * queries their registered FCM push tokens, and dispatches a multicast message.
 * Falls back to mock logs if the Firebase Admin SDK is not initialized.
 * 
 * Implements Instagram-standard notification delivery:
 * - If receiver is actively viewing this specific chat, OS push notification is suppressed (0 sound, 0 tray popups).
 * - If receiver is active in the app (foreground), OS push notification is suppressed for high-frequency chat
 *   so the user only sees the quiet in-app floating banner without loud ringtones or phone vibration.
 * - Critical events (friend requests, room invitations, alerts) ALWAYS send OS push notifications.
 * - Push notifications are exclusively sent when receiver is offline or has backgrounded/locked the app.
 */
const sendPushNotification = async (receiverUserIds, title, body, data = {}) => {
  if (!receiverUserIds || receiverUserIds.length === 0) return;

  try {
    // 0. Filter out receivers who are actively in this chat or actively online in the app
    const eligibleReceiverIds = [];
    for (const recId of receiverUserIds) {
      const recIdStr = recId.toString();

      // Critical alerts (friend requests, room invitations) must ALWAYS be delivered to OS push trays
      if (isCriticalAlert(data?.type)) {
        eligibleReceiverIds.push(recId);
        continue;
      }

      // Check if user is currently looking at this specific conversation
      if (data && data.type === 'CHAT_MESSAGE' && data.senderId) {
        try {
          const activeChat = await redis.get(`user:active_chat:${recIdStr}`);
          if (activeChat === `user:${data.senderId}`) {
            console.log(`[Push Notification] Suppressing push for user ${recIdStr}: currently viewing chat with ${data.senderId}`);
            continue;
          }
        } catch (_) {}
      } else if (data && data.type === 'GROUP_MESSAGE' && data.groupId) {
        try {
          const activeChat = await redis.get(`user:active_chat:${recIdStr}`);
          if (activeChat === `group:${data.groupId}`) {
            console.log(`[Push Notification] Suppressing push for user ${recIdStr}: currently inside group ${data.groupId}`);
            continue;
          }
        } catch (_) {}
      }

      // Check if user is currently active inside the app (foreground)
      try {
        const socketCount = await redis.scard(`user:sockets:${recIdStr}`);
        const isBackgrounded = await redis.get(`user:backgrounded:${recIdStr}`);
        if (socketCount > 0 && isBackgrounded !== '1') {
          // User is actively browsing the app. Socket event already delivered real-time message,
          // and DashboardLayout displays the in-app banner. Do NOT play loud phone chimes or system tray popups.
          console.log(`[Push Notification] Suppressing OS push for user ${recIdStr}: currently active in foreground app.`);
          continue;
        }
      } catch (_) {}

      eligibleReceiverIds.push(recId);
    }

    if (eligibleReceiverIds.length === 0) {
      return;
    }

    // 1. Get emails of target users in dating SQLite database & PostgreSQL User table
    const intIds = eligibleReceiverIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    const candidateEmails = new Set();

    if (intIds.length > 0) {
      const sqliteUsers = await datingPrisma.user.findMany({
        where: { id: { in: intIds } },
        select: { email: true }
      });
      sqliteUsers.forEach(u => {
        if (u.email && u.email.trim()) {
          candidateEmails.add(u.email.trim());
          candidateEmails.add(u.email.trim().toLowerCase());
        }
      });

      // Also check if any IDs correspond directly to main PostgreSQL User IDs
      try {
        const pgUsers = await prisma.user.findMany({
          where: { id: { in: intIds } },
          select: { email: true }
        });
        pgUsers.forEach(u => {
          if (u.email && u.email.trim()) {
            candidateEmails.add(u.email.trim());
            candidateEmails.add(u.email.trim().toLowerCase());
          }
        });
      } catch (_) {}
    }

    const emailList = Array.from(candidateEmails);
    if (emailList.length === 0) {
      console.log(`[Push Notification] No email addresses resolved for receiver IDs: ${eligibleReceiverIds.join(', ')}`);
      return;
    }

    // 2. Fetch active FCM tokens of corresponding users from PG database
    const tokenRecords = await prisma.userFcmToken.findMany({
      where: {
        user: {
          email: { in: emailList }
        }
      },
      select: { token: true }
    });

    const tokens = Array.from(new Set(tokenRecords.map(r => r.token).filter(Boolean)));
    if (tokens.length === 0) {
      console.log(`[Push Notification] No registered device tokens found for users: ${emailList.join(', ')}`);
      return;
    }

    console.log(`[Push Notification] Dispatching push to ${tokens.length} token(s) for user(s) ${emailList.join(', ')} [type: ${data?.type || 'STANDARD'}]`);

    // 3. Compute relative clickAction URL based on data type or roomName
    let clickAction = '/dashboard';
    if (data) {
      if (data.roomName) {
        clickAction = `/dashboard/live-rooms/${data.roomName}`;
      } else if (data.type === 'CHAT_MESSAGE' && data.senderId) {
        clickAction = `/dashboard/social/chats/direct/${data.senderId}`;
      } else if (data.type === 'GROUP_MESSAGE' && data.groupId) {
        clickAction = `/dashboard/social/chats/group/${data.groupId}`;
      } else if (data.type === 'FRIEND_REQUEST_RECEIVED' || data.type === 'FRIEND_REQUEST') {
        clickAction = '/dashboard/social?tab=friends&sub=pending';
      } else if (data.type === 'FRIEND_REQUEST_ACCEPTED' || data.type === 'FRIEND_ACCEPTED') {
        clickAction = '/dashboard/social?tab=friends';
      } else if (data.clickAction || data.click_action) {
        clickAction = data.clickAction || data.click_action;
      } else if (data.url || data.path) {
        clickAction = data.url || data.path;
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
            title,
            body,
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
