import { useState, useEffect, useRef, Fragment } from 'react';
import { Home, Search, Heart, Users, MessageSquare, User, MessageCircle, ArrowLeft, X, Plus, Send, Image as ImageIcon, AlertTriangle, Menu, Globe, Compass, Bell } from 'lucide-react';
import { Link, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import FeedTab from './FeedTab.jsx';
import DiscoverTab from './DiscoverTab.jsx';
import FriendsTab from './FriendsTab.jsx';
import ChatsTab from './ChatsTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import SocialPostCard from './SocialPostCard.jsx';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import UserAvatar from '../../Common/UserAvatar.jsx';
import { motion } from 'framer-motion';

export default function SocialDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext();
  const toggleSidebar = outletContext?.toggleSidebar || (() => {});
  const socialUser = useSocialFeedStore((state) => state.socialUser);
  const fetchSocialUser = useSocialFeedStore((state) => state.fetchSocialUser);
  const pendingFriendCount = useSocialFeedStore((state) => state.pendingFriendCount);
  const clearPendingFriendCount = useSocialFeedStore((state) => state.clearPendingFriendCount);

  // Initialize state variables strictly from URL pathname/search
  const [activeTab, setActiveTab] = useState(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const sub = segments[2];
    if (sub === 'discover') return 'discover';
    if (sub === 'friends') return 'friends';
    if (sub === 'chats') return 'chat';
    if (sub === 'profile') return 'profile';
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'discover') return 'discover';
    if (tabParam === 'friends') return 'friends';
    if (tabParam === 'chat' || tabParam === 'chats') return 'chat';
    if (tabParam === 'profile') return 'profile';
    return 'feed';
  });

  const [selectedProfileId, setSelectedProfileId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const profileIdParam = params.get('profileId');
    if (profileIdParam) return parseInt(profileIdParam, 10);
    if (tabParam === 'profile') return null;
    const saved = localStorage.getItem('social_selected_profile_id');
    return saved ? parseInt(saved, 10) : null;
  });

  const [selectedChatContact, setSelectedChatContact] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const chatIdParam = params.get('chatId');
    const chatTypeParam = params.get('chatType');
    if (chatIdParam && chatTypeParam) {
      return { id: parseInt(chatIdParam, 10), type: chatTypeParam };
    }
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

  // Synchronize route paths (e.g. /dashboard/social/feed, /dashboard/social/chats/direct/5, /dashboard/social/profile/12)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryTab = searchParams.get('tab');
    const queryProfileId = searchParams.get('profileId');
    const queryChatId = searchParams.get('chatId');
    const queryChatType = searchParams.get('chatType');

    // Legacy query parameter redirect support to dedicated sub-routes
    if (queryTab) {
      if (queryTab === 'profile' && queryProfileId) {
        navigate(`/dashboard/social/profile/${queryProfileId}`, { replace: true });
        return;
      }
      if (queryTab === 'chat' && queryChatId && queryChatType) {
        navigate(`/dashboard/social/chats/${queryChatType}/${queryChatId}`, { replace: true });
        return;
      }
      navigate(`/dashboard/social/${queryTab}`, { replace: true });
      return;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const subRoute = pathSegments[2];

    if (subRoute === 'discover') {
      setActiveTab('discover');
      setSelectedProfileId(null);
      setSelectedChatContact(null);
    } else if (subRoute === 'friends') {
      setActiveTab('friends');
      setSelectedProfileId(null);
      setSelectedChatContact(null);
    } else if (subRoute === 'chats') {
      setActiveTab('chat');
      setSelectedProfileId(null);
      const chatType = pathSegments[3];
      const chatId = pathSegments[4];
      if (chatType && chatId) {
        setSelectedChatContact({ id: parseInt(chatId, 10), type: chatType });
      } else {
        setSelectedChatContact(null);
      }
    } else if (subRoute === 'profile') {
      setActiveTab('profile');
      setSelectedChatContact(null);
      const profileId = pathSegments[3];
      if (profileId) {
        setSelectedProfileId(parseInt(profileId, 10));
      } else {
        localStorage.removeItem('social_selected_profile_id');
        setSelectedProfileId(null);
      }
    } else {
      // /dashboard/social or /dashboard/social/feed -> strictly feed tab
      setActiveTab('feed');
      setSelectedProfileId(null);
      setSelectedChatContact(null);
    }
  }, [location.pathname, location.search, socialUser?.id, user?.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('social_active_tab', activeTab);
    }, 300);
    return () => clearTimeout(handler);
  }, [activeTab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (selectedProfileId) {
        localStorage.setItem('social_selected_profile_id', selectedProfileId);
      } else {
        localStorage.removeItem('social_selected_profile_id');
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [selectedProfileId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (selectedChatContact) {
        localStorage.setItem('social_selected_chat_contact', JSON.stringify(selectedChatContact));
      } else {
        localStorage.removeItem('social_selected_chat_contact');
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [selectedChatContact]);

  const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);

  useEffect(() => {
    if (user) {
      fetchSocialUser();
    }
  }, [user, fetchSocialUser]);

  const addPostLocally = useSocialFeedStore(state => state.addPostLocally);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoadingPost(true);

    try {
      const response = await socialApi.post('/posts', { content, image: null, visibility });
      addPostLocally(response.data);
      setContent('');
      setSelectedImage(null);
      setVisibility('public');
      setPostCreatedTrigger(prev => prev + 1);
      setShowCreatePostModal(false);
    } catch (err) {
      console.error('Failed to create post', err);
      alert(err.response?.data?.error || "Failed to create post.");
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
    if (userId) {
      localStorage.setItem('social_selected_profile_id', userId);
      navigate(`/dashboard/social/profile/${userId}`);
    } else {
      navigate('/dashboard/social/profile');
    }
  };

  const startDirectChat = (contact) => {
    if (contact && contact.id) {
      localStorage.setItem('social_selected_chat_contact', JSON.stringify(contact));
      navigate(`/dashboard/social/chats/${contact.type || 'direct'}/${contact.id}`);
    } else {
      navigate('/dashboard/social/chats');
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'home') {
      navigate('/dashboard');
      return;
    }
    if (tabId === 'friends') {
      clearPendingFriendCount();
      navigate('/dashboard/social/friends');
      return;
    }
    if (tabId === 'feed') {
      navigate('/dashboard/social/feed');
      return;
    }
    if (tabId === 'discover') {
      navigate('/dashboard/social/discover');
      return;
    }
    if (tabId === 'chat') {
      const savedChat = localStorage.getItem('social_selected_chat_contact');
      try {
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          if (parsed && parsed.id && parsed.type) {
            navigate(`/dashboard/social/chats/${parsed.type}/${parsed.id}`);
            return;
          }
        }
      } catch (e) {}
      navigate('/dashboard/social/chats');
      return;
    }
    if (tabId === 'profile') {
      localStorage.removeItem('social_selected_profile_id');
      setSelectedProfileId(socialUser?.id || null);
      navigate('/dashboard/social/profile');
      return;
    }
  };

  const socialSubTabs = [
    { id: 'feed', name: 'Feed', icon: Home },
    { id: 'discover', name: 'Discover', icon: Compass },
    { id: 'friends', name: 'Friends', icon: Users, badge: pendingFriendCount > 0 ? pendingFriendCount : null },
    { id: 'chat', name: 'Chats', icon: MessageSquare, badge: totalUnreadCount > 0 ? totalUnreadCount : null },
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
      {/* Desktop Header / Tab Switcher (Visible only on Desktop: lg:flex) */}
      <div className="hidden lg:flex items-center justify-between bg-white dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700 px-6 py-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          {socialSubTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-black rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center ${
                    isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                  }`}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Profile shortcut */}
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile' && (!selectedProfileId || String(selectedProfileId) === String(socialUser?.id || user?.id))
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-current">
            <UserAvatar src={socialUser?.avatar} name={socialUser?.name} className="w-full h-full" textClassName="text-[9px]" />
          </div>
          <span>My Profile</span>
        </button>
      </div>

      {/* Main Content Area (Scrollable container) */}
      <div className={`flex-1 w-full relative ${(hideHeader || activeTab === 'chat') ? 'overflow-hidden md:overflow-y-auto' : 'overflow-y-auto'}`}>
        <div className={`w-full mx-auto ${(hideHeader || activeTab === 'chat') ? 'px-0 md:px-6 py-0 md:py-6 pb-0 lg:pb-6 h-full' : 'px-4 md:px-6 py-6 pb-28 lg:pb-6'}`}>

          {/* Tab Panels */}
          <div className={`w-full ${(hideHeader || activeTab === 'chat') ? 'h-full' : ''}`}>
            <div className={activeTab === 'feed' ? 'block' : 'hidden'}>
              <FeedTab 
                currentUserId={socialUser?.id || user?.id} 
                socialUser={socialUser}
                onViewProfile={viewUserProfile} 
                onSelectChatUser={startDirectChat} 
                postCreatedTrigger={postCreatedTrigger}
                onOpenCreatePost={() => setShowCreatePostModal(true)}
              />
            </div>
            <div className={activeTab === 'discover' ? 'block' : 'hidden'}>
              <DiscoverTab 
                onViewProfile={viewUserProfile} 
                onSelectChatUser={startDirectChat}
              />
            </div>
            <div className={activeTab === 'friends' ? 'block' : 'hidden'}>
              <FriendsTab 
                onViewProfile={viewUserProfile} 
                onSelectChatUser={startDirectChat} 
              />
            </div>
            <div className={activeTab === 'chat' ? 'h-full block' : 'hidden'}>
              <ChatsTab 
                currentUserId={socialUser?.id || user?.id}
                selectedContact={selectedChatContact}
                onClearSelectedContact={() => setSelectedChatContact(null)}
                onToggleHeader={setHideHeader}
                onViewProfile={viewUserProfile}
              />
            </div>
            <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
              <ProfileTab 
                currentUserId={socialUser?.id || user?.id}
                viewUserId={selectedProfileId}
                onBackToFeed={() => handleTabChange('feed')}
                onSelectChatUser={startDirectChat}
                onViewProfile={viewUserProfile}
              />
            </div>
          </div>
        </div>
      </div>

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
              
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
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
                    disabled={loadingPost || !content.trim()}
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
