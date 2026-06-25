import { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, MapPin, Phone, Instagram, Facebook, Shield, Edit3, Save, UserPlus, UserCheck, Star, MessageSquare, Linkedin, Sparkles } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import SocialPostCard from './SocialPostCard.jsx';

export default function ProfileTab({ currentUserId, viewUserId, onBackToFeed, onSelectChatUser, onViewProfile }) {
  const isOwnProfile = !viewUserId || viewUserId === currentUserId;
  const targetId = isOwnProfile ? currentUserId : viewUserId;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [targetId]);

  const fetchUserPosts = async () => {
    try {
      const response = await socialApi.get(`/posts/feed?authorId=${targetId}`);
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
      setPosts([]);
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
    try {
      const response = await socialApi.put('/users/profile', formData);
      setProfile(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile.');
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-4xl shadow-md border-4 border-orange-50 dark:border-orange-950/20">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{profile.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed font-medium">{profile.bio || 'This user has not set a bio yet.'}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {profile.collegeName && (
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-orange-500" /> {profile.collegeName}</span>
                )}
                {profile.department && (
                  <span className="flex items-center gap-1"><GraduationCap size={14} className="text-orange-500" /> {profile.department} {profile.yearOfStudy ? `• Year ${profile.yearOfStudy}` : ''}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0 w-full md:w-auto">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 font-bold text-sm transition"
              >
                <Edit3 size={16} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* Profile Details (Edit Mode) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Edit Credentials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-750 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">College Name</label>
                  <input 
                    type="text" 
                    value={formData.collegeName || ''} 
                    onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-750 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Department / Major</label>
                  <input 
                    type="text" 
                    value={formData.department || ''} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-750 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Year of Study</label>
                  <input 
                    type="text" 
                    value={formData.yearOfStudy || ''} 
                    onChange={(e) => setFormData({...formData, yearOfStudy: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-750 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Bio</label>
                <textarea 
                  value={formData.bio || ''} 
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-750 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium resize-none"
                />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-750 pb-2 pt-4">Social & Contact Links</h3>
              
              <div className="space-y-4">
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

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-655 text-white font-bold text-sm shadow transition"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        /* Unified View Mode Card */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-4xl shadow-md border-4 border-orange-50 dark:border-orange-950/20">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{profile.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed font-medium">{profile.bio || 'This user has not set a bio yet.'}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {profile.collegeName && (
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-orange-500" /> {profile.collegeName}</span>
                )}
                {profile.department && (
                  <span className="flex items-center gap-1"><GraduationCap size={14} className="text-orange-500" /> {profile.department} {profile.yearOfStudy ? `• Year ${profile.yearOfStudy}` : ''}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0 w-full md:w-auto">
              {isOwnProfile ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 font-bold text-sm transition"
                >
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleFriendAction}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                      profile.isFriend 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200' 
                        : profile.hasPendingRequest 
                          ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow shadow-orange-500/20'
                    }`}
                  >
                    {profile.isFriend ? (
                      <><UserCheck size={16} /><span>Connected</span></>
                    ) : profile.hasPendingRequest ? (
                      <><Shield size={16} /><span>{profile.isRequestSender ? 'Request Sent' : 'Accept Request'}</span></>
                    ) : (
                      <><UserPlus size={16} /><span>Connect</span></>
                    )}
                  </button>
                  {profile.isFriend && (
                    <button 
                      onClick={() => onSelectChatUser(profile)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow shadow-orange-500/20 transition"
                    >
                      <MessageSquare size={16} />
                      <span>Chat</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-750/40 w-full" />

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
          {posts.map((post) => (
            <SocialPostCard 
              key={post.id} 
              post={post} 
              onLike={fetchUserPosts} 
              currentUserId={currentUserId}
              onViewProfile={onViewProfile}
            />
          ))}
          
          {posts.length === 0 && (
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
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
      <div className="sm:col-span-4 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</div>
      <div className="sm:col-span-5">
        <input 
          type="text" 
          value={formData[valueKey] || ''} 
          onChange={(e) => setFormData({...formData, [valueKey]: e.target.value})}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
        />
      </div>
      <div className="sm:col-span-3">
        <select 
          value={formData[visibilityKey] || 'public'} 
          onChange={(e) => setFormData({...formData, [visibilityKey]: e.target.value})}
          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="public">🌐 Public</option>
          <option value="friends">👥 Friends</option>
          <option value="close_friends">⭐️ Close Friends</option>
        </select>
      </div>
    </div>
  );
}
