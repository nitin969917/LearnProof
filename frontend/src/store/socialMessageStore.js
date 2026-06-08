import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

export const useSocialMessageStore = create((set, get) => ({
  totalUnreadCount: 0,
  unreadByContact: {},
  activeChatUserId: null,

  setActiveChatUser: (userId) => set({ activeChatUserId: userId }),

  fetchUnreadCounts: async () => {
    try {
      const response = await socialApi.get('/messages/unread/total');
      console.log('Fetched unread counts:', response.data);
      set({ 
        totalUnreadCount: response.data.total, 
        unreadByContact: response.data.byContact 
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
