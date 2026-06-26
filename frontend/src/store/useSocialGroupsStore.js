import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

export const useSocialGroupsStore = create((set, get) => ({
  groups: [],
  loadingGroups: false,
  hasLoadedGroups: false,

  fetchGroups: async (force = false) => {
    const hasLoaded = get().hasLoadedGroups;
    // Skip spinner if data already exists (cache-first)
    if (!hasLoaded || force) {
      set({ loadingGroups: true });
    }

    try {
      const response = await socialApi.get('/groups');
      set({
        groups: Array.isArray(response.data) ? response.data : [],
        loadingGroups: false,
        hasLoadedGroups: true,
      });
    } catch (err) {
      console.error('Failed to fetch groups', err);
      set({ loadingGroups: false });
    }
  },

  updateGroupLocally: (updatedGroup) => {
    set(state => ({
      groups: state.groups.map(g => g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g),
    }));
  },

  addGroupLocally: (newGroup) => {
    set(state => ({
      groups: [newGroup, ...state.groups],
    }));
  },

  removeGroupLocally: (groupId) => {
    set(state => ({
      groups: state.groups.filter(g => g.id !== groupId),
    }));
  },

  setGroupJoined: (groupId, joined) => {
    set(state => ({
      groups: state.groups.map(g =>
        g.id === groupId ? { ...g, isJoined: joined, memberCount: joined ? g.memberCount + 1 : Math.max(0, g.memberCount - 1) } : g
      ),
    }));
  },
}));
