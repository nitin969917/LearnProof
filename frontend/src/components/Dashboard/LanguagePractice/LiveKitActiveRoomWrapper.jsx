import React from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { useLiveRoomPipStore } from '../../../store/liveRoomPipStore';
import LiveRoomPipWindow from './LiveRoomPipWindow';
import toast from 'react-hot-toast';

export default function LiveKitActiveRoomWrapper({ activeRoom, showPip, isExplicitlyLeft, children, modalElement }) {
  if (!activeRoom) return children;

  return (
    <LiveKitRoom
      serverUrl={activeRoom.serverUrl}
      token={activeRoom.token}
      connect={true}
      video={false}
      audio={false}
      onDisconnected={() => {
        const pip = useLiveRoomPipStore.getState();
        if (pip.isExplicitlyLeft) {
          pip.setShowPip(false);
          pip.clearSummaryModals();
          pip.clearActiveRoom();
          return;
        }
        const wasInPip = pip.showPip;
        if (wasInPip) {
          pip.setShowPip(false);
          toast('The host has concluded the live session. 👋', { id: 'pip-session-ended', icon: '👋', duration: 4500 });
        }
        if (!pip.hostSummaryData && !pip.participantEndedData) {
          const currentActive = pip.activeRoom;
          const isHost = currentActive?.dbRoom?.creatorId && String(currentActive.dbRoom.creatorId) === String(currentActive.userIdentity);
          if (!isHost && currentActive?.roomName) {
            pip.setParticipantEndedData({
              roomName: currentActive.roomName,
              message: "The host has ended this live practice session. Thank you for participating!",
              duration: pip.sessionSeconds || 0
            });
          }
        }
        pip.clearActiveRoom();
      }}
    >
      <RoomAudioRenderer />
      {children}
      {showPip && !isExplicitlyLeft && <LiveRoomPipWindow />}
      {modalElement}
    </LiveKitRoom>
  );
}
