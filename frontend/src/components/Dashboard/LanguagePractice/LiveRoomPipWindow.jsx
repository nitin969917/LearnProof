import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRoomPipStore } from '../../../store/liveRoomPipStore';
import { X, Maximize2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialSocket } from '../../../utils/socialSocket';
import {
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
  
  const savedMic = localStorage.getItem(`livekit_mic_${pipRoom.roomName}`);
  const [isMuted, setIsMuted] = useState(savedMic === 'disabled');

  const savedCam = localStorage.getItem(`livekit_cam_${pipRoom.roomName}`);
  const [isCamOff, setIsCamOff] = useState(savedCam !== 'enabled');

  const [beautyFilter] = useState(() => {
    return localStorage.getItem('livekit_beauty_filter') || 'none';
  });

  // Sync mic state with LocalParticipant
  useEffect(() => {
    if (localParticipant) {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
    }
  }, [localParticipant, localParticipant?.isMicrophoneEnabled]);

  // Sync camera state with LocalParticipant
  useEffect(() => {
    if (localParticipant) {
      setIsCamOff(!localParticipant.isCameraEnabled);
    }
  }, [localParticipant, localParticipant?.isCameraEnabled]);

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      const targetState = !localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(targetState);
      setIsMuted(!targetState);
      localStorage.setItem(`livekit_mic_${pipRoom.roomName}`, targetState ? 'enabled' : 'disabled');
    } catch (err) {
      console.error('Failed to toggle mic in PiP:', err);
    }
  };

  const toggleCam = async () => {
    if (!localParticipant) return;
    try {
      const targetState = !localParticipant.isCameraEnabled;
      await localParticipant.setCameraEnabled(targetState);
      setIsCamOff(!targetState);
      localStorage.setItem(`livekit_cam_${pipRoom.roomName}`, targetState ? 'enabled' : 'disabled');
    } catch (err) {
      console.error('Failed to toggle camera in PiP:', err);
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

  // Fetch all camera tracks (both local and remote)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false }
    ]
  );

  // Find active speaker's video track reference
  const activeSpeakerTrackRef = activeSpeaker 
    ? tracks.find(t => t.participant?.identity === activeSpeaker.identity)
    : null;

  const isVideoAvailable = activeSpeakerTrackRef && (
    activeSpeaker.identity === localParticipant?.identity 
      ? localParticipant?.isCameraEnabled 
      : activeSpeakerTrackRef.publication?.isSubscribed
  );

  return (
    <div className="w-full h-full flex flex-col justify-between text-white select-none relative">
      {/* Dynamic style block for beauty filter */}
      <style>{`
        .local-pip-video video {
          filter: ${getFilterCss(beautyFilter)} !important;
        }
      `}</style>

      {/* Video Background (if video is available) */}
      {pipRoom.dbRoom?.mediaType === 'video' && isVideoAvailable && (
        <div 
          onClick={onMaximize}
          className="absolute inset-0 z-0 bg-black cursor-pointer"
          title="Click to return to meeting"
        >
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
        <div 
          onClick={onMaximize}
          className="min-w-0 flex-1 pr-2 cursor-pointer"
          title="Click to return to meeting"
        >
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
      <div 
        onClick={onMaximize}
        className="flex-1 flex flex-col items-center justify-center p-3 z-10 text-center cursor-pointer"
        title="Click to return to meeting"
      >
        {!isVideoAvailable && (
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
        <div className="p-2 z-10 flex justify-center gap-2 bg-gradient-to-t from-black/85 to-transparent shrink-0">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-black tracking-wider uppercase transition active:scale-95 cursor-pointer ${
              isMuted 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            {isMuted ? <MicOff size={10} /> : <Mic size={10} />}
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {pipRoom.dbRoom?.mediaType === 'video' && (
            <button
              onClick={toggleCam}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-black tracking-wider uppercase transition active:scale-95 cursor-pointer ${
                isCamOff 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isCamOff ? <VideoOff size={10} /> : <Video size={10} />}
              <span>{isCamOff ? 'Cam Off' : 'Cam On'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LiveRoomPipWindow() {
  const navigate = useNavigate();
  const { activeRoom, clearActiveRoom, setShowPip, showPip } = useLiveRoomPipStore();
  const isDraggingRef = React.useRef(false);

  const syncChatHistory = useLiveRoomPipStore(state => state.syncChatHistory);

  useEffect(() => {
    if (!activeRoom || !activeRoom.roomName || !showPip) return;
    const socket = getSocialSocket(activeRoom.userIdentity || 'anonymous');
    if (!socket) return;

    // Ensure socket is joined to live room channel while in PiP
    socket.emit('joinLiveRoom', { roomName: activeRoom.roomName });

    const handleChatInPip = (chatItem) => {
      if (!chatItem) return;
      if (typeof syncChatHistory === 'function') {
        syncChatHistory([chatItem]);
      }
      const senderIdent = String(chatItem.senderId || chatItem.from?.identity || '');
      const isFromSelf = senderIdent && senderIdent === String(activeRoom.userIdentity);

      if (!isFromSelf) {
        const senderName = chatItem.senderName || chatItem.from?.name || 'User';
        const senderPic = chatItem.profilePicture || chatItem.from?.profilePicture || null;
        const displayContent = chatItem.text || 'Sent a message';

        toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              setShowPip(false);
              navigate(`/dashboard/live-rooms/${activeRoom.roomName}`);
            }}
            className={`${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
            } transition-all duration-200 max-w-sm w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border border-orange-200/80 dark:border-gray-700/80 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/50 active:scale-98 z-50`}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="relative shrink-0">
              {senderPic ? (
                <img src={senderPic} alt={senderName} className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5100] to-orange-400 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  {senderName ? senderName[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                  {senderName}
                </p>
                <span className="text-[10px] text-[#FF5100] font-black uppercase tracking-wider">
                  now
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium mt-0.5">
                {displayContent}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ), {
          id: `live_chat_pip_${chatItem.id || Date.now()}`,
          duration: 4000,
          position: 'top-center'
        });
      }
    };

    socket.on('liveRoomChatReceived', handleChatInPip);
    return () => {
      socket.off('liveRoomChatReceived', handleChatInPip);
    };
  }, [activeRoom?.roomName, activeRoom?.userIdentity, showPip, navigate, syncChatHistory]);

  if (!activeRoom || !showPip) return null;

  const handleMaximize = () => {
    if (isDraggingRef.current) return;
    setShowPip(false);
    navigate(`/dashboard/live-rooms/${activeRoom.roomName}`);
  };

  const handleClose = async () => {
    setShowPip(false);
    clearActiveRoom();
    try {
      const isHost = activeRoom.dbRoom && activeRoom.userIdentity && activeRoom.dbRoom.creatorId?.toString() === activeRoom.userIdentity;
      if (isHost) {
        // If host, end the room completely for everyone
        await Promise.allSettled([
          socialApi.delete(`/language-rooms/by-name/${activeRoom.roomName}`),
          socialApi.delete(`/livekit/rooms/${activeRoom.roomName}`),
        ]);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 150); }}
      className="fixed bottom-24 right-3 sm:right-4 lg:bottom-6 lg:right-6 z-[9999] w-[180px] h-[290px] bg-gray-950 border border-white/10 dark:border-white/5 rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 cursor-move touch-none"
    >
      <PipContent 
        pipRoom={activeRoom} 
        onMaximize={handleMaximize} 
        onClose={handleClose} 
      />
    </motion.div>
  );
}
