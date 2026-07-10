import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Library, Video, Search, Trash2, Plus, Clock, ChevronRight, Sparkles, BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { useModal } from "../../context/ModalContext";

function useDebouncedValue(value, delay = 500) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

const MyLearnings = () => {
    const { token } = useAuth();
    const { confirm } = useModal();

    const [activeTab, setActiveTab] = useState(localStorage.getItem("libraryActiveTab") || "playlists");

    useEffect(() => {
        localStorage.setItem("libraryActiveTab", activeTab);
    }, [activeTab]);

    const [videos, setVideos] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [videoPagination, setVideoPagination] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [roadmapDaysUpdate, setRoadmapDaysUpdate] = useState({});
    const [isSavingRoadmap, setIsSavingRoadmap] = useState({});
    const [expandedRoadmap, setExpandedRoadmap] = useState(null);

    const navigate = useNavigate();
    const debouncedSearch = useDebouncedValue(searchQuery);

    useEffect(() => {
        if (!token) return;
        setPage(1); // reset page when search changes
    }, [debouncedSearch]);

    useEffect(() => {
        if (!token) return;

        const fetchLearnings = async () => {
            setLoading(true);
            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/my-learnings/`,
                    {
                        idToken: token,
                        page: page,
                        searchQuery: debouncedSearch,
                    }
                );
                setVideos(res.data.videos.results);
                setVideoPagination(res.data.videos);
                setPlaylists(res.data.playlists);
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch learnings");
            } finally {
                setLoading(false);
            }
        };

        fetchLearnings();
    }, [token, page, debouncedSearch]);

    const handleVideoDelete = async (videoId) => {
        if (!token) return;

        const confirmed = await confirm({
            title: "Delete Video",
            message: "Are you sure you want to delete this video? This action cannot be undone.",
            confirmText: "Delete",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delete-video/`, {
                idToken: token,
                videoId,
            });
            toast.success("Video deleted!");

            setVideos(prev => prev.filter(v => v.vid !== videoId));

            // Also remove from playlists if needed
            setPlaylists(prev =>
                prev.map(p => ({
                    ...p,
                    videos: p.videos.filter(v => v.vid !== videoId),
                }))
            );
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete video");
        }
    };

    const handlePlaylistDelete = async (playlist, playlistId) => {
        if (!token) return;

        const confirmed = await confirm({
            title: "Delete Playlist",
            message: `Are you sure you want to delete "${playlist.name}"? All videos in this playlist will also be removed.`,
            confirmText: "Delete Playlist",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delete-playlist/`, {
                idToken: token,
                playlistId,
            });
            toast.success("Playlist deleted!");

            setPlaylists(prev => prev.filter(p => p.pid !== playlistId));
            setVideos(prev => prev.filter(v => !playlist.videos.some(pv => pv.vid === v.vid)));
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete playlist");
        }
    };

    const getProgress = (videos) => {
        if (!videos || videos.length === 0) return 0;
        const totalVideos = videos.length;
        const completedVideos = videos.filter(v => v.is_completed).length;
        return Math.round((completedVideos / totalVideos) * 100);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return "0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const getDailySchedule = (videos, days) => {
        if (!videos || !days || days <= 0) return [];
        
        const totalDuration = videos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);
        const targetPerDay = totalDuration / days;
        
        const schedule = [];
        let currentDayVideos = [];
        let currentDayDuration = 0;
        let dayCount = 1;

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            const videoDuration = video.duration_seconds || 0;

            // If adding this video keeps us close to target, or it's the last video
            // Or if we still have many days left to fill but only few videos
            const isLastVideo = i === videos.length - 1;
            
            currentDayVideos.push(video);
            currentDayDuration += videoDuration;

            // Decision to close the day:
            // 1. If we exceed target and it's not the last day
            // 2. Or if we are the last video, close current day
            if ((currentDayDuration >= targetPerDay && dayCount < days) || isLastVideo) {
                schedule.push({
                    day: dayCount,
                    videos: currentDayVideos,
                    totalDuration: currentDayDuration
                });
                currentDayVideos = [];
                currentDayDuration = 0;
                dayCount++;
            }
        }
        
        // Safety: If for some reason we created more than requested days (rare with this logic)
        // or less, this sequential greedy approach keeps the order.
        return schedule;
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing your library...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "playlists", label: "Playlists", icon: Library },
        { id: "videos", label: "Videos", icon: Video },
        { id: "roadmap", label: "Roadmap", icon: Sparkles }
    ];

    const handleUpdateRoadmap = async (pid, days) => {
        if (!days || isNaN(days) || parseInt(days) <= 0) {
            toast.error("Please enter a valid number of days.");
            return;
        }

        setIsSavingRoadmap(prev => ({ ...prev, [pid]: true }));
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/set-playlist-goal/`, {
                idToken: token,
                pid: pid,
                duration_goal: parseInt(days)
            });
            toast.success("Roadmap updated!");
            
            // Update local state to reflect change
            setPlaylists(prev => prev.map(p => 
                p.pid === pid ? { ...p, duration_goal: parseInt(days) } : p
            ));
        } catch (err) {
            console.error(err);
            toast.error("Failed to update roadmap");
        } finally {
            setIsSavingRoadmap(prev => ({ ...prev, [pid]: false }));
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-3 pb-28 space-y-4">
            {/* ── Compact Mobile Header ───────────────────────────────── */}
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                    <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">My Learning</h1>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Your curated library & roadmaps</p>
                </div>
            </div>

            {/* ── Search + Tab Bar ────────────────────────────────── */}
            <div className="space-y-2">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={15} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                </div>
                {/* Tab Switcher */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto hide-scrollbar gap-0.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearchQuery("");
                                }}
                                className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex-1 ${
                                    activeTab === tab.id
                                        ? "text-white"
                                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabLibrary"
                                        className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon size={13} className="relative z-10" />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {activeTab === "videos" && (
                    <div className="space-y-3">
                        {videos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 text-center">
                                <Video className="w-12 h-12 text-gray-300 dark:text-gray-650 mx-auto mb-2" />
                                <p className="text-xs text-gray-405 dark:text-gray-500 font-medium">No videos in your library yet.</p>
                            </div>
                        ) : (
                            videos.map((video, index) => (
                                <motion.div
                                    key={video.vid}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="group/card bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-orange-300 transition-all overflow-hidden relative p-3 flex gap-3 cursor-pointer"
                                    onClick={() => navigate(`/classroom/${video.vid}`)}
                                >
                                    {/* Left Side: Thumbnail */}
                                    <div className="w-24 aspect-video bg-gray-105 dark:bg-gray-700/50 relative flex items-center justify-center overflow-hidden rounded-xl shrink-0 border border-gray-100 dark:border-gray-700/50">
                                        <img
                                            src={`https://img.youtube.com/vi/${video.vid}/hqdefault.jpg`}
                                            alt={video.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <Play size={16} className="text-white fill-white" />
                                        </div>
                                        {video.is_completed && (
                                            <div className="absolute top-1 left-1 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                                                Done
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side: Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]"></div>
                                                    <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Video Lesson</span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-xs line-clamp-2 leading-snug group-hover/card:text-orange-500 transition-colors">
                                                    {video.name}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleVideoDelete(video.vid);
                                                }}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all shrink-0 border border-red-500/10"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-[9px] mb-1 font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                                <span>Progress</span>
                                                <span className="text-orange-600 dark:text-orange-400">{Math.round(video.watch_progress || 0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.round(video.watch_progress || 0)}%` }}
                                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "playlists" && (
                    <div className="space-y-3">
                        {playlists.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 text-center">
                                <Library className="w-12 h-12 text-gray-300 dark:text-gray-650 mx-auto mb-2" />
                                <p className="text-xs text-gray-405 dark:text-gray-500 font-medium">No playlists found.</p>
                            </div>
                        ) : (
                            playlists.map((pl, index) => {
                                const totalVideos = pl.videos?.length || 0;
                                const completedVideos = pl.videos?.filter(v => v.is_completed)?.length || 0;
                                const percentComplete = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;
                                const thumbnail = pl.thumbnail || (pl.videos?.length > 0 ? `https://img.youtube.com/vi/${pl.videos[0].vid}/hqdefault.jpg` : "");

                                return (
                                    <motion.div
                                        key={pl.pid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="group/card bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-orange-300 transition-all overflow-hidden relative p-3 flex gap-3 cursor-pointer"
                                        onClick={() => navigate(`/dashboard/playlist/${pl.pid}`)}
                                    >
                                        {/* Left Side: Thumbnail */}
                                        <div className="w-24 aspect-video bg-gray-105 dark:bg-gray-700/50 relative flex items-center justify-center overflow-hidden rounded-xl shrink-0 border border-gray-100 dark:border-gray-700/50">
                                            {thumbnail ? (
                                                <img src={thumbnail} alt={pl.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Library size={24} className="text-orange-200" />
                                            )}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                <Play size={16} className="text-white fill-white" />
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                                                {totalVideos} Lessons
                                            </div>
                                        </div>

                                        {/* Right Side: Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"></div>
                                                        <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Mastery Path</span>
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-xs line-clamp-2 leading-snug group-hover/card:text-orange-500 transition-colors">
                                                        {pl.name}
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlaylistDelete(pl, pl.pid);
                                                    }}
                                                    className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all shrink-0 border border-red-500/10"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            <div className="mt-2">
                                                <div className="flex items-center justify-between text-[9px] mb-1 font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                                    <span className="text-[8px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                                                        {completedVideos}/{totalVideos} COMPLETED
                                                    </span>
                                                    <span className="text-orange-600 dark:text-orange-400">{percentComplete}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentComplete}%` }}
                                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === "roadmap" && (
                    <div className="space-y-3">
                        {playlists.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 text-center">
                                <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-650 mx-auto mb-2" />
                                <p className="text-xs text-gray-405 dark:text-gray-500 font-medium">No roadmaps set up yet.</p>
                            </div>
                        ) : (
                            playlists.map((pl, index) => {
                                const totalVideos = pl.videos?.length || 0;
                                const completedVideos = pl.videos?.filter(v => v.is_completed)?.length || 0;
                                const percentComplete = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;
                                const thumbnail = pl.thumbnail || (pl.videos?.length > 0 ? `https://img.youtube.com/vi/${pl.videos[0].vid}/hqdefault.jpg` : "");
                                const currentGoal = pl.duration_goal || "";
                                const tempGoal = roadmapDaysUpdate[pl.pid] !== undefined ? roadmapDaysUpdate[pl.pid] : currentGoal;
                                const videosPerDay = tempGoal ? Math.ceil(totalVideos / parseInt(tempGoal)) : 0;

                                return (
                                    <motion.div
                                        key={`roadmap-${pl.pid}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="group/card bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-orange-300 transition-all overflow-hidden relative p-3 flex gap-3 cursor-pointer"
                                        onClick={() => navigate(`/dashboard/roadmap/${pl.pid}`)}
                                    >
                                        {/* Left Side: Thumbnail */}
                                        <div className="w-24 aspect-video bg-gray-105 dark:bg-gray-700/50 relative flex items-center justify-center overflow-hidden rounded-xl shrink-0 border border-gray-100 dark:border-gray-700/50">
                                            <img src={thumbnail} alt={pl.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                <Sparkles size={16} className="text-white fill-white" />
                                            </div>
                                        </div>

                                        {/* Right Side: Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]"></div>
                                                    <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Active Roadmap</span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-xs line-clamp-1 leading-snug group-hover/card:text-orange-500 transition-colors">
                                                    {pl.name}
                                                </h3>
                                                {currentGoal && (
                                                    <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 mt-0.5">
                                                        Goal: {currentGoal} Days • Pacing: {videosPerDay} Daily
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <div className="flex items-center justify-between text-[9px] mb-1 font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                                    <span>Mastery Progress</span>
                                                    <span className="text-orange-600 dark:text-orange-400">{percentComplete}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentComplete}%` }}
                                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}
            </motion.div>

            {/* Pagination for Videos */}
            {activeTab === "videos" && (videoPagination.previous || videoPagination.next) && (
                <div className="flex items-center justify-center gap-4 pt-8">
                    <button
                        disabled={!videoPagination.previous}
                        onClick={() => setPage(page - 1)}
                        className={`group flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            !videoPagination.previous 
                            ? "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-slate-700 cursor-not-allowed" 
                            : "bg-white dark:bg-gray-800 text-orange-500 border border-orange-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-0.5"
                        }`}
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Previous
                    </button>
                    
                    <div className="w-12 h-12 flex items-center justify-center bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/20">
                        {page}
                    </div>

                    <button
                        disabled={!videoPagination.next}
                        onClick={() => setPage(page + 1)}
                        className={`group flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            !videoPagination.next 
                            ? "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-slate-700 cursor-not-allowed" 
                            : "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                        }`}
                    >
                        Next
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyLearnings;
