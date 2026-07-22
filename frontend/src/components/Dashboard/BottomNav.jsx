import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, Quote, Globe, Users, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const location = useLocation();

    // Hide BottomNav inside the Ask My Notes chat canvas (when a subject ID is present)
    const isAskMyNotesSubject = location.pathname.match(/\/dashboard\/ask-my-notes(?:-dev)?\/[^/]+/);
    if (isAskMyNotesSubject) {
        return null;
    }

    // Determine navigation context based on active route
    const isHome = location.pathname === '/dashboard';

    // Core tabs list: Appended Profile icon to ensure both modes contain 6 icons
    const navItems = isHome
        ? [
            { name: 'Home', icon: Home, path: '/dashboard' },
            { name: 'Learning', icon: BookOpen, path: '/dashboard/library' },
            { name: 'Social', icon: Users, path: '/dashboard/social' },
            { name: 'Rooms', icon: Globe, path: '/dashboard/live-rooms' },
            { name: 'Ask Notes', icon: MessageSquare, path: '/dashboard/ask-my-notes' },
            { name: 'Profile', icon: User, path: '/dashboard/social?tab=profile' },
          ]
        : [
            { name: 'Home', icon: Home, path: '/dashboard' },
            { name: 'Library', icon: BookOpen, path: '/dashboard/library' }, // Aligned with Learning
            { name: 'Explore', icon: Search, path: '/dashboard/explore' },   // Shifted to index 2
            { name: 'Quiz', icon: Quote, path: '/dashboard/quiz' },
            { name: 'Ask Notes', icon: MessageSquare, path: '/dashboard/ask-my-notes' },
            { name: 'Profile', icon: User, path: '/dashboard/social?tab=profile' },
          ];

    return (
        <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[390px] xs:w-[440px] sm:w-[520px] md:w-[600px] max-w-[95vw] z-50 lg:hidden bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
            <div className="flex items-stretch justify-around h-16 px-3.5 relative">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-555 no-underline touch-manipulation select-none outline-none border-none focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent active:outline-none"
                    >
                        {({ isActive }) => (
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex flex-col items-center justify-center w-full h-full relative outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none cursor-pointer"
                            >
                                <div className={`transition-all duration-300 z-10 flex flex-col items-center justify-center ${isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'}`}>
                                    <item.icon 
                                        size={22} 
                                        strokeWidth={isActive ? 2.5 : 2} 
                                        className={isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''}
                                    />
                                    <span className="text-[9.5px] font-bold mt-1 tracking-wide leading-none">{item.name}</span>
                                </div>
                            </motion.div>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
