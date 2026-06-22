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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || "LearnProof AI";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update",
    icon: '/LP_logo.png',
    badge: '/LP_logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click (focus tab or open new tab)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
