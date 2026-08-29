import { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, MapPin, Phone, Instagram, Facebook, Shield, Edit3, Save, UserPlus, UserCheck, Star, MessageSquare, Linkedin, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
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

export default function ProfileTab({ currentUserId, viewUserId, onBackToFeed, onSelectChatUser, onViewProfile }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useModal();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [expandedSection, setExpandedSection] = useState(null); // 'academics', 'contact', 'social', or null

  const isOwnProfile = !viewUserId || 
                       String(viewUserId) === String(currentUserId) ||
                       (profile && (String(profile.id) === String(currentUserId) || (user?.email && profile.email === user.email)));
  const targetId = !viewUserId || String(viewUserId) === String(currentUserId) ? currentUserId : viewUserId;
  const isMobileOrApp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.userAgent.includes('LearnProofApp');

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [targetId]);

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await socialApi.get(`/posts/feed?authorId=${targetId}`);
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await socialApi.get(`/users/profile/${targetId}`);
      setProfile(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const toastId = toast.loading('Saving profile...');
    try {
      const response = await socialApi.put('/users/profile', formData);
      setProfile(response.data);
      setIsEditing(false);

      // Sync name & picture with the global authentication context
      if (updateUser && isOwnProfile) {
        updateUser({
          name: response.data.name,
          picture: response.data.avatar
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

  const handleFriendAction = async () => {
    if (!profile) return;
    try {
      if (profile.hasPendingRequest) {
        if (profile.isRequestSender) {
          // Cancel outgoing request — optimistically show "not connected"
          setProfile(prev => ({ ...prev, hasPendingRequest: false, isRequestSender: false }));
          await socialApi.post('/social/remove-friendship', { targetUserId: profile.id });
        } else {
          // Accept incoming request — optimistically show "Connected"
          setProfile(prev => ({ ...prev, hasPendingRequest: false, isRequestSender: false, isFriend: true }));
          await socialApi.post('/social/accept-friendship', { targetUserId: profile.id });
        }
      } else if (profile.isFriend) {
        // Unfriend — use the app's shared styled confirm modal
        const confirmed = await confirm({
          title: 'Remove Connection?',
          message: `You'll remove ${profile.name} from your connections. They won't be notified.`,
          confirmText: 'Remove',
          cancelText: 'Cancel',
          type: 'danger',
        });
        if (!confirmed) return;
        // Optimistic: show as "not connected" immediately
        setProfile(prev => ({ ...prev, isFriend: false, isMyCloseFriend: false }));
        await socialApi.post('/social/remove-friendship', { targetUserId: profile.id });
      } else {
        // Send request — optimistically show "Pending"
        setProfile(prev => ({ ...prev, hasPendingRequest: true, isRequestSender: true }));
        await socialApi.post('/social/friend-request', { receiverId: profile.id });
      }
      // Sync with server state in background
      fetchProfile();
    } catch (err) {
      console.error('Friend action failed', err);
      // Revert on error
      fetchProfile();
    }
  };

  const handleToggleCloseFriend = async () => {
    if (!profile) return;
    const isClose = !!profile.isMyCloseFriend;
    
    // Optimistic update
    setProfile(prev => ({
      ...prev,
      isMyCloseFriend: !isClose
    }));

    try {
      await socialApi.post('/social/toggle-close-friend', { friendId: profile.id });
      // Sync global store so friends list gets refreshed too!
      const storeState = useSocialFeedStore.getState();
      if (typeof storeState.fetchFriends === 'function') {
        storeState.fetchFriends();
      }
    } catch (err) {
      console.error('Failed to toggle close friend from profile:', err);
      // Revert on error
      setProfile(prev => ({
        ...prev,
        isMyCloseFriend: isClose
      }));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-3"></div>
        <span className="text-xs font-semibold">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500">
        <p className="font-bold text-sm">User Profile Not Found</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-36">
      {isEditing ? (
        <div className="flex flex-col gap-6">
          {/* Edit Mode Hero Header */}
          <div className="bg-white dark:bg-gray-800/95 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar 
                src={profile.profilePicture} 
                name={profile.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-orange-100 dark:border-orange-500/20 shadow-sm"
                textClassName="text-2xl sm:text-3xl"
              />
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 text-[10px] font-black uppercase tracking-wider border border-orange-200/50">
                  Editing Profile
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1">{profile.name}</h2>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{profile._count?.posts || 0} Posts published</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-extrabold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition cursor-pointer active:scale-95 border-0"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form id="profile-form" onSubmit={handleSave} className="flex flex-col gap-6">
            {/* Card 1: Academic & Personal Info */}
            <div className="bg-white dark:bg-gray-800/95 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Academic & Personal Details</h3>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">Manage your display credentials and student information.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50/70 dark:bg-gray-900/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold transition"
                    placeholder="Enter your full name"
                    required 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">College Name</label>
                  <input 
                    type="text" 
                    value={formData.collegeName || ''} 
                    onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                    className="w-full bg-gray-50/70 dark:bg-gray-900/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold transition"
                    placeholder="e.g. Stanford University"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Department / Major</label>
                  <input 
                    type="text" 
                    value={formData.department || ''} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-gray-50/70 dark:bg-gray-900/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold transition"
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Year of Study</label>
                  <input 
                    type="text" 
                    value={formData.yearOfStudy || ''} 
                    onChange={(e) => setFormData({...formData, yearOfStudy: e.target.value})}
                    className="w-full bg-gray-50/70 dark:bg-gray-900/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold transition"
                    placeholder="e.g. 3rd Year / Senior"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400">Visibility:</span>
                      <select
                        value={formData.emailVisibility || 'private'}
                        onChange={(e) => setFormData({...formData, emailVisibility: e.target.value})}
                        className="bg-gray-100 dark:bg-gray-700 text-orange-500 dark:text-orange-400 text-xs font-extrabold rounded-lg px-2 py-0.5 outline-none cursor-pointer border border-gray-200 dark:border-gray-600"
                      >
                        <option value="private">🔒 Only Me</option>
                        <option value="friends">👥 Friends Only</option>
                        <option value="close_friends">⭐️ Close Friends</option>
                        <option value="public">🌐 Public</option>
                      </select>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={formData.email || ''} 
                    disabled
                    className="w-full bg-gray-100/80 dark:bg-gray-900/40 text-gray-400 dark:text-gray-500 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl px-4 py-3 text-sm font-semibold cursor-not-allowed"
                    title="Email is synced with your primary account"
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio Statement</label>
                  <span className={`text-[10px] font-bold ${(formData.bio || '').trim().split(/\s+/).filter(Boolean).length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                    {(formData.bio || '').trim().split(/\s+/).filter(Boolean).length}/50 words
                  </span>
                </div>
                <textarea 
                  value={formData.bio || ''} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const words = val.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 50 || val.length < (formData.bio || '').length) {
                      setFormData({...formData, bio: val});
                    }
                  }}
                  rows={3}
                  placeholder="Share a short bio about what you are studying or passionate about..."
                  className="w-full bg-gray-50/70 dark:bg-gray-900/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold resize-none transition"
                />
              </div>
            </div>

            {/* Card 2: Social & Contact Links */}
            <div className="bg-white dark:bg-gray-800/95 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Social & Contact Links</h3>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">Control how other learners can connect and message you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <SocialFieldEdit 
                  label="Phone Number" 
                  icon={Phone}
                  valueKey="phoneNumber" 
                  visibilityKey="phoneVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="WhatsApp Number" 
                  icon={Phone}
                  valueKey="whatsappNumber" 
                  visibilityKey="whatsappVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="Instagram Username" 
                  icon={Instagram}
                  valueKey="instagramHandle" 
                  visibilityKey="instagramVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="Snapchat Username" 
                  icon={Sparkles}
                  valueKey="snapchatUsername" 
                  visibilityKey="snapchatVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="Facebook URL" 
                  icon={Facebook}
                  valueKey="facebookUrl" 
                  visibilityKey="facebookVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="LinkedIn URL" 
                  icon={Linkedin}
                  valueKey="linkedinUrl" 
                  visibilityKey="linkedinVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-extrabold text-sm transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition cursor-pointer active:scale-95 border-0"
              >
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Left Column: Profile Card + Accordion Details */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:sticky lg:top-4">
            {/* Unified View Mode Card */}
            <div className="bg-white dark:bg-gray-800/95 rounded-3xl border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                {/* Avatar container with green online dot */}
                <div className="relative shrink-0 select-none">
                  <UserAvatar 
                    src={profile.profilePicture} 
                    name={profile.name} 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white dark:border-gray-800 shadow"
                    textClassName="text-3xl sm:text-4xl"
                  />
                  <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm" />
                </div>

                {/* Info details */}
                <div className="flex-1 text-left min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white truncate">{profile.name}</h2>
                  <div className="flex flex-col gap-1 mt-1.5 mb-1.5">
                    {profile.collegeName && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-100/60 dark:border-orange-500/10 w-fit">
                        <MapPin size={11} className="text-orange-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{profile.collegeName}</span>
                      </span>
                    )}
                    {profile.department && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-100/60 dark:border-orange-500/10 w-fit">
                        <GraduationCap size={11} className="text-orange-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{profile.department} {profile.yearOfStudy ? `• ${profile.yearOfStudy}` : ''}</span>
                      </span>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-1 leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Action Row containing stats & Edit Profile / Connect */}
              <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{profile._count?.posts || 0}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider">Posts</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Learner</span>
                  </div>
                </div>

                {isOwnProfile ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition active:scale-[0.98] cursor-pointer border-0"
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <button 
                      onClick={handleFriendAction}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl font-extrabold text-xs transition cursor-pointer active:scale-95 ${
                        profile.isFriend 
                          ? 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100' 
                          : profile.hasPendingRequest 
                            ? 'border border-orange-200 dark:border-orange-950 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100/50' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow shadow-orange-500/10'
                      }`}
                    >
                      {profile.isFriend ? (
                        <><UserCheck size={14} /><span>Connected</span></>
                      ) : profile.hasPendingRequest ? (
                        <><Shield size={14} /><span>{profile.isRequestSender ? 'Request Sent' : 'Accept Request'}</span></>
                      ) : (
                        <><UserPlus size={14} /><span>Connect</span></>
                      )}
                    </button>
                    {profile.isFriend && (
                      <>
                        <button 
                          onClick={() => onSelectChatUser(profile)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow shadow-orange-500/10 transition cursor-pointer active:scale-95"
                        >
                          <MessageSquare size={14} />
                          <span>Message</span>
                        </button>
                        <button 
                          onClick={handleToggleCloseFriend}
                          title={profile.isMyCloseFriend ? "Remove from Close Friends" : "Add to Close Friends"}
                          className={`flex items-center justify-center h-11 w-11 rounded-2xl border transition cursor-pointer active:scale-95 shrink-0 ${
                            profile.isMyCloseFriend 
                              ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 hover:bg-amber-100' 
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <Star size={15} className={profile.isMyCloseFriend ? "fill-amber-500 text-amber-500" : ""} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible Accordion Sections */}
            <div className="flex flex-col gap-4 w-full">
              {/* Card 1: Academics */}
              <div 
                onClick={() => setExpandedSection(expandedSection === 'academics' ? null : 'academics')}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex flex-col gap-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-500/10">
                      <GraduationCap size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Academics</h3>
                      <p className="text-gray-405 dark:text-gray-500 text-xs mt-0.5 font-bold leading-normal">College, Major, Year of Study</p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={18} 
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
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      onClick={(e) => e.stopPropagation()}
                      className="overflow-hidden border-t border-gray-50 dark:border-gray-850 pt-4 cursor-default"
                    >
                      <div className="grid grid-cols-1 gap-3 text-left">
                        <div className="bg-gray-50/50 dark:bg-gray-950 border border-gray-100/50 dark:border-gray-850 rounded-2xl p-4 flex flex-col justify-center min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-1">College</span>
                          <span className="text-xs sm:text-sm font-extrabold text-gray-855 dark:text-gray-200 truncate" title={profile.collegeName}>{profile.collegeName || 'Not Set'}</span>
                        </div>
                        <div className="bg-gray-50/50 dark:bg-gray-955 border border-gray-100/50 dark:border-gray-850 rounded-2xl p-4 flex flex-col justify-center min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider mb-1">Major / Department</span>
                          <span className="text-xs sm:text-sm font-extrabold text-gray-855 dark:text-gray-200 truncate" title={profile.department}>{profile.department || 'Not Set'}</span>
                        </div>
                        <div className="bg-gray-50/50 dark:bg-gray-955 border border-gray-100/50 dark:border-gray-850 rounded-2xl p-4 flex flex-col justify-center min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider mb-1">Year of Study</span>
                          <span className="text-xs sm:text-sm font-extrabold text-gray-855 dark:text-gray-200 truncate">{profile.yearOfStudy || 'Not Set'}</span>
                        </div>
                        {(() => {
                          const vis = profile.emailVisibility || 'private';
                          const canSee = isOwnProfile || 
                                         vis === 'public' || 
                                         (vis === 'friends' && profile.isFriend) || 
                                         (vis === 'close_friends' && profile.isCloseFriend);
                          if (!canSee) return null;
                          return (
                            <div className="bg-gray-50/50 dark:bg-gray-955 border border-gray-100/50 dark:border-gray-850 rounded-2xl p-4 flex flex-col justify-center min-w-0">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider mb-1">Email Address</span>
                              <span className="text-xs sm:text-sm font-extrabold text-gray-855 dark:text-gray-200 truncate" title={profile.email}>{profile.email || 'Not Set'}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card 2: Contact */}
              <div 
                onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex flex-col gap-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-500/10">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Contact</h3>
                      <p className="text-gray-405 dark:text-gray-500 text-xs mt-0.5 font-bold leading-normal">Phone, Email</p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={18} 
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
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      onClick={(e) => e.stopPropagation()}
                      className="overflow-hidden border-t border-gray-50 dark:border-gray-855 pt-4 cursor-default"
                    >
                      <div className="grid grid-cols-1 gap-3 text-left">
                        <div className="bg-gray-50/50 dark:bg-gray-950 border border-gray-100/50 dark:border-gray-850 rounded-2xl p-4 flex items-center justify-between min-w-0">
                          <div className="min-w-0 flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-1">Phone</span>
                            <span className="text-xs sm:text-sm font-extrabold text-gray-850 dark:text-gray-200 truncate">{profile.phoneNumber || 'Not Set'}</span>
                          </div>
                          {profile.phoneNumber && (
                            <a 
                              href={`tel:${profile.phoneNumber}`}
                              className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                        </div>

                        {(() => {
                          const vis = profile.emailVisibility || 'private';
                          const canSee = isOwnProfile || 
                                         vis === 'public' || 
                                         (vis === 'friends' && profile.isFriend) || 
                                         (vis === 'close_friends' && profile.isCloseFriend);
                          if (!canSee && !profile.email) return null;
                          return (
                            <div className="bg-gray-50/50 dark:bg-gray-955 border border-gray-100/50 dark:border-gray-855 rounded-2xl p-4 flex items-center justify-between min-w-0">
                              <div className="min-w-0 flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-1">Email</span>
                                <span className="text-xs sm:text-sm font-extrabold text-gray-855 dark:text-gray-200 truncate" title={canSee ? (profile.email || 'Not Set') : 'Private'}>
                                  {canSee ? (profile.email || 'Not Set') : 'Private'}
                                </span>
                              </div>
                              {canSee && profile.email && (
                                <a 
                                  href={`mailto:${profile.email}`}
                                  className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition"
                                >
                                  <Mail size={14} />
                                </a>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card 3: Social Links */}
              <div 
                onClick={() => setExpandedSection(expandedSection === 'social' ? null : 'social')}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer flex flex-col gap-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-500/10">
                      <Star size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Social Links</h3>
                      <p className="text-gray-405 dark:text-gray-500 text-xs mt-0.5 font-bold leading-normal">Instagram, WhatsApp, LinkedIn & more</p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={18} 
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
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      onClick={(e) => e.stopPropagation()}
                      className="overflow-hidden border-t border-gray-50 dark:border-gray-855 pt-4 cursor-default"
                    >
                      {(() => {
                        const getSocialLink = (label, val) => {
                          if (!val) return null;
                          
                          const cleanVal = val.replace('@', '').trim();
                          const isHttp = val.startsWith('http://') || val.startsWith('https://');

                          if (isMobileOrApp) {
                            // Dynamic deep links for mobile app / TWA context to bypass browser redirect pages and launch native apps
                            switch (label.toLowerCase()) {
                              case 'whatsapp':
                                const waNum = val.replace(/[^0-9]/g, '');
                                return `whatsapp://send?phone=${waNum}`;
                              case 'instagram':
                                if (isHttp) {
                                  const parts = val.split('instagram.com/');
                                  const username = parts[1]?.split('/')[0]?.split('?')[0] || cleanVal;
                                  return `instagram://user?username=${username}`;
                                }
                                return `instagram://user?username=${cleanVal}`;
                              case 'snapchat':
                                if (isHttp) {
                                  const parts = val.split('snapchat.com/add/');
                                  const username = parts[1]?.split('/')[0]?.split('?')[0] || cleanVal;
                                  return `snapchat://add/${username}`;
                                }
                                return `snapchat://add/${cleanVal}`;
                              case 'linkedin':
                                if (isHttp) {
                                  const parts = val.split('linkedin.com/in/');
                                  const username = parts[1]?.split('/')[0]?.split('?')[0] || cleanVal;
                                  return `linkedin://profile/in/${username}`;
                                }
                                return `linkedin://profile/in/${cleanVal}`;
                              case 'facebook':
                                return `fb://facewebmodal/f?href=${isHttp ? val : `https://facebook.com/${cleanVal}`}`;
                              default:
                                return isHttp ? val : `https://${cleanVal}`;
                            }
                          } else {
                            // Standard web links for desktop/web context
                            if (isHttp) return val;
                            switch (label.toLowerCase()) {
                              case 'instagram':
                                return `https://instagram.com/${cleanVal}`;
                              case 'snapchat':
                                return `https://snapchat.com/add/${cleanVal}`;
                              case 'whatsapp':
                                return `https://wa.me/${val.replace(/[^0-9]/g, '')}`;
                              case 'facebook':
                                return `https://facebook.com/${cleanVal}`;
                              case 'linkedin':
                                return `https://linkedin.com/in/${cleanVal}`;
                              default:
                                return `https://${cleanVal}`;
                            }
                          }
                        };

                        const socialFields = [
                          { label: 'Instagram', value: profile.instagramHandle, icon: <Instagram size={15} />, link: getSocialLink('instagram', profile.instagramHandle), colorClass: 'border-pink-500/20 hover:bg-pink-500/5 text-pink-650 dark:text-pink-400 bg-pink-500/5' },
                          { label: 'LinkedIn', value: profile.linkedinUrl, icon: <Linkedin size={15} />, link: getSocialLink('linkedin', profile.linkedinUrl), colorClass: 'border-blue-500/20 hover:bg-blue-500/5 text-blue-650 dark:text-blue-400 bg-blue-500/5' },
                          { label: 'WhatsApp', value: profile.whatsappNumber, icon: <MessageSquare size={15} />, link: getSocialLink('whatsapp', profile.whatsappNumber), colorClass: 'border-green-500/20 hover:bg-green-500/5 text-green-650 dark:text-green-400 bg-green-500/5' },
                          { label: 'Facebook', value: profile.facebookUrl, icon: <Facebook size={15} />, link: getSocialLink('facebook', profile.facebookUrl), colorClass: 'border-indigo-500/20 hover:bg-indigo-500/5 text-indigo-650 dark:text-indigo-400 bg-indigo-500/5' },
                          { label: 'Snapchat', value: profile.snapchatUsername, icon: <User size={15} />, link: getSocialLink('snapchat', profile.snapchatUsername), colorClass: 'border-amber-400/20 hover:bg-amber-400/5 text-amber-600 dark:text-amber-400 bg-amber-400/5' }
                        ];

                        const visibleFields = isOwnProfile ? socialFields : socialFields.filter(f => f.value);

                        if (visibleFields.length === 0) {
                          return (
                            <div className="text-center py-6 bg-gray-50/30 dark:bg-gray-900/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-4">
                              <span className="text-xs text-gray-400 dark:text-gray-550 font-semibold">No social links shared publicly.</span>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 gap-3">
                            {visibleFields.map((field) => (
                              <div 
                                key={field.label}
                                className={`flex items-center justify-between p-4 bg-white dark:bg-gray-950 border rounded-2xl ${field.colorClass}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="shrink-0">{field.icon}</span>
                                  <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{field.label}</span>
                                    <span className="text-xs sm:text-sm font-extrabold truncate" title={field.value || 'Not Set'}>
                                      {field.value || 'Not Set'}
                                    </span>
                                  </div>
                                </div>
                                {field.value && field.link && (
                                  <a 
                                    href={field.link}
                                    target={isMobileOrApp ? "_self" : "_blank"}
                                    rel={isMobileOrApp ? undefined : "noopener noreferrer"}
                                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-current hover:bg-current hover:text-white transition cursor-pointer"
                                  >
                                    Visit
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Posts */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500 animate-pulse" />
              <span>Recent Posts</span>
            </h3>
            <div className="flex flex-col gap-6">
              {postsLoading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                  <span className="text-sm font-medium">Loading recent posts...</span>
                </div>
              ) : (
                posts.map((post) => (
                  <SocialPostCard 
                    key={post.id} 
                    post={post} 
                    onLike={fetchUserPosts} 
                    currentUserId={currentUserId}
                    onViewProfile={onViewProfile}
                  />
                ))
              )}
              
              {!postsLoading && posts.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-550 dark:text-gray-400 shadow-sm">
                  <Sparkles size={32} className="mx-auto mb-3 text-orange-400 opacity-60 animate-pulse" />
                  <p className="text-sm font-semibold text-gray-850 dark:text-gray-200 mb-1">No posts shared yet</p>
                  <p className="text-xs text-gray-450 dark:text-gray-450">This user hasn't posted anything to the social hub feed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialFieldEdit({ label, icon: Icon, valueKey, visibilityKey, formData, setFormData }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
        {label}
      </label>
      <div className="flex items-center bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all overflow-hidden px-3.5">
        {Icon && <Icon size={16} className="text-orange-500 shrink-0 mr-2" />}
        <input 
          type="text" 
          value={formData[valueKey] || ''} 
          onChange={(e) => setFormData({...formData, [valueKey]: e.target.value})}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="flex-1 bg-transparent text-gray-900 dark:text-white border-0 py-3 px-1 focus:outline-none text-sm font-semibold min-w-0"
        />
        <div className="border-l border-gray-200 dark:border-gray-700 h-6 mx-2" />
        <select 
          value={formData[visibilityKey] || 'public'} 
          onChange={(e) => setFormData({...formData, [visibilityKey]: e.target.value})}
          className="bg-transparent border-0 text-xs font-extrabold text-orange-500 dark:text-orange-400 focus:outline-none cursor-pointer outline-none py-2 px-1"
        >
          <option value="public" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">🌐 Public</option>
          <option value="friends" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">👥 Friends</option>
          <option value="close_friends" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">⭐️ Close</option>
          <option value="private" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">🔒 Private</option>
        </select>
      </div>
    </div>
  );
}
