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
        <div className="max-w-[1600px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-orange-500 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/20 text-white">
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        My Learning
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 sm:mt-3 text-base sm:text-lg font-medium italic">Your curated digital library.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-[300px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                        />
                    </div>
                    
                    {/* Tab Switcher */}
                    <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-[1.25rem] w-full sm:w-auto overflow-x-auto hide-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSearchQuery("");
                                    }}
                                    className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex-1 sm:flex-none ${
                                        activeTab === tab.id 
                                        ? "text-white" 
                                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabLibrary"
                                            className="absolute inset-0 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon size={16} className="relative z-10" />
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {activeTab === "videos" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-8">
                        {videos.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-50">
                                <Video className="w-16 h-16 text-gray-300" />
                                <h3 className="text-xl font-bold dark:text-white">No videos in your library</h3>
                                <p className="text-sm dark:text-slate-400 max-w-xs">Start your learning journey by importing insightful YouTube videos.</p>
                            </div>
                        ) : (
                            videos.map((video, index) => (
                                <motion.div
                                    key={video.vid}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group/card bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 dark:hover:shadow-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative"
                                >
                                    {/* Delete Overlay */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVideoDelete(video.vid);
                                        }}
                                        className="absolute top-4 right-4 z-20 p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-300 backdrop-blur-md opacity-0 group-hover/card:opacity-100 shadow-lg border border-red-500/20"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div 
                                        className="cursor-pointer flex flex-col h-full"
                                        onClick={() => navigate(`/classroom/${video.vid}`)}
                                    >
                                        <div className="aspect-video bg-gray-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`https://img.youtube.com/vi/${video.vid}/hqdefault.jpg`}
                                                alt={video.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/50 transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
                                                    <Play size={28} className="text-white fill-white ml-1" />
                                                </div>
                                            </div>
                                            {video.is_completed && (
                                                <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-green-500/40 z-10">
                                                    Achieved
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Video Lesson</span>
                                            </div>
                                            
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover/card:text-orange-500 dark:group-hover/card:text-orange-400 text-lg mb-2 line-clamp-2 transition-colors duration-300 leading-snug">
                                                {video.name}
                                            </h3>

                                            <div className="mt-auto space-y-4">
                                                <div className="pt-4 border-t border-gray-50 dark:border-slate-800">
                                                    <div className="flex items-center justify-between text-[11px] mb-2 font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                                        <span>Progress</span>
                                                        <span className="text-orange-600 dark:text-orange-400 group-hover/card:text-orange-500 transition-colors">{Math.round(video.watch_progress || 0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.round(video.watch_progress || 0)}%` }}
                                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)] transition-all duration-1000"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "playlists" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-8">
                        {playlists.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-50">
                                <Library className="w-16 h-16 text-gray-300" />
                                <h3 className="text-xl font-bold dark:text-white">No playlists found</h3>
                                <p className="text-sm dark:text-slate-400 max-w-xs">Organize your learning by grouping videos into custom playlists.</p>
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
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group/card bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 dark:hover:shadow-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative"
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlaylistDelete(pl, pl.pid);
                                            }}
                                            className="absolute top-4 right-4 z-20 p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-300 backdrop-blur-md opacity-0 group-hover/card:opacity-100 shadow-lg border border-red-500/20"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        <div
                                            className="cursor-pointer flex flex-col h-full"
                                            onClick={() => navigate(`/dashboard/playlist/${pl.pid}`)}
                                        >
                                            {/* Stacked Thumbnail Effect */}
                                            <div className="p-6 pb-0">
                                                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg group-hover/card:shadow-2xl transition-all duration-500">
                                                    {/* Decorative background stacks */}
                                                    <div className="absolute inset-0 bg-slate-900 rounded-2xl transform translate-x-1.5 translate-y-1.5 opacity-10 -z-10 group-hover/card:translate-x-2.5 group-hover/card:translate-y-2.5 transition-all duration-500"></div>
                                                    <div className="absolute inset-0 bg-slate-800 rounded-2xl transform translate-x-1 translate-y-1 opacity-20 -z-5 group-hover/card:translate-x-2 group-hover/card:translate-y-2 transition-all duration-500"></div>
                                                    
                                                    {thumbnail ? (
                                                        <img
                                                            src={thumbnail}
                                                            alt={pl.name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <Library size={48} className="text-orange-200 dark:text-slate-700" />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/50 transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
                                                            <Play size={28} className="text-white fill-white ml-1" />
                                                        </div>
                                                    </div>

                                                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white/10">
                                                        {totalVideos} Lessons
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 pt-8 flex flex-col flex-1">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Mastery Path</span>
                                                </div>

                                                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-6 truncate group-hover/card:text-orange-500 transition-colors duration-300">
                                                    {pl.name}
                                                </h3>

                                                <div className="mt-auto">
                                                    <div className="flex items-center justify-between text-[11px] mb-2 font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                                        <span>Progress</span>
                                                        <span className="text-orange-600 dark:text-orange-400 group-hover/card:font-bold transition-all">{percentComplete}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentComplete}%` }}
                                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)] transition-all duration-1000"
                                                        />
                                                    </div>
                                                    
                                                    <div className="mt-6 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-500/20">
                                                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse"></div>
                                                            <span className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest whitespace-nowrap">
                                                                {completedVideos} / {totalVideos} COMPLETED
                                                            </span>
                                                        </div>
                                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-1 group-hover/card:gap-2 transition-all">
                                                            Resume <ChevronRight size={14} />
                                                        </button>
                                                    </div>
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
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {playlists.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-50">
                                <Sparkles className="w-16 h-16 text-gray-300" />
                                <h3 className="text-xl font-bold dark:text-white">Start your first roadmap</h3>
                                <p className="text-sm dark:text-slate-400 max-w-xs">Import a playlist to begin your AI-guided study journey.</p>
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
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border transition-all duration-500 group overflow-hidden relative flex flex-col border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-orange-500/30`}
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                            <Sparkles size={140} className="text-orange-500" />
                                        </div>

                                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center">
                                            {/* Thumbnail & Progress Ring Section */}
                                            <div className="relative flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start mt-2 sm:mt-0">
                                                <div className="w-full max-w-[240px] sm:w-[200px] md:w-[240px] aspect-video rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 ring-1 ring-gray-100 dark:ring-slate-700">
                                                    <img src={thumbnail} alt={pl.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                    <div className="absolute bottom-3 left-0 right-0 text-center">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{percentComplete}% DONE</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info & Goals Section */}
                                            <div className="flex-1 w-full space-y-5">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                    <div className="w-full sm:w-auto">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-500/20">
                                                                Mastery Plan
                                                            </div>
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{totalVideos} Lessons</span>
                                                        </div>
                                                        <h3 className="text-xl font-black text-gray-900 dark:text-white line-clamp-2 group-hover:text-orange-500 transition-colors">
                                                            {pl.name}
                                                        </h3>
                                                    </div>
                                                    
                                                    {currentGoal && (
                                                        <button 
                                                            onClick={() => navigate(`/dashboard/roadmap/${pl.pid}`)}
                                                            className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex-shrink-0"
                                                        >
                                                            View Detailed Schedule
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex flex-col xl:flex-row flex-wrap items-start xl:items-center gap-4 xl:gap-6 bg-gray-50/80 dark:bg-slate-800/30 p-4 rounded-2xl border border-gray-100/80 dark:border-slate-700/30">
                                                    <div className="w-full xl:w-auto flex items-center justify-between xl:justify-start gap-4">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Study Duration</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={tempGoal}
                                                                onChange={(e) => setRoadmapDaysUpdate(prev => ({ ...prev, [pl.pid]: e.target.value }))}
                                                                placeholder="Days"
                                                                className="w-16 sm:w-20 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateRoadmap(pl.pid, tempGoal)}
                                                                disabled={isSavingRoadmap[pl.pid] || tempGoal == currentGoal}
                                                                className={`p-2 rounded-lg transition-all active:scale-90 shadow-sm ${
                                                                    tempGoal == currentGoal 
                                                                    ? "bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 hidden xl:block cursor-not-allowed" 
                                                                    : "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
                                                                }`}
                                                            >
                                                                <ChevronRight size={18} className={isSavingRoadmap[pl.pid] ? "animate-spin" : ""} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {currentGoal && (
                                                        <>
                                                            <div className="hidden xl:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                                                            <div className="w-full xl:w-auto grid grid-cols-2 gap-3 xl:flex xl:gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                                                <div className="bg-white dark:bg-gray-800 xl:bg-transparent p-3 xl:p-0 rounded-xl xl:rounded-none border border-gray-100 dark:border-gray-700 xl:border-none shadow-sm xl:shadow-none">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1">Focus</p>
                                                                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none">
                                                                        {videosPerDay} <span className="text-[9px] text-gray-400 font-bold uppercase ml-0.5">/ Day</span>
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white dark:bg-gray-800 xl:bg-transparent p-3 xl:p-0 rounded-xl xl:rounded-none border border-gray-100 dark:border-gray-700 xl:border-none shadow-sm xl:shadow-none">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">Effort</p>
                                                                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none">
                                                                        {videosPerDay > 10 ? "Intense" : videosPerDay > 5 ? "Steady" : "Relaxed"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>


                                        {/* Progress Bar at bottom of card */}
                                        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800/50">
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentComplete}%` }}
                                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.3)] transition-all duration-1000"
                                                />
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
                            ? "bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-700 cursor-not-allowed" 
                            : "bg-white dark:bg-slate-800 text-orange-500 border border-orange-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-0.5"
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
                            ? "bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-700 cursor-not-allowed" 
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
