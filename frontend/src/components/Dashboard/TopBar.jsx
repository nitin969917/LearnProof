import React from 'react';
import { Menu, Bell, GraduationCap, Compass, BrainCircuit, FileText, Home, Users2, MessageCircle, Library, Video, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocialMessageStore } from '../../store/socialMessageStore';
import { useSocialFeedStore } from '../../store/socialFeedStore';

const TopBar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);
    const pendingFriendCount = useSocialFeedStore((state) => state.pendingFriendCount);
    const activeRoomsCount = useSocialFeedStore((state) => state.activeRoomsCount);
    const totalSocialCount = totalUnreadCount + pendingFriendCount;

    const isLearningHub = (
        location.pathname.startsWith('/dashboard/library') ||
        location.pathname.startsWith('/dashboard/quiz') ||
        location.pathname.startsWith('/dashboard/playlist') ||
        location.pathname.startsWith('/dashboard/roadmap') ||
        location.pathname.startsWith('/dashboard/certificates')
    );

    const isSocialHub = location.pathname.startsWith('/dashboard/social');
    const isLiveRoomsPage = location.pathname.startsWith('/dashboard/live-rooms');

    const learnSubTabs = [
        { id: 'playlists', name: 'Playlists', icon: Library, path: '/dashboard/library?tab=playlists' },
        { id: 'videos', name: 'Videos', icon: Video, path: '/dashboard/library?tab=videos' },
        { id: 'roadmap', name: 'Roadmap', icon: Sparkles, path: '/dashboard/library?tab=roadmap' },
        { id: 'quiz', name: 'Quiz', icon: BrainCircuit, path: '/dashboard/quiz' },
    ];

    const checkLearnSubActive = (tab) => {
        const params = new URLSearchParams(location.search);
        const currentTab = params.get('tab') || 'playlists';

        if (tab.id === 'quiz') {
            return location.pathname.startsWith('/dashboard/quiz');
        }
        if (location.pathname.startsWith('/dashboard/library')) {
            return currentTab === tab.id;
        }
        if (location.pathname.startsWith('/dashboard/playlist')) {
            return tab.id === 'playlists';
        }
        if (location.pathname.startsWith('/dashboard/roadmap')) {
            return tab.id === 'roadmap';
        }
        return false;
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
                        {/* Mobile Logo (Shield) */}
                        <img
                            src="/LP_M_logo.png"
                            alt="LearnProof"
                            className="h-full w-auto object-contain block sm:hidden py-0.5"
                        />
                        {/* Desktop Logo */}
                        <img
                            src="/LP_logo.png"
                            alt="LearnProof"
                            className="h-full w-auto object-contain hidden sm:block py-1"
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

                {/* Right Side: Actions (Inbox Bell & Menu) - Clean without search bar */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
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

            {/* Learning Hub Subsections Bar (Mobile Only: lg:hidden) */}
            {isLearningHub && (
                <div className="border-t border-orange-100/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md w-full flex items-center justify-between px-3 sm:px-6 h-11 sm:h-12 shrink-0 lg:hidden overflow-hidden select-none">
                    {learnSubTabs.map((tab) => {
                        const isActive = checkLearnSubActive(tab);
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

            {/* Social Hub Subsections Bar (Mobile Only: lg:hidden) */}
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
        </div>
    );
};

export default TopBar;
