import { create } from 'zustand';
import socialApi from '../api/socialApi.js';
import { getSocialSocket } from '../utils/socialSocket.js';

const CACHE_STORAGE_KEY = 'lp_chat_conversations_v1';
const MAX_MESSAGES_PER_CHAT = 50;
const MAX_CHATS_IN_STORAGE = 30;

const loadInitialCache = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CACHE_STORAGE_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    return {};
  }
};

const saveCacheToStorage = (cache) => {
  try {
    if (typeof window === 'undefined') return;
    const trimmed = {};
    const keys = Object.keys(cache).slice(0, MAX_CHATS_IN_STORAGE);
    for (const key of keys) {
      trimmed[key] = (cache[key] || []).slice(-MAX_MESSAGES_PER_CHAT);
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Fail silently on storage quota or private browsing mode
  }
};

export const useSocialMessageStore = create((set, get) => ({
  totalUnreadCount: 0,
  unreadByContact: {},
  unreadByGroup: {},
  activeChatUserId: null,
  activeChatGroupId: null,
  conversationsCache: loadInitialCache(),

  getCachedMessages: (chatKey) => {
    if (!chatKey) return [];
    return get().conversationsCache[chatKey] || [];
  },

  setCachedMessages: (chatKey, messages) => {
    if (!chatKey || !Array.isArray(messages)) return;
    set((state) => {
      const nextCache = {
        ...state.conversationsCache,
        [chatKey]: messages.slice(-MAX_MESSAGES_PER_CHAT)
      };
      saveCacheToStorage(nextCache);
      return { conversationsCache: nextCache };
    });
  },

  appendCachedMessage: (chatKey, message) => {
    if (!chatKey || !message) return;
    set((state) => {
      const existing = state.conversationsCache[chatKey] || [];
      // Deduplicate by id if exists, or replace temporary message
      const msgIdStr = message.id ? String(message.id) : null;
      let nextList;
      if (msgIdStr && existing.some(m => String(m.id) === msgIdStr)) {
        nextList = existing.map(m => String(m.id) === msgIdStr ? { ...m, ...message } : m);
      } else {
        nextList = [...existing, message].slice(-MAX_MESSAGES_PER_CHAT);
      }
      const nextCache = {
        ...state.conversationsCache,
        [chatKey]: nextList
      };
      saveCacheToStorage(nextCache);
      return { conversationsCache: nextCache };
    });
  },

  updateCachedMessage: (chatKey, messageId, updates) => {
    if (!chatKey || !messageId) return;
    set((state) => {
      const existing = state.conversationsCache[chatKey] || [];
      const nextList = existing.map(m => String(m.id) === String(messageId) ? { ...m, ...updates } : m);
      const nextCache = {
        ...state.conversationsCache,
        [chatKey]: nextList
      };
      saveCacheToStorage(nextCache);
      return { conversationsCache: nextCache };
    });
  },

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

    if (groupIdStr) {
      get().clearGroupUnread(groupIdStr);
    }

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
      const byContact = response.data || {};
      const directTotal = Object.values(byContact).reduce((sum, val) => sum + val, 0);
      const groupTotal = Object.values(get().unreadByGroup || {}).reduce((sum, val) => sum + val, 0);
      set({ 
        totalUnreadCount: directTotal + groupTotal, 
        unreadByContact: byContact 
      });
    } catch (err) {
      console.error('Failed to fetch unread counts', err);
    }
  },

  incrementUnread: (senderId) => {
    if (!senderId) return;
    const senderIdStr = senderId.toString();
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
  },

  incrementGroupUnread: (groupId) => {
    if (!groupId) return;
    const groupIdStr = groupId.toString();
    set((state) => {
      const newByGroup = { ...state.unreadByGroup };
      newByGroup[groupIdStr] = (newByGroup[groupIdStr] || 0) + 1;
      return {
        totalUnreadCount: state.totalUnreadCount + 1,
        unreadByGroup: newByGroup
      };
    });
  },

  clearGroupUnread: (groupId) => {
    if (!groupId) return;
    const groupIdStr = groupId.toString();
    set((state) => {
      const groupUnread = state.unreadByGroup[groupIdStr] || state.unreadByGroup[groupId] || 0;
      if (groupUnread === 0) return state;

      const newByGroup = { ...state.unreadByGroup };
      delete newByGroup[groupIdStr];
      delete newByGroup[groupId];

      return {
        totalUnreadCount: Math.max(0, state.totalUnreadCount - groupUnread),
        unreadByGroup: newByGroup
      };
    });
  }
}));
