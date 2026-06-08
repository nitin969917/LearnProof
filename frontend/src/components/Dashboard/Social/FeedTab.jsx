import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import SocialPostCard from './SocialPostCard.jsx';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';

export default function FeedTab({ currentUserId, onViewProfile, onSelectChatUser }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [friends, setFriends] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchFriends();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await socialApi.get('/posts/feed');
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await socialApi.get('/social/friendships');
      const allFriends = response.data.friends || [];
      
      const close = allFriends.filter(f => f.isCloseFriend);
      
      setFriends(allFriends.slice(0, 4));
      setCloseFriends(close.slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch friends', err);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    setLoading(true);

    try {
      await socialApi.post('/posts', { content, image: selectedImage, visibility });
      setContent('');
      setSelectedImage(null);
      setVisibility('public');
      fetchPosts();
    } catch (err) {
      console.error('Failed to create post', err);
      alert(err.response?.data?.error || "Failed to create post. The image might be too large.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Feed Column */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Create Post */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <form onSubmit={handlePost}>
            <textarea 
              placeholder="What's happening in the community?" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-gray-900 dark:text-white text-base md:text-lg outline-none resize-none border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 focus:border-orange-500 transition-colors"
            />
            
            {selectedImage && (
              <div className="relative mb-4 rounded-xl overflow-hidden max-h-[300px] border border-gray-100 dark:border-gray-750">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-semibold transition ${
                    selectedImage 
                      ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <ImageIcon size={20} />
                  <span>{selectedImage ? "Image Added" : "Add Image"}</span>
                </button>
                
                <div className="w-[1px] h-5 bg-gray-200 dark:bg-gray-700"></div>
                
                <select 
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="bg-transparent border-none text-gray-500 dark:text-gray-400 font-semibold text-xs md:text-sm cursor-pointer outline-none focus:text-orange-500"
                >
                  <option value="public" className="bg-white dark:bg-gray-800">🌐 Public</option>
                  <option value="friends" className="bg-white dark:bg-gray-800">👥 Friends</option>
                  <option value="close_friends" className="bg-white dark:bg-gray-800">⭐️ Close Friends</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || (!content.trim() && !selectedImage)}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-bold flex items-center gap-2 transition shadow-md shadow-orange-500/20"
              >
                <Send size={16} />
                <span>Post</span>
              </button>
            </div>
          </form>
        </div>

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

      {/* Right Sidebar Column */}
      <div className="lg:col-span-4 flex flex-col gap-6">
         {/* Quick Friends List */}
         <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-150 mb-4">Your Friends</h3>
            <div className="space-y-4">
                {friends.map(friend => {
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
                 <h3 className="text-base font-bold text-gray-800 dark:text-gray-150">Close Friends</h3>
              </div>
              <div className="space-y-4">
                  {closeFriends.map(friend => {
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
  );
}
