import { useState, useEffect, useRef } from 'react';
import { Search, Gift, Users, Share2, Copy, Check, MoreVertical, ChevronRight, Lock, Unlock, MessageSquareMore, UserPlus, UserCheck, Sparkles, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import socialApi from '../../../api/socialApi.js';
import { useSocialGroupsStore } from '../../../store/useSocialGroupsStore.js';
import UserAvatar from '../../Common/UserAvatar.jsx';

export default function DiscoverTab({ onViewProfile, onSelectChatUser }) {
  const [searchType, setSearchType] = useState('students'); // 'students' or 'groups'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [viewAllSuggested, setViewAllSuggested] = useState(false);
  const searchInputRef = useRef(null);

  // Referral code state
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Groups from shared store
  const storeGroups = useSocialGroupsStore(state => state.groups);
  const fetchStoreGroups = useSocialGroupsStore(state => state.fetchGroups);
  const hasLoadedGroups = useSocialGroupsStore(state => state.hasLoadedGroups);

  // Join Private Group Modal states
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(null);
  const [joinKey, setJoinKey] = useState('');

  // Fetch suggested users, groups & referral info on mount
  useEffect(() => {
    const fetchSuggested = async () => {
      setLoadingSuggested(true);
      try {
        const response = await socialApi.get('/users/suggested?limit=24');
        setSuggestedUsers(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to fetch suggested users:', err);
      } finally {
        setLoadingSuggested(false);
      }
    };

    const fetchReferralCode = async () => {
      try {
        const res = await socialApi.get('/referrals/my-code');
        if (res.data?.success) {
          setReferralData(res.data);
        }
      } catch (err) {
        console.debug('Failed to fetch personal referral code:', err?.message);
      }
    };

    fetchSuggested();
    fetchReferralCode();
    fetchStoreGroups();
  }, []);

  const getShareUrl = () => {
    if (!referralData?.referralCode) return '';
    const origin = window.location.origin;
    return `${origin}/?ref=${referralData.referralCode}`;
  };

  const handleCopyCode = (e) => {
    e.stopPropagation();
    const code = referralData?.referralCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Referral code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = getShareUrl();
    const code = referralData?.referralCode;
    if (!code) return;

    const shareData = {
      title: 'LearnProof AI - Master Any Subject',
      text: `Hey! Join me on LearnProof AI to learn from any YouTube playlist with AI notes, quizzes, and live study rooms. Use my invite code: ${code}`,
      url: shareUrl || window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.debug('Native share error:', err);
        }
      }
    }

    // Fallback: Copy link & open WhatsApp
    navigator.clipboard.writeText(shareUrl || code);
    toast.success('Referral link copied!');
    const text = encodeURIComponent(`Hey! Join me on LearnProof AI to learn from any YouTube playlist with AI notes, quizzes, and live study rooms: ${shareUrl || code}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSearch = async (searchQuery = query) => {
    if (searchType === 'groups') return;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await socialApi.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to search community:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e, studentId) => {
    e.stopPropagation();
    try {
      await socialApi.post('/social/friend-request', { receiverId: studentId });
      setSentRequests(prev => [...prev, studentId]);
      toast.success('Friend request sent!');
    } catch (err) {
      console.error('Failed to send friend request:', err);
      toast.error(err.response?.data?.error || 'Failed to send request');
    }
  };

  const handleJoinGroup = async (group, keyToUse = '') => {
    try {
      await socialApi.post('/groups/join', {
        groupId: group.id,
        entryKey: keyToUse,
      });
      setShowJoinGroupModal(null);
      setJoinKey('');
      toast.success('Joined group!');
      await fetchStoreGroups(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to join group');
    }
  };

  const filteredGroups = storeGroups.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(query.toLowerCase()))
  );

  const getFriendshipState = (student) => {
    const isSent = sentRequests.includes(student.id);
    if (isSent) {
      return { isConnected: false, isPending: true, label: "Requested" };
    }
    
    if (student.friendshipStatus === 'accepted') {
      return { isConnected: true, isPending: false, label: "Connected" };
    }
    
    if (student.friendshipStatus === 'pending') {
      return { isConnected: false, isPending: true, label: "Requested" };
    }
    
    return { isConnected: false, isPending: false, label: "Follow" };
  };

  const getGroupInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GP';
  };

  const isUserSearching = hasSearched && query.trim().length > 0;
  const displayedSuggestedUsers = viewAllSuggested ? suggestedUsers : suggestedUsers.slice(0, 10);

  const renderReferralCard = () => (
    <div className="bg-[#FFF7F2] dark:bg-gray-800/90 rounded-2xl border border-orange-100/70 dark:border-gray-700 p-4 sm:p-4.5 flex flex-col gap-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#FFEAE0] dark:bg-orange-950/50 text-[#FF5722] flex items-center justify-center shrink-0">
          <Gift size={20} className="stroke-[1.75]" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-snug">
            Refer & Learn
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            Invite friends and learn together.
          </p>
        </div>
      </div>

      {/* Code Box + Share Button */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-gray-850 border border-orange-100/90 dark:border-gray-700 rounded-2xl px-3.5 py-2 flex items-center justify-between flex-1 shadow-xs min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] text-gray-400 font-medium leading-none">Your code</div>
            <div className="text-sm sm:text-base font-black text-[#FF5722] tracking-wider font-mono uppercase mt-0.5 truncate">
              {referralData?.referralCode || 'LPVIP'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-400 hover:text-[#FF5722] transition cursor-pointer shrink-0 ml-2"
            title="Copy code"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="bg-[#FF5722] hover:bg-[#F4511E] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md lg:max-w-6xl mx-auto py-1 px-3 sm:px-0">
      
      {/* ── Responsive Dashboard Layout (Single column on mobile, 2-column grid on laptop/desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Content Column (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* 1. Search Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-1.5 pl-3.5 shadow-sm flex items-center gap-2.5 transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-300"
          >
            <Search size={18} className="text-gray-400 shrink-0" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setHasSearched(false);
                  setResults([]);
                }
              }}
              placeholder={searchType === 'students' ? "Search people, colleges, interests..." : "Search groups by name or topic..."}
              className="flex-1 min-w-0 bg-transparent border-none text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-medium"
            />
            {query && (
              <button 
                type="button"
                onClick={() => { 
                  setQuery(''); 
                  setResults([]); 
                  setHasSearched(false); 
                }}
                className="px-1 text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (searchType === 'groups' && !query.trim())}
              className="w-9 h-9 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Search"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search size={16} strokeWidth={2.25} />
              )}
            </button>
          </form>

          {/* 2. Section Selector (People vs Discussion Groups) */}
          <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl border border-gray-200/80 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setSearchType('students');
                if (hasSearched && query.trim()) handleSearch();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                searchType === 'students'
                  ? 'bg-white dark:bg-gray-700 text-[#FF5722] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Users size={14} />
              <span>People</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchType('groups');
                if (!hasLoadedGroups) fetchStoreGroups();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                searchType === 'groups'
                  ? 'bg-white dark:bg-gray-700 text-[#FF5722] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <MessageSquareMore size={14} />
              <span>Groups ({storeGroups.length})</span>
            </button>
          </div>


          {/* 4. CONTENT SECTIONS */}
          {/* ── A) PEOPLE TAB / SEARCH RESULTS ── */}
          {searchType === 'students' && (
            <div className="flex flex-col gap-2.5">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  {isUserSearching ? `Search Results (${results.length})` : 'Suggested Users'}
                </h3>
                {!isUserSearching && suggestedUsers.length > 4 && (
                  <button 
                    type="button"
                    onClick={() => setViewAllSuggested(!viewAllSuggested)}
                    className="text-[#FF5722] hover:text-orange-600 font-semibold text-xs flex items-center gap-0.5 cursor-pointer transition"
                  >
                    <span>{viewAllSuggested ? 'Show Less' : 'View All'}</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* Loading state */}
              {loading || loadingSuggested ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 px-4 animate-pulse flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-750 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isUserSearching && results.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-400 text-xs">
                  No users found for "{query}". Try a different name, major, or college.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {(isUserSearching ? results : displayedSuggestedUsers).map((student) => {
                    const fState = getFriendshipState(student);
                    const subtitle = [student.department, student.collegeName].filter(Boolean).join(' • ') || student.bio || '';

                    return (
                      <div
                        key={student.id}
                        onClick={() => onViewProfile && onViewProfile(student.id)}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-3 px-3.5 shadow-xs hover:shadow-sm hover:border-orange-200 dark:hover:border-gray-650 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        {/* Avatar */}
                        <UserAvatar
                          src={student.profilePicture}
                          name={student.name}
                          className="w-12 h-12 rounded-full shrink-0"
                          textClassName="text-base font-bold"
                        />

                        {/* Name & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-[#FF5722] transition-colors truncate">
                            {student.name}
                          </h4>
                          {subtitle ? (
                            <p className="text-gray-400 dark:text-gray-500 text-xs font-normal mt-0.5 truncate max-w-[150px] sm:max-w-xs">
                              {subtitle}
                            </p>
                          ) : null}
                        </div>

                        {/* Right Actions: Icon-Only Follow/Connect Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {fState.isConnected ? (
                            <button
                              type="button"
                              disabled
                              className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center justify-center cursor-default"
                              title="Connected"
                            >
                              <UserCheck size={16} />
                            </button>
                          ) : fState.isPending ? (
                            <button
                              type="button"
                              disabled
                              className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 flex items-center justify-center cursor-default"
                              title="Requested"
                            >
                              <Check size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleConnect(e, student.id)}
                              className="w-9 h-9 rounded-full border border-[#FF5722] text-[#FF5722] hover:bg-[#FF5722] hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                              title="Follow / Connect"
                            >
                              <UserPlus size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewProfile && onViewProfile(student.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer"
                            title="View profile"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── B) GROUPS TAB / RESULTS ── */}
          {searchType === 'groups' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Discussion Groups ({filteredGroups.length})
                </h3>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-400 text-xs">
                  No discussion groups found {query ? `matching "${query}"` : ''}.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {filteredGroups.map((group) => {
                    const initials = getGroupInitials(group.name);
                    return (
                      <div 
                        key={group.id} 
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-3.5 shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white bg-gradient-to-tr from-emerald-500 to-teal-600 shrink-0 shadow-xs">
                            {initials}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{group.name}</h4>
                              {group.isPrivate ? (
                                <span className="flex items-center gap-0.5 text-[9px] text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded font-bold uppercase">
                                  <Lock size={8} /> Private
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[9px] text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded font-bold uppercase">
                                  <Unlock size={8} /> Public
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                              {group.memberCount} members • {group.description || 'Community discussion group'}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {group.isJoined ? (
                            <button
                              onClick={() => onSelectChatUser && onSelectChatUser({ ...group, type: 'group' })}
                              className="border border-[#FF5722] text-[#FF5722] hover:bg-[#FF5722] hover:text-white font-semibold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1"
                            >
                              <MessageSquareMore size={12} />
                              <span>Chat</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (group.isPrivate) {
                                  setShowJoinGroupModal(group);
                                } else {
                                  handleJoinGroup(group);
                                }
                              }}
                              className="bg-[#FF5722] hover:bg-[#F4511E] text-white font-semibold text-xs px-4 py-1.5 rounded-full transition shadow-xs"
                            >
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mobile-only Refer & Learn Card (Positioned below search results) */}
          <div className="block lg:hidden mt-2">
            {renderReferralCard()}
          </div>
        </div>

        {/* Desktop Sidebar (4 cols on desktop: Refer & Learn Card + Community info) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-6">
          {renderReferralCard()}

          {/* Desktop Community Spotlight Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4.5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center">
                <Compass size={18} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Community Spotlight</h4>
                <p className="text-[11px] text-gray-400 font-medium">Connect & learn together</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
              Search by subjects, colleges, and shared goals to connect with peers, study in live rooms, or join discussions.
            </p>
          </div>
        </div>

      </div>

      {/* Join Private Group Modal */}
      <AnimatePresence>
        {showJoinGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            >
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Lock size={18} className="text-red-500" />
                <span>Join Private Group</span>
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed font-bold">
                The group <strong className="text-gray-700 dark:text-gray-200">"{showJoinGroupModal.name}"</strong> is private. Please enter the Entry Key to join.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleJoinGroup(showJoinGroupModal, joinKey);
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  required
                  placeholder="Enter Key"
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm text-center font-mono font-bold tracking-widest uppercase"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinGroupModal(null);
                      setJoinKey('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-extrabold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#FF5722] hover:bg-[#F4511E] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/10 transition cursor-pointer"
                  >
                    Verify Key
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
