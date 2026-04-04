import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Play, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const VideosSection = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [videos, setVideos] = useState([]);
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
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/my-learnings/`, {
                    idToken: token,
                    page: 1,
                    searchQuery: ""
                });

                if (res.data?.videos?.results) {
                    // Filter out videos that are already in "Continue Watching" if we wanted, 
                    // but usually "Your Videos" section shows all standalone videos.
                    setVideos(res.data.videos.results);
                }
            } catch (err) {
                console.error('Error fetching videos: ', err);
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
            <div className="space-y-6 mb-8">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 animate-pulse space-y-4">
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
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
        <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Video size={20} className="text-orange-500" />
                Your Individual Lessons
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group/card flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-orange-100 dark:hover:shadow-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer snap-start"
                            onClick={() => navigate(`/classroom/${video.vid}`)}
                        >
                            <div className="aspect-video relative overflow-hidden rounded-t-xl">
                                <img
                                    src={`https://img.youtube.com/vi/${video.vid}/hqdefault.jpg`}
                                    alt={video.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/50 transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
                                        <Play size={24} className="text-white fill-white ml-1" />
                                    </div>
                                </div>
                                {video.is_completed && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                                        Mastered
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover/card:text-orange-500 text-sm mb-2 line-clamp-2 transition-colors duration-300">
                                    {video.name}
                                </h3>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                    <div
                                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${video.watch_progress || 0}%` }}
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

export default VideosSection;
