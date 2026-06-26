import { create } from 'zustand';
import axios from 'axios';

export const useQuizStore = create((set, get) => ({
  playlists: [],
  history: [],
  loading: false,
  hasLoadedOnce: false,

  fetchQuizData: async (authToken, force = false) => {
    if (!authToken) return;
    
    const dataExists = get().playlists.length > 0 || get().history.length > 0;
    if (!dataExists || force) {
      set({ loading: true });
    }

    try {
      const [quizListRes, historyRes] = await Promise.all([
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-list/`, { idToken: authToken }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-history/?idToken=${authToken}`)
      ]);

      set({
        playlists: quizListRes.data.playlists || [],
        history: (historyRes.data || []).filter(q => q.score !== null),
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
