import React, { useState, useEffect, useRef } from 'react';
import { Search, Youtube, Play, Plus, Loader, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const YouTubeExplorer = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Autocomplete & Filter States
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: 'all',
        sortBy: 'relevance',
        duration: 'any'
    });
    const skipNextAutocompleteRef = useRef(false);

    const searchRef = useRef(null);

    // Import modal state
    const [importLoading, setImportLoading] = useState(false);
    const [importData, setImportData] = useState(null);
    const [activePreview, setActivePreview] = useState(null); // stores { id, type } of item to preview
    const [importUrl, setImportUrl] = useState('');

    // Recommendations state
    const [recommendSubject, setRecommendSubject] = useState('');
    const [recommendLanguage, setRecommendLanguage] = useState('');
    const [recommendLoading, setRecommendLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    // Debounced Autocomplete Suggestion Fetching
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (skipNextAutocompleteRef.current) {
            skipNextAutocompleteRef.current = false;
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/youtube-autocomplete/`, {
                    idToken: token,
                    query: query
                });
                if (res.data.suggestions) {
                    setSuggestions(res.data.suggestions);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Autocomplete error:", err);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query, token]);

    // Handle clicks outside suggestion dropdown to close it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchWithQuery = async (searchQuery) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setShowSuggestions(false);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/youtube-search/`, {
                idToken: token,
                query: searchQuery,
                type: filters.type,
                sortBy: filters.sortBy,
                duration: filters.duration
            });
            if (res.data.results) {
                setResults(res.data.results);
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

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        await handleSearchWithQuery(query);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

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
            if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                e.preventDefault();
                const selectedSuggestion = suggestions[activeSuggestionIndex];
                skipNextAutocompleteRef.current = true;
                setQuery(selectedSuggestion);
                setShowSuggestions(false);
                handleSearchWithQuery(selectedSuggestion);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

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
                toast.success("Found 6 playlists!", { id: toastId });
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
                toast.success("Ready to import", { id: toastId });
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

        const toastId = toast.loading("Saving...");
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/save-learning/`, {
                idToken: token,
                data: importData,
            });

            toast.dismiss(toastId);
            toast.success("Learning Saved Successfully!");
            
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
    }

    return (
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8 md:space-y-10 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col items-center text-center space-y-4 md:space-y-8 pt-3 pb-6 md:pt-10 md:pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 hidden lg:block"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
                        <div className="p-3 sm:p-4 bg-red-500 text-white rounded-2xl sm:rounded-[2rem] shadow-xl shadow-red-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Youtube size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Advanced Engine</span>
                            <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">
                                YouTube <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Explorer</span>
                            </h1>
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                        Search and import the world's best educational content directly into your personal repository. 
                        Let AI find the perfect playlist for your learning journey.
                    </p>
                </motion.div>

                <div className="flex flex-col items-center w-full max-w-2xl space-y-4" ref={searchRef}>
                    <form onSubmit={handleSearch} className="relative w-full group">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-[2rem] blur-2xl group-focus-within:blur-3xl transition-all duration-500 opacity-50"></div>
                        <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 shadow-2xl shadow-gray-200/50 dark:shadow-none transition-all duration-500 focus-within:ring-4 focus-within:ring-red-500/10 focus-within:border-red-500/30">
                            <div className="pl-3 sm:pl-4 text-gray-400 group-focus-within:text-red-500 transition-colors">
                                <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
                            </div>
                             <input
                                type="text"
                                placeholder="Search tutorials, courses..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActiveSuggestionIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                                className="flex-1 min-w-0 bg-transparent border-none py-3 sm:py-4 px-2 sm:px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 focus:ring-0 outline-none text-sm sm:text-base md:text-lg font-medium"
                            />
                            
                            {/* Filters button */}
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2.5 mr-1 sm:mr-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 shrink-0 ${
                                    showFilters ? 'text-red-500 bg-red-50/50 dark:bg-red-950/20' : 'text-gray-450 hover:text-gray-600 dark:hover:text-gray-200'
                                }`}
                                title="Toggle Filters"
                            >
                                <SlidersHorizontal size={18} />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Filters</span>
                            </button>
 
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gray-900 dark:bg-red-600 hover:bg-gray-800 dark:hover:bg-red-700 text-white p-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-bold text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 shrink-0"
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : (
                                    <>
                                        <span className="hidden sm:inline">Search</span>
                                        <span className="sm:hidden"><Search size={18} /></span>
                                    </>
                                )}
                            </button>

                            {/* Autocomplete Suggestions dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-40 text-left"
                                    >
                                        <ul className="py-2">
                                            {suggestions.map((item, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => {
                                                        skipNextAutocompleteRef.current = true;
                                                        setQuery(item);
                                                        setShowSuggestions(false);
                                                        handleSearchWithQuery(item);
                                                    }}
                                                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                    className={`px-6 py-3 cursor-pointer text-sm font-semibold flex items-center gap-3 transition-colors ${
                                                        idx === activeSuggestionIndex 
                                                            ? 'bg-red-50/50 dark:bg-red-950/20 text-red-500' 
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                                >
                                                    <Search size={16} className="text-gray-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>

                    {/* Filters drawer */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-105 dark:border-gray-700 rounded-[2rem] p-5 sm:p-6 shadow-xl overflow-hidden text-left"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {/* Filter 1: Type */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block font-bold">Type</label>
                                        <div className="flex flex-col gap-1.5">
                                            {['all', 'video', 'playlist'].map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setFilters(prev => ({ ...prev, type: t }))}
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all uppercase tracking-wider ${
                                                        filters.type === t 
                                                            ? 'bg-red-500 text-white shadow-md shadow-red-500/10' 
                                                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-slate-350 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {t === 'all' ? 'All' : t + 's'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Filter 2: Sort By */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block font-bold">Sort By</label>
                                        <div className="flex flex-col gap-1.5">
                                            {[
                                                { id: 'relevance', label: 'Relevance' },
                                                { id: 'date', label: 'Upload Date' },
                                                { id: 'views', label: 'View Count' }
                                            ].map((s) => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setFilters(prev => ({ ...prev, sortBy: s.id }))}
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all uppercase tracking-wider ${
                                                        filters.sortBy === s.id 
                                                            ? 'bg-red-500 text-white shadow-md shadow-red-500/10' 
                                                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-slate-350 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Filter 3: Duration */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block font-bold">
                                            Duration {filters.type === 'playlist' && <span className="text-gray-400 font-medium normal-case">(N/A for Playlists)</span>}
                                        </label>
                                        <div className="flex flex-col gap-1.5">
                                            {[
                                                { id: 'any', label: 'Any' },
                                                { id: 'short', label: 'Under 4 minutes' },
                                                { id: 'medium', label: '4 - 20 minutes' },
                                                { id: 'long', label: 'Over 20 minutes' }
                                            ].map((d) => (
                                                <button
                                                    key={d.id}
                                                    type="button"
                                                    disabled={filters.type === 'playlist'}
                                                    onClick={() => setFilters(prev => ({ ...prev, duration: d.id }))}
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all uppercase tracking-wider disabled:opacity-40 disabled:hover:bg-gray-50 ${
                                                        filters.duration === d.id && filters.type !== 'playlist'
                                                            ? 'bg-red-500 text-white shadow-md shadow-red-500/10' 
                                                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-slate-350 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Quick YouTube Import Section */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gradient-to-r from-[#fff7f4] via-[#fffaf8] to-[#fffbf9] dark:from-orange-950/5 dark:via-orange-950/10 dark:to-orange-950/5 border border-orange-100/80 dark:border-orange-900/20 p-5 sm:p-6 rounded-[2rem] shadow-sm relative overflow-hidden"
            >
                {/* Mesh dots overlay just like login card */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f97316 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                            <Sparkles size={20} className="animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                Import from YouTube
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium max-w-xl">
                                Paste any YouTube link to add content to your library in one click.
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:max-w-md bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-orange-100/60 dark:border-gray-700 shadow-sm flex flex-row items-center gap-2">
                        <input
                            type="text"
                            placeholder="Paste YouTube playlist or video link..."
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            className="flex-1 min-w-0 bg-transparent border-none py-1.5 px-2 text-xs text-gray-905 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-0 outline-none font-semibold"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (!importUrl.trim()) {
                                    toast.error("Please paste a valid YouTube link.");
                                    return;
                                }
                                handleImportClick(importUrl);
                            }}
                            disabled={importLoading}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg transition-all shadow-md shadow-orange-500/10 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                        >
                            {importLoading ? <Loader size={12} className="animate-spin" /> : (
                                <>
                                    <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.524 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                    <span>Import Now</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Search Results / Loading / Empty State */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pb-8">
                    {results.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="relative aspect-video overflow-hidden border-b border-gray-100 dark:border-gray-700/50 cursor-pointer" onClick={() => setActivePreview({ id: item.id, type: item.type })}>
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 xl:bg-gradient-to-t xl:from-black/60 xl:via-transparent xl:to-transparent opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/50 transform scale-0 group-hover:scale-100 transition-transform duration-500">
                                        <Play size={24} className="fill-white ml-1" />
                                    </div>
                                </div>
                                <div className={`absolute top-3 right-3 px-2.5 py-1 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-md z-10 ${
                                    item.type === 'playlist' ? 'bg-red-500' : 'bg-blue-500'
                                }`}>
                                    {item.type}
                                </div>
                            </div>
                            <div className="p-3.5 space-y-2.5 flex flex-col flex-1">
                                <div className="space-y-0.5 flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors text-sm" dangerouslySetInnerHTML={{ __html: item.title }}></h3>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-505 uppercase tracking-wider block">{item.channel}</span>
                                </div>
                                <button
                                    onClick={() => handleImportClick(item.url)}
                                    className="w-full py-1.5 sm:py-2 bg-orange-50/50 hover:bg-orange-500 dark:bg-orange-950/10 dark:hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white dark:hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1 border border-orange-100/60 dark:border-orange-950/50 hover:border-transparent shadow-sm cursor-pointer"
                                >
                                    <Plus size={13} strokeWidth={3} /> Add to Platform
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : null}


            {results.length === 0 && !loading && (
                <div className="text-center py-12 sm:py-20 bg-gray-50/50 dark:bg-gray-700/20 rounded-3xl sm:rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 max-w-4xl mx-auto w-full">
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                            <div className="relative w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-2xl border border-gray-100 dark:border-gray-700">
                                <Youtube size={48} className="text-red-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Ready to Discover?</h3>
                            <p className="max-w-md mx-auto text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                                Use the command center above to search for tutorials, courses, and playlists. 
                                Everything you find can be imported directly into your dashboard.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center pt-4">
                            {['ReactJS', 'Python', 'AI', 'UI/UX'].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => { setQuery(tag); handleSearch(); }}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Import Confirmation Modal */}
            <AnimatePresence>
                {importData && (
                    <motion.div
                        className="fixed inset-0 bg-gray-900/60 flex justify-center items-center z-50 backdrop-blur-sm p-4"
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
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
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
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white rounded-2xl font-extrabold text-xs transition-all shadow-md shadow-red-500/25 active:scale-95"
                                >
                                    Add Course
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Video Modal */}
            <AnimatePresence>
                {activePreview && (
                    <motion.div
                        className="fixed inset-0 bg-gray-900/95 flex justify-center items-center z-[100] backdrop-blur-xl p-4 md:p-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActivePreview(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl aspect-video relative group border border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setActivePreview(null)}
                                className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-full transition-all duration-300 border border-white/10 shadow-lg focus:outline-none"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <iframe
                                width="100%"
                                height="100%"
                                src={
                                    activePreview.type === "video"
                                        ? `https://www.youtube.com/embed/${activePreview.id}?autoplay=1&rel=0`
                                        : `https://www.youtube.com/embed/videoseries?list=${activePreview.id}&autoplay=1&rel=0`
                                }
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default YouTubeExplorer;
