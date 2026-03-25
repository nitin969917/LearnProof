import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, Search, Youtube, Play, FileText, ExternalLink, Award, ListVideo, ChevronDown, ChevronUp, Video } from 'lucide-react';
import { useModal } from '../../../context/ModalContext';

const AdminContentList = () => {
    const [usersData, setUsersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPlaylists, setExpandedPlaylists] = useState(new Set());
    const { token } = useAuth();
    const { confirm } = useModal();

    const fetchContent = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/content`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsersData(response.data.usersWithContent);
        } catch (err) {
            console.error("Failed to fetch content", err);
            toast.error("Failed to load content list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchContent();
    }, [token]);

    const handleDeleteVideo = async (videoId, videoName) => {
        const confirmed = await confirm({
            title: "Delete Content",
            message: `Are you sure you want to permanently delete video "${videoName}"? This will remove it for this user.`,
            confirmText: "Delete Permanently",
            type: "danger"
        });

        if (!confirmed) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/content/${videoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state by stripping the video from whichever user/playlist holds it
            setUsersData(prev => prev.map(u => ({
                ...u,
                videos: u.videos.filter(v => v.id !== videoId),
                playlists: u.playlists.map(p => ({
                    ...p,
                    videos: p.videos.filter(v => v.id !== videoId)
                }))
            })));
            toast.success("Video deleted successfully");
        } catch (err) {
            console.error("Failed to delete video", err);
            toast.error("Failed to delete video");
        }
    };

    const togglePlaylist = (playlistId) => {
        setExpandedPlaylists(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playlistId)) newSet.delete(playlistId);
            else newSet.add(playlistId);
            return newSet;
        });
    };

    const filteredUsers = usersData.filter(u =>
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const renderVideoRow = (video) => (
        <div key={video.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="relative shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-slate-800 shadow-sm">
                    <img
                        src={`https://img.youtube.com/vi/${video.vid}/mqdefault.jpg`}
                        alt="thumbnail"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <a
                        href={`https://youtube.com/watch?v=${video.vid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        title="View on YouTube"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate mb-1" title={video.name}>{video.name || 'Untitled Video'}</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Youtube className="w-3.5 h-3.5 text-red-500" />
                            <span>{video.vid}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${video.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.round((video.watch_progress || 0) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{Math.round((video.watch_progress || 0) * 100)}%</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/50">
                            <FileText size={10} /> {video._count?.quizzes || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-semibold border border-green-200/50">
                            <Award size={10} /> {video._count?.certificates || 0}
                        </span>
                    </div>
                </div>
            </div>

            <div className="shrink-0 flex items-center justify-end w-full sm:w-auto">
                <button
                    onClick={() => handleDeleteVideo(video.id, video.name)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 xl:opacity-0 xl:group-hover:opacity-100"
                    title="Delete Video"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col shrink-0">
                <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Content Audit</h2>
                        <p className="text-sm text-slate-500 mt-1">Review playlists and videos imported by users</p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                        const hasContent = user.playlists.length > 0 || user.videos.length > 0;
                        if (!hasContent) return null;

                        return (
                            <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-200">
                                {/* User Header */}
                                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-20 rounded-t-2xl">
                                    {user.profile_pic ? (
                                        <img src={user.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-300" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center border border-orange-200">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-600 bg-white px-4 py-1.5 rounded-full border border-slate-200">
                                        <div className="flex items-center gap-1.5"><ListVideo size={16} className="text-blue-500" /> {user.playlists.length} Playlists</div>
                                        <div className="w-px h-4 bg-slate-200"></div>
                                        <div className="flex items-center gap-1.5"><Video size={16} className="text-purple-500" /> {user.playlists.reduce((acc, p) => acc + p.videos.length, 0) + user.videos.length} Videos</div>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-2 sm:p-4 space-y-4">
                                    {/* Playlists */}
                                    {user.playlists.length > 0 && (
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
                                                                    playlist.videos.map(video => renderVideoRow(video))
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
                                    {user.videos.length > 0 && (
                                        <div>
                                            {user.playlists.length > 0 && <h4 className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Standalone Videos</h4>}
                                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                {user.videos.map(video => renderVideoRow(video))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No content found</h3>
                        <p className="text-slate-500 text-sm">No users match your specific search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContentList;
