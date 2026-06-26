import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

export const useSocialMessageStore = create((set, get) => ({
  totalUnreadCount: 0,
  unreadByContact: {},
  activeChatUserId: null,

  setActiveChatUser: (userId) => set({ activeChatUserId: userId }),

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
    console.log('Incrementing unread for:', senderId);
    set((state) => {
      const newByContact = { ...state.unreadByContact };
      newByContact[senderId] = (newByContact[senderId] || 0) + 1;
      return {
        totalUnreadCount: state.totalUnreadCount + 1,
        unreadByContact: newByContact
      };
    });
  },

  clearUnreadForContact: (contactId) => {
    set((state) => {
      const contactUnread = state.unreadByContact[contactId] || 0;
      if (contactUnread === 0) return state;
      
      const newByContact = { ...state.unreadByContact };
      delete newByContact[contactId];
      
      return {
        totalUnreadCount: Math.max(0, state.totalUnreadCount - contactUnread),
        unreadByContact: newByContact
      };
    });
  }
}));
