import { io } from 'socket.io-client';

let socket = null;
let currentSocketUserId = null;

export const getSocialSocket = (userId) => {
  if (userId) {
    currentSocketUserId = userId.toString();
  }

  if (!socket) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Use VITE_BACKEND_URL so WebSocket connects to the actual backend (api.learnproofai.com)
    // NOT to learnproofai.com (Cloudflare Pages) which doesn't support WebSocket proxying
    const backendUrl = isLocalhost
      ? `http://${window.location.hostname}:8000`
      : (import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.host}`);
    const socketUrl = backendUrl;

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
