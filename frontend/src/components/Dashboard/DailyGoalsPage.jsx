import React, { useState, useEffect, useCallback } from 'react';
import { 
    Target, 
    CheckCircle2, 
    Circle, 
    Plus, 
    Trash2, 
    Trophy, 
    Calendar, 
    ChevronRight, 
    Play, 
    HelpCircle, 
    Clock, 
    Sparkles, 
    Flame, 
    ArrowUpRight, 
    Loader2, 
    RefreshCw,
    Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    fetchTodayGoals, 
    createCustomGoal, 
    toggleGoal, 
    deleteGoal, 
    fetchGoalHistory 
} from '../../api/goalApi';

const DailyGoalsPage = () => {
    const { user, token } = useAuth();
    const { confirm } = useModal();
    const navigate = useNavigate();

    const [goals, setGoals] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newGoalText, setNewGoalText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const clientDate = new Date().toISOString().split('T')[0];

    // Load goals from API
    const loadGoalsData = useCallback(async (isSilent = false) => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            if (!isSilent) setLoading(true);
            else setRefreshing(true);

            // Fetch today's smart & custom goals
            const todayRes = await fetchTodayGoals(token, clientDate);
            if (todayRes?.goals) {
                setGoals(todayRes.goals);
                // Cache locally for instant next load
                if (user?.uid) {
                    localStorage.setItem(`learnproof_cached_goals_${user.uid}`, JSON.stringify(todayRes.goals));
                }
            }

            // Fetch real history
            const historyData = await fetchGoalHistory(token, 5, clientDate);
            setHistory(historyData);
        } catch (err) {
            console.error('Failed to load daily goals:', err);
            // Fallback to cache if available
            if (user?.uid) {
                const cached = localStorage.getItem(`learnproof_cached_goals_${user.uid}`);
                if (cached) {
                    try { setGoals(JSON.parse(cached)); } catch (_) {}
                }
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, user, clientDate]);

    useEffect(() => {
        loadGoalsData();
    }, [loadGoalsData]);

    // Handle adding custom goal
    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoalText.trim() || submitting) return;

        try {
            setSubmitting(true);
            const created = await createCustomGoal(token, {
                title: newGoalText.trim(),
                target_value: 1,
                date: clientDate
            });

            if (created) {
                setGoals(prev => [...prev, created]);
                setNewGoalText('');
            }
        } catch (err) {
            console.error('Failed to create custom goal:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle toggling goal completion
    const handleToggleGoal = async (goal) => {
        // Optimistic UI update
        const nextCompleted = !goal.is_completed;
        const nextCurrent = nextCompleted ? goal.target_value : 0;

        setGoals(prev => prev.map(g => 
            g.id === goal.id 
                ? { ...g, is_completed: nextCompleted, current_value: nextCurrent }
                : g
        ));

        try {
            const updated = await toggleGoal(token, goal.id);
            if (updated) {
                setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
            }
        } catch (err) {
            console.error('Failed to toggle goal:', err);
            // Revert on error
            loadGoalsData(true);
        }
    };

    // Handle deleting goal
    const handleDeleteGoal = async (goalId) => {
        const confirmed = await confirm({
            title: 'Remove Goal',
            message: 'Are you sure you want to remove this daily goal?',
            confirmText: 'Remove',
            type: 'danger'
        });

        if (!confirmed) return;

        // Optimistic update
        setGoals(prev => prev.filter(g => g.id !== goalId));

        try {
            await deleteGoal(token, goalId);
        } catch (err) {
            console.error('Failed to delete goal:', err);
            loadGoalsData(true);
        }
    };

    // Category styling & icon metadata
    const getCategoryMeta = (category) => {
        switch (category) {
            case 'VIDEO':
                return {
                    badge: 'Course Lesson',
                    icon: Play,
                    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40',
                    btnText: 'Continue Lesson',
                    btnColor: 'bg-orange-500 hover:bg-orange-600 text-white'
                };
            case 'QUIZ':
                return {
                    badge: 'Concept Quiz',
                    icon: HelpCircle,
                    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
                    btnText: 'Take Quiz',
                    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
                };
            case 'STUDY_TIME':
                return {
                    badge: 'Focus Sprint',
                    icon: Clock,
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40',
                    btnText: 'Start Focus',
                    btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white'
                };
            case 'DISCOVER':
                return {
                    badge: 'Discover',
                    icon: Sparkles,
                    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
                    btnText: 'Browse Courses',
                    btnColor: 'bg-amber-500 hover:bg-amber-600 text-white'
                };
            default:
                return {
                    badge: 'Personal Target',
                    icon: Target,
                    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40',
                    btnText: null,
                    btnColor: null
                };
        }
    };

    const completedCount = goals.filter(g => g.is_completed).length;
    const totalCount = goals.length;
    const pendingCount = totalCount - completedCount;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const isAllComplete = totalCount > 0 && completedCount === totalCount;

    const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="w-full max-w-[1360px] mx-auto space-y-4 pb-28 px-3 sm:px-6 lg:px-8 pt-3">
            {/* ── Top Header ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                        <Target size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Daily Goals</h1>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                                Dynamic Sync
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{formattedDate} • Grounded in your courses</p>
                    </div>
                </div>

                <button
                    onClick={() => loadGoalsData(true)}
                    disabled={refreshing}
                    className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer"
                    title="Refresh Goals"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                </button>
            </div>

            {/* ── Quick Stats Row ───────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Total</span>
                    <span className="text-xl font-black text-gray-800 dark:text-white mt-0.5 block">{totalCount}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Achieved</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{completedCount}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Remaining</span>
                    <span className="text-xl font-black text-orange-500 mt-0.5 block">{pendingCount}</span>
                </div>
            </div>

            {/* ── Progress Card & Sweep Celebration ─────────────────────── */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                        <Trophy size={14} className="text-amber-500" />
                        Today's Progress
                    </span>
                    <span className="text-orange-500 text-sm font-black">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 h-2.5 rounded-full"
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </div>

                {isAllComplete && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-orange-500/10 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                <Award size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">Daily Sweep Unlocked!</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">All targets reached • +50 Bonus XP locked in</p>
                            </div>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm">
                            +50 XP
                        </span>
                    </motion.div>
                )}
            </div>

            {/* ── Goals Management & Dynamic List ───────────────────────── */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-4">
                {/* Form to add personal custom goal */}
                <form onSubmit={handleAddGoal} className="flex gap-2">
                    <input
                        type="text"
                        value={newGoalText}
                        onChange={(e) => setNewGoalText(e.target.value)}
                        placeholder="Add personal goal (e.g. Revise Chapter 3 notes)..."
                        className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newGoalText.trim() || submitting}
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0 text-sm"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
                        <span>Add</span>
                    </button>
                </form>

                {/* Goals List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                            <Loader2 size={28} className="animate-spin text-orange-500" />
                            <p className="text-xs font-semibold">Generating your dynamic goals...</p>
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center space-y-3">
                            <Target size={40} className="text-orange-500/20" />
                            <div className="space-y-1">
                                <p className="font-bold text-gray-600 dark:text-gray-300">No daily goals yet</p>
                                <p className="text-xs max-w-xs mx-auto">Set target achievements for today to hold yourself accountable!</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {goals.map((goal) => {
                                const meta = getCategoryMeta(goal.category);
                                const CategoryIcon = meta.icon;
                                const isActionable = Boolean(goal.action_url);

                                return (
                                    <motion.div
                                        key={goal.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={`group rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 ${
                                            goal.is_completed
                                                ? 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-100/60 dark:border-gray-700/60'
                                                : 'bg-white dark:bg-gray-800 border-orange-100/80 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/40 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            {/* Checkbox & Details */}
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <button
                                                    onClick={() => handleToggleGoal(goal)}
                                                    className={`mt-0.5 flex-shrink-0 transition-transform active:scale-90 cursor-pointer ${
                                                        goal.is_completed ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-orange-400'
                                                    }`}
                                                >
                                                    {goal.is_completed ? (
                                                        <CheckCircle2 size={22} className="fill-emerald-500/10 text-emerald-500" />
                                                    ) : (
                                                        <Circle size={22} />
                                                    )}
                                                </button>

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.color}`}>
                                                            <CategoryIcon size={11} />
                                                            {meta.badge}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                                                            <Flame size={11} />
                                                            +{goal.xp_reward || 20} XP
                                                        </span>
                                                    </div>

                                                    <h3 className={`text-sm font-bold tracking-tight transition-all ${
                                                        goal.is_completed 
                                                            ? 'line-through text-gray-400 dark:text-gray-500' 
                                                            : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                        {goal.title}
                                                    </h3>

                                                    {goal.description && (
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                                                            {goal.description}
                                                        </p>
                                                    )}

                                                    {/* Progress Gauge for Multi-Target Goals */}
                                                    {goal.target_value > 1 && (
                                                        <div className="pt-1.5 space-y-1">
                                                            <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                                                                <span>Progress</span>
                                                                <span className="font-bold text-gray-600 dark:text-gray-300">
                                                                    {goal.current_value} / {goal.target_value}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
                                                                <div 
                                                                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button & Delete Button */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isActionable && !goal.is_completed && meta.btnText && (
                                                    <button
                                                        onClick={() => navigate(goal.action_url)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer ${meta.btnColor}`}
                                                    >
                                                        <span>{meta.btnText}</span>
                                                        <ArrowUpRight size={13} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                                                    title="Remove Goal"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* ── Real Past Progress Section ────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-orange-50 dark:border-gray-700 pb-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-orange-500 w-4 h-4" />
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Past History</h2>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">PostgreSQL Verified</span>
                </div>

                <div className="space-y-2.5">
                    {history.length === 0 ? (
                        <p className="text-xs text-center py-4 text-gray-400 dark:text-gray-500">
                            Your past progress will automatically record here as you complete study days!
                        </p>
                    ) : (
                        history.map((dayData) => (
                            <div 
                                key={dayData.date} 
                                className="flex items-center justify-between gap-4 p-3 rounded-xl bg-orange-50/20 dark:bg-gray-900/30 border border-orange-100/10 dark:border-gray-700"
                            >
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{dayData.dateLabel}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                        {dayData.completed} / {dayData.total} Goals Completed
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${dayData.progress === 100 ? 'bg-emerald-500' : 'bg-orange-400'}`}
                                            style={{ width: `${dayData.progress}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-black w-8 text-right ${dayData.progress === 100 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {dayData.progress}%
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyGoalsPage;
