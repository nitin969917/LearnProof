import { useState, useEffect, useRef } from 'react';
import { Home, Search, Heart, Users, MessageSquare, User, MessageCircle, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import FeedTab from './FeedTab.jsx';
import DiscoverTab from './DiscoverTab.jsx';
import FriendsTab from './FriendsTab.jsx';
import MessagesTab from './MessagesTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import GroupsTab from './GroupsTab.jsx';
import SocialPostCard from './SocialPostCard.jsx';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';

export default function SocialDashboard() {
  const { user } = useAuth();
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
    { id: 'feed', name: 'Feed', icon: <Home size={18} /> },
    { id: 'discover', name: 'Discover', icon: <Search size={18} /> },
    { id: 'friends', name: 'Friends', icon: <Users size={18} /> },
    { id: 'groups', name: 'Groups', icon: <MessageCircle size={18} /> },
    { 
      id: 'chat', 
      name: 'Messages', 
      icon: <MessageSquare size={18} />,
      badge: totalUnreadCount > 0 ? totalUnreadCount : null
    },
    { id: 'profile', name: 'My Profile', icon: <User size={18} /> },
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
    <div className="flex flex-col gap-4 max-w-7xl mx-auto px-2 md:px-6 pb-6">
      {/* Sub Navigation Bar – sticky on mobile */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-1.5 md:p-2 shadow-sm flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'profile' && selectedProfileId === socialUser.id);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all relative flex-1 md:flex-none ${
                  isActive
                    ? 'bg-orange-500 text-white shadow shadow-orange-500/20'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden sm:inline whitespace-nowrap">{tab.name}</span>

                {tab.badge && (
                  <span className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                    isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-1 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/70 transition-all flex-shrink-0 border border-orange-100 dark:border-orange-900/50"
        >
          <ArrowLeft size={16} />
          <span>Exit Hub</span>
        </Link>
      </div>

      {/* Tab Panels */}
      <div className="w-full">
        {activeTab === 'feed' && (
          <FeedTab 
            currentUserId={socialUser.id} 
            onViewProfile={viewUserProfile} 
            onSelectChatUser={startDirectChat} 
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverTab 
            onViewProfile={viewUserProfile} 
          />
        )}
        {activeTab === 'friends' && (
          <FriendsTab 
            onViewProfile={viewUserProfile} 
            onSelectChatUser={startDirectChat} 
          />
        )}
        {activeTab === 'groups' && (
          <GroupsTab 
            currentUserId={socialUser.id} 
          />
        )}
        {activeTab === 'chat' && (
          <MessagesTab 
            currentUserId={socialUser.id}
            selectedContact={selectedChatContact}
            onClearSelectedContact={() => setSelectedChatContact(null)}
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
    </div>
  );
}
