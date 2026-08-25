import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Play, CheckCircle, ArrowLeft, Sparkles,
    Trophy, BookOpen, BarChart2, ChevronRight, Lock,
    FileText, Hourglass, Video, Check
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
        let active = true;

        const fetchPlaylistDetails = async (retries = 2) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/playlist-detail/`, {
                        idToken: token,
                        pid: playlistId
                    });
                    if (active && res.data) {
                        setPlaylist(res.data.playlist);
                        setVideos(res.data.videos);
                        if (res.data.playlist.duration_goal) {
                            setRoadmapDays(res.data.playlist.duration_goal.toString());
                        }
                        setLoading(false);
                    }
                    return; // Success, exit
                } catch (err) {
                    console.warn(`PlaylistProgress fetch attempt ${i + 1} failed:`, err);
                    if (i === retries) {
                        console.error("Failed to fetch playlist details after retries", err);
                        if (active) {
                            toast.error("Failed to load playlist.");
                            navigate('/dashboard/library');
                            setLoading(false);
                        }
                    } else {
                        // Wait 500ms before retrying
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
        };

        if (token && playlistId) {
            setLoading(true);
            fetchPlaylistDetails();
        }

        return () => {
            active = false;
        };
    }, [token, playlistId, navigate]);

    if (loading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">Loading progress...</p>
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
    const remainingVideos = Math.max(0, totalVideos - completedVideos);
    const quizzesPassed = videos.filter(v => v.passed_quiz).length;
    const percentComplete = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    const overallProgress = percentComplete;

    const totalPages = Math.ceil(totalVideos / ITEMS_PER_PAGE);
    const paginatedVideos = videos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const isEligibleForCert = totalVideos > 0 && quizzesPassed === totalVideos && completedVideos === totalVideos;
    const firstUnwatched = videos.find(v => !v.is_completed) || videos[0];

    const isFullyCompleted = totalVideos > 0 && completedVideos === totalVideos;
    const isNotStarted = completedVideos === 0;

    return (
        <div className="max-w-[1200px] mx-auto space-y-5 sm:space-y-6">
            {/* Desktop Back Button */}
            <button
                onClick={() => navigate('/dashboard/library')}
                className="hidden lg:flex group items-center gap-2 text-gray-400 dark:text-slate-500 hover:text-orange-500 transition-all font-black text-xs uppercase tracking-widest cursor-pointer"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Library
            </button>

            {/* ── 1. SIGNATURE ORANGE HERO CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-[#FF5100] via-[#F04700] to-[#D83600] border border-orange-400/30 text-white shadow-xl shadow-orange-500/20 p-4 sm:p-6"
            >
                {/* Subtle soft lighting */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-3.5">
                    {/* Header Row: Title & Badges + Big Prominent Thumbnail */}
                    <div className="flex items-center justify-between gap-3 sm:gap-6">
                        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                            {/* Status Tag */}
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/20 backdrop-blur-md text-white border border-white/20 font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-lg shadow-xs">
                                {isFullyCompleted ? 'COMPLETED' : isNotStarted ? 'NOT STARTED' : 'IN PROGRESS'}
                            </div>

                            {/* Main Title */}
                            <h1 className="text-sm sm:text-xl lg:text-2xl font-black text-white leading-tight tracking-tight uppercase line-clamp-2 drop-shadow-sm">
                                {playlist.name}
                            </h1>

                            {/* Tags row */}
                            <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/20 backdrop-blur-md rounded-lg text-[9px] sm:text-[10px] font-bold text-white/95 border border-white/15">
                                    <Video size={11} className="text-white" />
                                    VIDEO COURSE
                                </span>
                                {totalVideos > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/20 backdrop-blur-md rounded-lg text-[9px] sm:text-[10px] font-bold text-white/95 border border-white/15">
                                        <BookOpen size={11} className="text-white" />
                                        {totalVideos} LESSONS
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Large, High-Def Thumbnail Card */}
                        {playlist.thumbnail && (
                            <div 
                                onClick={() => firstUnwatched && navigate(`/classroom/${firstUnwatched.vid}`)}
                                className="relative group cursor-pointer w-40 sm:w-56 md:w-64 lg:w-72 aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 shrink-0 transition-transform duration-200 hover:scale-[1.02] ring-2 ring-black/10"
                            >
                                <img
                                    src={playlist.thumbnail}
                                    alt={playlist.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 text-[#FF5100] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                        <Play size={16} className="sm:w-5 sm:h-5 fill-[#FF5100] ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar Row */}
                    <div className="pt-0.5">
                        <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-white/90 mb-1.5">
                            <span>Overall Progress</span>
                            <span className="text-sm sm:text-base font-black text-white">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2 sm:h-2.5 backdrop-blur-sm overflow-hidden p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                                className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                            />
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-white/80 mt-1.5">
                            Total {totalVideos} Lessons • {completedVideos} Completed • {remainingVideos} Remaining
                        </p>
                    </div>

                    {/* Compact, User-Friendly Action Buttons Row */}
                    <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 pt-0.5">
                        {firstUnwatched && (
                            <button
                                onClick={() => navigate(`/classroom/${firstUnwatched.vid}`)}
                                className="h-9 sm:h-10 px-4 sm:px-5 bg-white text-[#FF5100] hover:bg-orange-50 active:scale-95 shadow-sm hover:shadow-md rounded-full font-black text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <Play size={13} className="fill-[#FF5100] shrink-0" />
                                <span>{isNotStarted ? "Start Learning" : isFullyCompleted ? "Review Again" : "Continue Learning"}</span>
                            </button>
                        )}

                        <button
                            onClick={() => navigate(`/dashboard/roadmap/${playlistId}`)}
                            className="h-9 sm:h-10 px-4 sm:px-5 bg-black/20 hover:bg-black/35 text-white border border-white/25 active:scale-95 rounded-full font-black text-xs inline-flex items-center justify-center gap-1.5 backdrop-blur-md transition-all cursor-pointer whitespace-nowrap"
                        >
                            <Sparkles size={13} className="text-amber-200 shrink-0" />
                            <span>View Roadmap</span>
                        </button>

                        {isEligibleForCert && (
                            <button
                                onClick={() => navigate('/dashboard/quiz')}
                                className="h-9 sm:h-10 px-4 sm:px-5 bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/30 active:scale-95 rounded-full font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
                            >
                                <Trophy size={13} className="shrink-0" />
                                <span>Claim Certificate</span>
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── 2. FOUR METRICS STATS CARD ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700/60 grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-700/60">
                {/* 1. Total Lessons */}
                <div className="flex flex-col items-center text-center px-1 sm:px-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-1.5 sm:mb-2 shadow-sm">
                        <BookOpen size={16} className="sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                        {totalVideos}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                        TOTAL LESSONS
                    </span>
                </div>

                {/* 2. Completed */}
                <div className="flex flex-col items-center text-center px-1 sm:px-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-1.5 sm:mb-2 shadow-sm">
                        <CheckCircle size={16} className="sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                        {completedVideos}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                        COMPLETED
                    </span>
                </div>

                {/* 3. Left to Finish */}
                <div className="flex flex-col items-center text-center px-1 sm:px-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-1.5 sm:mb-2 shadow-sm">
                        <Hourglass size={16} className="sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                        {remainingVideos}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                        LEFT TO FINISH
                    </span>
                </div>

                {/* 4. Overall Progress */}
                <div className="flex flex-col items-center text-center px-1 sm:px-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-1.5 sm:mb-2 shadow-sm">
                        <BarChart2 size={16} className="sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-2xl font-black text-orange-500 leading-tight">
                        {overallProgress}%
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                        OVERALL PROGRESS
                    </span>
                </div>
            </div>

            {/* ── 3. COURSE CONTENT SECTION ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={18} className="stroke-[2.5]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                            Course Content
                        </h3>
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider flex items-center gap-1">
                        {totalVideos} LESSONS
                        <ChevronRight size={14} />
                    </span>
                </div>

                {/* Lesson Rows */}
                <div className="space-y-2.5 sm:space-y-3 pt-1">
                    {paginatedVideos.map((video, index) => {
                        const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                        const isCompleted = video.is_completed;
                        const isCurrent = !isCompleted && firstUnwatched && firstUnwatched.vid === video.vid;
                        const hasPassedQuiz = video.passed_quiz;

                        return (
                            <motion.div
                                key={video.vid}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => navigate(`/classroom/${video.vid}`)}
                                className={`group flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                                    isCompleted
                                        ? 'bg-[#F4FAF6] dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-300'
                                        : isCurrent
                                            ? 'bg-[#FFF9F5] dark:bg-orange-950/25 border-2 border-orange-400 dark:border-orange-500/50 shadow-md shadow-orange-500/10'
                                            : 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100/70'
                                }`}
                            >
                                {/* Left icon badge + title info */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Left badge */}
                                    <div className="shrink-0">
                                        {isCompleted ? (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20">
                                                <Video size={18} className="stroke-[2.5]" />
                                            </div>
                                        ) : isCurrent ? (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30 animate-pulse">
                                                <Play size={16} className="fill-white ml-0.5" />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center font-black text-xs">
                                                {absoluteIndex + 1}
                                            </div>
                                        )}
                                    </div>

                                    {/* Video metadata */}
                                    <div className="min-w-0 flex-1">
                                        <h4 className={`text-xs sm:text-sm font-black truncate transition-colors ${
                                            isCompleted
                                                ? 'text-gray-800 dark:text-gray-200'
                                                : isCurrent
                                                    ? 'text-orange-600 dark:text-orange-400'
                                                    : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                                        }`}>
                                            {absoluteIndex + 1}. {video.name}
                                        </h4>

                                        <div className="flex items-center gap-2 mt-1">
                                            {isCompleted ? (
                                                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <Check size={12} className="stroke-[3]" /> Completed
                                                </span>
                                            ) : isCurrent ? (
                                                <span className="text-[10px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                                                    In Progress • Next Up
                                                </span>
                                            ) : (
                                                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-400">
                                                    Upcoming Lesson
                                                </span>
                                            )}

                                            {hasPassedQuiz && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-md">
                                                    <Trophy size={9} /> Quiz Passed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right action / checkmark indicator */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {isCompleted ? (
                                        <div className="flex items-center gap-1.5 text-emerald-500">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                <Check size={13} className="stroke-[3]" />
                                            </div>
                                            <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="flex items-center gap-1.5 text-orange-500">
                                            <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                                                <Play size={12} className="fill-white ml-0.5" />
                                            </div>
                                            <ChevronRight size={16} className="text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-6 pt-4 pb-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`group flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all cursor-pointer ${
                                currentPage === 1
                                ? 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                : 'bg-white dark:bg-gray-800 text-orange-500 border border-orange-100 dark:border-gray-700 hover:shadow-md'
                            }`}
                        >
                            <ArrowLeft size={15} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <div className="flex items-center gap-1">
                            {(() => {
                                const pages = [];
                                const range = 1;
                                
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
                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-black text-[10px] sm:text-xs transition-all cursor-pointer ${
                                            pg === currentPage
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/20'
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
                            className={`group flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all cursor-pointer ${
                                currentPage === totalPages
                                ? 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                : 'bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/40'
                            }`}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={15} className="shrink-0 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistProgress;
