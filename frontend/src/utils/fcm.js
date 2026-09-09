import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import React from 'react';
import { useSocialMessageStore } from '../store/socialMessageStore';

/**
 * Utility to request user's notification permission, register service worker,
 * retrieve the FCM token, and save it to the backend server.
 */
export const saveNativeFcmToken = async (token) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const googleToken = localStorage.getItem('google_token');
  
  if (!googleToken) {
    console.warn("User is not logged in. Skipping native token sync with backend.");
    return;
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    await axios.post(`${backendUrl}/api/save-fcm-token`, {
      token,
      deviceType: 'twa',
      timezone
    }, {
      headers: {
        Authorization: `Bearer ${googleToken}`
      }
    });
    console.log("Native FCM Token synchronized with backend database successfully.");
  } catch (error) {
    console.error("Failed to synchronize native FCM token with backend:", error);
  }
};

export const saveAnonymousFcmToken = async (token) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    // Detect PWA or TWA display modes
    const isTWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true || 
                  document.referrer.includes('android-app://');

    await axios.post(`${backendUrl}/api/v1/devices/anonymous-token`, {
      token,
      deviceType: isTWA ? 'twa' : 'web',
      timezone
    });
    console.log("Anonymous FCM Token synchronized with backend database successfully.");
  } catch (error) {
    console.error("Failed to synchronize anonymous FCM token with backend:", error);
  }
};

export const requestNotificationPermissionAndGetToken = async () => {
  // Check if we are running in the native mobile app and have a native token
  const nativeToken = localStorage.getItem('native_fcm_token');
  if (nativeToken) {
    console.log("Found native FCM token in localStorage:", nativeToken);
    await saveNativeFcmToken(nativeToken);
    return nativeToken;
  }

  // Support check
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.warn("FCM Notifications are not supported in this browser environment.");
    return null;
  }

  // Ensure messaging instance is initialized
  if (!messaging) {
    console.warn("FCM Messaging client is not initialized.");
    return null;
  }

  try {
    // 1. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("Notification permission was not granted by user.");
      return null;
    }

    // 2. Fetch or register Service Worker
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Firebase Service Worker registered successfully:', registration);
    }

    // Wait for the Service Worker to be active
    await navigator.serviceWorker.ready;

    // 3. Generate token using VAPID key
    // Fallback key is a standard Web Push public key format (user will replace with their Firebase VAPID key)
    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BFGv5g3CqV8aTzS9Fv5d2zLwK_ZlI6jV917vT8Bv7nU1m7qW3KxL4v6N9kZ8vL3u7m2N8lO7bC4tS8vQ8eF2zLw'; 
    
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: VAPID_KEY
    });

    if (token) {
      console.log("Generated FCM Registration Token:", token);

      // Always save token anonymously
      await saveAnonymousFcmToken(token);

      // Save token to backend authenticated API if logged in
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const googleToken = localStorage.getItem('google_token');
      
      if (!googleToken) {
        console.warn("User is not logged in. Skipping authenticated token sync with backend.");
        return token;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      // Detect PWA or TWA display modes
      const isTWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true || 
                    document.referrer.includes('android-app://');

      await axios.post(`${backendUrl}/api/save-fcm-token`, {
        token,
        deviceType: isTWA ? 'twa' : 'web',
        timezone
      }, {
        headers: {
          Authorization: `Bearer ${googleToken}`
        }
      });

      console.log("Authenticated FCM Token synchronized with backend database successfully.");
      return token;
    } else {
      console.warn("FCM getToken resolved to null.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred during FCM token registration flow:", error);
    return null;
  }
};

export const resolveNotificationPath = (data) => {
  if (!data) return '/dashboard';
  if (data.roomName) {
    return `/dashboard/live-rooms/${data.roomName}`;
  }
  if (data.type === 'CHAT_MESSAGE' && data.senderId) {
    return `/dashboard/social/chats/direct/${data.senderId}`;
  }
  if (data.type === 'GROUP_MESSAGE' && data.groupId) {
    return `/dashboard/social/chats/group/${data.groupId}`;
  }
  if (data.clickAction && data.clickAction !== '/dashboard') {
    return data.clickAction;
  }
  if (data.click_action && data.click_action !== '/dashboard') {
    return data.click_action;
  }
  if (data.targetUrl) return data.targetUrl;
  if (data.url) return data.url;
  return '/dashboard';
};

// Register foreground message handler to show in-app toasts when the tab is active/focused
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);
    if (payload.notification) {
      const data = payload.data || {};
      const targetPath = resolveNotificationPath(data);

      toast(() => {
        return React.createElement(
          'div', 
          { 
            className: "flex flex-col gap-1 text-left cursor-pointer hover:opacity-90 transition-opacity",
            onClick: () => {
              toast.dismiss();
              sessionStorage.setItem('pending_notification_route', targetPath);
              window.dispatchEvent(new CustomEvent('lp_navigate', { detail: targetPath }));
            }
          },
          React.createElement(
            'div', 
            { className: "font-extrabold text-orange-600 text-sm flex items-center gap-1.5" }, 
            payload.notification.title
          ),
          React.createElement(
            'div', 
            { className: "text-xs text-gray-600 dark:text-gray-300 font-bold leading-normal" }, 
            payload.notification.body
          )
        );
      }, {
        icon: '🔔',
        duration: 5000,
        position: 'top-right'
      });
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('nativeFcmTokenReady', async (e) => {
    const token = e.detail;
    console.log("Received nativeFcmTokenReady event:", token);
    if (token) {
      localStorage.setItem('native_fcm_token', token);
      await saveAnonymousFcmToken(token);
      await saveNativeFcmToken(token);
    }
  });

  // Capacitor Native Push Notifications Handler (Android & iOS)
  (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor && Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Immediately attach notification action listener to catch cold-start taps
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Capacitor] pushNotificationActionPerformed triggered:', action);
          const data = action.notification?.data || {};
          const targetPath = resolveNotificationPath(data);
          console.log('[Capacitor] Target path resolved:', targetPath);
          sessionStorage.setItem('pending_notification_route', targetPath);
          localStorage.setItem('pending_notification_route', targetPath);
          window.dispatchEvent(new CustomEvent('lp_navigate', { detail: targetPath }));
          window.dispatchEvent(new CustomEvent('lp_notification_click', { detail: data }));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received in foreground:', notification);
          if (notification.title) {
            const notifData = notification.data || {};
            const notifPath = resolveNotificationPath(notifData);
            toast(() => React.createElement('div', { 
              className: "font-semibold text-sm cursor-pointer",
              onClick: () => {
                toast.dismiss();
                sessionStorage.setItem('pending_notification_route', notifPath);
                window.dispatchEvent(new CustomEvent('lp_navigate', { detail: notifPath }));
              }
            },
              React.createElement('div', { className: "font-bold text-orange-600" }, notification.title),
              React.createElement('div', { className: "text-xs text-gray-500" }, notification.body)
            ), { icon: '🔔' });
          }
        });

        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive === 'granted') {
          if (Capacitor.getPlatform() === 'android') {
            try {
              await PushNotifications.createChannel({
                id: 'learnproof_notifications',
                name: 'LearnProof Notifications',
                description: 'Notifications for live rooms, chats, invitations, and reminders',
                importance: 5,
                visibility: 1,
                sound: 'default',
                vibration: true,
                lights: true,
                lightColor: '#F97316'
              });
              console.log('[Capacitor] Android notification channel "learnproof_notifications" created.');
            } catch (chanErr) {
              console.warn('[Capacitor] Error creating notification channel:', chanErr);
            }
          }
          await PushNotifications.register();
          
          PushNotifications.addListener('registration', async (token) => {
            console.log('Capacitor native FCM token registered:', token.value);
            localStorage.setItem('native_fcm_token', token.value);
            await saveAnonymousFcmToken(token.value);
            await saveNativeFcmToken(token.value);
          });
        }
      }
    } catch (e) {
      console.warn('Native Capacitor push initialization bypassed:', e);
    }
  })();
}


