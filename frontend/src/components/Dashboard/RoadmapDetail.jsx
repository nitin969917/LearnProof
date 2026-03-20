import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Play, CheckCircle, Sparkles, AlertCircle, Library } from 'lucide-react';
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

    if (!playlist || !playlist.duration_goal) {
        return (
            <div className="h-screen flex items-center justify-center p-6 bg-gray-50/50 dark:bg-[#0B1120]">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center space-y-6 shadow-xl border border-gray-100 dark:border-slate-800">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto text-orange-500">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Roadmap Not Found</h2>
                        <p className="text-gray-500 dark:text-slate-400">It seems this playlist doesn't have an active roadmap or doesn't exist.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/library')}
                        className="w-full py-4 bg-gray-100 dark:bg-slate-800 hover:bg-orange-500 text-gray-900 dark:text-white hover:text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                    >
                        Return to Library
                    </button>
                </div>
            </div>
        );
    }

    const schedule = getDailySchedule(playlist.videos, playlist.duration_goal);
    const completedVideosCount = playlist.videos.filter(v => v.is_completed).length;
    const totalVideos = playlist.videos.length;
    const percentComplete = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;
    const videosPerDay = Math.ceil(totalVideos / playlist.duration_goal);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#0B1120] pb-24 font-['Inter',sans-serif]">
            {/* Header Section */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 md:h-20 md:py-0 flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard/library')}
                            className="flex-shrink-0 p-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-all active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-orange-500 flex-shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 truncate">Active Mastery Plan</span>
                            </div>
                            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white line-clamp-2 break-words">
                                {playlist.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                {/* Overview Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Library size={200} className="text-orange-500" />
                    </div>
                    
                    {/* Thumbnail & Progress Ring Section */}
                    <div className="relative flex-shrink-0 z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl ring-1 ring-gray-100 dark:ring-slate-700">
                        {playlist.thumbnail ? (
                            <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white">
                                <Play size={40} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-2xl font-black text-white">{percentComplete}%</span>
                            <span className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Completed</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full z-10 space-y-6">
                        <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                            Based on your goal, we've structured this playlist into a comprehensive {playlist.duration_goal}-day plan. Stick to this schedule, and you'll master the subject effortlessly.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Target Duration</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{playlist.duration_goal} Days</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Total Lessons</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalVideos}</p>
                            </div>
                            <div className="bg-orange-50/50 dark:bg-orange-500/10 p-4 rounded-2xl border border-orange-100/50 dark:border-orange-500/20">
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-500 mb-1">Pacing</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-orange-400">~{videosPerDay} <span className="text-[10px] uppercase ml-1 opacity-70">Day</span></p>
                            </div>
                            <div className="bg-blue-50/50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-500/20">
                                <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">Effort Level</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-blue-400">
                                    {videosPerDay > 10 ? "Intense" : videosPerDay > 5 ? "Steady" : "Relaxed"}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-2">
                            <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentComplete}%` }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.4)] transition-all duration-1000"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Day by Day Schedule Grid */}
                <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Clock className="text-orange-500" size={20} />
                        Daily Action Plan
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
                                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-sm flex flex-col h-full ${
                                        dayCompleted 
                                        ? "border-green-500/30 dark:border-green-500/20 bg-green-50/30 dark:bg-green-900/5" 
                                        : "border-gray-100 dark:border-slate-800 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-colors"
                                    }`}
                                >
                                    {/* Day Header */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 dark:border-slate-800">
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
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg shadow-inner">
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
                                                className="group flex flex-col p-3 bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-600 hover:shadow-md"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {vid.is_completed ? (
                                                            <CheckCircle size={16} className="text-green-500" />
                                                        ) : (
                                                            <Play size={16} className="text-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
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
                                        <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
        </div>
    );
};

export default RoadmapDetail;
