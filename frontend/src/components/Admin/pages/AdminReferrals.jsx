import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import toast from 'react-hot-toast';
import {
    Users,
    MousePointerClick,
    UserCheck,
    TrendingUp,
    Plus,
    Copy,
    Check,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Search,
    Filter,
    Award,
    School,
    Sparkles,
    ExternalLink,
    RefreshCw,
    Share2,
    BarChart3
} from 'lucide-react';

const AdminReferrals = () => {
    const { token } = useAuth();
    const { confirm } = useModal();

    const [stats, setStats] = useState(null);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        category: 'ambassador',
        title: '',
        creatorName: '',
        targetCollege: '',
        rewardNotes: ''
    });

    const fetchData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [statsRes, codesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes?limit=100`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats(statsRes.data);
            setCodes(codesRes.data.codes || []);
        } catch (err) {
            console.error('Failed to load referral admin data:', err);
            toast.error('Failed to load referral analytics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleCopy = (code) => {
        const origin = window.location.origin;
        const shareUrl = `${origin}/?ref=${code}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedCode(code);
        toast.success(`Referral link copied!`);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: res.data.isActive } : c));
                toast.success(res.data.isActive ? 'Campaign activated' : 'Campaign paused');
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
            toast.error('Failed to update campaign status');
        }
    };

    const handleDelete = async (id, codeName) => {
        const confirmed = await confirm({
            title: 'Delete Referral Campaign',
            message: `Are you sure you want to delete campaign code "${codeName}"? All tracking and attribution logs for this code will be removed.`,
            confirmText: 'Delete Campaign',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCodes(prev => prev.filter(c => c.id !== id));
            toast.success('Referral code deleted');
            fetchData(true);
        } catch (err) {
            console.error('Failed to delete code:', err);
            toast.error('Failed to delete referral campaign');
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code.trim()) {
            toast.error('Please enter a referral code');
            return;
        }

        setCreating(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Campaign created successfully!');
                setIsCreateModalOpen(false);
                setFormData({
                    code: '',
                    category: 'ambassador',
                    title: '',
                    creatorName: '',
                    targetCollege: '',
                    rewardNotes: ''
                });
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to create campaign:', err);
            toast.error(err.response?.data?.error || 'Failed to create campaign');
        } finally {
            setCreating(false);
        }
    };

    // Filter codes
    const filteredCodes = useMemo(() => {
        return codes.filter(item => {
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                item.code.toLowerCase().includes(searchLower) ||
                (item.title && item.title.toLowerCase().includes(searchLower)) ||
                (item.creatorName && item.creatorName.toLowerCase().includes(searchLower)) ||
                (item.targetCollege && item.targetCollege.toLowerCase().includes(searchLower));

            return matchesCategory && matchesSearch;
        });
    }, [codes, activeCategory, searchQuery]);

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'ambassador':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"><School size={12} /> Ambassador</span>;
            case 'creator':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><Sparkles size={12} /> Creator</span>;
            case 'student':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><Users size={12} /> Student</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800"><Award size={12} /> Campaign</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const metrics = stats?.metrics || {
        totalCampaigns: 0,
        totalClicks: 0,
        totalSignups: 0,
        conversionRate: 0,
        ambassadorsCount: 0,
        creatorsCount: 0,
        studentsCount: 0
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Share2 className="text-orange-500" />
                        Referrals & Campus Ambassadors
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Generate & monitor custom referral links for campus ambassadors, creators, and students.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="p-2.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition shadow-sm"
                        title="Refresh data"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition duration-200"
                    >
                        <Plus size={18} />
                        <span>Create Campaign Link</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Campaigns */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Campaigns</span>
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <Award size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalCampaigns}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{metrics.ambassadorsCount} Ambassadors</span> • <span>{metrics.creatorsCount} Creators</span>
                    </div>
                </div>

                {/* Total Clicks */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Link Clicks</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <MousePointerClick size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalClicks.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Tracked across all campaigns
                    </div>
                </div>

                {/* Total Signups */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Attributed Signups</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <UserCheck size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalSignups.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Verified registered users
                    </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</span>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.conversionRate}%</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Click-to-signup conversion
                    </div>
                </div>
            </div>

            {/* Filter Bar & Category Tabs */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                        {[
                            { id: 'all', label: 'All Links' },
                            { id: 'ambassador', label: 'Ambassadors' },
                            { id: 'creator', label: 'Creators' },
                            { id: 'student', label: 'Students' },
                            { id: 'campaign', label: 'General Campaigns' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveCategory(tab.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    activeCategory === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 md:max-w-xs">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search code, creator, college..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={18} className="text-orange-500" />
                        Campaigns & Ambassador Links ({filteredCodes.length})
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <th className="py-3.5 px-6">Referral Code & Link</th>
                                <th className="py-3.5 px-6">Category</th>
                                <th className="py-3.5 px-6">Creator / Ambassador</th>
                                <th className="py-3.5 px-6">Target College</th>
                                <th className="py-3.5 px-6 text-center">Clicks</th>
                                <th className="py-3.5 px-6 text-center">Signups</th>
                                <th className="py-3.5 px-6 text-center">Conv. %</th>
                                <th className="py-3.5 px-6 text-center">Status</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                            {filteredCodes.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-12 text-center text-gray-400 dark:text-gray-500">
                                        No referral campaigns found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredCodes.map((item) => {
                                    const convRate = item.clicksCount > 0
                                        ? ((item.signupCount / item.clicksCount) * 100).toFixed(1)
                                        : 0;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition">
                                            {/* Code & Link */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800">
                                                        {item.code}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(item.code)}
                                                        className="p-1.5 text-gray-400 hover:text-orange-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                        title="Copy Shareable Link"
                                                    >
                                                        {copiedCode === item.code ? (
                                                            <Check size={16} className="text-emerald-500" />
                                                        ) : (
                                                            <Copy size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                                {item.title && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium truncate max-w-[200px]">
                                                        {item.title}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="py-4 px-6">
                                                {getCategoryBadge(item.category)}
                                            </td>

                                            {/* Creator / Ambassador */}
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {item.creatorName || (item.referrer ? item.referrer.name : '—')}
                                                </div>
                                                {item.referrer?.email && (
                                                    <div className="text-xs text-gray-400">{item.referrer.email}</div>
                                                )}
                                            </td>

                                            {/* College */}
                                            <td className="py-4 px-6">
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {item.targetCollege || '—'}
                                                </span>
                                            </td>

                                            {/* Clicks */}
                                            <td className="py-4 px-6 text-center font-semibold text-gray-800 dark:text-gray-200">
                                                {item.clicksCount.toLocaleString()}
                                            </td>

                                            {/* Signups */}
                                            <td className="py-4 px-6 text-center">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {item.signupCount.toLocaleString()}
                                                </span>
                                            </td>

                                            {/* Conversion % */}
                                            <td className="py-4 px-6 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    {convRate}%
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(item.id, item.isActive)}
                                                    className="inline-flex items-center gap-1.5 focus:outline-none"
                                                    title={item.isActive ? 'Click to Pause' : 'Click to Activate'}
                                                >
                                                    {item.isActive ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                                                            Paused
                                                        </span>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleCopy(item.code)}
                                                        className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition"
                                                        title="Copy Share Link"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.code)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                                                        title="Delete Campaign"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Attributed Signups Section */}
            {stats?.recentAttributions && stats.recentAttributions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-6">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserCheck size={18} className="text-emerald-500" />
                        Recent Attributed User Signups
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.recentAttributions.map((attr, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-sm overflow-hidden">
                                        {attr.referredUser?.profile_pic ? (
                                            <img src={attr.referredUser.profile_pic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            attr.referredUser?.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {attr.referredUser?.name || 'New Student'}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate max-w-[150px]">
                                            {attr.referredUser?.email || '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded">
                                        {attr.referralCode?.code}
                                    </span>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        {new Date(attr.createdAt || attr.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Campaign Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Plus className="text-orange-500" size={20} />
                                    Create Referral Campaign
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Generate a new trackable invite code & URL
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Referral Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. IITB_CAMPUS, CREATOR_XYZ"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    >
                                        <option value="ambassador">Campus Ambassador</option>
                                        <option value="creator">Creator / Influencer</option>
                                        <option value="student">Student Leader</option>
                                        <option value="campaign">Marketing Campaign</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Ambassador / Creator Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={formData.creatorName}
                                        onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Campaign Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Fall 2026 Orientation Drive"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Target College / Uni
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. IIT Bombay, Stanford"
                                        value={formData.targetCollege}
                                        onChange={(e) => setFormData({ ...formData, targetCollege: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Notes / Commission Terms
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Optional notes or reward structure for this ambassador..."
                                    value={formData.rewardNotes}
                                    onChange={(e) => setFormData({ ...formData, rewardNotes: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            {/* Live Preview */}
                            {formData.code && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl">
                                    <div className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1">
                                        Generated Share URL:
                                    </div>
                                    <div className="text-xs font-mono text-orange-700 dark:text-orange-400 break-all">
                                        {window.location.origin}/?ref={formData.code}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReferrals;
