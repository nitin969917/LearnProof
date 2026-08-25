import { useState, useEffect, useRef } from 'react';
import { Search, Compass, GraduationCap, MapPin, ArrowRight, ArrowLeft, UserCheck, Check, UserPlus, Users, MessageSquare, Lock, Unlock, Sparkles, MessageSquareMore, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const searchInputRef = useRef(null);

  // Groups from shared store (pre-fetched by GroupsTab/ChatsTab)
  const storeGroups = useSocialGroupsStore(state => state.groups);
  const fetchStoreGroups = useSocialGroupsStore(state => state.fetchGroups);
  const hasLoadedGroups = useSocialGroupsStore(state => state.hasLoadedGroups);

  // Join Private Group Modal states
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(null);
  const [joinKey, setJoinKey] = useState('');

  // Trigger search or fetch when query or searchType changes
  useEffect(() => {
    if (searchType === 'groups') {
      // Use store if already loaded, else fetch
      if (!hasLoadedGroups) {
        fetchStoreGroups();
      }
    } else {
      // Clear results, let typing trigger students search
      if (!query.trim()) {
        setResults([]);
      }
    }
  }, [searchType]);

  const handleSearch = async (searchQuery = query) => {
    if (searchType !== 'students') return;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await socialApi.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data);
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
    } catch (err) {
      console.error('Failed to send friend request:', err);
      alert(err.response?.data?.error || 'Failed to send request');
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
      // Refresh shared groups store to reflect "joined" state
      await fetchStoreGroups(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to join group');
    }
  };

  // Filter groups locally based on query (from shared store)
  const filteredGroups = storeGroups.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(query.toLowerCase()))
  );

  const getFriendshipState = (student) => {
    const isSent = sentRequests.includes(student.id);
    if (isSent) {
      return { isConnected: false, isPending: true, label: "Request Sent", icon: <Check size={16} /> };
    }
    
    if (student.friendshipStatus === 'accepted') {
      return { isConnected: true, isPending: false, label: "Connected", icon: <UserCheck size={16} /> };
    }
    
    if (student.friendshipStatus === 'pending') {
      if (student.isFriendshipSender) {
        return { isConnected: false, isPending: true, label: "Request Sent", icon: <Check size={16} /> };
      } else {
        return { isConnected: false, isPending: true, label: "Incoming Request", icon: <Check size={16} /> };
      }
    }
    
    return { isConnected: false, isPending: false, label: "Connect", icon: <UserPlus size={16} /> };
  };

  const getGroupInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GP';
  };

  const isSearching = (searchType === 'students' ? hasSearched : (hasSearched || (searchType === 'groups' && hasLoadedGroups)));

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-md mx-auto py-2 sm:py-4 px-3 sm:px-0">
      
      {/* ── LANDING VIEW: MATCHING TARGET SCREENSHOT ── */}
      {!isSearching && (
        <div className="flex flex-col gap-6 w-full">
          
          {/* Header Section (Desktop only - mobile uses TopBar subtabs) */}
          <div className="hidden lg:flex flex-col items-center text-center gap-4 mt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/10 shrink-0">
              <Users size={26} />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mt-1">
                Social <span className="text-orange-500">Explorer</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-semibold leading-relaxed mt-2 max-w-xs mx-auto">
                Find people in the community to connect and collaborate.
              </p>
            </div>
          </div>

          {/* Card 1: Search Students */}
          <div 
            onClick={() => {
              setSearchType('students');
              searchInputRef.current?.focus();
            }}
            className="bg-white dark:bg-gray-900 hover:bg-orange-50/5 dark:hover:bg-gray-800/20 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-500/10">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Search Students</h3>
                <p className="text-gray-405 dark:text-gray-500 text-xs mt-0.5 font-bold leading-normal">Find and connect with students in the community.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* ── Search Bar (Identical style & size to Learning Hub Explorer) ── */}
          <form 
            onSubmit={(e) => { e.preventDefault(); if (searchType === 'students') handleSearch(); }}
            className="relative w-full group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl sm:rounded-[2rem] blur-xl group-focus-within:blur-2xl transition-all duration-500 opacity-60"></div>
            <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-500 focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500/30">
              <div className="pl-3 sm:pl-4 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <input 
                ref={searchInputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people, colleges, interests..."
                className="flex-1 min-w-0 bg-transparent border-none py-2.5 sm:py-3.5 px-2 sm:px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 outline-none text-sm sm:text-base font-semibold"
              />
              <div className="flex items-center gap-1.5 shrink-0 pr-1">
                {query && (
                  <button 
                    type="button"
                    onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
                    className="px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Search</span>
                      <span className="sm:hidden"><Search size={16} /></span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Card 2: Build your network */}
          <div 
            onClick={() => {
              setSearchType('groups');
              if (!hasLoadedGroups) {
                fetchStoreGroups();
              }
            }}
            className="bg-white dark:bg-gray-900 hover:bg-orange-50/5 dark:hover:bg-gray-800/20 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
          >
            <div className="flex items-center gap-4 text-left min-w-0 flex-1">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-500/10">
                <Users size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  Build your <span className="text-orange-500">network</span>
                </h3>
                <p className="text-gray-405 dark:text-gray-500 text-xs mt-0.5 font-bold leading-normal">Explore the community and make meaningful connections.</p>
              </div>
            </div>
            <div className="flex sm:justify-end w-full sm:w-auto pl-16 sm:pl-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchType('groups');
                  if (!hasLoadedGroups) {
                    fetchStoreGroups();
                  }
                }}
                className="text-[10px] sm:text-xs border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-extrabold px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 w-fit"
              >
                <span>Start Exploring</span>
                <ChevronRight size={12} strokeWidth={3} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── ACTIVE SEARCH RESULTS VIEW ── */}
      {isSearching && (
        <div className="flex flex-col gap-4 w-full animate-in fade-in duration-200">
          
          {/* Back action and selector header row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setSearchType('students');
                setHasSearched(false);
              }}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-550 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400 transition cursor-pointer bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3.5 py-2 rounded-xl"
            >
              <ArrowLeft size={13} />
              <span>Back to Explorer</span>
            </button>
            
            <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setSearchType('students');
                  setQuery('');
                  setResults([]);
                  setHasSearched(false);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                  searchType === 'students'
                    ? 'bg-white dark:bg-gray-850 text-orange-500 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-450 hover:text-gray-800'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => {
                  setSearchType('groups');
                  setQuery('');
                  if (!hasLoadedGroups) {
                    fetchStoreGroups();
                  }
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                  searchType === 'groups'
                    ? 'bg-white dark:bg-gray-850 text-orange-500 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-450 hover:text-gray-800'
                }`}
              >
                Groups
              </button>
            </div>
          </div>

          {/* ── Active Search Bar (Identical style & size to Learning Hub Explorer) ── */}
          <form 
            onSubmit={(e) => { e.preventDefault(); if (searchType === 'students') handleSearch(); }}
            className="relative w-full group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl sm:rounded-[2rem] blur-xl group-focus-within:blur-2xl transition-all duration-500 opacity-60"></div>
            <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-500 focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500/30">
              <div className="pl-3 sm:pl-4 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <input 
                ref={searchInputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === 'students' ? "Search people, colleges, interests..." : "Search groups by name or description..."}
                className="flex-1 min-w-0 bg-transparent border-none py-2.5 sm:py-3.5 px-2 sm:px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 outline-none text-sm sm:text-base font-semibold"
              />
              <div className="flex items-center gap-1.5 shrink-0 pr-1">
                {query && (
                  <button 
                    type="button"
                    onClick={() => { 
                      setQuery(''); 
                      if (searchType === 'students') {
                        setResults([]); 
                        setHasSearched(false);
                      }
                    }}
                    className="px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                {searchType === 'students' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Search</span>
                        <span className="sm:hidden"><Search size={16} /></span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── RESULTS SECTION ── */}
      {isSearching && (
        <div className="flex flex-col gap-4">
          {loading && (
            <div className="text-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-3"></div>
              <span className="text-sm font-bold text-gray-400">
                {searchType === 'students' ? 'Searching community members...' : 'Loading community groups...'}
              </span>
            </div>
          )}

          {/* --- STUDENTS SEARCH RESULTS --- */}
          {!loading && searchType === 'students' && results.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider">
                Search Results ({results.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((student) => {
                  const isSent = sentRequests.includes(student.id);
                  return (
                    <div 
                      key={student.id} 
                      onClick={() => onViewProfile(student.id)}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden"
                    >
                      <UserAvatar 
                        src={student.profilePicture} 
                        name={student.name} 
                        className="w-14 h-14 rounded-2xl" 
                        textClassName="text-xl"
                      />
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors text-base truncate">{student.name}</h3>
                        {student.department && (
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-1 truncate font-semibold">
                            <GraduationCap size={13} className="text-orange-400 shrink-0" />
                            <span>{student.department}</span>
                          </div>
                        )}
                        {student.collegeName && (
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate font-semibold">
                            <MapPin size={13} className="text-orange-400 shrink-0" />
                            <span>{student.collegeName}</span>
                          </div>
                        )}
                      </div>
                      
                      {(() => {
                        const fState = getFriendshipState(student);
                        return (
                          <button
                            onClick={(e) => handleConnect(e, student.id)}
                            disabled={fState.isConnected || fState.isPending}
                            className={`z-10 p-2.5 rounded-2xl transition-all cursor-pointer ${
                              fState.isConnected
                                ? 'bg-indigo-50 bg-opacity-20 text-indigo-650 dark:text-indigo-400 border border-indigo-200/25'
                                : fState.isPending 
                                  ? 'bg-green-50 bg-opacity-20 text-green-600 dark:text-green-400 border border-green-200/25' 
                                  : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white border border-transparent'
                            }`}
                            title={fState.label}
                          >
                            {fState.icon}
                          </button>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- GROUPS SEARCH RESULTS --- */}
          {!loading && searchType === 'groups' && filteredGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider">
                Discussion Groups ({filteredGroups.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map((group) => {
                  const initials = getGroupInitials(group.name);
                  return (
                    <div 
                      key={group.id} 
                      className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4.5 shadow-sm flex gap-4 items-start relative overflow-hidden"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white bg-gradient-to-tr from-emerald-400 to-teal-500 shrink-0 shadow-sm mt-1">
                        {initials}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-gray-800 dark:text-gray-100 text-base truncate">{group.name}</h3>
                          {group.isPrivate ? (
                            <span className="flex items-center gap-0.5 text-[9px] text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                              <Lock size={8} /> Private
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[9px] text-green-600 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                              <Unlock size={8} /> Public
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-400 dark:text-gray-505 font-bold mt-0.5">
                          {group.memberCount} members
                        </p>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-2 line-clamp-2 leading-relaxed">
                          {group.description || 'No description provided.'}
                        </p>

                        <div className="flex gap-2 mt-4">
                          {group.isJoined ? (
                            <>
                              <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
                                <Check size={12} strokeWidth={3} /> Joined
                              </span>
                              <button
                                onClick={() => onSelectChatUser && onSelectChatUser({ ...group, type: 'group' })}
                                className="flex items-center gap-1 text-[10px] text-orange-500 hover:text-white hover:bg-orange-500 border border-orange-500 bg-transparent px-3.5 py-1.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                <MessageSquareMore size={12} /> Open Chat
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (group.isPrivate) {
                                  setShowJoinGroupModal(group);
                                } else {
                                  handleJoinGroup(group);
                                }
                              }}
                              className="text-[10px] bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-xl transition shadow-md shadow-orange-500/10 cursor-pointer uppercase tracking-wider"
                            >
                              Join Group
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty results message */}
          {!loading && (
            (searchType === 'students' && query && results.length === 0) ||
            (searchType === 'groups' && filteredGroups.length === 0)
          ) && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-500 dark:text-gray-400 shadow-sm max-w-md mx-auto mt-4">
               <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-550 rounded-2xl flex items-center justify-center mx-auto mb-3">
                 <Search size={22} />
               </div>
               <p className="font-extrabold text-sm mb-1 text-gray-800 dark:text-gray-200">
                 {searchType === 'students' ? 'No users found' : 'No groups found'}
               </p>
               <p className="text-xs text-gray-400 dark:text-gray-550 font-bold leading-relaxed">
                 {searchType === 'students' 
                   ? 'Try searching for another name, major, college, or location keyword.'
                   : 'Try searching for another group name or keyword.'
                 }
               </p>
            </div>
          )}
        </div>
      )}

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
                    className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/10 transition cursor-pointer"
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
