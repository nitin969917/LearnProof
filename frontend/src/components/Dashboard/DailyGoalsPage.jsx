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
    Play, 
    HelpCircle, 
    Clock, 
    Sparkles, 
    Flame, 
    ArrowUpRight, 
    Loader2, 
    RefreshCw,
    Award,
    BarChart2,
    TrendingUp,
    Check,
    Layers,
    Zap,
    X,
    Filter
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    fetchTodayGoals, 
    addGoal, 
    updateGoal, 
    toggleGoal, 
    deleteGoal, 
    fetchGoalHistory 
} from '../../api/goalApi';

const DailyGoalsPage = () => {
    const { user, token } = useAuth();
    const { confirm } = useModal();
    const navigate = useNavigate();

    // ── Navigation & View Mode ──
    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'analytics'
    const [historyRange, setHistoryRange] = useState(7); // 7 | 14 | 30 days
    const [selectedHistoryDay, setSelectedHistoryDay] = useState(null);

    // ── Goals State ──
    const [goals, setGoals] = useState([]);
    const [suggestedGoals, setSuggestedGoals] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [historyStats, setHistoryStats] = useState({
        currentStreak: 1,
        totalCompleted: 0,
        averageRate: 0
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Add Goal Form State ──
    const [newGoalText, setNewGoalText] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('CUSTOM');
    const [newGoalTarget, setNewGoalTarget] = useState(1);
    const [isAddingOpen, setIsAddingOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const clientDate = useMemo(() => new Date().toISOString().split('T')[0], []);

    // ── Fetch Today's Goals & Suggestions ──
    const loadGoalsData = useCallback(async (isSilent = false) => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            if (!isSilent) setLoading(true);
            else setRefreshing(true);

            // Fetch today's user goals & smart suggestions
            const todayRes = await fetchTodayGoals(token, clientDate);
            if (todayRes) {
                setGoals(todayRes.goals || []);
                setSuggestedGoals(todayRes.suggestedGoals || []);

                if (user?.uid) {
                    localStorage.setItem(`learnproof_cached_goals_${user.uid}`, JSON.stringify(todayRes.goals || []));
                }
            }

            // Fetch history & graph analytics
            const histRes = await fetchGoalHistory(token, historyRange, clientDate);
            if (histRes) {
                const historyList = histRes.history || [];
                setHistoryData(historyList);
                if (histRes.stats) {
                    setHistoryStats(histRes.stats);
                }
                if (historyList.length > 0 && !selectedHistoryDay) {
                    setSelectedHistoryDay(historyList[historyList.length - 1]);
                }
            }
        } catch (err) {
            console.error('Failed to load goals and history:', err);
            // Fallback to cache
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
    }, [token, user, clientDate, historyRange, selectedHistoryDay]);

    useEffect(() => {
        loadGoalsData();
    }, [loadGoalsData]);

    // Handle Range change for graph
    const handleRangeChange = async (days) => {
        setHistoryRange(days);
        if (!token) return;
        try {
            const histRes = await fetchGoalHistory(token, days, clientDate);
            if (histRes) {
                setHistoryData(histRes.history || []);
                if (histRes.stats) setHistoryStats(histRes.stats);
            }
        } catch (e) {
            console.error('Error fetching range history:', e);
        }
    };

    // ── Add Goal (Custom or from Suggestions) ──
    const handleAddCustomGoal = async (e) => {
        e?.preventDefault();
        if (!newGoalText.trim() || submitting) return;

        try {
            setSubmitting(true);
            const created = await addGoal(token, {
                title: newGoalText.trim(),
                category: newGoalCategory,
                target_value: newGoalTarget,
                date: clientDate
            });

            if (created) {
                setGoals(prev => [...prev, created]);
                setNewGoalText('');
                setNewGoalTarget(1);
                setIsAddingOpen(false);
            }
        } catch (err) {
            console.error('Failed to create goal:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddSuggestion = async (suggestion) => {
        try {
            setSubmitting(true);
            const created = await addGoal(token, {
                title: suggestion.title,
                category: suggestion.category,
                target_value: suggestion.target_value,
                description: suggestion.description,
                reference_id: suggestion.reference_id,
                action_url: suggestion.action_url,
                xp_reward: suggestion.xp_reward,
                date: clientDate
            });

            if (created) {
                setGoals(prev => [...prev, created]);
                // Remove from suggested list locally
                setSuggestedGoals(prev => prev.filter(s => s.title !== suggestion.title));
            }
        } catch (err) {
            console.error('Failed to add suggested goal:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Toggle Goal Completion ──
    const handleToggleGoal = async (goal) => {
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
            loadGoalsData(true);
        }
    };

    // ── Delete Goal ──
    const handleDeleteGoal = async (goalId) => {
        const confirmed = await confirm({
            title: 'Delete Goal',
            message: 'Are you sure you want to delete this goal?',
            confirmText: 'Delete',
            type: 'danger'
        });

        if (!confirmed) return;

        setGoals(prev => prev.filter(g => g.id !== goalId));

        try {
            await deleteGoal(token, goalId);
        } catch (err) {
            console.error('Failed to delete goal:', err);
            loadGoalsData(true);
        }
    };

    // ── Category Metadata ──
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
            case 'FLASHCARD':
                return {
                    badge: 'Memory Cards',
                    icon: Layers,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
                    btnText: 'Review Cards',
                    btnColor: 'bg-purple-600 hover:bg-purple-700 text-white'
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

    // ── Metric Calculations ──
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

    // Circular gauge calculations
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="w-full max-w-[1360px] mx-auto space-y-5 pb-28 px-3 sm:px-6 lg:px-8 pt-3">
            {/* ── Top Header & Tab Navigation ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Daily Goals & Mastery</h1>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                                Adaptive Sync
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formattedDate} • Your personalized daily habits</p>
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
                            <span>Today's Focus</span>
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
                            <span>History & Graphs</span>
                        </button>
                    </div>

                    <button
                        onClick={() => loadGoalsData(true)}
                        disabled={refreshing}
                        className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shadow-sm cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Hero Overview Bar with Circular Progress Ring ─────────── */}
            <div className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-850 p-4 sm:p-6 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Circular Progress Gauge */}
                    <div className="md:col-span-4 flex items-center gap-4">
                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-gray-100 dark:text-gray-700"
                                />
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke="url(#goalProgressGrad)"
                                    strokeWidth="8"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="goalProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#eab308" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                                    {progress}%
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-0.5">
                                    Progress
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-black text-orange-500 uppercase tracking-wider">
                                <Flame size={14} className="fill-orange-500 animate-pulse" />
                                <span>{historyStats.currentStreak || 1} Day Streak</span>
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5 tracking-tight">
                                {totalCount === 0 
                                    ? "Set your daily targets" 
                                    : isAllComplete 
                                        ? "All Daily Goals Complete! 🎉" 
                                        : `${completedCount} of ${totalCount} goals crushed`}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {totalCount === 0
                                    ? "Add a personal goal or tap a suggestion below to start."
                                    : `${pendingCount} target${pendingCount === 1 ? '' : 's'} remaining for today.`}
                            </p>
                        </div>
                    </div>

                    {/* Stat Badges */}
                    <div className="md:col-span-8 grid grid-cols-3 gap-2.5">
                        <div className="bg-white/90 dark:bg-gray-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-orange-100/60 dark:border-gray-700/60 shadow-xs">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Today's Goals</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white mt-0.5 block">{totalCount}</span>
                            <span className="text-[10px] text-gray-400">active targets</span>
                        </div>
                        <div className="bg-white/90 dark:bg-gray-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-100/60 dark:border-gray-700/60 shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Completed</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{completedCount}</span>
                            <span className="text-[10px] text-emerald-500/80">crushed today</span>
                        </div>
                        <div className="bg-white/90 dark:bg-gray-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-100/60 dark:border-gray-700/60 shadow-xs">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">7-Day Consistency</span>
                            <span className="text-2xl font-black text-amber-500 mt-0.5 block">{historyStats.averageRate || 0}%</span>
                            <span className="text-[10px] text-amber-500/80">average rate</span>
                        </div>
                    </div>
                </div>

                {/* Sweep Bonus Banner */}
                {isAllComplete && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-orange-500/15 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                                <Award size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">Daily Sweep Unlocked!</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">All daily targets reached • +50 Bonus XP locked into your profile</p>
                            </div>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500 text-white shadow-sm">
                            +50 XP
                        </span>
                    </motion.div>
                )}
            </div>

            {/* ── TAB 1: TODAY'S GOALS (User-Driven) ─────────────────────── */}
            {activeTab === 'today' && (
                <div className="space-y-4">
                    {/* Quick Add Bar / Drawer Toggle */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target size={17} className="text-orange-500" />
                                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                    Your Goals for Today
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsAddingOpen(!isAddingOpen)}
                                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <Plus size={15} />
                                <span>{isAddingOpen ? 'Close Creator' : 'Custom Goal'}</span>
                            </button>
                        </div>

                        {/* Custom Goal Creator Panel */}
                        <AnimatePresence>
                            {isAddingOpen && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleAddCustomGoal}
                                    className="pt-2 pb-1 border-t border-gray-100 dark:border-gray-700 space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={newGoalText}
                                            onChange={(e) => setNewGoalText(e.target.value)}
                                            placeholder="What is your goal for today (e.g. Revise Chapter 3, solve 5 PYQs)?"
                                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder-gray-400"
                                        />

                                        <div className="flex gap-2">
                                            <select
                                                value={newGoalCategory}
                                                onChange={(e) => setNewGoalCategory(e.target.value)}
                                                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none font-semibold cursor-pointer"
                                            >
                                                <option value="CUSTOM">Personal</option>
                                                <option value="VIDEO">Lesson</option>
                                                <option value="QUIZ">Quiz</option>
                                                <option value="STUDY_TIME">Focus</option>
                                            </select>

                                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 rounded-xl">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Target:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="180"
                                                    value={newGoalTarget}
                                                    onChange={(e) => setNewGoalTarget(e.target.value)}
                                                    className="w-12 bg-transparent text-center font-bold text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={!newGoalText.trim() || submitting}
                                                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                                            >
                                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                                <span>Save Goal</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {/* List of User's Actual Goals */}
                        <div className="space-y-3 pt-1">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <Loader2 size={26} className="animate-spin text-orange-500" />
                                    <p className="text-xs font-semibold">Loading your daily goals...</p>
                                </div>
                            ) : goals.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                        <Target size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">No daily goals set for today yet</p>
                                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                            Choose what you want to achieve today! Type your own goal above or tap one of the smart suggestions below.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsAddingOpen(true)}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        <span>Create a Goal</span>
                                    </button>
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
                                                className={`group rounded-2xl border transition-all duration-200 p-4 ${
                                                    goal.is_completed
                                                        ? 'bg-gray-50/80 dark:bg-gray-800/40 border-gray-100/70 dark:border-gray-700/60'
                                                        : 'bg-white dark:bg-gray-800 border-orange-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/40 hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    {/* Checkbox & Content */}
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <button
                                                            onClick={() => handleToggleGoal(goal)}
                                                            className={`mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer ${
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

                                                            {/* Target Progress Bar */}
                                                            {goal.target_value > 1 && (
                                                                <div className="pt-2 space-y-1">
                                                                    <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                                                                        <span>Progress</span>
                                                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                                                            {goal.current_value} / {goal.target_value}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
                                                                        <div 
                                                                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all duration-300"
                                                                            style={{ width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* CTA button & Delete Button */}
                                                    <div className="flex items-center gap-2 shrink-0">
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
                                                            title="Delete Goal"
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

                    {/* ── Smart Suggested Goals (User can 1-tap add to their goals) ── */}
                    {suggestedGoals.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-500" />
                                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                        Suggested for Your Courses
                                    </h3>
                                </div>
                                <span className="text-[10px] text-gray-400">Tap to add to today's goals</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {suggestedGoals.map((sug, idx) => {
                                    const meta = getCategoryMeta(sug.category);
                                    const Icon = meta.icon;

                                    return (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-2xl bg-orange-50/20 dark:bg-gray-900/40 border border-orange-100/60 dark:border-gray-700/60 flex items-center justify-between gap-3 group hover:border-orange-200 transition-all"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${meta.color}`}>
                                                        <Icon size={10} />
                                                        {meta.badge}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-amber-500">+{sug.xp_reward || 20} XP</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{sug.title}</p>
                                            </div>

                                            <button
                                                onClick={() => handleAddSuggestion(sug)}
                                                disabled={submitting}
                                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
                                            >
                                                <Plus size={13} />
                                                <span>Add</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: HISTORY & INTERACTIVE GRAPHS ────────────────────── */}
            {activeTab === 'analytics' && (
                <div className="space-y-5">
                    {/* Graph Controls & Header */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className="text-orange-500" />
                                    <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                                        Goal Completion & Learning Activity Trend
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">Real historical completion verified across your study sessions</p>
                            </div>

                            {/* Range Selector */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-xs font-bold">
                                {[7, 14, 30].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => handleRangeChange(days)}
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

                        {/* ── Recharts Interactive Area Chart ──────────────────────── */}
                        <div className="h-64 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaProgressGrad" x1="0" y1="0" x2="0" y2="1">
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
                                        fill="url(#areaProgressGrad)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── 7-Day Consistency Heatmap / Pill Strip ────────────────── */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-orange-500" />
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                    Day-by-Day Activity Inspector
                                </h3>
                            </div>
                            <span className="text-[10px] text-gray-400 font-semibold">Click a day to inspect</span>
                        </div>

                        {/* Interactive Pill Strip */}
                        <div className="grid grid-cols-7 gap-2">
                            {historyData.slice(-7).map((day) => {
                                const isSelected = selectedHistoryDay?.date === day.date;

                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => setSelectedHistoryDay(day)}
                                        className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                                            isSelected
                                                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-102'
                                                : day.progress >= 100
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                                                    : day.hasActivity
                                                        ? 'bg-orange-50/40 dark:bg-gray-900/40 text-orange-500 border-orange-200 dark:border-gray-700'
                                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : ''}`}>
                                            {day.dayShort}
                                        </span>
                                        <span className={`text-sm font-black ${isSelected ? 'text-white' : ''}`}>
                                            {day.dayNumber}
                                        </span>
                                        {day.progress >= 100 ? (
                                            <Flame size={12} className={isSelected ? 'text-white fill-white' : 'text-emerald-500 fill-emerald-500'} />
                                        ) : (
                                            <span className={`text-[9px] font-bold ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                {day.progress}%
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected Day Breakdown Card */}
                        {selectedHistoryDay && (
                            <motion.div
                                key={selectedHistoryDay.date}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-4 rounded-2xl bg-orange-50/30 dark:bg-gray-900/50 border border-orange-100 dark:border-gray-700 space-y-2.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black text-gray-900 dark:text-white">
                                            {selectedHistoryDay.dateLabel}
                                        </span>
                                        <span className="text-[11px] text-gray-400 ml-2">
                                            {selectedHistoryDay.completed} / {selectedHistoryDay.total} Goals Achieved
                                        </span>
                                    </div>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                                        selectedHistoryDay.progress === 100 
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' 
                                            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40'
                                    }`}>
                                        {selectedHistoryDay.progress}% Completed
                                    </span>
                                </div>

                                {/* Activities Logged on that day */}
                                {selectedHistoryDay.activities && selectedHistoryDay.activities.length > 0 ? (
                                    <div className="space-y-1.5 pt-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Verified Learning Activities:
                                        </p>
                                        <div className="space-y-1">
                                            {selectedHistoryDay.activities.map((act, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                                    <Check size={12} className="text-emerald-500 shrink-0" />
                                                    <span className="truncate">{act}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-gray-400 italic">No specific activities logged on this date.</p>
                                )}
                            </motion.div>
                        )}
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
                <div className="flex items-center gap-2 font-black text-orange-400 text-sm">
                    <TrendingUp size={14} />
                    <span>{data.progress}% Completed</span>
                </div>
                <p className="text-[10px] text-gray-400">
                    {data.completed} of {data.total} targets achieved
                </p>
            </div>
        );
    }
    return null;
};

export default DailyGoalsPage;
