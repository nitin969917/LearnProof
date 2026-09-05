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
  PhoneOff, Users, Globe, MessageSquare,
  Volume2, Send, UserX, UserPlus, UserMinus,
  Check, X, Hand, LogOut, ChevronsDown, Settings, Languages, Sparkles, Camera,
  Lock, Search, UserCheck, ScreenShare, Monitor, MonitorOff, PencilRuler, Presentation, PenTool,
  MoreHorizontal, ShieldCheck, Sliders, Shield
} from 'lucide-react';


import { Track, Room, RoomEvent } from 'livekit-client';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import UserAvatar from '../../Common/UserAvatar.jsx';
import RoomWhiteboard from './RoomWhiteboard.jsx';

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
function CustomLanguageRoomContent({ roomName, handleLeaveRoom, user, dbRoom, userIdentity, isRestoring }) {

  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { send, chatMessages: rawChatMessages } = useChat();
  const chatHistory = useLiveRoomPipStore(state => state.chatHistory);
  const syncChatHistory = useLiveRoomPipStore(state => state.syncChatHistory);

  useEffect(() => {
    syncChatHistory(rawChatMessages);
  }, [rawChatMessages, syncChatHistory]);

  const navigate = useNavigate();
  // Keep a ref to navigate so data handler closure never goes stale
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Helper: back-navigate respecting where the user came from
  const navigateBack = useCallback(() => {
    const src = sessionStorage.getItem('nav_source');
    if (src === 'social') {
      const savedTab = localStorage.getItem('social_active_tab') || 'chat';
      const savedProfileId = localStorage.getItem('social_selected_profile_id');
      const savedChat = localStorage.getItem('social_selected_chat_contact');

      let targetPath = `/dashboard/social?tab=${savedTab}`;
      if (savedTab === 'profile' && savedProfileId) {
        targetPath += `&profileId=${savedProfileId}`;
      } else if (savedTab === 'chat' && savedChat) {
        try {
          const parsed = JSON.parse(savedChat);
          if (parsed && parsed.id && parsed.type) {
            targetPath += `&chatId=${parsed.id}&chatType=${parsed.type}`;
          }
        } catch (e) { }
      }
      navigateRef.current(targetPath);
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

  // Quick Replies State
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowQuickReplies(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Session Time
  const sessionSeconds = useLiveRoomPipStore(state => state.sessionSeconds);
  const setSessionSeconds = useLiveRoomPipStore(state => state.setSessionSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [setSessionSeconds]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Role Permissions — use token identity for host check (available before LiveKit connects)
  const canPublish = localParticipant?.permissions?.canPublish ?? false;
  const isHost = Boolean(
    (dbRoom && user && String(dbRoom.creatorId) === String(user.id)) ||
    (dbRoom && userIdentity && String(dbRoom.creatorId) === String(userIdentity)) ||
    (dbRoom && localParticipant?.identity && String(dbRoom.creatorId) === String(localParticipant.identity))
  );
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

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
    const myId = userIdentityRef.current || (user?.id ? String(user.id) : null);
    return (hostId != null && myId != null && String(hostId) === String(myId)) || isHostRef.current;
  }, [user]);

  // Keep refs so the data channel handler closure never goes stale
  const canPublishRef = useRef(canPublish);
  useEffect(() => { canPublishRef.current = canPublish; }, [canPublish]);

  const prevCanPublish = useRef(false);

  // Invitation Modal (Stage invite received from host)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviterName, setInviterName] = useState('');

  // Invite Friends to Live Room Modal (Host or members inviting friends)
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false);
  const friends = useSocialFeedStore(state => state.friends);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  const loadingFriendsToInvite = useSocialFeedStore(state => state.loadingFriends);
  const [selectedInviteFriends, setSelectedInviteFriends] = useState([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  const handleOpenInviteFriendsModal = () => {
    fetchFriends(true);
    setSelectedInviteFriends([]);
    setInviteSearchQuery('');
    setShowInviteFriendsModal(true);
  };

  const toggleInviteFriendSelection = (friendId) => {
    setSelectedInviteFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendRoomInvites = async () => {
    if (selectedInviteFriends.length === 0) return;
    setSendingInvites(true);
    try {
      await socialApi.post(`/language-rooms/${roomName}/invite`, {
        userIds: selectedInviteFriends
      });
      toast.success(`Sent invitation to ${selectedInviteFriends.length} friend${selectedInviteFriends.length > 1 ? 's' : ''}!`);
      setShowInviteFriendsModal(false);
      setSelectedInviteFriends([]);
    } catch (err) {
      console.error('Failed to send room invites:', err);
      toast.error(err.response?.data?.error || 'Failed to send room invites');
    } finally {
      setSendingInvites(false);
    }
  };

  const alreadyInvitedIds = (() => {
    try {
      const parsed = JSON.parse(dbRoom?.invitedUserIds || '[]');
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch (e) {
      return [];
    }
  })();

  const filteredInviteFriends = (friends || []).filter(f =>
    (f.name || '').toLowerCase().includes(inviteSearchQuery.toLowerCase())
  );

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
  const notifiedRequestsRef = useRef(new Set());

  const participantsRef = useRef([]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  const addSpeakRequest = useCallback((identity, name) => {
    if (!identity) return;

    // If the user is already on stage as a speaker, ignore the request
    const allParticipants = [room?.localParticipant, ...participantsRef.current].filter(Boolean);
    const isAlreadySpeaker = allParticipants.some(p => {
      if (p.identity !== identity) return false;
      const isCreator = dbRoomRef.current && dbRoomRef.current.creatorId?.toString() === p.identity;
      return (p.permissions?.canPublish === true) || isCreator;
    });
    if (isAlreadySpeaker) return;

    // Immediately add to pending speak requests list
    setSpeakRequests(prev => {
      if (prev.some(r => r.identity === identity)) return prev;
      return [...prev, { identity, name: name || 'User' }];
    });

    if (!notifiedRequestsRef.current.has(identity)) {
      notifiedRequestsRef.current.add(identity);

      toast((t) => (
        <div className="flex items-center gap-3.5 p-3.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-orange-500/15 dark:border-orange-500/25 min-w-[320px] pointer-events-auto">
          {/* Mic Icon Bubble */}
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Mic size={18} className="animate-pulse" />
          </div>

          {/* Request Text info */}
          <div className="flex-1 min-w-0 flex flex-col text-left">
            <span className="text-xs font-black text-gray-900 dark:text-white truncate">
              {name || 'Someone'}
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 mt-0.5">
              wants to join stage
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                notifiedRequestsRef.current.delete(identity);
                if (handlePromoteSpeakerRef.current) {
                  handlePromoteSpeakerRef.current(identity, name || 'User');
                }
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-[10px] rounded-lg transition cursor-pointer active:scale-95 shadow-sm shadow-orange-500/10 border-none"
            >
              Approve
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                notifiedRequestsRef.current.delete(identity);
                setSpeakRequests(prev => prev.filter(r => r.identity !== identity));
                socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${identity}`).catch(() => { });
              }}
              className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold text-[10px] rounded-lg transition cursor-pointer active:scale-95 border border-gray-200 dark:border-white/5"
            >
              Dismiss
            </button>
          </div>
        </div>
      ), { duration: 8000, id: `speak_req_${identity}` });
    }
  }, [room, roomName]);

  const addSpeakRequestRef = useRef(addSpeakRequest);
  useEffect(() => { addSpeakRequestRef.current = addSpeakRequest; }, [addSpeakRequest]);


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
  const systemEvents = useLiveRoomPipStore(state => state.systemEvents);
  const setSystemEvents = useLiveRoomPipStore(state => state.setSystemEvents);

  // States for Translation / Subtitles
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const recognitionRef = useRef(null);
  const subtitleTimeoutRef = useRef(null);

  // Chat refs and states
  const [chatInput, setChatInput] = useState('');
  const chatTimelineRef = useRef(null);
  const [showChatPanel, setShowChatPanel] = useState(window.innerWidth >= 1024);

  // Video tracks for video rooms
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Clean up all lingering room toasts when leaving the component
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  // Filter tracks to show only participants that are stage speakers (host or has publish permission)
  const stageTracks = tracks.filter(t => {
    const p = t.participant;
    if (!p) return false;
    const pCanPublish = p.permissions?.canPublish;
    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
    return pCanPublish || isCreator;
  });

  // ── Screen Sharing & Whiteboard States & Host Permissions ─────────────────
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  // Host room settings: both whiteboard & screen share disabled by default until host enables them
  const [allowWhiteboard, setAllowWhiteboard] = useState(false);
  const [allowScreenShare, setAllowScreenShare] = useState(false);

  // Sync screen share state with local participant
  useEffect(() => {
    if (localParticipant) {
      setIsScreenSharing(localParticipant.isScreenShareEnabled);
    }
  }, [localParticipant, localParticipant?.isScreenShareEnabled]);

  const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const isPresenting = !!screenShareTrack;
  const activeScreenSharer = screenShareTrack?.participant;
  const isAnotherUserSharing = !!(activeScreenSharer && !activeScreenSharer.isLocal);

  // Broadcast host settings (allowWhiteboard, allowScreenShare) to all participants
  const broadcastRoomSettings = (newAllowWhiteboard, newAllowScreenShare) => {
    if (room && localParticipant) {
      try {
        const payload = JSON.stringify({
          type: 'ROOM_SETTINGS_UPDATE',
          allowWhiteboard: newAllowWhiteboard,
          allowScreenShare: newAllowScreenShare,
        });
        const encoder = new TextEncoder();
        localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'room_settings' });
      } catch (e) {
        console.error('Failed to broadcast room settings:', e);
      }
    }
  };

  // Host toggle for Whiteboard permission
  const handleToggleAllowWhiteboard = (newVal) => {
    setAllowWhiteboard(newVal);
    if (!newVal && isWhiteboardOpen) {
      toggleWhiteboard(false);
    }
    broadcastRoomSettings(newVal, allowScreenShare);
    toast.success(newVal ? 'Whiteboard enabled for the room' : 'Whiteboard disabled for the room', {
      icon: newVal ? '🎨' : '🔒'
    });
  };

  // Host toggle for Screen Sharing permission
  const handleToggleAllowScreenShare = async (newVal) => {
    setAllowScreenShare(newVal);
    if (!newVal && !isHost && isScreenSharing) {
      try {
        await localParticipant?.setScreenShareEnabled(false);
        setIsScreenSharing(false);
      } catch (e) { }
    }
    broadcastRoomSettings(allowWhiteboard, newVal);
    toast.success(newVal ? 'Screen sharing enabled for speakers' : 'Screen sharing disabled for speakers', {
      icon: newVal ? '🖥️' : '🔒'
    });
  };

  // Toggle Screen Sharing (Enforce 1 person at a time & Host permission)
  const toggleScreenShare = async () => {
    if (!localParticipant || !canPublish) {
      toast.error('You need speaking permissions on stage to share your screen.');
      return;
    }

    if (!isHost && !allowScreenShare) {
      toast.error('Screen sharing has been disabled by the host for this room.', { icon: '🔒' });
      return;
    }

    // Block if someone else is already sharing
    if (!isScreenSharing && isAnotherUserSharing) {
      const sharerName = activeScreenSharer?.name || 'Another participant';
      toast.error(`${sharerName} is already sharing their screen. Only one person can share at a time.`, {
        id: 'screen_share_limit'
      });
      return;
    }

    try {
      const target = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(target, { audio: true });
      setIsScreenSharing(target);
      if (target) {
        toast.success('Screen sharing active');
      } else {
        toast.success('Screen sharing stopped');
      }
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
      if (err.name !== 'NotAllowedError') {
        toast.error('Could not share screen: ' + (err.message || 'Permission denied'));
      }
      setIsScreenSharing(localParticipant?.isScreenShareEnabled || false);
    }
  };

  // Toggle Whiteboard & Broadcast state to room participants
  const toggleWhiteboard = (forcedState) => {
    const nextState = typeof forcedState === 'boolean' ? forcedState : !isWhiteboardOpen;
    if (nextState && !isHost && !allowWhiteboard) {
      toast.error('Whiteboard is currently disabled by the host.', { icon: '🔒' });
      return;
    }
    setIsWhiteboardOpen(nextState);
    if (room && localParticipant) {
      try {
        const payload = JSON.stringify({ type: 'WHITEBOARD_VISIBILITY', isOpen: nextState });
        const encoder = new TextEncoder();
        localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'whiteboard' });
      } catch (e) {
        console.error('Failed to broadcast whiteboard visibility:', e);
      }
    }
  };

  // Listen for whiteboard visibility & room settings updates from peers
  useEffect(() => {
    if (!room) return;
    const handleDataReceived = (payload, participant, kind, topic) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));
        if (topic === 'whiteboard' || message.type === 'WHITEBOARD_VISIBILITY') {
          if (message.type === 'WHITEBOARD_VISIBILITY') {
            setIsWhiteboardOpen(message.isOpen);
          }
        }
        if (message.type === 'REQUEST_ROOM_SETTINGS' && isHost) {
          broadcastRoomSettings(allowWhiteboard, allowScreenShare);
        }
        if (topic === 'room_settings' || message.type === 'ROOM_SETTINGS_UPDATE') {
          if (typeof message.allowWhiteboard === 'boolean') {
            setAllowWhiteboard(message.allowWhiteboard);
            if (!message.allowWhiteboard) {
              setIsWhiteboardOpen(false);
            }
          }
          if (typeof message.allowScreenShare === 'boolean') {
            setAllowScreenShare(message.allowScreenShare);
            if (!message.allowScreenShare && !amIHost() && isScreenSharing) {
              localParticipant?.setScreenShareEnabled(false);
              setIsScreenSharing(false);
            }
          }
        }
      } catch (e) { }
    };

    const handleParticipantConnected = () => {
      if (isHost) {
        broadcastRoomSettings(allowWhiteboard, allowScreenShare);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

    // If not host, request initial settings on connect
    if (!isHost) {
      try {
        const reqPayload = JSON.stringify({ type: 'REQUEST_ROOM_SETTINGS' });
        room.localParticipant?.publishData(
          new TextEncoder().encode(reqPayload),
          { reliable: true }
        );
      } catch (e) { }
    }

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room, isScreenSharing, amIHost, localParticipant, isHost, allowWhiteboard, allowScreenShare]);

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
        if (!isRestoring) {
          const savedMic = localStorage.getItem(`livekit_mic_${roomName}`);
          const targetMic = savedMic !== 'disabled';
          localParticipant.setMicrophoneEnabled(targetMic).catch(() => { });

          if (isVideoRoom) {
            const savedCam = localStorage.getItem(`livekit_cam_${roomName}`);
            const targetCam = savedCam === 'enabled';
            localParticipant.setCameraEnabled(targetCam).catch(() => { });
          }
        }
      }
      prevCanPublish.current = currentCanPublish;
      hasInitializedState.current = true;
    }
  }, [localParticipant, roomName, isVideoRoom, isRestoring]);

  // ── Sync permissions changes from server (promote/demote) ─────────────────
  useEffect(() => {
    if (!localParticipant) return;
    setIsMicEnabled(localParticipant.isMicrophoneEnabled);
    setIsCamEnabled(localParticipant.isCameraEnabled);

    const currentCanPublish = localParticipant.permissions?.canPublish ?? false;
    if (hasInitializedState.current && currentCanPublish !== prevCanPublish.current) {
      if (currentCanPublish) {
        setHasRequested(false);
        localParticipant.setMicrophoneEnabled(true).catch(() => { });
        setIsMicEnabled(true);
        localStorage.setItem(`livekit_stage_${roomName}`, 'speaker');
        localStorage.setItem(`livekit_mic_${roomName}`, 'enabled');
      } else {
        toast.error('You have been moved back to the audience.', { duration: 5000 });
        localParticipant.setMicrophoneEnabled(false).catch(() => { });
        localParticipant.setCameraEnabled(false).catch(() => { });
        setIsMicEnabled(false);
        setIsCamEnabled(false);
        localStorage.setItem(`livekit_stage_${roomName}`, 'listener');
        localStorage.removeItem(`livekit_mic_${roomName}`);
        localStorage.removeItem(`livekit_cam_${roomName}`);
      }
      prevCanPublish.current = currentCanPublish;
    }
  }, [
    localParticipant,
    localParticipant?.isMicrophoneEnabled,
    localParticipant?.isCameraEnabled,
    localParticipant?.permissions?.canPublish,
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

  // ── Page unload cleanup for all participants (disconnects immediately when tab is closed) ──
  useEffect(() => {
    const handleUnload = () => {
      // 1. Cleanly disconnect from LiveKit room so other participants see us leave immediately
      if (room) {
        try {
          room.disconnect();
        } catch (e) {
          console.warn('Failed to disconnect room on unload:', e);
        }
      }

      // 2. If host, request a delayed room/meeting deletion (source=unload)
      // If the host is only reloading the page, the new mount token call cancels this scheduled deletion.
      if (isHost) {
        const token = localStorage.getItem('google_token');
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

        // Delete database room record (delayed)
        const dbUrl = `${backendUrl}/api/language-rooms/by-name/${roomName}?source=unload`;
        fetch(dbUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          keepalive: true
        }).catch(() => { });

        // Delete LiveKit server room (delayed)
        const lkUrl = `${backendUrl}/api/livekit/rooms/${roomName}?source=unload`;
        fetch(lkUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          keepalive: true
        }).catch(() => { });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [room, isHost, roomName]);

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
    ...chatHistory.map(m => ({
      type: 'chat',
      id: m.id || m.timestamp || Date.now(),
      time: new Date(m.timestamp || m.sentAt || Date.now()),
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
    chatTimelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    if (!room?.localParticipant) return;
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(payloadObj));
      const opts = { reliable: true };
      if (destinationIdentities && destinationIdentities.length > 0) {
        opts.destinationIdentities = destinationIdentities;
      }
      try {
        await room.localParticipant.publishData(encoded, opts);
      } catch (innerErr) {
        // If directed transmission fails, broadcast to room
        if (opts.destinationIdentities) {
          await room.localParticipant.publishData(encoded, { reliable: true });
        }
      }
    } catch (err) {
      console.warn('[Signal] Non-critical signal publish error:', err?.message || err);
    }
  };

  // ── Request to Speak (Listener side) ──────────────────────────────────────
  const handleRequestToSpeak = () => {
    if (hasRequested) return;
    setHasRequested(true);
    toast.success('Stage request sent! Waiting for host approval...', { icon: '🎤' });

    const myIdentity = localParticipant?.identity || userIdentity || (user?.id ? String(user.id) : null);
    const myName = localParticipant?.name || user?.name || 'User';

    const requestPayload = {
      type: 'request_to_speak',
      identity: myIdentity,
      name: myName,
    };

    // 1. Instant Data channel fast-path signal: send directly to host AND broadcast to room (0ms latency)
    try {
      if (hostIdentity) {
        sendSignal(requestPayload, [hostIdentity]);
      }
      sendSignal(requestPayload);
    } catch (sigErr) {
      console.warn('[Signal] Fast-path signal failed:', sigErr);
    }

    // 2. Submit to backend in background (async non-blocking fallback)
    socialApi.post(`/livekit/rooms/${roomName}/stage-requests`).catch(err => {
      console.warn('[StageRequest] Background API submit error:', err);
    });
  };

  const handleWithdrawRequest = () => {
    if (!hasRequested) return;
    setHasRequested(false);
    toast.success('Stage request withdrawn.', { icon: '🎤' });

    const myId = localParticipant?.identity || userIdentity || (user?.id ? String(user.id) : null);
    if (myId) {
      const withdrawPayload = {
        type: 'withdraw_stage_request',
        identity: myId,
      };
      // 1. Instant data channel signal directly to host + broadcast
      try {
        if (hostIdentity) {
          sendSignal(withdrawPayload, [hostIdentity]);
        }
        sendSignal(withdrawPayload);
      } catch (_) { }

      // 2. Background backend store removal
      socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${myId}`).catch(() => { });
    }
  };

  // ── Host: Invite listener to stage ────────────────────────────────────────
  const handleInviteToStage = async (identity, pName) => {
    try {
      // Direct API promotion ensures permissions are granted immediately on server
      await socialApi.post(`/livekit/rooms/${roomName}/participants/${identity}/promote`);
      toast.success(`${pName || 'User'} has been invited to stage!`, { id: `invite-${identity}`, duration: 2500, icon: '🎤' });
      // Send signal to notify user on UI
      try {
        await sendSignal({
          type: 'invite_to_stage',
          targetIdentity: identity,
          hostName: localParticipant?.name || 'Host'
        }, [identity]);
      } catch (signalErr) {
        console.warn('[Signal] Non-fatal signal error:', signalErr);
      }
    } catch (err) {
      console.error('[Signal] Failed to invite to stage:', err);
      toast.error(err.response?.data?.error || 'Failed to invite participant to stage.', { id: `invite-err-${identity}` });
    }
  };

  // ── Listener: Accept host invite ───────────────────────────────────────────
  const handleAcceptInvite = async () => {
    setShowInviteModal(false);
    toast.success('You are now on stage! 🎤', { id: 'on-stage-self', duration: 3000 });
    try {
      await sendSignal({
        type: 'accept_invite_response',
        identity: localParticipant?.identity || userIdentity,
        name: localParticipant?.name || 'User'
      });
    } catch (err) {
      console.warn('[Signal] Accept notification failed:', err);
    }
  };

  // ── Listener: Decline host invite ─────────────────────────────────────────
  const handleDeclineInvite = async () => {
    setShowInviteModal(false);
    try {
      const myId = localParticipant?.identity || userIdentity;
      if (canPublish && myId) {
        await socialApi.post(`/livekit/rooms/${roomName}/participants/${myId}/demote`);
      }
      await sendSignal({
        type: 'decline_invite_response',
        name: localParticipant?.name || 'User'
      });
    } catch (err) {
      console.warn('[Signal] Decline notification failed:', err);
    }
  };

  // ── Host: Approve a speak request (from participants panel) ────────────────
  const handlePromoteSpeaker = async (identity, pName) => {
    // Stage limit check (max 6 speakers)
    const currentSpeakersCount = uniqueParticipants.filter(p => {
      if (!p) return false;
      const pCanPublish = p.permissions?.canPublish;
      const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
      return pCanPublish || isCreator;
    }).length;

    if (currentSpeakersCount >= 6) {
      toast.error('The stage is full! Maximum of 6 speakers allowed.', {
        id: 'stage-full',
        style: { background: '#ef4444', color: '#fff', fontWeight: '700' }
      });
      return;
    }

    try {
      await socialApi.post(`/livekit/rooms/${roomName}/participants/${identity}/promote`);
      setSpeakRequests(prev => prev.filter(r => r.identity !== identity));
      try {
        await socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${identity}`);
      } catch (_) { }
      // Notify the promoted user via data channel
      try {
        await sendSignal({ type: 'you_were_promoted' }, [identity]);
      } catch (_) { }
    } catch (err) {
      console.error('[Promote]', err);
      toast.error(err.response?.data?.error || 'Failed to promote user.', { id: `promote-err-${identity}` });
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
        incoming.forEach((req) => addSpeakRequestRef.current?.(req.identity, req.name));
      } catch (err) {
        console.warn('[StageRequests] poll failed:', err);
      }
    };

    fetchStageRequests();
    const pollId = setInterval(fetchStageRequests, 3000);
    return () => clearInterval(pollId);
  }, [isHost, roomName]);

  useEffect(() => {
    if (!room) return;

    const handleRemoteData = (payload) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        const currentLocalParticipant = localParticipantRef.current;
        const hostActive = isHostRef.current || isHost || amIHost();

        if (data.type === 'request_to_speak') {
          if (hostActive) {
            addSpeakRequestRef.current?.(data.identity, data.name);
          }
        } else if (data.type === 'withdraw_stage_request') {
          if (hostActive) {
            notifiedRequestsRef.current.delete(data.identity);
            setSpeakRequests(prev => prev.filter(r => r.identity !== data.identity));
            toast.dismiss(`speak_req_${data.identity}`);
          }
        } else if (data.type === 'invite_to_stage') {
          // The host already promoted us server-side. Show confirmation toast.
          if (currentLocalParticipant && data.targetIdentity === currentLocalParticipant.identity) {
            setInviterName(data.hostName);
            setShowInviteModal(true);
          }
        } else if (data.type === 'you_were_promoted') {
          // Triggered when host approves a speak request
          toast.success('You are now on stage! 🎤', { id: 'on-stage-self', duration: 3000 });
          setHasRequested(false);
        } else if (data.type === 'accept_invite_response') {
          if (hostActive) {
            if (handlePromoteSpeakerRef.current) {
              handlePromoteSpeakerRef.current(data.identity, data.name);
            }
          }
        } else if (data.type === 'decline_invite_response') {
          if (hostActive) {
            toast.error(`${data.name || 'User'} declined the stage invitation.`, { id: `decline-${data.identity || 'user'}`, duration: 3000 });
          }
        } else if (data.type === 'room_ended') {
          toast.error('The host has ended this session.', { id: 'room-ended', duration: 4000 });
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
    room.on(RoomEvent.DataReceived, handleRemoteData);
    return () => {
      room.off('dataReceived', handleRemoteData);
      room.off(RoomEvent.DataReceived, handleRemoteData);
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    };
  }, [room, roomName, isHost, amIHost]);

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
        try { recognitionRef.current.start(); } catch (e) { }
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
    navigate(`/dashboard/social?tab=profile&profileId=${userId}`);
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
    if (count <= 1) return 'grid-cols-1 grid-rows-1 h-full';
    if (count === 2) {
      if (showChatPanel) {
        // Chat is open: Side-by-side on mobile (grid-cols-2 grid-rows-1) to preserve vertical chat room, and side-by-side on desktop.
        return 'grid-cols-2 grid-rows-1 h-full';
      } else {
        // Chat is closed: Vertical stacked (grid-cols-1 grid-rows-2) on tall mobile portrait, and side-by-side (lg:grid-cols-2 lg:grid-rows-1) on wide desktop monitors.
        return 'grid-cols-1 lg:grid-cols-2 grid-rows-2 lg:grid-rows-1 h-full';
      }
    }
    if (count === 3) {
      if (showChatPanel) {
        // Chat open: 2 columns, 2 rows (main user left col spanning 2 rows, other 2 users stacked right)
        return 'grid-cols-2 grid-rows-2 h-full';
      } else {
        // Chat closed: 3 vertical rows on mobile, 2 columns on desktop (main user left col spanning 2 rows, other 2 users stacked right)
        return 'grid-cols-1 lg:grid-cols-2 grid-rows-3 lg:grid-rows-2 h-full';
      }
    }
    if (count === 4) return 'grid-cols-2 grid-rows-2 h-full';
    return 'grid-cols-2 lg:grid-cols-3 grid-rows-3 lg:grid-rows-2 h-full'; // 5–6 people
  };

  // Returns dynamic spans for 3-speaker layout:
  // When chat is open: 2-column layout on all screens (main user left col row-span-2, other two right col row-span-1)
  // When chat is closed: 3 vertical rows on mobile, 2-column layout on desktop (lg:row-span-2 for main user, lg:row-span-1 for other two)
  const getTileSpan = (index, total) => {
    if (total === 3) {
      if (showChatPanel) {
        if (index === 0) return 'col-span-1 row-span-2 h-full w-full';
        return 'col-span-1 row-span-1 h-full w-full';
      } else {
        if (index === 0) return 'col-span-1 lg:col-span-1 row-span-1 lg:row-span-2 h-full w-full';
        return 'col-span-1 lg:col-span-1 row-span-1 lg:row-span-1 h-full w-full';
      }
    }
    return 'h-full';
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
        className={`${spanClass} relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border-2 transition-all flex flex-col items-center justify-center p-3 w-full h-full shadow-sm ${isSpeaking
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
          <span className={`p-1 rounded-lg text-white shadow-sm ${hasMic ? 'bg-green-500/80 backdrop-blur-sm' : 'bg-red-500/80 backdrop-blur-sm'
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
        <div className="px-3 py-2 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-900/80">
          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Send size={10} className="text-orange-400" />
            </div>
            Live Chat
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-500">{uniqueParticipants.length}</span>
            <button
              onClick={() => setShowChatPanel(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Close chat"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth">
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
              <div key={item.id} className="flex gap-2 flex-row items-end">
                <div
                  onClick={() => navigate(`/dashboard/social?tab=profile&profileId=${item.from?.identity}`)}
                  className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getGradient(item.from?.identity || '')} flex items-center justify-center text-white font-black text-[10px] uppercase shrink-0 border border-white/10 cursor-pointer hover:scale-105 transition-all`}
                  title="View Profile"
                >
                  {item.from?.name?.[0] || 'U'}
                </div>
                <div className="flex flex-col gap-0.5 max-w-[200px] items-start">
                  <span
                    onClick={() => navigate(`/dashboard/social?tab=profile&profileId=${item.from?.identity}`)}
                    className="text-[9px] font-black text-gray-500 uppercase tracking-wide px-1 cursor-pointer hover:text-orange-500 transition-colors"
                    title="View Profile"
                  >
                    {item.from?.name || 'User'}
                  </span>
                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${isMe
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-bl-md shadow-orange-500/20'
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
        {showQuickReplies && (
          <div className="px-2 py-1.5 flex gap-2 overflow-x-auto shrink-0 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50 hide-scrollbar">
            {["Hey! 👋", "What's the topic?", "I'm new here 😊"].map((text) => (
              <button
                key={text}
                onClick={() => handleQuickSend(text)}
                className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 text-[10px] font-bold rounded-full transition-all cursor-pointer shrink-0 active:scale-95"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <div className="p-3 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900 shrink-0">
          <form onSubmit={handleSendChat} className="flex gap-2 items-center w-full">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
            />
            {/* Send Button */}
            <button type="submit" className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-white transition cursor-pointer flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25 active:scale-95">
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


      {/* Invite Friends Modal */}
      {showInviteFriendsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Invite Friends</h3>
                  <p className="text-[10px] text-gray-400">Invite friends to join this live room</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteFriendsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-7 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Friend List */}
            <div className="overflow-y-auto max-h-56 space-y-1.5 pr-1 flex-1 mb-4">
              {loadingFriendsToInvite && (!friends || friends.length === 0) ? (
                <div className="text-center py-4 text-xs text-gray-400">Loading friends...</div>
              ) : filteredInviteFriends.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">
                  {(!friends || friends.length === 0) ? 'No friends found. Add friends in Social Hub!' : 'No friends match search.'}
                </div>
              ) : (
                filteredInviteFriends.map(friend => {
                  const isSelected = selectedInviteFriends.includes(friend.id);
                  const isAlreadyInvited = alreadyInvitedIds.includes(friend.id);
                  const isInRoom = uniqueParticipants.some(p => p.identity === String(friend.id));

                  return (
                    <div
                      key={friend.id}
                      onClick={() => !isInRoom && toggleInviteFriendSelection(friend.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isInRoom
                          ? 'bg-green-500/5 border-green-500/20 opacity-70 cursor-default'
                          : isSelected
                            ? 'bg-purple-500/10 border-purple-400 dark:border-purple-600 cursor-pointer'
                            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 hover:border-purple-200 cursor-pointer select-none'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          src={friend.profilePicture}
                          name={friend.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 text-[10px]"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {friend.name}
                            </span>
                            {friend.isCloseFriend && (
                              <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          {isInRoom ? (
                            <span className="text-[9px] text-green-500 font-semibold">Already in room</span>
                          ) : isAlreadyInvited ? (
                            <span className="text-[9px] text-purple-500 font-semibold">Previously invited</span>
                          ) : null}
                        </div>
                      </div>

                      {!isInRoom && (
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                          }`}>
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowInviteFriendsModal(false)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                disabled={selectedInviteFriends.length === 0 || sendingInvites}
                onClick={handleSendRoomInvites}
                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                {sendingInvites ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={12} />
                    <span>Invite ({selectedInviteFriends.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Room Actions & Settings Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border-t sm:border border-gray-100 dark:border-gray-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl transition-all max-h-[88vh] sm:max-h-[82vh] flex flex-col gap-4 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                    Room Actions & Settings
                  </h3>
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {roomName} · {isHost ? 'Host Controls Available' : 'Participant Menu'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shrink-0">
              <button
                onClick={() => setActiveSettingsTab('tools')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-black text-xs transition-all cursor-pointer ${activeSettingsTab === 'tools' || (activeSettingsTab !== 'host' && activeSettingsTab !== 'camera' && activeSettingsTab !== 'filter')
                    ? 'bg-white dark:bg-gray-900 text-orange-500 shadow-sm'
                    : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
              >
                <PenTool size={13} />
                <span>Actions</span>
              </button>
              {isHost && (
                <button
                  onClick={() => setActiveSettingsTab('host')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-black text-xs transition-all cursor-pointer ${activeSettingsTab === 'host'
                      ? 'bg-white dark:bg-gray-900 text-orange-500 shadow-sm'
                      : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                    }`}
                >
                  <ShieldCheck size={13} />
                  <span>Host Settings</span>
                </button>
              )}
              {isVideoRoom && (
                <button
                  onClick={() => setActiveSettingsTab('camera')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-black text-xs transition-all cursor-pointer ${activeSettingsTab === 'camera' || activeSettingsTab === 'filter'
                      ? 'bg-white dark:bg-gray-900 text-orange-500 shadow-sm'
                      : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                    }`}
                >
                  <Camera size={13} />
                  <span>Video & Filters</span>
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1">

              {/* Tab 1: Tools & Stage Actions */}
              {(activeSettingsTab === 'tools' || (!isHost && !isVideoRoom && activeSettingsTab !== 'host' && activeSettingsTab !== 'camera')) && (
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-450 dark:text-gray-500 px-0.5">
                    Collaboration & Stage
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Collaborative Whiteboard Card */}
                    <div
                      onClick={() => {
                        if (!isHost && !allowWhiteboard) {
                          toast.error('Whiteboard is currently disabled by the host in room settings.', { icon: '🔒' });
                          return;
                        }
                        toggleWhiteboard();
                        setShowSettingsModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 ${isWhiteboardOpen
                          ? 'bg-orange-500/10 border-orange-500/40 dark:bg-orange-500/15'
                          : (!isHost && !allowWhiteboard)
                            ? 'bg-gray-50/70 dark:bg-gray-800/30 border-gray-200/50 dark:border-white/5 opacity-60'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-white/5 hover:border-orange-500/30'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isWhiteboardOpen
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                          }`}>
                          <PenTool size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                              Whiteboard
                            </span>
                            {isWhiteboardOpen && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                                Open
                              </span>
                            )}
                            {!isHost && !allowWhiteboard && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                Disabled
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                            {isWhiteboardOpen
                              ? 'Tap to close board'
                              : (!isHost && !allowWhiteboard)
                                ? 'Disabled by host'
                                : 'Collaborative canvas'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Screen Sharing Card */}
                    <div
                      onClick={() => {
                        if (!isHost && !allowScreenShare) {
                          toast.error('Screen sharing is restricted by the host.', { icon: '🔒' });
                          return;
                        }
                        if (!canPublish && !isHost) {
                          toast.error('You need to be a speaker on stage to share your screen. Raise your hand to join stage!', { icon: '✋' });
                          return;
                        }
                        toggleScreenShare();
                        setShowSettingsModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 ${isScreenSharing
                          ? 'bg-blue-500/10 border-blue-500/40 dark:bg-blue-500/15'
                          : (!isHost && !allowScreenShare)
                            ? 'bg-gray-50/70 dark:bg-gray-800/30 border-gray-200/50 dark:border-white/5 opacity-60'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-white/5 hover:border-blue-500/30'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isScreenSharing
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          }`}>
                          {isScreenSharing ? <MonitorOff size={18} /> : <ScreenShare size={18} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                              Screen Share
                            </span>
                            {isScreenSharing && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-blue-600 text-white uppercase tracking-wider animate-pulse">
                                Sharing
                              </span>
                            )}
                            {isAnotherUserSharing && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                                In Use
                              </span>
                            )}
                            {!isHost && !allowScreenShare && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                Disabled
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                            {isScreenSharing
                              ? 'Tap to stop sharing'
                              : isAnotherUserSharing
                                ? `${activeScreenSharer?.name || 'Someone'} is sharing`
                                : (!isHost && !allowScreenShare)
                                  ? 'Disabled by host'
                                  : (!canPublish && !isHost)
                                    ? 'Join stage to share'
                                    : 'Share screen or window'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Action / Raise Hand Card */}
                    <div
                      onClick={() => {
                        if (isHost) {
                          handleOpenInviteFriendsModal();
                        } else if (canPublish) {
                          handleLeaveStage();
                        } else if (hasRequested) {
                          handleWithdrawRequest();
                        } else {
                          handleRequestToSpeak();
                        }
                        setShowSettingsModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 ${hasRequested || (isHost && speakRequests.length > 0)
                          ? 'bg-purple-500/10 border-purple-500/40 dark:bg-purple-500/15'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-white/5 hover:border-purple-500/30'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHost
                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                            : canPublish
                              ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                              : hasRequested
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                          }`}>
                          {isHost ? <UserPlus size={18} /> : canPublish ? <ChevronsDown size={18} /> : <Hand size={18} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {isHost ? 'Invite Friends' : canPublish ? 'Leave Stage' : hasRequested ? 'Withdraw Request' : 'Raise Hand'}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                            {isHost
                              ? `${speakRequests.length} pending requests`
                              : canPublish
                                ? 'Return to audience'
                                : hasRequested
                                  ? 'Waiting for host approval'
                                  : 'Request to speak on stage'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Host Room Settings (Host Only) */}
              {isHost && activeSettingsTab === 'host' && (
                <div className="p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-orange-500" />
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      Host Room Settings & Collaboration
                    </span>
                  </div>

                  {/* Whiteboard permission switch */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col pr-3">
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        Enable Collaborative Whiteboard
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                        Allow participants to view and draw on the whiteboard
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleAllowWhiteboard(!allowWhiteboard)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${allowWhiteboard ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${allowWhiteboard ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                  </div>

                  {/* Screen share permission switch */}
                  <div className="flex items-center justify-between border-t border-orange-500/10 pt-3">
                    <div className="flex flex-col pr-3">
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        Allow Screen Sharing
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                        Allow speakers to share their screens during this session
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleAllowScreenShare(!allowScreenShare)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${allowScreenShare ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${allowScreenShare ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Camera & Beauty Filters (Video Rooms) */}
              {isVideoRoom && (activeSettingsTab === 'camera' || activeSettingsTab === 'filter') && (
                <div className="flex flex-col gap-4">
                  {/* Video Source Switcher */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Select Camera Device
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
                      <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-450 font-bold">
                          Camera switching is available when you are on stage.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Beauty Filters */}
                  <div className="flex flex-col gap-2.5 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Skin Tone & Smoothing Filter
                      </label>
                      <span className="text-[10px] text-gray-500 dark:text-gray-450 mt-0.5 font-bold leading-normal">
                        Choose a visual style to enhance skin tone and lighting in real-time.
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
                            className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${isActive
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
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-gray-150 dark:border-gray-800 shrink-0">
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
          <div
            className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            <img src="/LP_M_logo.png" alt="LearnProof" className="w-8 h-8 object-contain shrink-0 rounded-xl" />
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
            {dbRoom?.isPrivate ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/20 rounded-full text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                <Lock size={9} />
                <span>{uniqueParticipants.length <= 1 ? 'Solo Private Room' : 'Private'}</span>
              </span>
            ) : dbRoom?.isFriendsOnly ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 dark:bg-orange-950/40 border border-orange-500/20 rounded-full text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                <Users size={9} />
                <span>Friends Only</span>
              </span>
            ) : null}
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
            className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl font-black shadow-lg transition-all active:scale-95 cursor-pointer ${isHost
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
        <div className={`${showChatPanel ? (isChatHidable ? 'h-full flex-1' : 'h-[48vh] lg:h-full lg:flex-1') : 'h-full flex-1'
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

          {(isPresenting || isWhiteboardOpen) ? (
            // Google Meet Presentation / Collaborative Whiteboard View
            <div className="relative w-full h-full flex flex-col p-2 bg-orange-50 dark:bg-gray-950 overflow-hidden gap-2">
              {/* Top Presenter / Whiteboard Status Bar */}
              <div className="flex items-center justify-between px-2 pt-1 z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                      {isWhiteboardOpen ? 'Collaborative Whiteboard' : `${screenShareTrack?.participant?.name || 'Someone'} is presenting`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isWhiteboardOpen ? (
                    <button
                      onClick={() => toggleWhiteboard(false)}
                      className="px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Close Whiteboard</span>
                    </button>
                  ) : screenShareTrack?.participant?.isLocal ? (
                    <button
                      onClick={toggleScreenShare}
                      className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <MonitorOff size={13} />
                      <span>Stop Presenting</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Main Hero Viewport */}
              <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden shadow-2xl bg-black">
                {isWhiteboardOpen ? (
                  <RoomWhiteboard
                    room={room}
                    localParticipant={localParticipant}
                    isHost={isHost}
                    canPublish={canPublish}
                    participants={participants}
                    onClose={() => toggleWhiteboard(false)}
                  />
                ) : (
                  <ParticipantTile
                    trackRef={screenShareTrack}
                    className="w-full h-full object-contain rounded-2xl overflow-hidden bg-black"
                  />
                )}
              </div>

              {/* Bottom Filmstrip of Stage Speakers */}
              {stageSpeakers.length > 0 && (
                <div className="shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {stageSpeakers.map((p) => {
                    const camTrack = tracks.find(t =>
                      t.participant?.identity === p.identity && t.source === Track.Source.Camera && t.participant?.isCameraEnabled
                    );
                    return (
                      <div
                        key={p.identity}
                        className="w-28 sm:w-36 h-20 sm:h-24 shrink-0 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-white/10"
                      >
                        {camTrack ? (
                          <ParticipantTile
                            trackRef={camTrack}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          renderSpeakerTile(p, 'w-full h-full text-xs')
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : isVideoRoom ? (
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
            <div className="relative w-full h-full flex flex-col p-2 bg-orange-50 dark:bg-gray-950 overflow-hidden gap-3">
              {/* Stage Label */}
              <div className="flex items-center gap-2 shrink-0 z-10 px-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">On Stage</span>
                  <span className="text-[10px] font-bold text-orange-500/70 dark:text-orange-400/60">· {stageSpeakers.length}/6</span>
                </div>
              </div>

              {/* Speaker Tiles */}
              <div className="flex-1 min-h-0">
                <div className={`grid ${getGridClassName(stageSpeakers.length)} w-full h-full gap-2`}>
                  {stageSpeakers.map((p, i) => (
                    <div
                      key={p.identity}
                      className={`${getTileSpan(i, stageSpeakers.length)} h-full w-full`}
                    >
                      {renderSpeakerTile(p, 'h-full w-full')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Strip */}
              {listeners.length > 0 && (
                <div className="shrink-0 border-t border-gray-200 dark:border-white/5 pt-2.5 px-2 pb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Listening · {listeners.length}
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-[64px] overflow-y-auto">
                    {listeners.map((p) => (
                      <div
                        key={p.identity}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getGradient(p.identity)} flex items-center justify-center text-white font-black text-xs shadow-sm border border-white/10 group-hover:scale-105 transition-all`}>
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
        {!isChatHidable && showChatPanel && (
          <div className="flex-1 lg:w-[340px] lg:max-w-[380px] lg:shrink-0 flex flex-col overflow-hidden bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/5 relative">
            {renderChatPanel()}
          </div>
        )}
      </div>

      {/* ── Global Bottom Controls Bar ── */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/5 py-3 px-3 sm:px-6 flex items-center justify-around z-30 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] gap-1 sm:gap-2">

        {/* On-Stage Controls: Shown only when user is on Stage (Host or Approved Speaker) */}
        {(canPublish || isHost) ? (
          <>
            {/* 1. Mute / Unmute Button */}
            <div
              onClick={toggleMic}
              className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[54px] sm:min-w-[64px]"
            >
              <div className={`w-12 sm:w-14 h-11 rounded-2xl flex items-center justify-center transition-all ${isMicEnabled
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200/50 dark:border-red-900/30'
                }`}>
                {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </div>
              <span className="text-[11px] font-black tracking-tight text-gray-700 dark:text-gray-300">
                {isMicEnabled ? 'Mute' : 'Unmute'}
              </span>
            </div>

            {/* 2. Video Button (if video room) */}
            {isVideoRoom && (
              <div
                onClick={toggleCam}
                className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[54px] sm:min-w-[64px]"
              >
                <div className={`w-12 sm:w-14 h-11 rounded-2xl flex items-center justify-center transition-all ${isCamEnabled
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-white/5'
                  }`}>
                  {isCamEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </div>
                <span className="text-[11px] font-black tracking-tight text-gray-700 dark:text-gray-300">
                  {isCamEnabled ? 'Stop Video' : 'Start Video'}
                </span>
              </div>
            )}

            {/* 3. Stage Action: Invite Friends (Host) or Leave Stage (Speaker) */}
            <div
              onClick={isHost ? handleOpenInviteFriendsModal : handleLeaveStage}
              className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[54px] sm:min-w-[64px]"
            >
              <div className={`w-12 sm:w-14 h-11 rounded-2xl flex items-center justify-center transition-all ${isHost
                  ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200/50 dark:border-red-900/30'
                }`}>
                {isHost ? <UserPlus size={20} /> : <ChevronsDown size={20} />}
              </div>
              <span className="text-[11px] font-black tracking-tight text-gray-700 dark:text-gray-300">
                {isHost ? 'Invite' : 'Leave Stage'}
              </span>
            </div>
          </>
        ) : (
          /* Audience / Listener Control: Prominent Raise Hand Button */
          <div
            onClick={hasRequested ? handleWithdrawRequest : handleRequestToSpeak}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[70px] sm:min-w-[84px]"
          >
            <div className={`w-14 sm:w-16 h-11 rounded-2xl flex items-center justify-center transition-all ${hasRequested
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/30 animate-pulse'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md shadow-purple-500/20'
              }`}>
              <Hand size={20} className={hasRequested ? 'animate-bounce' : ''} />
            </div>
            <span className={`text-[11px] font-black tracking-tight ${hasRequested ? 'text-orange-600 dark:text-orange-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {hasRequested ? 'Withdraw' : 'Raise Hand'}
            </span>
          </div>
        )}

        {/* Chat Button */}
        <div
          onClick={() => setShowChatPanel(prev => !prev)}
          className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[54px] sm:min-w-[64px] relative"
        >
          <div className={`w-12 sm:w-14 h-11 rounded-2xl flex items-center justify-center transition-all ${showChatPanel
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-orange-50 dark:bg-orange-950/30 text-orange-500 border border-orange-200/40 dark:border-orange-900/30'
            }`}>
            <MessageSquare size={20} />
          </div>
          <span className="text-[11px] font-black tracking-tight text-gray-700 dark:text-gray-300">
            Chat
          </span>
        </div>

        {/* Participants Button */}
        <div
          onClick={() => setShowParticipants(prev => !prev)}
          className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[54px] sm:min-w-[64px] relative"
        >
          <div className={`w-12 sm:w-14 h-11 rounded-2xl flex items-center justify-center transition-all relative ${showParticipants
              ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
              : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/40 dark:border-green-900/30'
            }`}>
            <Users size={20} />
            {uniqueParticipants.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-black rounded-full shadow-sm">
                {uniqueParticipants.length}
              </span>
            )}
          </div>
          <span className="text-[11px] font-black tracking-tight text-gray-700 dark:text-gray-300">
            People
          </span>
        </div>

        {/* More Options / Settings Button */}
        <div
          onClick={() => setShowSettingsModal(true)}
          className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 select-none min-w-[54px] sm:min-w-[64px] relative"
        >
          <div className={`w-12 sm:w-14 h-11 rounded-2xl flex items-center justify-center transition-all relative ${showSettingsModal || isWhiteboardOpen || isScreenSharing
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-white/5'
            }`}>
            <MoreHorizontal size={20} />
            {(isWhiteboardOpen || isScreenSharing || (isHost && speakRequests.length > 0)) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
            )}
          </div>
          <span className="text-[11px] font-black tracking-tight text-gray-700 dark:text-gray-300">
            More
          </span>
        </div>
      </div>

      {/* Hidable Chat Sliding Drawer */}
      <AnimatePresence>
        {isChatHidable && showChatPanel && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatPanel(false)}
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
                            socialApi.delete(`/livekit/rooms/${roomName}/stage-requests/${req.identity}`).catch(() => { });
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">All Participants ({uniqueParticipants.length})</span>
                {isHost && (
                  <button
                    onClick={handleOpenInviteFriendsModal}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
                  >
                    <UserPlus size={11} />
                    <span>Invite Friends</span>
                  </button>
                )}
              </div>
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

  const { activeRoom, setActiveRoom, clearActiveRoom } = useLiveRoomPipStore();
  const isRestoring = activeRoom && activeRoom.roomName === roomName;

  const [token, setToken] = useState(isRestoring ? activeRoom.token : '');
  const [serverUrl, setServerUrl] = useState(isRestoring ? activeRoom.serverUrl : '');
  const [loading, setLoading] = useState(!isRestoring);
  const [error, setError] = useState(null);
  const [dbRoom, setDbRoom] = useState(isRestoring ? activeRoom.dbRoom : null);
  const [userIdentity, setUserIdentity] = useState(isRestoring ? activeRoom.userIdentity : null);

  useEffect(() => {
    if (!user) return;
    if (isRestoring) return;

    const fetchTokenAndRoom = async () => {
      try {
        let roomInfo = null;
        try {
          const roomRes = await socialApi.get(`/language-rooms/by-name/${roomName}`);
          roomInfo = roomRes.data;
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

        setActiveRoom({
          roomName,
          token: res.data.token,
          serverUrl: res.data.serverUrl,
          dbRoom: roomInfo,
          userIdentity: res.data.identity,
        });
      } catch (err) {
        console.error('Failed to get LiveKit token:', err);
        setError(err.response?.data?.error || 'Failed to connect to room. The room might be full or inactive.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndRoom();
  }, [user, roomName, navigate]);

  useEffect(() => {
    // Hide PiP when returning to the room page
    useLiveRoomPipStore.getState().setShowPip(false);

    return () => {
      if (!hasExplicitlyLeft.current && useLiveRoomPipStore.getState().activeRoom) {
        useLiveRoomPipStore.getState().setShowPip(true);
      }
    };
  }, [roomName]);

  const handleLeaveRoom = useCallback(async () => {
    hasExplicitlyLeft.current = true; // User explicitly left the room
    useLiveRoomPipStore.getState().clearActiveRoom();

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
  if (loading || !activeRoom) return <RoomLoadingSpinner />;
  if (error) {
    const navSrc = sessionStorage.getItem('nav_source');
    const backPath = navSrc === 'social' ? '/dashboard/social' : '/dashboard/live-rooms';
    return <RoomError error={error} onBack={() => navigate(backPath)} />;
  }

  return (
    <div className="w-full h-full">
      <CustomLanguageRoomContent
        roomName={roomName}
        handleLeaveRoom={handleLeaveRoom}
        user={user}
        dbRoom={dbRoom}
        userIdentity={userIdentity}
        isRestoring={isRestoring}
      />
    </div>
  );
}
