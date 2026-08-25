import { useState, useEffect } from 'react';
import { Clock, UserCheck, Check, X, Star, MessageSquare, UserX, Search, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import socialApi from '../../../api/socialApi.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import { useModal } from '../../../context/ModalContext.jsx';
import UserAvatar from '../../Common/UserAvatar.jsx';

export default function FriendsTab({ onViewProfile, onSelectChatUser }) {
  const navigate = useNavigate();
  const friends = useSocialFeedStore(state => state.friends);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  const loadingFriends = useSocialFeedStore(state => state.loadingFriends);
  const hasLoadedFriends = useSocialFeedStore(state => state.hasLoadedFriends);
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);
  const { confirm } = useModal();

  // Local pending state (friendships endpoint returns both friends + pending)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch and sync pending requests (lightweight separate call)
  const syncPending = async () => {
    try {
      const response = await socialApi.get('/social/friendships');
      setPendingRequests(Array.isArray(response.data?.pending) ? response.data.pending : []);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    }
  };

  useEffect(() => {
    // Always refresh on mount to get pending requests too
    fetchFriends();
    syncPending();
  }, []);

  const toggleCloseFriend = async (friendId) => {
    // Optimistic update in store
    useSocialFeedStore.setState(state => ({
      friends: state.friends.map(f => f.id === friendId ? { ...f, isCloseFriend: !f.isCloseFriend } : f),
      closeFriends: state.friends.filter(f => f.id === friendId ? !f.isCloseFriend : f.isCloseFriend),
    }));
    try {
      await socialApi.post('/social/toggle-close-friend', { friendId });
      fetchFriends(); // sync store with server
    } catch (err) {
      console.error('Failed to toggle close friend', err);
      fetchFriends(); // revert on error
    }
  };

  const handleAccept = async (requestId) => {
    // Optimistic: remove from pending list immediately so UI updates instantly
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      await socialApi.post(`/social/friend-request/${requestId}/accept`);
      // Force-refresh to sync store with the newly accepted friend
      fetchFriends(true);
      syncPending();
    } catch (err) {
      console.error('Failed to accept request', err);
      // Revert on error
      syncPending();
    }
  };

  const handleRemoveFriend = async (userId, name) => {
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
      title: 'Ignore Request?',
      message: `Ignore the connection request from ${name}?`,
      confirmText: 'Ignore',
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

  // Only show full-screen spinner on very first load
  if (loadingFriends && !hasLoadedFriends) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
        <span>Syncing connections...</span>
      </div>
    );
  }

  return (
    <>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full mx-auto">
        {/* Pending Requests */}
        <div className={`lg:col-span-4 ${pendingRequests.length === 0 ? 'hidden lg:flex' : 'flex'} flex-col gap-4 sm:gap-5`}>
          <div className="flex items-center gap-2 text-gray-800 dark:text-white mb-1 sm:mb-2">
            <Clock size={18} className="text-orange-500" />
            <h2 className="text-base sm:text-lg font-bold">Pending Requests</h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
            {pendingRequests.map((req) => (
              <div 
                key={req.id} 
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl"
              >
                <div 
                  onClick={() => onViewProfile(req.sender.id)}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                >
                  <UserAvatar src={req.sender.profilePicture} name={req.sender.name} className="w-10 h-10 rounded-full" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{req.sender.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">wants to connect</p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 flex-shrink-0">
                  <button 
                    onClick={() => handleAccept(req.id)} 
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all shadow shadow-orange-500/10 active:scale-95 cursor-pointer"
                    title="Accept Request"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => handleIgnoreRequest(req.sender.id, req.sender.name)} 
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 rounded-full transition active:scale-95 cursor-pointer"
                    title="Ignore Request"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {pendingRequests.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <p className="text-xs">No pending friend requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between gap-4 text-gray-800 dark:text-white mb-0.5">
            <div className="flex items-center gap-2">
              <UserCheck size={20} className="text-orange-500" />
              <h2 className="text-base sm:text-lg font-bold">
                My Connections {friends.length > 0 && <span className="text-xs font-semibold text-gray-400">({friends.length})</span>}
              </h2>
            </div>
            <button
              onClick={() => navigate('/dashboard/social/discover')}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1.5 transition active:scale-95 cursor-pointer bg-orange-500/5 dark:bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/10 hover:border-orange-500/25"
            >
              <Compass size={14} />
              Explore Community
            </button>
          </div>

          {/* ── Search Bar (Identical style, size, position to Quiz & My Learning) ── */}
          {friends.length > 0 && (
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search friends by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
            {friends
              .filter(friend => (friend.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map((friend) => {
                const isFriendOnline = onlineUserIds.some(id => id.toString() === friend.id.toString());
                return (
                  <div 
                    key={friend.id} 
                    className="flex items-center justify-between gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition"
                  >
                    <div 
                      onClick={() => onViewProfile(friend.id)}
                      className="flex items-center gap-3.5 cursor-pointer min-w-0 flex-1"
                    >
                      <div className="relative flex-shrink-0">
                        <UserAvatar src={friend.profilePicture} name={friend.name} className="w-12 h-12 rounded-full" />
                        {isFriendOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full z-10"></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate hover:text-orange-500 transition-colors">{friend.name}</h4>
                        <p className={`text-[10px] font-bold ${isFriendOnline ? 'text-green-500' : 'text-gray-400'}`}>
                          {isFriendOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={() => toggleCloseFriend(friend.id)}
                        className={`p-2 rounded-xl transition active:scale-95 cursor-pointer ${
                          friend.isCloseFriend 
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100' 
                            : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={friend.isCloseFriend ? "Remove from Close Friends" : "Mark as Close Friend"}
                      >
                        <Star size={18} fill={friend.isCloseFriend ? "currentColor" : "transparent"} />
                      </button>

                      <button 
                        onClick={() => onSelectChatUser(friend)}
                        className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-xl transition active:scale-95 cursor-pointer"
                        title="Send Message"
                      >
                        <MessageSquare size={18} />
                      </button>

                      <button 
                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition active:scale-95 cursor-pointer"
                        title="Remove Connection"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}

            {friends.length > 0 && friends.filter(friend => (friend.name || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <Search size={28} className="mx-auto mb-2 opacity-40 text-orange-500" />
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">No connections matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}

            {friends.length === 0 && (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-6">
                 <UserCheck size={36} className="mx-auto mb-3 opacity-55 text-orange-500" />
                 <p className="font-extrabold mb-1 text-sm text-gray-800 dark:text-gray-200">No connections yet</p>
                 <p className="text-xs mb-4 text-gray-500 dark:text-gray-400 max-w-xs leading-normal">
                   Find other members and build your learning network using the connection explorer!
                 </p>
                 <button
                   onClick={() => navigate('/dashboard/social/discover')}
                   className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer flex items-center gap-1.5"
                 >
                   <Compass size={14} />
                   Explore Community
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
