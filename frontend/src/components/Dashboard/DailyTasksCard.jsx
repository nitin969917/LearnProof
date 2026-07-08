import React, { useState, useEffect } from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DailyTasksCard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);

    // Load tasks from local storage on mount
    useEffect(() => {
        if (user?.uid) {
            const savedTasks = localStorage.getItem(`learnproof_tasks_${user.uid}`);
            if (savedTasks) {
                try {
                    setTasks(JSON.parse(savedTasks));
                } catch (e) {
                    console.error("Failed to parse saved tasks", e);
                }
            }
        }
    }, [user]);

    // Calculate completions and progress
    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    return (
        <div 
            onClick={() => navigate('/dashboard/goals')}
            className="glass-panel shadow-glow-orange rounded-3xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.18)] dark:hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.3)] hover:border-orange-350 dark:hover:border-orange-500/50 group flex flex-col justify-between h-full min-h-[165px]"
        >
            {/* Header */}
            <div className="p-4 border-b border-orange-100/40 dark:border-white/5 bg-gradient-to-r from-orange-500/5 dark:from-orange-500/10 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <Target className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <h2 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 truncate">Daily Goals</h2>
                    </div>
                    <div className="text-orange-550 dark:text-orange-400 transition-transform duration-300 group-hover:translate-x-1 shrink-0">
                        <ArrowRight size={16} />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Tasks Completed</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-800 dark:text-white">{completedCount}</span>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">/ {tasks.length}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 text-orange-500 rounded-2xl shadow-sm border border-orange-100/30 dark:border-orange-500/10">
                        <Target size={18} />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col justify-end mt-2">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1.5 w-full">
                        <span>Completion Rate</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-150 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-orange-400 to-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyTasksCard;
