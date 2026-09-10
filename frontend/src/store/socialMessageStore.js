import { create } from 'zustand';
import socialApi from '../api/socialApi.js';
import { getSocialSocket } from '../utils/socialSocket.js';

export const useSocialMessageStore = create((set, get) => ({
  totalUnreadCount: 0,
  unreadByContact: {},
  activeChatUserId: null,
  activeChatGroupId: null,

  setActiveChatUser: (userId) => {
    const userIdStr = userId ? userId.toString() : null;
    try {
      const socket = getSocialSocket();
      if (socket && socket.connected) {
        if (userIdStr) {
          socket.emit('chat:enter', { targetUserId: userIdStr });
        } else {
          socket.emit('chat:leave');
        }
      }
    } catch (_) {}

    set({ 
      activeChatUserId: userIdStr,
      activeChatGroupId: null 
    });
  },

  setActiveChatGroup: (groupId) => {
    const groupIdStr = groupId ? groupId.toString() : null;
    try {
      const socket = getSocialSocket();
      if (socket && socket.connected) {
        if (groupIdStr) {
          socket.emit('chat:enter', { groupId: groupIdStr });
        } else {
          socket.emit('chat:leave');
        }
      }
    } catch (_) {}

    set({ 
      activeChatGroupId: groupIdStr,
      activeChatUserId: null 
    });
  },

  clearActiveChat: () => {
    try {
      const socket = getSocialSocket();
      if (socket && socket.connected) {
        socket.emit('chat:leave');
      }
    } catch (_) {}

    set({ 
      activeChatUserId: null, 
      activeChatGroupId: null 
    });
  },

  isConversationActive: (senderId, groupId = null) => {
    const { activeChatUserId, activeChatGroupId } = get();
    if (groupId && activeChatGroupId) {
      return activeChatGroupId.toString() === groupId.toString();
    }
    if (senderId && activeChatUserId) {
      return activeChatUserId.toString() === senderId.toString();
    }
    return false;
  },

  fetchUnreadCounts: async () => {
    try {
      const response = await socialApi.get('/messages/unread-counts');
      console.log('Fetched unread counts:', response.data);
      const byContact = response.data || {};
      const total = Object.values(byContact).reduce((sum, val) => sum + val, 0);
      set({ 
        totalUnreadCount: total, 
        unreadByContact: byContact 
      });
    } catch (err) {
      console.error('Failed to fetch unread counts', err);
    }
  },

  incrementUnread: (senderId) => {
    if (!senderId) return;
    const senderIdStr = senderId.toString();
    console.log('Incrementing unread for:', senderIdStr);
    set((state) => {
      const newByContact = { ...state.unreadByContact };
      newByContact[senderIdStr] = (newByContact[senderIdStr] || 0) + 1;
      return {
        totalUnreadCount: state.totalUnreadCount + 1,
        unreadByContact: newByContact
      };
    });
  },

  clearUnreadForContact: (contactId) => {
    if (!contactId) return;
    const contactIdStr = contactId.toString();
    set((state) => {
      const contactUnread = state.unreadByContact[contactIdStr] || state.unreadByContact[contactId] || 0;
      if (contactUnread === 0) return state;
      
      const newByContact = { ...state.unreadByContact };
      delete newByContact[contactIdStr];
      delete newByContact[contactId];
      
      return {
        totalUnreadCount: Math.max(0, state.totalUnreadCount - contactUnread),
        unreadByContact: newByContact
      };
    });
  }
}));
