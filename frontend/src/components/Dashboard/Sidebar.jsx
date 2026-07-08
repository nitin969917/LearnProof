import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Award, LogOut, Quote, Search, Moon, Sun, X, MessageSquare, HelpCircle, Menu, Users, Globe } from 'lucide-react';
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

    const navSections = [
        {
            title: 'Portal',
            items: [
                { name: 'Home', icon: <Home size={20} />, path: '/dashboard' }
            ]
        },
        {
            title: 'Learning Hub',
            items: [
                { name: 'My Learnings', icon: <BookOpen size={20} />, path: '/dashboard/library' },
                { name: 'Discover', icon: <Search size={20} />, path: '/dashboard/explore' },
                { name: 'Quiz', icon: <Quote size={20} />, path: '/dashboard/quiz' },
                { name: 'Ask My Notes', icon: <MessageSquare size={20} />, path: '/dashboard/ask-my-notes' },
                { name: 'Certificates', icon: <Award size={20} />, path: '/dashboard/certificates' },
            ]
        },
        {
            title: 'Social Hubs',
            items: [
                { name: 'Live Rooms', icon: <Globe size={20} />, path: '/dashboard/live-rooms' },
                { name: 'Social Hub', icon: <Users size={20} />, path: '/dashboard/social' },
            ]
        },
        {
            title: 'Support',
            items: [
                { name: 'Help & Support', icon: <HelpCircle size={20} />, path: '/dashboard/support' }
            ]
        }
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
                ? 'h-full w-full bg-white dark:bg-gray-900 border-r border-orange-100/50 dark:border-gray-800/80 shadow-[1px_0_10px_-5px_rgba(0,0,0,0.05)]' 
                : 'h-[calc(100vh-2rem)] w-[70px] glass-panel rounded-[2.2rem] shadow-glow-orange my-4 mx-[10px]'
        }`}>
            <div className={`flex-1 overflow-y-auto py-4 ${isExpanded ? 'px-3 sm:px-4 space-y-8' : 'px-1.5 space-y-5 scrollbar-none'}`}>
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
                <nav className="flex flex-col space-y-6">
                    {navSections.map((section) => (
                        <div key={section.title} className="flex flex-col space-y-1">
                            {isExpanded && (
                                <div className="text-[9px] font-black text-orange-600/70 dark:text-orange-400/80 uppercase tracking-widest px-3 mb-1.5 select-none">
                                    {section.title}
                                </div>
                            )}
                            <div className="flex flex-col space-y-1 lg:space-y-1.5">
                                {section.items.map((item) => (
                                    item.isExternal ? (
                                        <a
                                            key={item.name}
                                            href={item.path}
                                            title={!isExpanded ? item.name : undefined}
                                            className={`flex ${
                                                isExpanded ? 'flex-row items-center px-4 py-2 gap-3' : 'flex-col items-center justify-center py-2 px-1 mb-1'
                                            } rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700`}
                                        >
                                            <div className="flex-shrink-0">
                                                {React.cloneElement(item.icon, {
                                                    size: isExpanded ? 20 : 24
                                                })}
                                            </div>
                                            {isExpanded ? (
                                                <span className="text-base text-left transition-all whitespace-nowrap font-medium">
                                                    {item.name}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold mt-1 tracking-wide leading-none text-center text-gray-500 dark:text-gray-400">
                                                    {item.name}
                                                </span>
                                            )}
                                        </a>
                                    ) : (
                                        <NavLink
                                            key={item.name}
                                            to={item.path}
                                            end
                                            title={!isExpanded ? item.name : undefined}
                                            onClick={() => onClose && onClose()}
                                            className={({ isActive }) =>
                                                `relative flex ${
                                                    isExpanded 
                                                        ? 'flex-row items-center px-3 py-2 gap-3 rounded-xl' 
                                                        : 'flex-col items-center justify-center py-2 px-1 mb-1 rounded-xl'
                                                } transition-all duration-300 ${isActive
                                                    ? isExpanded
                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold'
                                                        : 'text-orange-600 dark:text-orange-400'
                                                    : isExpanded
                                                        ? 'text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/5 dark:hover:bg-orange-500/10'
                                                        : 'text-gray-550 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
                                                }`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <motion.div
                                                    whileTap={{ scale: 0.92 }}
                                                    className={`flex ${
                                                        isExpanded ? 'flex-row items-center gap-3' : 'flex-col items-center justify-center'
                                                    } w-full h-full relative`}
                                                >
                                                    <div className={`flex-shrink-0 relative transition-all duration-300 z-10 ${isActive && !isExpanded ? 'scale-105 text-orange-600 dark:text-orange-400' : ''}`}>
                                                        {React.cloneElement(item.icon, {
                                                            size: isExpanded ? 20 : 24,
                                                            strokeWidth: isActive ? 2.5 : 2,
                                                            className: isActive && !isExpanded ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : ''
                                                        })}
                                                        {item.name === 'Social Hub' && totalUnreadCount > 0 && (
                                                            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center border border-white dark:border-gray-800 z-20 animate-pulse">
                                                                {totalUnreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isExpanded ? (
                                                        <span className={`text-base text-left transition-all whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                            {item.name}
                                                        </span>
                                                    ) : (
                                                        <span className={`text-[9px] font-bold mt-1 tracking-wide leading-none text-center transition-all duration-300 ${isActive ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'text-gray-500 dark:text-gray-450'}`}>
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            )}
                                        </NavLink>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
 
            {/* Bottom Section: Profile & Actions */}
            <div className={`py-4 ${isExpanded ? 'px-3 sm:px-4' : 'px-1'} space-y-4 border-t border-orange-100 dark:border-gray-700 flex flex-col`}>
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
                        className={`flex items-center justify-center ${isExpanded ? 'flex-1 gap-2 px-3 py-2.5 border border-transparent hover:border-red-100 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' : 'p-2 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20'} rounded-xl transition-all font-medium cursor-pointer`}
                        title="Logout"
                    >
                        <LogOut size={isExpanded ? 20 : 24} />
                        {isExpanded && <span className="text-sm whitespace-nowrap">Logout</span>}
                    </button>
 
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center justify-center ${isExpanded ? 'px-3 py-2.5 border border-gray-200 dark:border-gray-700' : 'p-2 hover:bg-gray-500/10'} rounded-xl text-gray-755 dark:text-gray-300 transition-all cursor-pointer`}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={isExpanded ? 20 : 24} className="text-amber-500" /> : <Moon size={isExpanded ? 20 : 24} className="text-indigo-600" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
