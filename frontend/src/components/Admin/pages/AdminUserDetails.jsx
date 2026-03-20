import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Calendar, Activity, Video, Award, Lightbulb, Flame, ListVideo, ChevronDown, ChevronUp, ExternalLink, Youtube, FileText } from 'lucide-react';

const AdminUserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedPlaylists, setExpandedPlaylists] = useState(new Set());

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data.user);
            } catch (err) {
                console.error("Failed to fetch user details", err);
                toast.error("Failed to load user profile");
                navigate('/admin/users');
            } finally {
                setLoading(false);
            }
        };

        if (token && id) fetchUser();
    }, [id, token, navigate]);

    const togglePlaylist = (playlistId) => {
        setExpandedPlaylists(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playlistId)) newSet.delete(playlistId);
            else newSet.add(playlistId);
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Student Profile</h2>
                    <p className="text-sm text-slate-500">Deep dive performance tracking for UID: {user.uid}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Profile Card */}
                <div className="space-y-6">
                    {/* User ID Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            {user.profile_pic ? (
                                <img src={user.profile_pic} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 font-bold text-2xl flex items-center justify-center border-4 border-slate-50 shadow-sm">
                                    {user.name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                    <Mail size={14} />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                    <Calendar size={14} />
                                    <span>Joined {new Date(user.joined_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100/50 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Level</span>
                                <span className="text-2xl font-black text-orange-700">{user.level}</span>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/50 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">XP Earned</span>
                                <span className="text-2xl font-black text-amber-700">{user.xp}</span>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 border border-red-100/50 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Streak</span>
                                <div className="flex items-center gap-1">
                                    <Flame size={20} className="text-red-500" />
                                    <span className="text-2xl font-black text-red-700">{user.streak_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="text-blue-500" size={18} />
                            Platform Usage
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <ListVideo size={16} /> <span className="text-sm font-medium">Playlists Discovered</span>
                                </div>
                                <span className="font-bold text-slate-800">{user._count?.playlists || 0}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Video size={16} /> <span className="text-sm font-medium">Videos Enrolled</span>
                                </div>
                                <span className="font-bold text-slate-800">{user._count?.videos || 0}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Lightbulb size={16} /> <span className="text-sm font-medium">Quizzes Taken</span>
                                </div>
                                <span className="font-bold text-slate-800">{user._count?.quizzes || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Award size={16} /> <span className="text-sm font-medium">Certificates</span>
                                </div>
                                <span className="font-bold text-slate-800">{user._count?.certificates || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Progress & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Course Progress */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800">Enrolled Content</h4>
                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1"><ListVideo size={14} className="text-blue-500" /> {user.playlists?.length || 0} Playlists</span>
                                <span className="flex items-center gap-1"><Video size={14} className="text-purple-500" /> {(user.playlists?.reduce((acc, p) => acc + p.videos.length, 0) || 0) + (user.videos?.length || 0)} Videos</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Playlists */}
                            {user.playlists && user.playlists.length > 0 && (
                                <div className="space-y-3">
                                    {user.playlists.map(playlist => {
                                        const isExpanded = expandedPlaylists.has(playlist.id);
                                        return (
                                            <div key={playlist.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                                <button
                                                    onClick={() => togglePlaylist(playlist.id)}
                                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden pr-4">
                                                        <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                            <ListVideo size={20} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-slate-800 text-sm truncate">{playlist.name}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                <span className="font-medium">{playlist.videos.length} Videos</span>
                                                                <span>•</span>
                                                                <span>{new Date(playlist.imported_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-slate-400">
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-slate-200 bg-white">
                                                        {playlist.videos.length > 0 ? (
                                                            <div className="divide-y divide-slate-100">
                                                                {playlist.videos.map(video => (
                                                                    <div key={video.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                                                                        <div className="relative shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-slate-800 shadow-sm hidden sm:block">
                                                                            <img src={`https://img.youtube.com/vi/${video.vid}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-90" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <p className="font-semibold text-slate-800 text-sm truncate pr-4" title={video.name}>{video.name || 'Untitled Video'}</p>
                                                                                {video.is_completed && <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider">Done</span>}
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[200px]">
                                                                                    <div className={`h-full rounded-full ${video.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.round((video.watch_progress || 0) * 100)}%` }} />
                                                                                </div>
                                                                                <span className="text-[10px] font-semibold text-slate-500 w-6">{Math.round((video.watch_progress || 0) * 100)}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 text-center text-sm text-slate-500 italic">No videos in this playlist.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Standalone Videos */}
                            {user.videos && user.videos.length > 0 && (
                                <div>
                                    {user.playlists && user.playlists.length > 0 && <h5 className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Standalone Videos</h5>}
                                    <div className="space-y-3">
                                        {user.videos.map(video => (
                                            <div key={video.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors flex items-start gap-4">
                                                <div className="relative shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-slate-800 shadow-sm hidden sm:block">
                                                    <img src={`https://img.youtube.com/vi/${video.vid}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-90" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <p className="font-semibold text-slate-800 text-sm truncate pr-4" title={video.name}>{video.name || 'Untitled Video'}</p>
                                                        {video.is_completed && <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider">Done</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                                                            <div className={`h-full rounded-full ${video.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.round((video.watch_progress || 0) * 100)}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-slate-500 w-6">{Math.round((video.watch_progress || 0) * 100)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!user.playlists?.length && !user.videos?.length) && (
                                <p className="text-sm text-slate-500 py-8 text-center italic bg-slate-50 rounded-xl border border-slate-100 border-dashed">No content discovered yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Detailed Activity Feed */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h4 className="font-bold text-slate-800">Recent Activity Log</h4>
                        </div>
                        <div className="max-h-96 overflow-y-auto p-2">
                            {user.activities && user.activities.length > 0 ? (
                                <div className="space-y-1 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    {user.activities.map((activity, index) => (
                                        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-100 group-hover:bg-orange-100 text-slate-500 group-hover:text-orange-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                                <Activity size={14} />
                                            </div>
                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className="font-bold text-slate-800 text-sm">{activity.activity_type}</div>
                                                    <time className="text-xs font-medium text-slate-400">{new Date(activity.timestamp).toLocaleDateString()}</time>
                                                </div>
                                                <time className="text-[10px] font-medium text-slate-400 block">{new Date(activity.timestamp).toLocaleTimeString()}</time>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 p-4 text-center italic">No activity logs recorded.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminUserDetails;
