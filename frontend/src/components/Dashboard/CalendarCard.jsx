import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame, X } from "lucide-react";

const CalendarCard = () => {
    const { token } = useAuth();

    const getScreenTimeForDate = (dateString) => {
        try {
            const dataStr = localStorage.getItem('learnproof_screentime') || '{}';
            const data = JSON.parse(dataStr);
            return data[dateString] || 0;
        } catch (e) {
            return 0;
        }
    };

    const formatSeconds = (totalSeconds) => {
        if (!totalSeconds) return "0 mins";
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        let parts = [];
        if (hrs > 0) parts.push(`${hrs}h`);
        if (mins > 0) parts.push(`${mins}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(" ");
    };
    const [activityData, setActivityData] = useState({});
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeDate, setActiveDate] = useState(null); // Tracks the clicked date string
    const popoverRef = useRef(null);
    const isClosingRef = useRef(false);

    const handleClosePopover = (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        isClosingRef.current = true;
        setActiveDate(null);
        setTimeout(() => {
            isClosingRef.current = false;
        }, 300);
    };

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

    // Close popover when clicking anywhere outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isClosingRef.current) return;
            if (popoverRef.current && popoverRef.current.contains(e.target)) {
                return;
            }
            setActiveDate(null);
        };
        const handleKeyDown = (e) => {
            if (e.key === "Escape") handleClosePopover(e);
        };
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750 p-4 sm:p-5 relative transform transition-all duration-300 hover:shadow-md dark:shadow-gray-900/50">
            {/* Header: Study Activity + Subtitle + Streak Pill */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-700/50">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <CalendarIcon className="text-[#F97316] w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2.4} />
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                            Study Activity
                        </h2>
                        <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-400 font-medium leading-normal mt-0.5">
                            Days you studied this month
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF1EC] dark:bg-orange-950/40 text-[#EF4444] dark:text-orange-400 font-bold text-xs shrink-0">
                    <Flame size={15} className={`text-[#EF4444] fill-[#EF4444] ${streak > 0 ? "animate-pulse" : ""}`} />
                    <span>{streak} {streak === 1 ? 'Day' : 'Days'} Streak</span>
                </div>
            </div>

            <div className="pt-3">
                {/* Month Navigation: Centered with circular arrow buttons */}
                <div className="flex items-center justify-center gap-6 mb-4">
                    <button 
                        onClick={handlePrevMonth} 
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white min-w-[130px] text-center">
                        {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button 
                        onClick={handleNextMonth} 
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-2.5 w-full">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-[11px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid with Circular Badges */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full place-items-center">
                    {blanks.map(b => (
                        <div key={`blank-${b}`} className="w-8 h-8 sm:w-9 sm:h-9"></div>
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

                        // Image 2 circle colors:
                        let cellStyle = "bg-[#F8FAFC] dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";
                        if (activityCount > 0) {
                            cellStyle = "bg-[#FED7AA] dark:bg-orange-900/60 text-[#7C2D12] dark:text-orange-200 font-bold hover:bg-[#FDBA74]";
                        }
                        if (isToday) {
                            if (activityCount > 0) {
                                cellStyle = "border-2 border-[#F97316] bg-[#FED7AA] dark:bg-orange-900/60 text-[#7C2D12] dark:text-orange-200 font-bold shadow-sm";
                            } else {
                                cellStyle = "border-2 border-[#F97316] bg-white dark:bg-gray-800 text-[#C2410C] dark:text-orange-400 font-bold shadow-sm";
                            }
                        }

                        const isActive = activeDate === dateStr;

                        return (
                            <div
                                key={day}
                                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${cellStyle}`}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent document click from closing it immediately
                                    if (isClosingRef.current) return;
                                    setActiveDate(isActive ? null : dateStr); // Toggle
                                }}
                            >
                                {day}

                                {isActive && (
                                    <>
                                        {/* Backdrop: intercepts any clicks outside the popover so no underlying dates receive click events */}
                                        <div
                                            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent cursor-default"
                                            onClick={handleClosePopover}
                                        />
                                        <div
                                            ref={popoverRef}
                                            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 sm:absolute sm:inset-auto sm:top-auto sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 sm:mb-2 sm:w-72 bg-gray-900 text-white text-xs rounded-xl p-4 sm:p-3.5 shadow-2xl transition-all duration-200 z-[60] opacity-100 visible translate-y-0"
                                            onClick={(e) => e.stopPropagation()} // Let user scroll/click inside without closing
                                        >
                                            <div className="font-semibold mb-2 text-orange-400 border-b border-gray-700 pb-1 flex justify-between items-center">
                                                <span className="text-xs font-bold text-orange-400">{monthNames[currentMonth]} {day}, {currentYear}</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClosePopover}
                                                    className="text-gray-400 hover:text-white p-1.5 -mr-1 rounded-md hover:bg-gray-800 transition cursor-pointer active:scale-90"
                                                    title="Close details"
                                                    aria-label="Close"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-300 my-2 font-semibold">
                                                <span>⏱️ Focus Time:</span>
                                                <span className="text-orange-400 font-bold">{formatSeconds(getScreenTimeForDate(dateStr))}</span>
                                            </div>
                                            {dayActivities.length > 0 ? (
                                                <div className="mt-2.5">
                                                    <div className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-wider border-t border-gray-800 pt-2">Activities</div>
                                                    <ul className="space-y-1.5 text-left max-h-36 overflow-y-auto custom-scrollbar">
                                                        {dayActivities.map((act, idx) => (
                                                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                                                <span className="text-orange-500 text-[10px] mt-[3px]">●</span>
                                                                <span className="break-words text-gray-200">{act}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-gray-500 italic mt-1 border-t border-gray-800 pt-2">No learning activity recorded.</div>
                                            )}
                                            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarCard;
