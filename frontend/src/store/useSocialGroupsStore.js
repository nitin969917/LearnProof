import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

const STORAGE_KEY = 'learnproof_cached_social_groups';

// Read persistent cache synchronously so initial state is immediately available (0ms delay)
const getInitialGroups = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveGroupsToStorage = (groups) => {
  if (typeof window === 'undefined') return;
  try {
    if (Array.isArray(groups)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups.slice(0, 50)));
    }
  } catch (e) {
    // Ignore storage quota limits
  }
};

let inFlightFetchGroups = null;

const initialCached = getInitialGroups();

export const useSocialGroupsStore = create((set, get) => ({
  groups: initialCached,
  loadingGroups: false,
  hasLoadedGroups: initialCached.length > 0,

  fetchGroups: async (force = false) => {
    const currentGroups = get().groups;
    const hasLoaded = get().hasLoadedGroups;

    // Show loading indicator only if we have NO cached groups or forced
    if (currentGroups.length === 0 && (!hasLoaded || force)) {
      set({ loadingGroups: true });
    }

    // Deduplicate in-flight requests
    if (inFlightFetchGroups && !force) {
      return inFlightFetchGroups;
    }

    inFlightFetchGroups = (async () => {
      try {
        const response = await socialApi.get('/groups');
        const freshGroups = Array.isArray(response.data) ? response.data : [];
        set({
          groups: freshGroups,
          loadingGroups: false,
          hasLoadedGroups: true,
        });
        saveGroupsToStorage(freshGroups);
        return freshGroups;
      } catch (err) {
        console.error('Failed to fetch groups', err);
        set({ loadingGroups: false, hasLoadedGroups: true });
        return get().groups;
      } finally {
        inFlightFetchGroups = null;
      }
    })();

    return inFlightFetchGroups;
  },

  updateGroupLocally: (updatedGroup) => {
    set(state => {
      const nextGroups = state.groups.map(g => g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g);
      saveGroupsToStorage(nextGroups);
      return { groups: nextGroups };
    });
  },

  addGroupLocally: (newGroup) => {
    set(state => {
      const nextGroups = [newGroup, ...state.groups];
      saveGroupsToStorage(nextGroups);
      return { groups: nextGroups };
    });
  },

  removeGroupLocally: (groupId) => {
    set(state => {
      const nextGroups = state.groups.filter(g => g.id !== groupId);
      saveGroupsToStorage(nextGroups);
      return { groups: nextGroups };
    });
  },

  setGroupJoined: (groupId, joined) => {
    set(state => {
      const nextGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, isJoined: joined, memberCount: joined ? g.memberCount + 1 : Math.max(0, g.memberCount - 1) } : g
      );
      saveGroupsToStorage(nextGroups);
      return { groups: nextGroups };
    });
  },
}));
