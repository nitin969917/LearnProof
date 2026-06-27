import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import CalendarCard from "./CalendarCard";
import CompletedSection from "./CompletedSection";
import ContinueWatching from "./ContinueWatching";
import PlaylistSection from "./PlaylistSection";
import VideosSection from "./VideosSection";
import DailyTasksCard from "./DailyTasksCard";
import ScreenTimeCard from "./ScreenTimeCard";
import { Sparkles, Compass, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

const DashboardHome = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
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
            <div className="flex-1 min-w-0 space-y-4">
                <PlaylistSection data={playlists} loading={loadingLearnings} />
                <VideosSection data={videos} loading={loadingLearnings} />
                <ContinueWatching videos={continueVideos} loading={loadingContinue} />
                <CompletedSection />
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