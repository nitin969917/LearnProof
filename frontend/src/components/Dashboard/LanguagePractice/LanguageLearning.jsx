import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mic, Globe, Plus, Users, Search, GraduationCap, Video, PhoneOff, Trash2, X, Lock, UserCheck, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socialApi from '../../../api/socialApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import { getSocialSocket } from '../../../utils/socialSocket.js';
import UserAvatar from '../../Common/UserAvatar.jsx';

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
    visibility: 'public' // 'public' | 'friends_only' | 'private'
  });
  const friends = useSocialFeedStore(state => state.friends);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  const loadingFriends = useSocialFeedStore(state => state.loadingFriends);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(localStorage.getItem('languageRoomsTab') || 'audio'); // 'audio' or 'video'
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
      visibility: 'public' 
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
      
      const response = await socialApi.post('/language-rooms', {
        roomName: formattedRoomName,
        topic: newRoom.topic || 'General Discussion',
        language: newRoom.language,
        mediaType: newRoom.mediaType || 'audio',
        isPrivate,
        isFriendsOnly,
        invitedUserIds: isPrivate ? selectedFriends : []
      });
      
      setShowModal(false);
      navigate(`/dashboard/live-rooms/${response.data.roomName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.response?.data?.message || 'Failed to create room. Room name might already be in use.');
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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
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
              {(Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === activeTab).length === 0 ? (
                 <div className="col-span-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl text-center py-16 px-6 text-gray-500 dark:text-gray-400 shadow-sm relative overflow-hidden">
                    {/* Decorative glow blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-5 shadow-sm border border-orange-100/50 dark:border-orange-500/10">
                            {activeTab === 'video' ? <Video size={32} className="animate-pulse" /> : <Mic size={32} className="animate-pulse" />}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No active {activeTab} rooms</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-405 mb-6 leading-relaxed">Be the first to start a live {activeTab} room session today to discuss, connect, or learn together!</p>
                        <button 
                          onClick={() => openCreateModal(activeTab)}
                          className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          Create a Room
                        </button>
                    </div>
                 </div>
              ) : (
                (Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === activeTab).map(room => (
                  <div 
                    key={room.id} 
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex flex-col justify-between aspect-square relative group hover:-translate-y-1 duration-300 transition-all cursor-pointer"
                    onClick={() => navigate(`/dashboard/live-rooms/${room.roomName}`)}
                  >
                    {/* Decorative background blur blob */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-300 pointer-events-none"></div>

                    {/* Top bar: Language badge and End room button */}
                    <div className="flex justify-between items-center gap-1.5 z-10 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="bg-orange-100/60 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider truncate">
                          {room.language}
                        </span>
                        {room.isPrivate ? (
                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Private Room">
                            <Lock size={10} className="shrink-0" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wide">Private</span>
                          </span>
                        ) : room.isFriendsOnly ? (
                          <span className="bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Friends Only Room">
                            <Users size={10} className="shrink-0" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wide">Friends</span>
                          </span>
                        ) : null}
                      </div>
                      {socialUser && socialUser.id?.toString() === room.creatorId?.toString() && (
                        <button 
                          onClick={(e) => handleDeleteRoom(e, room.id)}
                          className="text-[9px] sm:text-xs font-bold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/40 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all z-20 cursor-pointer"
                        >
                          End
                        </button>
                      )}
                    </div>

                    {/* Middle: Centered Icon + Room Title & Topic */}
                    <div className="flex flex-col items-center justify-center text-center my-auto px-1 z-10">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[14px] sm:rounded-2xl p-0.5 bg-gradient-to-tr ${
                        room.mediaType === 'video'
                          ? 'from-blue-500 to-indigo-500 shadow-blue-500/20'
                          : 'from-orange-500 to-amber-500 shadow-orange-500/20'
                      } shadow-lg mb-2 sm:mb-4 group-hover:scale-105 transition-transform duration-300 relative shrink-0`}>
                        <img 
                          src={room.creator.profilePicture || '/default-avatar.png'} 
                          alt={room.creator.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                          className="w-full h-full object-cover rounded-[12px] sm:rounded-xl bg-white dark:bg-gray-800"
                        />
                        <div className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                          {room.mediaType === 'video' ? (
                            <Video size={10} className="sm:size-[14px] text-blue-500" />
                          ) : (
                            <Mic size={10} className="sm:size-[14px] text-orange-500" />
                          )}
                        </div>
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white text-xs sm:text-sm md:text-base leading-snug line-clamp-1 px-0.5 uppercase tracking-wide">
                        {room.roomName.replace(/-\d+$/, '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </h3>
                      <p className="text-gray-450 dark:text-gray-500 text-[10px] sm:text-xs font-bold mt-1.5 leading-tight line-clamp-2 px-1">
                        {room.topic}
                      </p>
                    </div>
                    
                    {/* Bottom: Creator and Join button */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60 pt-3 sm:pt-4 z-10">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 truncate max-w-[65px] sm:max-w-[100px]">
                          {room.creator.name.split(' ')[0]}
                        </span>
                      </div>
                      <button className={`px-2.5 py-1 sm:px-4 sm:py-2 bg-gradient-to-r ${
                        room.mediaType === 'video'
                          ? 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/10 group-hover:shadow-blue-500/20'
                          : 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/10 group-hover:shadow-orange-500/20'
                      } text-white text-[9px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-md shadow-orange-500/10 group-hover:shadow-orange-500/20`}>
                        Join
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-scale-up my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">Create Live Room</h2>
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
                    newRoom.visibility === 'private'
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                      : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  }`}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>{newRoom.visibility === 'private' && selectedFriends.length === 0 ? 'Start Solo Room' : 'Create & Join'}</span>
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
