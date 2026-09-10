importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase App in service worker context
firebase.initializeApp({
  apiKey: "AIzaSyD43T1--NTCDprsegnew2ZrL15FY7rz1uU",
  authDomain: "learnproof-b24c7.firebaseapp.com",
  projectId: "learnproof-b24c7",
  storageBucket: "learnproof-b24c7.firebasestorage.app",
  messagingSenderId: "549492309059",
  appId: "1:549492309059:web:168f96fc2164fdaef668f6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    // If an app window is open and visible on screen, suppress the out-of-app OS notification
    const isVisible = clientList.some(client => client.visibilityState === 'visible');
    if (isVisible) {
      console.log('[firebase-messaging-sw.js] App is currently visible in foreground. Suppressing out-of-app OS notification.');
      return;
    }

    // If the message has a notification block, the browser displays it automatically when in background
    if (payload.notification) {
      console.log('[firebase-messaging-sw.js] Notification payload detected. Letting browser handle auto-display to prevent duplicates.');
      return;
    }

    const iconUrl = self.location.origin + '/LP_M_logo.png';
    const notificationTitle = payload.data?.title || "LearnProof AI";
    
    const data = payload.data || {};
    let clickAction = '/dashboard';
    if (data.roomName) {
      clickAction = `/dashboard/live-rooms/${data.roomName}`;
    } else if (data.type === 'CHAT_MESSAGE' && data.senderId) {
      clickAction = `/dashboard/social/chats/direct/${data.senderId}`;
    } else if (data.type === 'GROUP_MESSAGE' && data.groupId) {
      clickAction = `/dashboard/social/chats/group/${data.groupId}`;
    } else if (data.clickAction || data.click_action) {
      clickAction = data.clickAction || data.click_action;
    }

    const enrichedData = {
      ...data,
      clickAction: clickAction || '/dashboard'
    };

    const notificationOptions = {
      body: payload.data?.body || "You have a new update",
      icon: iconUrl,
      badge: iconUrl,
      data: enrichedData
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
});

// Handle notification click (focus tab or open new tab)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetPath = '/dashboard';
  if (data.roomName) {
    targetPath = `/dashboard/live-rooms/${data.roomName}`;
  } else if (data.type === 'CHAT_MESSAGE' && data.senderId) {
    targetPath = `/dashboard/social/chats/direct/${data.senderId}`;
  } else if (data.type === 'GROUP_MESSAGE' && data.groupId) {
    targetPath = `/dashboard/social/chats/group/${data.groupId}`;
  } else if (data.clickAction && data.clickAction !== '/dashboard') {
    targetPath = data.clickAction;
  } else if (data.click_action && data.click_action !== '/dashboard') {
    targetPath = data.click_action;
  } else if (data.targetUrl) {
    targetPath = data.targetUrl;
  } else if (data.url) {
    targetPath = data.url;
  } else if (data.path) {
    targetPath = data.path;
  }
  
  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
    try {
      const u = new URL(targetPath);
      targetPath = u.pathname + u.search + u.hash;
    } catch (_) {}
  }

  const targetUrl = self.location.origin + (targetPath.startsWith('/') ? targetPath : '/' + targetPath);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, notify the client app to navigate internally and focus
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            client.postMessage({
              type: 'LP_NOTIFICATION_CLICK',
              path: targetPath,
              data: data
            });
          } catch (_) {}

          if ('navigate' in client && client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new tab at the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
