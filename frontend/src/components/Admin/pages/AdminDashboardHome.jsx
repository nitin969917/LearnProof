import React, { useState, useEffect, useTransition } from 'react';
import { 
    Users, Video, Lightbulb, Award, Activity, Star, TrendingUp, 
    Smartphone, Monitor, Globe, Share2, Flame, BookOpen, Clock, 
    ArrowUpRight, ArrowDownRight, RefreshCw, Layers, CheckCircle2,
    Calendar, Sparkles, ChevronRight, BarChart2, PieChart as PieChartIcon
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const MetricCard = ({ title, value, subtitle, icon, growth, badge, color, bgLight, bgDark }) => {
    const isPositive = growth && growth.startsWith('+');
    const isZero = growth && growth === '0%';

    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} ${bgLight} dark:${bgDark} bg-opacity-15 dark:bg-opacity-20`}>
                    {icon}
                </div>
                {growth !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                        isZero 
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                            : isPositive 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                        {isPositive ? <ArrowUpRight size={14} /> : !isZero ? <ArrowDownRight size={14} /> : null}
                        <span>{growth}</span>
                    </div>
                )}
                {badge && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                        {badge}
                    </span>
                )}
            </div>
            
            <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{value}</h3>
                {subtitle && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl p-3 text-xs min-w-[160px]">
                <p className="font-semibold text-slate-300 pb-1.5 border-b border-slate-700/60 mb-2">
                    {label}
                </p>
                <div className="space-y-1.5">
                    {payload.map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}:
                            </span>
                            <span className="font-bold text-white">{item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const AdminDashboardHome = () => {
    const [stats, setStats] = useState(null);
    const [activeUsers, setActiveUsers] = useState(null);
    const [deviceStats, setDeviceStats] = useState(null);
    const [acquisition, setAcquisition] = useState(null);
    const [topLearners, setTopLearners] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    
    // Time-series & Chart states
    const [chartData, setChartData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [selectedRange, setSelectedRange] = useState('30d');
    const [chartView, setChartView] = useState('users'); // 'users', 'learning', 'hourly'
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { token } = useAuth();

    const fetchOverviewStats = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/stats`, { headers });
            
            setStats(res.data.stats);
            setActiveUsers(res.data.activeUsers);
            setDeviceStats(res.data.deviceStats);
            setAcquisition(res.data.acquisition);
            setTopLearners(res.data.topLearners || []);
            setRecentActivity(res.data.recentActivity || []);
        } catch (err) {
            console.error("Failed to fetch dashboard stats", err);
            toast.error("Failed to load dashboard metrics");
        }
    };

    const fetchAnalyticsTimeline = async (range) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/analytics?range=${range}`, { headers });
            setChartData(res.data.growthChart || []);
            setHourlyData(res.data.hourlyDistribution || []);
        } catch (err) {
            console.error("Failed to fetch analytics timeline", err);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchOverviewStats(),
            fetchAnalyticsTimeline(selectedRange)
        ]);
        setLoading(false);
    };

    useEffect(() => {
        if (token) {
            loadAllData();
            // Silent polling for live telemetry & active users every 15 seconds
            const interval = setInterval(() => {
                fetchOverviewStats();
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const handleRangeChange = (range) => {
        setSelectedRange(range);
        startTransition(async () => {
            await fetchAnalyticsTimeline(range);
        });
    };

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchOverviewStats(),
            fetchAnalyticsTimeline(selectedRange)
        ]);
        setRefreshing(false);
        toast.success("Metrics refreshed with latest telemetry");
    };

    if (loading) {
        return (
            <div className="flex flex-col h-96 items-center justify-center gap-3">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Platform Telemetry & Insights...</p>
            </div>
        );
    }

    if (!stats) return null;

    // Stickiness description helper
    const getStickinessBadge = (ratio) => {
        if (ratio >= 40) return { label: 'High Engagement 🔥', color: 'text-emerald-500' };
        if (ratio >= 20) return { label: 'Healthy Retention ✨', color: 'text-blue-500' };
        return { label: 'Developing Cohort 📈', color: 'text-amber-500' };
    };

    const stickinessMeta = getStickinessBadge(activeUsers?.stickinessRatio || 0);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Command Center Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-500/5 dark:via-transparent p-6 rounded-3xl border border-orange-500/15 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Live Telemetry System</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Platform Analytics & Insights
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Real-time active user cohorts, learning velocity, and platform engagement intelligence.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-sm">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>
                            <strong className="text-slate-900 dark:text-white font-extrabold">{(activeUsers?.activeNow || 1).toLocaleString()}</strong> Online Now
                        </span>
                    </div>

                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-sm hover:border-orange-500/40 hover:text-orange-600 transition-all duration-200"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                        <span>Refresh Metrics</span>
                    </button>
                </div>
            </div>

            {/* SECTION 1: Active User Engagement Cohorts (Active Now / DAU / WAU / MAU / Stickiness) */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="text-orange-500" size={18} />
                        Active User Retention & Cohorts
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">Updated every session & live heartbeat</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Live Active Now Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 rounded-2xl p-5 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60">
                                <Activity size={24} />
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                LIVE
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active Right Now</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                                {(activeUsers?.activeNow || 1).toLocaleString()}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time online users</p>
                        </div>
                    </div>

                    <MetricCard
                        title="Daily Active Users (DAU)"
                        value={(activeUsers?.dau || 0).toLocaleString()}
                        growth={activeUsers?.dauGrowth}
                        subtitle="Active in last 24 hours"
                        icon={<Flame size={24} className="text-orange-500" />}
                        color="text-orange-500"
                        bgLight="bg-orange-50"
                        bgDark="bg-orange-950"
                    />

                    <MetricCard
                        title="Weekly Active Users (WAU)"
                        value={(activeUsers?.wau || 0).toLocaleString()}
                        growth={activeUsers?.wauGrowth}
                        subtitle="Active in past 7 days"
                        icon={<TrendingUp size={24} className="text-blue-500" />}
                        color="text-blue-500"
                        bgLight="bg-blue-50"
                        bgDark="bg-blue-950"
                    />

                    <MetricCard
                        title="Monthly Active Users (MAU)"
                        value={(activeUsers?.mau || 0).toLocaleString()}
                        growth={activeUsers?.mauGrowth}
                        subtitle="Active in past 30 days"
                        icon={<Users size={24} className="text-purple-500" />}
                        color="text-purple-500"
                        bgLight="bg-purple-50"
                        bgDark="bg-purple-950"
                    />

                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
                                <Sparkles size={24} />
                            </div>
                            <span className={`text-xs font-bold ${stickinessMeta.color}`}>
                                {stickinessMeta.label}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stickiness (DAU/MAU)</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {activeUsers?.stickinessRatio || 0}%
                                </h3>
                                <span className="text-xs text-slate-400">frequency</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, activeUsers?.stickinessRatio || 0)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Platform Total Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered</p>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{stats.totalUsers.toLocaleString()}</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Watch Time</p>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{stats.totalWatchHours} hrs</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Lightbulb size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quizzes Passed</p>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{stats.passedQuizzesCount} ({stats.quizPassRate}%)</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Award size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certificates</p>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{stats.totalCertificates.toLocaleString()}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Interactive Time-Series Analytics with Tab Switcher */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
                        <button
                            onClick={() => setChartView('users')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                chartView === 'users'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Users size={14} />
                            <span>Active Users & Growth</span>
                        </button>
                        <button
                            onClick={() => setChartView('learning')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                chartView === 'learning'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <BarChart2 size={14} />
                            <span>Learning Velocity</span>
                        </button>
                        <button
                            onClick={() => setChartView('hourly')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                chartView === 'hourly'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Clock size={14} />
                            <span>24h Peak Study Hours</span>
                        </button>
                    </div>

                    {/* Time Range Pills (7d, 30d, 90d, 1y) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-fit self-end lg:self-auto">
                        {[
                            { key: '7d', label: '7D' },
                            { key: '30d', label: '30D' },
                            { key: '90d', label: '90D' },
                            { key: '1y', label: '1Y' }
                        ].map(pill => (
                            <button
                                key={pill.key}
                                onClick={() => handleRangeChange(pill.key)}
                                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                                    selectedRange === pill.key
                                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Dynamic Chart Rendering */}
                <div className="h-80 w-full">
                    {chartView === 'users' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="activeUsersGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="newUsersGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                    }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip content={<CustomChartTooltip />} />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} 
                                />
                                <Area
                                    type="monotone"
                                    dataKey="activeUsers"
                                    name="Daily Active Users"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#activeUsersGrad)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="newUsers"
                                    name="New Signups"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#newUsersGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}

                    {chartView === 'learning' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                    }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip content={<CustomChartTooltip />} />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} 
                                />
                                <Bar dataKey="quizzesAttempted" name="Quizzes Taken" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="videosCompleted" name="Videos Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="certificatesIssued" name="Certificates Issued" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {chartView === 'hourly' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip content={<CustomChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="events"
                                    name="Active Interactions"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#hourlyGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* SECTION 4: Platform Intelligence Widgets (Device Distribution & Referral Funnel) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Device & Platform Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Monitor className="text-blue-500" size={18} />
                                Platforms & Ecosystem
                            </h3>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold">
                                {deviceStats?.totalSubscribers || 0} Clients
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                            Client environment and push notification receiver distribution.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                        <Globe size={14} className="text-sky-500" /> Web Browser
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-bold">{deviceStats?.deviceMap?.web || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-sky-500 h-full rounded-full" style={{ width: '65%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                        <Smartphone size={14} className="text-emerald-500" /> Mobile / Android TWA
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-bold">
                                        {(deviceStats?.deviceMap?.twa || 0) + (deviceStats?.deviceMap?.android || 0)}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                        <Monitor size={14} className="text-purple-500" /> Desktop Apps (macOS / Win)
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-bold">{deviceStats?.deviceMap?.desktop || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '10%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-500">
                        <span>Total App Launches</span>
                        <span className="font-bold text-slate-800 dark:text-white">{deviceStats?.appLaunchesCount?.toLocaleString() || 0}</span>
                    </div>
                </div>

                {/* Campus Ambassador & Referral Funnel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Share2 className="text-orange-500" size={18} />
                                Acquisition & Referrals
                            </h3>
                            <Link 
                                to="/admin/referrals" 
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-0.5"
                            >
                                Manage <ChevronRight size={14} />
                            </Link>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                            Breakdown between Campus Ambassador referrals and organic platform signups.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Referred Signups</p>
                                <h4 className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
                                    {acquisition?.referredUsers || 0}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{acquisition?.referredPercent || 0}% of all users</p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Organic Signups</p>
                                <h4 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                    {acquisition?.organicUsers || 0}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{100 - (acquisition?.referredPercent || 0)}% direct</p>
                            </div>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full flex overflow-hidden">
                            <div 
                                className="bg-orange-500 h-full transition-all" 
                                style={{ width: `${acquisition?.referredPercent || 0}%` }} 
                                title="Referred Users"
                            />
                            <div 
                                className="bg-blue-500 h-full transition-all" 
                                style={{ width: `${100 - (acquisition?.referredPercent || 0)}%` }} 
                                title="Organic Users"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-500">
                        <span>Active Ambassador Codes</span>
                        <span className="font-bold text-slate-800 dark:text-white">{stats.activeCampaignsCount || 0}</span>
                    </div>
                </div>

                {/* AI Workspaces & Notes Knowledge Engine */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="text-emerald-500" size={18} />
                                Knowledge & AI Engine
                            </h3>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                                AI Ecosystem
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                            Student study tools, generated AI summaries, and workspace notes.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                    <Layers size={16} className="text-emerald-500" />
                                    Study Workspaces Created
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.totalWorkspaces || 0}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                    <BookOpen size={16} className="text-blue-500" />
                                    AI Notes & Summaries
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.totalNotes || 0}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-purple-500" />
                                    Video Completion Rate
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.videoCompletionRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-500">
                        <span>Average Quiz Score</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.avgScore}%</span>
                    </div>
                </div>
            </div>

            {/* SECTION 5: Top Active Learners Leaderboard & Live Telemetry Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Top Active Learners */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Star className="text-amber-500" size={18} />
                                    Top Active Learners
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Highest XP and course completion leaders</p>
                            </div>
                            <Link
                                to="/admin/users"
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-0.5"
                            >
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>

                        {topLearners.length > 0 ? (
                            <div className="space-y-3">
                                {topLearners.map((user, idx) => (
                                    <Link
                                        key={user.id}
                                        to={`/admin/users/${user.id}`}
                                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-50 dark:border-slate-800/60"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-6 text-center font-black text-xs text-slate-400 shrink-0">
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                            </div>
                                            {user.profile_pic ? (
                                                <img src={user.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 font-bold flex items-center justify-center text-xs shrink-0">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                                <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-right shrink-0">
                                            {user.streak_count > 0 && (
                                                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40">
                                                    <Flame size={12} /> {user.streak_count}d
                                                </span>
                                            )}
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{user.xp.toLocaleString()} XP</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Lvl {user.level || 1}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400">No student learning data yet.</div>
                        )}
                    </div>
                </div>

                {/* Live Platform Activity Feed */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity className="text-orange-500" size={18} />
                                    Live Telemetry Stream
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Real-time user actions across the platform</p>
                            </div>
                            <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Feed
                            </span>
                        </div>

                        {recentActivity.length > 0 ? (
                            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-2 pb-6 custom-scrollbar">
                                {recentActivity.map((act) => {
                                    const text = act.activity_type || '';
                                    const isSession = text.includes('Active Session');
                                    const isWatched = text.startsWith('Watched:') || text.startsWith('Learning:');
                                    const isQuiz = text.toLowerCase().includes('quiz');
                                    const isCert = text.toLowerCase().includes('cert');

                                    return (
                                        <div 
                                            key={act.id} 
                                            className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800 flex items-start gap-3 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors"
                                        >
                                            {act.user?.profile_pic ? (
                                                <img src={act.user.profile_pic} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                                                    {act.user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                        {act.user?.name || 'Anonymous User'}
                                                    </span>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                        isSession
                                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                                            : isWatched
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                : isQuiz
                                                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                                                    : isCert
                                                                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {isSession ? 'Active Session' : isWatched ? 'Video Learning' : isQuiz ? 'Quiz Action' : isCert ? 'Certificate' : 'Activity'}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed" title={text}>
                                                    {text}
                                                </p>

                                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400">No activity logged yet today.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHome;
