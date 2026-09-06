import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Clock, Play, CheckCircle, Sparkles, AlertCircle, 
    Library, Trophy, BookOpen, BarChart2, ChevronRight, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

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
        const isLastVideo = i === videos.length - 1;
        
        currentDayVideos.push(video);
        currentDayDuration += videoDuration;

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
    
    return schedule;
};

const RoadmapDetail = () => {
    const { pid } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchDetails = async (retries = 2) => {
            if (!token || !pid) return;
            for (let i = 0; i <= retries; i++) {
                try {
                    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/playlist-detail/`, {
                        idToken: token,
                        pid: pid
                    });
                    
                    if (active) {
                        const { playlist: plData, videos } = response.data;
                        setPlaylist({ ...plData, videos: videos || [] });
                        setLoading(false);
                    }
                    return; // Success, exit
                } catch (error) {
                    console.warn(`RoadmapDetail fetch attempt ${i + 1} failed:`, error);
                    if (i === retries) {
                        console.error("Failed to fetch playlist details after retries:", error);
                        if (active) {
                            toast.error("Failed to load roadmap details.");
                            setLoading(false);
                        }
                    } else {
                        // Wait 500ms before retrying
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
        };

        setLoading(true);
        fetchDetails();

        return () => {
            active = false;
        };
    }, [token, pid]);

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [roadmapDaysInput, setRoadmapDaysInput] = useState("");
    const [settingGoal, setSettingGoal] = useState(false);

    const handleUpdateGoal = async (e) => {
        if (e) e.preventDefault();
        const days = roadmapDaysInput;
        if (!days || isNaN(days) || parseInt(days) <= 0) {
            toast.error("Please enter a valid number of days.");
            return;
        }

        setSettingGoal(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/set-playlist-goal/`, {
                idToken: token,
                pid: pid,
                duration_goal: parseInt(days)
            });
            toast.success("Mastery roadmap recalculated!");
            
            // Re-fetch details to sync the whole UI
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/playlist-detail/`, {
                idToken: token,
                pid: pid
            });
            const { playlist: plData, videos } = response.data;
            setPlaylist({ ...plData, videos: videos || [] });
            setIsEditingGoal(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update roadmap");
        } finally {
            setSettingGoal(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50/50 dark:bg-[#0B1120]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Mastery Plan...</p>
                </div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="h-screen flex items-center justify-center p-6 bg-gray-50/50 dark:bg-[#0B1120]">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2rem] p-8 text-center space-y-6 shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto text-orange-500">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Playlist Not Found</h2>
                        <p className="text-gray-500 dark:text-gray-400">It seems this playlist doesn't exist.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/library')}
                        className="w-full py-4 bg-gray-100 dark:bg-gray-700 hover:bg-orange-500 text-gray-900 dark:text-white hover:text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                    >
                        Return to Library
                    </button>
                </div>
            </div>
        );
    }

    if (!playlist.duration_goal) {
        return (
            <div className="h-[calc(100vh-100px)] flex items-center justify-center p-3 sm:p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden text-center"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Sparkles size={120} className="text-orange-500" />
                    </div>

                    <div className="relative space-y-5 sm:space-y-8">
                        {/* Icon */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center mx-auto text-orange-500 shadow-inner">
                            <Sparkles size={32} className="sm:hidden" />
                            <Sparkles size={40} className="hidden sm:block" />
                        </div>

                        {/* Heading + description */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">Mastery Roadmap</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm sm:text-base">
                                To generate your customized study plan for{' '}
                                <span className="text-orange-500 font-bold">"{playlist.name}"</span>
                                , how many days do you want to master this in?
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleUpdateGoal} className="max-w-sm mx-auto space-y-3 sm:space-y-4">
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    placeholder="e.g. 7"
                                    value={roadmapDaysInput}
                                    onChange={(e) => setRoadmapDaysInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-5 py-3 text-lg font-black text-center text-gray-800 dark:text-white focus:outline-none focus:border-orange-400 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                />
                                <div className="absolute right-5 text-gray-400 font-black uppercase text-xs tracking-widest pointer-events-none">Days</div>
                            </div>

                            <div className="flex justify-center pt-1">
                                <button
                                    type="submit"
                                    disabled={settingGoal}
                                    className="inline-flex items-center gap-2 px-7 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95 cursor-pointer"
                                >
                                    {settingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={15} />}
                                    {settingGoal ? "Generating..." : "Generate My Roadmap"}
                                </button>
                            </div>
                        </form>
                        
                        <button 
                            onClick={() => navigate('/dashboard/library')}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-500 transition-colors"
                        >
                            Nevermind, take me back
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const schedule = getDailySchedule(playlist.videos, playlist.duration_goal);
    const completedVideosCount = playlist.videos.filter(v => v.is_completed).length;
    const totalVideos = playlist.videos.length;
    const percentComplete = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;
    const videosPerDay = Math.ceil(totalVideos / playlist.duration_goal);

    return (
        <div className="max-w-[1400px] mx-auto pb-6">
            {/* ── YOUTUBE-STYLE 2-COLUMN LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
                
                {/* ══════════════════════════════════════════════
                    LEFT COLUMN / HERO: YouTube Mastery Roadmap Hero Card
                   ══════════════════════════════════════════════ */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-3.5 sm:space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF5100] via-[#F04700] to-[#D83600] border border-orange-400/40 text-white shadow-xl shadow-orange-500/20 p-4 sm:p-6"
                    >
                        {/* Background subtle glow discs */}
                        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-black/20 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 space-y-3.5 sm:space-y-4">
                            {/* Prominent Playlist Video Thumbnail */}
                            {playlist.thumbnail && (
                                <div
                                    onClick={() => playlist.videos?.find(v => !v.is_completed) && navigate(`/classroom/${playlist.videos.find(v => !v.is_completed).vid}`)}
                                    className="relative group cursor-pointer w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/30 transition-transform duration-300 hover:scale-[1.01]"
                                >
                                    <img
                                        src={playlist.thumbnail}
                                        alt={playlist.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/95 text-[#FF5100] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Play size={20} className="fill-[#FF5100] ml-0.5 sm:size-6" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-sm rounded-md text-[10px] font-black text-white flex items-center gap-1 border border-white/20">
                                        <Clock size={11} />
                                        <span>{playlist.duration_goal} Days Target</span>
                                    </div>
                                </div>
                            )}

                            {/* Playlist Meta Header */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/20 backdrop-blur-md text-white border border-white/20 font-black text-[10px] uppercase tracking-wider rounded-lg shadow-xs">
                                        <Sparkles size={11} className="text-amber-200" />
                                        ACTIVE ROADMAP
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white/95 border border-white/15">
                                        <BookOpen size={11} className="text-white" />
                                        {totalVideos} LESSONS
                                    </span>
                                </div>

                                <h1 className="text-base sm:text-xl font-black text-white leading-snug tracking-tight uppercase line-clamp-2 drop-shadow-sm">
                                    {playlist.name}
                                </h1>
                            </div>

                            {/* Overall Mastery Progress Bar */}
                            <div className="space-y-1.5 pt-0.5">
                                <div className="flex justify-between items-center text-xs font-bold text-white/90">
                                    <span>Mastery Progress</span>
                                    <span className="text-sm sm:text-base font-black text-white">{percentComplete}%</span>
                                </div>
                                <div className="w-full bg-black/25 rounded-full h-2 sm:h-2.5 backdrop-blur-sm overflow-hidden p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentComplete}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-white/80 pt-0.5">
                                    <span>{completedVideosCount} completed</span>
                                    <span>~{videosPerDay} lessons/day</span>
                                </div>
                            </div>

                            {/* Primary Action Buttons */}
                            <div className="space-y-2 pt-1">
                                {playlist.videos?.find(v => !v.is_completed) && (
                                    <button
                                        onClick={() => navigate(`/classroom/${playlist.videos.find(v => !v.is_completed).vid}`)}
                                        className="w-full h-10 sm:h-11 px-4 sm:px-5 bg-white text-[#FF5100] hover:bg-orange-50 active:scale-[0.98] shadow-md hover:shadow-lg rounded-xl font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Play size={15} className="fill-[#FF5100]" />
                                        <span>Continue Roadmap</span>
                                    </button>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => navigate(`/dashboard/playlist/${pid}`)}
                                        className="h-9 sm:h-10 px-3 bg-black/20 hover:bg-black/35 text-white border border-white/20 active:scale-95 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 backdrop-blur-md transition-all cursor-pointer truncate"
                                    >
                                        <BookOpen size={13} className="text-white/80 shrink-0" />
                                        <span className="truncate">Playlist View</span>
                                    </button>

                                    <button
                                        onClick={() => setIsEditingGoal(!isEditingGoal)}
                                        className={`h-9 sm:h-10 px-3 ${isEditingGoal ? 'bg-white text-[#FF5100]' : 'bg-black/20 hover:bg-black/35 text-white border border-white/20'} active:scale-95 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 backdrop-blur-md transition-all cursor-pointer truncate`}
                                    >
                                        <Sparkles size={13} className={isEditingGoal ? 'text-[#FF5100] shrink-0' : 'text-amber-200 shrink-0'} />
                                        <span className="truncate">{isEditingGoal ? "Close" : "Adjust Goal"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Inline Goal Editing Form */}
                            <AnimatePresence>
                                {isEditingGoal && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pt-2 overflow-hidden"
                                    >
                                        <form onSubmit={handleUpdateGoal} className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-2.5 rounded-2xl border border-white/20">
                                            <div className="flex-1 min-w-0 px-2">
                                                <span className="text-[9px] font-black uppercase text-white/70 tracking-wider block">Target Days</span>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    min="1"
                                                    max="365"
                                                    className="w-full bg-transparent border-none p-0 text-base font-black text-white outline-none placeholder:text-white/40"
                                                    placeholder="e.g. 14"
                                                    value={roadmapDaysInput}
                                                    onChange={(e) => setRoadmapDaysInput(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={settingGoal}
                                                className="px-4 py-2 bg-white text-[#FF5100] rounded-xl font-black text-xs uppercase tracking-wider hover:bg-orange-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-md shrink-0"
                                            >
                                                {settingGoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* 4 Quick Stat Metric Tiles */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                                <Clock size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">{playlist.duration_goal}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Target Days</div>
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <BookOpen size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">{totalVideos}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Total Lessons</div>
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <BarChart2 size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">~{videosPerDay}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Lessons / Day</div>
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                                <Trophy size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400 leading-tight truncate">
                                    {videosPerDay > 10 ? "Intense" : videosPerDay > 5 ? "Steady" : "Relaxed"}
                                </div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Effort Level</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    RIGHT COLUMN: Daily Schedule & Curriculum List
                   ══════════════════════════════════════════════ */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-3.5 sm:p-5 flex flex-col lg:h-[calc(100vh-100px)] space-y-3">
                        {/* Section Header */}
                        <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock size={18} className="stroke-[2.5]" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white">
                                        Daily Action Plan & Schedule
                                    </h2>
                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                        Follow your step-by-step daily schedule to complete on time.
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                                {playlist.duration_goal} Days Target
                            </span>
                        </div>

                        {/* Top Progress Bar */}
                        <div className="space-y-1.5 pb-2.5 sm:pb-3 border-b border-gray-100 dark:border-gray-700/60 shrink-0">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                <span>Mastery Progress</span>
                                <span className="text-orange-600 dark:text-orange-400 font-black">
                                    {completedVideosCount} of {totalVideos} Completed ({percentComplete}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentComplete}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-[#FF5100] rounded-full"
                                />
                            </div>
                        </div>

                        {/* Scrollable Day-by-Day Schedule List */}
                        <div className="flex-1 lg:overflow-y-auto space-y-3 pr-0 lg:pr-1 min-h-0">
                            {schedule.map((dayPlan, dayIndex) => {
                                const completedInDay = dayPlan.videos.filter(v => v.is_completed).length;
                                const totalInDay = dayPlan.videos.length;
                                const isDayDone = totalInDay > 0 && completedInDay === totalInDay;
                                const dayProgressPercent = totalInDay > 0 ? Math.round((completedInDay / totalInDay) * 100) : 0;

                                return (
                                    <motion.div
                                        key={`day-${dayPlan.day}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: dayIndex * 0.02 }}
                                        className={`rounded-2xl border transition-all p-2.5 sm:p-3 space-y-2 ${
                                            isDayDone
                                                ? 'bg-[#F4FAF6] dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/40'
                                                : 'bg-gray-50/60 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'
                                        }`}
                                    >
                                        {/* Day Banner Header */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 ${
                                                    isDayDone
                                                        ? 'bg-emerald-500 text-white shadow-xs'
                                                        : 'bg-orange-500 text-white shadow-xs'
                                                }`}>
                                                    {isDayDone ? <CheckCircle size={14} /> : dayPlan.day}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                                                        Day {dayPlan.day}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400">
                                                        • {completedInDay} of {totalInDay} Lessons Done
                                                    </span>
                                                </div>
                                            </div>

                                            {isDayDone && (
                                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-md">
                                                    Completed
                                                </span>
                                            )}
                                        </div>

                                        {/* Micro Day Progress Bar */}
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isDayDone ? 'bg-emerald-500' : 'bg-orange-500'
                                                }`}
                                                style={{ width: `${dayProgressPercent}%` }}
                                            />
                                        </div>

                                        {/* Day's Video List - Compact Rows */}
                                        <div className="space-y-1.5 pt-0.5">
                                            {dayPlan.videos.map((vid) => {
                                                const isVidCompleted = vid.is_completed;
                                                const hasQuizPassed = vid.passed_quiz;

                                                return (
                                                    <div
                                                        key={vid.vid}
                                                        onClick={() => navigate(`/classroom/${vid.vid}`)}
                                                        className={`group flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                                            isVidCompleted
                                                                ? 'bg-white/80 dark:bg-gray-800/80 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300'
                                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-xs'
                                                        }`}
                                                    >
                                                        {/* Thumbnail + Details */}
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            {/* Compact Thumbnail without time label */}
                                                            <div className="relative w-14 sm:w-16 aspect-video rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 border border-black/5 dark:border-white/5">
                                                                <img
                                                                    src={`https://i.ytimg.com/vi/${vid.vid}/mqdefault.jpg`}
                                                                    alt={vid.name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                                {isVidCompleted && (
                                                                    <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center">
                                                                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                                            <CheckCircle size={10} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Title and Meta */}
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-[11px] sm:text-xs font-bold truncate transition-colors ${
                                                                    isVidCompleted
                                                                        ? 'text-gray-500 dark:text-gray-400'
                                                                        : 'text-gray-800 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                                                                }`}>
                                                                    {vid.name}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {isVidCompleted ? (
                                                                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                                            <CheckCircle size={9} /> Done
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400 dark:text-gray-400">
                                                                            Scheduled
                                                                        </span>
                                                                    )}
                                                                    {hasQuizPassed && (
                                                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-black rounded">
                                                                            <Trophy size={8} /> Quiz
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Trigger */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            {isVidCompleted ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 hidden xs:inline">Review</span>
                                                            ) : (
                                                                <div className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-black uppercase flex items-center gap-0.5 shadow-2xs">
                                                                    <Play size={8} className="fill-white" />
                                                                    <span>Play</span>
                                                                </div>
                                                            )}
                                                            <ChevronRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RoadmapDetail;
