import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Inbox, Award, LogOut, Quote, Search, Moon, Sun, X, MessageSquare, HelpCircle, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

const Sidebar = ({ isExpanded = true, onProfileClick, onClose, onMenuClick }) => {
    const { user, logout } = useAuth();
    const { confirm } = useModal();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(false);

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
        { name: 'Inbox', icon: <Inbox size={20} />, path: '/dashboard/inbox' },
        { name: 'Certificates', icon: <Award size={20} />, path: '/dashboard/certificates' },
        { name: 'Ask My Notes', icon: <MessageSquare size={20} />, path: '/dashboard/ask-my-notes' },
        { name: 'Quiz', icon: <Quote size={20} />, path: '/dashboard/quiz' },
        { name: 'Help & Support', icon: <HelpCircle size={20} />, path: '/dashboard/support' },
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
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 border-r border-orange-100 dark:border-gray-700 overflow-x-hidden">
            <div className={`flex-1 overflow-y-auto py-4 ${isExpanded ? 'px-4 sm:px-6 space-y-8' : 'px-1 space-y-6'}`}>
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
                <nav className="flex flex-col space-y-2 lg:space-y-3">
                    {navItems.map((item) => (
                        item.isExternal ? (
                            <a
                                key={item.name}
                                href={item.path}
                                className={`flex ${
                                    isExpanded ? 'flex-row items-center px-4 py-2 gap-3' : 'flex-col items-center justify-center p-2 gap-1 px-1'
                                } rounded-lg transition-all text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700`}
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                <span className={`${isExpanded ? 'text-base text-left' : 'text-[10px] text-center whitespace-nowrap tracking-tighter'} transition-all`}>
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
                                    `flex ${
                                        isExpanded ? 'flex-row items-center px-4 py-2 gap-3' : 'flex-col items-center justify-center p-2 gap-1 mb-1'
                                    } rounded-lg transition-all ${isActive
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                <span className={`${isExpanded ? 'text-base text-left' : 'text-[10px] text-center whitespace-nowrap tracking-tighter'} transition-all`}>
                                    {item.name}
                                </span>
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
                        className={`flex items-center ${isExpanded ? 'gap-3 px-4 py-3 border border-orange-100 dark:border-gray-700 bg-orange-50 dark:bg-gray-800' : 'justify-center'} rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all`}
                    >
                        {user.picture ? (
                            <img src={user.picture} alt="Profile" className={`${isExpanded ? 'w-10 h-10' : 'w-12 h-12'} rounded-full shadow-sm`} />
                        ) : (
                            <div className={`${isExpanded ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold shadow-sm text-lg`}>
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

                <div className={`flex ${isExpanded ? 'flex-row items-center gap-3' : 'flex-col gap-2'}`}>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center justify-center flex-1 ${isExpanded ? 'gap-2 px-4 py-2.5 bg-transparent' : 'p-3 bg-red-50 dark:bg-red-900/20'} rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 transition-all font-medium`}
                        title="Logout"
                    >
                        <LogOut size={isExpanded ? 20 : 22} />
                        {isExpanded && <span className="text-sm">Logout</span>}
                    </button>

                    <button
                        onClick={toggleTheme}
                        className={`flex items-center justify-center ${isExpanded ? 'px-4 py-2.5' : 'p-3'} rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all`}
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
