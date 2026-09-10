import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

let socket = null;
let currentSocketUserId = null;

export const getSocialSocket = (userId) => {
  if (userId) {
    currentSocketUserId = userId.toString();
  }

  if (!socket) {
    const isNativePlatform = typeof window !== 'undefined' && (
      window.Capacitor?.isNativePlatform?.() ||
      Capacitor.isNativePlatform() ||
      navigator.userAgent.includes('LearnProofApp')
    );
    const isLocalhost = !isNativePlatform && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    let backendUrl = isLocalhost
      ? `http://${window.location.hostname}:8000`
      : (import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.host}`);

    // Remove any trailing slash or /api suffix so Socket.io connects to root domain /socket.io
    backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });

    socket.on('connect', () => {
      console.log('Social socket connected:', socket.id);
      if (currentSocketUserId) {
        socket.emit('join', currentSocketUserId);
        const isActive = typeof document !== 'undefined' && document.visibilityState === 'visible';
        socket.emit(isActive ? 'presence:foreground' : 'presence:background');

        // Re-sync active chat state on connect/reconnect
        try {
          import('../store/socialMessageStore.js').then(({ useSocialMessageStore }) => {
            const store = useSocialMessageStore.getState();
            if (store.activeChatUserId) {
              socket.emit('chat:enter', { targetUserId: store.activeChatUserId });
            } else if (store.activeChatGroupId) {
              socket.emit('chat:enter', { groupId: store.activeChatGroupId });
            }
          }).catch(() => {});
        } catch (_) {}
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Social socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Social socket disconnected:', reason);
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!socket || !socket.connected) return;
        if (document.visibilityState === 'visible') {
          socket.emit('presence:foreground');
        } else {
          socket.emit('presence:background');
        }
      });

      // Capacitor native lifecycle listener for mobile app minimize/restore
      (async () => {
        try {
          const { App } = await import('@capacitor/app');
          App.addListener('appStateChange', ({ isActive }) => {
            if (!socket || !socket.connected) return;
            socket.emit(isActive ? 'presence:foreground' : 'presence:background');
          });
        } catch (_) {}
      })();
    }
  }

  if (currentSocketUserId && socket.connected) {
    socket.emit('join', currentSocketUserId);
  }

  return socket;
};

export const disconnectSocialSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentSocketUserId = null;
  }
};
