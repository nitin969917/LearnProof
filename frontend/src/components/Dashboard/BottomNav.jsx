import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, BookOpen, Quote, Menu } from 'lucide-react';

const BottomNav = ({ onMenuClick }) => {
    const navItems = [
        { name: 'Home', icon: Home, path: '/dashboard' },
        { name: 'Explore', icon: Search, path: '/dashboard/explore' },
        { name: 'Library', icon: BookOpen, path: '/dashboard/library' },
        { name: 'Quiz', icon: Quote, path: '/dashboard/quiz' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe-area-inset-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
                                isActive 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-gray-500 dark:text-gray-500 hover:text-orange-500'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                                    <item.icon 
                                        size={22} 
                                        strokeWidth={isActive ? 2.5 : 2} 
                                        className={isActive ? 'drop-shadow-sm' : ''}
                                    />
                                </div>
                                <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                    {item.name}
                                </span>
                                {isActive && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-b-full hidden" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
                
                {/* Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 dark:text-gray-500 hover:text-orange-500 transition-all duration-300"
                >
                    <Menu size={22} strokeWidth={2} />
                    <span className="text-[10px] mt-1 font-semibold opacity-60">More</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
