import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Home, Search, Heart, Users, Users2, MessageSquare, User, MessageCircle, ArrowLeft, X, Plus, Send, Image as ImageIcon, AlertTriangle, Menu, Globe, Compass, Bell, Hash, Sparkles } from 'lucide-react';
import { Link, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';
import FeedTab from './FeedTab.jsx';
import DiscoverTab from './DiscoverTab.jsx';
import FriendsTab from './FriendsTab.jsx';
import ChatsTab from './ChatsTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import SocialPostCard from './SocialPostCard.jsx';
import PostVisibilitySelector from './PostVisibilitySelector.jsx';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import UserAvatar from '../../Common/UserAvatar.jsx';
import { motion } from 'framer-motion';
import { compressImage } from '../../../utils/imageCompressor.js';

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

  // Track tabs that have been visited at least once to avoid mounting all 5 tabs on startup
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));

  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const [selectedProfileId, setSelectedProfileId] = useState(() => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments[1] === 'social' && pathSegments[2] === 'profile' && pathSegments[3]) {
      const parsed = parseInt(pathSegments[3], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const profileIdParam = params.get('profileId');
    if (profileIdParam) return parseInt(profileIdParam, 10);
    if (tabParam === 'profile') return null;
    const saved = localStorage.getItem('social_selected_profile_id');
    return saved ? parseInt(saved, 10) : null;
  });

  const [selectedChatContact, setSelectedChatContact] = useState(() => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments[2] === 'chats' && pathSegments[3] && pathSegments[4]) {
      return { id: parseInt(pathSegments[4], 10), type: pathSegments[3] };
    }
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
  const [compressingImage, setCompressingImage] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDevBanner, setShowDevBanner] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto hashtag suggestions (LinkedIn / Instagram style)
  const [hashtagQuery, setHashtagQuery] = useState(null);
  const [hashtagMatchIndex, setHashtagMatchIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const DEFAULT_HASHTAGS = [
    'LeetCodeDSA',
    'SystemDesign',
    'ReactNodeJS',
    'OperatingSystems',
    'DockerDeploy',
    'CampusHackathon',
    'WebDev',
    'Python',
    'CareerAdvice',
    'MachineLearning',
    'Algorithms',
    'TypeScript',
    'JavaScript',
    'OpenSource',
    'StudyTips',
    'DataStructures',
    'InterviewPrep',
    'CloudComputing',
    'CleanCode'
  ];

  const [communityTags, setCommunityTags] = useState(DEFAULT_HASHTAGS);

  // Fetch community tags from backend API
  const fetchCommunityTags = useCallback(async () => {
    try {
      const res = await socialApi.get('/posts/tags');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const names = res.data.map(t => t.name).filter(Boolean);
        setCommunityTags(prev => Array.from(new Set([...names, ...prev])));
      }
    } catch (err) {
      // Fallback to default tags quietly
    }
  }, []);

  useEffect(() => {
    fetchCommunityTags();
  }, [fetchCommunityTags]);

  // Refresh tags when create post modal opens so latest tags by other users are suggested
  useEffect(() => {
    if (showCreatePostModal) {
      fetchCommunityTags();
    }
  }, [showCreatePostModal, fetchCommunityTags]);

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
      searchParams.delete('tab');
      const remainingSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
      navigate(`/dashboard/social/${queryTab}${remainingSearch}`, { replace: true });
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

  const effectiveSocialUser = socialUser || (user ? {
    id: user.id || user.uid,
    name: user.name || 'Student',
    email: user.email || '',
    profilePicture: user.picture || '',
    avatar: user.picture || ''
  } : null);

  useEffect(() => {
    if (user) {
      fetchSocialUser(false, user);
    }
  }, [user, fetchSocialUser]);

  const addPostLocally = useSocialFeedStore(state => state.addPostLocally);

  // Detect when user types # in the content
  const detectHashtag = (text, cursorPos) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)#([a-zA-Z0-9_]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const hashIndex = textBeforeCursor.lastIndexOf('#');
      setHashtagQuery(query);
      setHashtagMatchIndex(hashIndex);
      setActiveSuggestionIndex(0);
    } else {
      setHashtagQuery(null);
      setHashtagMatchIndex(-1);
    }
  };

  const handleContentChange = (e) => {
    const text = e.target.value;
    setContent(text);
    detectHashtag(text, e.target.selectionStart);
  };

  const insertHashtag = (tag) => {
    if (hashtagMatchIndex === -1) return;
    const cleanTag = tag.replace(/^#/, '').trim();
    const beforeHash = content.slice(0, hashtagMatchIndex);
    const cursorPos = textareaRef.current ? textareaRef.current.selectionStart : content.length;
    const afterCursor = content.slice(cursorPos);
    const newContent = `${beforeHash}#${cleanTag} ${afterCursor}`;
    setContent(newContent);
    setHashtagQuery(null);
    setHashtagMatchIndex(-1);

    // Optimistically update community tags state so it's instantly available in current session
    setCommunityTags(prev => {
      if (!prev.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
        return [cleanTag, ...prev];
      }
      return prev;
    });

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = beforeHash.length + cleanTag.length + 2; // +1 for #, +1 for space
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  // Build suggestion list: matched community tags + option to create new tag if query doesn't match
  const normalizedQuery = (hashtagQuery || '').toLowerCase().trim();
  const matchedExisting = hashtagQuery !== null
    ? communityTags.filter(tag => tag.toLowerCase().includes(normalizedQuery))
    : [];

  const exactMatchExists = hashtagQuery !== null && communityTags.some(tag => tag.toLowerCase() === normalizedQuery);
  const canCreateNew = Boolean(hashtagQuery && hashtagQuery.trim().length > 0 && !exactMatchExists);

  const suggestionItems = [
    ...(canCreateNew ? [{ name: hashtagQuery.trim(), isNew: true }] : []),
    ...matchedExisting.map(tag => ({ name: tag, isNew: false }))
  ];

  const handleKeyDownInTextarea = (e) => {
    if (hashtagQuery !== null && suggestionItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestionItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestionItems.length) % suggestionItems.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = suggestionItems[activeSuggestionIndex];
        if (selected) {
          insertHashtag(selected.name);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setHashtagQuery(null);
      }
    }
  };

  const triggerHashtag = () => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
    const cursorPos = textareaRef.current.selectionStart || content.length;
    const before = content.slice(0, cursorPos);
    const after = content.slice(cursorPos);
    const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' #' : '#';
    const newContent = `${before}${prefix}${after}`;
    setContent(newContent);
    const nextPos = before.length + prefix.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(nextPos, nextPos);
        detectHashtag(newContent, nextPos);
      }
    }, 10);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    setLoadingPost(true);

    try {
      const extractedTags = (content.match(/#[a-zA-Z0-9_]+/g) || []);
      const response = await socialApi.post('/posts', { 
        content: content.trim(), 
        image: selectedImage, 
        visibility,
        tags: extractedTags
      });
      addPostLocally(response.data);

      // Store any new tags locally so other posts/searches immediately see them
      if (extractedTags.length > 0) {
        const cleanTags = extractedTags.map(t => t.replace(/^#/, '').trim()).filter(Boolean);
        setCommunityTags(prev => Array.from(new Set([...cleanTags, ...prev])));
      }

      setContent('');
      setSelectedImage(null);
      setHashtagQuery(null);
      setHashtagMatchIndex(-1);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = (file.name || '').toLowerCase();
    const isLikelyImage = 
      file.type.startsWith('image/') || 
      /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?|avif)$/i.test(fileName) ||
      file.type === '';

    if (!isLikelyImage) {
      alert("Please select a valid image file");
      return;
    }

    setCompressingImage(true);
    try {
      // Compress post images maintaining high clarity at ~100-200KB max (1200x1200 max box, 0.86 quality)
      const compressedBase64 = await compressImage(file, 1200, 1200, 0.86);
      setSelectedImage(compressedBase64);
    } catch (err) {
      console.error('Failed to compress post image:', err);
      alert('Failed to process image. Please ensure the image is not corrupted.');
    } finally {
      setCompressingImage(false);
    }
  };

  const openCreatePostModal = (withImagePicker = false) => {
    setShowCreatePostModal(true);
    if (withImagePicker === true) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 150);
    }
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
      setSelectedProfileId(null);
      navigate('/dashboard/social/profile');
      return;
    }
  };

  const socialSubTabs = [
    { id: 'feed', name: 'Feed', icon: Sparkles },
    { id: 'discover', name: 'Discover', icon: Compass },
    { id: 'friends', name: 'Friends', icon: Users2, badge: pendingFriendCount > 0 ? pendingFriendCount : null },
    { id: 'chat', name: 'Chats', icon: MessageCircle, badge: totalUnreadCount > 0 ? totalUnreadCount : null },
  ];

  const [syncTimedOut, setSyncTimedOut] = useState(false);

  useEffect(() => {
    if (!effectiveSocialUser) {
      const timer = setTimeout(() => {
        setSyncTimedOut(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setSyncTimedOut(false);
    }
  }, [effectiveSocialUser]);

  if (!effectiveSocialUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 px-4">
        {!syncTimedOut ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mb-2"></div>
            <span>Syncing social status...</span>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="text-gray-600 dark:text-gray-300 font-medium mb-3">Connecting to Social Hub...</span>
            <button
              onClick={() => fetchSocialUser(true, user)}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold shadow hover:bg-orange-600 transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}
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
            activeTab === 'profile' && (!selectedProfileId || String(selectedProfileId) === String(effectiveSocialUser?.id || user?.id))
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-current">
            <UserAvatar src={effectiveSocialUser?.profilePicture || effectiveSocialUser?.avatar || user?.picture} name={effectiveSocialUser?.name || user?.name} className="w-full h-full" textClassName="text-[9px]" />
          </div>
          <span>My Profile</span>
        </button>
      </div>

      {/* Main Content Area (Scrollable container) */}
      <div className={`flex-1 w-full relative ${(hideHeader || activeTab === 'chat') ? 'overflow-hidden md:overflow-y-auto' : 'overflow-y-auto'}`}>
        <div className={`w-full mx-auto ${(hideHeader || activeTab === 'chat') ? 'px-0 md:px-6 py-0 md:py-6 pb-0 lg:pb-6 h-full' : 'px-2.5 sm:px-4 md:px-6 py-3 sm:py-5 pb-24 lg:pb-6'}`}>

          {/* Tab Panels */}
          <div className={`w-full ${(hideHeader || activeTab === 'chat') ? 'h-full' : ''}`}>
            {visitedTabs.has('feed') && (
              <div className={activeTab === 'feed' ? 'block' : 'hidden'}>
                <FeedTab 
                  currentUserId={effectiveSocialUser?.id || user?.id} 
                  socialUser={effectiveSocialUser}
                  onViewProfile={viewUserProfile} 
                  onSelectChatUser={startDirectChat} 
                  postCreatedTrigger={postCreatedTrigger}
                  onOpenCreatePost={openCreatePostModal}
                  onNavigateTab={handleTabChange}
                />
              </div>
            )}
            {visitedTabs.has('discover') && (
              <div className={activeTab === 'discover' ? 'block' : 'hidden'}>
                <DiscoverTab 
                  onViewProfile={viewUserProfile} 
                  onSelectChatUser={startDirectChat}
                />
              </div>
            )}
            {visitedTabs.has('friends') && (
              <div className={activeTab === 'friends' ? 'block' : 'hidden'}>
                <FriendsTab 
                  onViewProfile={viewUserProfile} 
                  onSelectChatUser={startDirectChat} 
                />
              </div>
            )}
            {visitedTabs.has('chat') && (
              <div className={activeTab === 'chat' ? 'h-full block' : 'hidden'}>
                <ChatsTab 
                  currentUserId={effectiveSocialUser?.id || user?.id}
                  selectedContact={selectedChatContact}
                  onClearSelectedContact={() => setSelectedChatContact(null)}
                  onToggleHeader={setHideHeader}
                  onViewProfile={viewUserProfile}
                />
              </div>
            )}
            {visitedTabs.has('profile') && (
              <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                <ProfileTab 
                  currentUserId={effectiveSocialUser?.id || user?.id}
                  viewUserId={selectedProfileId}
                  onBackToFeed={() => handleTabChange('feed')}
                  onSelectChatUser={startDirectChat}
                  onViewProfile={viewUserProfile}
                />
              </div>
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-750 w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-750 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">Create Post</h3>
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Share knowledge, achievements or thoughts</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowCreatePostModal(false);
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/70 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Author Identity & Audience Row */}
            <div className="px-5 pt-3.5 pb-2 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar 
                  src={effectiveSocialUser?.profilePicture || effectiveSocialUser?.avatar || user?.picture || user?.profilePicture || user?.photoURL} 
                  name={effectiveSocialUser?.name || user?.name || 'You'} 
                  className="w-10 h-10 rounded-full shrink-0 object-cover shadow-xs border border-gray-150 dark:border-gray-700" 
                />
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                  {effectiveSocialUser?.name || user?.name || 'You'}
                </h4>
              </div>
              
              <PostVisibilitySelector
                value={visibility}
                onChange={setVisibility}
                placement="bottom"
                align="right"
              />
            </div>
            
            {/* Form Body */}
            <form onSubmit={handlePost} className="flex-1 overflow-y-auto px-5 py-2 flex flex-col">
              <div className="relative flex-1 min-h-[130px]">
                <textarea 
                  ref={textareaRef}
                  placeholder="What's happening in the community? (Type # to add tags)" 
                  value={content}
                  onChange={handleContentChange}
                  onKeyUp={(e) => detectHashtag(content, e.target.selectionStart)}
                  onClick={(e) => detectHashtag(content, e.target.selectionStart)}
                  onKeyDown={handleKeyDownInTextarea}
                  rows={5}
                  className="w-full bg-transparent text-gray-900 dark:text-white text-sm sm:text-[15px] leading-relaxed outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  autoFocus
                />

                {/* Auto Hashtag Suggestions Popup (LinkedIn / Instagram style) */}
                {hashtagQuery !== null && suggestionItems.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 -mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2 bg-gray-50/90 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700/70 flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                        <Hash size={13} className="stroke-[2.5]" />
                        Suggested tags
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">Press Enter or Tab to select</span>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {suggestionItems.slice(0, 8).map((item, idx) => {
                        const isFocused = idx === activeSuggestionIndex;
                        return (
                          <button
                            key={`${item.name}-${item.isNew ? 'new' : 'existing'}`}
                            type="button"
                            onClick={() => insertHashtag(item.name)}
                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              isFocused 
                                ? 'bg-orange-500 text-white shadow-xs' 
                                : 'hover:bg-orange-50/80 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isFocused 
                                  ? 'bg-white/20 text-white' 
                                  : item.isNew 
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'
                              }`}>
                                {item.isNew ? '+' : '#'}
                              </span>
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className={`text-[10px] font-medium shrink-0 ml-2 ${
                              isFocused 
                                ? 'text-white/80' 
                                : item.isNew 
                                  ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                                  : 'text-gray-400'
                            }`}>
                              {item.isNew ? 'Create new tag' : 'Topic'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Image Preview with Remove Button */}
              {selectedImage && (
                <div className="relative my-3 rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center max-h-64 shadow-inner">
                  <img 
                    src={selectedImage} 
                    alt="Post preview" 
                    className="w-full h-auto max-h-64 object-contain" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition shadow-md cursor-pointer"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,.heic,.heif,.HEIC,.HEIF" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressingImage}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-gray-750 dark:hover:bg-gray-700 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40 transition cursor-pointer"
                  >
                    <ImageIcon size={16} className="text-emerald-500 shrink-0" />
                    <span>{compressingImage ? 'Processing...' : selectedImage ? 'Change Photo' : 'Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={triggerHashtag}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 dark:bg-gray-750 dark:hover:bg-gray-700 border border-transparent hover:border-orange-200 dark:hover:border-orange-900/40 transition cursor-pointer"
                    title="Insert Hashtag"
                  >
                    <Hash size={14} className="text-orange-500 stroke-[2.5] shrink-0" />
                    <span>Tag</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    type="submit" 
                    disabled={loadingPost || (!content.trim() && !selectedImage) || compressingImage}
                    className="px-5 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:hover:from-orange-500 disabled:hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition shadow-md shadow-orange-500/25 cursor-pointer active:scale-95"
                  >
                    <Send size={14} className="shrink-0" />
                    <span>{loadingPost ? 'Posting...' : 'Post'}</span>
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
