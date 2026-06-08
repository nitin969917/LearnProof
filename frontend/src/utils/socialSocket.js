import { io } from 'socket.io-client';

let socket = null;

export const getSocialSocket = (userId) => {
  if (!socket) {
    const socketUrl = `http://${window.location.hostname}:8000`;
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
