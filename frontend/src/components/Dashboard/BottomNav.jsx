import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, BookOpen, Quote, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = ({ onMenuClick }) => {
    const navItems = [
        { name: 'Home', icon: Home, path: '/dashboard' },
        { name: 'Explore', icon: Search, path: '/dashboard/explore' },
        { name: 'Library', icon: BookOpen, path: '/dashboard/library' },
        { name: 'Quiz', icon: Quote, path: '/dashboard/quiz' },
    ];

    return (
        <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[300px] z-50 lg:hidden bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
            <div className="flex items-center justify-around h-14 px-2 relative">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end
                        className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-500 no-underline touch-manipulation select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                    >
                        {({ isActive }) => (
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex flex-col items-center justify-center w-full h-full relative"
                            >
                                <div className={`transition-all duration-300 z-10 ${isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'}`}>
                                    <item.icon 
                                        size={23} 
                                        strokeWidth={isActive ? 2.5 : 2} 
                                        className={isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''}
                                    />
                                </div>
                                
                                {/* Sleek sliding active background glass pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-x-1 inset-y-1.5 bg-orange-500/10 dark:bg-orange-500/20 rounded-full z-0 border border-orange-500/10 dark:border-orange-500/25"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </NavLink>
                ))}
                
                {/* Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-500 touch-manipulation select-none hover:text-orange-500 dark:hover:text-orange-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                >
                    <motion.div
                        whileTap={{ scale: 0.88 }}
                        className="flex flex-col items-center justify-center w-full h-full"
                    >
                        <div className="scale-100 transition-all duration-300">
                            <Menu size={23} strokeWidth={2} />
                        </div>
                    </motion.div>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;


