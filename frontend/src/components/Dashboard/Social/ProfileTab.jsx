import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, GraduationCap, MapPin, Phone, Instagram, Facebook, 
  Shield, Edit3, Save, UserPlus, UserCheck, Star, MessageSquare, 
  Linkedin, Sparkles, ArrowLeft, ChevronRight, Camera, Heart, 
  Settings, Plus, FileText, Lightbulb, Check, X, ExternalLink,
  Users as UsersIcon, Share2, Compass, Award, Globe, Lock, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import socialApi from '../../../api/socialApi.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useModal } from '../../../context/ModalContext.jsx';
import SocialPostCard from './SocialPostCard.jsx';
import UserAvatar from '../../Common/UserAvatar.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../../../utils/imageCompressor.js';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can see' },
  { value: 'friends', label: 'Friends', icon: UsersIcon, desc: 'Only connections can see' },
  { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can see' },
];

function VisibilityPill({ value = 'public', onChange, label, disabled = false }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>}
      <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-[11px]">
        {VISIBILITY_OPTIONS.map((opt) => {
          const isSelected = (value || 'public') === opt.value;
          const Icon = opt.icon;
          return (
            <button
              type="button"
              key={opt.value}
              disabled={disabled}
              onClick={() => onChange && onChange(opt.value)}
              title={opt.desc}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs scale-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={12} className={isSelected ? 'text-orange-500' : 'text-gray-400'} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VisibilityBadge({ visibility = 'public' }) {
  const v = visibility || 'public';
  if (v === 'private') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
        <Lock size={10} />
        <span>Private</span>
      </span>
    );
  }
  if (v === 'friends') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
        <UsersIcon size={10} />
        <span>Friends</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
      <Globe size={10} />
      <span>Public</span>
    </span>
  );
}

export default function ProfileTab({ currentUserId, viewUserId, onBackToFeed, onSelectChatUser, onViewProfile, onCreatePost }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useModal();
  const socialUser = useSocialFeedStore((state) => state.socialUser);
  const onlineUserIds = useSocialStatusStore((state) => state.onlineUserIds);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [expandedSection, setExpandedSection] = useState(null); // 'academics', 'contact', 'social', 'settings'
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'likes', 'friends'
  const [coverUrl, setCoverUrl] = useState(() => localStorage.getItem('user_cover_image') || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80');

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);

  const effectiveCurrentUserId = currentUserId || socialUser?.id || user?.id;
  const targetId = viewUserId ? parseInt(viewUserId, 10) : effectiveCurrentUserId;
  const isOwnProfile = !viewUserId || (effectiveCurrentUserId && parseInt(viewUserId, 10) === parseInt(effectiveCurrentUserId, 10));
  const isMobileOrApp = typeof navigator !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.userAgent.includes('LearnProofApp'));

  const isOnline = isOwnProfile ? true : (
    onlineUserIds instanceof Set 
      ? onlineUserIds.has(profile?.id) 
      : Array.isArray(onlineUserIds) 
        ? onlineUserIds.includes(profile?.id) 
        : false
  );

  useEffect(() => {
    if (targetId) {
      fetchProfile();
      fetchUserPosts();
      if (isOwnProfile) {
        fetchFriends();
      }
    }
  }, [targetId]);

  const fetchUserPosts = async () => {
    if (!targetId) return;
    setPostsLoading(true);
    try {
      const response = await socialApi.get(`/posts/feed?authorId=${targetId}`);
      const postsData = Array.isArray(response.data) ? response.data : [];
      setPosts(postsData);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const response = await socialApi.get(`/users/profile/${targetId}`);
      setProfile(response.data);
      setFormData({
        ...response.data,
        phoneVisibility: response.data.phoneVisibility || 'public',
        emailVisibility: response.data.emailVisibility || 'private',
        whatsappVisibility: response.data.whatsappVisibility || 'public',
        instagramVisibility: response.data.instagramVisibility || 'public',
        linkedinVisibility: response.data.linkedinVisibility || 'public',
        facebookVisibility: response.data.facebookVisibility || 'public',
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const res = await socialApi.get('/social/friendships');
      if (Array.isArray(res.data)) {
        setFriendsList(res.data);
      }
    } catch (err) {
      console.debug('Failed to fetch friends list:', err?.message);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const toastId = toast.loading('Compressing & updating profile photo...');
    try {
      // Compress avatar with high-quality preservation (~50-80KB, 600x600)
      const compressedBase64 = await compressImage(file, 600, 600, 0.88);
      
      setProfile(prev => ({ ...prev, profilePicture: compressedBase64 }));
      setFormData(prev => ({ ...prev, profilePicture: compressedBase64 }));

      await socialApi.put('/users/profile', {
        ...formData,
        profilePicture: compressedBase64,
      });

      if (updateUser && isOwnProfile) {
        updateUser({
          picture: compressedBase64
        });
      }

      toast.dismiss(toastId);
      toast.success('Profile picture updated!');
    } catch (err) {
      console.error('Failed to update avatar:', err);
      toast.dismiss(toastId);
      toast.error('Failed to update profile picture');
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const toastId = toast.loading('Saving profile...');
    try {
      const response = await socialApi.put('/users/profile', formData);
      setProfile(response.data);
      setFormData({
        ...response.data,
        phoneVisibility: response.data.phoneVisibility || 'public',
        emailVisibility: response.data.emailVisibility || 'private',
        whatsappVisibility: response.data.whatsappVisibility || 'public',
        instagramVisibility: response.data.instagramVisibility || 'public',
        linkedinVisibility: response.data.linkedinVisibility || 'public',
        facebookVisibility: response.data.facebookVisibility || 'public',
      });
      setIsEditing(false);

      if (updateUser && isOwnProfile) {
        updateUser({
          name: response.data.name,
          picture: response.data.avatar || response.data.profilePicture
        });
      }

      toast.dismiss(toastId);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.dismiss(toastId);
      toast.error('Failed to update profile.');
    }
  };

  const handleQuickVisibilityChange = async (fieldName, newVisibility) => {
    const updatedData = {
      ...formData,
      [fieldName]: newVisibility,
    };
    setFormData(updatedData);
    setProfile(prev => ({ ...prev, [fieldName]: newVisibility }));

    try {
      await socialApi.put('/users/profile', updatedData);
      toast.success(`Updated visibility to ${newVisibility}!`, { id: `vis-${fieldName}`, duration: 2000 });
    } catch (err) {
      console.error('Failed to update visibility', err);
      toast.error('Failed to update visibility');
      fetchProfile();
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setCoverUrl(base64);
      localStorage.setItem('user_cover_image', base64);
      toast.success('Cover photo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleFriendAction = async () => {
    if (!profile) return;
    try {
      if (profile.hasPendingRequest) {
        if (profile.isRequestSender) {
          setProfile(prev => ({ ...prev, hasPendingRequest: false, isRequestSender: false }));
          await socialApi.post('/social/remove-friendship', { targetUserId: profile.id });
        } else {
          setProfile(prev => ({ ...prev, hasPendingRequest: false, isRequestSender: false, isFriend: true }));
          await socialApi.post('/social/accept-friendship', { targetUserId: profile.id });
        }
      } else if (profile.isFriend) {
        const confirmed = await confirm({
          title: 'Remove Connection?',
          message: `You'll remove ${profile.name} from your connections.`,
          confirmText: 'Remove',
          cancelText: 'Cancel',
          type: 'danger',
        });
        if (!confirmed) return;
        setProfile(prev => ({ ...prev, isFriend: false, isMyCloseFriend: false }));
        await socialApi.post('/social/remove-friendship', { targetUserId: profile.id });
      } else {
        setProfile(prev => ({ ...prev, hasPendingRequest: true, isRequestSender: true }));
        await socialApi.post('/social/friend-request', { receiverId: profile.id });
      }
      fetchProfile();
    } catch (err) {
      console.error('Friend action failed', err);
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-gray-400">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500 max-w-xl mx-auto my-12">
        <p className="font-bold text-base text-gray-800 dark:text-gray-200">User Profile Not Found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const postCount = posts.length || profile._count?.posts || 0;
  const friendCount = friendsList.length || profile._count?.friends || 0;
  
  // Clean headline & quote without fake predefined placeholders
  const headline = profile.department 
    ? `${profile.department}${profile.yearOfStudy ? ` • ${profile.yearOfStudy}` : ''}`
    : (profile.collegeName || '');
  const quoteText = (profile.bio || '').trim();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-28 font-sans">
      {/* ── Top Cover Banner ── */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 rounded-3xl overflow-hidden shadow-sm border border-gray-200/70 dark:border-gray-800">
        <img
          src={coverUrl}
          alt="Profile Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />

        {/* Change Cover Button (Only on own profile) */}
        {isOwnProfile && (
          <>
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/20 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Camera size={14} />
              <span>Change Cover</span>
            </button>
          </>
        )}

        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/20 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* ── Main 2-Column Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start -mt-16 sm:-mt-20 px-2 sm:px-4">
        
        {/* ── LEFT COLUMN (Profile Card & Accordion Sections) ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* Main User Card with Top-Right Corner Pencil Button */}
          <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 shadow-sm flex flex-col items-center text-center relative">
            
            {/* Top-Right Corner Edit Pencil Button (Only on own profile) */}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 p-2 sm:p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-gray-700 shadow-2xs transition active:scale-95 cursor-pointer z-10"
                title="Edit Profile"
              >
                <Edit3 size={16} />
              </button>
            )}

            {/* Avatar overlapping banner with Photo Upload Support */}
            <div className="relative -mt-14 sm:-mt-16 mb-3 select-none group">
              <UserAvatar
                src={profile.profilePicture || profile.avatar}
                name={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-gray-850 shadow-lg text-4xl font-black object-cover"
                textClassName="text-3xl sm:text-4xl font-extrabold"
              />
              {isOnline && (
                <div
                  title="Online"
                  className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 border-2 sm:border-3 border-white dark:border-gray-850 rounded-full shadow-xs z-10"
                />
              )}

              {/* Avatar Photo Upload Camera Trigger */}
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change Profile Photo"
                    className="absolute bottom-0 left-0 p-1.5 sm:p-2 bg-gray-900/80 hover:bg-orange-600 text-white rounded-full border-2 border-white dark:border-gray-850 shadow-md transition active:scale-95 cursor-pointer z-10"
                  >
                    <Camera size={13} />
                  </button>
                </>
              )}
            </div>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {profile.name}
            </h2>

            {/* Headline - only rendered when user actually has info */}
            {headline ? (
              <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                {headline}
              </p>
            ) : null}

            {/* Bio / Quote - only rendered when user actually entered a bio */}
            {quoteText ? (
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium italic mt-2.5 px-3 leading-relaxed">
                “{quoteText}”
              </p>
            ) : null}

            {/* Action Buttons for other users' profiles */}
            {!isOwnProfile && (
              <div className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-gray-750">
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={handleFriendAction}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-extrabold text-xs transition cursor-pointer active:scale-95 ${
                      profile.isFriend
                        ? 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100'
                        : profile.hasPendingRequest
                          ? 'border border-orange-200 bg-orange-50 text-orange-600'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                    }`}
                  >
                    {profile.isFriend ? (
                      <><UserCheck size={14} /><span>Connected</span></>
                    ) : profile.hasPendingRequest ? (
                      <><Shield size={14} /><span>{profile.isRequestSender ? 'Request Sent' : 'Accept'}</span></>
                    ) : (
                      <><UserPlus size={14} /><span>Connect</span></>
                    )}
                  </button>
                  {profile.isFriend && (
                    <button
                      onClick={() => onSelectChatUser && onSelectChatUser(profile)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-sm transition cursor-pointer active:scale-95"
                    >
                      <MessageSquare size={14} />
                      <span>Message</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Accordion Info Cards ── */}
          <div className="flex flex-col gap-3">
            {/* Card 1: Academics */}
            <div
              onClick={() => setExpandedSection(expandedSection === 'academics' ? null : 'academics')}
              className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-2xs hover:shadow-xs transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center border border-orange-100 dark:border-orange-900/30 shrink-0">
                    <GraduationCap size={19} />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">Academics</h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {profile.collegeName || 'Add your college, major and year'}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-orange-500 transition-transform duration-300 shrink-0 ${
                    expandedSection === 'academics' ? 'rotate-90' : ''
                  }`}
                />
              </div>

              <AnimatePresence>
                {expandedSection === 'academics' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-left"
                  >
                    <div className="bg-orange-50/40 dark:bg-gray-900 p-3 rounded-xl border border-orange-100/60 dark:border-gray-800">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">College / University</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{profile.collegeName || 'Not Set'}</span>
                    </div>
                    <div className="bg-orange-50/40 dark:bg-gray-900 p-3 rounded-xl border border-orange-100/60 dark:border-gray-800">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Major / Branch</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{profile.department || 'Not Set'}</span>
                    </div>
                    <div className="bg-orange-50/40 dark:bg-gray-900 p-3 rounded-xl border border-orange-100/60 dark:border-gray-800">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Year of Study</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{profile.yearOfStudy || 'Not Set'}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 2: Contact with Visibility Indicators */}
            <div
              onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
              className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-2xs hover:shadow-xs transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center border border-orange-100 dark:border-orange-900/30 shrink-0">
                    <User size={19} />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">Contact</h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {profile.phoneNumber || profile.email || 'Add your phone number and email'}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-orange-500 transition-transform duration-300 shrink-0 ${
                    expandedSection === 'contact' ? 'rotate-90' : ''
                  }`}
                />
              </div>

              <AnimatePresence>
                {expandedSection === 'contact' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5 text-left"
                  >
                    {/* Phone Row */}
                    <div className="bg-orange-50/40 dark:bg-gray-900 p-3 rounded-xl border border-orange-100/60 dark:border-gray-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Phone Number</span>
                          {isOwnProfile && <VisibilityBadge visibility={profile.phoneVisibility} />}
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                          {profile.phoneNumber || (isOwnProfile ? 'Not Set' : 'Private')}
                        </span>
                      </div>
                      {profile.phoneNumber && (
                        <a href={`tel:${profile.phoneNumber}`} className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition shrink-0">
                          <Phone size={13} />
                        </a>
                      )}
                    </div>

                    {/* Email Row */}
                    <div className="bg-orange-50/40 dark:bg-gray-900 p-3 rounded-xl border border-orange-100/60 dark:border-gray-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                          {isOwnProfile && <VisibilityBadge visibility={profile.emailVisibility} />}
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px] block">
                          {profile.email || (isOwnProfile ? 'Not Set' : 'Private')}
                        </span>
                      </div>
                      {profile.email && (
                        <a href={`mailto:${profile.email}`} className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition shrink-0">
                          <Mail size={13} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 3: Social Links with Visibility Indicators */}
            <div
              onClick={() => setExpandedSection(expandedSection === 'social' ? null : 'social')}
              className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-2xs hover:shadow-xs transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center border border-orange-100 dark:border-orange-900/30 shrink-0">
                    <Share2 size={19} />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">Social Links</h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      Connect your social media accounts
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-orange-500 transition-transform duration-300 shrink-0 ${
                    expandedSection === 'social' ? 'rotate-90' : ''
                  }`}
                />
              </div>

              <AnimatePresence>
                {expandedSection === 'social' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-left"
                  >
                    {[
                      { label: 'Instagram', val: profile.instagramHandle, vis: profile.instagramVisibility, icon: Instagram, color: 'text-pink-500' },
                      { label: 'LinkedIn', val: profile.linkedinUrl, vis: profile.linkedinVisibility, icon: Linkedin, color: 'text-blue-600' },
                      { label: 'WhatsApp', val: profile.whatsappNumber, vis: profile.whatsappVisibility, icon: MessageSquare, color: 'text-emerald-500' },
                      { label: 'Facebook', val: profile.facebookUrl, vis: profile.facebookVisibility, icon: Facebook, color: 'text-indigo-600' }
                    ].map((s) => (
                      <div key={s.label} className="bg-orange-50/40 dark:bg-gray-900 p-2.5 rounded-xl border border-orange-100/60 dark:border-gray-800 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <s.icon size={15} className={s.color} />
                          <span className="font-bold text-gray-700 dark:text-gray-200 truncate">{s.val || 'Not Connected'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isOwnProfile && <VisibilityBadge visibility={s.vis} />}
                          {s.val && (
                            <span className="text-[10px] font-bold text-orange-600 uppercase">Linked</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 4: Account & Privacy Settings (Only for own profile) */}
            {isOwnProfile && (
              <div
                onClick={() => setExpandedSection(expandedSection === 'settings' ? null : 'settings')}
                className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-2xs hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center border border-orange-100 dark:border-orange-900/30 shrink-0">
                      <Settings size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">Account Settings</h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                        Privacy, visibility & notifications
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-orange-500 transition-transform duration-300 shrink-0 ${
                      expandedSection === 'settings' ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {expandedSection === 'settings' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-3 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <div>
                          <h5 className="font-extrabold text-xs text-gray-900 dark:text-white">Quick Privacy & Visibility</h5>
                          <p className="text-[10px] text-gray-400">Choose who can view your contact & social info</p>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Edit All
                        </button>
                      </div>

                      {[
                        { key: 'phoneVisibility', label: 'Phone Number', current: profile.phoneVisibility || 'public' },
                        { key: 'emailVisibility', label: 'Email Address', current: profile.emailVisibility || 'private' },
                        { key: 'whatsappVisibility', label: 'WhatsApp', current: profile.whatsappVisibility || 'public' },
                        { key: 'instagramVisibility', label: 'Instagram', current: profile.instagramVisibility || 'public' },
                        { key: 'linkedinVisibility', label: 'LinkedIn', current: profile.linkedinVisibility || 'public' },
                      ].map((item) => (
                        <div key={item.key} className="bg-orange-50/40 dark:bg-gray-900 p-2.5 rounded-xl border border-orange-100/60 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.label}</span>
                          <VisibilityPill
                            value={item.current}
                            onChange={(newVal) => handleQuickVisibilityChange(item.key, newVal)}
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (Tab Navigation & Feed Stream) ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Top Activity Tab Strip - Clean Underline Style matching Reference UI */}
          <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-700 px-4 sm:px-6 shadow-2xs flex items-center justify-around sm:justify-start gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 py-3.5 sm:py-4 border-b-2 font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <FileText size={17} className={activeTab === 'posts' ? 'text-orange-500' : 'text-gray-400'} />
              <span>Posts</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'posts'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {postCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('likes')}
              className={`flex items-center gap-2 py-3.5 sm:py-4 border-b-2 font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'likes'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Heart size={17} className={activeTab === 'likes' ? 'text-orange-500' : 'text-gray-400'} />
              <span>Likes</span>
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center gap-2 py-3.5 sm:py-4 border-b-2 font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'friends'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <UsersIcon size={17} className={activeTab === 'friends' ? 'text-orange-500' : 'text-gray-400'} />
              <span>Friends</span>
              {isOwnProfile && friendCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'friends'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {friendCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Tab Content ── */}
          {activeTab === 'posts' && (
            <div className="flex flex-col gap-4">
              {postsLoading ? (
                <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs font-bold">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                    onLike={fetchUserPosts}
                    currentUserId={effectiveCurrentUserId}
                    onViewProfile={onViewProfile}
                  />
                ))
              ) : (
                /* Empty Posts State */
                <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xs space-y-4">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="w-16 h-20 bg-slate-100 dark:bg-gray-750 rounded-2xl border border-slate-200 dark:border-gray-700 flex flex-col p-2.5 gap-1.5 shadow-xs rotate-[-8deg]">
                      <div className="w-7 h-1.5 bg-slate-300 dark:bg-gray-600 rounded-full" />
                      <div className="w-10 h-1.5 bg-slate-200 dark:bg-gray-600 rounded-full" />
                      <div className="w-8 h-1.5 bg-slate-200 dark:bg-gray-600 rounded-full" />
                    </div>
                    <div className="absolute right-2 bottom-1 w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/25 rotate-[12deg]">
                      <Camera size={24} />
                    </div>
                    <Sparkles size={16} className="absolute -top-1 right-2 text-amber-400 animate-bounce" />
                    <Sparkles size={12} className="absolute bottom-2 -left-1 text-orange-400" />
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                      No posts yet
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1 leading-relaxed">
                      Share your thoughts, ideas, achievements or moments with the LearnProof community.
                    </p>
                  </div>

                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        if (onCreatePost) onCreatePost();
                        else if (onBackToFeed) onBackToFeed();
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Create Your First Post</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Quote Banner */}
              <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center border border-amber-200 dark:border-amber-900/30 shrink-0">
                  <Lightbulb size={20} />
                </div>
                <div className="text-left">
                  <h5 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                    Every expert was once a beginner.
                  </h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Share your journey and inspire others!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-8 sm:p-12 text-center text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
                <Heart size={24} />
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white">No Liked Posts Yet</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">Posts you like or bookmark on the Social Hub feed will appear here.</p>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="bg-white dark:bg-gray-850 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-750 pb-3">
                <h4 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <UsersIcon size={16} className="text-orange-500" />
                  <span>Connections & Friends ({friendCount})</span>
                </h4>
              </div>

              {friendsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friendsList.map((f, idx) => {
                    const friendUser = f.friend || f;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/30 dark:bg-gray-900 border border-orange-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            src={friendUser.avatar || friendUser.profilePicture}
                            name={friendUser.name}
                            className="w-10 h-10 rounded-full border border-orange-200 shrink-0 object-cover"
                            textClassName="text-sm font-bold"
                          />
                          <div className="min-w-0 text-left">
                            <p className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{friendUser.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{friendUser.collegeName || ''}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onSelectChatUser && onSelectChatUser(friendUser)}
                          className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                          title="Message Friend"
                        >
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No friends connected yet. Connect with students in Discover or Live Study Rooms!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal with Full Visibility & Photo Upload Controls ── */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 pb-24 sm:pb-6 overflow-y-auto">
          <div className="relative bg-white dark:bg-gray-850 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] shadow-2xl border border-orange-100 dark:border-gray-700 overflow-hidden my-auto">
            {/* Sticky Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-750 flex items-center justify-between bg-white dark:bg-gray-850 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="text-orange-500" size={20} />
                <span>Edit Profile & Privacy</span>
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-profile-form" onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-left">
              {/* Profile Photo Upload inside Edit Modal */}
              <div className="p-4 bg-orange-50/40 dark:bg-gray-900 rounded-2xl border border-orange-100/70 dark:border-gray-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatar
                    src={formData.profilePicture || profile.profilePicture || profile.avatar}
                    name={formData.name || profile.name}
                    className="w-14 h-14 rounded-full border-2 border-orange-300 shadow-sm shrink-0 object-cover"
                    textClassName="text-xl font-bold"
                  />
                  <div>
                    <h5 className="text-xs font-black text-gray-900 dark:text-white">Profile Photo</h5>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">High-quality image compressed automatically</p>
                  </div>
                </div>

                <div>
                  <input
                    type="file"
                    ref={modalAvatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>

              {/* Basic Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stanford University"
                    value={formData.collegeName || ''}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Major / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Year of Study
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3rd Year"
                    value={formData.yearOfStudy || ''}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Bio / Quote
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a short bio about your passions or goals..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Contact & Social Links with Per-Field Visibility Switches */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-750 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">
                    Contact & Social Visibility
                  </h4>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    Set Public (🌐), Friends (👥), or Private (🔒)
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Phone Number with Visibility */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Phone size={14} className="text-orange-500" />
                        <span>Phone Number</span>
                      </label>
                      <VisibilityPill
                        value={formData.phoneVisibility || 'public'}
                        onChange={(val) => setFormData({ ...formData, phoneVisibility: val })}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Email Visibility */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Mail size={14} className="text-orange-500" />
                        <span>Email Address</span>
                      </label>
                      <VisibilityPill
                        value={formData.emailVisibility || 'private'}
                        onChange={(val) => setFormData({ ...formData, emailVisibility: val })}
                      />
                    </div>
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800/60 rounded-xl text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {profile.email || 'Your account email'}
                    </div>
                  </div>

                  {/* WhatsApp with Visibility */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-emerald-500" />
                        <span>WhatsApp Number</span>
                      </label>
                      <VisibilityPill
                        value={formData.whatsappVisibility || 'public'}
                        onChange={(val) => setFormData({ ...formData, whatsappVisibility: val })}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="+15550000000"
                      value={formData.whatsappNumber || ''}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Instagram Handle with Visibility */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Instagram size={14} className="text-pink-500" />
                        <span>Instagram Handle</span>
                      </label>
                      <VisibilityPill
                        value={formData.instagramVisibility || 'public'}
                        onChange={(val) => setFormData({ ...formData, instagramVisibility: val })}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="@username"
                      value={formData.instagramHandle || ''}
                      onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* LinkedIn URL with Visibility */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Linkedin size={14} className="text-blue-600" />
                        <span>LinkedIn Profile URL</span>
                      </label>
                      <VisibilityPill
                        value={formData.linkedinVisibility || 'public'}
                        onChange={(val) => setFormData({ ...formData, linkedinVisibility: val })}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Facebook URL with Visibility */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Facebook size={14} className="text-indigo-600" />
                        <span>Facebook Profile URL</span>
                      </label>
                      <VisibilityPill
                        value={formData.facebookVisibility || 'public'}
                        onChange={(val) => setFormData({ ...formData, facebookVisibility: val })}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="https://facebook.com/username"
                      value={formData.facebookUrl || ''}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Sticky Modal Footer - Always Visible Above Mobile Nav */}
            <div className="p-3.5 sm:p-4 border-t border-gray-100 dark:border-gray-750 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-750 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <Save size={15} />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
