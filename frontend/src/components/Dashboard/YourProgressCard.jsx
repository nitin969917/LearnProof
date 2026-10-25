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
            const savedTasks = localStorage.getItem(`learnproof_cached_goals_${user.uid}`) || localStorage.getItem(`learnproof_tasks_${user.uid}`);
            if (savedTasks) {
                try {
                    const parsed = JSON.parse(savedTasks);
                    setTasks(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                    console.error('Failed to parse saved tasks', e);
                }
            }
        }
    }, [user]);

    const completedTasksCount = tasks.filter(t => t.is_completed || t.completed).length;
    const totalTasksCount = tasks.length > 0 ? tasks.length : 6;
    const tasksPercent = tasks.length === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);

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

    return (
        <div className="space-y-3">
            {/* Header: Vertical orange bars + Your progress + View all OUTSIDE */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex items-end gap-[2px] sm:gap-[2.5px] h-4 sm:h-[18px] text-[#F97316] shrink-0">
                        <span className="w-[3px] sm:w-[3.5px] h-2 sm:h-2.5 bg-[#F97316] rounded-full"></span>
                        <span className="w-[3px] sm:w-[3.5px] h-3.5 sm:h-[17px] bg-[#F97316] rounded-full"></span>
                        <span className="w-[3px] sm:w-[3.5px] h-2.5 sm:h-3 bg-[#F97316] rounded-full"></span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        Your progress
                    </h2>
                </div>

                <button
                    onClick={() => navigate('/dashboard/goals')}
                    className="text-[#F97316] hover:text-orange-600 font-bold text-xs sm:text-sm flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                    <span>View all</span>
                    <ChevronRight size={16} strokeWidth={2.4} />
                </button>
            </div>

            {/* The Progress Card Container with 3 Metric Tiles */}
            <div 
                role="button"
                tabIndex={0}
                onClick={() => navigate('/dashboard/goals')}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100/90 dark:border-gray-700/80 p-2.5 sm:p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer select-none group"
            >
                {/* 3 Metric Tiles */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Column 1: Focus */}
                    <div className="bg-[#FFF9F3] dark:bg-orange-950/20 border border-[#FFE8D6] dark:border-orange-900/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 transition-all group-hover:border-orange-200">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#FFE9D5] dark:bg-orange-900/50 text-[#FF5100] flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FF5100]" strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold leading-tight">
                                Focus
                            </p>
                            <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-tight mt-0.5 truncate">
                                {formatScreenTime(todaySeconds)}
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Goals */}
                    <div className="bg-[#F4F9FF] dark:bg-blue-950/20 border border-[#E0EFFF] dark:border-blue-900/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 transition-all group-hover:border-blue-200">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#E0EEFF] dark:bg-blue-900/50 text-[#2563EB] flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2563EB]" strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold leading-tight">
                                Goals
                            </p>
                            <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-tight mt-0.5 truncate">
                                {completedTasksCount}<span className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500">/{totalTasksCount}</span>
                            </p>
                        </div>
                    </div>

                    {/* Column 3: Streak */}
                    <div className="bg-[#FFF5F6] dark:bg-rose-950/20 border border-[#FFE2E6] dark:border-rose-900/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 transition-all group-hover:border-rose-200">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#FFE2E7] dark:bg-rose-900/50 text-[#FF2E56] flex items-center justify-center shrink-0">
                            <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FF2E56]" strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold leading-tight">
                                Streak
                            </p>
                            <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-tight mt-0.5 truncate">
                                {streak} <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">{streak === 1 ? 'day' : 'days'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YourProgressCard;
