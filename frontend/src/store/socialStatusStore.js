import { create } from 'zustand';
import { getSocialSocket } from '../utils/socialSocket.js';

export const useSocialStatusStore = create((set, get) => ({
  onlineUserIds: [],
  socket: null,
  
  initializeStatus: (userId) => {
    if (!userId) return;
    
    const currentSocket = get().socket;
    if (currentSocket) return;
    
    const socket = getSocialSocket(userId);
    
    socket.on('getOnlineUsers', (userIds) => {
      console.log('Received online users:', userIds);
      set({ onlineUserIds: userIds });
    });
    
    socket.on('userStatus', ({ userId: updatedUserId, online }) => {
      console.log('User status update:', updatedUserId, online);
      const current = get().onlineUserIds;
      if (online) {
        set({ onlineUserIds: [...new Set([...current, updatedUserId.toString()])] });
      } else {
        set({ onlineUserIds: current.filter(id => id.toString() !== updatedUserId.toString()) });
      }
    });
    
    set({ socket });
  },
  
  isOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUserIds.some(id => id.toString() === userId.toString());
  }
}));
