import { io } from 'socket.io-client';

let socket = null;
let currentSocketUserId = null;

export const getSocialSocket = (userId) => {
  if (userId) {
    currentSocketUserId = userId.toString();
  }

  if (!socket) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let backendUrl = isLocalhost
      ? `http://${window.location.hostname}:8000`
      : (import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.host}`);

    // Remove any trailing slash or /api suffix so Socket.io connects to root domain /socket.io
    backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('Social socket connected:', socket.id);
      // Re-join on reconnect to restore online status using the latest active user ID
      if (currentSocketUserId) {
        socket.emit('join', currentSocketUserId);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Social socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Social socket disconnected:', reason);
    });
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
