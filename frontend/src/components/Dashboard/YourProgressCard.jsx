import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Clock, Target, Flame, ChevronRight, BarChart2 } from 'lucide-react';

const YourProgressCard = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // ── 1. Screen Time State ──
    const [todaySeconds, setTodaySeconds] = useState(0);
    const [targetHours, setTargetHours] = useState(() => {
        try {
            const saved = localStorage.getItem('learnproof_screentime_target');
            return saved ? parseFloat(saved) : 2;
        } catch {
            return 2;
        }
    });

    const getTodayKey = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchTime = () => {
            try {
                const dataStr = localStorage.getItem('learnproof_screentime') || '{}';
                const data = JSON.parse(dataStr);
                setTodaySeconds(data[getTodayKey()] || 0);

                const savedTarget = localStorage.getItem('learnproof_screentime_target');
                if (savedTarget) setTargetHours(parseFloat(savedTarget));
            } catch (e) {
                console.error(e);
            }
        };

        fetchTime();
        const interval = setInterval(fetchTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatScreenTime = (totalSec) => {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);

        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const dailyTargetSeconds = targetHours * 3600;
    const screenTimePercent = Math.min(100, Math.round((todaySeconds / dailyTargetSeconds) * 100));

    // ── 2. Daily Goals State ──
    const [tasks, setTasks] = useState([]);
    useEffect(() => {
        if (user?.uid) {
            const savedTasks = localStorage.getItem(`learnproof_tasks_${user.uid}`);
            if (savedTasks) {
                try {
                    setTasks(JSON.parse(savedTasks));
                } catch (e) {
                    console.error('Failed to parse saved tasks', e);
                }
            }
        }
    }, [user]);

    const completedTasksCount = tasks.filter(t => t.completed).length;
    const totalTasksCount = tasks.length > 0 ? tasks.length : 3;
    const tasksPercent = tasks.length === 0 ? 0 : Math.round((completedTasksCount / tasks.length) * 100);

    // ── 3. Current Streak & 7 Days Activity State ──
    const [streak, setStreak] = useState(1);
    const [activityGraph, setActivityGraph] = useState({});

    useEffect(() => {
        const fetchActivity = async () => {
            if (!token) return;
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/activity/`, {
                    idToken: token,
                });
                const activities = res.data?.graph || [];
                const parsed = {};
                activities.forEach(item => {
                    parsed[item.date] = item;
                });
                setActivityGraph(parsed);
                setStreak(res.data?.streak_count || 1);
            } catch (err) {
                console.error('Failed to fetch activity in YourProgressCard:', err);
            }
        };

        fetchActivity();
    }, [token]);

    // Build 7 days of the current week (Monday to Sunday)
    const getWeekDays = () => {
        const now = new Date();
        const currentDayIndex = (now.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
        const monday = new Date(now);
        monday.setDate(now.getDate() - currentDayIndex);

        const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        return labels.map((label, idx) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + idx);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            // Check if day is active:
            // 1. Has activity in backend graph
            // 2. Has local screentime > 0
            // 3. Is current day or past day within current streak
            let hasScreenTime = false;
            try {
                const dataStr = localStorage.getItem('learnproof_screentime') || '{}';
                const data = JSON.parse(dataStr);
                hasScreenTime = (data[dateStr] || 0) > 0;
            } catch {}

            const isBackendActive = Boolean(activityGraph[dateStr]?.activity_count > 0);
            const isWithinStreak = idx <= currentDayIndex && (currentDayIndex - idx < streak);

            const active = isBackendActive || hasScreenTime || isWithinStreak;

            return {
                label,
                dateStr,
                isToday: idx === currentDayIndex,
                active,
            };
        });
    };

    const weekDays = getWeekDays();

    return (
        <div 
            onClick={() => navigate('/dashboard/goals')}
            className="bg-white dark:bg-gray-850 rounded-2xl border border-orange-100/70 dark:border-gray-700/80 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer select-none"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="text-orange-500 flex items-center justify-center">
                        <BarChart2 size={18} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white leading-none">
                        Your Progress
                    </h3>
                </div>

                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold group">
                    <span>Keep going! You're doing great! 🚀</span>
                    <ChevronRight size={15} className="text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>

            {/* 3 Columns Section (No bottom progress bars) */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 py-0.5">
                {/* Column 1: Screen Time */}
                <div className="px-1.5 sm:px-2 first:pl-0 flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 text-orange-500 flex items-center justify-center shrink-0">
                        <Clock size={15} />
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate leading-tight">
                            Screen Time
                        </p>
                        <p className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white truncate leading-tight mt-0.5">
                            {formatScreenTime(todaySeconds)}
                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 ml-0.5">
                                /{targetHours}h
                            </span>
                        </p>
                    </div>
                </div>

                {/* Column 2: Daily Goals */}
                <div className="px-1.5 sm:px-2 flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-500 flex items-center justify-center shrink-0">
                        <Target size={15} />
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate leading-tight">
                            Daily Goals
                        </p>
                        <p className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white truncate leading-tight mt-0.5">
                            {completedTasksCount}
                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 ml-0.5">
                                /{totalTasksCount}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Column 3: Current Streak */}
                <div className="px-1.5 sm:px-2 last:pr-0 flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 text-red-500 flex items-center justify-center shrink-0">
                        <Flame size={15} />
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate leading-tight">
                            Current Streak
                        </p>
                        <p className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white truncate leading-tight mt-0.5">
                            {streak}
                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 ml-0.5">
                                day{streak === 1 ? '' : 's'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YourProgressCard;
