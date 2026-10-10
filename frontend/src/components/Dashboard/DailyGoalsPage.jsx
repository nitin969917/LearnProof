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
    ChevronLeft, 
    Clock, 
    Check 
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

    // ── Add Goal Input State (Pure & Clean - No Target Fields) ──
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

            // 2. Fetch history for graphs
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

    // ── Handle Adding Goal (Clean, No Target Fields) ──
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
                // Refresh history graph in background
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

    // ── Handle Toggling Goal ──
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
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const isAllComplete = totalCount > 0 && completedCount === totalCount;

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

    // ── Past 7 Days Strip for Date Selector ──
    const dateStrip = useMemo(() => {
        const list = [];
        const base = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(base);
            d.setDate(base.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            list.push({
                date: dateStr,
                dayShort: days[d.getDay()],
                dayNum: d.getDate(),
                isCurrentToday: dateStr === todayKey
            });
        }
        return list;
    }, [todayKey]);

    return (
        <div className="w-full max-w-[1360px] mx-auto space-y-4 pb-28 px-3 sm:px-6 lg:px-8 pt-3">
            {/* ── Top Header ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Daily Goals</h1>
                            {isToday ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                                    Today
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                    Past Archive
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {formattedSelectedDate} • Goals reset automatically at midnight
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* View Switcher Tabs */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700 text-xs font-bold">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'today'
                                    ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Target size={14} />
                            <span>Goals List</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'analytics'
                                    ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm'
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
                        className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-sm cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                </div>
            </div>

            {/* ── 7-Day Date Selector Strip (Browse other days easily) ──── */}
            <div className="bg-white dark:bg-gray-800 p-2.5 sm:p-3 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs flex items-center justify-between gap-1 overflow-x-auto">
                {dateStrip.map((item) => {
                    const isSelected = selectedDate === item.date;

                    return (
                        <button
                            key={item.date}
                            onClick={() => setSelectedDate(item.date)}
                            className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                isSelected
                                    ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-white border-orange-500 shadow-sm shadow-orange-500/30'
                                    : item.isCurrentToday
                                        ? 'bg-orange-50/50 dark:bg-gray-900/40 text-orange-500 border-orange-200 dark:border-orange-500/30 hover:border-orange-300'
                                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                        >
                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : ''}`}>
                                {item.dayShort}
                            </span>
                            <span className={`text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                {item.dayNum}
                            </span>
                            {item.isCurrentToday && !isSelected && (
                                <span className="w-1 h-1 rounded-full bg-orange-500 mt-0.5" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Overview Statistics Cards ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Total Goals</span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 block">{totalCount}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Achieved</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{completedCount}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">Completion</span>
                    <span className="text-xl sm:text-2xl font-black text-orange-500 mt-0.5 block">{progress}%</span>
                </div>
            </div>

            {/* ── Progress Bar Card ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Trophy size={14} className="text-amber-500" />
                        {isToday ? "Today's Progress" : `${formattedSelectedDate} Progress`}
                    </span>
                    <span className="text-orange-500 font-black">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Sweep celebration banner */}
            {isAllComplete && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                            <Award size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">Daily Sweep Unlocked!</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">All targets achieved for this day • +50 Bonus XP awarded</p>
                        </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500 text-white shadow-xs">
                        +50 XP
                    </span>
                </motion.div>
            )}

            {/* ── TAB 1: GOALS LIST (Clean, User-Friendly, No Target Fields) ── */}
            {activeTab === 'today' && (
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-4">
                    {/* Header with Title & Date Context */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div className="flex items-center gap-2">
                            <Target size={18} className="text-orange-500" />
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                {isToday ? "Your Goals for Today" : `Goals for ${formattedSelectedDate}`}
                            </h2>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400">
                            {completedCount} / {totalCount} Done
                        </span>
                    </div>

                    {/* Clean Goal Input (Shown for Today or Any Selected Date) */}
                    <form onSubmit={handleAddGoal} className="flex gap-2">
                        <input
                            type="text"
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            placeholder={isToday ? "Add a new goal for today..." : `Add a goal for ${formattedSelectedDate}...`}
                            className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!newGoalText.trim() || submitting}
                            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
                            <span>Add</span>
                        </button>
                    </form>

                    {/* Goals List */}
                    <div className="space-y-2.5 pt-1">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                                <Loader2 size={24} className="animate-spin text-orange-500" />
                                <p className="text-xs font-semibold">Loading goals...</p>
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center space-y-2">
                                <Target size={36} className="text-gray-300 dark:text-gray-600" />
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {isToday ? "No goals added for today yet" : `No goals recorded for ${formattedSelectedDate}`}
                                </p>
                                <p className="text-xs text-gray-400 max-w-xs">
                                    Type a goal above to stay organized and hold yourself accountable!
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {goals.map((goal) => (
                                    <motion.div
                                        key={goal.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        className={`group rounded-2xl border transition-all duration-200 p-3.5 flex items-center justify-between gap-3 ${
                                            goal.is_completed
                                                ? 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/60'
                                                : 'bg-white dark:bg-gray-800 border-orange-100/80 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/40 hover:shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => handleToggleGoal(goal)}
                                                className={`shrink-0 transition-transform active:scale-90 cursor-pointer ${
                                                    goal.is_completed ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-orange-500'
                                                }`}
                                            >
                                                {goal.is_completed ? (
                                                    <CheckCircle2 size={22} className="fill-emerald-500/10 text-emerald-500" />
                                                ) : (
                                                    <Circle size={22} />
                                                )}
                                            </button>

                                            {/* Goal Text */}
                                            <span className={`text-sm font-medium truncate transition-all ${
                                                goal.is_completed 
                                                    ? 'line-through text-gray-400 dark:text-gray-500' 
                                                    : 'text-gray-800 dark:text-gray-100'
                                            }`}>
                                                {goal.title}
                                            </span>

                                            <span className="text-[10px] font-bold text-amber-500 shrink-0">
                                                +20 XP
                                            </span>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer shrink-0"
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
            )}

            {/* ── TAB 2: PROGRESS GRAPH & ACCURATE HISTORY (0% if no goals) ─ */}
            {activeTab === 'analytics' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className="text-orange-500" />
                                    <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                                        Goal Completion Trend
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">Accurate completion percentage per day (0% on days without goals)</p>
                            </div>

                            {/* Range Selector */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-xs font-bold">
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
                                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                            historyRange === days
                                                ? 'bg-white dark:bg-gray-800 text-orange-500 shadow-xs'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {days} Days
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recharts Area Chart */}
                        <div className="h-64 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="goalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
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

                    {/* History Days Log List */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-orange-500" />
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                    Day-by-Day Breakdown
                                </h3>
                            </div>
                            <span className="text-[10px] text-gray-400">Click to view goals for that date</span>
                        </div>

                        <div className="space-y-2">
                            {historyData.slice(-7).reverse().map((day) => (
                                <div
                                    key={day.date}
                                    onClick={() => {
                                        setSelectedDate(day.date);
                                        setActiveTab('today');
                                    }}
                                    className="p-3 rounded-2xl bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-750 flex items-center justify-between gap-3 hover:border-orange-200 cursor-pointer transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                                                {day.dateLabel}
                                            </p>
                                            {day.isToday && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-600 rounded">
                                                    Today
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {day.total === 0 ? "0 goals set" : `${day.completed} / ${day.total} goals achieved`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
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
            <div className="bg-gray-900 text-white p-3 rounded-xl border border-gray-700 shadow-xl text-xs space-y-1">
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
