import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Play, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ContinueWatching = ({ videos: propVideos, loading: propLoading }) => {
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
        if (propVideos !== undefined) {
            setVideos(propVideos);
            setLoading(propLoading !== undefined ? propLoading : false);
            return;
        }

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
    }, [token, propVideos, propLoading]);

    if (loading) {
        return (
            <div className="space-y-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-44 bg-gray-255 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
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
            </div>
        );
    }

    if (videos.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2 mb-2">
            <h2 className="text-[14px] sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Zap size={18} className="text-orange-500" />
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
                            className="flex-shrink-0 w-[210px] sm:w-[290px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer snap-start flex flex-col overflow-hidden group/item"
                            onClick={() => navigate(`/classroom/${video.vid}`)}
                        >
                            <div className="w-full aspect-video relative flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 shadow-sm">
                                <img 
                                    src={`https://img.youtube.com/vi/${video.vid}/hqdefault.jpg`}
                                    alt={video.name} 
                                    className="w-full h-full object-cover animate-none"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                    Continue
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between min-w-0 p-3 pb-3.5">
                                <h3 className="font-bold text-gray-855 dark:text-gray-100 text-[13px] leading-tight line-clamp-2 group-hover/item:text-orange-500 transition-colors">
                                    {video.name}
                                </h3>
                                <div className="mt-2.5">
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-400 font-bold mb-0.5">
                                        <span>Progress</span>
                                        <span>{Math.round(video.watch_progress || 0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-105 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${video.watch_progress || 0}%` }}
                                        ></div>
                                    </div>
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