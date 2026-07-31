import { create } from 'zustand';
import { getSocialSocket } from '../utils/socialSocket.js';
import { useSocialFeedStore } from './socialFeedStore.js';

export const useSocialStatusStore = create((set, get) => ({
  onlineUserIds: [],
  initializedForUserId: null,
  
  initializeStatus: (userId) => {
    if (!userId) return;
    const userIdStr = userId.toString();

    const socket = getSocialSocket(userIdStr);

    if (get().initializedForUserId === userIdStr) {
      if (socket.connected) {
        socket.emit('join', userIdStr);
      }
      return;
    }

    // Remove any stale listeners before adding fresh ones
    socket.off('getOnlineUsers');
    socket.off('userStatus');
    socket.off('NEW_POST');
    
    socket.on('getOnlineUsers', (userIds) => {
      console.log('Received online users:', userIds);
      set({ onlineUserIds: Array.isArray(userIds) ? userIds.map(id => id.toString()) : [] });
    });
    
    socket.on('userStatus', ({ userId: updatedUserId, online }) => {
      console.log('User status update:', updatedUserId, online);
      if (!updatedUserId) return;
      const current = get().onlineUserIds;
      const idStr = updatedUserId.toString();
      if (online) {
        set({ onlineUserIds: [...new Set([...current, idStr])] });
      } else {
        set({ onlineUserIds: current.filter(id => id !== idStr) });
      }
    });

    socket.on('NEW_POST', (post) => {
      console.log('Real-time post received via socket:', post);
      useSocialFeedStore.getState().addPostLocally(post);
    });

    // Re-request the current online list
    socket.emit('join', userIdStr);

    set({ initializedForUserId: userIdStr });
  },
  
  isOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUserIds.some(id => id.toString() === userId.toString());
  }
}));
