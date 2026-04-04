// Dashboard/CompletedSection.jsx

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Play, ChevronLeft, ChevronRight, Trophy, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CompletedSection = () => {
    const { token } = useAuth();
    const [videos, setVideos] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const videoScrollRef = useRef(null);
    const playlistScrollRef = useRef(null);
    const navigate = useNavigate();

    const scroll = (ref, direction) => {
        if (ref.current) {
            const { scrollLeft, clientWidth } = ref.current;
            const scrollAmount = clientWidth * 0.8;
            ref.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const fetchCompleted = async () => {
            const CS = toast.loading("Fetching your completions....");
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/complete/`, {
                    idToken: token,
                });

                if (res.data) {
                    setVideos(res.data.videos || []);
                    setPlaylists(res.data.playlists || []);
                }
                toast.success("Completed content loaded!", { id: CS });
            } catch (err) {
                toast.error("Failed to load completed content.", { id: loadingToast });
                console.log('Failed to load completed content.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchCompleted();
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

    return (
        <div className="space-y-10">
            {/* Completed Videos */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Trophy size={20} className="text-orange-500" />
                    Completed Videos
                </h2>
                {videos.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No completed videos yet.</p>
                ) : (
                    <div className="relative group">
                        <button
                            onClick={() => scroll(videoScrollRef, 'left')}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div 
                            ref={videoScrollRef}
                            className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar"
                        >
                            {videos.map((video, index) => (
                                <motion.div
                                    key={video.vid}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group/card flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-green-100 dark:hover:shadow-green-900/20 hover:border-green-400 dark:hover:border-green-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer snap-start"
                                    onClick={() => navigate(`/classroom/${video.vid}`)}
                                >
                                    <div className="aspect-video relative flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 transition-transform duration-500 group-hover/card:scale-[1.02]">
                                        <img src={`https://img.youtube.com/vi/${video.vid}/hqdefault.jpg`} alt={video.name} className="w-full h-full object-cover" />
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
                                        <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg border border-white/10">
                                            Completed
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover/card:text-green-600 dark:group-hover/card:text-green-400 text-md truncate transition-colors duration-300">{video.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate mb-4">{video.description || 'No description available.'}</p>
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-[11px] font-black uppercase tracking-wider">
                                            <CheckCircle size={14} fill="currentColor" className="text-green-100 dark:text-green-900" />
                                            <span>Completed</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button
                            onClick={() => scroll(videoScrollRef, 'right')}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* Completed Playlists */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Award size={20} className="text-orange-500" />
                    Completed Playlists
                </h2>
                {playlists.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No completed playlists yet.</p>
                ) : (
                    <div className="relative group">
                        <button
                            onClick={() => scroll(playlistScrollRef, 'left')}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div 
                            ref={playlistScrollRef}
                            className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide"
                        >
                            {playlists.map((playlist, index) => {
                                const thumbnail = playlist.thumbnail || (playlist.videos?.length > 0 ? `https://img.youtube.com/vi/${playlist.videos[0].vid}/hqdefault.jpg` : "");
                                
                                return (
                                    <motion.div
                                        key={playlist.pid}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group/card flex-shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-green-100 dark:hover:shadow-green-900/20 hover:border-green-400 dark:hover:border-green-500 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer snap-start"
                                        onClick={() => navigate(`/dashboard/playlist/${playlist.pid}`)}
                                    >
                                        <div className="aspect-video relative flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 transition-transform duration-500 group-hover/card:scale-[1.02]">
                                            {thumbnail ? (
                                                <img
                                                    src={thumbnail}
                                                    alt={playlist.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Play size={48} className="text-green-300" />
                                            )}
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
                                            <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg border border-white/10">
                                                Completed
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover/card:text-green-600 dark:group-hover/card:text-green-400 text-md mb-1 truncate transition-colors duration-300">
                                                {playlist.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-[11px] font-black uppercase tracking-wider">
                                                <CheckCircle size={14} fill="currentColor" className="text-green-100 dark:text-green-900" />
                                                <span>Completed</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center group-hover/card:border-green-100 dark:group-hover/card:border-green-900/30 transition-colors">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-400 group-hover/card:text-green-600 transition-colors">Full Course</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Classroom →</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => scroll(playlistScrollRef, 'right')}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedSection;
