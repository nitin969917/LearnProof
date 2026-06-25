import { useState, useEffect, useRef, Fragment } from 'react';
import { Home, Search, Heart, Users, MessageSquare, User, MessageCircle, ArrowLeft, X, Plus, Send, Image as ImageIcon, AlertTriangle, Menu, Globe } from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import FeedTab from './FeedTab.jsx';
import DiscoverTab from './DiscoverTab.jsx';
import FriendsTab from './FriendsTab.jsx';
import ChatsTab from './ChatsTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import SocialPostCard from './SocialPostCard.jsx';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';
import { motion } from 'framer-motion';

export default function SocialDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const toggleSidebar = outletContext?.toggleSidebar || (() => {});
  const [socialUser, setSocialUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('social_active_tab') || 'feed';
  });
  const [selectedProfileId, setSelectedProfileId] = useState(() => {
    const saved = localStorage.getItem('social_selected_profile_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [selectedChatContact, setSelectedChatContact] = useState(() => {
    const saved = localStorage.getItem('social_selected_chat_contact');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sharedPost, setSharedPost] = useState(null);
  const [showSharedPostModal, setShowSharedPostModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postCreatedTrigger, setPostCreatedTrigger] = useState(0);
  const [content, setContent] = useState('');
  const [loadingPost, setLoadingPost] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDevBanner, setShowDevBanner] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (postId) {
      const fetchPost = async () => {
        try {
          const res = await socialApi.get(`/posts/${postId}`);
          setSharedPost(res.data);
          setShowSharedPostModal(true);
        } catch (err) {
          console.error('Failed to load shared post', err);
          alert(err.response?.data?.error || "You do not have permission to view this post, or it has been deleted.");
          const url = new URL(window.location);
          url.searchParams.delete('post');
          window.history.replaceState({}, '', url);
        }
      };
      fetchPost();
    }
  }, []);

  // Handle incoming deep links (e.g. from push notifications click)
  useEffect(() => {
    if (!socialUser) return;
    
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const chatTypeParam = params.get('chatType');
    const chatIdParam = params.get('chatId');

    if (tabParam) {
      if (tabParam === 'chat') {
        setActiveTab('chat');
        if (chatTypeParam && chatIdParam) {
          setSelectedChatContact({
            id: parseInt(chatIdParam, 10),
            type: chatTypeParam
          });
        }
      } else {
        setActiveTab(tabParam);
      }
      
      // Clean up search parameters from URL without reloading
      const url = new URL(window.location);
      url.searchParams.delete('tab');
      url.searchParams.delete('chatType');
      url.searchParams.delete('chatId');
      window.history.replaceState({}, '', url);
    }
  }, [socialUser]);

  useEffect(() => {
    localStorage.setItem('social_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedProfileId) {
      localStorage.setItem('social_selected_profile_id', selectedProfileId);
    } else {
      localStorage.removeItem('social_selected_profile_id');
    }
  }, [selectedProfileId]);

  useEffect(() => {
    if (selectedChatContact) {
      localStorage.setItem('social_selected_chat_contact', JSON.stringify(selectedChatContact));
    } else {
      localStorage.removeItem('social_selected_chat_contact');
    }
  }, [selectedChatContact]);

  const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);

  useEffect(() => {
    const fetchSocialUser = async () => {
      try {
        const response = await socialApi.get('/users/me');
        setSocialUser(response.data);
      } catch (err) {
        console.error('Failed to sync social user', err);
      }
    };
    if (user) {
      fetchSocialUser();
    }
  }, [user]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    setLoadingPost(true);

    try {
      await socialApi.post('/posts', { content, image: selectedImage, visibility });
      setContent('');
      setSelectedImage(null);
      setVisibility('public');
      setPostCreatedTrigger(prev => prev + 1);
      setShowCreatePostModal(false);
    } catch (err) {
      console.error('Failed to create post', err);
      alert(err.response?.data?.error || "Failed to create post. The image might be too large.");
    } finally {
      setLoadingPost(false);
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

  const viewUserProfile = (userId) => {
    setSelectedProfileId(userId);
    setActiveTab('profile');
  };

  const startDirectChat = (contact) => {
    setSelectedChatContact(contact);
    setActiveTab('chat');
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'profile') {
      setSelectedProfileId(socialUser?.id || null);
    }
    setActiveTab(tabId);
  };

  const tabs = [
    { id: 'feed', name: 'Feed', icon: Home },
    { id: 'discover', name: 'Discover', icon: Search },
    { id: 'friends', name: 'Friends', icon: Users },
    { 
      id: 'chat', 
      name: 'Chats', 
      icon: MessageSquare,
      badge: totalUnreadCount > 0 ? totalUnreadCount : null
    },
    { id: 'profile', name: 'My Profile', icon: User },
  ];

  if (!socialUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mb-2"></div>
        <span>Syncing social status...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden transition-colors duration-200 bg-[#FAF6EE] dark:bg-gray-950">
      {/* Top Header Bar (Full width, static, styled like main app's TopBar) */}
      <div className={`bg-white dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700 shadow-sm flex items-center justify-between gap-4 h-16 sm:h-20 px-4 md:px-6 shrink-0 w-full transition-colors duration-200 ${hideHeader ? 'hidden md:flex' : 'flex'}`}>
        {/* Left Side: Logo and Social Hub title */}
        <div className="flex items-center gap-3 h-full min-w-0">
          <Link
            to="/dashboard"
            className="h-full cursor-pointer hover:opacity-90 transition-opacity shrink-0 flex items-stretch ml-2 sm:ml-0"
          >
            {/* Mobile Logo */}
            <img
              src="/LP_M_logo.png"
              alt="LearnProof"
              className="h-full w-auto object-cover object-left block sm:hidden"
            />
            {/* Desktop Logo */}
            <img
              src="/LP_logo.png"
              alt="LearnProof"
              className="h-full w-auto object-cover object-left hidden sm:block"
            />
          </Link>
          
          <div className="border-l border-gray-250 dark:border-gray-700 h-8 mx-1"></div>
          
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Social Hub</h1>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">Connect & Share</p>
          </div>
        </div>

        {/* Right Side: Actions (Exit Hub & Create Post) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'feed' && (
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="p-2 sm:p-2.5 text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer flex items-center justify-center border border-orange-600/10 shrink-0"
              title="Create Post"
            >
              <Plus size={20} className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
            </button>
          )}

          <Link
            to="/dashboard"
            className="p-2 sm:p-2.5 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/70 transition-all border border-orange-100 dark:border-orange-900/50 rounded-xl active:scale-95 flex items-center justify-center shrink-0"
            title="Exit Hub"
          >
            <ArrowLeft size={20} className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
          </Link>
        </div>
      </div>

      {/* Main Content Area (Scrollable container, no padding outside) */}
      <div className={`flex-1 w-full relative ${(hideHeader || activeTab === 'chat') ? 'overflow-hidden md:overflow-y-auto' : 'overflow-y-auto'}`}>
        <div className={`max-w-7xl w-full mx-auto ${(hideHeader || activeTab === 'chat') ? 'px-0 md:px-6 py-0 md:py-6 pb-0 md:pb-28 h-full' : 'px-4 md:px-6 py-6 pb-28'}`}>
          {showDevBanner && activeTab !== 'chat' && (
            <div className="mb-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 dark:from-orange-500/20 dark:to-orange-500/20 border border-orange-200/50 dark:border-orange-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20 flex-shrink-0">
                  <AlertTriangle size={18} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-orange-850 dark:text-orange-300 uppercase tracking-wider">Under Development</h4>
                  <p className="text-xs text-orange-750 dark:text-orange-400 font-bold mt-0.5">
                    We are actively building the Social Hub! You might experience minor glitches or errors during this process.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDevBanner(false)}
                className="p-1.5 rounded-xl hover:bg-orange-500/10 dark:hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 transition cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Tab Panels */}
          <div className={`w-full ${hideHeader ? 'h-full' : ''}`}>
            {activeTab === 'feed' && (
              <FeedTab 
                currentUserId={socialUser.id} 
                onViewProfile={viewUserProfile} 
                onSelectChatUser={startDirectChat} 
                postCreatedTrigger={postCreatedTrigger}
              />
            )}
            {activeTab === 'discover' && (
              <DiscoverTab 
                onViewProfile={viewUserProfile} 
                onSelectChatUser={startDirectChat}
              />
            )}
            {activeTab === 'friends' && (
              <FriendsTab 
                onViewProfile={viewUserProfile} 
                onSelectChatUser={startDirectChat} 
              />
            )}
            {activeTab === 'chat' && (
              <ChatsTab 
                currentUserId={socialUser.id}
                selectedContact={selectedChatContact}
                onClearSelectedContact={() => setSelectedChatContact(null)}
                onToggleHeader={setHideHeader}
                onViewProfile={viewUserProfile}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab 
                currentUserId={socialUser.id}
                viewUserId={selectedProfileId}
                onBackToFeed={() => setActiveTab('feed')}
                onSelectChatUser={startDirectChat}
                onViewProfile={viewUserProfile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar (matches design of main application BottomNav) */}
      <nav className={`fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[340px] xs:w-[380px] sm:w-[460px] md:w-[540px] max-w-[95vw] z-50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 ${hideHeader ? 'hidden md:block' : 'block'}`}>
        <div className="flex items-center justify-around h-16 px-3 relative">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'profile' && selectedProfileId === socialUser.id);
            const Icon = tab.icon;

            return (
              <Fragment key={tab.id}>
                <button
                  onClick={() => handleTabChange(tab.id)}
                  className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-550 no-underline touch-manipulation select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 cursor-pointer"
                >
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className="flex flex-col items-center justify-center w-full h-full relative"
                  >
                    <div className={`transition-all duration-300 z-10 ${isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'}`}>
                      <Icon 
                        size={22} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''}
                      />
                    </div>

                    <span className="sr-only">{tab.name}</span>

                    {tab.badge && (
                      <span className="absolute top-0.5 right-2 text-[9px] font-black rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center bg-orange-500 text-white shadow-md z-20">
                        {tab.badge}
                      </span>
                    )}
                    
                    {/* Sliding active background pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeSocialTabPill"
                        className="absolute inset-x-1 sm:inset-x-2 inset-y-1 bg-orange-500/10 dark:bg-orange-500/20 rounded-full z-0 border border-orange-500/10 dark:border-orange-500/25"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </button>

                {/* Live Rooms Globe icon next to Chats (idx === 3) */}
                {idx === 3 && (
                  <button
                    onClick={() => {
                      // Store nav_source so DashboardLayout shows Social Hub bottom nav on live-rooms pages
                      sessionStorage.setItem('nav_source', 'social');
                      navigate('/dashboard/live-rooms', { state: { from: 'social' } });
                    }}
                    className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-550 no-underline touch-manipulation select-none outline-none focus:outline-none cursor-pointer"
                  >
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      className="flex flex-col items-center justify-center w-full h-full relative"
                    >
                      <div className="text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300">
                        <Globe size={22} strokeWidth={2} />
                      </div>
                      <span className="sr-only">Live Rooms</span>
                    </motion.div>
                  </button>
                )}
              </Fragment>
            );
          })}

          {/* Menu Hamburger Button */}
          <button
            onClick={toggleSidebar}
            className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-450 dark:text-gray-550 touch-manipulation select-none outline-none focus:outline-none cursor-pointer"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              className="flex flex-col items-center justify-center w-full h-full relative"
            >
              <div className="text-gray-400 dark:text-gray-550 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300">
                <Menu size={22} strokeWidth={2} />
              </div>
              <span className="sr-only">Menu</span>
            </motion.div>
          </button>
        </div>
      </nav>

      {/* Shared Post Modal */}
      {showSharedPostModal && sharedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6">
            <button 
              onClick={() => {
                setShowSharedPostModal(false);
                const url = new URL(window.location);
                url.searchParams.delete('post');
                window.history.replaceState({}, '', url);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Shared Post</h3>
            <SocialPostCard 
              post={sharedPost}
              onLike={async () => {
                try {
                  const res = await socialApi.get(`/posts/${sharedPost.id}`);
                  setSharedPost(res.data);
                } catch (err) {
                  console.error(err);
                }
              }}
              currentUserId={socialUser.id}
              onViewProfile={viewUserProfile}
            />
          </div>
        </div>
      )}

      {/* Create Post Modal Overlay */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6">
            <button 
              type="button"
              onClick={() => setShowCreatePostModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Create a New Post</h3>
            
            <form onSubmit={handlePost}>
              <textarea 
                placeholder="What's happening in the community?" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full bg-transparent text-gray-900 dark:text-white text-base md:text-lg outline-none resize-none border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 focus:border-orange-500 transition-colors"
                autoFocus
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
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-semibold transition cursor-pointer ${
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
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowCreatePostModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loadingPost || (!content.trim() && !selectedImage)}
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-bold flex items-center gap-2 transition shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    <Send size={16} />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
