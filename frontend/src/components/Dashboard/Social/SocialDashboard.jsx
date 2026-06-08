import { useState, useEffect, useRef } from 'react';
import { Home, Search, Heart, Users, MessageSquare, User, MessageCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import FeedTab from './FeedTab.jsx';
import DiscoverTab from './DiscoverTab.jsx';
import FriendsTab from './FriendsTab.jsx';
import MessagesTab from './MessagesTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import GroupsTab from './GroupsTab.jsx';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';
import { getSocialSocket } from '../../../utils/socialSocket.js';

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

  const initializeStatus = useSocialStatusStore((state) => state.initializeStatus);
  const fetchUnreadCounts = useSocialMessageStore((state) => state.fetchUnreadCounts);
  const incrementUnread = useSocialMessageStore((state) => state.incrementUnread);
  const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);
  const activeChatUserId = useSocialMessageStore((state) => state.activeChatUserId);
  
  const activeChatUserIdRef = useRef(activeChatUserId);

  useEffect(() => {
    activeChatUserIdRef.current = activeChatUserId;
  }, [activeChatUserId]);

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

  useEffect(() => {
    if (socialUser) {
      initializeStatus(socialUser.id);
      fetchUnreadCounts();

      // Listen for message events globally to increment notification counters if chat not open
      const socket = getSocialSocket(socialUser.id);
      const handleGlobalMessage = (message) => {
        if (message.senderId.toString() !== activeChatUserIdRef.current?.toString()) {
          incrementUnread(message.senderId);
        }
      };

      socket.on('receiveMessage', handleGlobalMessage);
      return () => {
        socket.off('receiveMessage', handleGlobalMessage);
      };
    }
  }, [socialUser]);

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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-2 md:px-6">
      {/* Sub Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 md:p-3 shadow-sm flex items-center justify-start gap-1 md:gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'profile' && selectedProfileId === socialUser.id);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all relative ${
                isActive 
                  ? 'bg-orange-500 text-white shadow shadow-orange-500/20' 
                  : 'text-gray-655 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-750'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
              
              {tab.badge && (
                <span className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center ${
                  isActive ? 'bg-white text-orange-650' : 'bg-orange-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
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
          />
        )}
      </div>
    </div>
  );
}
