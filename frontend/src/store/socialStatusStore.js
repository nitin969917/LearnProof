import { create } from 'zustand';
import { getSocialSocket } from '../utils/socialSocket.js';

export const useSocialStatusStore = create((set, get) => ({
  onlineUserIds: [],
  initializedForUserId: null,
  
  initializeStatus: (userId) => {
    if (!userId) return;

    // Prevent duplicate initialization for the same user
    if (get().initializedForUserId === userId) return;
    
    const socket = getSocialSocket(userId);

    // Remove any stale listeners before adding fresh ones
    socket.off('getOnlineUsers');
    socket.off('userStatus');
    
    socket.on('getOnlineUsers', (userIds) => {
      console.log('Received online users:', userIds);
      set({ onlineUserIds: userIds.map(id => id.toString()) });
    });
    
    socket.on('userStatus', ({ userId: updatedUserId, online }) => {
      console.log('User status update:', updatedUserId, online);
      const current = get().onlineUserIds;
      const idStr = updatedUserId.toString();
      if (online) {
        set({ onlineUserIds: [...new Set([...current, idStr])] });
      } else {
        set({ onlineUserIds: current.filter(id => id !== idStr) });
      }
    });

    // Re-request the current online list in case we missed it
    socket.emit('join', userId.toString());

    set({ initializedForUserId: userId });
  },
  
  isOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUserIds.some(id => id.toString() === userId.toString());
  }
}));
