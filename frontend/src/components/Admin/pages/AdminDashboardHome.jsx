import React, { useState, useEffect } from 'react';
import { Users, Video, Lightbulb, Award, Activity, Star, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all hover:scale-[1.02] duration-200">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h3>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">
                    {new Date(label).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                    New Users: <span className="text-base font-bold text-slate-800 dark:text-white pl-1">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

const AdminDashboardHome = () => {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };

                const [statsRes, analyticsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/stats`, { headers }),
                    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/analytics`, { headers })
                ]);

                setStats(statsRes.data.stats);
                setRecentActivity(statsRes.data.recentActivity);
                setChartData(analyticsRes.data.growthChart);
            } catch (err) {
                console.error("Failed to fetch admin data", err);
                toast.error("Failed to load dashboard metrics");
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={<Users size={28} className="text-blue-500" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Videos Discovered"
                    value={stats.totalVideos.toLocaleString()}
                    icon={<Video size={28} className="text-purple-500" />}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Quizzes Attempted"
                    value={stats.totalQuizzes.toLocaleString()}
                    icon={<Lightbulb size={28} className="text-amber-500" />}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Platform Total XP"
                    value={stats.totalXP.toLocaleString()}
                    icon={<Star size={28} className="text-orange-500" />}
                    color="bg-orange-500"
                />
            </div>

            {/* Growth Graph */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="text-blue-500" size={20} />
                            Platform Growth
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">New user signups over the last 30 days</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="newUsers"
                                name="New Users"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-orange-500" size={20} />
                        Recent Platform Activity
                    </h3>
                </div>

                {recentActivity.length > 0 ? (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/80">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                {activity.user.profile_pic ? (
                                    <img src={activity.user.profile_pic} alt="" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center">
                                        {activity.user.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="text-slate-800 dark:text-slate-200">
                                        <span className="font-semibold text-slate-900 dark:text-white">{activity.user.name}</span>{' '}
                                        <span className="text-slate-600 dark:text-slate-400">{activity.activity_type}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        No recent activity recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardHome;
