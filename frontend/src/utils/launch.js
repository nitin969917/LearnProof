import axios from 'axios';
import { requestNotificationPermissionAndGetToken } from './fcm';
import { getApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';

/**
 * Helper to generate or retrieve a unique device ID (UUIDv4) stored in localStorage.
 */
const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('learnproof_device_id');
  if (!deviceId) {
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem('learnproof_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Safe logger for the first_open lifecycle event in Firebase Analytics.
 */
const logFirstOpen = async () => {
  const firstOpenLogged = localStorage.getItem('learnproof_first_open_logged');
  if (firstOpenLogged) return;

  try {
    const supported = await isSupported();
    if (supported) {
      const app = getApp();
      const analyticsInstance = getAnalytics(app);
      logEvent(analyticsInstance, 'first_open');
      localStorage.setItem('learnproof_first_open_logged', 'true');
      console.log('[Analytics] Firebase first_open event logged successfully.');
    } else {
      console.warn('[Analytics] Firebase Analytics is not supported in this environment.');
    }
  } catch (error) {
    console.error('[Analytics] Failed to log first_open event:', error);
  }
};

/**
 * Initializes app launch tasks: logging the launch, requesting push tokens,
 * and tracking the first_open lifecycle event.
 */
export const initializeLaunch = async () => {
  console.log('[Launch] Starting app launch initialization...');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const deviceId = getOrCreateDeviceId();

  // 1. Log anonymous app launch
  try {
    await axios.post(`${backendUrl}/api/v1/metrics/app-launch`, { deviceId });
    console.log('[Launch] App launch logged successfully with device ID:', deviceId);
  } catch (error) {
    console.error('[Launch] Failed to log app launch metric:', error.message);
  }

  // 2. Track first_open lifecycle event
  await logFirstOpen();

  // 3. Request Push Notification permission & token anonymously
  try {
    console.log('[Launch] Requesting push notification token...');
    await requestNotificationPermissionAndGetToken();
  } catch (error) {
    console.error('[Launch] Failed to request or register push notification token:', error.message);
  }
};
