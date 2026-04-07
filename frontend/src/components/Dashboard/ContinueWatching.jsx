import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Play, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ContinueWatching = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(null);
    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollContainerRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/continue-watch/`, {
                    idToken: token,
                });

                if (res.data?.videos) {
                    setVideos(res.data.videos);
                }
            } catch (err) {
                console.error('Error fetching continue watching videos: ', err);
                toast.error("Failed to fetch your history...");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchVideos();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 animate-pulse space-y-4">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (videos.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Zap size={20} className="text-orange-500" />
                Continue Watching
            </h2>
            <div className="relative group">
                <button
                    onClick={() => scroll('left')}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>

                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar"
                >
                    {videos.map((video, index) => (
                        <motion.div
                            key={video.vid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group/card flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 dark:hover:shadow-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer snap-start"
                            onClick={() => navigate(`/classroom/${video.vid}`)}
                        >
                            <div className="aspect-video relative flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 transition-transform duration-500 group-hover/card:scale-[1.02]">
                                <img
                                    src={`https://img.youtube.com/vi/${video.vid}/hqdefault.jpg`}
                                    alt={video.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/50 transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-7 w-7 text-white ml-1"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-white/10">
                                    Continue
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 dark:text-white group-hover/card:text-orange-500 dark:group-hover/card:text-orange-400 text-md mb-1 truncate transition-colors duration-300">
                                    {video.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate mb-4">{video.description || 'No description available.'}</p>
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                        <Play size={14} fill="currentColor" />
                                        <span>{Math.round(video.watch_progress)}% Watched</span>
                                    </div>
                                    <span className="text-gray-400 dark:text-slate-500 group-hover/card:text-orange-500 transition-colors duration-300">Continue</span>
                                </div>
                                <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                    <div
                                        className="bg-orange-500 h-full transition-all duration-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                                        style={{ width: `${video.watch_progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};

export default ContinueWatching;