import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, BookOpen, Quote, Menu, Globe, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = ({ onMenuClick }) => {
    const navItems = [
        { name: 'Home', icon: Home, path: '/dashboard' },
        { name: 'Explore', icon: Search, path: '/dashboard/explore' },
        { name: 'Library', icon: BookOpen, path: '/dashboard/library' },
        { name: 'Quiz', icon: Quote, path: '/dashboard/quiz' },
        { name: 'Rooms', icon: Globe, path: '/dashboard/live-rooms' },
        { name: 'Social', icon: Users, path: '/dashboard/social' },
    ];

    return (
        <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[340px] xs:w-[380px] sm:w-[460px] md:w-[540px] max-w-[95vw] z-50 lg:hidden bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
            <div className="flex items-stretch justify-around h-16 px-3 relative">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end
                        className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-550 no-underline touch-manipulation select-none outline-none border-none focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent active:outline-none"
                    >
                        {({ isActive }) => (
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex flex-col items-center justify-center w-full h-full relative outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                            >
                                <div className={`transition-all duration-300 z-10 flex flex-col items-center justify-center ${isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'}`}>
                                    <item.icon 
                                        size={20} 
                                        strokeWidth={isActive ? 2.5 : 2} 
                                        className={isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''}
                                    />
                                    <span className="text-[9px] font-semibold mt-0.5 tracking-wide leading-none">{item.name}</span>
                                </div>
                                
                                {/* Sleek sliding active background glass pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-x-1 inset-y-1.5 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl z-0 border border-orange-500/10 dark:border-orange-500/25 pointer-events-none"
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
                    className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-500 touch-manipulation select-none hover:text-orange-500 dark:hover:text-orange-400 border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent active:outline-none"
                >
                    <motion.div
                        whileTap={{ scale: 0.88 }}
                        className="flex flex-col items-center justify-center w-full h-full outline-none border-none"
                    >
                        <div className="scale-100 transition-all duration-300 flex flex-col items-center justify-center">
                            <Menu size={20} strokeWidth={2} />
                            <span className="text-[9px] font-semibold mt-0.5 tracking-wide leading-none">Menu</span>
                        </div>
                    </motion.div>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;


