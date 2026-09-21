import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, GraduationCap, Users2, Radio, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSocialMessageStore } from '../../store/socialMessageStore';
import { useSocialFeedStore } from '../../store/socialFeedStore';
import UserAvatar from '../Common/UserAvatar.jsx';

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);
    const pendingFriendCount = useSocialFeedStore((state) => state.pendingFriendCount);
    const totalSocialCount = totalUnreadCount + pendingFriendCount;
    const socialUser = useSocialFeedStore((state) => state.socialUser);

    // Hide BottomNav inside the Ask My Notes chat canvas or active Social Chat conversation (WhatsApp style full-screen)
    const isAskMyNotesSubject = location.pathname.match(/\/dashboard\/ask-my-notes(?:-dev)?\/[^/]+/);
    const isSocialChatConversation = location.pathname.match(/\/dashboard\/social\/chats\/(?:direct|group)\/[^/]+/) || location.search.includes('chatId=');
    if (isAskMyNotesSubject || isSocialChatConversation) {
        return null;
    }

    // 5 Constant Sections: Home, Learn, Social, Rooms, Profile
    const navItems = [
        { name: 'Home', icon: Home, path: '/dashboard' },
        { name: 'Learn', icon: GraduationCap, path: '/dashboard/library' },
        { name: 'Social', icon: Users2, path: '/dashboard/social/feed', badge: totalSocialCount > 0 ? totalSocialCount : null },
        { name: 'Rooms', icon: Radio, path: '/dashboard/live-rooms' },
        { name: 'Profile', icon: User, path: '/dashboard/social/profile' },
    ];

    const checkActive = (path) => {
        const currentPath = location.pathname;
        const currentSearch = location.search;

        if (path === '/dashboard') {
            return currentPath === '/dashboard';
        }
        if (path === '/dashboard/library') {
            return (
                currentPath.startsWith('/dashboard/library') ||
                currentPath.startsWith('/dashboard/explore') ||
                currentPath.startsWith('/dashboard/quiz') ||
                currentPath.startsWith('/dashboard/ask-my-notes') ||
                currentPath.startsWith('/dashboard/playlist') ||
                currentPath.startsWith('/dashboard/roadmap') ||
                currentPath.startsWith('/dashboard/certificates')
            );
        }
        if (path === '/dashboard/social/profile' || path === '/dashboard/social?tab=profile') {
            return currentSearch.includes('tab=profile') || currentPath.includes('/social/profile');
        }
        if (path === '/dashboard/social/feed' || path === '/dashboard/social') {
            return (
                currentPath.startsWith('/dashboard/social') &&
                !currentSearch.includes('tab=profile') &&
                !currentPath.includes('/social/profile')
            );
        }
        if (path === '/dashboard/live-rooms') {
            return currentPath.startsWith('/dashboard/live-rooms');
        }
        return currentPath.startsWith(path);
    };

    const handleItemClick = (e, item) => {
        if (item.name === 'Profile') {
            e.preventDefault();
            localStorage.removeItem('social_selected_profile_id');
            navigate('/dashboard/social/profile');
        } else if (item.name === 'Social') {
            e.preventDefault();
            navigate('/dashboard/social/feed');
        }
    };

    return (
        <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[390px] xs:w-[440px] sm:w-[520px] md:w-[600px] max-w-[95vw] z-50 lg:hidden bg-white/75 dark:bg-gray-950/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] transition-all duration-300">
            <div className="flex items-stretch justify-around h-16 px-2.5 relative">
                {navItems.map((item) => {
                    const isActive = checkActive(item.path);
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={(e) => handleItemClick(e, item)}
                            className="relative flex flex-col items-center justify-center flex-1 h-full py-1.5 no-underline touch-manipulation select-none outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavPill"
                                    className="absolute inset-y-1.5 inset-x-1 bg-orange-500/10 dark:bg-orange-500/15 rounded-full z-0"
                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                />
                            )}
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex flex-col items-center justify-center w-full h-full relative z-10 cursor-pointer"
                            >
                                <div className={`transition-all duration-200 flex flex-col items-center justify-center ${isActive ? 'scale-105 text-orange-600 dark:text-orange-400 font-extrabold' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                    {item.name === 'Profile' ? (
                                        (socialUser?.profilePicture || socialUser?.avatar) ? (
                                            <div className={`w-[22px] h-[22px] rounded-full overflow-hidden border transition-all ${isActive ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-300 dark:border-gray-600'}`}>
                                                <UserAvatar 
                                                    src={socialUser?.profilePicture || socialUser?.avatar} 
                                                    name={socialUser?.name} 
                                                    className="w-full h-full rounded-full" 
                                                    loading="eager"
                                                />
                                            </div>
                                        ) : (
                                            <User 
                                                size={21} 
                                                strokeWidth={isActive ? 2.2 : 1.75} 
                                                className={isActive ? 'fill-orange-500/20' : ''}
                                            />
                                        )
                                    ) : (
                                        <item.icon 
                                            size={21} 
                                            strokeWidth={isActive ? 2.2 : 1.75} 
                                            className={isActive ? 'fill-orange-500/20' : ''}
                                        />
                                    )}
                                    <span className="text-[10px] font-bold mt-1 tracking-tight leading-none">{item.name}</span>
                                </div>
                                {item.badge && (
                                    <span className="absolute top-0 right-2 text-[9px] font-black rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center bg-orange-500 text-white shadow-sm ring-2 ring-white dark:ring-gray-950 z-20">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </motion.div>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
