import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import toast from 'react-hot-toast';

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
  Volume2, Send, ShieldAlert, Languages,
  Check, X
} from 'lucide-react';

import { Track } from 'livekit-client';

// ─── Loading Spinner ────────────────────────────────────────────────────────
const RoomLoadingSpinner = () => (
  <div className="flex flex-col h-screen w-full bg-gray-55 dark:bg-gray-950 items-center justify-center gap-6">
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
  <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-950 items-center justify-center gap-6 px-4">
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

// ─── Custom Inner Content (Has access to LiveKit context) ───────────────────
function CustomLanguageRoomContent({ roomName, handleLeaveRoom, user, dbRoom }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { send, chatMessages } = useChat();
  const navigate = useNavigate();

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

  // Role Permissions
  const canPublish = localParticipant?.permissions?.canPublish ?? false;
  const isHost = dbRoom && dbRoom.creatorId?.toString() === localParticipant?.identity;
  const isVideoRoom = dbRoom?.mediaType === 'video';

  const [prevCanPublish, setPrevCanPublish] = useState(false);

  // Invitation Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviterName, setInviterName] = useState('');

  // Speaker Requests State (Host Only)
  const [speakRequests, setSpeakRequests] = useState([]);
  const [hasRequested, setHasRequested] = useState(false);

  // Media states
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCamEnabled, setIsCamEnabled] = useState(false);

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
    if (isHost && room) {
      // Broadcast room_ended to all participants
      try {
        const payload = { type: 'room_ended' };
        const encoded = new TextEncoder().encode(JSON.stringify(payload));
        await room.localParticipant.publishData(encoded, { reliable: true });
        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (err) {
        console.error('Failed to broadcast room_ended:', err);
      }
    }
    // Clear local state
    localStorage.removeItem(`livekit_stage_${roomName}`);
    localStorage.removeItem(`livekit_mic_${roomName}`);
    localStorage.removeItem(`livekit_cam_${roomName}`);
    await handleLeaveRoom();
  };

  // ── Request to Speak (Listener side) ──────────────────────────────────────
  const handleRequestToSpeak = async () => {
    if (!room || hasRequested) return;
    try {
      const payload = {
        type: 'request_to_speak',
        identity: localParticipant.identity,
        name: localParticipant.name || 'User'
      };
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(encoded, { reliable: true });
      setHasRequested(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send speak request.');
    }
  };

  // ── Host: Invite listener to stage ────────────────────────────────────────
  const handleInviteToStage = async (identity, pName) => {
    if (!room) return;
    try {
      const payload = {
        type: 'invite_to_stage',
        targetIdentity: identity,
        hostName: localParticipant.name || 'Host'
      };
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(encoded, { reliable: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send stage invitation.');
    }
  };

  // ── Listener: Accept host invite ───────────────────────────────────────────
  const handleAcceptInvite = async () => {
    if (!room) return;
    try {
      // Tell host we accepted — host will call promote API
      const payload = {
        type: 'accept_invite_response',
        identity: localParticipant.identity,
        name: localParticipant.name || 'User'
      };
      const encoded = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(encoded, { reliable: true });
      setShowInviteModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept invite.');
    }
  };

  // ── Host: Promote speaker ──────────────────────────────────────────────────
  const handlePromoteSpeaker = async (identity, pName) => {
    try {
      await socialApi.post(`/livekit/rooms/${roomName}/participants/${identity}/promote`);
      setSpeakRequests(prev => prev.filter(r => r.identity !== identity));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to promote user.');
    }
  };

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
    if (!window.confirm(`Remove ${pName} from this session?`)) return;
    try {
      await socialApi.delete(`/livekit/rooms/${roomName}/participants/${identity}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove participant');
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
  useEffect(() => {
    if (!room) return;

    const handleRemoteData = (payload) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));

        if (data.type === 'request_to_speak') {
          if (isHost) {
            setSpeakRequests(prev => {
              if (prev.some(r => r.identity === data.identity)) return prev;
              return [...prev, { identity: data.identity, name: data.name }];
            });
          }
        } else if (data.type === 'invite_to_stage') {
          if (data.targetIdentity === localParticipant.identity && !canPublish) {
            setInviterName(data.hostName);
            setShowInviteModal(true);
          }
        } else if (data.type === 'accept_invite_response') {
          if (isHost) {
            // Automatically promote the user who accepted
            handlePromoteSpeaker(data.identity, data.name);
          }
        } else if (data.type === 'room_ended') {
          toast.error('The host has ended this session.', { duration: 5000 });
          // Clean up and navigate away
          localStorage.removeItem(`livekit_stage_${roomName}`);
          localStorage.removeItem(`livekit_mic_${roomName}`);
          localStorage.removeItem(`livekit_cam_${roomName}`);
          navigate('/dashboard/live-rooms');
        } else if (data.type === 'subtitle') {
          setActiveSubtitle({
            text: data.text,
            translation: data.translation,
            sender: data.sender
          });
          if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
          subtitleTimeoutRef.current = setTimeout(() => {
            setActiveSubtitle(null);
          }, 5000);
        }
      } catch (e) {}
    };

    room.on('dataReceived', handleRemoteData);
    return () => {
      room.off('dataReceived', handleRemoteData);
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    };
  }, [room, isHost, localParticipant, canPublish, roomName, navigate]);

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
        const payload = { type: 'subtitle', text: transcriptText, translation, sender: localParticipant.name || 'User' };
        const encoded = new TextEncoder().encode(JSON.stringify(payload));
        await room.localParticipant.publishData(encoded, { reliable: true });
        setActiveSubtitle(payload);
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
    if (count <= 1) return 'grid-cols-1 grid-rows-1 h-full';
    if (count === 2) return 'grid-cols-2 grid-rows-1 h-full';
    if (count === 3) return 'grid-cols-3 grid-rows-1 h-full';
    if (count === 4) return 'grid-cols-2 grid-rows-2 h-full';
    return 'grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2 h-full';
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

  const renderSpeakerTile = (p) => {
    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
    const isMe = p.identity === localParticipant?.identity;
    const hasMic = p.isMicrophoneEnabled;
    const isSpeaking = p.isSpeaking;
    const gradient = getGradient(p.identity);

    return (
      <div
        key={p.identity}
        className={`relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border-2 transition-all flex flex-col items-center justify-center p-4 w-full h-full shadow-sm ${
          isSpeaking
            ? 'border-orange-500 shadow-lg shadow-orange-500/20 scale-[0.99]'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        {/* Clickable profile overlay */}
        <div
          onClick={() => handleUserProfileClick(p.identity)}
          className="absolute inset-0 w-full h-full z-25 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all"
          title={`View ${p.name || 'User'}'s Profile`}
        />

        <div className="flex flex-col items-center justify-center gap-2 z-10">
          <div className="relative">
            {isSpeaking && (
              <span className="absolute -inset-1.5 rounded-full bg-orange-500/30 animate-ping"></span>
            )}
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-md border border-white/10 uppercase`}>
              {p.name ? p.name[0] : 'U'}
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1 border border-white dark:border-gray-900 animate-bounce">
                <Volume2 size={10} />
              </span>
            )}
          </div>

          <div className="text-center animate-fade-in">
            <span className="text-[11px] font-black text-gray-800 dark:text-white flex items-center gap-1 justify-center max-w-[100px] truncate">
              {p.name || 'User'}
              {isMe && <span className="text-[7px] bg-orange-500/10 dark:bg-white/20 text-orange-600 dark:text-white px-1 rounded uppercase tracking-wider">You</span>}
            </span>
            <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 block mt-0.5">
              {isCreator ? 'Host' : 'Speaker'}
            </span>
          </div>
        </div>

        <div className="absolute top-2 right-2 z-20 flex gap-1">
          <span className={`p-1 rounded text-white text-[9px] font-bold shadow-sm ${
            hasMic ? 'bg-green-500/80 backdrop-blur-sm' : 'bg-red-500/80 backdrop-blur-sm'
          }`}>
            {hasMic ? <Mic size={9} /> : <MicOff size={9} />}
          </span>
        </div>

        {isCreator && (
          <div className="absolute bottom-2 left-2 z-20 bg-orange-500/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider text-white">
            Host
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-white overflow-hidden relative">

      {/* Stage Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-scale-up text-center">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-4 border border-orange-100 dark:border-orange-500/10">
              <Mic size={32} className="animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Stage Invitation</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Host <span className="text-orange-500 font-bold">{inviterName}</span> has invited you to join the stage as a speaker.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                No Thanks
              </button>
              <button
                onClick={handleAcceptInvite}
                className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow transition rounded-xl cursor-pointer"
              >
                Join Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60 shrink-0 z-20">
        {/* Room info (left) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/40"></div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">{roomName}</h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="text-xs font-black tracking-wide text-orange-500">{formatTime(sessionSeconds)}</span>
          </div>
        </div>

        {/* Action controls (right) */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            <Globe className="text-orange-500" size={13} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">LearnProof Live</span>
          </div>

          <button
            onClick={handleLeaveClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-black text-[10px] uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all active:scale-95 cursor-pointer"
            title={isHost ? 'End Session' : 'Leave Room'}
          >
            <PhoneOff size={12} />
            <span>{isHost ? 'End Room' : 'Leave'}</span>
          </button>
        </div>
      </div>

      {/* ─── Main layout ─── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* LEFT/TOP: Speaker grid or video grid */}
        <div className="h-[45vh] md:h-full w-full md:w-[58%] shrink-0 border-b md:border-b-0 md:border-r border-gray-200/60 dark:border-gray-800/60 relative overflow-hidden bg-slate-100 dark:bg-gray-950">

          {/* Subtitles Overlay */}
          {activeSubtitle && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-md border border-orange-500/20 p-3 rounded-xl shadow-xl flex flex-col gap-0.5 items-center text-center">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                  {activeSubtitle.sender} is speaking:
                </span>
                <p className="text-xs font-medium text-gray-800 dark:text-white italic">"{activeSubtitle.text}"</p>
                <div className="h-px w-12 bg-gray-200 dark:bg-gray-800 my-0.5"></div>
                <p className="text-xs font-bold text-orange-500 flex items-center gap-1 justify-center">
                  <Languages size={12} />
                  <span>{activeSubtitle.translation}</span>
                </p>
              </div>
            </div>
          )}

          {isVideoRoom ? (
            <div className="w-full h-full p-2 sm:p-3 bg-slate-900 dark:bg-gray-950 overflow-y-auto transition-colors duration-300">
              <div className={`grid ${getGridClassName(stageTracks.length)} w-full h-full gap-1.5 sm:gap-2`}>
                {stageTracks.map((trackRef) => (
                  <ParticipantTile
                    key={`${trackRef.participant.identity}_${trackRef.source}`}
                    trackRef={trackRef}
                    className="rounded-xl overflow-hidden shadow-md w-full h-full"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full p-3 sm:p-4 bg-slate-50 dark:bg-gray-950 overflow-y-auto flex flex-col gap-3">
              {/* Stage Speakers */}
              <div className="flex-1 min-h-[60%] flex flex-col gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">On Stage</span>
                  <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-500">{stageSpeakers.length}/6</span>
                </div>
                <div className="flex-1">
                  <div className={`grid ${getGridClassName(stageSpeakers.length)} w-full h-full gap-2 sm:gap-3`}>
                    {stageSpeakers.map(renderSpeakerTile)}
                  </div>
                </div>
              </div>

              {/* Audience / Listeners */}
              <div className="border-t border-gray-200/50 dark:border-gray-800/80 pt-3 shrink-0 flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  Audience / Listeners ({listeners.length})
                </span>
                {listeners.length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic py-2">No other listeners in the room</div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 py-1">
                    {listeners.map((p) => (
                      <div
                        key={p.identity}
                        onClick={() => handleUserProfileClick(p.identity)}
                        className="flex flex-col items-center justify-center gap-1 cursor-pointer group"
                        title={`View ${p.name || 'User'}'s Profile`}
                      >
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getGradient(p.identity)} flex items-center justify-center text-white font-black text-xs shadow-sm border border-white/10 uppercase group-hover:scale-105 transition-all`}>
                            {p.name ? p.name[0] : 'U'}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-gray-900"></span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[55px] text-center">
                          {p.name || 'User'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT/BOTTOM: Chat panel */}
        <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-gray-900/95">
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            {/* Scrollable chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {timelineItems.map((item) => {
                if (item.type === 'system') {
                  return (
                    <div key={item.id} className="flex justify-center my-1.5">
                      <div className="px-4 py-2.5 bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-500/10 rounded-2xl text-[11px] font-semibold text-gray-500 dark:text-orange-400/90 text-center max-w-md leading-relaxed shadow-sm">
                        {item.text}
                      </div>
                    </div>
                  );
                }

                const isMe = item.from?.identity === localParticipant?.identity;
                return (
                  <div key={item.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase px-1">
                      {isMe ? 'You' : item.from?.name || 'User'}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs max-w-[260px] leading-relaxed shadow-sm break-words ${
                      isMe
                        ? 'bg-orange-500 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50'
                    }`}>
                      {item.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatTimelineRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-4 py-1.5 flex gap-2 overflow-x-auto shrink-0 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/20">
              {["Hey, everyone!", "What's the topic?", "I'm new here."].map((text) => (
                <button
                  key={text}
                  onClick={() => handleQuickSend(text)}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-500 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-full shadow-sm hover:text-orange-500 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Chat input + controls bar */}
            <div className="border-t border-gray-100 dark:border-gray-800/80 p-3 bg-white dark:bg-gray-900 flex flex-col gap-2 shrink-0">
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Say something..."
                  className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 font-medium placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white transition cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  <Send size={14} />
                </button>
              </form>

              {/* Action bar */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800/40">

                {/* Left: media controls */}
                <div className="flex items-center gap-2">
                  {canPublish ? (
                    <>
                      {/* Mic toggle */}
                      <button
                        onClick={toggleMic}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isMicEnabled
                            ? 'bg-orange-500 border-orange-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={isMicEnabled ? 'Mute Mic' : 'Unmute Mic'}
                      >
                        {isMicEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                      </button>

                      {/* Camera toggle (video rooms only) */}
                      {isVideoRoom && (
                        <button
                          onClick={toggleCam}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            isCamEnabled
                              ? 'bg-orange-500 border-orange-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title={isCamEnabled ? 'Turn off Camera' : 'Turn on Camera'}
                        >
                          {isCamEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                        </button>
                      )}

                      {/* Leave Stage (non-host speakers) */}
                      {!isHost && (
                        <button
                          onClick={handleLeaveStage}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/25 rounded-lg transition-all cursor-pointer font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm"
                          title="Go to Audience"
                        >
                          <MicOff size={12} />
                          <span>Leave Stage</span>
                        </button>
                      )}
                    </>
                  ) : (
                    // Request stage button for listeners
                    <button
                      onClick={handleRequestToSpeak}
                      disabled={hasRequested}
                      className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-black text-[10px] uppercase tracking-wider flex items-center gap-1 ${
                        hasRequested
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 cursor-not-allowed opacity-80'
                          : 'bg-orange-500 hover:bg-orange-600 border-orange-600 text-white shadow-sm'
                      }`}
                    >
                      <Mic size={12} />
                      <span>{hasRequested ? 'Requested' : 'Request Stage'}</span>
                    </button>
                  )}

                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-0.5"></div>

                  {/* Subtitles toggle */}
                  <button
                    onClick={toggleTranslation}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isTranscribing
                        ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-500 hover:bg-gray-200'
                    }`}
                    title={isTranscribing ? 'Turn off Subtitles' : 'Turn on Subtitles'}
                  >
                    <Languages size={14} />
                  </button>
                </div>

                {/* Right: participants only (leave button moved to header right corner) */}
                <div className="flex items-center gap-2">
                  {/* Participants button */}
                  <button
                    onClick={() => setShowParticipants(prev => !prev)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer relative ${
                      showParticipants
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-orange-500'
                    }`}
                    title="Participants"
                  >
                    <Users size={14} />
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white dark:border-gray-900">
                      {uniqueParticipants.length}
                    </span>
                    {/* Pending requests pulse indicator for host */}
                    {isHost && speakRequests.length > 0 && (
                      <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 border border-white"></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Participants Drawer (click-outside closes) ─── */}
        {showParticipants && (
          <div
            ref={participantsPanelRef}
            className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col z-40 absolute right-0 top-0 bottom-0 shadow-2xl shrink-0"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950/40 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
                <Users size={16} />
                <span>Room Users ({uniqueParticipants.length})</span>
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-xs font-semibold text-gray-400 hover:text-orange-500 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Speak Requests (host only) */}
              {isHost && speakRequests.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-500/5 px-2 py-1 rounded-md border border-orange-500/15">
                    Speak Requests ({speakRequests.length})
                  </h4>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {speakRequests.map((req) => (
                      <div key={req.identity} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getGradient(req.identity)} flex items-center justify-center text-white font-black text-xs uppercase shrink-0`}>
                            {req.name ? req.name[0] : 'U'}
                          </div>
                          <span className="text-xs font-black truncate">{req.name}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handlePromoteSpeaker(req.identity, req.name)}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-lg border border-green-500/25 transition-all cursor-pointer"
                            title="Approve"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setSpeakRequests(prev => prev.filter(r => r.identity !== req.identity))}
                            className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-lg border border-gray-200 dark:border-gray-700 transition-all cursor-pointer"
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

              {/* Active Users list */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Active Users ({uniqueParticipants.length})
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {uniqueParticipants.map((p) => {
                    const isCreator = dbRoom && dbRoom.creatorId?.toString() === p.identity;
                    const isMe = p.identity === localParticipant?.identity;
                    const pCanPublish = p.permissions?.canPublish ?? false;

                    return (
                      <div key={p.identity} className="py-3 flex items-center justify-between gap-2">
                        <div
                          onClick={() => handleUserProfileClick(p.identity)}
                          className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-all"
                          title={`View ${p.name || 'User'}'s Profile`}
                        >
                          <div className="relative shrink-0">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getGradient(p.identity)} flex items-center justify-center text-white font-black text-xs uppercase`}>
                              {p.name ? p.name[0] : 'U'}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-gray-900"></span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-gray-800 dark:text-white truncate flex items-center gap-1.5">
                              {p.name || 'User'}
                              {isMe && <span className="text-[9px] px-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-md font-semibold">You</span>}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold">
                              {isCreator ? 'Host' : pCanPublish ? 'Speaker' : 'Listener'}
                            </span>
                          </div>
                        </div>

                        {/* Host controls */}
                        {isHost && !isMe && (
                          <div className="flex gap-1.5 shrink-0 items-center">
                            {!pCanPublish ? (
                              <button
                                onClick={() => handleInviteToStage(p.identity, p.name || 'User')}
                                className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-500/20 rounded-full transition-all cursor-pointer text-[9px] font-black uppercase tracking-wider"
                                title="Invite to Stage"
                              >
                                <Mic size={10} />
                                <span>Invite</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDemoteSpeaker(p.identity, p.name || 'User')}
                                className="flex items-center gap-1 px-2 py-1 bg-orange-500/15 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-500/20 rounded-full transition-all cursor-pointer text-[9px] font-black uppercase tracking-wider"
                                title="Demote to Audience"
                              >
                                <MicOff size={10} />
                                <span>Demote</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleKickParticipant(p.identity, p.name || 'User')}
                              className="flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-full transition-all cursor-pointer text-[9px] font-black uppercase tracking-wider"
                              title="Remove participant"
                            >
                              <ShieldAlert size={10} />
                              <span>Kick</span>
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
    </div>
  );
}

// ─── Main LanguageRoom Container ─────────────────────────────────────────────
export default function LanguageRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbRoom, setDbRoom] = useState(null);
  const [userIdentity, setUserIdentity] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchTokenAndRoom = async () => {
      try {
        let roomInfo = null;
        try {
          const roomsRes = await socialApi.get('/language-rooms');
          roomInfo = roomsRes.data.find(r => r.roomName === roomName);
          if (roomInfo) setDbRoom(roomInfo);
        } catch (roomErr) {
          console.error('Failed to resolve room from database:', roomErr);
        }

        // If room no longer exists in DB, it was ended by host — redirect
        if (!roomInfo) {
          navigate('/dashboard/live-rooms');
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
      } catch (err) {
        console.error('Failed to get LiveKit token:', err);
        setError(err.response?.data?.error || 'Failed to connect to room. The room might be full or inactive.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndRoom();
  }, [user, roomName, navigate]);

  const handleLeaveRoom = useCallback(async () => {
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
    navigate('/dashboard/live-rooms');
  }, [roomName, navigate, dbRoom, userIdentity]);

  if (!user) return null;
  if (loading) return <RoomLoadingSpinner />;
  if (error) return <RoomError error={error} onBack={() => navigate('/dashboard/live-rooms')} />;

  return (
    <div className="w-full h-full">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        video={dbRoom?.mediaType === 'video'}
        audio={true}
        onDisconnected={handleLeaveRoom}
        style={{ height: '100%' }}
        data-lk-theme="default"
      >
        <RoomAudioRenderer />
        <CustomLanguageRoomContent
          roomName={roomName}
          handleLeaveRoom={handleLeaveRoom}
          user={user}
          dbRoom={dbRoom}
        />
      </LiveKitRoom>
    </div>
  );
}
