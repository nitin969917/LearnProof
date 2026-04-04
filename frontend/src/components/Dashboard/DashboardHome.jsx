import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import CalendarCard from "./CalendarCard";
import XPChart from "./XPChart";
import CompletedSection from "./CompletedSection";
import ContinueWatching from "./ContinueWatching";
import PlaylistSection from "./PlaylistSection";
import VideosSection from "./VideosSection";
import DailyTasksCard from "./DailyTasksCard";
import { Sparkles, Compass, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

const DashboardHome = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isNewUser, setIsNewUser] = useState(false);
    const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                // Check both playlists AND continue watching status
                const [playlistRes, continueWatchRes] = await Promise.all([
                    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/my-learnings/`, {
                        idToken: token,
                        page: 1,
                        searchQuery: ""
                    }),
                    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/continue-watch/`, {
                        idToken: token
                    })
                ]);

                const hasPlaylists = playlistRes.data?.playlists && playlistRes.data.playlists.length > 0;
                const hasContinueVideos = continueWatchRes.data?.videos && continueWatchRes.data.videos.length > 0;

                if (!hasPlaylists && !hasContinueVideos) {
                    setIsNewUser(true);
                }
            } catch (err) {
                console.error("Onboarding check failed", err);
            } finally {
                setHasCheckedStatus(true);
            }
        };

        if (token && !hasCheckedStatus) {
            checkOnboardingStatus();
        }
    }, [token, navigate, hasCheckedStatus]);

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
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:items-start animate-in fade-in duration-500">
            {/* Left column (Flexible) */}
            <div className="flex-1 min-w-0 space-y-6">
                <PlaylistSection />
                <VideosSection />
                <ContinueWatching />
                <CompletedSection />
            </div>

            {/* Right column (Fixed width on large screens, grid on tablet) */}
            <div className="w-full lg:w-[350px] shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                <DailyTasksCard />
                <CalendarCard />
                <div className="md:col-span-2 lg:col-span-1">
                    <XPChart />
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;