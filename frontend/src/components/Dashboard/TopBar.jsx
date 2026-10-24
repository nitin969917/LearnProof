import React, { useState, useEffect, useRef } from 'react';
import { Youtube, Search, Menu, Bell, GraduationCap, Compass, BrainCircuit, FileText, Radio, Plus, Home, Users, Users2, MessageCircle, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSocialMessageStore } from '../../store/socialMessageStore';
import { useSocialFeedStore } from '../../store/socialFeedStore';
import UserAvatar from '../Common/UserAvatar.jsx';

const topBarAutocompleteCache = new Map();

const TopBar = ({ onMenuClick, onProfileClick }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [importData, setImportData] = useState(null);
    const [isMobileImportOpen, setIsMobileImportOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const skipNextAutocompleteRef = useRef(false);
    const desktopSearchRef = useRef(null);
    const mobileSearchRef = useRef(null);
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);
    const pendingFriendCount = useSocialFeedStore((state) => state.pendingFriendCount);
    const activeRoomsCount = useSocialFeedStore((state) => state.activeRoomsCount);
    const totalSocialCount = totalUnreadCount + pendingFriendCount;
    const socialUser = useSocialFeedStore((state) => state.socialUser);

    const isLearningHub = (
        location.pathname.startsWith('/dashboard/library') ||
        location.pathname.startsWith('/dashboard/explore') ||
        location.pathname.startsWith('/dashboard/search') ||
        location.pathname.startsWith('/dashboard/youtube') ||
        location.pathname.startsWith('/dashboard/quiz') ||
        location.pathname.startsWith('/dashboard/ask-my-notes') ||
        location.pathname.startsWith('/dashboard/playlist') ||
        location.pathname.startsWith('/dashboard/roadmap') ||
        location.pathname.startsWith('/dashboard/certificates')
    );

    const isSocialHub = location.pathname.startsWith('/dashboard/social');
    const isLiveRoomsPage = location.pathname.startsWith('/dashboard/live-rooms');
    const isInboxPage = location.pathname.startsWith('/dashboard/inbox');
    const isGoalsPage = location.pathname.startsWith('/dashboard/goals');
    const isSearchPage = (
        location.pathname.startsWith('/dashboard/search') ||
        location.pathname.startsWith('/dashboard/youtube') ||
        location.pathname.startsWith('/dashboard/explore')
    );

    const learnSubTabs = [
        { name: 'Discover', icon: Compass, path: '/dashboard/explore' },
        { name: 'My Learning', icon: GraduationCap, path: '/dashboard/library' },
        { name: 'Quiz', icon: BrainCircuit, path: '/dashboard/quiz' },
        { name: 'Ask My Notes', icon: FileText, path: '/dashboard/ask-my-notes' },
    ];

    const checkLearnSubActive = (path) => {
        if (path === '/dashboard/explore') {
            return (
                location.pathname.startsWith('/dashboard/explore') ||
                location.pathname.startsWith('/dashboard/search') ||
                location.pathname.startsWith('/dashboard/youtube')
            );
        }
        if (path === '/dashboard/library') {
            return (
                location.pathname.startsWith('/dashboard/library') ||
                location.pathname.startsWith('/dashboard/playlist') ||
                location.pathname.startsWith('/dashboard/roadmap') ||
                location.pathname.startsWith('/dashboard/certificates')
            );
        }
        return location.pathname.startsWith(path);
    };

    const socialSubTabs = [
        { name: 'Feed', icon: Home, path: '/dashboard/social/feed' },
        { name: 'Discover', icon: Compass, path: '/dashboard/social/discover' },
        { name: 'Friends', icon: Users2, path: '/dashboard/social/friends', badge: pendingFriendCount > 0 ? pendingFriendCount : null },
        { name: 'Chats', icon: MessageCircle, path: '/dashboard/social/chats', badge: totalUnreadCount > 0 ? totalUnreadCount : null },
    ];

    const checkSocialSubActive = (path) => {
        const p = location.pathname;
        const s = location.search;
        if (path === '/dashboard/social/feed' || path === '/dashboard/social') {
            return (
                p === '/dashboard/social' ||
                p === '/dashboard/social/' ||
                p === '/dashboard/social/feed' ||
                (p.startsWith('/dashboard/social') && !p.includes('/discover') && !p.includes('/friends') && !p.includes('/chats') && !p.includes('/profile') && !s.includes('tab=')) ||
                s.includes('tab=feed')
            );
        }
        if (path === '/dashboard/social/discover') {
            return p.includes('/social/discover') || s.includes('tab=discover');
        }
        if (path === '/dashboard/social/friends') {
            return p.includes('/social/friends') || s.includes('tab=friends');
        }
        if (path === '/dashboard/social/chats') {
            return p.includes('/social/chats') || s.includes('tab=chats') || s.includes('tab=chat');
        }
        return p.startsWith(path);
    };

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

    // Debounced Autocomplete for TopBar
    useEffect(() => {
        const trimmed = url.trim().toLowerCase();
        if (!trimmed || isYouTubeUrl(url)) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (skipNextAutocompleteRef.current) {
            skipNextAutocompleteRef.current = false;
            return;
        }

        if (topBarAutocompleteCache.has(trimmed)) {
            setSuggestions(topBarAutocompleteCache.get(trimmed));
            setShowSuggestions(true);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/youtube-autocomplete/`, {
                    idToken: token,
                    query: url
                });
                if (res.data?.suggestions && res.data.suggestions.length > 0) {
                    topBarAutocompleteCache.set(trimmed, res.data.suggestions);
                    setSuggestions(res.data.suggestions);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("TopBar autocomplete error:", err);
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [url, token]);

    // Automatically close mobile search overlay and suggestions when switching to another tab or route
    useEffect(() => {
        setIsMobileImportOpen(false);
        setShowSuggestions(false);
    }, [location.pathname, location.search]);

    // Close suggestions and mobile search overlay on outside click or touch
    useEffect(() => {
        const handleClickOutside = (e) => {
            const inDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(e.target);
            const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
            if (!inDesktop && !inMobile) {
                setShowSuggestions(false);
            }
            if (isMobileImportOpen && !inMobile) {
                setIsMobileImportOpen(false);
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isMobileImportOpen]);

    const handleSmartSubmit = async (customVal) => {
        const targetVal = (customVal !== undefined ? customVal : url).trim();
        if (!targetVal) {
            toast.error("Please enter a topic or paste a YouTube link");
            return;
        }

        skipNextAutocompleteRef.current = true;
        setShowSuggestions(false);
        setSuggestions([]);
        if (isYouTubeUrl(targetVal)) {
            await handleImport(targetVal);
        } else {
            setIsMobileImportOpen(false);
            setUrl('');
            const targetBase = location.pathname.startsWith('/dashboard/search') ? '/dashboard/search' : '/dashboard/explore';
            navigate(`${targetBase}?q=${encodeURIComponent(targetVal)}`);
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter') handleSmartSubmit();
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
                setUrl(selected);
                setShowSuggestions(false);
                handleSmartSubmit(selected);
            } else {
                handleSmartSubmit();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setIsMobileImportOpen(false);
        }
    };

    const handleImport = async (targetUrl = url) => {
        const finalUrl = (targetUrl || url).trim();
        if (!finalUrl) {
            toast.error("Please enter a Youtube URL");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Fetching playlist details...");
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/import/`, {
                idToken: token,
                url: finalUrl
            });

            if (response.data.success) {
                setImportData(response.data.data);
                setIsMobileImportOpen(false);
                toast.dismiss(toastId);
            } else {
                toast.error("Something went wrong!", { id: toastId });
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Failed to import. Check URL or token.";
            toast.error(errMsg, { id: toastId });
        } finally {
            setLoading(false);
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
            setUrl('');

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
        setUrl('');
        setIsMobileImportOpen(false);
    };

    return (
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700 shadow-sm transition-colors duration-200 w-full shrink-0 relative pt-[var(--sat,0px)]">
            {/* Top Bar Header */}
            <div className="flex items-stretch justify-between h-16 sm:h-20 w-full px-2 sm:px-4">
                {/* Left Side: Logo & Section Title */}
                <div className="flex items-stretch min-w-0">
                    <div
                        onClick={() => navigate('/dashboard')}
                        className="h-full cursor-pointer hover:opacity-90 transition-opacity shrink-0 flex items-stretch ml-1 sm:ml-0"
                    >
                        {/* Mobile Logo */}
                        <img
                            src="/LP_M_logo.png"
                            alt="LearnProof"
                            className="h-full w-auto object-cover object-left block sm:hidden"
                        />
                        {/* Desktop Logo */}
                        <img
                            src="/LP_logo.png"
                            alt="LearnProof"
                            className="h-full w-auto object-cover object-left hidden sm:block"
                        />
                    </div>

                    {/* Section Title when in Learning Hub (Mobile only) */}
                    {isLearningHub && (
                        <div className="flex lg:hidden items-center gap-3 px-2 sm:px-4 min-w-0">
                            <div className="border-l border-gray-200 dark:border-gray-700 h-8"></div>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Learn</h1>
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">Your learning space</p>
                            </div>
                        </div>
                    )}

                    {/* Section Title when in Social Hub (Mobile only) */}
                    {isSocialHub && (
                        <div className="flex lg:hidden items-center gap-3 px-2 sm:px-4 min-w-0">
                            <div className="border-l border-gray-200 dark:border-gray-700 h-8"></div>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Social Hub</h1>
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">Connect &amp; Share</p>
                            </div>
                        </div>
                    )}

                    {/* Section Title when on Live Rooms page (Mobile only) */}
                    {isLiveRoomsPage && (
                        <div className="flex lg:hidden items-center gap-3 px-2 sm:px-4 min-w-0">
                            <div className="border-l border-gray-200 dark:border-gray-700 h-8"></div>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Live Rooms</h1>
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">Audio &amp; Video Practice</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Actions (Import & Inbox Group & Menu) */}
                <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 pl-2 sm:pl-0 min-w-0">
                    {/* Desktop Smart Search / Import Bar (sm and up) */}
                    <div ref={desktopSearchRef} className="hidden md:flex relative items-center flex-1 max-w-[340px] bg-white dark:bg-gray-700 border border-orange-100 dark:border-gray-600 rounded-full pl-3 pr-1 py-1 gap-2 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-orange-500/25">
                        {isYouTubeUrl(url) ? (
                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-red-600 fill-red-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.5 12 3.5 12 3.5s-7.522 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.478 20.5 12 20.5 12 20.5s7.522 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.971 24 12 24 12s0-3.971-.502-5.837z" />
                                <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="white" />
                            </svg>
                        ) : (
                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <input
                            type="text"
                            placeholder="Search or paste YouTube link..."
                            className="w-full bg-transparent outline-none text-xs sm:text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 font-medium"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setActiveSuggestionIndex(-1);
                            }}
                            onFocus={() => {
                                if (suggestions.length > 0 && !isYouTubeUrl(url)) setShowSuggestions(true);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={() => handleSmartSubmit()}
                            disabled={loading}
                            className={`text-white px-3.5 py-1.5 rounded-full text-xs font-black uppercase transition-all shrink-0 cursor-pointer ${
                                isYouTubeUrl(url) 
                                    ? 'bg-[#FF5100] hover:bg-orange-600' 
                                    : 'bg-gray-900 dark:bg-orange-600 hover:bg-gray-800'
                            }`}
                        >
                            {loading ? "..." : (isYouTubeUrl(url) ? "Import" : "Search")}
                        </button>

                        {/* Desktop Autocomplete Suggestions Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50 text-left backdrop-blur-xl"
                                >
                                    <ul className="py-1.5 divide-y divide-gray-50 dark:divide-gray-700/40">
                                        {suggestions.map((item, idx) => {
                                            const lowerItem = item.toLowerCase();
                                            const lowerQuery = url.toLowerCase().trim();
                                            const isMatchStart = lowerItem.startsWith(lowerQuery);
                                            return (
                                                <li
                                                    key={idx}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        skipNextAutocompleteRef.current = true;
                                                        setUrl(item);
                                                        setShowSuggestions(false);
                                                        handleSmartSubmit(item);
                                                    }}
                                                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                    className={`px-3.5 py-2.5 cursor-pointer text-xs sm:text-sm flex items-center justify-between transition-colors ${
                                                        idx === activeSuggestionIndex
                                                            ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold'
                                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <Search size={14} className={`${idx === activeSuggestionIndex ? 'text-[#FF5100]' : 'text-gray-400'} shrink-0`} />
                                                        <span className="truncate">
                                                            {isMatchStart ? (
                                                                <>
                                                                    <span className="font-normal">{item.slice(0, lowerQuery.length)}</span>
                                                                    <span className="font-bold">{item.slice(lowerQuery.length)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="font-medium">{item}</span>
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

                    {/* Mobile Search/Import Trigger Pill (on Home only) */}
                    {!isLearningHub && !isSocialHub && !isLiveRoomsPage && !isSearchPage && (
                        <button
                            onClick={() => setIsMobileImportOpen(true)}
                            className="flex md:hidden items-center gap-1.5 bg-orange-50/80 dark:bg-gray-700/80 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-orange-200/80 dark:border-gray-600 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 shadow-sm active:scale-95 transition-all cursor-pointer"
                            title="Search or Import"
                        >
                            <Search className="w-3.5 h-3.5 text-[#FF5100] shrink-0" />
                            <span className="text-[11px] font-extrabold text-[#FF5100]">Search / Import</span>
                        </button>
                    )}


                    {/* Bell Notification Action */}
                    <button
                        onClick={() => navigate('/dashboard/inbox')}
                        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700/50 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Inbox"
                    >
                        <Bell size={20} />
                        {totalSocialCount > 0 ? (
                            <span className="absolute top-1 right-1 bg-[#FF5100] rounded-full w-4 h-4 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                                {totalSocialCount > 9 ? '9+' : totalSocialCount}
                            </span>
                        ) : activeRoomsCount > 0 ? (
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                            </span>
                        ) : null}
                    </button>

                    {/* Menu Toggle Action - for mobile/tablet where sidebar is hidden */}
                    <button
                        onClick={onMenuClick}
                        className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition-all shrink-0 active:scale-95 flex items-center justify-center cursor-pointer lg:hidden"
                        title="Menu"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            {/* Mobile Expandable Search/Import Bar (Overlay) with Backdrop */}
            <AnimatePresence>
                {isMobileImportOpen && (
                    <>
                        {/* Outside tap overlay / backdrop to dismiss search on tap outside */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => {
                                setIsMobileImportOpen(false);
                                setShowSuggestions(false);
                            }}
                            onTouchStart={() => {
                                setIsMobileImportOpen(false);
                                setShowSuggestions(false);
                            }}
                            className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30 backdrop-blur-2xs md:hidden"
                        />
                        <motion.div
                            ref={mobileSearchRef}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 z-50 bg-white dark:bg-gray-800 flex items-center px-2.5 sm:px-4 gap-2 shadow-md pt-[var(--sat,0px)]"
                        >
                            <div className="flex flex-1 items-center bg-gray-50 dark:bg-gray-700/90 border border-orange-200 dark:border-gray-600 rounded-full pl-3 pr-1 py-1 gap-2 min-w-0 shadow-inner">
                                {isYouTubeUrl(url) ? (
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-600 fill-red-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.5 12 3.5 12 3.5s-7.522 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.478 20.5 12 20.5 12 20.5s7.522 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.971 24 12 24 12s0-3.971-.502-5.837z" />
                                        <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="white" />
                                    </svg>
                                ) : (
                                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search topics or paste YouTube link..."
                                    className="w-full min-w-0 bg-transparent outline-none text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 font-semibold"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setActiveSuggestionIndex(-1);
                                    }}
                                    onFocus={() => {
                                        if (suggestions.length > 0 && !isYouTubeUrl(url)) setShowSuggestions(true);
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    onClick={() => handleSmartSubmit()}
                                    disabled={loading}
                                    className={`text-white rounded-full px-3 py-1 font-bold text-[10px] uppercase shrink-0 active:scale-95 transition-transform cursor-pointer ${
                                        isYouTubeUrl(url) ? 'bg-[#FF5100]' : 'bg-gray-900 dark:bg-orange-600'
                                    }`}
                                >
                                    {loading ? "..." : (isYouTubeUrl(url) ? "Import" : "Search")}
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setIsMobileImportOpen(false);
                                    setShowSuggestions(false);
                                }}
                                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full shrink-0 active:scale-90 transition-transform cursor-pointer"
                                title="Close"
                            >
                                <X size={18} />
                            </button>

                            {/* Mobile Autocomplete Suggestions Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-2.5 right-2.5 top-full mt-1.5 bg-white dark:bg-gray-800 border border-orange-200/80 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-[55vh] overflow-y-auto"
                                    >
                                        <ul className="py-1 divide-y divide-gray-100 dark:divide-gray-700/40">
                                            {suggestions.map((item, idx) => (
                                                <li
                                                    key={idx}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        skipNextAutocompleteRef.current = true;
                                                        setUrl(item);
                                                        setShowSuggestions(false);
                                                        handleSmartSubmit(item);
                                                    }}
                                                    className="px-4 py-3 cursor-pointer text-xs text-gray-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700/50 flex items-center justify-between active:bg-orange-100"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <Search size={14} className="text-[#FF5100] shrink-0" />
                                                        <span className="truncate font-semibold text-gray-900 dark:text-white">{item}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider shrink-0">Search</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Learning Hub Subsections Bar (Mobile Only: lg:hidden) - Perfectly equal gaps, fixed non-scrollable */}
            {isLearningHub && (
                <div className="border-t border-orange-100/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md w-full flex items-center justify-between px-3 sm:px-6 h-11 sm:h-12 shrink-0 lg:hidden overflow-hidden select-none">
                    {learnSubTabs.map((tab) => {
                        const isActive = checkLearnSubActive(tab.path);
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => navigate(tab.path)}
                                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-manipulation outline-none active:scale-95 ${
                                    isActive
                                        ? 'text-orange-600 dark:text-orange-400 font-extrabold'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
                                <span>{tab.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="learningActiveSubTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Social Hub Subsections Bar (Mobile Only: lg:hidden) - Perfectly equal gaps, fixed non-scrollable */}
            {isSocialHub && !location.pathname.includes('/profile') && !location.search.includes('tab=profile') && (
                <div className="border-t border-orange-100/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md w-full flex items-center justify-between px-3 sm:px-6 h-11 sm:h-12 shrink-0 lg:hidden overflow-hidden select-none">
                    {socialSubTabs.map((tab) => {
                        const isActive = checkSocialSubActive(tab.path);
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => navigate(tab.path)}
                                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-manipulation outline-none active:scale-95 ${
                                    isActive
                                        ? 'text-orange-600 dark:text-orange-400 font-extrabold'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
                                <span>{tab.name}</span>
                                {tab.badge && (
                                    <span className="text-[9px] font-black rounded-full min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-orange-500 text-white shadow-sm shrink-0">
                                        {tab.badge > 99 ? '99+' : tab.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="socialActiveSubTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {importData && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 text-gray-900 dark:text-gray-100"
                        >
                            <h2 className="text-lg font-semibold">
                                Details
                            </h2>

                            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <p>
                                    <strong className="text-orange-600">Title:</strong> {importData.title}
                                </p>
                                <p className="line-clamp-4 overflow-hidden">
                                    <strong className="text-orange-600">Description:</strong>{" "}
                                    {importData.description || "No description"}
                                </p>
                                <p>
                                    <strong className="text-orange-600">URL:</strong>{" "}
                                    <a
                                        href={importData.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-400 hover:underline break-all"
                                    >
                                        Open Video
                                    </a>
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TopBar;
