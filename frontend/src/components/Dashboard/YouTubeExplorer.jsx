import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    Search, Youtube, Play, Plus, Loader, Sparkles, SlidersHorizontal, 
    X, ChevronLeft, ChevronRight, Layers, Video, ListVideo, 
    Calendar, Eye, Clock, Zap, RotateCcw, ArrowLeft, VolumeX, Volume2 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

const autocompleteCache = new Map();
const searchResultsCache = new Map();
const ITEMS_PER_PAGE = 10;

const isYouTubeUrl = (input) => {
    if (!input) return false;
    const trimmed = input.trim();
    return (
        trimmed.includes('youtube.com/watch') ||
        trimmed.includes('youtube.com/playlist') ||
        trimmed.includes('youtu.be/') ||
        trimmed.includes('youtube.com/shorts') ||
        trimmed.includes('youtube.com/embed')
    );
};

const YouTubeExplorer = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasSearched, setHasSearched] = useState(false);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const isInputFocusedRef = useRef(false);
    const inputRef = useRef(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: 'all',
        sortBy: 'relevance',
        duration: 'any'
    });
    const activeFilterCount = (filters.sortBy !== 'relevance' ? 1 : 0) + (filters.duration !== 'any' ? 1 : 0);
    const skipNextAutocompleteRef = useRef(false);

    const searchRef = useRef(null);
    const resultsRef = useRef(null);

    // Import modal state
    const [importLoading, setImportLoading] = useState(false);
    const [importData, setImportData] = useState(null);

    // YouTube-style inline hover & scroll preview state
    const [previewingItemId, setPreviewingItemId] = useState(null);
    const [isPreviewMuted, setIsPreviewMuted] = useState(true);
    const hoverTimerRef = useRef(null);
    const cardRefs = useRef({});
    const iframeRefs = useRef({});

    const handleCardMouseEnter = (itemId) => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
            setPreviewingItemId(itemId);
        }, 350);
    };

    const handleCardMouseLeave = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setPreviewingItemId(null);
    };

    const togglePreviewMute = (e, itemId) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setIsPreviewMuted((prev) => {
            const next = !prev;
            try {
                const iframe = iframeRefs.current[itemId];
                if (iframe && iframe.contentWindow) {
                    const cmd = next ? 'mute' : 'unMute';
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
                    if (!next) {
                        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
                    }
                }
            } catch (_) {}
            return next;
        });
    };

    const handleCardClick = (item) => {
        if (!item) return;
        if (item.type === 'video') {
            navigate(`/classroom/${item.id}`);
        } else {
            handleImportClick(item.url);
        }
    };

    // Recommendations state
    const [recommendSubject, setRecommendSubject] = useState('');
    const [recommendLanguage, setRecommendLanguage] = useState('');
    const [recommendLoading, setRecommendLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    // Ultra-Fast Debounced Autocomplete with In-Memory Cache (Only when input is actively focused)
    useEffect(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed || !isInputFocusedRef.current || isYouTubeUrl(trimmed) || trimmed.length < 2) {
            setShowSuggestions(false);
            if (!trimmed) setSuggestions([]);
            return;
        }

        if (skipNextAutocompleteRef.current) {
            skipNextAutocompleteRef.current = false;
            setShowSuggestions(false);
            return;
        }

        // 1. Instant Cache Hit for 0ms response
        if (autocompleteCache.has(trimmed)) {
            setSuggestions(autocompleteCache.get(trimmed));
            if (isInputFocusedRef.current) setShowSuggestions(true);
            return;
        }

        // 2. Snappy 120ms debounce for network request
        const delayDebounce = setTimeout(async () => {
            if (!isInputFocusedRef.current || skipNextAutocompleteRef.current) return;
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/youtube-autocomplete/`, {
                    idToken: token,
                    query: query
                });
                if (res.data?.suggestions && isInputFocusedRef.current && !skipNextAutocompleteRef.current) {
                    autocompleteCache.set(trimmed, res.data.suggestions);
                    setSuggestions(res.data.suggestions);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Autocomplete error:", err);
            }
        }, 120);

        return () => clearTimeout(delayDebounce);
    }, [query, token]);

    // Handle clicks/touches outside suggestion dropdown to close it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setIsInputFocused(false);
                isInputFocusedRef.current = false;
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Close autocomplete suggestions when switching to another tab/route
    useEffect(() => {
        setShowSuggestions(false);
        setIsInputFocused(false);
        isInputFocusedRef.current = false;
    }, [location.pathname]);

    // Canonicalize /dashboard/explore to /dashboard/search preserving query string
    useEffect(() => {
        if (location.pathname === '/dashboard/explore' || location.pathname === '/dashboard/youtube') {
            navigate(`/dashboard/search${location.search}`, { replace: true });
        }
    }, [location.pathname, location.search]);

    // Sync with query param if redirected from main page or search bar
    useEffect(() => {
        const qParam = searchParams.get('q');
        if (qParam && qParam.trim()) {
            skipNextAutocompleteRef.current = true;
            setShowSuggestions(false);
            setSuggestions([]);
            setIsInputFocused(false);
            isInputFocusedRef.current = false;
            inputRef.current?.blur();
            setQuery(qParam.trim());
            setHasSearched(true);
            handleSearchWithQuery(qParam.trim());
        } else {
            // No search query provided -> return to dashboard where main search bar is
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams]);

    const handleSearchWithQuery = async (searchQuery, overrideFilters = null) => {
        if (!searchQuery.trim()) return;
        setHasSearched(true);
        const activeFilterSet = overrideFilters || filters;
        const cacheKey = `${searchQuery.trim().toLowerCase()}_${activeFilterSet.type}_${activeFilterSet.sortBy}_${activeFilterSet.duration}`;
        
        skipNextAutocompleteRef.current = true;
        setShowSuggestions(false);
        setSuggestions([]);
        setCurrentPage(1);

        // Instant 0ms cache hit
        if (searchResultsCache.has(cacheKey)) {
            const cached = searchResultsCache.get(cacheKey) || [];
            const safe = cached.filter(item => item.type === 'playlist' || item.type === 'video');
            setResults(safe);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/youtube-search/`, {
                idToken: token,
                query: searchQuery,
                type: activeFilterSet.type,
                sortBy: activeFilterSet.sortBy,
                duration: activeFilterSet.duration,
                gl: 'IN'
            });
            if (res.data.notice) {
                toast(res.data.notice, { icon: '🎓', duration: 5500 });
                setResults([]);
            } else if (res.data.results) {
                // Strictly exclude channels - only courses/playlists and educational videos allowed
                const educationalResults = res.data.results.filter(
                    item => item.type === 'playlist' || item.type === 'video'
                );
                searchResultsCache.set(cacheKey, educationalResults);
                setResults(educationalResults);
                setCurrentPage(1);
            } else {
                toast.error("No results found.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to search YouTube.");
        } finally {
            setLoading(false);
        }
    };

    const selectSuggestion = (selectedText) => {
        if (!selectedText) return;
        skipNextAutocompleteRef.current = true;
        setShowSuggestions(false);
        setSuggestions([]);
        setIsInputFocused(false);
        isInputFocusedRef.current = false;
        inputRef.current?.blur();
        setQuery(selectedText);
        navigate(`/dashboard/search?q=${encodeURIComponent(selectedText)}`, { replace: true });
        handleSearchWithQuery(selectedText);
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;

        skipNextAutocompleteRef.current = true;
        setShowSuggestions(false);
        setSuggestions([]);
        setIsInputFocused(false);
        isInputFocusedRef.current = false;
        inputRef.current?.blur();

        if (isYouTubeUrl(trimmed)) {
            await handleImportClick(trimmed);
        } else {
            navigate(`/dashboard/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
            await handleSearchWithQuery(trimmed);
        }
    };

    const handleTopicClick = (tag) => {
        if (!tag) return;
        setQuery(tag);
        navigate(`/dashboard/search?q=${encodeURIComponent(tag)}`, { replace: true });
        handleSearchWithQuery(tag);
    };

    const handleResetSearch = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter') handleSearch(e);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => 
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => 
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                selectSuggestion(suggestions[activeSuggestionIndex]);
            } else {
                handleSearch(e);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setIsInputFocused(false);
            isInputFocusedRef.current = false;
        }
    };

    const safeResults = results.filter(item => item.type === 'playlist' || item.type === 'video');

    const handlePageChange = (newPage) => {
        const totalPages = Math.ceil(safeResults.length / ITEMS_PER_PAGE) || 1;
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const totalPages = Math.ceil(safeResults.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentResults = safeResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleGetRecommendations = async (e) => {
        if (e) e.preventDefault();
        if (!recommendSubject.trim() || !recommendLanguage.trim()) {
            toast.error("Please provide both subject and language.");
            return;
        }

        setRecommendLoading(true);
        const toastId = toast.loading("Fetching recommendations...");
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/recommend-playlists/`, {
                idToken: token,
                subject: recommendSubject,
                language: recommendLanguage
            });
            if (res.data.results) {
                setRecommendations(res.data.results);
                toast.dismiss(toastId);
            } else {
                toast.error("No playlists found.", { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch recommendations.", { id: toastId });
        } finally {
            setRecommendLoading(false);
        }
    };

    const handleImportClick = async (url) => {
        setImportLoading(true);
        const toastId = toast.loading("Fetching details...");
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/import/`, {
                idToken: token,
                url: url
            });

            if (response.data.success) {
                setImportData(response.data.data);
                toast.dismiss(toastId);
            } else {
                toast.error("Something went wrong!", { id: toastId });
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Failed to fetch details.";
            toast.error(errMsg, { id: toastId });
        } finally {
            setImportLoading(false);
        }
    };

    const handleSave = async () => {
        if (!importData) return;

        const count = importData.videos?.length || importData.video_count;
        const toastId = toast.loading(count ? `Saving ${count} videos to your library...` : "Saving to your library...");
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/save-learning/`, {
                idToken: token,
                data: importData,
            });

            toast.dismiss(toastId);
            toast.success("Saved to your library!");
            
            const targetId = importData.id;
            const targetType = importData.type;
            
            setImportData(null);

            if (targetType === 'playlist') {
                navigate(`/dashboard/playlist/${targetId}`);
            } else {
                navigate(`/classroom/${targetId}`);
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error("Failed to save learning.");
            console.error(err);
        }
    };

    const handleCancel = () => {
        setImportData(null);
    };

    // Mobile / Touch Scroll Auto-Preview (plays centered card while scrolling, like YouTube mobile)
    useEffect(() => {
        const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        if (!isTouchDevice) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let candidate = null;
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
                        if (!candidate || entry.intersectionRatio > candidate.intersectionRatio) {
                            candidate = entry;
                        }
                    }
                });

                if (candidate) {
                    const id = candidate.target.getAttribute('data-item-id');
                    if (id) {
                        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                        hoverTimerRef.current = setTimeout(() => {
                            setPreviewingItemId(id);
                        }, 500);
                    }
                } else {
                    setPreviewingItemId(null);
                }
            },
            {
                threshold: [0.3, 0.75, 0.95],
                rootMargin: '-15% 0px -15% 0px'
            }
        );

        const elements = Object.values(cardRefs.current);
        elements.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => {
            observer.disconnect();
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, [currentResults]);

    const qParam = searchParams.get('q');
    const isSearchingMode = Boolean(qParam || hasSearched || results.length > 0 || (loading && query.trim()));

    return (
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-10 space-y-4 pb-20">
            {/* Unified Top Search & Filter Header (Same on Discover & Search) */}
            <div className="space-y-2.5 pt-1">
                {/* Top Search Bar Row */}
                <div className="w-full flex items-center gap-2 sm:gap-3">
                    {/* Back Arrow button to return to Dashboard */}
                    <button
                        type="button"
                        onClick={handleResetSearch}
                        className="p-2 sm:p-2.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors shrink-0 active:scale-95 cursor-pointer"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Search Input Bar (Native YouTube style) */}
                    <div className="flex-1 relative" ref={searchRef}>
                        <form onSubmit={handleSearch} className="relative w-full">
                            <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-3.5 sm:pl-4 pr-1.5 py-1 sm:py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
                                <button
                                    type="submit"
                                    disabled={loading || importLoading}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-2 shrink-0 cursor-pointer focus:outline-none transition-colors"
                                    title={isYouTubeUrl(query) ? "Import URL" : "Search"}
                                >
                                    {isYouTubeUrl(query) ? (
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-600 fill-red-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.5 12 3.5 12 3.5s-7.522 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.478 20.5 12 20.5 12 20.5s7.522 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.971 24 12 24 12s0-3.971-.502-5.837z" />
                                            <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="white" />
                                        </svg>
                                    ) : (
                                        <Search size={18} />
                                    )}
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    placeholder="Search courses, tutorials, playlists or paste YouTube link..."
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setActiveSuggestionIndex(-1);
                                        isInputFocusedRef.current = true;
                                        setIsInputFocused(true);
                                    }}
                                    onFocus={() => {
                                        isInputFocusedRef.current = true;
                                        setIsInputFocused(true);
                                        if (suggestions.length > 0 && !isYouTubeUrl(query)) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            isInputFocusedRef.current = false;
                                            setIsInputFocused(false);
                                            setShowSuggestions(false);
                                        }, 150);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 min-w-0 bg-transparent border-none py-1.5 text-xs sm:text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 outline-none font-medium"
                                />

                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            setSuggestions([]);
                                            setShowSuggestions(false);
                                            inputRef.current?.focus();
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-1 cursor-pointer transition-colors"
                                        title="Clear search"
                                    >
                                        <X size={16} />
                                    </button>
                                )}

                                {(loading || importLoading) && (
                                    <div className="p-1 text-gray-400 mr-1 shrink-0 flex items-center">
                                        <Loader size={16} className="animate-spin text-red-500" />
                                    </div>
                                )}

                                {isYouTubeUrl(query) && !importLoading && (
                                    <button
                                        type="submit"
                                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 shadow-xs"
                                        title="Import YouTube URL"
                                    >
                                        <Plus size={14} />
                                        <span>Import</span>
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Autocomplete Suggestions dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-left backdrop-blur-xl"
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
                                                        e.stopPropagation();
                                                        selectSuggestion(item);
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        selectSuggestion(item);
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        selectSuggestion(item);
                                                    }}
                                                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                    className={`px-4 sm:px-6 py-3 cursor-pointer text-sm flex items-center justify-between transition-colors ${
                                                        idx === activeSuggestionIndex 
                                                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <Search size={16} className={`${idx === activeSuggestionIndex ? 'text-red-500' : 'text-gray-400'} shrink-0`} />
                                                        <span className="truncate">
                                                            {isMatchStart ? (
                                                                <>
                                                                    <span className="font-normal">{item.slice(0, lowerQuery.length)}</span>
                                                                    <span className="font-bold">{item.slice(lowerQuery.length)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="font-bold">{item}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 sm:px-3.5 sm:py-2 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 ${
                            showFilters || activeFilterCount > 0
                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title="Search Filters"
                    >
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        )}
                    </button>
                </div>

                {/* Clean YouTube-style Content Category Pills */}
                <div className="w-full flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'playlist', label: 'Playlists / Courses' },
                            { id: 'video', label: 'Videos' },
                        ].map(chip => {
                            const isSelected = filters.type === chip.id;
                            return (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={() => {
                                        const newFilters = { ...filters, type: chip.id };
                                        setFilters(newFilters);
                                        setCurrentPage(1);
                                        if (query.trim()) handleSearchWithQuery(query, newFilters);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                                        isSelected
                                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Expandable Filters Drawer */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -6, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-lg overflow-hidden text-left"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={15} className="text-red-500" />
                                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                        Search Filters
                                    </span>
                                    {activeFilterCount > 0 && (
                                        <span className="bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            {activeFilterCount} active
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const resetFilters = { type: 'all', sortBy: 'relevance', duration: 'any' };
                                                setFilters(resetFilters);
                                                setCurrentPage(1);
                                                if (query.trim()) handleSearchWithQuery(query, resetFilters);
                                            }}
                                            className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            <RotateCcw size={12} />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(false)}
                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                        title="Close filters"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-3.5">
                                {/* Content Type */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                        Content Type
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'all', label: 'All Types', icon: Layers },
                                            { id: 'video', label: 'Videos', icon: Video },
                                            { id: 'playlist', label: 'Playlists', icon: ListVideo }
                                        ].map(t => {
                                            const isSelected = filters.type === t.id;
                                            const Icon = t.icon;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newFilters = { ...filters, type: t.id };
                                                        setFilters(newFilters);
                                                        setCurrentPage(1);
                                                        if (query.trim()) handleSearchWithQuery(query, newFilters);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-red-600 text-white shadow-xs'
                                                            : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600/60'
                                                    }`}
                                                >
                                                    <Icon size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                                                    <span>{t.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sort Order */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                        Sort By
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'relevance', label: 'Relevance', icon: Sparkles },
                                            { id: 'date', label: 'Upload Date', icon: Calendar },
                                            { id: 'views', label: 'View Count', icon: Eye }
                                        ].map(s => {
                                            const isSelected = filters.sortBy === s.id;
                                            const Icon = s.icon;
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newFilters = { ...filters, sortBy: s.id };
                                                        setFilters(newFilters);
                                                        setCurrentPage(1);
                                                        if (query.trim()) handleSearchWithQuery(query, newFilters);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-red-600 text-white shadow-xs'
                                                            : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600/60'
                                                    }`}
                                                >
                                                    <Icon size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                                                    <span>{s.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                            Duration
                                        </label>
                                        {filters.type === 'playlist' && (
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">N/A for playlists</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'any', label: 'Any Duration', icon: Clock },
                                            { id: 'short', label: '< 4 mins', icon: Zap },
                                            { id: 'medium', label: '4 - 20 mins', icon: Clock },
                                            { id: 'long', label: '> 20 mins', icon: Clock }
                                        ].map(d => {
                                            const isSelected = filters.duration === d.id && filters.type !== 'playlist';
                                            const isDisabled = filters.type === 'playlist';
                                            const Icon = d.icon;
                                            return (
                                                <button
                                                    key={d.id}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => {
                                                        const newFilters = { ...filters, duration: d.id };
                                                        setFilters(newFilters);
                                                        setCurrentPage(1);
                                                        if (query.trim()) handleSearchWithQuery(query, newFilters);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        isDisabled
                                                            ? 'opacity-35 cursor-not-allowed bg-gray-50 dark:bg-gray-800 text-gray-400 border border-transparent'
                                                            : isSelected
                                                                ? 'bg-red-600 text-white shadow-xs'
                                                                : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600/60'
                                                    }`}
                                                >
                                                    <Icon size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                                                    <span>{d.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Result Count & Query Heading */}
                {!loading && isSearchingMode && results.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-b border-gray-100 dark:border-gray-800 pb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                Results for <span className="text-[#FF5100]">"{qParam || query}"</span>
                            </h2>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                ({results.length} found)
                            </span>
                        </div>
                        {totalPages > 1 && (
                            <span className="text-xs text-gray-400 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* 1. Empty State when searching has returned 0 results */}
            {isSearchingMode && results.length === 0 && !loading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 max-w-2xl mx-auto shadow-sm p-6 sm:p-8 space-y-4"
                >
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5100] flex items-center justify-center mx-auto shadow-sm">
                        <Search size={30} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                            No educational results found for "{qParam || query}"
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                            Try searching for broader educational topics or paste a direct YouTube video or playlist link above to import immediately.
                        </p>
                    </div>
                    <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">Popular topics to search</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['Python Course', 'Web Development', 'Machine Learning', 'Data Structures', 'Calculus', 'Organic Chemistry'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTopicClick(tag)}
                                    className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-700/60 hover:bg-orange-50 hover:text-[#FF5100] dark:hover:bg-gray-700 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition cursor-pointer active:scale-95"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 2. Fallback State: No search performed yet */}
            {!isSearchingMode && results.length === 0 && !loading && (
                <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 max-w-2xl mx-auto shadow-sm p-6 sm:p-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5100] flex items-center justify-center mx-auto shadow-sm">
                        <Search size={28} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                            Search Results
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                            Search for courses, playlists, or paste a YouTube video link above to view results.
                        </p>
                    </div>
                    <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">Popular topics to search</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['Python Course', 'Web Development', 'Machine Learning', 'Data Structures', 'Calculus', 'DSA'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTopicClick(tag)}
                                    className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-700/60 hover:bg-orange-50 hover:text-[#FF5100] dark:hover:bg-gray-700 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition cursor-pointer active:scale-95"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Loading State */}
            {loading && (
                <div className="space-y-4">
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {[...Array(8).keys()].map(i => (
                            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700/60 space-y-3">
                                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Searched State: Show Results (Old Card Grid) + Pagination + Quick Import at the End */}
            {results.length > 0 && !loading && (
                <div ref={resultsRef} className="space-y-4 sm:space-y-5 pb-4">
                    {/* Old Card Grid View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {currentResults.map((item, idx) => {
                            const isPreviewing = previewingItemId === item.id;
                            const embedPreviewUrl = item.type === 'video'
                                ? `https://www.youtube.com/embed/${item.id}?autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${item.id}&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&enablejsapi=1`
                                : `https://www.youtube.com/embed/videoseries?list=${item.id}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&enablejsapi=1`;

                            return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: Math.min(0.2, idx * 0.02) }}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                <div 
                                    ref={(el) => { if (el) cardRefs.current[item.id] = el; }}
                                    data-item-id={item.id}
                                    onMouseEnter={() => handleCardMouseEnter(item.id)}
                                    onMouseLeave={handleCardMouseLeave}
                                    onClick={() => handleCardClick(item)}
                                    className="relative aspect-video overflow-hidden border-b border-gray-100 dark:border-gray-700/50 cursor-pointer active:scale-[0.98] transition-transform duration-150 bg-black select-none" 
                                >
                                    {/* Inline Muted/Unmuted Video Preview on Hover/Scroll (YouTube Style) */}
                                    {isPreviewing && (
                                        <div className="absolute inset-0 z-10 overflow-hidden bg-black pointer-events-none animate-in fade-in duration-300">
                                            <iframe
                                                ref={(el) => { if (el) iframeRefs.current[item.id] = el; }}
                                                src={embedPreviewUrl}
                                                title="Video Preview"
                                                className="w-full h-full scale-[1.08] pointer-events-none"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        </div>
                                    )}

                                    {/* Interactive Unmute / Mute Button */}
                                    {isPreviewing && (
                                        <button
                                            type="button"
                                            onClick={(e) => togglePreviewMute(e, item.id)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className="absolute top-2 left-2 z-30 px-2.5 py-1 rounded-full bg-black/85 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1.5 shadow-lg border border-white/20 transition-all cursor-pointer active:scale-90"
                                            title={isPreviewMuted ? "Click to unmute sound" : "Click to mute sound"}
                                        >
                                            {isPreviewMuted ? (
                                                <>
                                                    <VolumeX size={12} className="text-white/80" />
                                                    <span>Unmute</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 size={12} className="text-emerald-400 animate-pulse" />
                                                    <span className="text-emerald-300">Sound ON</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    <img 
                                        src={item.thumbnail} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                                        loading="lazy" 
                                    />
                                    
                                    {!isPreviewing && (
                                        <div className="absolute inset-0 bg-black/40 xl:bg-gradient-to-t xl:from-black/60 xl:via-transparent xl:to-transparent opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
                                            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/50 transform scale-0 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                                                <Play size={20} className="fill-white ml-0.5" />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Type badge */}
                                    <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-md shadow-md z-20 pointer-events-none ${
                                        item.type === 'playlist' ? 'bg-red-500' : 'bg-blue-600'
                                    }`}>
                                        {item.type}
                                    </div>

                                    {/* Video count badge for playlist */}
                                    {item.type === 'playlist' && item.video_count > 0 && (
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold rounded leading-none z-20 pointer-events-none">
                                            {item.video_count} Videos
                                        </div>
                                    )}

                                    {/* Duration badge for video */}
                                    {item.type === 'video' && item.duration && (
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold rounded leading-none z-20 pointer-events-none">
                                            {item.duration}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 sm:p-3.5 space-y-2.5 flex flex-col flex-1 justify-between">
                                    <div className="space-y-0.5">
                                        <h3 
                                            onClick={() => handleCardClick(item)}
                                            className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors text-xs sm:text-sm cursor-pointer" 
                                            dangerouslySetInnerHTML={{ __html: item.title }}
                                        />
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block truncate">
                                            {item.channel}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleImportClick(item.url)}
                                        className="w-full py-1.5 sm:py-2 bg-red-50 hover:bg-red-600 dark:bg-red-950/20 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1 border border-red-100 dark:border-red-950/50 hover:border-transparent shadow-xs cursor-pointer active:scale-95 shrink-0"
                                    >
                                        <Plus size={13} strokeWidth={3} /> Add to Library
                                    </button>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>

                    {/* Numbered 10's Page Navigation */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium order-2 sm:order-1">
                                Showing <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, results.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{results.length}</span> results
                            </p>
                            <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                    <ChevronLeft size={16} />
                                    <span className="hidden sm:inline">Previous</span>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            currentPage === pageNum
                                                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md shadow-red-500/20 scale-105'
                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Import Confirmation Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {importData && (
                        <motion.div
                            key="import-confirm-modal"
                            className="fixed inset-0 bg-gray-900/60 flex justify-center items-center z-[99999] backdrop-blur-sm p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-2xl text-center"
                            >
                                {/* Close button at top-right */}
                                <button
                                    onClick={handleCancel}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>

                                {/* Centered Icon */}
                                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 bg-red-500/10">
                                    <Plus size={26} />
                                </div>

                                {/* Centered Title */}
                                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                                    Confirm Import
                                </h3>

                                {/* Centered Message */}
                                <p className="text-[10px] text-gray-450 dark:text-gray-400 font-bold uppercase tracking-wider mb-4 leading-relaxed">
                                    Review your selection before saving
                                </p>

                                {/* Details Block */}
                                <div className="text-left bg-gray-50/50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 mb-5 space-y-3">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block">Title</span>
                                        <p className="text-xs text-gray-900 dark:text-white font-bold leading-snug line-clamp-2" dangerouslySetInnerHTML={{ __html: importData.title }}></p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-150/50 dark:border-gray-800/50">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block">Type</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100/30 dark:border-red-900/20">
                                                {importData.type === 'playlist' ? 'Playlist' : 'Video'}
                                            </span>
                                        </div>
                                        {importData.type === 'playlist' && (
                                            <div className="text-right space-y-0.5">
                                                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block">Lessons</span>
                                                <p className="text-xs text-gray-900 dark:text-white font-black tracking-tight">{importData.videos?.length || 0} Items</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons in One Row */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white rounded-2xl font-extrabold text-xs transition-all shadow-md shadow-red-500/25 active:scale-95 cursor-pointer"
                                    >
                                        Add Course
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}


        </div>
    );
};

export default YouTubeExplorer;
