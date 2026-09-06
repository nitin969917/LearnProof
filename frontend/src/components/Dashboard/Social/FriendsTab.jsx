import { useState, useEffect, useRef } from 'react';
import { 
  Users, Clock, UserCheck, Check, X, Star, MessageSquare, 
  UserX, Search, Compass, ChevronRight, MoreVertical, 
  ArrowRight, User, GraduationCap, SlidersHorizontal, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import socialApi from '../../../api/socialApi.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import { useModal } from '../../../context/ModalContext.jsx';
import UserAvatar from '../../Common/UserAvatar.jsx';
import { motion, AnimatePresence } from 'framer-motion';

function formatTimeAgo(dateString) {
  if (!dateString) return 'recently';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSec = Math.floor((now - date) / 1000);
  
  if (diffInSec < 60) return 'just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
}

export default function FriendsTab({ onViewProfile, onSelectChatUser }) {
  const navigate = useNavigate();
  const friends = useSocialFeedStore(state => state.friends);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  const loadingFriends = useSocialFeedStore(state => state.loadingFriends);
  const hasLoadedFriends = useSocialFeedStore(state => state.hasLoadedFriends);
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);
  const { confirm } = useModal();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('connections'); // 'connections' | 'pending'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'name' | 'online'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeMenuFriendId, setActiveMenuFriendId] = useState(null);

  const sortDropdownRef = useRef(null);

  // Fetch and sync pending requests
  const syncPending = async () => {
    try {
      const response = await socialApi.get('/social/friendships');
      setPendingRequests(Array.isArray(response.data?.pending) ? response.data.pending : []);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    }
  };

  useEffect(() => {
    fetchFriends();
    syncPending();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
      if (!e.target.closest('.friend-menu-container')) {
        setActiveMenuFriendId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCloseFriend = async (friendId) => {
    // Optimistic update in store
    useSocialFeedStore.setState(state => ({
      friends: state.friends.map(f => f.id === friendId ? { ...f, isCloseFriend: !f.isCloseFriend } : f),
      closeFriends: state.friends.filter(f => f.id === friendId ? !f.isCloseFriend : f.isCloseFriend),
    }));
    try {
      await socialApi.post('/social/toggle-close-friend', { friendId });
      fetchFriends();
    } catch (err) {
      console.error('Failed to toggle close friend', err);
      fetchFriends();
    }
  };

  const handleAccept = async (requestId) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      await socialApi.post(`/social/friend-request/${requestId}/accept`);
      fetchFriends(true);
      syncPending();
    } catch (err) {
      console.error('Failed to accept request', err);
      syncPending();
    }
  };

  const handleRemoveFriend = async (userId, name) => {
    setActiveMenuFriendId(null);
    const confirmed = await confirm({
      title: 'Remove Connection?',
      message: `You'll remove ${name} from your connections. They won't be notified.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await socialApi.post('/social/remove-friendship', { targetUserId: userId });
      fetchFriends();
      syncPending();
    } catch (err) {
      console.error('Failed to remove friendship', err);
    }
  };

  const handleIgnoreRequest = async (senderId, name) => {
    const confirmed = await confirm({
      title: 'Decline Request?',
      message: `Decline the connection request from ${name}?`,
      confirmText: 'Decline',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!confirmed) return;
    try {
      await socialApi.post('/social/remove-friendship', { targetUserId: senderId });
      fetchFriends();
      syncPending();
    } catch (err) {
      console.error('Failed to ignore request', err);
    }
  };

  // Filter and sort connections
  const filteredFriends = friends
    .filter((friend, idx, self) => self.findIndex(f => f.id === friend.id) === idx)
    .filter(friend => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = (friend.name || '').toLowerCase();
      const college = (friend.collegeName || '').toLowerCase();
      const department = (friend.department || '').toLowerCase();
      const email = (friend.email || '').toLowerCase();
      return name.includes(q) || college.includes(q) || department.includes(q) || email.includes(q);
    })
    .sort((a, b) => {
      const isAOnline = onlineUserIds.some(id => id.toString() === a.id.toString());
      const isBOnline = onlineUserIds.some(id => id.toString() === b.id.toString());
      if (sortBy === 'online') {
        if (isAOnline !== isBOnline) return isAOnline ? -1 : 1;
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      // 'recent' by default
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  if (loadingFriends && !hasLoadedFriends) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-3"></div>
        <span className="text-xs font-bold text-gray-400">Syncing connections...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* ── Top Header Section (Desktop Banner + Page Title) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Friends
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
            Connect, collaborate and grow with fellow learners.
          </p>
        </div>

        {/* Desktop Header Promo Banner */}
        <div 
          onClick={() => navigate('/dashboard/social/discover')}
          className="hidden sm:flex items-center justify-between gap-4 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-white dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800 p-3.5 sm:px-4 sm:py-3 rounded-2xl border border-orange-200/70 dark:border-gray-700 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/20 shrink-0">
              <Users size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                Build Your Learning Network
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Find and connect with people from your college, courses or areas of interest.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 border border-orange-500 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
          >
            <span>Explore Community</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Mobile Top Promo Card ── */}
      <div 
        onClick={() => navigate('/dashboard/social/discover')}
        className="sm:hidden flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-white dark:from-gray-800 dark:to-gray-800/90 rounded-2xl border border-orange-200/70 dark:border-gray-700 shadow-2xs cursor-pointer active:scale-98 transition"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/20 shrink-0">
            <Users size={20} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Grow Your Network</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              Connect with fellow learners, share ideas and make progress together.
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-orange-500 shrink-0 ml-2" />
      </div>

      {/* ── Mobile Segmented Control Pills (My Connections vs Pending Requests) ── */}
      <div className="sm:hidden flex items-center bg-gray-100/90 dark:bg-gray-800/90 p-1 rounded-full border border-gray-200/80 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setMobileTab('connections')}
          className={`flex-1 py-2.5 px-4 rounded-full font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'connections'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'
          }`}
        >
          <span>My Connections</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'connections' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {friends.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('pending')}
          className={`flex-1 py-2.5 px-4 rounded-full font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'pending'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'
          }`}
        >
          <span>Pending Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Main 2-Column Desktop Grid / Tabbed Mobile View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Pending Requests ── */}
        <div className={`lg:col-span-5 flex-col gap-4 ${mobileTab === 'pending' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 shadow-2xs space-y-4">
            
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-750 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
                  <Clock size={15} />
                </div>
                <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                  Pending Requests
                </h2>
                {pendingRequests.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              
              {pendingRequests.length > 0 && (
                <span className="text-xs font-bold text-orange-500">
                  {pendingRequests.length} Waiting
                </span>
              )}
            </div>

            {/* Pending Requests List */}
            <div className="space-y-3.5">
              {pendingRequests.map((req) => {
                const sender = req.sender || {};
                const senderSubtitle = sender.department 
                  ? `${sender.department}${sender.collegeName ? ` • ${sender.collegeName}` : ''}`
                  : (sender.collegeName || 'Student • Community Member');

                return (
                  <div 
                    key={req.id}
                    className="p-4 rounded-2xl bg-orange-50/35 dark:bg-gray-900 border border-orange-100/70 dark:border-gray-800 space-y-3 transition hover:shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div 
                        onClick={() => onViewProfile(sender.id)}
                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                      >
                        <UserAvatar 
                          src={sender.profilePicture} 
                          name={sender.name} 
                          className="w-11 h-11 rounded-full border-2 border-white dark:border-gray-800 shadow-2xs object-cover" 
                          textClassName="text-base font-bold"
                        />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate hover:text-orange-500 transition-colors">
                            {sender.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {senderSubtitle}
                          </p>
                          <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                            Wants to be your friend
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium shrink-0">
                        {formatTimeAgo(req.createdAt)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleIgnoreRequest(sender.id, sender.name)}
                        className="w-full py-2 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 active:scale-95 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X size={14} className="stroke-[2.5]" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {pendingRequests.length === 0 && (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                    <Clock size={22} className="opacity-60" />
                  </div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No Pending Requests</p>
                  <p className="text-[11px] max-w-xs mx-auto">When other learners send you connection requests, they'll appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: My Connections ── */}
        <div className={`lg:col-span-7 flex-col gap-4 ${mobileTab === 'connections' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 shadow-2xs space-y-4">
            
            {/* Card Header with Sort Dropdown */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 dark:border-gray-750 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
                  <UserCheck size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                  My Connections <span className="text-gray-400 font-bold text-xs">({friends.length})</span>
                </h2>
              </div>

              {/* Sort Selector Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 transition cursor-pointer shadow-2xs"
                >
                  <SlidersHorizontal size={12} className="text-orange-500" />
                  <span>
                    Sort: {sortBy === 'recent' ? 'Recently Added' : sortBy === 'name' ? 'Name (A-Z)' : 'Online First'}
                  </span>
                  <ChevronRight size={13} className={`transition-transform duration-200 ${showSortDropdown ? 'rotate-90' : 'rotate-0'}`} />
                </button>

                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-30 min-w-[160px] p-1.5 space-y-1"
                    >
                      {[
                        { id: 'recent', label: 'Recently Added' },
                        { id: 'name', label: 'Name (A-Z)' },
                        { id: 'online', label: 'Online First' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                            sortBy === opt.id
                              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.id && <Check size={13} className="text-orange-500" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search friends by name, college or major..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Friend Cards List */}
            <div className="space-y-3">
              {filteredFriends.map((friend) => {
                const isFriendOnline = onlineUserIds.some(id => id.toString() === friend.id.toString());
                const friendSubtitle = friend.department 
                  ? `${friend.department}${friend.collegeName ? ` • ${friend.collegeName}` : ''}`
                  : (friend.collegeName || 'Student • LearnProof Community');

                return (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-150 dark:border-gray-750 hover:border-orange-200 dark:hover:border-gray-650 hover:shadow-xs transition relative group"
                  >
                    {/* User Profile Info with Online Badge */}
                    <div 
                      onClick={() => onViewProfile(friend.id)}
                      className="flex items-center gap-3.5 cursor-pointer min-w-0 flex-1"
                    >
                      <div className="relative flex-shrink-0">
                        <UserAvatar 
                          src={friend.profilePicture} 
                          name={friend.name} 
                          className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 shadow-2xs object-cover" 
                          textClassName="text-lg font-bold"
                        />
                        <div 
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-800 rounded-full z-10 ${
                            isFriendOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`} 
                        />
                      </div>

                      <div className="min-w-0 text-left">
                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                          {friend.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[11px] font-bold ${isFriendOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                            ● {isFriendOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {friendSubtitle}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons: Star, Message, 3 Dots */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Close Friend Star */}
                      <button
                        type="button"
                        onClick={() => toggleCloseFriend(friend.id)}
                        className={`p-2 rounded-xl transition active:scale-90 cursor-pointer ${
                          friend.isCloseFriend
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={friend.isCloseFriend ? 'Close Friend' : 'Add to Close Friends'}
                      >
                        <Star size={18} fill={friend.isCloseFriend ? 'currentColor' : 'transparent'} strokeWidth={2} />
                      </button>

                      {/* Chat / Message */}
                      <button
                        type="button"
                        onClick={() => onSelectChatUser && onSelectChatUser(friend)}
                        className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-xl transition active:scale-90 cursor-pointer"
                        title="Send Message"
                      >
                        <MessageSquare size={18} />
                      </button>

                      {/* 3 Dots Menu */}
                      <div className="relative friend-menu-container">
                        <button
                          type="button"
                          onClick={() => setActiveMenuFriendId(activeMenuFriendId === friend.id ? null : friend.id)}
                          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition active:scale-90 cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical size={18} />
                        </button>

                        <AnimatePresence>
                          {activeMenuFriendId === friend.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 4 }}
                              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-30 min-w-[170px] p-1.5 space-y-1"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFriendId(null);
                                  onViewProfile(friend.id);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 transition flex items-center gap-2 cursor-pointer"
                              >
                                <Eye size={14} />
                                <span>View Profile</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFriendId(null);
                                  onSelectChatUser && onSelectChatUser(friend);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 transition flex items-center gap-2 cursor-pointer"
                              >
                                <MessageSquare size={14} />
                                <span>Send Message</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFriendId(null);
                                  toggleCloseFriend(friend.id);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 transition flex items-center gap-2 cursor-pointer"
                              >
                                <Star size={14} />
                                <span>{friend.isCloseFriend ? 'Remove Close Friend' : 'Add to Close Friends'}</span>
                              </button>

                              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                              <button
                                type="button"
                                onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-2 cursor-pointer"
                              >
                                <UserX size={14} />
                                <span>Remove Connection</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty Search State */}
              {friends.length > 0 && filteredFriends.length === 0 && (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <Search size={32} className="mx-auto text-orange-400 opacity-50 mb-2" />
                  <p className="font-extrabold text-sm text-gray-800 dark:text-gray-200">
                    No connections matching "{searchQuery}"
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                </div>
              )}

              {/* Empty Connections State */}
              {friends.length === 0 && (
                <div className="py-16 text-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200/80 dark:border-gray-700 rounded-3xl p-6 space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto shadow-2xs">
                    <UserCheck size={28} />
                  </div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white">
                    No Connections Yet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Build your study group and connect with classmates from your university, subjects, and live study rooms!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/social/discover')}
                    className="mt-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-extrabold text-xs transition shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Compass size={15} />
                    <span>Explore Community</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

