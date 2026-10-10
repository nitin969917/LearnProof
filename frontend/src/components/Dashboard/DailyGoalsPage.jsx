import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Target, 
    CheckCircle2, 
    Circle, 
    Plus, 
    Trash2, 
    Trophy, 
    Calendar, 
    ChevronRight, 
    Flame, 
    Loader2, 
    RefreshCw, 
    Award, 
    BarChart2, 
    TrendingUp, 
    Sparkles, 
    Zap, 
    Check, 
    ArrowRight 
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    fetchTodayGoals, 
    addGoal, 
    toggleGoal, 
    deleteGoal, 
    fetchGoalHistory 
} from '../../api/goalApi';

const DailyGoalsPage = () => {
    const { user, token } = useAuth();
    const { confirm } = useModal();

    // ── Current Dates ──
    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [selectedDate, setSelectedDate] = useState(todayKey);
    const isToday = selectedDate === todayKey;

    // ── Navigation & View ──
    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'analytics'
    const [historyRange, setHistoryRange] = useState(7); // 7 | 14 | 30 days

    // ── Data States ──
    const [goals, setGoals] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [historyStats, setHistoryStats] = useState({
        currentStreak: 0,
        totalCompleted: 0,
        averageRate: 0
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Add Goal Input State ──
    const [newGoalText, setNewGoalText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ── Load Goals for Selected Date & History ──
    const loadData = useCallback(async (isSilent = false) => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            if (!isSilent) setLoading(true);
            else setRefreshing(true);

            // 1. Fetch goals for the selected date
            const goalsRes = await fetchTodayGoals(token, selectedDate);
            if (goalsRes) {
                setGoals(goalsRes.goals || []);
                if (isToday && user?.uid) {
                    localStorage.setItem(`learnproof_cached_goals_${user.uid}`, JSON.stringify(goalsRes.goals || []));
                }
            }

            // 2. Fetch history for graphs and date indicators
            const histRes = await fetchGoalHistory(token, historyRange, todayKey);
            if (histRes) {
                setHistoryData(histRes.history || []);
                if (histRes.stats) {
                    setHistoryStats(histRes.stats);
                }
            }
        } catch (err) {
            console.error('Failed to load goals:', err);
            if (isToday && user?.uid) {
                const cached = localStorage.getItem(`learnproof_cached_goals_${user.uid}`);
                if (cached) {
                    try { setGoals(JSON.parse(cached)); } catch (_) {}
                }
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, user, selectedDate, todayKey, isToday, historyRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Handle Adding Goal ──
    const handleAddGoal = async (e) => {
        e?.preventDefault();
        if (!newGoalText.trim() || submitting) return;

        const textToAdd = newGoalText.trim();
        setNewGoalText('');

        try {
            setSubmitting(true);
            const created = await addGoal(token, {
                title: textToAdd,
                date: selectedDate
            });

            if (created) {
                setGoals(prev => [...prev, created]);
                // Refresh history in background
                fetchGoalHistory(token, historyRange, todayKey).then(histRes => {
                    if (histRes) {
                        setHistoryData(histRes.history || []);
                        if (histRes.stats) setHistoryStats(histRes.stats);
                    }
                }).catch(() => {});
            }
        } catch (err) {
            console.error('Failed to add goal:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Handle Toggling Goal (Whole Card Clickable!) ──
    const handleToggleGoal = async (goal) => {
        const nextCompleted = !goal.is_completed;
        const nextCurrent = nextCompleted ? 1 : 0;

        setGoals(prev => prev.map(g => 
            g.id === goal.id 
                ? { ...g, is_completed: nextCompleted, current_value: nextCurrent }
                : g
        ));

        try {
            const updated = await toggleGoal(token, goal.id);
            if (updated) {
                setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
                // Update history graph
                fetchGoalHistory(token, historyRange, todayKey).then(histRes => {
                    if (histRes) {
                        setHistoryData(histRes.history || []);
                        if (histRes.stats) setHistoryStats(histRes.stats);
                    }
                }).catch(() => {});
            }
        } catch (err) {
            console.error('Failed to toggle goal:', err);
            loadData(true);
        }
    };

    // ── Handle Deleting Goal ──
    const handleDeleteGoal = async (goalId) => {
        const confirmed = await confirm({
            title: 'Delete Goal',
            message: 'Are you sure you want to remove this goal?',
            confirmText: 'Delete',
            type: 'danger'
        });

        if (!confirmed) return;

        setGoals(prev => prev.filter(g => g.id !== goalId));

        try {
            await deleteGoal(token, goalId);
            fetchGoalHistory(token, historyRange, todayKey).then(histRes => {
                if (histRes) {
                    setHistoryData(histRes.history || []);
                    if (histRes.stats) setHistoryStats(histRes.stats);
                }
            }).catch(() => {});
        } catch (err) {
            console.error('Failed to delete goal:', err);
            loadData(true);
        }
    };

    // ── Metric Calculations ──
    const completedCount = goals.filter(g => g.is_completed).length;
    const totalCount = goals.length;
    const pendingCount = totalCount - completedCount;
    // CRITICAL: 0% if no goals, never 100%
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const isAllComplete = totalCount > 0 && completedCount === totalCount;
    const earnedXpToday = (completedCount * 20) + (isAllComplete ? 50 : 0);

    // Readable date for current viewing date
    const formattedSelectedDate = useMemo(() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    }, [selectedDate]);

    // ── Past 7 Days Strip for Date Selector (with dynamic completion dot) ──
    const dateStrip = useMemo(() => {
        const list = [];
        const base = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(base);
            d.setDate(base.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            const histItem = historyData.find(h => h.date === dateStr);
            const dayProgress = histItem ? histItem.progress : (dateStr === selectedDate ? progress : 0);
            const hasGoals = histItem ? histItem.total > 0 : (dateStr === selectedDate ? totalCount > 0 : false);

            list.push({
                date: dateStr,
                dayShort: days[d.getDay()],
                dayNum: d.getDate(),
                isCurrentToday: dateStr === todayKey,
                hasGoals,
                isCompleted: hasGoals && dayProgress === 100
            });
        }
        return list;
    }, [todayKey, historyData, selectedDate, progress, totalCount]);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-5 pb-28 px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
            {/* ── Top Header Bar ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0">
                        <Target size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Daily Goals
                            </h1>
                            {isToday ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                                    Today
                                </span>
                            ) : (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                    Past Archive
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formattedSelectedDate} • Goals reset automatically at midnight
                        </p>
                    </div>
                </div>

                {/* Right controls: View Toggle & Refresh */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800/90 rounded-2xl border border-gray-200/60 dark:border-gray-700/80 text-xs font-bold">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'today'
                                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Target size={14} />
                            <span>Goals List</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'analytics'
                                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <BarChart2 size={14} />
                            <span>Progress Graph</span>
                        </button>
                    </div>

                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-xs cursor-pointer"
                        title="Refresh goals"
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                </div>
            </div>

            {/* ── TAB 1: GOALS VIEW (Balanced Desktop 2-Column Layout + Responsive Mobile) ── */}
            {activeTab === 'today' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
                    
                    {/* ── LEFT / MAIN COLUMN (Date Strip + Goals Card) ── */}
                    <div className="lg:col-span-8 space-y-4">
                        
                        {/* 7-Day Date Ribbon */}
                        <div className="bg-white dark:bg-gray-800/90 p-2 sm:p-2.5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                            <div className="flex items-center justify-between gap-1 sm:gap-2">
                                {dateStrip.map((item) => {
                                    const isSelected = selectedDate === item.date;

                                    return (
                                        <button
                                            key={item.date}
                                            onClick={() => setSelectedDate(item.date)}
                                            className={`flex-1 min-w-[42px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                                isSelected
                                                    ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-white border-orange-500 shadow-sm shadow-orange-500/25 ring-2 ring-orange-400/20'
                                                    : item.isCurrentToday
                                                        ? 'bg-orange-50/60 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 hover:border-orange-300'
                                                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-white' : ''}`}>
                                                {item.dayShort}
                                            </span>
                                            <span className={`text-sm sm:text-base font-black mt-0.5 ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {item.dayNum}
                                            </span>
                                            
                                            {/* Micro Indicator: Completed or Today */}
                                            <div className="h-1.5 flex items-center justify-center mt-0.5">
                                                {isSelected ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                                                ) : item.isCompleted ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="All goals completed" />
                                                ) : item.isCurrentToday ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Today" />
                                                ) : item.hasGoals ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Past Archive Notice Banner (Only shown if viewing another day) */}
                        {!isToday && (
                            <motion.div 
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-700/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                                    <Calendar size={16} className="text-amber-500 shrink-0" />
                                    <span>Viewing past goals archive for <strong>{formattedSelectedDate}</strong></span>
                                </div>
                                <button
                                    onClick={() => setSelectedDate(todayKey)}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shrink-0"
                                >
                                    Back to Today
                                </button>
                            </motion.div>
                        )}

                        {/* ── Mobile Progress Widget (Shown on mobile screens < lg) ── */}
                        <div className="block lg:hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-3.5 shadow-xs space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                    <Trophy size={14} className="text-amber-500" />
                                    <span>{progress}% Completed</span>
                                </span>
                                <span className="text-gray-400 font-medium">
                                    {completedCount} / {totalCount} Goals
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {/* ── Main Goals Card ── */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs sm:shadow-sm p-4 sm:p-6 space-y-4">
                            
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    <h2 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">
                                        {isToday ? "Today's Focus Targets" : `Goals for ${formattedSelectedDate}`}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                        isAllComplete 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40'
                                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30'
                                    }`}>
                                        {completedCount} / {totalCount} Done
                                    </span>
                                </div>
                            </div>

                            {/* Clean Goal Input Bar */}
                            <form onSubmit={handleAddGoal} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newGoalText}
                                    onChange={(e) => setNewGoalText(e.target.value)}
                                    placeholder={isToday ? "What's your goal for today? (e.g. Complete Quiz 3, Revise Topic)..." : `Add a goal for ${formattedSelectedDate}...`}
                                    className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!newGoalText.trim() || submitting}
                                    className="px-5 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-40 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
                                    <span>Add Goal</span>
                                </button>
                            </form>

                            {/* Goals List (Whole row is clickable!) */}
                            <div className="space-y-2.5 pt-1">
                                {loading ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                                        <Loader2 size={24} className="animate-spin text-orange-500" />
                                        <p className="text-xs font-semibold">Loading goals...</p>
                                    </div>
                                ) : goals.length === 0 ? (
                                    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700/80 flex flex-col items-center justify-center space-y-2.5">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center">
                                            <Target size={26} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {isToday ? "No goals set for today yet" : `No goals recorded for ${formattedSelectedDate}`}
                                        </p>
                                        <p className="text-xs text-gray-400 max-w-sm">
                                            Type a learning objective above and click Add Goal to keep yourself on track and earn XP!
                                        </p>
                                    </div>
                                ) : (
                                    <AnimatePresence initial={false}>
                                        {goals.map((goal) => (
                                            <motion.div
                                                key={goal.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                onClick={() => handleToggleGoal(goal)}
                                                className={`group rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none ${
                                                    goal.is_completed
                                                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-200'
                                                        : 'bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/40 hover:shadow-xs hover:bg-orange-50/30 dark:hover:bg-gray-750/50'
                                                }`}
                                            >
                                                {/* Left side: Interactive Check Indicator + Title + XP */}
                                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                    {/* Checkbox Icon */}
                                                    <div className="shrink-0 transition-transform active:scale-90">
                                                        {goal.is_completed ? (
                                                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs shadow-emerald-500/30">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-orange-500 transition-colors">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-orange-400/40 transition-colors" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Goal Title */}
                                                    <span className={`text-sm sm:text-base font-medium break-words flex-1 transition-all ${
                                                        goal.is_completed 
                                                            ? 'line-through text-gray-400 dark:text-gray-500' 
                                                            : 'text-gray-800 dark:text-gray-100'
                                                    }`}>
                                                        {goal.title}
                                                    </span>

                                                    {/* XP Badge */}
                                                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0 flex items-center gap-1">
                                                        <Zap size={11} className="text-amber-500 fill-amber-500" />
                                                        <span>+20 XP</span>
                                                    </span>
                                                </div>

                                                {/* Right side: Delete Button (Stops propagation so row doesn't toggle) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteGoal(goal.id);
                                                    }}
                                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all cursor-pointer shrink-0"
                                                    title="Delete Goal"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT / SIDEBAR COLUMN (Desktop Stats, Circular Ring & Streak) ── */}
                    <div className="lg:col-span-4 space-y-4">
                        
                        {/* 1. Circular Progress Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs sm:shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Day Overview
                                </h3>
                                <span className="text-[11px] font-bold text-orange-500">
                                    {isToday ? "Today" : formattedSelectedDate}
                                </span>
                            </div>

                            {/* Circular Gauge */}
                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="relative w-36 h-36 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        {/* Background Track */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-gray-100 dark:text-gray-700"
                                        />
                                        {/* Progress Ring */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            stroke="url(#progressGrad)"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={251.3}
                                            strokeDashoffset={251.3 - (progress / 100) * 251.3}
                                            strokeLinecap="round"
                                            className="transition-all duration-700 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#f59e0b" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Inside Ring Label */}
                                    <div className="absolute flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {progress}%
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                            Completed
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Metric Pills */}
                            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/80">
                                <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 text-center">
                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Total</span>
                                    <span className="text-base font-black text-gray-800 dark:text-gray-100">{totalCount}</span>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Done</span>
                                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{completedCount}</span>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 text-center">
                                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 block uppercase">XP</span>
                                    <span className="text-base font-black text-orange-600 dark:text-orange-400">+{earnedXpToday}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Daily Sweep Unlock Status Card */}
                        <div className={`p-4 rounded-3xl border transition-all ${
                            isAllComplete 
                                ? 'bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border-emerald-300 dark:border-emerald-700/50'
                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                                    isAllComplete ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                }`}>
                                    <Award size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <span>Daily Sweep Reward</span>
                                        {isAllComplete && <span className="text-[10px] text-emerald-500 font-bold">Unlocked!</span>}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                        {isAllComplete 
                                            ? "All daily goals achieved! +50 Bonus XP locked in."
                                            : "Complete all targets for this day to earn +50 Bonus XP."
                                        }
                                    </p>
                                </div>
                                <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                                    isAllComplete 
                                        ? 'bg-emerald-500 text-white shadow-xs' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                    +50 XP
                                </span>
                            </div>
                        </div>

                        {/* 3. Consistency Streak & Quick Analytics Teaser */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-500">
                                        <Flame size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white">Learning Streak</p>
                                        <p className="text-[10px] text-gray-400">Consistency pays off</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-orange-500 flex items-center gap-1">
                                    <span>{historyStats.currentStreak}</span>
                                    <span className="text-xs font-bold text-gray-400">Days</span>
                                </span>
                            </div>

                            <button
                                onClick={() => setActiveTab('analytics')}
                                className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-orange-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-200/60 dark:border-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <BarChart2 size={14} />
                                <span>View Progress Graph & Analytics</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ── TAB 2: PROGRESS GRAPH & HISTORICAL ANALYTICS (0% if no goals) ── */}
            {activeTab === 'analytics' && (
                <div className="space-y-5">
                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center shrink-0">
                                <Flame size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Streak</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{historyStats.currentStreak} Days</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center shrink-0">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Completed</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{historyStats.totalCompleted} Goals</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center shrink-0">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Average Rate</span>
                                <span className="text-xl font-black text-amber-600 dark:text-amber-400">{historyStats.averageRate}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Recharts Area Chart Card */}
                    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/80 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} className="text-orange-500" />
                                    <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                        Goal Completion Trend
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">Accurate completion percentage per day (0% on days with no goals)</p>
                            </div>

                            {/* Range Selector */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
                                {[7, 14, 30].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => {
                                            setHistoryRange(days);
                                            fetchGoalHistory(token, days, todayKey).then(res => {
                                                if (res) {
                                                    setHistoryData(res.history || []);
                                                    if (res.stats) setHistoryStats(res.stats);
                                                }
                                            });
                                        }}
                                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                            historyRange === days
                                                ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {days} Days
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recharts Area Chart */}
                        <div className="h-72 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="goalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                                    <XAxis 
                                        dataKey="dayShort" 
                                        tickLine={false} 
                                        axisLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <YAxis 
                                        domain={[0, 100]} 
                                        ticks={[0, 25, 50, 75, 100]}
                                        tickLine={false} 
                                        axisLine={false} 
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="progress" 
                                        stroke="#f97316" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#goalAreaGrad)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Day-by-Day Historical Breakdown */}
                    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-orange-500" />
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                    Day-by-Day Activity Inspector
                                </h3>
                            </div>
                            <span className="text-[11px] text-gray-400">Click any day to inspect or manage its goals</span>
                        </div>

                        <div className="space-y-2">
                            {historyData.slice(-10).reverse().map((day) => (
                                <div
                                    key={day.date}
                                    onClick={() => {
                                        setSelectedDate(day.date);
                                        setActiveTab('today');
                                    }}
                                    className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-750 flex items-center justify-between gap-3 hover:border-orange-200 dark:hover:border-orange-500/30 cursor-pointer transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100">
                                                {day.dateLabel}
                                            </p>
                                            {day.isToday && (
                                                <span className="text-[10px] font-bold px-2 py-0.2 bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-full">
                                                    Today
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {day.total === 0 ? "0 goals set" : `${day.completed} / ${day.total} goals achieved`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${day.progress === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                style={{ width: `${day.progress}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-black w-9 text-right ${
                                            day.progress === 100 ? 'text-emerald-500' : day.progress > 0 ? 'text-orange-500' : 'text-gray-400'
                                        }`}>
                                            {day.progress}%
                                        </span>
                                        <ChevronRight size={14} className="text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Custom Tooltip for Recharts ──
const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gray-900 text-white p-3 rounded-2xl border border-gray-700 shadow-xl text-xs space-y-1">
                <p className="font-bold text-gray-300">{data.dateLabel}</p>
                <p className="font-black text-orange-400 text-sm">
                    {data.progress}% Completed
                </p>
                <p className="text-[10px] text-gray-400">
                    {data.total === 0 ? "No goals recorded" : `${data.completed} of ${data.total} goals achieved`}
                </p>
            </div>
        );
    }
    return null;
};

export default DailyGoalsPage;
