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
  
  const iconUrl = self.location.origin + '/LP_M_logo.png';
  const notificationTitle = payload.notification?.title || "LearnProof AI";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update",
    icon: iconUrl,
    badge: iconUrl,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click (focus tab or open new tab)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetPath = '/dashboard';
  
  if (data.type === 'CHAT_MESSAGE' && data.senderId) {
    targetPath = `/dashboard/social?tab=chat&chatType=direct&chatId=${data.senderId}`;
  } else if (data.type === 'GROUP_MESSAGE' && data.groupId) {
    targetPath = `/dashboard/social?tab=chat&chatType=group&chatId=${data.groupId}`;
  } else if (data.type === 'LIVE_ROOM_CREATED' && data.roomName) {
    targetPath = `/dashboard/live-rooms/${data.roomName}`;
  }
  
  const targetUrl = self.location.origin + targetPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, navigate it to targetUrl and focus
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          client.navigate(targetUrl);
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
