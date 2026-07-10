import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import toast from 'react-hot-toast';
import { useLiveRoomPipStore } from '../../../store/liveRoomPipStore';
import { motion, AnimatePresence } from 'framer-motion';

import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  useChat,
} from '@livekit/components-react';
import '@livekit/components-styles';

import {
  Mic, MicOff, Video, VideoOff,
  PhoneOff, Users, Globe,
  Volume2, Send, UserX, UserPlus, UserMinus,
  Check, X, Hand, LogOut, ChevronsDown, Settings, Languages, Sparkles, Camera
} from 'lucide-react';


import { Track, Room } from 'livekit-client';

// ─── Loading Spinner ────────────────────────────────────────────────────────
const RoomLoadingSpinner = () => (
  <div className="flex flex-col h-screen w-full bg-orange-50 dark:bg-gray-950 items-center justify-center gap-6">
    <div className="relative flex items-center justify-center">
      <div className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-orange-500/20"></div>
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent"></div>
    </div>
    <div className="flex flex-col items-center text-center gap-1">
      <span className="text-lg font-black uppercase tracking-widest text-orange-500 animate-pulse">Connecting</span>
      <span className="text-sm text-gray-500 dark:text-gray-400">Initializing secure practice room...</span>
    </div>
  </div>
);

// ─── Error Screen ────────────────────────────────────────────────────────────
const RoomError = ({ error, onBack }) => (
  <div className="flex flex-col h-screen w-full bg-orange-50 dark:bg-gray-950 items-center justify-center gap-6 px-4">
    <div className="p-4 bg-red-500/10 rounded-2xl">
      <Globe className="text-red-400" size={40} />
    </div>
    <div className="text-center">
      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Failed to connect</h2>
      <p className="text-gray-550 dark:text-gray-400 text-sm max-w-xs">{error || 'Could not join the room. Please try again.'}</p>
    </div>
    <button
      onClick={onBack}
      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all cursor-pointer"
    >
      Back to Live Rooms
    </button>
  </div>
);

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

// ─── Custom Inner Content (Has access to LiveKit context) ───────────────────
function CustomLanguageRoomContent({ roomName, handleLeaveRoom, user, dbRoom, userIdentity }) {

  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { send, chatMessages } = useChat();
  const navigate = useNavigate();
  // Keep a ref to navigate so data handler closure never goes stale
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Helper: back-navigate respecting where the user came from
  const navigateBack = useCallback(() => {
    const src = sessionStorage.getItem('nav_source');
    if (src === 'social') {
      navigateRef.current('/dashboard/social');
    } else {
      navigateRef.current('/dashboard/live-rooms');
    }
  }, []);

  // Mobile screen responsiveness tracking
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Session Time
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Role Permissions — use token identity for host check (available before LiveKit connects)
  const canPublish = localParticipant?.permissions?.canPublish ?? false;
  const isHost = dbRoom && userIdentity && String(dbRoom.creatorId) === String(userIdentity);
  const hostIdentity = dbRoom?.creatorId != null ? String(dbRoom.creatorId) : null;
  const isVideoRoom = dbRoom?.mediaType === 'video';

  const dbRoomRef = useRef(dbRoom);
  const userIdentityRef = useRef(userIdentity);
  const popStateTriggeredRef = useRef(false);
  const handlePopStateRef = useRef(null);
  useEffect(() => { dbRoomRef.current = dbRoom; }, [dbRoom]);
  useEffect(() => { userIdentityRef.current = userIdentity; }, [userIdentity]);

  const amIHost = useCallback(() => {
    const hostId = dbRoomRef.current?.creatorId;
    const myId = userIdentityRef.current;
    return hostId != null && myId != null && String(hostId) === String(myId);
  }, []);

  // Keep refs so the data channel handler closure never goes stale
  const canPublishRef = useRef(canPublish);
  useEffect(() => { canPublishRef.current = canPublish; }, [canPublish]);

  const [prevCanPublish, setPrevCanPublish] = useState(false);

  // Invitation Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviterName, setInviterName] = useState('');

  // Kick Confirmation Modal
  const [kickTarget, setKickTarget] = useState(null); // { identity, name }

  // End Session Confirmation Modal (host only)
  const [showEndRoomModal, setShowEndRoomModal] = useState(false);

  // Detect if user came from Social Hub (read once at mount — sessionStorage is set before navigation)
  const [fromSocial] = useState(() => sessionStorage.getItem('nav_source') === 'social');

  // Speaker Requests State (Host Only)
  const [speakRequests, setSpeakRequests] = useState([]);
  const [hasRequested, setHasRequested] = useState(false);
  // Ref to the promote function so the data handler can call it without stale closure
  const handlePromoteSpeakerRef = useRef(null);

  const addSpeakRequest = useCallback((identity, name) => {
    if (!identity) return;
    setSpeakRequests(prev => {
      if (prev.some(r => r.identity === identity)) return prev;
      toast(`🎤 ${name || 'Someone'} wants to speak!`, {
        duration: 6000,
        style: { background: '#f97316', color: '#fff', fontWeight: '700' },
      });
      return [...prev, { identity, name: name || 'User' }];
    });
    // Do NOT auto-open participants panel — host can open it manually
    // setShowParticipants(true); ← removed: was causing panel to pop open unexpectedly
  }, []);


  // Media states
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCamEnabled, setIsCamEnabled] = useState(false);

  // Settings & Beauty filter states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [beautyFilter, setBeautyFilter] = useState(() => {
    return localStorage.getItem('livekit_beauty_filter') || 'none';
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState('camera'); // 'camera' or 'filter'


  // Fetch devices when settings modal is opened
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter(d => d.kind === 'videoinput');
          setVideoDevices(videoDevs);
          
          if (room) {
            const activeId = room.getActiveDevice ? room.getActiveDevice('videoinput') : undefined;
            if (activeId) {
              setSelectedDevice(activeId);
            } else if (videoDevs.length > 0) {
              setSelectedDevice(videoDevs[0].deviceId);
            }
          }
        }
      } catch (err) {
        console.error('Error enumerating video devices:', err);
      }
    };

    if (showSettingsModal) {
      fetchDevices();
    }
  }, [showSettingsModal, room]);

  const handleDeviceChange = async (deviceId) => {
    if (!room) return;
    try {
      setSelectedDevice(deviceId);
      if (room.switchActiveDevice) {
        await room.switchActiveDevice('videoinput', deviceId);
        toast.success('Camera switched successfully!');
      } else {
        toast.error('Device switching not supported by the room context.');
      }
    } catch (err) {
      console.error('Failed to switch camera:', err);
      toast.error('Failed to switch camera. Make sure the device is not in use.');
    }
  };

  const handleSelectFilter = (filterName) => {
    setBeautyFilter(filterName);
    localStorage.setItem('livekit_beauty_filter', filterName);
  };


  // Participants panel
  const [showParticipants, setShowParticipants] = useState(false);
  const participantsPanelRef = useRef(null);

  // Unified Timeline for Chat + Entrance notices
  const [systemEvents, setSystemEvents] = useState([]);

  // States for Translation / Subtitles
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const recognitionRef = useRef(null);
  const subtitleTimeoutRef = useRef(null);

  // Chat refs and states
  const [chatInput, setChatInput] = useState('');
  const chatTimelineRef = useRef(null);
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  // Video tracks for video rooms
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Filter tracks to show only participants that are stage speakers (host or has publish permission)
  const stageTracks = tracks.filter(t => {
    const p = t.participant;
    if (!p) return false;
    const pCanPublish = p.permissions?.canPublish;
    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
    return pCanPublish || isCreator;
  });

  // ── Click-outside to close participants panel ──────────────────────────────
  useEffect(() => {
    if (!showParticipants) return;
    const handleClickOutside = (e) => {
      if (participantsPanelRef.current && !participantsPanelRef.current.contains(e.target)) {
        setShowParticipants(false);
      }
    };
    // Use a short timeout so the button click that opens it doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showParticipants]);

  // ── Restore state after reload ─────────────────────────────────────────────
  const hasInitializedState = useRef(false);

  useEffect(() => {
    if (localParticipant && !hasInitializedState.current) {
      const currentCanPublish = localParticipant.permissions?.canPublish ?? false;
      if (currentCanPublish) {
        const savedMic = localStorage.getItem(`livekit_mic_${roomName}`);
        const targetMic = savedMic !== 'disabled';
        localParticipant.setMicrophoneEnabled(targetMic).catch(() => {});
        setIsMicEnabled(targetMic);

        if (isVideoRoom) {
          const savedCam = localStorage.getItem(`livekit_cam_${roomName}`);
          const targetCam = savedCam === 'enabled';
          localParticipant.setCameraEnabled(targetCam).catch(() => {});
          setIsCamEnabled(targetCam);
        }
      }
      setPrevCanPublish(currentCanPublish);
      hasInitializedState.current = true;
    }
  }, [localParticipant, roomName, isVideoRoom]);

  // ── Sync permissions changes from server (promote/demote) ─────────────────
  useEffect(() => {
    if (!localParticipant) return;
    setIsMicEnabled(localParticipant.isMicrophoneEnabled);
    setIsCamEnabled(localParticipant.isCameraEnabled);

    const currentCanPublish = localParticipant.permissions?.canPublish ?? false;
    if (hasInitializedState.current && currentCanPublish !== prevCanPublish) {
      if (currentCanPublish) {
        setHasRequested(false);
        localParticipant.setMicrophoneEnabled(true).catch(() => {});
        setIsMicEnabled(true);
        localStorage.setItem(`livekit_stage_${roomName}`, 'speaker');
        localStorage.setItem(`livekit_mic_${roomName}`, 'enabled');
      } else {
        toast.error('You have been moved back to the audience.', { duration: 5000 });
        localParticipant.setMicrophoneEnabled(false).catch(() => {});
        localParticipant.setCameraEnabled(false).catch(() => {});
        setIsMicEnabled(false);
        setIsCamEnabled(false);
        localStorage.setItem(`livekit_stage_${roomName}`, 'listener');
        localStorage.removeItem(`livekit_mic_${roomName}`);
        localStorage.removeItem(`livekit_cam_${roomName}`);
      }
      setPrevCanPublish(currentCanPublish);
    }
  }, [
    localParticipant,
    localParticipant?.isMicrophoneEnabled,
    localParticipant?.isCameraEnabled,
    localParticipant?.permissions?.canPublish,
    prevCanPublish,
    roomName,
  ]);

  // ── Toggle mic ─────────────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (!localParticipant || !canPublish) return;
    try {
      const target = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(target);
      setIsMicEnabled(target);
      localStorage.setItem(`livekit_mic_${roomName}`, target ? 'enabled' : 'disabled');
    } catch (err) {
      console.error('Failed to toggle mic:', err);
      toast.error('Could not toggle microphone.');
    }
  };

  // ── Toggle cam (video rooms only) ──────────────────────────────────────────
  const toggleCam = async () => {
    if (!localParticipant || !canPublish || !isVideoRoom) return;
    try {
      const target = !isCamEnabled;
      await localParticipant.setCameraEnabled(target);
      setIsCamEnabled(target);
      localStorage.setItem(`livekit_cam_${roomName}`, target ? 'enabled' : 'disabled');
    } catch (err) {
      console.error('Failed to toggle cam:', err);
      toast.error('Could not access camera.');
    }
  };

  // ── System welcome + join notice ───────────────────────────────────────────
  useEffect(() => {
    setSystemEvents([
      {
        id: 'welcome-notice',
        time: new Date(),
        text: 'Welcome to the Live! Please be respectful to others, and avoid content related to violence, abuse, politics, discrimination, drugs, religion. Thank you for maintaining a safe and inclusive learning environment.'
      },
      {
        id: 'self-join',
        time: new Date(Date.now() + 50),
        text: 'You entered the room'
      }
    ]);
  }, []);

  // ── Participant joined notice ──────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    const handleConnected = (p) => {
      setSystemEvents(prev => [
        ...prev,
        {
          id: `join-${p.identity}-${Date.now()}`,
          time: new Date(),
          text: `🎉 ${p.name || 'A user'} entered the room`
        }
      ]);
    };
    room.on('participantConnected', handleConnected);
    return () => room.off('participantConnected', handleConnected);
  }, [room]);

  // ── Host disconnected auto-end room listener ──────────────────────────────
  useEffect(() => {
    if (!room || isHost) return;
    const handleDisconnected = (p) => {
      if (p.identity === hostIdentity) {
        toast.error('The host has left. This session has ended.', { duration: 5000 });
        localStorage.removeItem(`livekit_stage_${roomName}`);
        localStorage.removeItem(`livekit_mic_${roomName}`);
        localStorage.removeItem(`livekit_cam_${roomName}`);
        navigateBack();
      }
    };
    room.on('participantDisconnected', handleDisconnected);
    return () => room.off('participantDisconnected', handleDisconnected);
  }, [room, hostIdentity, isHost, roomName, navigateBack]);

  // ── Host page unload cleanup ──────────────────────────────────────────────
  useEffect(() => {
    if (!isHost) return;
    const handleUnload = () => {
      const token = localStorage.getItem('google_token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
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
  }, [isHost, roomName]);

  // ── Browser back button blocker ───────────────────────────────────────────
  useEffect(() => {
    // Only block if user is the host
    if (!isHost) return;

    // Push an extra history entry so we can intercept back navigation
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e) => {
      popStateTriggeredRef.current = true;
      // Push state back to prevent leaving the active room URL
      window.history.pushState(null, '', window.location.href);
      // Show confirmation modal
      setShowEndRoomModal(true);
    };

    handlePopStateRef.current = handlePopState;
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isHost]);

  // ── Combine and sort chat messages + system events ─────────────────────────
  const timelineItems = [
    ...chatMessages.map(m => ({
      type: 'chat',
      id: m.id || m.sentAt?.getTime() || Date.now(),
      time: m.sentAt || new Date(),
      from: m.from,
      text: m.message
    })),
    ...systemEvents.map(s => ({
      type: 'system',
      id: s.id,
      time: s.time,
      text: s.text
    }))
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  // ── Auto scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatTimelineRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timelineItems]);

  // ── Leave/End room ─────────────────────────────────────────────────────────
  const handleLeaveClick = async () => {
    if (isHost) {
      // Show confirmation modal for hosts before ending the session for everyone
      setShowEndRoomModal(true);
      return;
    }
    // Non-hosts leave immediately without confirmation
    localStorage.removeItem(`livekit_stage_${roomName}`);
    localStorage.removeItem(`livekit_mic_${roomName}`);
    localStorage.removeItem(`livekit_cam_${roomName}`);
    await handleLeaveRoom();
  };

  // Called when host confirms ending the session
  const handleConfirmEndRoom = async () => {
    setShowEndRoomModal(false);

    if (handlePopStateRef.current) {
      window.removeEventListener('popstate', handlePopStateRef.current);
      if (popStateTriggeredRef.current) {
        // Go back once to clean up the extra state we pushed
        window.history.back();
      }
    }

    if (room) {
      try {
        await sendSignal({ type: 'room_ended' });
        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (err) {
        console.error('Failed to broadcast room_ended:', err);
      }
    }
    localStorage.removeItem(`livekit_stage_${roomName}`);
    localStorage.removeItem(`livekit_mic_${roomName}`);
    localStorage.removeItem(`livekit_cam_${roomName}`);
    await handleLeaveRoom();
  };

  const handleCancelEndRoom = () => {
    setShowEndRoomModal(false);
    popStateTriggeredRef.current = false;
  };

  // ─── Helper: send a data message to room participants ─────────────────────
  const sendSignal = async (payloadObj, destinationIdentities) => {
    if (!room?.localParticipant) {
      throw new Error('Room not connected');
    }
    const encoded = new TextEncoder().encode(JSON.stringify(payloadObj));
    const opts = { reliable: true };
    if (destinationIdentities && destinationIdentities.length > 0) {
      opts.destinationIdentities = destinationIdentities;
    }
    await room.localParticipant.publishData(encoded, opts);
  };

  // ── Request to Speak (Listener side) ──────────────────────────────────────
  const handleRequestToSpeak = async () => {
    if (hasRequested || !hostIdentity) return;
    try {
      const requestPayload = {
        type: 'request_to_speak',
        identity: localParticipant.identity,
        name: localParticipant.name || 'User',
      };

      // LiveKit data channel — deliver directly to host
      await sendSignal(requestPayload, [hostIdentity]);

      // Server fallback so host always receives the request
      await socialApi.post(`/livekit/rooms/${roomName}/stage-requests`);

      setHasRequested(true);
      toast.success('Stage request sent! Waiting for host approval...', { icon: '🎤' });
    } catch (err) {
      console.error('[Signal] Failed to send speak request:', err);
      toast.error('Failed to send speak request. Please try again.');
    }
  };

  const handleWithdrawRequest = async () => {
    if (!hasRequested) return;
    try {
      if (localParticipant?.identity) {
        // Send signal to host so they remove us from their list immediately
        if (hostIdentity) {
          await sendSignal({
            type: 'withdraw_stage_request',
            identity: localParticipant.identity,
          }, [hostIdentity]);
        }
        
        // Call backend API to delete the request
        await socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${localParticipant.identity}`);
      }
      setHasRequested(false);
      toast.success('Stage request withdrawn.', { icon: '🎤' });
    } catch (err) {
      console.error('[Signal] Failed to withdraw speak request:', err);
      toast.error('Failed to withdraw speak request. Please try again.');
    }
  };

  // ── Host: Invite listener to stage ────────────────────────────────────────
  const handleInviteToStage = async (identity, pName) => {
    try {
      // Send invitation signal to listener first. Do not promote yet!
      await sendSignal({
        type: 'invite_to_stage',
        targetIdentity: identity,
        hostName: localParticipant.name || 'Host'
      }, [identity]);
      toast.success(`Stage invitation sent to ${pName || 'user'}!`);
    } catch (err) {
      console.error('[Signal] Failed to invite to stage:', err);
      toast.error('Failed to send stage invitation.');
    }
  };

  // ── Listener: Accept host invite ───────────────────────────────────────────
  const handleAcceptInvite = async () => {
    setShowInviteModal(false);
    try {
      // Send confirmation signal back to host so they promote us
      await sendSignal({
        type: 'accept_invite_response',
        identity: localParticipant.identity,
        name: localParticipant.name || 'User'
      });
    } catch (err) {
      console.warn('[Signal] Accept notification failed:', err);
    }
  };

  // ── Listener: Decline host invite ─────────────────────────────────────────
  const handleDeclineInvite = async () => {
    setShowInviteModal(false);
    try {
      // Notify host that we declined
      await sendSignal({
        type: 'decline_invite_response',
        name: localParticipant.name || 'User'
      });
    } catch (err) {
      console.warn('[Signal] Decline notification failed:', err);
    }
  };

  // ── Host: Approve a speak request (from participants panel) ────────────────
  const handlePromoteSpeaker = async (identity, pName) => {
    try {
      await socialApi.post(`/livekit/rooms/${roomName}/participants/${identity}/promote`);
      setSpeakRequests(prev => prev.filter(r => r.identity !== identity));
      try {
        await socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${identity}`);
      } catch (_) {}
      toast.success(`${pName || 'User'} is now on stage!`, { icon: '🎤' });
      // Notify the promoted user via data channel
      try {
        await sendSignal({ type: 'you_were_promoted' }, [identity]);
      } catch (_) {}
    } catch (err) {
      console.error('[Promote]', err);
      toast.error(err.response?.data?.error || 'Failed to promote user.');
    }
  };

  // Keep ref up to date so the data handler closure can always call the latest version
  useEffect(() => {
    handlePromoteSpeakerRef.current = handlePromoteSpeaker;
  });

  // ── Host: Demote speaker ───────────────────────────────────────────────────
  const handleDemoteSpeaker = async (identity, pName) => {
    try {
      await socialApi.post(`/livekit/rooms/${roomName}/participants/${identity}/demote`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to demote user.');
    }
  };

  // ── Host: Kick participant ─────────────────────────────────────────────────
  const handleKickParticipant = async (identity, pName) => {
    // Show user-friendly modal instead of window.confirm
    setKickTarget({ identity, name: pName });
  };

  const confirmKick = async () => {
    if (!kickTarget) return;
    try {
      await socialApi.delete(`/livekit/rooms/${roomName}/participants/${kickTarget.identity}`);
      toast.success(`${kickTarget.name} has been removed from the session.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove participant');
    } finally {
      setKickTarget(null);
    }
  };

  // ── Self: Leave stage ─────────────────────────────────────────────────────
  const handleLeaveStage = async () => {
    if (!room || !localParticipant) return;
    try {
      await socialApi.post(`/livekit/rooms/${roomName}/participants/${localParticipant.identity}/demote`);
    } catch (err) {
      console.error('Failed to leave stage:', err);
      toast.error('Failed to leave stage.');
    }
  };

  // ── Data messages: requests, invites, room end, subtitles ─────────────────
  // We listen on BOTH the topic-based and topicless dataReceived events
  // for maximum LiveKit v2 compatibility.
  const localParticipantRef = useRef(localParticipant);
  useEffect(() => { localParticipantRef.current = localParticipant; }, [localParticipant]);

  // Host polls server for stage requests (reliable fallback)
  useEffect(() => {
    if (!isHost) return;

    const fetchStageRequests = async () => {
      try {
        const res = await socialApi.get(`/livekit/rooms/${roomName}/stage-requests`);
        const incoming = Array.isArray(res.data?.requests) ? res.data.requests : [];
        incoming.forEach((req) => addSpeakRequest(req.identity, req.name));
      } catch (err) {
        console.warn('[StageRequests] poll failed:', err);
      }
    };

    fetchStageRequests();
    const pollId = setInterval(fetchStageRequests, 3000);
    return () => clearInterval(pollId);
  }, [isHost, roomName, addSpeakRequest]);

  useEffect(() => {
    if (!room) return;

    const handleRemoteData = (payload) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        const currentLocalParticipant = localParticipantRef.current;

        if (data.type === 'request_to_speak') {
          if (amIHost()) {
            addSpeakRequest(data.identity, data.name);
          }
        } else if (data.type === 'withdraw_stage_request') {
          if (amIHost()) {
            setSpeakRequests(prev => prev.filter(r => r.identity !== data.identity));
          }
        } else if (data.type === 'invite_to_stage') {
          // The host already promoted us server-side. Show confirmation toast.
          if (currentLocalParticipant && data.targetIdentity === currentLocalParticipant.identity) {
            setInviterName(data.hostName);
            setShowInviteModal(true);
          }
        } else if (data.type === 'you_were_promoted') {
          // Triggered when host approves a speak request
          toast.success('You are now on stage! 🎤', { duration: 4000 });
          setHasRequested(false);
        } else if (data.type === 'accept_invite_response') {
          if (amIHost()) {
            toast(`${data.name || 'User'} accepted the stage invitation!`, { icon: '🎤' });
            if (handlePromoteSpeakerRef.current) {
              handlePromoteSpeakerRef.current(data.identity, data.name);
            }
          }
        } else if (data.type === 'decline_invite_response') {
          if (amIHost()) {
            toast.error(`${data.name || 'User'} declined the stage invitation.`);
          }
        } else if (data.type === 'room_ended') {
          toast.error('The host has ended this session.', { duration: 5000 });
          localStorage.removeItem(`livekit_stage_${roomName}`);
          localStorage.removeItem(`livekit_mic_${roomName}`);
          localStorage.removeItem(`livekit_cam_${roomName}`);
          navigateBack();
        } else if (data.type === 'subtitle') {
          setActiveSubtitle({ text: data.text, translation: data.translation, sender: data.sender });
          if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
          subtitleTimeoutRef.current = setTimeout(() => setActiveSubtitle(null), 5000);
        }
      } catch (e) {
        console.warn('[Signal] Failed to parse data message:', e);
      }
    };

    room.on('dataReceived', handleRemoteData);
    return () => {
      room.off('dataReceived', handleRemoteData);
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    };
  }, [room, roomName, amIHost, addSpeakRequest]);

  // ── Speech Transcription / Subtitles ───────────────────────────────────────
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech Recognition is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    const roomLang = dbRoom?.language || 'English';
    const langMap = {
      'hindi': 'hi-IN', 'marathi': 'mr-IN', 'gujarati': 'gu-IN',
      'tamil': 'ta-IN', 'telugu': 'te-IN', 'kannada': 'kn-IN',
      'bengali': 'bn-IN', 'punjabi': 'pa-IN', 'malayalam': 'ml-IN',
    };
    recognition.lang = langMap[roomLang.toLowerCase()] || 'en-US';

    recognition.onresult = async (event) => {
      const lastIndex = event.results.length - 1;
      const transcriptText = event.results[lastIndex][0].transcript.trim();
      if (!transcriptText) return;
      try {
        const targetLang = recognition.lang.startsWith('en') ? 'hi' : 'en';
        const response = await socialApi.post('/livekit/translate', { text: transcriptText, to: targetLang });
        const translation = response.data.translatedText;
        const subtitlePayload = { type: 'subtitle', text: transcriptText, translation, sender: localParticipant.name || 'User' };
        // Broadcast subtitle to all participants via sendSignal
        try {
          await sendSignal(subtitlePayload);
        } catch (signalErr) {
          console.warn('[Subtitle] broadcast failed:', signalErr);
        }
        setActiveSubtitle(subtitlePayload);
        if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
        subtitleTimeoutRef.current = setTimeout(() => setActiveSubtitle(null), 5000);
      } catch (err) {
        console.error('Translation error:', err);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission blocked for speech recognition.');
        setIsTranscribing(false);
      }
    };

    recognition.onend = () => {
      if (isTranscribing) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsTranscribing(true);
  };

  const stopSpeechRecognition = () => {
    setIsTranscribing(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  };

  const toggleTranslation = () => {
    if (isTranscribing) stopSpeechRecognition();
    else startSpeechRecognition();
  };

  // ── Profile navigation ─────────────────────────────────────────────────────
  const handleUserProfileClick = (userId) => {
    if (!userId) return;
    localStorage.setItem('social_selected_profile_id', userId);
    localStorage.setItem('social_active_tab', 'profile');
    navigate('/dashboard/social');
  };

  // ── Chat send ──────────────────────────────────────────────────────────────
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    send(chatInput);
    setChatInput('');
  };

  const handleQuickSend = (text) => send(text);

  // ── Deduplicate participants ────────────────────────────────────────────────
  const uniqueParticipants = [];
  const pSeen = new Set();
  if (localParticipant) {
    uniqueParticipants.push(localParticipant);
    pSeen.add(localParticipant.identity);
  }
  participants.forEach(p => {
    if (p && p.identity && !pSeen.has(p.identity)) {
      uniqueParticipants.push(p);
      pSeen.add(p.identity);
    }
  });

  // Stage speakers: host + participants with canPublish
  const stageSpeakers = uniqueParticipants.filter(p => {
    if (!p) return false;
    const pCanPublish = p.permissions?.canPublish;
    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
    return pCanPublish || isCreator;
  }).slice(0, 6);

  // Audience listeners
  const listeners = uniqueParticipants.filter(p => !stageSpeakers.some(s => s.identity === p.identity));

  const getGridClassName = (count) => {
    if (count <= 1) return 'grid-cols-1 h-full';
    if (count === 2) return 'grid-cols-2 grid-rows-1 h-full';
    if (count === 3) return 'grid-cols-2 grid-rows-2 h-full'; // host spans 2 rows
    if (count === 4) return 'grid-cols-2 grid-rows-2 h-full';
    return 'grid-cols-2 grid-rows-3 h-full'; // 5–6 people
  };

  // Returns 'row-span-2' for the host tile when 3 people (asymmetric layout)
  const getTileSpan = (index, total) => {
    if (total === 3 && index === 0) return 'row-span-2';
    return '';
  };

  const gradientColors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-teal-500 to-emerald-500',
    'from-amber-500 to-orange-500',
    'from-fuchsia-500 to-pink-600',
  ];

  const getGradient = (identity) => {
    const hash = identity ? identity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return gradientColors[hash % gradientColors.length];
  };

  const renderSpeakerTile = (p, spanClass = '') => {
    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
    const isMe = p.identity === localParticipant?.identity;
    const hasMic = p.isMicrophoneEnabled;
    const isSpeaking = p.isSpeaking;
    const gradient = getGradient(p.identity);
    // Truncate name: first 10 chars of first word
    const displayName = p.name ? (p.name.split(' ')[0].slice(0, 10) + (p.name.split(' ')[0].length > 10 ? '…' : '')) : 'User';

    return (
      <div
        key={p.identity}
        className={`${spanClass} relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border-2 transition-all flex flex-col items-center justify-center p-3 w-full h-full shadow-sm ${
          isSpeaking
            ? 'border-orange-500 shadow-lg shadow-orange-500/20'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >


        <div className="flex flex-col items-center justify-center gap-2 z-10 w-full">
          <div className="relative">
            {isSpeaking && (
              <span className="absolute -inset-1.5 rounded-full bg-orange-500/30 animate-ping"></span>
            )}
            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-md border border-white/10 uppercase`}>
              {p.name ? p.name[0] : 'U'}
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1 border border-white dark:border-gray-900 animate-bounce">
                <Volume2 size={10} />
              </span>
            )}
          </div>

          <div className="text-center w-full px-1">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span className="text-[11px] font-black text-gray-800 dark:text-white leading-tight">
                {displayName}
              </span>
              {isMe && <span className="text-[7px] bg-orange-500/10 dark:bg-white/20 text-orange-600 dark:text-white px-1 py-0.5 rounded uppercase tracking-wider shrink-0">You</span>}
            </div>
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 block mt-0.5">
              {isCreator ? '👑 Host' : 'Speaker'}
            </span>
          </div>
        </div>

        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <span className={`p-1 rounded-lg text-white shadow-sm ${
            hasMic ? 'bg-green-500/80 backdrop-blur-sm' : 'bg-red-500/80 backdrop-blur-sm'
          }`}>
            {hasMic ? <Mic size={9} /> : <MicOff size={9} />}
          </span>
        </div>
      </div>
    );
  };

  const isChatHidable = isMobile && stageSpeakers.length > 4;

  const renderChatPanel = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900 h-full relative">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-900/80">
          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Send size={10} className="text-orange-400" />
            </div>
            Live Chat
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500">{uniqueParticipants.length} in room</span>
            {isChatHidable && (
              <button
                onClick={() => setShowChatDrawer(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Close chat"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
          {timelineItems.map((item) => {
            if (item.type === 'system') {
              return (
                <div key={item.id} className="flex justify-center my-2">
                  <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center max-w-xs leading-relaxed">
                    {item.text}
                  </div>
                </div>
              );
            }
            const isMe = item.from?.identity === localParticipant?.identity;
            return (
              <div key={item.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                {!isMe && (
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getGradient(item.from?.identity || '')} flex items-center justify-center text-white font-black text-[10px] uppercase shrink-0 border border-white/10`}>
                    {item.from?.name?.[0] || 'U'}
                  </div>
                )}
                <div className={`flex flex-col gap-0.5 max-w-[200px] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide px-1">
                      {item.from?.name || 'User'}
                    </span>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-br-md shadow-orange-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-white/5'
                  }`}>
                    {item.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatTimelineRef} />
        </div>

        {/* Quick replies */}
        <div className="px-3 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50 hide-scrollbar">
          {["Hey! 👋", "What's the topic?", "I'm new here 😊"].map((text) => (
            <button
              key={text}
              onClick={() => handleQuickSend(text)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 text-[10px] font-bold rounded-full transition-all cursor-pointer shrink-0 active:scale-95"
            >
              {text}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900 shrink-0">
          <form onSubmit={handleSendChat} className="flex gap-2 mb-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-white/8 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
            />
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-2xl text-white transition cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-orange-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-white overflow-hidden relative">
      
      {/* Dynamic style block for beauty filter */}
      <style>{`
        div[data-lk-local-participant="true"] video {
          filter: ${getFilterCss(beautyFilter)} !important;
        }
      `}</style>


      {/* Stage Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/25">
              <Hand size={28} className="text-white animate-bounce" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">You're Invited to the Stage!</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              <span className="font-extrabold text-orange-500">{inviterName || 'The host'}</span> has invited you to speak. Your mic will be activated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineInvite}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvite}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition cursor-pointer active:scale-95"
              >
                🎤 Join Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Confirmation Modal */}
      {kickTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <UserX size={26} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">Remove Participant?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              <span className="font-extrabold text-gray-800 dark:text-white">{kickTarget.name}</span> will be removed from this session and cannot rejoin.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setKickTarget(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmKick}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-500/20 transition cursor-pointer active:scale-95"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── End Session Confirmation Modal (host only) ── */}
      {showEndRoomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <LogOut size={26} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">End Session?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              This will <span className="font-extrabold text-gray-800 dark:text-white">end the session for everyone</span> in the room. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelEndRoom}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndRoom}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-500/20 transition cursor-pointer active:scale-95"
              >
                End for All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl transition-all scale-100 flex flex-col gap-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Settings size={18} className="text-orange-500" />
                Room Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            {isVideoRoom && (
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <button
                  onClick={() => setActiveSettingsTab('camera')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    activeSettingsTab === 'camera'
                      ? 'bg-white dark:bg-gray-900 text-orange-500 shadow-sm'
                      : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Camera size={14} />
                  Switch Camera
                </button>
                <button
                  onClick={() => setActiveSettingsTab('filter')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    activeSettingsTab === 'filter'
                      ? 'bg-white dark:bg-gray-900 text-orange-500 shadow-sm'
                      : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={14} />
                  Beauty Filters
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] pr-1">
              {isVideoRoom ? (
                <>
                  {activeSettingsTab === 'camera' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Select Video Source
                      </label>
                      {canPublish ? (
                        videoDevices.length > 0 ? (
                          <select
                            value={selectedDevice}
                            onChange={(e) => handleDeviceChange(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/8 text-gray-900 dark:text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-bold"
                          >
                            {videoDevices.map((dev) => (
                              <option key={dev.deviceId} value={dev.deviceId}>
                                {dev.label || `Camera ${dev.deviceId.slice(0, 5)}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-gray-550 dark:text-gray-400 italic">No camera devices found or permission not granted.</p>
                        )
                      ) : (
                        <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-450 font-bold">
                            Camera switching is only available when you are speaking on stage.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSettingsTab === 'filter' && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-col">
                        <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Skin Tone & Smoothing Filter
                        </label>
                        <span className="text-[10px] text-gray-500 dark:text-gray-450 mt-0.5 font-bold leading-normal">
                          Choose a visual style to improve skin tone and smoothing in real-time.
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {[
                          { id: 'none', label: 'Natural', desc: 'Original camera' },
                          { id: 'smooth', label: 'Soft Smooth', desc: 'Skin smoothing' },
                          { id: 'glow', label: 'Radiant Glow', desc: 'Brighter tone' },
                          { id: 'warm', label: 'Warm Sun', desc: 'Warm amber hue' },
                          { id: 'rosy', label: 'Pink Blossom', desc: 'Rosy brightness' },
                        ].map((f) => {
                          const isActive = beautyFilter === f.id;
                          return (
                            <button
                              key={f.id}
                              onClick={() => handleSelectFilter(f.id)}
                              className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${
                                isActive
                                  ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm'
                                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-orange-500/30'
                              }`}
                            >
                              <span className="text-xs font-black">{f.label}</span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none font-bold">
                                {f.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-550 dark:text-gray-400">Camera and skin filters are only available in video rooms.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-gray-150 dark:border-gray-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Header Bar ── */}

      {/* Brand section changes based on nav_source (fromSocial state set at mount) */}
      <div className="flex items-center justify-between px-4 sm:px-5 h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shrink-0 z-30">

        {/* Left: Brand + Separator + Room Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo — same position in both Social Hub and Main App headers */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/LP_M_logo.png" alt="LearnProof" className="w-8 h-8 object-contain shrink-0" />
            {fromSocial ? (
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">Social Hub</span>
                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none mt-0.5">Live Room</span>
              </div>
            ) : (
              <span className="text-xs font-black text-orange-500 uppercase tracking-widest hidden sm:block">LearnProof</span>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 shrink-0" />

          {/* Room name + live dot */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/60 shrink-0" />
            <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide truncate max-w-[110px] sm:max-w-xs">
              {roomName.replace(/-\d+$/, '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h1>
            {dbRoom?.language && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {dbRoom.language}
              </span>
            )}
          </div>
        </div>

        {/* Center: Session Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">{formatTime(sessionSeconds)}</span>
        </div>

        {/* Right: Leave / End button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLeaveClick}
            className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl font-black shadow-lg transition-all active:scale-95 cursor-pointer ${
              isHost
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 border-none'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/30'
            }`}
            title={isHost ? 'End Session for all' : 'Leave Room'}
          >
            <LogOut size={16} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 leading-none">
              {isHost ? 'End' : 'Leave'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* ══ LEFT: Stage Area ══ */}
        <div className={`${
          isChatHidable ? 'h-full flex-1' : 'h-[48vh] lg:h-full lg:flex-1'
        } shrink-0 relative overflow-hidden bg-orange-50 dark:bg-gray-950`}>

          {/* Ambient gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Subtitles Overlay */}
          {activeSubtitle && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-sm w-full px-4">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-orange-200 dark:border-orange-500/30 p-4 rounded-2xl shadow-2xl shadow-orange-500/10 flex flex-col gap-1.5 items-center text-center">
                <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1">
                  <Volume2 size={9} />
                  {activeSubtitle.sender}
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-white italic">"{activeSubtitle.text}"</p>
                <div className="flex items-center gap-2 w-full justify-center">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                  <Languages size={10} className="text-orange-500 dark:text-orange-400" />
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                </div>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{activeSubtitle.translation}</p>
              </div>
            </div>
          )}

          {isVideoRoom ? (
            // Video room: show camera when active, fallback to same card as audio room
            <div className="w-full h-full p-2 bg-orange-50 dark:bg-gray-950 overflow-hidden">
              <div className={`grid ${getGridClassName(stageSpeakers.length)} w-full h-full gap-2`}>
                {stageSpeakers.map((p, i) => {
                  // Check if this participant has their camera on
                  const camTrack = tracks.find(t =>
                    t.participant?.identity === p.identity && t.source === Track.Source.Camera && t.participant?.isCameraEnabled
                  );
                  return (
                    <div
                      key={p.identity}
                      className={`${getTileSpan(i, stageSpeakers.length)} h-full`}
                    >
                      {camTrack ? (
                        <ParticipantTile
                          trackRef={camTrack}
                          className="rounded-2xl overflow-hidden shadow-2xl w-full h-full"
                        />
                      ) : (
                        renderSpeakerTile(p, 'h-full')
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col p-4 gap-4 overflow-y-auto">

              {/* Stage Label */}
              <div className="flex items-center gap-2 shrink-0 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">On Stage</span>
                  <span className="text-[10px] font-bold text-orange-500/70 dark:text-orange-400/60">· {stageSpeakers.length}/6</span>
                </div>
              </div>

              {/* Speaker Tiles */}
              <div className="flex-1 min-h-0">
                <div className={`grid ${getGridClassName(stageSpeakers.length)} w-full h-full gap-3`}>
                  {stageSpeakers.map((p, i) =>
                    renderSpeakerTile(p, getTileSpan(i, stageSpeakers.length))
                  )}
                </div>
              </div>

              {/* Audience Strip */}
              {listeners.length > 0 && (
                <div className="shrink-0 border-t border-gray-200 dark:border-white/5 pt-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                    Listening · {listeners.length}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {listeners.map((p) => (
                      <div
                        key={p.identity}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getGradient(p.identity)} flex items-center justify-center text-white font-black text-xs uppercase shadow-sm border border-white/10 group-hover:scale-105 transition-all`}>
                          {p.name ? p.name[0] : 'U'}
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 truncate max-w-[40px] text-center">{p.name?.split(' ')[0] || 'User'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ RIGHT: Chat Panel (only if NOT hidable) ══ */}
        {!isChatHidable && (
          <div className="flex-1 lg:w-[340px] lg:max-w-[380px] lg:shrink-0 flex flex-col overflow-hidden bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/5 relative">
            {renderChatPanel()}
          </div>
        )}
      </div>

      {/* ── Bottom Controls Bar ── */}
      <div className="border-t border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900 px-4 py-3.5 shrink-0 flex items-center justify-between z-30">
        {/* Left: Media Controls */}
        <div className="flex items-center gap-1.5">
          {canPublish ? (
            <>
              <button
                onClick={toggleMic}
                title={isMicEnabled ? 'Mute' : 'Unmute'}
                className={`p-3 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  isMicEnabled
                    ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/40'
                }`}
              >
                {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              {isVideoRoom && (
                <button
                  onClick={toggleCam}
                  title={isCamEnabled ? 'Camera Off' : 'Camera On'}
                  className={`p-3 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                    isCamEnabled
                      ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/40'
                  }`}
                >
                  {isCamEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              )}

              {!isHost && (
                <button
                  onClick={handleLeaveStage}
                  title="Step down from stage"
                  className="p-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <ChevronsDown size={20} />
                </button>
              )}
            </>
          ) : (
            /* Listener: Request / Withdraw stage button */
            <button
              onClick={hasRequested ? handleWithdrawRequest : handleRequestToSpeak}
              title={hasRequested ? 'Withdraw Stage Request' : 'Request to Speak'}
              className={`p-3 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                hasRequested
                  ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40'
              }`}
            >
              <Hand size={20} className={hasRequested ? 'animate-pulse' : ''} />
            </button>
          )}
        </div>

        {/* Right: Settings, Chat Toggle and Participants */}
        <div className="flex items-center gap-1.5">
          {isChatHidable && (
            <button
              onClick={() => setShowChatDrawer(prev => !prev)}
              title="Live Chat"
              className={`p-3 rounded-xl border transition-all cursor-pointer relative active:scale-95 ${
                showChatDrawer
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40'
              }`}
            >
              <Send size={20} />
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            title="Room Settings"
            className="p-3 rounded-xl border transition-all cursor-pointer bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40 active:scale-95"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={() => setShowParticipants(prev => !prev)}
            title="Participants"
            className={`p-3 rounded-xl border transition-all cursor-pointer relative active:scale-95 ${
              showParticipants
                ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40'
            }`}
          >
            <Users size={20} />
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-gray-900 shadow">
              {uniqueParticipants.length}
            </span>
            {isHost && speakRequests.length > 0 && (
              <span className="absolute -bottom-1 -left-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-white dark:border-gray-900" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Hidable Chat Sliding Drawer */}
      <AnimatePresence>
        {isChatHidable && showChatDrawer && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatDrawer(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            />
            <motion.div
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-80 sm:w-[340px] bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl z-50 border-l border-gray-200 dark:border-white/5 overflow-hidden"
            >
              {renderChatPanel()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* ── Participants Drawer ── */}
        {showParticipants && (
          <div
            ref={participantsPanelRef}
            className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-white/8 flex flex-col z-50 shadow-2xl"
          >
            {/* Drawer header */}
            <div className="p-4 border-b border-gray-200 dark:border-white/8 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 shrink-0">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Users size={12} className="text-orange-400" />
                </div>
                Room · {uniqueParticipants.length}
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {/* Speak Requests */}
              {isHost && speakRequests.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                      Stage Requests · {speakRequests.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {speakRequests.map((req) => (
                      <div key={req.identity} className="flex items-center justify-between gap-2 p-2.5 bg-orange-500/8 border border-orange-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getGradient(req.identity)} flex items-center justify-center text-white font-black text-xs uppercase shrink-0`}>
                            {req.name ? req.name[0] : 'U'}
                          </div>
                          <span className="text-xs font-black text-gray-900 dark:text-white truncate">{req.name}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handlePromoteSpeaker(req.identity, req.name)}
                            className="p-1.5 bg-green-500/15 hover:bg-green-500 text-green-400 hover:text-white rounded-lg border border-green-500/25 transition-all cursor-pointer"
                            title="Approve"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSpeakRequests(prev => prev.filter(r => r.identity !== req.identity));
                              socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${req.identity}`).catch(() => {});
                            }}
                            className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg border border-gray-200 dark:border-white/8 transition-all cursor-pointer"
                            title="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants List */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-3 block">All Participants</span>
                <div className="space-y-1">
                  {uniqueParticipants.map((p) => {
                    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
                    const isMe = p.identity === localParticipant?.identity;
                    const pCanPublish = p.permissions?.canPublish ?? false;
                    const role = isCreator ? 'Host' : pCanPublish ? 'Speaker' : 'Listener';
                    const roleColors = { Host: 'text-orange-400', Speaker: 'text-green-400', Listener: 'text-gray-500' };

                    return (
                      <div key={p.identity} className="flex items-center justify-between gap-2 p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition group">
                        <div
                          onClick={() => handleUserProfileClick(p.identity)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getGradient(p.identity)} flex items-center justify-center text-white font-black text-xs uppercase`}>
                              {p.name ? p.name[0] : 'U'}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                              {p.name || 'User'}
                              {isMe && <span className="text-[8px] px-1 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded font-semibold">You</span>}
                            </span>
                            <span className={`text-[10px] font-bold ${roleColors[role]}`}>{role}</span>
                          </div>
                        </div>

                        {isHost && !isMe && (
                          <div className="flex items-center gap-2 shrink-0">
                            {!pCanPublish ? (
                              <button
                                onClick={() => handleInviteToStage(p.identity, p.name || 'User')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-black rounded-full shadow-md shadow-orange-500/10 transition-all cursor-pointer active:scale-95 border-none"
                                title="Invite to Stage"
                              >
                                <UserPlus size={11} />
                                <span>Invite</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDemoteSpeaker(p.identity, p.name || 'User')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-105 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-black rounded-full transition-all cursor-pointer active:scale-95 border border-gray-200 dark:border-white/5"
                                title="Demote to Audience"
                              >
                                <UserMinus size={11} />
                                <span>Demote</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleKickParticipant(p.identity, p.name || 'User')}
                              className="p-1.5 text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-full transition-all cursor-pointer active:scale-95"
                              title="Remove participant"
                            >
                              <UserX size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// ─── Main LanguageRoom Container ─────────────────────────────────────────────
export default function LanguageRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasExplicitlyLeft = useRef(false);

  const { roomInstance, setRoomInstance, clearRoomInstance } = useLiveRoomPipStore();

  const initialPipRoom = useLiveRoomPipStore.getState().pipRoom;
  const isRestoring = initialPipRoom && initialPipRoom.roomName === roomName && roomInstance && roomInstance.state === 'connected';

  const [token, setToken] = useState(isRestoring ? initialPipRoom.token : '');
  const [serverUrl, setServerUrl] = useState(isRestoring ? initialPipRoom.serverUrl : '');
  const [loading, setLoading] = useState(!isRestoring);
  const [error, setError] = useState(null);
  const [dbRoom, setDbRoom] = useState(isRestoring ? initialPipRoom.dbRoom : null);
  const [userIdentity, setUserIdentity] = useState(isRestoring ? initialPipRoom.userIdentity : null);

  useEffect(() => {
    if (!user) return;
    if (isRestoring) return;

    const fetchTokenAndRoom = async () => {
      try {
        let roomInfo = null;
        try {
          const roomsRes = await socialApi.get('/language-rooms/');
          roomInfo = roomsRes.data.find(r => r.roomName === roomName);
          if (roomInfo) setDbRoom(roomInfo);
        } catch (roomErr) {
          console.error('Failed to resolve room from database:', roomErr);
        }

        // If room no longer exists in DB, it was ended by host — redirect
        if (!roomInfo) {
          const navSrc = sessionStorage.getItem('nav_source');
          navigate(navSrc === 'social' ? '/dashboard/social' : '/dashboard/live-rooms');
          return;
        }

        // Determine if the user should join as a speaker
        const storedRole = localStorage.getItem(`livekit_stage_${roomName}`);
        const requestPublish = storedRole === 'speaker' ? 'true' : 'false';

        const res = await socialApi.get('/livekit/token', {
          params: { room: roomName, requestPublish },
        });

        setToken(res.data.token);
        setServerUrl(res.data.serverUrl);
        setUserIdentity(res.data.identity);

        const r = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        setRoomInstance(r);
      } catch (err) {
        console.error('Failed to get LiveKit token:', err);
        setError(err.response?.data?.error || 'Failed to connect to room. The room might be full or inactive.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndRoom();
  }, [user, roomName, navigate]);

  // On mount/unmount logic for PIP
  const pipValuesRef = useRef({ token, serverUrl, dbRoom, userIdentity });
  useEffect(() => {
    pipValuesRef.current = { token, serverUrl, dbRoom, userIdentity };
  }, [token, serverUrl, dbRoom, userIdentity]);

  useEffect(() => {
    // Clear PIP state if we return to the room
    useLiveRoomPipStore.getState().clearPipRoom();

    return () => {
      const { token, serverUrl, dbRoom, userIdentity } = pipValuesRef.current;
      if (!hasExplicitlyLeft.current && token && serverUrl && dbRoom) {
        const savedMic = localStorage.getItem(`livekit_mic_${roomName}`);
        const isMicEnabled = savedMic !== 'disabled';

        const savedCam = localStorage.getItem(`livekit_cam_${roomName}`);
        const isCamEnabled = savedCam === 'enabled';

        useLiveRoomPipStore.getState().setPipRoom({
          roomName,
          token,
          serverUrl,
          dbRoom,
          userIdentity,
          initialMicEnabled: isMicEnabled,
          initialCamEnabled: isCamEnabled
        });
      }
    };
  }, [roomName]);

  const handleLeaveRoom = useCallback(async () => {
    hasExplicitlyLeft.current = true; // User explicitly left the room
    const activeRoom = useLiveRoomPipStore.getState().roomInstance;
    if (activeRoom) {
      activeRoom.disconnect();
    }
    useLiveRoomPipStore.getState().clearRoomInstance();
    useLiveRoomPipStore.getState().clearPipRoom();

    try {
      localStorage.removeItem(`livekit_stage_${roomName}`);
      localStorage.removeItem(`livekit_mic_${roomName}`);
      localStorage.removeItem(`livekit_cam_${roomName}`);

      if (dbRoom && userIdentity && dbRoom.creatorId?.toString() === userIdentity) {
        // Host ends room: delete from DB + LiveKit server (permanently ends)
        await Promise.allSettled([
          socialApi.delete(`/language-rooms/by-name/${roomName}`),
          socialApi.delete(`/livekit/rooms/${roomName}`),
        ]);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
    // Navigate back respecting where user came from
    const navSrc = sessionStorage.getItem('nav_source');
    navigate(navSrc === 'social' ? '/dashboard/social' : '/dashboard/live-rooms');
  }, [roomName, navigate, dbRoom, userIdentity]);

  if (!user) return null;
  if (loading) return <RoomLoadingSpinner />;
  if (error) {
    const navSrc = sessionStorage.getItem('nav_source');
    const backPath = navSrc === 'social' ? '/dashboard/social' : '/dashboard/live-rooms';
    return <RoomError error={error} onBack={() => navigate(backPath)} />;
  }

  const isConnected = roomInstance && roomInstance.state === 'connected';

  return (
    <div className="w-full h-full">
      <LiveKitRoom
        room={roomInstance || undefined}
        serverUrl={isConnected ? undefined : serverUrl}
        token={isConnected ? undefined : token}
        connect={true}
        video={isConnected ? undefined : dbRoom?.mediaType === 'video'}
        audio={isConnected ? undefined : true}
        onDisconnected={handleLeaveRoom}
        disconnectOnUnmount={false}
        style={{ height: '100%' }}
        data-lk-theme="default"
      >
        <RoomAudioRenderer />
        <CustomLanguageRoomContent
          roomName={roomName}
          handleLeaveRoom={handleLeaveRoom}
          user={user}
          dbRoom={dbRoom}
          userIdentity={userIdentity}
        />
      </LiveKitRoom>
    </div>
  );
}
