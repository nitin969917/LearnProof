import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mic, Globe, Plus, Users, Search, GraduationCap, Video, PhoneOff, Trash2, X, Lock, UserCheck, Check, Star, Calendar, Clock, Sparkles, Bell, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socialApi from '../../../api/socialApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import { getSocialSocket } from '../../../utils/socialSocket.js';
import UserAvatar from '../../Common/UserAvatar.jsx';

// ── Schedule Date & Time Helpers ─────────────────────────────────────────────
const getMinDateTime = (minutesAhead = 5) => {
  const d = new Date(Date.now() + minutesAhead * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getTonight8PM = () => {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  if (d.getTime() < Date.now() + 15 * 60 * 1000) {
    return getMinDateTime(120);
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`;
};

const getTomorrow10AM = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
};

const formatScheduledDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
};

const getTimeRemaining = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs <= 0) return 'Starting now';
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) return `in ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `in ${diffHours}h ${diffMins % 60}m`;
  const diffDays = Math.floor(diffHours / 24);
  return `in ${diffDays}d`;
};

const downloadIcs = (e, room) => {
  e.stopPropagation();
  const title = `${room.topic || 'Live Session'} (${room.language}) - LearnProof`;
  const description = `Live ${room.mediaType} practice session on LearnProof: https://learnproofai.com/dashboard/live-rooms/${room.roomName}`;
  const start = new Date(room.scheduledFor);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const formatIcsDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `URL:https://learnproofai.com/dashboard/live-rooms/${room.roomName}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${room.roomName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Calendar reminder downloaded!');
};

export default function LanguageLearning() {
  const outletContext = useOutletContext();
  const setHeaderAction = outletContext?.setHeaderAction;
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ 
    roomName: '', 
    topic: '', 
    language: '', 
    mediaType: 'audio', 
    visibility: 'public', // 'public' | 'friends_only' | 'private'
    isScheduled: false,
    scheduledFor: ''
  });
  const friends = useSocialFeedStore(state => state.friends);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  const loadingFriends = useSocialFeedStore(state => state.loadingFriends);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(localStorage.getItem('languageRoomsTab') || 'audio'); // 'audio' or 'video'
  const [roomFilter, setRoomFilter] = useState('all'); // 'all' | 'live' | 'scheduled'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const socialUser = useSocialFeedStore(state => state.socialUser);
  const fetchSocialUser = useSocialFeedStore(state => state.fetchSocialUser);

  // Swipe Gesture Handling (Swapping left / right between audio and video sections)
  const minSwipeDistance = 45;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY) * 1.2;
    
    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance && activeTab === 'audio') {
        // Swiped Left -> switch to video tab
        setActiveTab('video');
        localStorage.setItem('languageRoomsTab', 'video');
      } else if (distanceX < -minSwipeDistance && activeTab === 'video') {
        // Swiped Right -> switch to audio tab
        setActiveTab('audio');
        localStorage.setItem('languageRoomsTab', 'audio');
      }
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchFriends();
    if (user && !socialUser) {
      fetchSocialUser();
    }
  }, [user, socialUser, fetchSocialUser, fetchFriends]);

  useEffect(() => {
    // Listen to real-time room creation/deletion events from other users via socket
    let socket = null;
    if (socialUser?.id) {
      try {
        socket = getSocialSocket(socialUser.id);
        if (socket) {
          console.log('[Socket] Subscribing to ROOMS_UPDATED for user:', socialUser.id);
          socket.on('ROOMS_UPDATED', fetchRooms);
        }
      } catch (err) {
        console.error('Failed to bind ROOMS_UPDATED socket listener:', err);
      }
    }

    // Poll active rooms list every 30 seconds to keep it dynamic and fresh without overloading
    const pollInterval = setInterval(fetchRooms, 30000);
    return () => {
      clearInterval(pollInterval);
      if (socket) {
        console.log('[Socket] Unsubscribing from ROOMS_UPDATED');
        socket.off('ROOMS_UPDATED', fetchRooms);
      }
    };
  }, [socialUser]);

  const fetchRooms = async () => {
    try {
      const response = await socialApi.get('/language-rooms');
      // Guard: always set an array, even if API returns an error object
      setRoomsList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRoomsList([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (mediaType = activeTab) => {
    setNewRoom({ 
      roomName: '', 
      topic: '', 
      language: '', 
      mediaType, 
      visibility: 'public',
      isScheduled: false,
      scheduledFor: ''
    });
    setSelectedFriends([]);
    setFriendSearchQuery('');
    fetchFriends(true);
    setShowModal(true);
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    );
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.roomName || !newRoom.language) return;
    setCreating(true);

    try {
      // Format room name to be url safe
      const formattedRoomName = newRoom.roomName.replace(/\s+/g, '-').toLowerCase();
      const isPrivate = newRoom.visibility === 'private';
      const isFriendsOnly = newRoom.visibility === 'friends_only';
      
      const payload = {
        roomName: formattedRoomName,
        topic: newRoom.topic || 'General Discussion',
        language: newRoom.language,
        mediaType: newRoom.mediaType || 'audio',
        isPrivate,
        isFriendsOnly,
        invitedUserIds: isPrivate ? selectedFriends : [],
        scheduledFor: (newRoom.isScheduled && newRoom.scheduledFor) ? new Date(newRoom.scheduledFor).toISOString() : null
      };

      const response = await socialApi.post('/language-rooms', payload);
      
      setShowModal(false);
      fetchRooms();
      if (newRoom.isScheduled) {
        toast.success(`Room scheduled for ${formatScheduledDate(newRoom.scheduledFor)}!`);
      } else {
        navigate(`/dashboard/live-rooms/${response.data.roomName}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create room. Room name might already be in use.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = (e, id) => {
    e.stopPropagation();
    setRoomToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await socialApi.delete(`/language-rooms/${roomToDelete}`);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally {
      setShowConfirmModal(false);
      setRoomToDelete(null);
    }
  };

  const audioRoomsCount = (Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === 'audio').length;
  const videoRoomsCount = (Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === 'video').length;
  const totalRoomsCount = audioRoomsCount + videoRoomsCount;

  const filteredFriends = (friends || []).filter(f => 
    (f.name || '').toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col gap-4 w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28 select-none sm:select-auto touch-pan-y"
    >

      {/* ── Compact Header (Desktop only - mobile uses TopBar) ── */}
      <div className="hidden lg:flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
          <Globe size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Live Rooms</h1>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {totalRoomsCount > 0 ? `${totalRoomsCount} active rooms` : "Connect with others in real-time"}
          </p>
        </div>
        <button
          onClick={() => openCreateModal(activeTab)}
          className="flex items-center gap-1.5 px-3 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer font-bold text-xs shrink-0"
        >
          <Plus size={14} />
          <span>Create</span>
        </button>
      </div>

      {/* Tabs Selector + Mobile Create Action */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 gap-2">
        <div className="flex flex-1 max-w-xs sm:max-w-md">
          <button
            onClick={() => {
              setActiveTab('audio');
              localStorage.setItem('languageRoomsTab', 'audio');
            }}
            className={`relative flex-1 pb-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'text-orange-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Mic size={14} />
            <span>Audio ({audioRoomsCount})</span>
            {activeTab === 'audio' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('video');
              localStorage.setItem('languageRoomsTab', 'video');
            }}
            className={`relative flex-1 pb-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'text-orange-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Video size={14} />
            <span>Video ({videoRoomsCount})</span>
            {activeTab === 'video' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        </div>

        {/* Mobile Create Room Button */}
        <button
          onClick={() => openCreateModal(activeTab)}
          className="flex lg:hidden items-center gap-1 px-3 py-1.5 mb-1.5 text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer font-bold text-xs shrink-0"
        >
          <Plus size={14} />
          <span>New Room</span>
        </button>
      </div>

      {/* Sub-filters: All / Live Now / Scheduled */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setRoomFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            roomFilter === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setRoomFilter('live')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            roomFilter === 'live'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Now</span>
        </button>
        <button
          onClick={() => setRoomFilter('scheduled')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            roomFilter === 'scheduled'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Calendar size={12} />
          <span>Scheduled</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${roomFilter}`}
          initial={{ opacity: 0, x: activeTab === 'video' ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'video' ? -24 : 24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full"
        >
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
              <span className="text-sm font-semibold">Loading live rooms...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 sm:gap-6">
              {(Array.isArray(roomsList) ? roomsList : [])
                .filter(r => (r.mediaType || 'audio') === activeTab)
                .filter(r => {
                  const isFutureScheduled = r.scheduledFor && new Date(r.scheduledFor).getTime() > Date.now() && !r.isStartedNotificationSent;
                  if (roomFilter === 'live') return !isFutureScheduled;
                  if (roomFilter === 'scheduled') return !!isFutureScheduled;
                  return true;
                }).length === 0 ? (
                 <div className="col-span-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl text-center py-16 px-6 text-gray-500 dark:text-gray-400 shadow-sm relative overflow-hidden">
                    {/* Decorative glow blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-5 shadow-sm border border-orange-100/50 dark:border-orange-500/10">
                            {activeTab === 'video' ? <Video size={32} className="animate-pulse" /> : <Mic size={32} className="animate-pulse" />}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                          {roomFilter === 'scheduled' ? `No scheduled ${activeTab} rooms` : `No active ${activeTab} rooms`}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                          {roomFilter === 'scheduled'
                            ? `Schedule an upcoming ${activeTab} room session in advance so friends and attendees get notified!`
                            : `Be the first to start a live ${activeTab} room session today to discuss, connect, or learn together!`}
                        </p>
                        <button 
                          onClick={() => openCreateModal(activeTab)}
                          className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          {roomFilter === 'scheduled' ? 'Schedule a Room' : 'Create a Room'}
                        </button>
                    </div>
                 </div>
              ) : (
                (Array.isArray(roomsList) ? roomsList : [])
                  .filter(r => (r.mediaType || 'audio') === activeTab)
                  .filter(r => {
                    const isFutureScheduled = r.scheduledFor && new Date(r.scheduledFor).getTime() > Date.now() && !r.isStartedNotificationSent;
                    if (roomFilter === 'live') return !isFutureScheduled;
                    if (roomFilter === 'scheduled') return !!isFutureScheduled;
                    return true;
                  })
                  .map(room => {
                    const isFutureScheduled = room.scheduledFor && new Date(room.scheduledFor).getTime() > Date.now() && !room.isStartedNotificationSent;
                    const isHost = socialUser && socialUser.id?.toString() === room.creatorId?.toString();

                    return (
                      <div 
                        key={room.id} 
                        className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                          isFutureScheduled
                            ? 'border-amber-200/70 dark:border-amber-800/50 hover:border-amber-300'
                            : 'border-gray-100 dark:border-gray-700'
                        } p-3 sm:p-5 flex flex-col justify-between aspect-square relative group hover:-translate-y-1 duration-300 transition-all cursor-pointer`}
                        onClick={() => navigate(`/dashboard/live-rooms/${room.roomName}`)}
                      >
                        {/* Decorative background blur blob */}
                        <div className={`absolute -top-10 -right-10 w-24 h-24 ${
                          isFutureScheduled ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-orange-500/10 group-hover:bg-orange-500/20'
                        } rounded-full blur-2xl transition-all duration-300 pointer-events-none`}></div>

                        {/* Top bar: Badges & End Room */}
                        <div className="flex justify-between items-start gap-1 z-10 w-full">
                          <div className="flex flex-wrap items-center gap-1 min-w-0">
                            <span className="bg-orange-100/60 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                              {room.language}
                            </span>
                            {room.isPrivate ? (
                              <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Private Room">
                                <Lock size={9} className="shrink-0" />
                                <span className="text-[9px] font-extrabold uppercase tracking-wide">Private</span>
                              </span>
                            ) : room.isFriendsOnly ? (
                              <span className="bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Friends Only Room">
                                <Users size={9} className="shrink-0" />
                                <span className="text-[9px] font-extrabold uppercase tracking-wide">Friends</span>
                              </span>
                            ) : null}
                          </div>

                          {isHost && (
                            <button 
                              onClick={(e) => handleDeleteRoom(e, room.id)}
                              className="text-[9px] sm:text-[10px] font-bold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/40 px-1.5 py-0.5 rounded-lg transition-all z-20 cursor-pointer shrink-0"
                            >
                              End
                            </button>
                          )}
                        </div>

                        {/* Scheduled Countdown Banner if future */}
                        {isFutureScheduled && (
                          <div className="z-10 mt-1 mb-auto">
                            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/40 dark:border-amber-700/40 rounded-xl px-2 py-1 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 shadow-xs">
                              <span className="flex items-center gap-1 truncate">
                                <Calendar size={11} className="shrink-0 text-amber-500" />
                                <span className="truncate">{formatScheduledDate(room.scheduledFor)}</span>
                              </span>
                              <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ml-1">
                                {getTimeRemaining(room.scheduledFor)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Middle: Centered Icon + Room Title & Topic */}
                        <div className="flex flex-col items-center justify-center text-center my-auto px-1 z-10">
                          <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-2xl p-0.5 bg-gradient-to-tr ${
                            room.mediaType === 'video'
                              ? 'from-blue-500 to-indigo-500 shadow-blue-500/20'
                              : 'from-orange-500 to-amber-500 shadow-orange-500/20'
                          } shadow-lg mb-1.5 sm:mb-2.5 group-hover:scale-105 transition-transform duration-300 relative shrink-0`}>
                            <img 
                              src={room.creator.profilePicture || '/default-avatar.png'} 
                              alt={room.creator.name}
                              onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                              className="w-full h-full object-cover rounded-[12px] sm:rounded-xl bg-white dark:bg-gray-800"
                            />
                            <div className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                              {room.mediaType === 'video' ? (
                                <Video size={10} className="sm:size-[12px] text-blue-500" />
                              ) : (
                                <Mic size={10} className="sm:size-[12px] text-orange-500" />
                              )}
                            </div>
                          </div>
                          <h3 className="font-black text-gray-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1 px-0.5 uppercase tracking-wide">
                            {room.roomName.replace(/-\d+$/, '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h3>
                          <p className="text-gray-450 dark:text-gray-500 text-[10px] sm:text-xs font-bold mt-1 leading-tight line-clamp-2 px-1">
                            {room.topic}
                          </p>
                        </div>
                        
                        {/* Bottom: Creator and Action buttons */}
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60 pt-2 sm:pt-3 z-10 gap-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 truncate max-w-[55px] sm:max-w-[85px]">
                              {room.creator.name.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isFutureScheduled && (
                              <button
                                onClick={(e) => downloadIcs(e, room)}
                                title="Add to Calendar / Remind Me"
                                className="p-1 sm:p-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                              >
                                <Calendar size={13} />
                              </button>
                            )}

                            <button className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-gradient-to-r ${
                              room.mediaType === 'video'
                                ? 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/10 group-hover:shadow-blue-500/20'
                                : isFutureScheduled
                                  ? 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/10'
                                  : 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/10 group-hover:shadow-orange-500/20'
                            } text-white text-[9px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-md flex items-center gap-1`}>
                              {isFutureScheduled && isHost ? (
                                <>
                                  <Play size={10} className="fill-white" />
                                  <span>Start Now</span>
                                </>
                              ) : isFutureScheduled ? (
                                <span>Join</span>
                              ) : (
                                <span>Join</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-scale-up my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>Create Live Room</span>
                {newRoom.isScheduled && (
                  <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Scheduled
                  </span>
                )}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Room Name</label>
                <input 
                  type="text" 
                  value={newRoom.roomName}
                  onChange={(e) => setNewRoom({...newRoom, roomName: e.target.value})}
                  placeholder="e.g. english-speaking-club" 
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Language</label>
                <select 
                  value={newRoom.language}
                  onChange={(e) => setNewRoom({...newRoom, language: e.target.value})}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Room Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, mediaType: 'audio' })}
                    className={`flex-1 py-2 border rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoom.mediaType === 'audio'
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Mic size={14} />
                    <span>Audio Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, mediaType: 'video' })}
                    className={`flex-1 py-2 border rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoom.mediaType === 'video'
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Video size={14} />
                    <span>Video Room</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Visibility</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, visibility: 'public' })}
                    className={`py-2 px-1 border rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      newRoom.visibility === 'public'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Globe size={13} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, visibility: 'friends_only' })}
                    className={`py-2 px-1 border rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      newRoom.visibility === 'friends_only'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users size={13} />
                    <span>Friends Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRoom({ ...newRoom, visibility: 'private' });
                      fetchFriends();
                    }}
                    className={`py-2 px-1 border rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      newRoom.visibility === 'private'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Lock size={13} />
                    <span>Private</span>
                  </button>
                </div>
              </div>

              {/* Private Room Friend Picker & Solo Mode */}
              {newRoom.visibility === 'private' && (
                <div className="bg-purple-500/5 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl p-3 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Lock size={13} />
                      Invite Specific Friends
                    </span>
                    <span className="text-[10px] font-bold text-purple-600/80 dark:text-purple-400/80">
                      {selectedFriends.length === 0 ? 'Solo Practice (Study Alone)' : `${selectedFriends.length} invited`}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    Uninvited users cannot discover or enter this room. Leave all unselected to study alone in private.
                  </p>

                  {/* Friend search bar */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      placeholder="Search friends..."
                      className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-purple-200/50 dark:border-purple-800/40 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Friend checkboxes list */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {loadingFriends && (!friends || friends.length === 0) ? (
                      <div className="text-center py-3 text-[11px] text-gray-400">Loading friends...</div>
                    ) : filteredFriends.length === 0 ? (
                      <div className="text-center py-3 text-[11px] text-gray-400">
                        {(!friends || friends.length === 0) ? "You don't have added friends yet. You can still practice alone!" : "No friends match search."}
                      </div>
                    ) : (
                      filteredFriends.map(friend => {
                        const isSelected = selectedFriends.includes(friend.id);
                        return (
                          <div 
                            key={friend.id}
                            onClick={() => toggleFriendSelection(friend.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected 
                                ? 'bg-purple-500/15 border-purple-400 dark:border-purple-600' 
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-purple-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar 
                                src={friend.profilePicture} 
                                name={friend.name} 
                                className="w-6 h-6 rounded-full object-cover shrink-0 text-[10px]"
                              />
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                  {friend.name}
                                </span>
                                {friend.isCloseFriend && (
                                  <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-purple-600 border-purple-600 text-white' 
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                            }`}>
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── Schedule For Later Section ── */}
              <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl p-3 space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white">Schedule for Later</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Set future date & time for this room</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newRoom.isScheduled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewRoom({
                          ...newRoom,
                          isScheduled: checked,
                          scheduledFor: checked ? (newRoom.scheduledFor || getMinDateTime(30)) : ''
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {newRoom.isScheduled && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    <div>
                      <input 
                        type="datetime-local" 
                        min={getMinDateTime(2)}
                        value={newRoom.scheduledFor}
                        onChange={(e) => setNewRoom({ ...newRoom, scheduledFor: e.target.value })}
                        required={newRoom.isScheduled}
                        className="w-full bg-white dark:bg-gray-900 border border-amber-300/60 dark:border-amber-700/60 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>

                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setNewRoom({ ...newRoom, scheduledFor: getMinDateTime(15) })}
                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-lg transition"
                      >
                        +15 mins
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRoom({ ...newRoom, scheduledFor: getMinDateTime(60) })}
                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-lg transition"
                      >
                        +1 hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRoom({ ...newRoom, scheduledFor: getTonight8PM() })}
                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-lg transition"
                      >
                        Tonight 8 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRoom({ ...newRoom, scheduledFor: getTomorrow10AM() })}
                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-lg transition"
                      >
                        Tomorrow 10 AM
                      </button>
                    </div>

                    <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 flex items-center gap-1">
                      <Bell size={11} className="shrink-0" />
                      <span>Notifications will be sent automatically when the room is scheduled and when it starts.</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Topic (Optional)</label>
                <input 
                  type="text" 
                  value={newRoom.topic}
                  onChange={(e) => setNewRoom({...newRoom, topic: e.target.value})}
                  placeholder="e.g. Discuss daily topics" 
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
              </div>
              
              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button" 
                  disabled={creating}
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className={`flex-1 px-4 py-2 text-white font-bold text-xs shadow transition rounded-xl cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 ${
                    newRoom.isScheduled
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : newRoom.visibility === 'private'
                        ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                        : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  }`}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>{newRoom.isScheduled ? 'Scheduling...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>
                      {newRoom.isScheduled
                        ? 'Schedule Room'
                        : newRoom.visibility === 'private' && selectedFriends.length === 0
                          ? 'Start Solo Room'
                          : 'Create & Join'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Custom Confirmation Modal for ending room */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            {/* Close button at top-right */}
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setRoomToDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            >
              <X size={18} />
            </button>
            {/* Centered Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={26} className="text-red-500" />
            </div>

            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">End Live Session?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              Are you sure you want to end this session for everyone? This action cannot be undone.
            </p>

            {/* Buttons in One Row */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setRoomToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-500/20 transition cursor-pointer active:scale-95"
              >
                End Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
