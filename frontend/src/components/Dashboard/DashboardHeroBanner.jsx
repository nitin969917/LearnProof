import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const autocompleteCache = new Map();

const isYouTubeUrl = (testUrl) => {
    if (!testUrl || typeof testUrl !== 'string') return false;
    const trimmed = testUrl.trim().toLowerCase();
    return (
        trimmed.includes('youtube.com/watch') ||
        trimmed.includes('youtube.com/playlist') ||
        trimmed.includes('youtu.be/') ||
        trimmed.includes('youtube.com/shorts') ||
        trimmed.includes('youtube.com/embed')
    );
};

const DashboardHeroBanner = ({ user }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [importData, setImportData] = useState(null);

    const skipNextAutocompleteRef = useRef(false);
    const searchContainerRef = useRef(null);
    const inputRef = useRef(null);
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Automatically focus search input when redirected with focusSearch
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (location.state?.focusSearch || params.get('focusSearch') === 'true') {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    inputRef.current.focus();
                }
            }, 120);

            if (location.state?.focusSearch) {
                window.history.replaceState({}, document.title);
            } else if (params.get('focusSearch') === 'true') {
                window.history.replaceState({}, document.title, location.pathname);
            }

            return () => clearTimeout(timer);
        }
    }, [location.state, location.search]);

    // Debounced Autocomplete
    useEffect(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed || isYouTubeUrl(query)) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (skipNextAutocompleteRef.current) {
            skipNextAutocompleteRef.current = false;
            return;
        }

        if (autocompleteCache.has(trimmed)) {
            setSuggestions(autocompleteCache.get(trimmed));
            setShowSuggestions(true);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/youtube-autocomplete/`, {
                    idToken: token,
                    query: query
                });
                if (res.data?.suggestions && res.data.suggestions.length > 0) {
                    autocompleteCache.set(trimmed, res.data.suggestions);
                    setSuggestions(res.data.suggestions);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.debug("Dashboard autocomplete error:", err);
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [query, token]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleSubmit = async (customVal) => {
        const targetVal = (customVal !== undefined ? customVal : query).trim();
        if (!targetVal) {
            toast.error("Please enter a topic or paste a YouTube link");
            return;
        }

        skipNextAutocompleteRef.current = true;
        setShowSuggestions(false);
        setSuggestions([]);

        if (isYouTubeUrl(targetVal)) {
            await handleImportYouTube(targetVal);
        } else {
            navigate(`/dashboard/search?q=${encodeURIComponent(targetVal)}`);
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter') handleSubmit();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                const selected = suggestions[activeSuggestionIndex];
                skipNextAutocompleteRef.current = true;
                setQuery(selected);
                setShowSuggestions(false);
                handleSubmit(selected);
            } else {
                handleSubmit();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleImportYouTube = async (targetUrl) => {
        const finalUrl = (targetUrl || query).trim();
        if (!finalUrl) return;

        setLoading(true);
        const toastId = toast.loading("Fetching playlist details from YouTube...");
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/import/`, {
                idToken: token,
                url: finalUrl
            });

            if (response.data.success) {
                setImportData(response.data.data);
                toast.dismiss(toastId);
            } else {
                toast.error("Something went wrong with this link!", { id: toastId });
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Failed to import YouTube link. Please check the URL.";
            toast.error(errMsg, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveImported = async () => {
        if (!importData) return;

        const count = importData.videos?.length || importData.video_count;
        const toastId = toast.loading(count ? `Saving ${count} videos to your library...` : "Saving to your library...");
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/save-learning/`, {
                idToken: token,
                data: importData,
            });

            toast.dismiss(toastId);
            toast.success("Course saved to your library!");
            setImportData(null);
            setQuery('');
            navigate('/dashboard/library');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to save learning playlist", { id: toastId });
        }
    };

    return (
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FFF9F5] via-[#FFF5ED] to-[#FFEFE6] dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border border-orange-100/90 dark:border-gray-700/80 shadow-xs pt-3 sm:pt-4 pb-3 sm:pb-3.5 px-3.5 sm:px-5 md:px-6 transition-all duration-300">
            {/* Ambient Background Glow Layer */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-1/4 w-60 h-60 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-2xl" />
                <div className="absolute bottom-0 right-10 w-64 h-64 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-2xl" />
            </div>

            {/* Top Row: Left is Text, Right is 3D Mascot Character (balanced and vertically centered) */}
            <div className="relative z-10 flex flex-row items-center justify-between gap-3 sm:gap-6 mb-2 sm:mb-2.5">
                {/* Left Side: Greeting, Headline, Subtitle */}
                <div className="flex-1 max-w-[440px] text-left min-w-0 pr-1">
                    <span className="inline-block text-[11px] sm:text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wide mb-0.5">
                        {user?.name ? `Welcome to LearnProof AI, ${user.name.split(' ')[0]}!` : "Welcome to LearnProof AI!"}
                    </span>

                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] font-black text-gray-900 dark:text-white leading-[1.12] tracking-tight">
                        What would you <br className="hidden sm:inline" />
                        like to <span className="text-[#FF5100]">learn today?</span>
                    </h1>

                    <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium leading-snug max-w-xs sm:max-w-sm mt-1">
                        Search any topic, subject or course and start your learning journey.
                    </p>
                </div>

                {/* Right Side: Perfectly Proportioned 3D Student Character */}
                <div className="shrink-0 flex items-center justify-end pointer-events-none select-none">
                    <img
                        src="/learning_student_mascot.png"
                        alt="LearnProof Student"
                        className="w-[125px] sm:w-[165px] md:w-[205px] lg:w-[235px] xl:w-[255px] h-auto object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-105"
                    />
                </div>
            </div>

            {/* Pill Search Input Bar: Sits cleanly across the card below the text and mascot */}
            <div ref={searchContainerRef} className="relative w-full z-40">
                <div className="bg-white dark:bg-gray-800 rounded-full shadow-md shadow-orange-500/5 dark:shadow-black/30 border border-orange-200/90 dark:border-gray-700 h-11 sm:h-13 px-3 sm:px-4.5 flex items-center gap-2.5 sm:gap-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-400">
                    {/* Search or YouTube Icon */}
                    <div className="shrink-0 flex items-center justify-center">
                        {isYouTubeUrl(query) ? (
                            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 fill-red-600" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.5 12 3.5 12 3.5s-7.522 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.478 20.5 12 20.5 12 20.5s7.522 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.971 24 12 24 12s0-3.971-.502-5.837z" />
                                <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="white" />
                            </svg>
                        ) : (
                            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-400 dark:text-gray-400" />
                        )}
                    </div>

                    {/* Perfectly Vertically Aligned Text Input */}
                    <input
                        ref={inputRef}
                        id="dashboard-hero-search-input"
                        type="text"
                        placeholder="Search for courses, topics, or skills..."
                        className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-xs sm:text-sm md:text-[15px] text-gray-800 dark:text-gray-100 placeholder-gray-400 font-medium leading-normal p-0 m-0 focus:outline-none focus:ring-0"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveSuggestionIndex(-1);
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0 && !isYouTubeUrl(query)) setShowSuggestions(true);
                        }}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Clear Button */}
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                            title="Clear"
                        >
                            <X size={15} />
                        </button>
                    )}

                    {/* Orange Circular Arrow Submit Button */}
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={loading}
                        className="bg-[#FF5100] hover:bg-orange-600 active:scale-95 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md shadow-orange-500/25 transition-all cursor-pointer shrink-0"
                        title={isYouTubeUrl(query) ? "Import YouTube course" : "Search courses"}
                    >
                        {loading ? (
                            <Loader2 size={15} className="animate-spin text-white" />
                        ) : (
                            <ArrowRight size={17} strokeWidth={2.6} className="text-white" />
                        )}
                    </button>
                </div>

                {/* Autocomplete Suggestions Dropdown - fully unclipped with high z-index and elevation */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.99 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-left backdrop-blur-xl max-h-[320px] overflow-y-auto"
                        >
                            <ul className="py-2 divide-y divide-gray-50 dark:divide-gray-700/40">
                                {suggestions.map((item, idx) => {
                                    const lowerItem = item.toLowerCase();
                                    const lowerQuery = query.toLowerCase().trim();
                                    const isMatchStart = lowerItem.startsWith(lowerQuery);
                                    return (
                                        <li
                                            key={idx}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                skipNextAutocompleteRef.current = true;
                                                setQuery(item);
                                                setShowSuggestions(false);
                                                handleSubmit(item);
                                            }}
                                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                            className={`px-4 py-2.5 sm:py-3 cursor-pointer text-xs sm:text-sm flex items-center justify-between transition-colors ${
                                                idx === activeSuggestionIndex
                                                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <Search size={15} className={`${idx === activeSuggestionIndex ? 'text-[#FF5100]' : 'text-gray-400'} shrink-0`} />
                                                <span className="truncate">
                                                    {isMatchStart ? (
                                                        <>
                                                            <span className="font-semibold text-gray-900 dark:text-white">{item.slice(0, lowerQuery.length)}</span>
                                                            <span className="font-normal text-gray-600 dark:text-gray-300">{item.slice(lowerQuery.length)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="font-medium">{item}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider shrink-0 ml-2">Search</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* YouTube Import Confirmation Modal */}
            <AnimatePresence>
                {importData && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 text-gray-900 dark:text-gray-100 border border-orange-100 dark:border-gray-700"
                        >
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">
                                Course Import Details
                            </h2>

                            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <p>
                                    <strong className="text-orange-600 font-bold">Title:</strong> {importData.title}
                                </p>
                                <p className="line-clamp-4 overflow-hidden">
                                    <strong className="text-orange-600 font-bold">Description:</strong>{" "}
                                    {importData.description || "No description provided"}
                                </p>
                                <p>
                                    <strong className="text-orange-600 font-bold">Video Count:</strong>{" "}
                                    {importData.videos?.length || importData.video_count || 1} videos
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setImportData(null)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveImported}
                                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-xs hover:opacity-95 shadow-md shadow-orange-500/25 transition-opacity"
                                >
                                    Save to Library
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardHeroBanner;
