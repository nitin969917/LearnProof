import { useState, useEffect, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Users2, UserPlus, MessageCircle, ChevronRight, Hash, TrendingUp, BookOpen, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import socialApi from '../../../api/socialApi.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import UserAvatar from '../../Common/UserAvatar.jsx';
import SocialPostCard from './SocialPostCard.jsx';

export default function FeedTab({ currentUserId, socialUser, onViewProfile, onSelectChatUser, postCreatedTrigger, onOpenCreatePost, onNavigateTab }) {
  const posts = useSocialFeedStore(state => state.posts);
  const friends = useSocialFeedStore(state => state.friends);
  const closeFriends = useSocialFeedStore(state => state.closeFriends);
  const fetchPosts = useSocialFeedStore(state => state.fetchPosts);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  const loadingPosts = useSocialFeedStore(state => state.loadingPosts);
  const hasMorePosts = useSocialFeedStore(state => state.hasMorePosts);
  
  const syncLatestPosts = useSocialFeedStore(state => state.syncLatestPosts);
  const selectedTag = useSocialFeedStore(state => state.selectedTag);
  const setSelectedTag = useSocialFeedStore(state => state.setSelectedTag);
  
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);

  const loaderRef = useRef(null);
  const [suggestedPeers, setSuggestedPeers] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  const handleTagFilter = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      fetchPosts(true, true, null);
    } else {
      setSelectedTag(tag);
      fetchPosts(true, true, tag);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSuggested = async () => {
      setLoadingSuggested(true);
      try {
        const res = await socialApi.get('/users/suggested?limit=4');
        if (isMounted) {
          setSuggestedPeers(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        // Quiet background fetch
      } finally {
        if (isMounted) setLoadingSuggested(false);
      }
    };
    fetchSuggested();
    return () => { isMounted = false; };
  }, []);

  const handleSendFriendRequest = async (e, targetUserId) => {
    e.stopPropagation();
    if (sentRequests.has(targetUserId)) return;
    try {
      await socialApi.post('/social/friend-request', { receiverId: targetUserId });
      setSentRequests(prev => new Set([...prev, targetUserId]));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send request");
    }
  };

  useEffect(() => {
    if (postCreatedTrigger > 0) {
      syncLatestPosts();
    }
  }, [postCreatedTrigger]);

  useEffect(() => {
    // Immediate fresh load or background sync
    if (posts.length === 0) {
      fetchPosts(true, true);
    } else {
      syncLatestPosts();
    }
    fetchFriends();

    // Auto-sync when window gains focus or app returns to foreground
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncLatestPosts();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // Live background polling heartbeat (every 25 seconds) to catch updates seamlessly
    const interval = setInterval(() => {
      syncLatestPosts();
    }, 25000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMorePosts && !loadingPosts) {
        fetchPosts(false);
      }
    }, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMorePosts, loadingPosts, fetchPosts]);


  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* ── Grid (feed + sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
      {/* Feed Column */}
      <div className="lg:col-span-8 flex flex-col gap-3.5 sm:gap-4.5">
        {/* ── What's on your mind? Create Post Card ── */}
        <div 
          onClick={() => onOpenCreatePost && onOpenCreatePost(false)}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100/80 dark:border-gray-700/80 p-2.5 sm:p-3.5 flex items-center gap-3 shadow-xs hover:shadow-sm hover:border-orange-200 dark:hover:border-gray-650 transition-all cursor-pointer group"
        >
          <div className="shrink-0">
            <UserAvatar 
              src={socialUser?.avatar} 
              name={socialUser?.name} 
              className="w-10 h-10 rounded-full" 
              textClassName="text-sm font-bold"
            />
          </div>
          <div className="flex-1 text-sm text-gray-400 dark:text-gray-500 font-medium select-none truncate">
            What's on your mind?
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreatePost && onOpenCreatePost(true);
            }}
            className="p-2 rounded-xl text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors shrink-0"
            title="Add photo"
          >
            <ImageIcon size={20} className="stroke-[1.75]" />
          </div>
        </div>

        {/* ── Active Tag Filter Banner ── */}
        {selectedTag && (
          <div className="bg-orange-50/90 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-850 rounded-2xl p-3 sm:p-3.5 px-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-sm">
                #
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Showing posts tagged with</p>
                <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400">{selectedTag}</p>
              </div>
            </div>
            <button
              onClick={() => handleTagFilter(selectedTag)}
              className="text-xs font-bold text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-300 px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Clear filter</span>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Posts Feed */}
        <div className="flex flex-col gap-3.5 sm:gap-4.5">
          {posts.length === 0 && loadingPosts ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-550 dark:text-gray-400 flex flex-col items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-sm text-gray-550 dark:text-gray-400 mt-3 font-medium">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-550 dark:text-gray-400">
               <Sparkles size={40} className="mx-auto mb-3 text-orange-400 opacity-60 animate-pulse" />
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                 {selectedTag ? `No posts found tagged with ${selectedTag}` : 'Your feed is quiet'}
               </h3>
               <p className="text-sm">
                 {selectedTag ? 'Try exploring other tags or create a post with this tag!' : 'Be the first to share a moment with the community!'}
               </p>
               {selectedTag && (
                 <button
                   onClick={() => handleTagFilter(selectedTag)}
                   className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                 >
                   Clear Tag Filter
                 </button>
               )}
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <SocialPostCard 
                  key={post.id} 
                  post={post} 
                  onLike={fetchPosts} 
                  currentUserId={currentUserId}
                  onViewProfile={onViewProfile}
                  onTagClick={handleTagFilter}
                />
              ))}

              {/* Infinite scroll loader element */}
              {hasMorePosts && (
                <div ref={loaderRef} className="py-6 text-center flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold">Loading more posts...</p>
                </div>
              )}

              {!hasMorePosts && (
                <div className="py-8 text-center text-xs font-black text-gray-400 select-none">
                  You've caught up! No more posts to load.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right Sidebar (desktop only, sticky so it stays visible on scroll) ── */}
      <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar pb-12">
        
        {/* 1. Your Friends / Study Connections */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Users2 size={17} className="text-orange-500" />
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Your Friends</h3>
            </div>
            {friends.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {friends.slice(0, 5).map(friend => {
              const isFriendOnline = onlineUserIds.some(id => id.toString() === friend.id.toString());
              return (
                <div key={friend.id} className="flex items-center justify-between gap-2 group">
                  <div 
                    onClick={() => onViewProfile(friend.id)}
                    className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                  >
                    <div className="relative shrink-0">
                      <UserAvatar src={friend.profilePicture} name={friend.name} className="w-9 h-9 rounded-full" />
                      {isFriendOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full z-10 animate-pulse"></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate group-hover:text-orange-500 transition-colors">
                        {friend.name}
                      </p>
                      <p className={`text-[10px] font-semibold flex items-center gap-1 ${isFriendOnline ? 'text-green-500' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isFriendOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        {isFriendOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onSelectChatUser(friend)} 
                    className="px-3 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white border border-orange-200 dark:border-orange-800/40 text-xs font-bold rounded-full transition-all cursor-pointer shrink-0"
                  >
                    Chat
                  </button>
                </div>
              );
            })}

            {friends.length === 0 && (
              <div className="text-center py-4 text-gray-400 dark:text-gray-500">
                <p className="text-xs font-medium">No friends connected yet.</p>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('discover')}
                  className="mt-2 text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                >
                  Discover peers →
                </button>
              </div>
            )}
          </div>

          {friends.length > 5 && (
            <button
              onClick={() => onNavigateTab && onNavigateTab('friends')}
              className="mt-3.5 w-full py-1.5 text-center text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl transition-colors cursor-pointer"
            >
              View all {friends.length} connections →
            </button>
          )}
        </div>

        {/* 2. Suggested Peers Card (Students You May Know) */}
        {suggestedPeers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <UserPlus size={17} className="text-orange-500" />
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Suggested Peers</h3>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('discover')}
                className="text-[11px] font-bold text-orange-500 hover:underline cursor-pointer"
              >
                See all
              </button>
            </div>

            <div className="space-y-3">
              {suggestedPeers.slice(0, 4).map(peer => {
                const isConnected = friends.some(f => Number(f.id) === Number(peer.id));
                const hasRequested = sentRequests.has(peer.id);
                return (
                  <div key={peer.id} className="flex items-center justify-between gap-2 group">
                    <div 
                      onClick={() => onViewProfile(peer.id)}
                      className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                    >
                      <UserAvatar src={peer.profilePicture} name={peer.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate group-hover:text-orange-500 transition-colors">
                          {peer.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {peer.department || peer.collegeName || 'Student Engineer'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => !isConnected && handleSendFriendRequest(e, peer.id)}
                      disabled={hasRequested || isConnected}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-default'
                          : hasRequested
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default'
                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xs active:scale-95'
                      }`}
                    >
                      {isConnected ? 'Connected ✓' : hasRequested ? 'Sent ✓' : '+ Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Trending Discussions & Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-amber-500" />
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Popular in Community</h3>
            </div>
            {selectedTag && (
              <button 
                onClick={() => handleTagFilter(selectedTag)}
                className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { tag: '#LeetCodeDSA', desc: 'Algorithm strategies' },
              { tag: '#SystemDesign', desc: 'Architecture notes' },
              { tag: '#ReactNodeJS', desc: 'Full-stack tips' },
              { tag: '#OperatingSystems', desc: 'Core CS viva' },
              { tag: '#DockerDeploy', desc: 'DevOps & containers' },
              { tag: '#CampusHackathon', desc: 'Projects & demos' }
            ].map(({ tag, desc }) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  title={desc}
                  onClick={() => handleTagFilter(tag)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm ring-2 ring-orange-400/30'
                      : 'bg-orange-50/70 dark:bg-gray-750 hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-orange-100/70 dark:border-gray-700'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-orange-500'}>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Minimal Community Info & Footer */}
        <div className="px-2 text-[11px] text-gray-400 dark:text-gray-500 space-y-1.5">
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 font-medium">
            <span className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">About Social Hub</span>
            <span>•</span>
            <span className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">Guidelines</span>
            <span>•</span>
            <span className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">Safety</span>
            <span>•</span>
            <span className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">Help</span>
          </div>
          <p className="text-[10px] text-gray-400">© 2026 LearnProof AI • Student Community</p>
        </div>

      </div>
      </div>
    </div>
  );
}
