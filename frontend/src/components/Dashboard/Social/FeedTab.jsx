import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import SocialPostCard from './SocialPostCard.jsx';

export default function FeedTab({ currentUserId, onViewProfile, onSelectChatUser, postCreatedTrigger }) {
  const posts = useSocialFeedStore(state => state.posts);
  const friends = useSocialFeedStore(state => state.friends);
  const closeFriends = useSocialFeedStore(state => state.closeFriends);
  const fetchPosts = useSocialFeedStore(state => state.fetchPosts);
  const fetchFriends = useSocialFeedStore(state => state.fetchFriends);
  
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);
  const onlineFriends = friends.filter(friend => 
    onlineUserIds.some(id => id.toString() === friend.id.toString())
  );

  useEffect(() => {
    if (postCreatedTrigger > 0) {
      fetchPosts(true);
    }
  }, [postCreatedTrigger]);

  useEffect(() => {
    // Silent background updates, cache-first display
    fetchPosts();
    fetchFriends();
  }, []);


  return (
    <div className="flex flex-col gap-6">
      {/* ── Mobile Friends Strip (visible only on small screens) ── */}
      {onlineFriends.length > 0 && (
        <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Friends Online</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {onlineFriends.map(friend => (
              <div key={friend.id} className="flex flex-col items-center gap-1 flex-shrink-0" onClick={() => onViewProfile(friend.id)}>
                <div className="relative cursor-pointer">
                  <img src={friend.profilePicture || '/default-avatar.png'} alt={friend.name} className="w-11 h-11 rounded-full object-cover bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 max-w-[48px] truncate">{friend.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Desktop Grid (feed + sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Feed Column */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Create Post has been moved to a modal triggered from the top navbar button */}

        {/* Posts Feed */}
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <SocialPostCard 
              key={post.id} 
              post={post} 
              onLike={fetchPosts} 
              currentUserId={currentUserId}
              onViewProfile={onViewProfile}
            />
          ))}
          
          {posts.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
               <Sparkles size={40} className="mx-auto mb-3 text-orange-400 opacity-60 animate-pulse" />
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Your feed is quiet</h3>
               <p className="text-sm">Be the first to share a moment with the community!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar (desktop only) ── */}
      <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
         {/* Quick Friends List */}
         <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Your Friends</h3>
            <div className="space-y-4">
                 {friends.slice(0, 4).map(friend => {
                   const isFriendOnline = onlineUserIds.some(id => id.toString() === friend.id.toString());
                   return (
                     <div key={friend.id} className="flex items-center justify-between gap-2">
                        <div 
                           onClick={() => onViewProfile(friend.id)}
                           className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                        >
                           <div className="relative flex-shrink-0">
                              <img src={friend.profilePicture || '/default-avatar.png'} alt={friend.name} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-700" />
                              {isFriendOnline && (
                                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                              )}
                           </div>
                           <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate hover:text-orange-500 transition-colors">{friend.name}</p>
                              <p className={`text-[10px] font-bold ${isFriendOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                 {isFriendOnline ? 'Online' : 'Offline'}
                              </p>
                           </div>
                        </div>
                        <button 
                           onClick={() => onSelectChatUser(friend)} 
                           className="px-3 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100 dark:border-orange-900/30 text-xs font-bold rounded-full transition"
                        >
                          Chat
                        </button>
                     </div>
                   );
                })}
                
                {friends.length === 0 && (
                  <div className="text-center py-4 text-gray-400 dark:text-gray-500">
                    <p className="text-xs mb-2">No friends added yet.</p>
                  </div>
                )}
            </div>
         </div>

         {/* Close Friends Section */}
         {closeFriends.length > 0 && (
           <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                 <Sparkles size={18} className="text-orange-500" />
                 <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Close Friends</h3>
              </div>
              <div className="space-y-4">
                  {closeFriends.slice(0, 4).map(friend => {
                     const isFriendOnline = onlineUserIds.some(id => id.toString() === friend.id.toString());
                     return (
                       <div key={friend.id} className="flex items-center gap-3">
                          <div 
                             onClick={() => onViewProfile(friend.id)}
                             className="relative flex-shrink-0 cursor-pointer"
                          >
                             <img src={friend.profilePicture || '/default-avatar.png'} alt={friend.name} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-700" />
                             {isFriendOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                             )}
                          </div>
                          <div className="min-w-0">
                             <p 
                               onClick={() => onViewProfile(friend.id)}
                               className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate cursor-pointer hover:text-orange-500"
                             >
                               {friend.name}
                             </p>
                             <p className={`text-[10px] font-bold ${isFriendOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                {isFriendOnline ? 'Online' : 'Offline'}
                             </p>
                          </div>
                       </div>
                     );
                  })}
              </div>
           </div>
         )}
      </div>
      </div>
    </div>
  );
}
