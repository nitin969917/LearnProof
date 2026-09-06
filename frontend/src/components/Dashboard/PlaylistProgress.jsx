import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Play, CheckCircle, ArrowLeft, Sparkles,
    Trophy, BookOpen, BarChart2, ChevronRight, Lock,
    FileText, Hourglass, Video, Check, Share2, Layers,
    CheckCircle2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const formatVideoDuration = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const PlaylistProgress = () => {
    const { id: playlistId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [roadmapDays, setRoadmapDays] = useState("");
    const ITEMS_PER_PAGE = 25;

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

    const getPageNumbers = (current, total) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 4) {
            return [1, 2, 3, 4, 5, '...', total];
        }
        if (current >= total - 3) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const renderPagination = (isTop = false) => {
        if (totalPages <= 1) return null;
        const pageNumbers = getPageNumbers(currentPage, totalPages);

        return (
            <div className={`flex items-center justify-between gap-2 px-1 ${isTop ? 'pb-3 border-b' : 'pt-3 border-t'} border-gray-100 dark:border-gray-700/60 shrink-0`}>
                {/* Previous Button */}
                <button
                    disabled={currentPage === 1}
                    onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                    }}
                    className={`group flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer shrink-0 ${
                        currentPage === 1
                            ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-transparent'
                            : 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700 shadow-xs'
                    }`}
                >
                    <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                    <span className="hidden xs:inline">Prev</span>
                </button>

                {/* Numbered Page Buttons with horizontal scroll on small screens */}
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[65%] sm:max-w-none justify-center">
                    {pageNumbers.map((page, idx) => {
                        if (page === '...') {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-gray-400 select-none shrink-0">
                                    ...
                                </span>
                            );
                        }
                        const isPageActive = currentPage === page;
                        return (
                            <button
                                key={`page-${page}`}
                                onClick={() => {
                                    setCurrentPage(page);
                                }}
                                className={`min-w-7 h-7 sm:min-w-8 sm:h-8 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                    isPageActive
                                        ? 'bg-orange-500 text-white font-black shadow-md shadow-orange-500/25 scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Next Button */}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                    }}
                    className={`group flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer shrink-0 ${
                        currentPage === totalPages
                            ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-transparent'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs font-bold'
                    }`}
                >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-6">
            {/* ── YOUTUBE-STYLE 2-COLUMN LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
                
                {/* ══════════════════════════════════════════════
                    LEFT COLUMN / TOP HERO: YouTube Playlist Hero Card
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
                                    onClick={() => firstUnwatched && navigate(`/classroom/${firstUnwatched.vid}`)}
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
                                        <Layers size={11} />
                                        <span>{totalVideos} Videos</span>
                                    </div>
                                </div>
                            )}

                            {/* Playlist Meta Header */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 bg-black/20 backdrop-blur-md text-white border border-white/20 font-black text-[10px] uppercase tracking-wider rounded-lg shadow-xs">
                                        {isFullyCompleted ? 'COMPLETED' : isNotStarted ? 'NOT STARTED' : 'IN PROGRESS'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white/95 border border-white/15">
                                        <Video size={11} className="text-white" />
                                        VIDEO COURSE
                                    </span>
                                </div>

                                <h1 className="text-base sm:text-xl font-black text-white leading-snug tracking-tight uppercase line-clamp-2 drop-shadow-sm">
                                    {playlist.name}
                                </h1>
                            </div>

                            {/* Overall Progress Bar */}
                            <div className="space-y-1.5 pt-0.5">
                                <div className="flex justify-between items-center text-xs font-bold text-white/90">
                                    <span>Course Progress</span>
                                    <span className="text-sm sm:text-base font-black text-white">{overallProgress}%</span>
                                </div>
                                <div className="w-full bg-black/25 rounded-full h-2 sm:h-2.5 backdrop-blur-sm overflow-hidden p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${overallProgress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-white/80 pt-0.5">
                                    <span>{completedVideos} completed</span>
                                    <span>{remainingVideos} remaining</span>
                                </div>
                            </div>

                            {/* Primary Action Buttons */}
                            <div className="space-y-2 pt-1">
                                {firstUnwatched && (
                                    <button
                                        onClick={() => navigate(`/classroom/${firstUnwatched.vid}`)}
                                        className="w-full h-10 sm:h-11 px-4 sm:px-5 bg-white text-[#FF5100] hover:bg-orange-50 active:scale-[0.98] shadow-md hover:shadow-lg rounded-xl font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Play size={15} className="fill-[#FF5100]" />
                                        <span>{isNotStarted ? "Start Learning" : isFullyCompleted ? "Review Again" : "Continue Learning"}</span>
                                    </button>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => navigate(`/dashboard/roadmap/${playlistId}`)}
                                        className="h-9 sm:h-10 px-3 bg-black/20 hover:bg-black/35 text-white border border-white/20 active:scale-95 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 backdrop-blur-md transition-all cursor-pointer truncate"
                                    >
                                        <Sparkles size={13} className="text-amber-200 shrink-0" />
                                        <span className="truncate">Roadmap</span>
                                    </button>

                                    {isEligibleForCert ? (
                                        <button
                                            onClick={() => navigate('/dashboard/quiz')}
                                            className="h-9 sm:h-10 px-3 bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/30 active:scale-95 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer truncate"
                                        >
                                            <Trophy size={13} className="shrink-0" />
                                            <span className="truncate">Certificate</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/classroom/${firstUnwatched ? firstUnwatched.vid : videos[0]?.vid}`)}
                                            className="h-9 sm:h-10 px-3 bg-black/20 hover:bg-black/35 text-white border border-white/20 active:scale-95 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 backdrop-blur-md transition-all cursor-pointer truncate"
                                        >
                                            <Clock size={13} className="text-white/80 shrink-0" />
                                            <span className="truncate">Classroom</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 4 Quick Stat Metric Tiles */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                                <BookOpen size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">{totalVideos}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Total Lessons</div>
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <CheckCircle size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">{completedVideos}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Completed</div>
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <Hourglass size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">{remainingVideos}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Remaining</div>
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                                <BarChart2 size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400 leading-tight">{overallProgress}%</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Progress</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    RIGHT COLUMN: YouTube Playlist Lessons List
                   ══════════════════════════════════════════════ */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-3.5 sm:p-5 flex flex-col lg:h-[calc(100vh-100px)] space-y-3">
                        {/* Section Header */}
                        <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText size={16} className="sm:size-[18px] stroke-[2.5]" />
                                </div>
                                <div>
                                    <h2 className="text-xs sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                                        Course Lessons & Curriculum
                                    </h2>
                                    <p className="hidden sm:block text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                        Click any lesson to open interactive AI notes, video, and quizzes.
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                                {totalVideos} Lessons
                            </span>
                        </div>

                        {/* Top Progress Bar on Right Side */}
                        <div className="space-y-1 sm:space-y-1.5 pb-2 sm:pb-3 border-b border-gray-100 dark:border-gray-700/60 shrink-0">
                            <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300">
                                <span>Progress</span>
                                <span className="text-orange-600 dark:text-orange-400 font-black">
                                    {completedVideos} of {totalVideos} ({overallProgress}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallProgress}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-[#FF5100] rounded-full"
                                />
                            </div>
                        </div>

                        {/* Top Pagination Controls - Desktop Only (Hidden on Mobile to save space) */}
                        <div className="hidden sm:block">
                            {renderPagination(true)}
                        </div>

                        {/* Scrollable YouTube Style Video Rows with Thumbnails */}
                        <div className="flex-1 lg:overflow-y-auto space-y-1.5 sm:space-y-2.5 pr-0 lg:pr-1 min-h-0">
                            {paginatedVideos.map((video, index) => {
                                const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                                const isCompleted = video.is_completed;
                                const isCurrent = !isCompleted && firstUnwatched && firstUnwatched.vid === video.vid;
                                const hasPassedQuiz = video.passed_quiz;

                                return (
                                    <motion.div
                                        key={video.vid}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.015 }}
                                        onClick={() => navigate(`/classroom/${video.vid}`)}
                                        className={`group flex items-center justify-between gap-2 sm:gap-4 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none ${
                                            isCompleted
                                                ? 'bg-[#F4FAF6] dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300'
                                                : isCurrent
                                                    ? 'bg-[#FFF9F5] dark:bg-orange-950/25 border-2 border-orange-400 dark:border-orange-500/50 shadow-md shadow-orange-500/10'
                                                    : 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100/70'
                                        }`}
                                    >
                                        {/* Left Side: Real YouTube Video Thumbnail + Info */}
                                        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                                            {/* YouTube Video Thumbnail with Timeline Progress Bar */}
                                            <div className="relative w-20 xs:w-24 sm:w-32 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 shadow-xs border border-black/5 dark:border-white/5">
                                                <img
                                                    src={`https://i.ytimg.com/vi/${video.vid}/mqdefault.jpg`}
                                                    alt={video.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />

                                                {/* Overlay badge for completed / current */}
                                                {isCompleted ? (
                                                    <div className="absolute inset-0 bg-emerald-950/35 backdrop-blur-[0.5px] flex items-center justify-center">
                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                                            <Check size={11} className="sm:size-[13px] stroke-[3]" />
                                                        </div>
                                                    </div>
                                                ) : isCurrent ? (
                                                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md animate-pulse">
                                                            <Play size={9} className="sm:size-[11px] fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Lesson Index Tag on Top Left */}
                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold rounded sm:rounded-md leading-none z-10 shadow-xs">
                                                    #{absoluteIndex + 1}
                                                </div>

                                                {/* Video Duration / Timestamp on Bottom Right */}
                                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/85 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-black rounded sm:rounded-md leading-none z-10 shadow-xs">
                                                    {formatVideoDuration(video.duration_seconds) || `#${absoluteIndex + 1}`}
                                                </div>

                                                {/* YouTube Timeline Progress Bar on Thumbnail */}
                                                {isCompleted ? (
                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-emerald-500 z-10" />
                                                ) : typeof video.watch_progress === 'number' && video.watch_progress > 0 ? (
                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/50 overflow-hidden z-10">
                                                        <div
                                                            className="bg-orange-500 h-full rounded-r-full"
                                                            style={{ width: `${Math.min(100, Math.max(0, video.watch_progress))}%` }}
                                                        />
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Video Title and Status Badges */}
                                            <div className="min-w-0 flex-1">
                                                <h3 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug transition-colors ${
                                                    isCompleted
                                                        ? 'text-gray-800 dark:text-gray-200'
                                                        : isCurrent
                                                            ? 'text-orange-600 dark:text-orange-400 font-black'
                                                            : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                                                }`}>
                                                    {video.name}
                                                </h3>

                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                                                    {isCompleted ? (
                                                        <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <Check size={11} className="stroke-[3]" /> Completed
                                                        </span>
                                                    ) : isCurrent ? (
                                                        <span className="text-[10px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                                                            In Progress
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-400">
                                                            Upcoming
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

                                        {/* Right Side: Action Trigger */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {isCompleted ? (
                                                <div className="flex items-center gap-1 text-emerald-500">
                                                    <span className="hidden sm:inline text-xs font-bold text-emerald-600">Review</span>
                                                    <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            ) : isCurrent ? (
                                                <div className="flex items-center gap-1 text-orange-500">
                                                    <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                                                        <Play size={10} className="fill-white" />
                                                        <span className="hidden xs:inline">Play</span>
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

                        {/* Bottom Pagination Controls */}
                        {renderPagination(false)}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PlaylistProgress;
