import { create } from 'zustand';

export const useLiveRoomPipStore = create((set) => ({
  activeRoom: null, // { roomName, token, serverUrl, dbRoom, userIdentity }
  showPip: false,   // whether to show the PiP floating window

  setActiveRoom: (room) => set({ activeRoom: room }),
  clearActiveRoom: () => set({ activeRoom: null, showPip: false }),
  setShowPip: (show) => set({ showPip: show }),
}));
