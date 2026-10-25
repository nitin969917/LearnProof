import React, { useState, useEffect } from 'react';
import { Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTodayGoals } from '../../api/goalApi';

const DailyTasksCard = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);

    useEffect(() => {
        // 1. Instant load from local cache if available
        if (user?.uid) {
            const cached = localStorage.getItem(`learnproof_cached_goals_${user.uid}`) || localStorage.getItem(`learnproof_tasks_${user.uid}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setGoals(Array.isArray(parsed) ? parsed : []);
                } catch (_) {}
            }
        }

        // 2. Fetch live dynamic goals from database
        if (token) {
            fetchTodayGoals(token)
                .then(res => {
                    if (res?.goals) {
                        setGoals(res.goals);
                        if (user?.uid) {
                            localStorage.setItem(`learnproof_cached_goals_${user.uid}`, JSON.stringify(res.goals));
                        }
                    }
                })
                .catch(err => {
                    console.warn('[DailyTasksCard] Live goals fetch fallback to cache:', err.message);
                });
        }
    }, [user, token]);

    // Calculate completions and progress
    const completedCount = goals.filter(g => g.is_completed || g.completed).length;
    const totalCount = goals.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <div 
            onClick={() => navigate('/dashboard/goals')}
            className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750 p-3.5 sm:p-5 flex flex-col justify-between transform transition-all duration-300 hover:shadow-md dark:shadow-gray-900/50 cursor-pointer"
        >
            {/* Header: Target + Title + Chevron */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-50 dark:border-gray-700/50">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                        <Target className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#2563EB]" strokeWidth={2.4} />
                    </div>
                    <h2 className="text-xs sm:text-base font-bold text-gray-900 dark:text-white truncate">Daily Goals</h2>
                </div>
                <ChevronRight size={16} className="text-orange-500 shrink-0 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
            </div>

            {/* Body */}
            <div className="pt-2.5 sm:pt-3 flex flex-col gap-2.5 sm:gap-3 flex-1 justify-between">
                <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider truncate">
                            GOALS ACHIEVED
                        </p>
                        <div className="flex items-baseline gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                            <span className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {completedCount}
                            </span>
                            <span className="text-[10px] sm:text-base font-bold text-gray-400 dark:text-gray-500">
                                /{totalCount}
                            </span>
                        </div>
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#FFF5ED] dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" strokeWidth={2.4} />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 w-full">
                        <span className="truncate">Completion Rate</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300 shrink-0 ml-1">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-[#2563EB] h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyTasksCard;
