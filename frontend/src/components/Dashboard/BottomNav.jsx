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
        <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[395px] xs:w-[440px] sm:w-[520px] md:w-[600px] max-w-[96vw] z-50 lg:hidden glass-panel rounded-full shadow-glow-orange transition-all duration-300">
            <div className="flex items-stretch justify-around h-16 px-4 relative">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end
                        className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 dark:text-gray-500 no-underline touch-manipulation select-none outline-none border-none focus:outline-none focus:ring-0 active:outline-none"
                    >
                        {({ isActive }) => (
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center justify-center w-full h-full relative"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-bottom-nav-indicator"
                                        className="absolute w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/15 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/5 -z-0"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <div className={`transition-all duration-300 z-10 flex flex-col items-center justify-center ${isActive ? 'scale-105 text-orange-600 dark:text-orange-450' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'}`}>
                                    <item.icon 
                                        size={20} 
                                        strokeWidth={isActive ? 2.5 : 2} 
                                        className={isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.35)]' : ''}
                                    />
                                    <span className="text-[9px] font-bold mt-1 tracking-wide leading-none">{item.name}</span>
                                </div>
                            </motion.div>
                        )}
                    </NavLink>
                ))}
                
                {/* Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 dark:text-gray-550 touch-manipulation select-none hover:text-orange-500 dark:hover:text-orange-400 border-none outline-none focus:outline-none focus:ring-0 active:outline-none"
                >
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center justify-center w-full h-full"
                    >
                        <div className="scale-100 transition-all duration-300 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400">
                            <Menu size={20} strokeWidth={2} />
                            <span className="text-[9px] font-bold mt-1 tracking-wide leading-none">Menu</span>
                        </div>
                    </motion.div>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;


