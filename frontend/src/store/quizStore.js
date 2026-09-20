import { create } from 'zustand';
import socialApi from '../api/socialApi.js';
import axios from 'axios';

export const useQuizStore = create((set, get) => ({
  playlists: [],
  history: [],
  loading: false,
  hasLoadedOnce: false,

  fetchQuizData: async (authToken, force = false) => {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem("google_token") : null);
    if (!token) return;
    
    const dataExists = get().playlists.length > 0 || get().history.length > 0;
    if (!dataExists || force) {
      set({ loading: true });
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';

      // 1. Fetch Playlist Quizzes (Uses Capacitor native adapter on iOS / Android)
      const fetchPlaylists = async () => {
        try {
          const res = await socialApi.post('/quiz-list/', { idToken: token });
          return res.data?.playlists || [];
        } catch (e1) {
          console.warn('socialApi.post /quiz-list/ fallback to direct axios:', e1);
          const res = await axios.post(`${backendUrl}/api/quiz-list/`, { idToken: token }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return res.data?.playlists || [];
        }
      };

      // 2. Fetch Quiz History (Tries POST first to prevent iOS URL length / query param encoding issues, falls back to GET with cache buster)
      const fetchHistory = async () => {
        try {
          // Preferred: POST avoids iOS WKWebView query length limits and URL encoding bugs
          const res = await socialApi.post('/quiz-history/', { idToken: token });
          return (res.data || []).filter(q => q && q.score !== null);
        } catch (e1) {
          try {
            // Fallback A: socialApi GET with timestamp cache-buster for iOS WebKit
            const res = await socialApi.get('/quiz-history/', {
              params: { idToken: token, token: token, _t: Date.now() }
            });
            return (res.data || []).filter(q => q && q.score !== null);
          } catch (e2) {
            console.warn('socialApi /quiz-history/ fallback to direct axios:', e2);
            // Fallback B: direct axios GET with safe encodeURIComponent
            const safeToken = encodeURIComponent(token);
            const res = await axios.get(`${backendUrl}/api/quiz-history/?idToken=${safeToken}&_t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return (res.data || []).filter(q => q && q.score !== null);
          }
        }
      };

      // Use allSettled so one failure NEVER blocks the other from loading
      const [playlistResult, historyResult] = await Promise.allSettled([
        fetchPlaylists(),
        fetchHistory()
      ]);

      const newPlaylists = playlistResult.status === 'fulfilled' ? playlistResult.value : get().playlists;
      const newHistory = historyResult.status === 'fulfilled' ? historyResult.value : get().history;

      set({
        playlists: newPlaylists,
        history: newHistory,
        loading: false,
        hasLoadedOnce: true
      });
    } catch (err) {
      console.error('Failed to fetch quiz data', err);
      set({ loading: false });
    }
  },

  addAttempt: (attempt) => {
    set((state) => ({
      history: [attempt, ...state.history.filter(h => h.id !== attempt.id)]
    }));
  },

  deleteAttempt: (attemptId) => {
    set((state) => ({
      history: state.history.filter(h => h.id !== attemptId)
    }));
  },

  setPlaylists: (playlists) => {
    set({ playlists });
  }
}));
