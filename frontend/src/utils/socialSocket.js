import { io } from 'socket.io-client';

let socket = null;

export const getSocialSocket = (userId) => {
  if (!socket) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocalhost 
      ? `http://${window.location.hostname}:8000` 
      : `${window.location.protocol}//${window.location.host}`;

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Social socket connected:', socket.id);
      // Re-join on reconnect to restore online status
      if (userId) {
        socket.emit('join', userId.toString());
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Social socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Social socket disconnected:', reason);
    });
  }

  if (userId) {
    socket.emit('join', userId.toString());
  }

  return socket;
};

export const disconnectSocialSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
