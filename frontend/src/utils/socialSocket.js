import { io } from 'socket.io-client';

let socket = null;

export const getSocialSocket = (userId) => {
  if (!socket) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocalhost 
      ? `http://${window.location.hostname}:8000` 
      : `${window.location.protocol}//${window.location.host}`;
    socket = io(socketUrl);
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
