import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Inbox, Award, LogOut, Quote, Search, Moon, Sun, X, MessageSquare, HelpCircle, Menu, Users, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useSocialMessageStore } from '../../store/socialMessageStore';
import { motion } from 'framer-motion';

const Sidebar = ({ isExpanded = true, onProfileClick, onClose, onMenuClick }) => {
    const { user, logout } = useAuth();
    const { confirm } = useModal();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);

    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark';
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const navItems = [
        { name: 'Home', icon: <Home size={20} />, path: '/dashboard' },
        { name: 'My Learnings', icon: <BookOpen size={20} />, path: '/dashboard/library' },
        { name: 'Discover', icon: <Search size={20} />, path: '/dashboard/explore' },
        { name: 'Social Hub', icon: <Users size={20} />, path: '/dashboard/social' },
        { name: 'Live Rooms', icon: <Globe size={20} />, path: '/dashboard/live-rooms' },
        { name: 'Inbox', icon: <Inbox size={20} />, path: '/dashboard/inbox' },
        { name: 'Certificates', icon: <Award size={20} />, path: '/dashboard/certificates' },
        { name: 'Ask My Notes', icon: <MessageSquare size={20} />, path: '/dashboard/ask-my-notes' },
        { name: 'Quiz', icon: <Quote size={20} />, path: '/dashboard/quiz' },
        { name: 'Help & Support', icon: <HelpCircle size={20} />, path: '/support' },
    ];

    const handleLogout = async () => {
        const confirmed = await confirm({
            title: "Sign Out",
            message: "Are you sure you want to sign out of your account?",
            confirmText: "Sign Out",
            type: "danger"
        });

        if (confirmed) {
            await logout();
            navigate('/');
        }
    };

    return (
        <div className={`flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded 
                ? 'h-full w-full bg-white dark:bg-gray-800 border-r border-orange-100 dark:border-gray-700' 
                : 'h-[calc(100vh-2rem)] w-[70px] bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.2rem] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] my-4 mx-[10px]'
        }`}>
            <div className={`flex-1 overflow-y-auto py-4 ${isExpanded ? 'px-4 sm:px-6 space-y-8' : 'px-1.5 space-y-5 scrollbar-none'}`}>
                <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} px-2 mb-2`}>
                    {/* Desktop Menu Toggle (Replaces Logo) */}
                    <button
                        onClick={onMenuClick}
                        className="hidden lg:flex p-2 rounded-xl text-gray-500 hover:bg-orange-50 dark:hover:bg-gray-700 transition cursor-pointer"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                    </button>
 
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>
 
                {/* Navigation */}
                <nav className="flex flex-col space-y-1.5 lg:space-y-2">
                    {navItems.map((item) => (
                        item.isExternal ? (
                            <a
                                key={item.name}
                                href={item.path}
                                className={`flex flex-row items-center rounded-xl transition-all duration-300 ${
                                    isExpanded 
                                        ? 'px-4 py-2.5 gap-3' 
                                        : 'justify-center p-2.5'
                                } text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700`}
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                                    isExpanded 
                                        ? 'opacity-100 max-w-[180px]' 
                                        : 'opacity-0 max-w-0 w-0 pointer-events-none'
                                } text-sm font-semibold`}>
                                    {item.name}
                                </span>
                            </a>
                        ) : (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end
                                onClick={() => onClose && onClose()}
                                className={({ isActive }) =>
                                    `relative flex flex-row items-center rounded-xl transition-all duration-300 ${
                                        isExpanded 
                                            ? 'px-4 py-2.5 gap-3' 
                                            : 'justify-center p-2.5'
                                    } ${isActive
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/5 dark:hover:bg-orange-500/10'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <motion.div
                                        whileTap={{ scale: 0.92 }}
                                        className="flex flex-row items-center w-full h-full relative"
                                    >
                                        <div className={`flex-shrink-0 relative transition-all duration-300 z-10 ${isActive && !isExpanded ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`}>
                                            {React.cloneElement(item.icon, {
                                                size: 20,
                                                strokeWidth: isActive ? 2.5 : 2,
                                                className: isActive && !isExpanded ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''
                                            })}
                                            {item.name === 'Social Hub' && totalUnreadCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center border border-white dark:border-gray-800 z-20 animate-pulse">
                                                    {totalUnreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                                            isExpanded 
                                                ? 'opacity-100 max-w-[180px] ml-3' 
                                                : 'opacity-0 max-w-0 w-0 pointer-events-none'
                                        } text-sm font-semibold z-10`}>
                                            {item.name}
                                        </span>
                                        {/* Sliding active background glass pill when collapsed */}
                                        {isActive && !isExpanded && (
                                            <motion.div
                                                layoutId="activeSidebarPill"
                                                className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl z-0 border border-orange-500/10 dark:border-orange-500/25 pointer-events-none"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </NavLink>
                        )
                    ))}
                </nav>
            </div>
 
            {/* Bottom Section: Profile & Actions */}
            <div className={`py-4 ${isExpanded ? 'px-4 sm:px-6' : 'px-1'} space-y-4 border-t border-orange-100 dark:border-gray-700 flex flex-col`}>
                {user && (
                    <div
                        onClick={onProfileClick}
                        className={`flex items-center ${isExpanded ? 'gap-3 px-4 py-3 border border-orange-100 dark:border-gray-700 bg-orange-50 dark:bg-gray-800' : 'justify-center'} rounded-xl cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all`}
                    >
                        {user.picture ? (
                            <img src={user.picture} alt="Profile" className={`${isExpanded ? 'w-10 h-10' : 'w-10 h-10'} rounded-full shadow-sm`} />
                        ) : (
                            <div className={`${isExpanded ? 'w-10 h-10' : 'w-10 h-10'} rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold shadow-sm text-sm`}>
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        {isExpanded && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.name || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                        )}
                    </div>
                )}
 
                <div className={`flex ${isExpanded ? 'flex-row items-center gap-3' : 'flex-col gap-2.5 items-center'}`}>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center justify-center ${isExpanded ? 'flex-1 gap-2 px-4 py-2.5 border border-transparent hover:border-red-100 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' : 'p-2 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20'} rounded-xl transition-all font-medium cursor-pointer`}
                        title="Logout"
                    >
                        <LogOut size={isExpanded ? 20 : 22} />
                        {isExpanded && <span className="text-sm">Logout</span>}
                    </button>
 
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center justify-center ${isExpanded ? 'px-4 py-2.5 border border-gray-200 dark:border-gray-700' : 'p-2 hover:bg-gray-500/10'} rounded-xl text-gray-750 dark:text-gray-300 transition-all cursor-pointer`}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={isExpanded ? 20 : 22} className="text-amber-500" /> : <Moon size={isExpanded ? 20 : 22} className="text-indigo-600" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
