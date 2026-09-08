import { create } from 'zustand';

const loadPersistedRoom = () => {
  try {
    const raw = sessionStorage.getItem('learnproof_active_pip_room');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const loadPersistedShowPip = () => {
  try {
    return sessionStorage.getItem('learnproof_show_pip') === 'true';
  } catch (e) {
    return false;
  }
};

export const useLiveRoomPipStore = create((set) => ({
  activeRoom: loadPersistedRoom(), // { roomName, token, serverUrl, dbRoom, userIdentity }
  showPip: loadPersistedShowPip(),   // whether to show the PiP floating window
  
  // Persisted state across remounts
  sessionSeconds: 0,
  systemEvents: [],
  chatHistory: [],

  setActiveRoom: (room) => {
    try {
      if (room) {
        sessionStorage.setItem('learnproof_active_pip_room', JSON.stringify(room));
      } else {
        sessionStorage.removeItem('learnproof_active_pip_room');
      }
    } catch (e) {}
    set({ activeRoom: room });
  },
  clearActiveRoom: () => {
    try {
      sessionStorage.removeItem('learnproof_active_pip_room');
      sessionStorage.removeItem('learnproof_show_pip');
    } catch (e) {}
    set({ 
      activeRoom: null, 
      showPip: false,
      sessionSeconds: 0,
      systemEvents: [],
      chatHistory: []
    });
  },
  setShowPip: (show) => {
    try {
      sessionStorage.setItem('learnproof_show_pip', show ? 'true' : 'false');
    } catch (e) {}
    set({ showPip: show });
  },
  
  // Setters for persisted state
  setSessionSeconds: (updater) => set((state) => ({ 
    sessionSeconds: typeof updater === 'function' ? updater(state.sessionSeconds) : updater 
  })),
  setSystemEvents: (updater) => set((state) => ({ 
    systemEvents: typeof updater === 'function' ? updater(state.systemEvents) : updater 
  })),
  syncChatHistory: (messages) => set((state) => {
    if (!messages || messages.length === 0) return state;
    const existing = [...state.chatHistory];

    messages.forEach((m) => {
      if (!m) return;
      const text = (m.text || m.message || '').trim();
      const senderId = String(
        (typeof m.from === 'object' ? (m.from?.identity || m.from?.senderId) : null) ||
        m.senderId ||
        (typeof m.from === 'string' ? m.from : '') ||
        ''
      );
      const time = m.timestamp || (m.sentAt ? new Date(m.sentAt).getTime() : Date.now());

      // Deduplicate by explicit ID, or by identical sender + text within 4 seconds
      const existingIdx = existing.findIndex((ex) => {
        if (m.id && ex.id && String(m.id) === String(ex.id)) return true;
        const exText = (ex.text || ex.message || '').trim();
        const exSender = String(
          (typeof ex.from === 'object' ? (ex.from?.identity || ex.from?.senderId) : null) ||
          ex.senderId ||
          (typeof ex.from === 'string' ? ex.from : '') ||
          ''
        );
        const exTime = ex.timestamp || (ex.sentAt ? new Date(ex.sentAt).getTime() : 0);
        return text && exText === text && senderId && exSender === senderId && Math.abs(exTime - time) < 4000;
      });

      if (existingIdx >= 0) {
        existing[existingIdx] = { ...existing[existingIdx], ...m };
      } else {
        existing.push(m);
      }
    });

    return {
      chatHistory: existing.sort((a, b) => {
        const timeA = a.timestamp || (a.sentAt ? new Date(a.sentAt).getTime() : 0);
        const timeB = b.timestamp || (b.sentAt ? new Date(b.sentAt).getTime() : 0);
        return timeA - timeB;
      })
    };
  })
}));
