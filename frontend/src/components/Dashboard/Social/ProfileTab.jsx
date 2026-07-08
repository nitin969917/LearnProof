import { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, MapPin, Phone, Instagram, Facebook, Shield, Edit3, Save, UserPlus, UserCheck, Star, MessageSquare, Linkedin, Sparkles } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext.jsx';
import SocialPostCard from './SocialPostCard.jsx';

export default function ProfileTab({ currentUserId, viewUserId, onBackToFeed, onSelectChatUser, onViewProfile }) {
  const { updateUser } = useAuth();
  const isOwnProfile = !viewUserId || viewUserId === currentUserId;
  const targetId = isOwnProfile ? currentUserId : viewUserId;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

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
    e.preventDefault();
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
          // Cancel/Remove pending request
          await socialApi.post('/social/remove-friendship', { targetUserId: profile.id });
        } else {
          // Accept pending request from this user
          await socialApi.post('/social/accept-friendship', { targetUserId: profile.id });
        }
      } else if (profile.isFriend) {
        // Unfriend
        if (!window.confirm(`Remove ${profile.name} from your connections?`)) return;
        await socialApi.post('/social/remove-friendship', { targetUserId: profile.id });
      } else {
        // Send request
        await socialApi.post('/social/friend-request', { receiverId: profile.id });
      }
      fetchProfile();
    } catch (err) {
      console.error('Friend action failed', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
        <span>Syncing profile card...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500">
        <p className="font-semibold">User Profile Not Found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {isEditing ? (
        <>
          {/* Profile Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex gap-4 md:gap-6 items-start">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-3xl md:text-4xl shadow border-2 border-orange-50 dark:border-orange-950/20">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name?.[0]?.toUpperCase() || '?'
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">{profile.name}</h2>
                <div className="flex flex-wrap gap-2 mt-1 mb-1.5">
                  {profile.collegeName && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full">
                      <MapPin size={10} /> {profile.collegeName}
                    </span>
                  )}
                  {profile.department && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full">
                      <GraduationCap size={10} /> {profile.department} {profile.yearOfStudy ? `• Year ${profile.yearOfStudy}` : ''}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  {profile._count?.posts || 0} Posts
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio || 'This user has not set a bio yet.'}</p>
              </div>
            </div>

            <div className="flex gap-2 w-fit mt-1">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 font-bold text-xs transition"
              >
                <Edit3 size={13} />
                <span>Cancel Edit</span>
              </button>
            </div>
          </div>

          {/* Profile Details (Edit Mode) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:p-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-5">
              <h3 className="text-base font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700/50 pb-2">Edit Credentials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white dark:bg-gray-850 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">College Name</label>
                  <input 
                    type="text" 
                    value={formData.collegeName || ''} 
                    onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                    className="w-full bg-white dark:bg-gray-850 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Department / Major</label>
                  <input 
                    type="text" 
                    value={formData.department || ''} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-white dark:bg-gray-850 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Year of Study</label>
                  <input 
                    type="text" 
                    value={formData.yearOfStudy || ''} 
                    onChange={(e) => setFormData({...formData, yearOfStudy: e.target.value})}
                    className="w-full bg-white dark:bg-gray-850 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Bio</label>
                  <span className={`text-[10px] font-bold ${(formData.bio || '').trim().split(/\s+/).filter(Boolean).length >= 50 ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}>
                    {(formData.bio || '').trim().split(/\s+/).filter(Boolean).length}/50 words
                  </span>
                </div>
                <textarea 
                  value={formData.bio || ''} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const words = val.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 50) {
                      setFormData({...formData, bio: val});
                    } else {
                      // Allow editing/deleting even when word count is 50+
                      if (val.length < (formData.bio || '').length) {
                        setFormData({...formData, bio: val});
                      }
                    }
                  }}
                  rows={3}
                  className="w-full bg-white dark:bg-gray-850 text-gray-900 dark:text-white border border-gray-200/80 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold resize-none"
                />
              </div>

              <h3 className="text-base font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700/50 pb-2 pt-2">Social & Contact Links</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SocialFieldEdit 
                  label="Phone Number" 
                  valueKey="phoneNumber" 
                  visibilityKey="phoneVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="WhatsApp Number" 
                  valueKey="whatsappNumber" 
                  visibilityKey="whatsappVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="Instagram Username" 
                  valueKey="instagramHandle" 
                  visibilityKey="instagramVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="Snapchat Username" 
                  valueKey="snapchatUsername" 
                  visibilityKey="snapchatVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="Facebook URL" 
                  valueKey="facebookUrl" 
                  visibilityKey="facebookVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <SocialFieldEdit 
                  label="LinkedIn URL" 
                  valueKey="linkedinUrl" 
                  visibilityKey="linkedinVisibility" 
                  formData={formData} 
                  setFormData={setFormData} 
                />
              </div>

              <div className="flex justify-end pt-3">
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow transition"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        /* Unified View Mode Card *        /* Unified View Mode Card */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex gap-4 md:gap-6 items-start">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-3xl md:text-4xl shadow border-2 border-orange-50 dark:border-orange-950/20">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">{profile.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1 mb-1.5">
                {profile.collegeName && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full">
                    <MapPin size={10} /> {profile.collegeName}
                  </span>
                )}
                {profile.department && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full">
                    <GraduationCap size={10} /> {profile.department} {profile.yearOfStudy ? `• Year ${profile.yearOfStudy}` : ''}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                {profile._count?.posts || 0} Posts
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio || 'This user has not set a bio yet.'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-fit mt-1">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-250 hover:bg-gray-100 dark:hover:bg-gray-700/80 font-bold text-xs transition"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handleFriendAction}
                  className={`flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg font-bold text-xs transition ${
                    profile.isFriend 
                      ? 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-250 hover:bg-gray-100' 
                      : profile.hasPendingRequest 
                        ? 'border border-orange-200 dark:border-orange-950 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100/50' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow shadow-orange-500/10'
                  }`}
                >
                  {profile.isFriend ? (
                    <><UserCheck size={13} /><span>Connected</span></>
                  ) : profile.hasPendingRequest ? (
                    <><Shield size={13} /><span>{profile.isRequestSender ? 'Request Sent' : 'Accept Request'}</span></>
                  ) : (
                    <><UserPlus size={13} /><span>Connect</span></>
                  )}
                </button>
                {profile.isFriend && (
                  <button 
                    onClick={() => onSelectChatUser(profile)}
                    className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow shadow-orange-500/10 transition"
                  >
                    <MessageSquare size={13} />
                    <span>Message</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700/40 w-full" />

          {(() => {
            const getSocialLink = (label, val) => {
              if (!val) return null;
              if (val.startsWith('http://') || val.startsWith('https://')) return val;
              switch (label.toLowerCase()) {
                case 'instagram':
                  return `https://instagram.com/${val.replace('@', '')}`;
                case 'snapchat':
                  return `https://snapchat.com/add/${val}`;
                case 'whatsapp':
                  return `https://wa.me/${val.replace(/[^0-9]/g, '')}`;
                case 'facebook':
                  return `https://facebook.com/${val}`;
                case 'linkedin':
                  return `https://linkedin.com/in/${val}`;
                default:
                  return null;
              }
            };

            const socialFields = [
              { label: 'Phone', value: profile.phoneNumber, icon: <Phone size={14} className="text-orange-500" /> },
              { label: 'WhatsApp', value: profile.whatsappNumber, icon: <MessageSquare size={14} className="text-orange-500" />, link: getSocialLink('whatsapp', profile.whatsappNumber) },
              { label: 'Instagram', value: profile.instagramHandle, icon: <Instagram size={14} className="text-orange-500" />, link: getSocialLink('instagram', profile.instagramHandle) },
              { label: 'Snapchat', value: profile.snapchatUsername, icon: <User size={14} className="text-orange-500" />, link: getSocialLink('snapchat', profile.snapchatUsername) },
              { label: 'Facebook', value: profile.facebookUrl, icon: <Facebook size={14} className="text-orange-500" />, link: getSocialLink('facebook', profile.facebookUrl) },
              { label: 'LinkedIn', value: profile.linkedinUrl, icon: <Linkedin size={14} className="text-orange-500" />, link: getSocialLink('linkedin', profile.linkedinUrl) }
            ];

            const hasAnyVisibleSocial = isOwnProfile || socialFields.some(f => f.value);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Academic Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 dark:bg-gray-900/35 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">College</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={profile.collegeName}>{profile.collegeName || 'Not Set'}</span>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-900/35 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Major/Dept</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={profile.department}>{profile.department || 'Not Set'}</span>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-900/35 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Year of Study</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{profile.yearOfStudy || 'Not Set'}</span>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-900/35 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Email</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={profile.email}>{profile.email || 'Not Set'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Contact & Social Links</h3>
                  {hasAnyVisibleSocial ? (
                    <div className="grid grid-cols-2 gap-3">
                      {socialFields.map((field) => {
                        const hasValue = !!field.value;
                        if (!isOwnProfile && !hasValue) return null;

                        return (
                          <div key={field.label} className="flex items-center justify-between p-3 bg-gray-50/30 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800 rounded-xl min-w-0">
                            <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {field.icon}
                              <span>{field.label}</span>
                            </span>
                            {hasValue ? (
                              field.link ? (
                                <a 
                                  href={field.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline transition truncate max-w-[90px]"
                                  title={field.value}
                                >
                                  {field.value}
                                </a>
                              ) : (
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-250 truncate max-w-[90px]" title={field.value}>{field.value}</span>
                              )
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600">Not Set</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50/30 dark:bg-gray-900/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">No contact links shared publicly.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* User's Posts Feed */}
      <div className="mt-4">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
               <Sparkles size={32} className="mx-auto mb-3 text-orange-400 opacity-60 animate-pulse" />
               <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">No posts shared yet</p>
               <p className="text-xs text-gray-500 dark:text-gray-400">This user hasn't posted anything to the social hub feed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialFieldEdit({ label, valueKey, visibilityKey, formData, setFormData }) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
      <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center bg-white dark:bg-gray-850 border border-gray-200/80 dark:border-gray-700/80 rounded-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all overflow-hidden px-1">
        <input 
          type="text" 
          value={formData[valueKey] || ''} 
          onChange={(e) => setFormData({...formData, [valueKey]: e.target.value})}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="flex-1 bg-transparent text-gray-900 dark:text-white border-0 rounded-none py-2.5 px-2.5 focus:outline-none focus:ring-0 text-sm font-semibold min-w-0"
        />
        <div className="border-l border-gray-100 dark:border-gray-700/60 h-6 mx-1" />
        <select 
          value={formData[visibilityKey] || 'public'} 
          onChange={(e) => setFormData({...formData, [visibilityKey]: e.target.value})}
          className="bg-transparent border-0 text-xs font-bold text-orange-500 dark:text-orange-400 focus:outline-none cursor-pointer outline-none py-2 px-2.5 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23f97316%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option value="public" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">🌐 Public</option>
          <option value="friends" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">👥 Friends</option>
          <option value="close_friends" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">⭐️ Close</option>
        </select>
      </div>
    </div>
  );
}
