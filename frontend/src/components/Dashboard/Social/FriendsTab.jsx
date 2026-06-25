import { useState, useEffect } from 'react';
import { Clock, UserCheck, Check, X, Star, MessageSquare, UserX, AlertTriangle } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';

export default function FriendsTab({ onViewProfile, onSelectChatUser }) {
  const [data, setData] = useState({ friends: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null);
  // confirmModal shape: { userId, name, avatar, action: 'remove' | 'reject' }

  useEffect(() => {
    fetchSocial();
  }, []);

  const fetchSocial = async () => {
    setLoading(true);
    try {
      const response = await socialApi.get('/social/friendships');
      const d = response.data;
      setData({
        friends: Array.isArray(d?.friends) ? d.friends : [],
        pending: Array.isArray(d?.pending) ? d.pending : [],
      });
    } catch (err) {
      console.error('Failed to fetch social data', err);
      setData({ friends: [], pending: [] });
    } finally {
      setLoading(false);
    }
  };

  const toggleCloseFriend = async (friendId) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      friends: prev.friends.map(f => f.id === friendId ? { ...f, isCloseFriend: !f.isCloseFriend } : f)
    }));
    try {
      await socialApi.post('/social/toggle-close-friend', { friendId });
      fetchSocial();
    } catch (err) {
      console.error('Failed to toggle close friend', err);
      fetchSocial(); // revert on error
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await socialApi.post(`/social/friend-request/${requestId}/accept`);
      fetchSocial();
    } catch (err) {
      console.error('Failed to accept request', err);
    }
  };

  // Opens the custom confirmation modal instead of window.confirm
  const confirmRemove = (userId, name, avatar, action) => {
    setConfirmModal({ userId, name, avatar, action });
  };

  // Called when user presses "Confirm" in the modal
  const handleConfirmedAction = async () => {
    if (!confirmModal) return;
    const { userId } = confirmModal;
    setConfirmModal(null);
    try {
      await socialApi.post('/social/remove-friendship', { targetUserId: userId });
      fetchSocial();
    } catch (err) {
      console.error('Failed to remove friendship', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
        <span>Syncing connections...</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Confirmation Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl text-center">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-orange-100 dark:border-orange-900/40">
              {confirmModal.avatar ? (
                <img src={confirmModal.avatar} alt={confirmModal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl">
                  {confirmModal.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <UserX size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
              {confirmModal.action === 'remove' ? 'Remove Connection?' : 'Ignore Request?'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {confirmModal.action === 'remove'
                ? <>You'll remove <span className="font-extrabold text-gray-800 dark:text-white">{confirmModal.name}</span> from your connections. They won't be notified.</>
                : <>Ignore the connection request from <span className="font-extrabold text-gray-800 dark:text-white">{confirmModal.name}</span>?</>
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-500/20 transition cursor-pointer active:scale-95"
              >
                {confirmModal.action === 'remove' ? 'Remove' : 'Ignore'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
        {/* Pending Requests */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center gap-2 text-gray-800 dark:text-white mb-2">
            <Clock size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold">Pending Requests</h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
            {data.pending.map((req) => (
              <div 
                key={req.id} 
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl"
              >
                <div 
                  onClick={() => onViewProfile(req.sender.id)}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                >
                  <img src={req.sender.profilePicture || '/default-avatar.png'} alt={req.sender.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
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
                    onClick={() => confirmRemove(req.sender.id, req.sender.name, req.sender.profilePicture, 'reject')} 
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 rounded-full transition active:scale-95 cursor-pointer"
                    title="Ignore Request"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {data.pending.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <p className="text-xs">No pending friend requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="flex items-center gap-2 text-gray-800 dark:text-white mb-2">
            <UserCheck size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold">My Connections</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
            {data.friends.map((friend) => {
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
                      <img src={friend.profilePicture || '/default-avatar.png'} alt={friend.name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                      {isFriendOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
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
                      onClick={() => confirmRemove(friend.id, friend.name, friend.profilePicture, 'remove')}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition active:scale-95 cursor-pointer"
                      title="Remove Connection"
                    >
                      <UserX size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            {data.friends.length === 0 && (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                 <UserCheck size={36} className="mx-auto mb-3 opacity-50" />
                 <p className="font-semibold mb-1 text-sm">No connections yet</p>
                 <p className="text-xs">Find other members using the connection explorer!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
