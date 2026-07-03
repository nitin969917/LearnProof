import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocialMessageStore } from "../../store/socialMessageStore";
import axios from "axios";
import toast from "react-hot-toast";
import CalendarCard from "./CalendarCard";
import CompletedSection from "./CompletedSection";
import ContinueWatching from "./ContinueWatching";
import PlaylistSection from "./PlaylistSection";
import VideosSection from "./VideosSection";
import DailyTasksCard from "./DailyTasksCard";
import ScreenTimeCard from "./ScreenTimeCard";
import { Sparkles, Compass, PlayCircle, Globe, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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

    useEffect(() => {
        let active = true;

        const fetchLearnings = async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/my-learnings/`, {
                    idToken: token,
                    page: 1,
                    searchQuery: ""
                });
                if (active) {
                    setPlaylists(res.data?.playlists || []);
                    setVideos(res.data?.videos?.results || []);
                }
            } catch (err) {
                console.error("Dashboard learnings data fetch failed", err);
                if (active) setFetchFailed(true);
            } finally {
                if (active) setLoadingLearnings(false);
            }
        };

        const fetchContinueWatching = async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/continue-watch/`, {
                    idToken: token
                });
                if (active) {
                    setContinueVideos(res.data?.videos || []);
                }
            } catch (err) {
                console.error("Dashboard continue watch fetch failed", err);
                if (active) setFetchFailed(true);
            } finally {
                if (active) setLoadingContinue(false);
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

    if (isNewUser) {
        return (
            <div className="p-6 h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-orange-500/10 rounded-full border border-orange-500/20"
                >
                    <Compass size={64} className="text-orange-500 animate-pulse" />
                </motion.div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Time to discover!</h2>
                    <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                        Your dashboard is empty. Let's take you to the Explore tab to find some high-quality YouTube courses.
                    </p>
                </div>
                <div className="flex gap-4">
                  <button 
                      onClick={() => {
                        toast("Welcome Explorer! Let's find your first course.", { icon: '🌟', duration: 3000 });
                        navigate('/dashboard/explore');
                      }}
                      className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all flex items-center gap-2"
                  >
                      <Compass size={18} />
                      Go to Explore
                  </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start animate-in fade-in duration-500">
            {/* Left column (Flexible) */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* Greeting banner */}
                <div className="bg-gradient-to-r from-white via-orange-50/5 to-orange-100/5 dark:from-gray-800 dark:to-gray-900/40 p-5 sm:p-6 rounded-2xl border border-orange-100 dark:border-gray-700/60 shadow-sm relative overflow-hidden transition-colors duration-200">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        Welcome back, {user?.name || "Learner"}! <span className="animate-bounce">👋</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Select a path to continue your learning journey or connect with other students.
                    </p>
                </div>

                {/* Hub Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Learning Hub Card */}
                    <motion.div
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="bg-gradient-to-br from-white to-orange-50/10 dark:from-gray-800 dark:to-gray-850 p-3 sm:p-5 rounded-2xl border border-orange-100/80 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-900 transition-all cursor-pointer relative overflow-hidden group flex flex-row sm:flex-col justify-between gap-3 sm:gap-0 h-[110px] sm:h-auto"
                        onClick={() => navigate('/dashboard/library')}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all pointer-events-none" />
                        <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 shadow-sm shadow-orange-500/10 transition-transform duration-300 group-hover:scale-105">
                                <PlayCircle size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1 sm:mt-1">
                                <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white leading-tight">Learning Hub</h3>
                                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium leading-normal sm:leading-relaxed">
                                    Learn from YouTube courses, summarize videos with AI, practice with quizzes, and earn certificates.
                                </p>
                            </div>
                        </div>
                        <div className="flex sm:flex-row flex-col items-center justify-center sm:justify-between sm:mt-5 sm:pt-3 sm:border-t border-orange-50 dark:border-gray-700/50 gap-2 shrink-0">
                            <span className="text-[9px] sm:text-xs text-orange-600 dark:text-orange-400 font-extrabold bg-orange-100/60 dark:bg-orange-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap text-center">
                                {playlists.length + videos.length > 0 ? `${playlists.length + videos.length} Courses` : "Start"}
                            </span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20 transition-all duration-300 group-hover:bg-orange-655 group-hover:scale-110">
                                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Live Rooms Card */}
                    <motion.div
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="bg-gradient-to-br from-white to-blue-50/10 dark:from-gray-800 dark:to-gray-850 p-3 sm:p-5 rounded-2xl border border-blue-100/80 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all cursor-pointer relative overflow-hidden group flex flex-row sm:flex-col justify-between gap-3 sm:gap-0 h-[110px] sm:h-auto"
                        onClick={() => navigate('/dashboard/live-rooms')}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                        <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 shadow-sm shadow-blue-500/10 transition-transform duration-300 group-hover:scale-105">
                                <Globe size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1 sm:mt-1">
                                <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white leading-tight">Live Rooms</h3>
                                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium leading-normal sm:leading-relaxed">
                                    Join interactive live audio and video rooms to practice language speaking with learners in real-time.
                                </p>
                            </div>
                        </div>
                        <div className="flex sm:flex-row flex-col items-center justify-center sm:justify-between sm:mt-5 sm:pt-3 sm:border-t border-blue-50 dark:border-gray-700/50 gap-2 shrink-0">
                            <span className="text-[9px] sm:text-xs text-blue-600 dark:text-blue-400 font-extrabold bg-blue-100/60 dark:bg-blue-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap text-center">
                                Practice
                            </span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all duration-300 group-hover:bg-blue-655 group-hover:scale-110">
                                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Social Hub Card */}
                    <motion.div
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="bg-gradient-to-br from-white to-emerald-50/10 dark:from-gray-800 dark:to-gray-850 p-3 sm:p-5 rounded-2xl border border-emerald-100/80 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-900 transition-all cursor-pointer relative overflow-hidden group flex flex-row sm:flex-col justify-between gap-3 sm:gap-0 h-[110px] sm:h-auto"
                        onClick={() => navigate('/dashboard/social')}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                        <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0 sm:mb-4 shadow-sm shadow-emerald-500/10 transition-transform duration-300 group-hover:scale-105">
                                <Users size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1 sm:mt-1">
                                <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white leading-tight">Social Hub</h3>
                                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium leading-normal sm:leading-relaxed">
                                    Message study partners, make posts, check your inbox, and grow your collaborative network.
                                </p>
                            </div>
                        </div>
                        <div className="flex sm:flex-row flex-col items-center justify-center sm:justify-between sm:mt-5 sm:pt-3 sm:border-t border-emerald-50 dark:border-gray-700/50 gap-2 shrink-0">
                            {totalUnreadCount > 0 ? (
                                <span className="text-[9px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-100/60 dark:bg-emerald-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full animate-pulse whitespace-nowrap text-center">
                                    {totalUnreadCount} New
                                </span>
                            ) : (
                                <span className="text-[9px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-100/60 dark:bg-emerald-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap text-center">
                                    Connect
                                </span>
                            )}
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 transition-all duration-300 group-hover:bg-emerald-655 group-hover:scale-110">
                                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Quick Resume Section */}
                <div className="space-y-4 pt-6 border-t border-orange-100/50 dark:border-gray-700">
                    <div className="space-y-4">
                        <PlaylistSection data={playlists} loading={loadingLearnings} />
                        <VideosSection data={videos} loading={loadingLearnings} />
                        <ContinueWatching videos={continueVideos} loading={loadingContinue} />
                        <CompletedSection />
                    </div>
                </div>
            </div>

            {/* Right column (Fixed width on large screens, grid on tablet) */}
            <div className="w-full lg:w-[350px] shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-1 md:grid-cols-2 lg:grid-cols-1">
                    <ScreenTimeCard />
                    <DailyTasksCard />
                </div>
                <CalendarCard />
            </div>
        </div>
    );
};

export default DashboardHome;