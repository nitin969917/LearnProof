import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Play, CheckCircle, Circle, ArrowLeft, Clock, Sparkles,
    Trophy, BookOpen, BarChart2, ChevronRight, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PlaylistProgress = () => {
    const { id: playlistId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [roadmapDays, setRoadmapDays] = useState("");
    const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/playlist-detail/`, {
                    idToken: token,
                    pid: playlistId
                });
                if (res.data) {
                    setPlaylist(res.data.playlist);
                    setVideos(res.data.videos);
                    if (res.data.playlist.duration_goal) {
                        setRoadmapDays(res.data.playlist.duration_goal.toString());
                    }
                }
            } catch (err) {
                console.error("Failed to fetch playlist details", err);
                toast.error("Failed to load playlist.");
                navigate('/dashboard/library');
            } finally {
                setLoading(false);
            }
        };

        if (token && playlistId) {
            fetchPlaylistDetails();
        }
    }, [token, playlistId, navigate]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">Loading playlist...</p>
                </div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-bold">Playlist not found.</p>
            </div>
        );
    }

    const totalVideos = videos.length;
    const completedVideos = videos.filter(v => v.is_completed).length;
    const quizzesPassed = videos.filter(v => v.passed_quiz).length;
    const percentComplete = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    const overallProgress = totalVideos > 0 ? Math.round(((completedVideos + quizzesPassed) / (totalVideos * 2)) * 100) : 0;

    const totalPages = Math.ceil(totalVideos / ITEMS_PER_PAGE);
    const paginatedVideos = videos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const isEligibleForCert = totalVideos > 0 && quizzesPassed === totalVideos && completedVideos === totalVideos;
    const firstUnwatched = videos.find(v => !v.is_completed) || videos[0];

    const handleUpdateRoadmap = async () => {
        if (!roadmapDays || isNaN(roadmapDays) || parseInt(roadmapDays) <= 0) {
            toast.error("Please enter a valid number of days.");
            return;
        }

        setIsSavingRoadmap(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/set-playlist-goal/`, {
                idToken: token,
                pid: playlistId,
                duration_goal: parseInt(roadmapDays)
            });
            toast.success("Roadmap updated successfully!");
        } catch (err) {
            console.error("Failed to update roadmap", err);
            toast.error("Failed to update roadmap.");
        } finally {
            setIsSavingRoadmap(false);
        }
    };

    const videosPerDay = roadmapDays ? Math.ceil(totalVideos / parseInt(roadmapDays)) : 0;

    const stats = [
        { label: "Total Lessons", value: totalVideos, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
        { label: "Completed", value: completedVideos, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
        { label: "Quizzes Passed", value: quizzesPassed, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
        { label: "Overall Progress", value: `${overallProgress}%`, icon: BarChart2, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    ];

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
                        <img
                            src={playlist.thumbnail}
                            alt={playlist.name}
                            className="w-full max-w-[200px] md:max-w-[320px] aspect-video object-cover rounded-2xl shadow-2xl border-2 md:border-4 border-white/20 ring-1 ring-white/10 flex-shrink-0"
                        />
                    ) : (
                        <div className="w-full max-w-[200px] md:max-w-[320px] aspect-video bg-white/10 rounded-2xl shadow-2xl border-2 md:border-4 border-white/20 flex items-center justify-center flex-shrink-0">
                            <Play size={40} className="text-white/60 md:w-14 md:h-14" />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-white space-y-3 md:space-y-4 text-center md:text-left">
                        {isEligibleForCert && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] md:px-3 md:py-1.5 bg-green-400/20 border border-green-400/30 text-green-100 md:text-[10px] font-black uppercase tracking-widest rounded-xl">
                                <Sparkles size={12} /> Ready for Certification
                            </span>
                        )}
                        <h1 className="text-xl sm:text-2xl md:text-4xl font-black leading-tight mb-1">{playlist.name}</h1>
                        <p className="text-white/80 text-[11px] md:text-sm font-medium">
                            {completedVideos} of {totalVideos} lessons watched · {quizzesPassed} quizzes passed
                        </p>

                        {/* Progress Bar */}
                        <div className="pt-1 md:pt-0">
                            <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-white/70 mb-1.5 md:mb-2">
                                <span>Total Progress</span>
                                <span className="text-white">{overallProgress}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2.5 md:h-3 backdrop-blur-sm overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 justify-center md:justify-start pt-2 md:pt-4">
                            {firstUnwatched && (
                                <button
                                    onClick={() => navigate(`/classroom/${firstUnwatched.vid}`)}
                                    className="flex items-center justify-center sm:justify-start gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-orange-600 rounded-2xl font-black text-xs md:text-sm hover:bg-orange-50 hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                                >
                                    <Play size={16} className="fill-orange-600 md:w-[18px] md:h-[18px]" />
                                    {percentComplete === 0 ? "Start Learning" : percentComplete === 100 ? "Review Again" : "Continue Playing"}
                                </button>
                            )}
                            
                            <button
                                onClick={() => navigate(`/dashboard/roadmap/${playlistId}`)}
                                className="flex items-center justify-center sm:justify-start gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-xs md:text-sm hover:bg-white/20 hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                            >
                                <Sparkles size={18} className="text-amber-300" />
                                {playlist.duration_goal ? "View Roadmap" : "Generate Roadmap"}
                            </button>

                            {isEligibleForCert && (
                                <button
                                    onClick={() => navigate('/dashboard/quiz')}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl font-black text-sm hover:bg-green-600 border border-green-400 hover:shadow-xl transition-all active:scale-95"
                                >
                                    <Trophy size={18} /> Take Certification Quiz
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                                <Icon size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">{stat.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mt-1">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Course Content */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-50 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700/50">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                            <Clock size={20} />
                        </div>
                        Course Content
                        <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                            {totalVideos} Lessons
                        </span>
                    </h3>
                </div>
                <div className="p-4 md:p-6 space-y-3">
                    {paginatedVideos.map((video, index) => {
                        const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                        const isCompleted = video.is_completed;
                        const hasPassedQuiz = video.passed_quiz;
                        return (
                            <motion.div
                                key={video.vid}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => navigate(`/classroom/${video.vid}`)}
                                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                    isCompleted
                                        ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30'
                                        : 'bg-gray-50/50 dark:bg-slate-900/30 border-gray-100 dark:border-slate-700/30 hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-orange-50/30 dark:hover:bg-orange-900/10'
                                }`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <div className="w-9 h-9 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-green-500/20">
                                            <CheckCircle size={18} />
                                        </div>
                                    ) : (
                                        <div className="w-9 h-9 bg-gray-100 dark:bg-slate-700 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                <span className="text-[11px] font-black">{absoluteIndex + 1}</span>
                                            </div>
                                    )}
                                </div>

                                {/* Video Info */}
                                <div className="flex-grow min-w-0">
                                    <h4 className={`text-sm font-bold truncate transition-colors line-clamp-1 ${
                                        isCompleted
                                            ? 'text-gray-500 dark:text-slate-400 line-through decoration-1'
                                            : 'text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400'
                                    }`}>
                                        {video.name}
                                    </h4>
                                    {hasPassedQuiz && (
                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-200 dark:border-green-800">
                                            <Trophy size={9} /> Quiz Passed
                                        </span>
                                    )}
                                </div>

                                {/* Play Arrow */}
                                <div className="flex-shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-all">
                                    <div className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30">
                                        <Play size={14} className="fill-white ml-0.5" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-6 pb-8 mt-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`group flex items-center justify-center gap-2 px-3 sm:px-6 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                                currentPage === 1
                                ? 'bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-700 cursor-not-allowed'
                                : 'bg-white dark:bg-slate-800 text-orange-500 border border-orange-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-0.5'
                            }`}
                        >
                            <ArrowLeft size={16} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <div className="flex items-center gap-1">
                            {(() => {
                                const pages = [];
                                const range = 1; // Number of neighbors to show
                                
                                for (let i = 1; i <= totalPages; i++) {
                                    if (
                                        i === 1 || 
                                        i === totalPages || 
                                        (i >= currentPage - range && i <= currentPage + range)
                                    ) {
                                        pages.push(i);
                                    } else if (
                                        i === currentPage - range - 1 || 
                                        i === currentPage + range + 1
                                    ) {
                                        pages.push('...');
                                    }
                                }
                                
                                return pages.map((pg, idx) => pg === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="w-8 flex justify-center text-gray-400 font-black text-xs">...</span>
                                ) : (
                                    <button
                                        key={pg}
                                        onClick={() => { setCurrentPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-[10px] sm:text-xs transition-all ${
                                            pg === currentPage
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                ));
                            })()}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`group flex items-center justify-center gap-2 px-3 sm:px-6 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                                currentPage === totalPages
                                ? 'bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-700 cursor-not-allowed'
                                : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                            }`}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistProgress;
