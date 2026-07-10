import { create } from 'zustand';

export const useLiveRoomPipStore = create((set) => ({
  pipRoom: null, // { roomName, token, serverUrl, dbRoom, userIdentity }
  roomInstance: null, // Singleton Room connection object

  setPipRoom: (room) => set({ pipRoom: room }),
  clearPipRoom: () => set({ pipRoom: null }),
  setRoomInstance: (instance) => set({ roomInstance: instance }),
  clearRoomInstance: () => set({ roomInstance: null }),
}));
