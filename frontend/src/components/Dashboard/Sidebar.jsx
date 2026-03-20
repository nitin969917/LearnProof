import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Inbox, Award, LogOut, Quote, Search, Moon, Sun, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ onProfileClick, onClose }) => {
    const { user, logout } = useAuth();
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
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-orange-100 dark:border-gray-700">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
                <div className="flex items-center justify-between mb-2">
                    {/* Logo */}
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                        LearnProof
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end
                            onClick={() => onClose && onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${isActive
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom Section: Profile & Actions */}
            <div className="p-4 sm:p-6 space-y-4 border-t border-orange-100 dark:border-gray-700">
                {user && (
                    <div
                        onClick={onProfileClick}
                        className="flex items-center gap-3 px-4 py-3 border border-orange-100 dark:border-gray-700 bg-orange-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                    >
                        {user.picture ? (
                            <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full shadow-sm" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold shadow-sm">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center flex-1 gap-2 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 transition-all text-sm font-medium"
                        title="Logout"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
