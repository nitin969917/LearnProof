import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame } from "lucide-react";

const CalendarCard = () => {
    const { token } = useAuth();
    const [activityData, setActivityData] = useState({});
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeDate, setActiveDate] = useState(null); // Tracks the clicked date string

    // Simple calendar state for current month/year
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    useEffect(() => {
        const fetchActivityData = async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/activity/`, {
                    idToken: token,
                });

                // Convert array [{ date: '2025-02-27', activity_count: 2, activities: [...] }] to a dictionary mapping
                const activities = res.data.graph || [];
                const parsedData = {};
                activities.forEach(item => {
                    parsedData[item.date] = item;
                });
                setActivityData(parsedData);
                setStreak(res.data.streak_count || 0);
            } catch (err) {
                console.error("Failed to fetch activity for calendar:", err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchActivityData();
    }, [token]);

    // Close popover when clicking anywhere else
    useEffect(() => {
        const handleClickOutside = () => setActiveDate(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Build the grid
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 relative transform transition-all duration-300 hover:shadow-md dark:shadow-gray-900/50">
            <div className="p-3 sm:p-4 rounded-t-xl border-b border-orange-50 dark:border-gray-700 bg-gradient-to-r from-orange-50/50 dark:from-gray-800 to-white dark:to-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="text-orange-500 w-5 h-5" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Your Activity</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-sm">
                    <Flame size={16} className={streak > 0 ? "animate-pulse" : ""} />
                    <span className="text-sm font-bold">{streak} {streak === 1 ? 'Day' : 'Days'} Streak</span>
                </div>
            </div>

            <div className="p-4">
                {/* Calendar Controls */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                        {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-xs font-medium text-gray-400 dark:text-gray-500">{day}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map(b => (
                        <div key={`blank-${b}`} className="aspect-square"></div>
                    ))}
                    {days.map(day => {
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday =
                            day === today.getDate() &&
                            currentMonth === today.getMonth() &&
                            currentYear === today.getFullYear();

                        const dayData = activityData[dateStr] || { activity_count: 0, activities: [] };
                        const activityCount = dayData.activity_count;
                        const dayActivities = dayData.activities || [];

                        // Determine color intensity based on activity count
                        let bgColor = "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200";
                        if (activityCount > 0) bgColor = "bg-orange-200 dark:bg-orange-900/40 hover:bg-orange-300 dark:hover:bg-orange-800/60 text-orange-900 dark:text-orange-200";
                        if (activityCount >= 3) bgColor = "bg-orange-400 dark:bg-orange-600 hover:bg-orange-500 dark:hover:bg-orange-500 text-white";
                        if (activityCount >= 6) bgColor = "bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-400 text-white";

                        const isActive = activeDate === dateStr;

                        return (
                            <div
                                key={day}
                                className={`relative aspect-square flex items-center justify-center rounded-md text-sm transition-colors cursor-pointer ${bgColor} ${isToday ? 'ring-2 ring-orange-500 ring-offset-1 font-bold' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent document click from closing it immediately
                                    setActiveDate(isActive ? null : dateStr); // Toggle
                                }}
                            >
                                {day}

                                {activityCount > 0 && (
                                    <div
                                        className={`fixed left-4 right-4 top-1/2 -translate-y-1/2 sm:absolute sm:inset-auto sm:top-auto sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 sm:mb-2 sm:w-72 bg-gray-900 text-white text-xs rounded-lg p-4 sm:p-3 shadow-2xl transition-all duration-200 z-[60] ${isActive ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
                                        onClick={(e) => e.stopPropagation()} // Let user scroll/click inside without closing
                                    >
                                        {/* Mobile Backdrop - only visible when active on small screens */}
                                        <div className="fixed inset-0 bg-black/40 -z-10 sm:hidden" onClick={() => setActiveDate(null)} />
                                        <div className="font-semibold mb-2 text-orange-400 border-b border-gray-700 pb-1">
                                            {monthNames[currentMonth]} {day}, {currentYear}
                                        </div>
                                        <ul className="space-y-1.5 text-left max-h-48 overflow-y-auto custom-scrollbar">
                                            {dayActivities.map((act, idx) => (
                                                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                                    <span className="text-orange-500 text-[10px] mt-[3px]">●</span>
                                                    <span className="break-words">{act}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400 justify-end">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900/40"></div>
                    <div className="w-3 h-3 rounded-sm bg-orange-400 dark:bg-orange-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-orange-600 dark:bg-orange-500"></div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarCard;
