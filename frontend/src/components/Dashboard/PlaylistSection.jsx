import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const PlaylistSection = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [playlists, setPlaylists] = useState([]);
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
        const fetchPlaylists = async () => {
            const PL = toast.loading("Loading your playlists...");
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/my-learnings/`, {
                    idToken: token,
                    page: 1,
                    searchQuery: ""
                });

                if (res.data?.playlists) {
                    setPlaylists(res.data.playlists);
                }
                toast.success('Playlists loaded!', { id: PL });
            } catch (err) {
                console.error('Error fetching playlists: ', err);
                toast.error("Failed to fetch playlists.", { id: PL });
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPlaylists();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 animate-pulse space-y-4">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (playlists.length === 0) {
        return null; // Return null if there are no playlists
    }

    return (
        <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Your Playlists</h2>
            <div className="relative group">
                {/* Scroll Buttons */}
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
                    {playlists.map((pl, index) => {
                        // Find total width completion
                        const totalVideos = pl.videos?.length || 0;
                        const completedVideos = pl.videos?.filter(v => v.is_completed)?.length || 0;
                        const percentComplete = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;

                        // Use dedicated playlist thumbnail, fall back to first video
                        const thumbnail = pl.thumbnail || (pl.videos?.length > 0 ? `https://img.youtube.com/vi/${pl.videos[0].vid}/hqdefault.jpg` : "");

                        return (
                            <motion.div
                                key={pl.pid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group/card flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-orange-100 dark:hover:shadow-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer snap-start"
                                onClick={() => {
                                    navigate(`/dashboard/playlist/${pl.pid}`);
                                }}
                            >
                                <div className="aspect-video bg-gray-100 cursor-pointer relative flex items-center justify-center overflow-hidden">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            alt={pl.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                        />
                                    ) : (
                                        <Play size={48} className="text-orange-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
                                        {totalVideos} Videos
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover/card:text-orange-500 dark:group-hover/card:text-orange-400 text-md mb-1 truncate cursor-pointer transition-colors duration-300">
                                        {pl.name}
                                    </h3>
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm mb-1 text-gray-500 dark:text-gray-400">
                                            <span>Progress</span>
                                            <span className="font-semibold group-hover/card:text-orange-500 transition-colors duration-300">{percentComplete}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-orange-500 group-hover/card:bg-orange-400 h-1.5 rounded-full transition-all duration-500 shadow-sm group-hover/card:shadow-orange-400/50"
                                                style={{ width: `${percentComplete}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
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

export default PlaylistSection;
