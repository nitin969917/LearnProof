import { create } from 'zustand';

export const useLiveRoomPipStore = create((set) => ({
  pipRoom: null, // { roomName, token, serverUrl, dbRoom, userIdentity }

  setPipRoom: (room) => set({ pipRoom: room }),
  clearPipRoom: () => set({ pipRoom: null }),
}));
