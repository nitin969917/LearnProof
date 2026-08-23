import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocialMessageStore } from "../../store/socialMessageStore";
import axios from "axios";
import toast from "react-hot-toast";
import { 
    BookOpen, 
    GraduationCap, 
    Video, 
    Users, 
    Library, 
    Share2, 
    ArrowRight, 
    ChevronLeft, 
    ChevronRight,
    MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import CalendarCard from "./CalendarCard";
import CompletedSection from "./CompletedSection";
import ContinueWatching from "./ContinueWatching";
import VideosSection from "./VideosSection";
import DailyTasksCard from "./DailyTasksCard";
import ScreenTimeCard from "./ScreenTimeCard";

const DashboardHome = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);
    const [isNewUser, setIsNewUser] = useState(false);
    const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

    const [playlists, setPlaylists] = useState([]);
    const [videos, setVideos] = useState([]);
    const [continueVideos, setContinueVideos] = useState([]);
    const [loadingLearnings, setLoadingLearnings] = useState(true);
    const [loadingContinue, setLoadingContinue] = useState(true);
    const [fetchFailed, setFetchFailed] = useState(false);

    const playlistContainerRef = useRef(null);

    const scrollPlaylists = (direction) => {
        if (playlistContainerRef.current) {
            const { scrollLeft, clientWidth } = playlistContainerRef.current;
            const scrollAmount = clientWidth * 0.8;
            playlistContainerRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.origin);
        toast.success("Share link copied! Send it to your friends.");
    };

    useEffect(() => {
        let active = true;

        const fetchLearnings = async (retries = 2) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/my-learnings/`, {
                        idToken: token,
                        page: 1,
                        searchQuery: ""
                    });
                    if (active) {
                        setPlaylists(res.data?.playlists || []);
                        setVideos(res.data?.videos?.results || []);
                        setFetchFailed(false);
                    }
                    if (active) setLoadingLearnings(false);
                    return; // Success, exit
                } catch (err) {
                    console.warn(`Dashboard learnings fetch attempt ${i + 1} failed:`, err);
                    if (i === retries) {
                        console.error("Dashboard learnings data fetch failed after retries", err);
                        if (active) {
                            setFetchFailed(true);
                            setLoadingLearnings(false);
                        }
                    } else {
                        // Wait 500ms before retrying
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
        };

        const fetchContinueWatching = async (retries = 2) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/continue-watch/`, {
                        idToken: token
                    });
                    if (active) {
                        setContinueVideos(res.data?.videos || []);
                        setFetchFailed(false);
                    }
                    if (active) setLoadingContinue(false);
                    return; // Success, exit
                } catch (err) {
                    console.warn(`Dashboard continue watch fetch attempt ${i + 1} failed:`, err);
                    if (i === retries) {
                        console.error("Dashboard continue watch fetch failed after retries", err);
                        if (active) {
                            setFetchFailed(true);
                            setLoadingContinue(false);
                        }
                    } else {
                        // Wait 500ms before retrying
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
        };

        if (token) {
            setLoadingLearnings(true);
            setLoadingContinue(true);
            setFetchFailed(false);
            fetchLearnings();
            fetchContinueWatching();
        }

        return () => {
            active = false;
        };
    }, [token]);

    // Check if new user after both finished loading
    useEffect(() => {
        if (!loadingLearnings && !loadingContinue && !fetchFailed) {
            if (playlists.length === 0 && continueVideos.length === 0 && videos.length === 0) {
                setIsNewUser(true);
            }
            setHasCheckedStatus(true);
        }
    }, [loadingLearnings, loadingContinue, fetchFailed, playlists, continueVideos, videos]);

    if (fetchFailed) {
        return (
            <div className="p-6 h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-red-500/10 rounded-full border border-red-500/20 text-red-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </motion.div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Connection Issue</h2>
                    <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                        We had trouble connecting to the database. Please try reloading the page.
                    </p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all"
                >
                    Reload Page
                </button>
            </div>
        );
    }



    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start max-w-[1360px] mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8 animate-in fade-in duration-500">
            {/* Left column (Flexible) */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* 1. GREETING BANNER CARD */}
                <div className="bg-gradient-to-br from-[#FFF5F2] to-[#FFF9F6] dark:from-gray-800 dark:to-gray-900 p-4 sm:p-5 rounded-[2rem] border border-orange-100/50 dark:border-gray-700 shadow-sm relative overflow-hidden transition-all duration-200 flex flex-row items-center justify-between gap-4">
                    <div className="flex-1 space-y-0.5 text-left min-w-0 pr-2">
                        <span className="text-[11px] sm:text-xs font-bold text-gray-500/80 dark:text-slate-400">Welcome back,</span>
                        <h1 className="text-sm sm:text-2xl font-black text-orange-555 leading-tight mt-0.5 sm:mt-1">
                            {user?.name || "Learner"}! 👋
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500/80 dark:text-slate-400 font-bold mt-1 max-w-xl leading-snug">
                            Select a path to continue your learning journey or interact with other students.
                        </p>
                    </div>
                    <div className="w-[80px] sm:w-[130px] shrink-0 relative z-10">
                        <img 
                            src="/waving_student.png" 
                            alt="Welcome Illustration" 
                            className="w-full h-auto object-contain" 
                        />
                    </div>
                </div>
                {/* 2. SERVICES/FEATURES GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Learning Hub Card */}
                    <div
                        onClick={() => navigate((playlists.length === 0 && videos.length === 0) ? '/dashboard/explore' : '/dashboard/library')}
                        className="bg-white dark:bg-gray-800 rounded-[2rem] border border-orange-100/40 dark:border-gray-700 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-600 fill-red-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.5 12 3.5 12 3.5s-7.522 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.478 20.5 12 20.5 12 20.5s7.522 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.971 24 12 24 12s0-3.971-.502-5.837z" />
                                        <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="white" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                    Learning Hub
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500/80 dark:text-slate-400 font-bold mt-3 leading-snug line-clamp-2 min-h-[32px]">
                                Learn from YouTube videos, study AI notes, and view roadmaps.
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full">
                                {playlists.length + videos.length > 0 ? `${playlists.length + videos.length} Courses` : "21 Courses"}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
                                <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>

                    {/* Live Rooms Card */}
                    <div
                        onClick={() => navigate('/dashboard/live-rooms')}
                        className="bg-white dark:bg-gray-800 rounded-[2rem] border border-orange-100/40 dark:border-gray-700 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-555 flex items-center justify-center shrink-0">
                                    <Video size={16} />
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                    Live Rooms
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500/80 dark:text-slate-400 font-bold mt-3 leading-snug line-clamp-2 min-h-[32px]">
                                Join audio/video study rooms and interact with others in real-time.
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                                Interact
                            </span>
                            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                                <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>

                    {/* Social Hub Card */}
                    <div
                        onClick={() => navigate('/dashboard/social')}
                        className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 rounded-[2rem] border border-orange-100/40 dark:border-gray-700 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-[#1f2c24] text-emerald-500 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                    Social Hub
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500/80 dark:text-slate-400 font-bold mt-3 leading-snug line-clamp-2 min-h-[32px]">
                                Interact with study partners, send messages, and share updates.
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                                Connect
                            </span>
                            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                                <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>

                    {/* Ask My Notes Card */}
                    <div
                        onClick={() => navigate('/dashboard/ask-my-notes')}
                        className="hidden lg:flex bg-white dark:bg-gray-800 rounded-[2rem] border border-orange-100/40 dark:border-gray-700 p-5 flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center shrink-0">
                                    <MessageSquare size={16} />
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                    Ask My Notes
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500/80 dark:text-slate-400 font-bold mt-3 leading-snug line-clamp-2 min-h-[32px]">
                                Chat with your PDFs, slides, and notes using LearnProof AI.
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 flex-row">
                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full">
                                Chat
                            </span>
                            <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
                                <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>
                </div>
                {/* 4. SHARE CARD SECTION */}
                <div className="bg-[#FFFBF7] dark:bg-gray-800/40 rounded-[2rem] border border-orange-100/50 dark:border-gray-700/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-orange-100/50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/10">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-sm sm:text-base">
                                Share LearnProof AI
                            </h3>
                            <p className="text-xs text-gray-500/80 dark:text-slate-400 font-bold mt-0.5">
                                Invite your friends and learn together.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-orange-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-orange-50/20 text-orange-600 dark:text-orange-400 font-black text-xs transition cursor-pointer shadow-sm"
                    >
                        Share Now
                    </button>
                </div>

                {/* 5. PLAYLISTS SECTION */}
                {playlists.length > 0 && (
                    <div className="space-y-4 relative group">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[13px] sm:text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                                <Library size={18} className="text-orange-500" />
                                <span>Your Playlists</span>
                            </h2>
                            <button
                                onClick={() => navigate('/dashboard/library')}
                                className="px-4 py-1.5 rounded-full border border-orange-200/60 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-orange-50/20 text-orange-600 dark:text-orange-400 text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                                View all <ArrowRight size={12} />
                            </button>
                        </div>

                        <div className="relative">
                            {/* Scroll buttons */}
                            <button
                                onClick={() => scrollPlaylists('left')}
                                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div
                                ref={playlistContainerRef}
                                className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar mt-4"
                            >
                                {playlists.map((pl) => {
                                    const totalVideos = pl.videos?.length || 0;
                                    const completedVideos = pl.videos?.filter(v => v.is_completed)?.length || 0;
                                    const percentComplete = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;
                                    const thumbnail = pl.thumbnail || (pl.videos?.length > 0 ? `https://img.youtube.com/vi/${pl.videos[0].vid}/hqdefault.jpg` : "");

                                    return (
                                        <div
                                            key={pl.pid}
                                            onClick={() => navigate(`/dashboard/playlist/${pl.pid}`)}
                                            className="flex-shrink-0 w-[210px] sm:w-[290px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer snap-start flex flex-col overflow-hidden group/item"
                                        >
                                            <div className="w-full aspect-video relative flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                                                {thumbnail ? (
                                                    <img 
                                                        src={thumbnail} 
                                                        alt={pl.name} 
                                                        className="w-full h-full object-cover animate-none"
                                                    />
                                                ) : (
                                                    <Library size={24} className="text-orange-300" />
                                                )}
                                                <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                                    {totalVideos} Videos
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between min-w-0 p-3 pb-3.5">
                                                <h3 className="font-bold text-gray-855 dark:text-gray-100 text-[13px] leading-tight line-clamp-2 group-hover/item:text-orange-500 transition-colors">
                                                    {pl.name}
                                                </h3>
                                                <div className="mt-2.5">
                                                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-400 font-bold mb-0.5">
                                                        <span>Progress</span>
                                                        <span>{percentComplete}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-105 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-orange-500 h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${percentComplete}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => scrollPlaylists('right')}
                                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-pointer"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 6. INDIVIDUAL VIDEOS & QUICK RESUME SECTION */}
                <div className="space-y-4 pt-4 border-t border-orange-100/30 dark:border-gray-700/50">
                    <VideosSection data={videos} loading={loadingLearnings} />
                    <ContinueWatching videos={continueVideos} loading={loadingContinue} />
                </div>

                {/* 7. COMPLETED VIDEOS LIST (Desktop only) */}
                <div className="hidden lg:block">
                    <CompletedSection />
                </div>
            </div>

            {/* Right column (Fixed width on large screens, flex-col layout) */}
            <div className="w-full lg:w-[310px] shrink-0 flex flex-col gap-4">
                <ScreenTimeCard />
                <DailyTasksCard />
                <CalendarCard />
            </div>

            {/* Completed Videos List (Mobile only) */}
            <div className="block lg:hidden w-full pt-6 border-t border-orange-100/50 dark:border-gray-700">
                <CompletedSection />
            </div>
        </div> );
};

export default DashboardHome;