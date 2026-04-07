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
        const fetchDetails = async () => {
            if (!token || !pid) return;
            try {
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/playlist-detail/`, {
                    idToken: token,
                    pid: pid
                });
                
                const { playlist: plData, videos } = response.data;
                setPlaylist({ ...plData, videos: videos || [] });
            } catch (error) {
                console.error("Failed to fetch playlist details:", error);
                toast.error("Failed to load roadmap details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
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
            <div className="h-[calc(100vh-100px)] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden text-center"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles size={160} className="text-orange-500" />
                    </div>

                    <div className="relative space-y-8">
                        <div className="w-24 h-24 bg-orange-50 dark:bg-orange-950/30 rounded-[2rem] flex items-center justify-center mx-auto text-orange-500 shadow-inner">
                            <Sparkles size={48} />
                        </div>

                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Mastery Roadmap</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">To generate your customized study plan for <span className="text-orange-500 font-bold">"{playlist.name}"</span>, how many days do you want to master this in?</p>
                        </div>

                        <form onSubmit={handleUpdateGoal} className="max-w-sm mx-auto space-y-4">
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    placeholder="e.g. 7"
                                    value={roadmapDaysInput}
                                    onChange={(e) => setRoadmapDaysInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-xl font-black text-center text-gray-800 dark:text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                />
                                <div className="absolute right-6 text-gray-400 font-black uppercase text-xs tracking-widest pointer-events-none">Days</div>
                            </div>

                            <button
                                type="submit"
                                disabled={settingGoal}
                                className="w-full py-5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {settingGoal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={20} />}
                                {settingGoal ? "Generating Plan..." : "Generate My Roadmap"}
                            </button>
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
        <div className="max-w-[1200px] mx-auto p-4 sm:p-8 space-y-8">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard/library')}
                className="group flex items-center gap-2 text-gray-400 dark:text-slate-500 hover:text-orange-500 transition-all font-black text-xs uppercase tracking-widest"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Library
            </button>

            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2rem] shadow-2xl"
            >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-red-500" />
                {playlist.thumbnail && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-10"
                        style={{ backgroundImage: `url(${playlist.thumbnail})` }}
                    />
                )}
                {/* Decorative blobs */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-5 pt-6 md:p-12 flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
                    {/* Thumbnail */}
                    {playlist.thumbnail ? (
                        <div className="relative group">
                            <img
                                src={playlist.thumbnail}
                                alt={playlist.name}
                                className="w-full max-w-[200px] md:max-w-[320px] aspect-video object-cover rounded-2xl shadow-2xl border-2 md:border-4 border-white/20 ring-1 ring-white/10 flex-shrink-0 transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    ) : (
                        <div className="w-full max-w-[200px] md:max-w-[320px] aspect-video bg-white/10 rounded-2xl shadow-2xl border-2 md:border-4 border-white/20 flex items-center justify-center flex-shrink-0">
                            <Play size={40} className="text-white/60 md:w-14 md:h-14" />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-white space-y-3 md:space-y-4 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] md:px-3 md:py-1.5 bg-white/10 border border-white/20 text-white md:text-[10px] font-black uppercase tracking-widest rounded-xl backdrop-blur-md">
                                <Sparkles size={12} /> Active Mastery Plan
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-4xl font-black leading-tight line-clamp-2 mb-1">{playlist.name}</h1>
                        <p className="text-white/80 text-[11px] md:text-sm font-medium italic">
                            "Based on your goal, we've structured this playlist into a comprehensive {playlist.duration_goal}-day plan. Stick to this schedule, and you'll master the subject effortlessly."
                        </p>

                        {/* Progress Bar */}
                        <div className="max-w-md mx-auto md:mx-0 pt-1 md:pt-0">
                            <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-white/70 mb-1.5 md:mb-2">
                                <span>Mastery Progress</span>
                                <span className="text-white">{percentComplete}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2.5 md:h-3 backdrop-blur-sm overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentComplete}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 justify-center md:justify-start pt-2 md:pt-4">
                            {playlist.videos?.find(v => !v.is_completed) && (
                                <button
                                    onClick={() => navigate(`/classroom/${playlist.videos.find(v => !v.is_completed).vid}`)}
                                    className="flex items-center justify-center sm:justify-start gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-orange-600 rounded-2xl font-black text-xs md:text-sm hover:bg-orange-50 hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                                >
                                    <Play size={16} className="fill-orange-600 md:w-[18px] md:h-[18px]" />
                                    Continue Roadmap
                                </button>
                            )}

                            <button
                                onClick={() => setIsEditingGoal(!isEditingGoal)}
                                className={`flex items-center justify-center sm:justify-start gap-2 px-4 md:px-6 py-2.5 md:py-3 ${isEditingGoal ? 'bg-orange-500 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/20'} rounded-2xl font-black text-xs md:text-sm hover:bg-white/20 hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto`}
                            >
                                <Sparkles size={16} className={`${isEditingGoal ? 'text-white' : 'text-amber-300'} md:w-[18px] md:h-[18px]`} />
                                {isEditingGoal ? "Cancel Edit" : "Recalculate Roadmap"}
                            </button>
                        </div>

                        {/* Inline Re-calculation Form */}
                        <AnimatePresence>
                            {isEditingGoal && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-6 overflow-hidden"
                                >
                                    <form onSubmit={handleUpdateGoal} className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-[1.5rem] border border-white/20 w-fit mx-auto md:mx-0">
                                        <div className="flex flex-col px-4">
                                            <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">New Target</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    className="w-16 bg-transparent border-none p-0 text-xl font-black text-white outline-none placeholder:text-white/20"
                                                    placeholder="Days"
                                                    value={roadmapDaysInput}
                                                    onChange={(e) => setRoadmapDaysInput(e.target.value)}
                                                />
                                                <span className="text-xs font-black text-white/40 uppercase">Days</span>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={settingGoal}
                                            className="px-6 py-3 bg-white text-orange-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center gap-2"
                                        >
                                            {settingGoal ? <Sparkles size={14} className="animate-spin" /> : "Apply Changes"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Roadmap Specific Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-3">
                        <Clock size={20} />
                    </div>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{playlist.duration_goal}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1">Target Days</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-3">
                        <BookOpen size={20} />
                    </div>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{totalVideos}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1">Total Lessons</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-3">
                        <BarChart2 size={20} />
                    </div>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">~{videosPerDay}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1">Lessons / Day</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-3">
                        <Trophy size={20} />
                    </div>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">
                        {videosPerDay > 10 ? "Intense" : videosPerDay > 5 ? "Steady" : "Relaxed"}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1">Effort Level</p>
                </motion.div>
            </div>

                {/* Day by Day Schedule Grid */}
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                            <Clock size={22} />
                        </div>
                        Daily Action Plan
                        <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                            {playlist.duration_goal} Days Scheduled
                        </span>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {schedule.map((dayPlan, index) => {
                            const dayCompleted = dayPlan.videos.every(v => v.is_completed);
                            
                            return (
                                <motion.div 
                                    key={`day-${dayPlan.day}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border shadow-sm flex flex-col h-full ${
                                        dayCompleted 
                                        ? "border-green-500/30 dark:border-green-500/20 bg-green-50/30 dark:bg-green-900/5" 
                                        : "border-gray-100 dark:border-gray-700 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-colors"
                                    }`}
                                >
                                    {/* Day Header */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                                dayCompleted ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                                            }`}>
                                                {dayCompleted ? <CheckCircle size={20} /> : dayPlan.day}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Day {dayPlan.day}</h3>
                                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                                                    {dayPlan.videos.length} Lessons
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
                                            <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300">
                                                {formatDuration(dayPlan.totalDuration)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Video List */}
                                    <div className="space-y-2 flex-grow">
                                        {dayPlan.videos.map((vid) => (
                                            <div 
                                                key={vid.vid}
                                                onClick={() => navigate(`/classroom/${vid.vid}`)}
                                                className="group flex flex-col p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {vid.is_completed ? (
                                                            <CheckCircle size={16} className="text-green-500" />
                                                        ) : (
                                                            <Play size={16} className="text-orange-500 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold line-clamp-2 leading-snug ${
                                                            vid.is_completed ? "text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600" : "text-gray-800 dark:text-gray-200 group-hover:text-orange-500 transition-colors"
                                                        }`}>
                                                            {vid.name}
                                                        </p>
                                                        {vid.duration_seconds > 0 && (
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-1">
                                                                {formatDuration(vid.duration_seconds)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Day Progress visual */}
                                    <div className="mt-4 pt-4">
                                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 transition-all duration-500"
                                                style={{ width: `${(dayPlan.videos.filter(v => v.is_completed).length / dayPlan.videos.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
            </div>
        </div>
    );
};

export default RoadmapDetail;
