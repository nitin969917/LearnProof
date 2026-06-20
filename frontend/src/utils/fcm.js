import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import React from 'react';

/**
 * Utility to request user's notification permission, register service worker,
 * retrieve the FCM token, and save it to the backend server.
 */
export const requestNotificationPermissionAndGetToken = async () => {
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

      // Save token to backend API
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const googleToken = localStorage.getItem('google_token');
      
      if (!googleToken) {
        console.warn("User is not logged in. Skipping token sync with backend.");
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

      console.log("FCM Token synchronized with backend database successfully.");
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

// Register foreground message handler to show in-app toasts when the tab is active/focused
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);
    if (payload.notification) {
      toast(() => {
        return React.createElement(
          'div', 
          { className: "flex flex-col gap-1 text-left" },
          React.createElement(
            'div', 
            { className: "font-extrabold text-orange-600 text-sm" }, 
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


