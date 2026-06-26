import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRoomPipStore } from '../../../store/liveRoomPipStore';
import { X, Maximize2, Mic, MicOff } from 'lucide-react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  VideoTrack,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { motion } from 'framer-motion';
import socialApi from '../../../api/socialApi';

// ─── Filter CSS Helper ───────────────────────────────────────────────────────
const getFilterCss = (filterName) => {
  switch (filterName) {
    case 'smooth':
      return 'contrast(0.95) saturate(1.02) brightness(1.04) sepia(0.02) blur(0.3px)';
    case 'glow':
      return 'brightness(1.10) contrast(0.96) saturate(1.05) sepia(0.01) blur(0.2px)';
    case 'warm':
      return 'sepia(0.12) saturate(1.08) brightness(1.02) contrast(0.98)';
    case 'rosy':
      return 'brightness(1.08) contrast(0.95) saturate(1.06) hue-rotate(-6deg) sepia(0.03) blur(0.2px)';
    default:
      return 'none';
  }
};

function PipContent({ pipRoom, onMaximize, onClose }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [beautyFilter] = useState(() => {
    return localStorage.getItem('livekit_beauty_filter') || 'none';
  });


  // Sync mic state with LocalParticipant
  useEffect(() => {
    if (localParticipant) {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
    }
  }, [localParticipant, localParticipant?.isMicrophoneEnabled]);

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      const targetState = !localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(targetState);
      setIsMuted(!targetState);
    } catch (err) {
      console.error('Failed to toggle mic in PiP:', err);
    }
  };

  // Find stage speakers (host + anyone who can publish)
  const speakers = participants.filter(p => 
    p.permissions?.canPublish || p.identity === pipRoom.dbRoom?.creatorId?.toString()
  );

  // Find active speaker (excluding local unless they are the only one)
  const activeSpeaker = participants.find(p => p.isSpeaking && p.identity !== localParticipant?.identity) 
    || (localParticipant?.isSpeaking ? localParticipant : null)
    || speakers[0];

  // Fetch all camera tracks reactive to participants using useTracks hook
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false }
    ],
    { onlySubscribed: true }
  );

  // Find active speaker's video track reference
  const activeSpeakerTrackRef = activeSpeaker 
    ? tracks.find(t => t.participant?.identity === activeSpeaker.identity)
    : null;

  return (
    <div className="w-full h-full flex flex-col justify-between text-white select-none relative">
      {/* Dynamic style block for beauty filter */}
      <style>{`
        .local-pip-video video {
          filter: ${getFilterCss(beautyFilter)} !important;
        }
      `}</style>

      {/* Video Background (if video is available) */}
      {pipRoom.dbRoom?.mediaType === 'video' && activeSpeakerTrackRef?.publication?.isSubscribed && (
        <div className="absolute inset-0 z-0 bg-black pointer-events-none">
          <VideoTrack
            trackRef={activeSpeakerTrackRef}
            className={`w-full h-full object-cover ${activeSpeaker?.identity === localParticipant?.identity ? 'local-pip-video' : ''}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Subtle dark overlay for readability */}
          <div className="absolute inset-0 bg-black/35 z-0" />
        </div>
      )}

      {/* Header controls */}
      <div className="flex items-center justify-between p-2.5 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-orange-400 truncate leading-none mb-0.5">Live Room</p>
          <h4 className="text-xs font-bold truncate leading-none text-white/90">
            {pipRoom.dbRoom?.roomName?.replace(/-\d+$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onMaximize}
            title="Maximize Room"
            className="p-1.5 hover:bg-white/20 rounded-lg transition active:scale-95 cursor-pointer text-white"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={onClose}
            title="Leave Session"
            className="p-1.5 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition active:scale-95 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body: Speaker info (shows avatar / active speaker status) */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 z-10 text-center pointer-events-none">
        {(!activeSpeakerTrackRef || !activeSpeakerTrackRef.publication?.isSubscribed) && (
          <div className="relative">
            {/* Pulsing avatar border if speaking */}
            <div className={`w-12 h-12 rounded-full bg-orange-500/10 border-2 flex items-center justify-center transition-all ${
              activeSpeaker?.isSpeaking ? 'border-orange-500 scale-105 shadow-[0_0_12px_rgba(249,115,22,0.4)] animate-pulse' : 'border-white/20'
            }`}>
              <span className="text-sm font-black text-orange-400 uppercase">
                {activeSpeaker?.name?.slice(0, 2) || activeSpeaker?.identity?.slice(0, 2) || 'R'}
              </span>
            </div>
          </div>
        )}
        <p className="text-[11px] font-bold text-white/90 mt-1.5 truncate max-w-full drop-shadow">
          {activeSpeaker?.name || activeSpeaker?.identity || 'Connecting...'} 
          {activeSpeaker?.isSpeaking && <span className="text-[9px] text-orange-400 font-black ml-1 uppercase">Speaking</span>}
        </p>
      </div>

      {/* Footer controls */}
      {localParticipant?.permissions?.canPublish && (
        <div className="p-3 z-10 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider uppercase transition active:scale-95 cursor-pointer ${
              isMuted 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            {isMuted ? <MicOff size={10} /> : <Mic size={10} />}
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveRoomPipWindow() {
  const navigate = useNavigate();
  const { pipRoom, clearPipRoom } = useLiveRoomPipStore();

  useEffect(() => {
    if (!pipRoom) return;

    const isHost = pipRoom.dbRoom && pipRoom.userIdentity && pipRoom.dbRoom.creatorId?.toString() === pipRoom.userIdentity;
    if (!isHost) return;

    const handleUnload = () => {
      const token = localStorage.getItem('google_token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const roomName = pipRoom.roomName;
      
      // Delete database room record
      const dbUrl = `${backendUrl}/api/language-rooms/by-name/${roomName}`;
      fetch(dbUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        keepalive: true
      }).catch(() => {});

      // Delete LiveKit server room
      const lkUrl = `${backendUrl}/api/livekit/rooms/${roomName}`;
      fetch(lkUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        keepalive: true
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pipRoom]);

  if (!pipRoom) return null;

  const handleMaximize = () => {
    // Navigate back to the full room page
    navigate(`/dashboard/live-rooms/${pipRoom.roomName}`);
    clearPipRoom();
  };

  const handleClose = async () => {
    try {
      const isHost = pipRoom.dbRoom && pipRoom.userIdentity && pipRoom.dbRoom.creatorId?.toString() === pipRoom.userIdentity;
      if (isHost) {
        // If host, end the room completely for everyone
        await Promise.allSettled([
          socialApi.delete(`/language-rooms/by-name/${pipRoom.roomName}`),
          socialApi.delete(`/livekit/rooms/${pipRoom.roomName}`),
        ]);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
    clearPipRoom();
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[9999] w-56 h-48 bg-gray-950 border border-white/10 dark:border-white/5 rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 cursor-move touch-none"
    >
      <LiveKitRoom
        serverUrl={pipRoom.serverUrl}
        token={pipRoom.token}
        connect={true}
        video={pipRoom.dbRoom?.mediaType === 'video'}
        audio={true}
        onDisconnected={clearPipRoom}
        style={{ height: '100%' }}
        data-lk-theme="default"
      >
        <RoomAudioRenderer />
        <PipContent 
          pipRoom={pipRoom} 
          onMaximize={handleMaximize} 
          onClose={handleClose} 
        />
      </LiveKitRoom>
    </motion.div>
  );
}
