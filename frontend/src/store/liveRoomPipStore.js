import { create } from 'zustand';

export const useLiveRoomPipStore = create((set) => ({
  activeRoom: null, // { roomName, token, serverUrl, dbRoom, userIdentity }
  showPip: false,   // whether to show the PiP floating window
  
  // Persisted state across remounts
  sessionSeconds: 0,
  systemEvents: [],
  chatHistory: [],

  setActiveRoom: (room) => set({ activeRoom: room }),
  clearActiveRoom: () => set({ 
    activeRoom: null, 
    showPip: false,
    sessionSeconds: 0,
    systemEvents: [],
    chatHistory: []
  }),
  setShowPip: (show) => set({ showPip: show }),
  
  // Setters for persisted state
  setSessionSeconds: (updater) => set((state) => ({ 
    sessionSeconds: typeof updater === 'function' ? updater(state.sessionSeconds) : updater 
  })),
  setSystemEvents: (updater) => set((state) => ({ 
    systemEvents: typeof updater === 'function' ? updater(state.systemEvents) : updater 
  })),
  syncChatHistory: (messages) => set((state) => {
    if (!messages || messages.length === 0) return state;
    const map = new Map(state.chatHistory.map(m => [m.id || m.timestamp, m]));
    messages.forEach(m => map.set(m.id || m.timestamp, m));
    return { 
      chatHistory: Array.from(map.values()).sort((a,b) => {
        const timeA = a.timestamp || (a.sentAt ? new Date(a.sentAt).getTime() : 0);
        const timeB = b.timestamp || (b.sentAt ? new Date(b.sentAt).getTime() : 0);
        return timeA - timeB;
      }) 
    };
  })
}));
