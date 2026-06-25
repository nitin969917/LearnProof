import { useState, useEffect } from 'react';
import { Search, Compass, GraduationCap, MapPin, ArrowRight, UserCheck, Check, UserPlus, Users, MessageSquare, Lock, Unlock, Sparkles, MessageSquareMore } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socialApi from '../../../api/socialApi.js';

export default function DiscoverTab({ onViewProfile, onSelectChatUser }) {
  const [searchType, setSearchType] = useState('students'); // 'students' or 'groups'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);

  // Join Private Group Modal states
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(null);
  const [joinKey, setJoinKey] = useState('');

  // Fetch groups from backend
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await socialApi.get('/groups');
      setGroupsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search or fetch when query or searchType changes
  useEffect(() => {
    if (searchType === 'groups') {
      fetchGroups();
    } else {
      // Clear groups list, let typing trigger students search
      setGroupsList([]);
      if (!query.trim()) {
        setResults([]);
      }
    }
  }, [searchType]);

  // Auto-search for students after 450ms typing delay
  useEffect(() => {
    if (searchType !== 'students') return;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [query, searchType]);

  const handleSearch = async (searchQuery = query) => {
    if (searchType !== 'students') return;
    if (!searchQuery.trim()) return;
    setLoading(true);
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
      // Refresh groups list to reflect "joined" state
      await fetchGroups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to join group');
    }
  };

  // Filter groups locally based on query
  const filteredGroups = groupsList.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(query.toLowerCase()))
  );

  const getGroupInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GP';
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-10 max-w-4xl mx-auto py-2 sm:py-4">
      {/* ── YOUTUBE EXPLORER STYLE TOP BANNER ── */}
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 max-w-2xl mx-auto mt-2 sm:mt-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Compass size={28} className="animate-spin-slow" />
          </div>
          
          <div className="text-center sm:text-left">
            <span className="text-[9px] sm:text-[10px] text-orange-500 dark:text-orange-400 uppercase tracking-widest font-black block sm:inline-block">
              Advanced Finder
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mt-0.5 sm:mt-1">
              Social <span className="text-orange-500">Explorer</span>
            </h2>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium sm:font-semibold leading-relaxed max-w-md sm:max-w-lg px-4 sm:px-0">
          Discover students in the community or search for discussion groups to join public and private conversations.
        </p>

        {/* ── SEARCH TYPE TOGGLE PILLS ── */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              setSearchType('students');
              setQuery('');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              searchType === 'students'
                ? 'bg-white dark:bg-gray-800 text-orange-500 dark:text-orange-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 dark:text-gray-400'
            }`}
          >
            <Users size={14} />
            <span>Search Students</span>
          </button>
          <button
            onClick={() => {
              setSearchType('groups');
              setQuery('');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              searchType === 'groups'
                ? 'bg-white dark:bg-gray-800 text-orange-500 dark:text-orange-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 dark:text-gray-400'
            }`}
          >
            <MessageSquare size={14} />
            <span>Search Groups</span>
          </button>
        </div>

        {/* ── PILL STYLE SEARCH BAR ── */}
        <form 
          onSubmit={(e) => { e.preventDefault(); if (searchType === 'students') handleSearch(); }}
          className="w-full flex items-center bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700 shadow-md p-1 focus-within:ring-2 focus-within:ring-orange-500/25 focus-within:border-orange-500 transition-all"
        >
          <div className="pl-3.5 sm:pl-4 pr-1.5 sm:pr-2 text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === 'students' ? "Search people, colleges, majors..." : "Search groups by name or description..."}
            className="flex-1 bg-transparent text-gray-950 dark:text-white text-xs sm:text-sm focus:outline-none py-2 sm:py-2.5 font-semibold min-w-0"
          />
          {query && (
            <button 
              type="button"
              onClick={() => { setQuery(''); if (searchType === 'students') setResults([]); }}
              className="px-2 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0"
            >
              Clear
            </button>
          )}
          {searchType === 'students' && (
            <button
              type="submit"
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider px-4 sm:px-7 py-2 sm:py-3 rounded-full transition shadow-md cursor-pointer shrink-0"
            >
              Search
            </button>
          )}
        </form>
      </div>

      {/* ── RESULTS SECTION ── */}
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
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xl border border-orange-200/20">
                      {student.profilePicture ? (
                        <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        student.name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-850 dark:text-gray-100 group-hover:text-orange-500 transition-colors text-base truncate">{student.name}</h3>
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
                    
                    <button
                      onClick={(e) => handleConnect(e, student.id)}
                      disabled={isSent}
                      className={`z-10 p-2.5 rounded-2xl transition-all cursor-pointer ${
                        isSent 
                          ? 'bg-green-50 bg-opacity-20 text-green-600 dark:text-green-400 border border-green-200/25' 
                          : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white border border-transparent'
                      }`}
                      title={isSent ? "Request Sent" : "Connect"}
                    >
                      {isSent ? <Check size={16} /> : <UserPlus size={16} />}
                    </button>
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
                        <h3 className="font-black text-gray-850 dark:text-gray-100 text-base truncate">{group.name}</h3>
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
             <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
               <Search size={22} />
             </div>
             <p className="font-extrabold text-sm mb-1 text-gray-800 dark:text-gray-200">
               {searchType === 'students' ? 'No users found' : 'No groups found'}
             </p>
             <p className="text-xs text-gray-400 dark:text-gray-500 font-bold leading-relaxed">
               {searchType === 'students' 
                 ? 'Try searching for another name, major, college, or location keyword.'
                 : 'Try searching for another group name or keyword.'
               }
             </p>
          </div>
        )}
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
