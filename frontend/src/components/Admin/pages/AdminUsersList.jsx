import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, Search, Calendar, Eye, Crown, Sparkles, Clock, X, Check, ShieldCheck, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../../context/ModalContext';

const AdminUsersList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pro' | 'standard'
    const { token } = useAuth();
    const { confirm } = useModal();

    // Modal state for editing Pro status
    const [selectedUserForPro, setSelectedUserForPro] = useState(null);
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [proModalLoading, setProModalLoading] = useState(false);

    // Pro form state
    const [formIsPro, setFormIsPro] = useState(true);
    const [formTier, setFormTier] = useState('campus_pro');
    const [formDurationMonths, setFormDurationMonths] = useState(6);
    const [formExpiryDate, setFormExpiryDate] = useState('');
    const [formNote, setFormNote] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userList = Array.isArray(response.data?.users)
                ? response.data.users
                : (Array.isArray(response.data) ? response.data : []);
            setUsers(userList);
        } catch (err) {
            console.error("Failed to fetch users", err);
            toast.error("Failed to load users list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const calculateFutureDate = (months) => {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
    };

    const openProModal = (user) => {
        setSelectedUserForPro(user);
        const isActive = Boolean(user.is_premium || user.isPremium);
        setFormIsPro(isActive ? true : true); // default to enabling if they opened modal
        setFormTier(user.premium_tier || 'campus_pro');
        setFormNote(user.premium_granted_by || '');

        if (user.premium_expires_at) {
            const d = new Date(user.premium_expires_at);
            setFormExpiryDate(!isNaN(d) ? d.toISOString().split('T')[0] : calculateFutureDate(6));
        } else {
            setFormExpiryDate(calculateFutureDate(6));
        }
        setFormDurationMonths(6);
        setIsProModalOpen(true);
    };

    const handleQuickDuration = (months) => {
        setFormDurationMonths(months);
        setFormExpiryDate(calculateFutureDate(months));
    };

    const handleSaveProStatus = async (e) => {
        e?.preventDefault();
        if (!selectedUserForPro) return;

        setProModalLoading(true);
        try {
            const payload = {
                is_premium: formIsPro,
                premium_tier: formTier,
                custom_expiry: formIsPro && formExpiryDate ? new Date(formExpiryDate).toISOString() : null,
                note: formNote || (formIsPro ? `Campus Grant ${formDurationMonths}m` : null)
            };

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${selectedUserForPro.id}/premium`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                toast.success(response.data.message || "Pro Scholar status updated!");
                
                // Optimistically update user in state
                const updatedFields = response.data.user || {};
                const now = new Date();
                const expDate = formIsPro && formExpiryDate ? new Date(formExpiryDate) : null;
                const daysRemaining = expDate ? Math.max(0, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))) : null;

                setUsers(prev => prev.map(u => {
                    if (u.id === selectedUserForPro.id) {
                        return {
                            ...u,
                            ...updatedFields,
                            is_premium: formIsPro,
                            isPremium: formIsPro,
                            premium_tier: formIsPro ? formTier : null,
                            premium_expires_at: formIsPro ? (expDate ? expDate.toISOString() : null) : null,
                            premium_granted_by: formIsPro ? formNote : null,
                            daysRemaining: formIsPro ? daysRemaining : null,
                            days_remaining: formIsPro ? daysRemaining : null,
                        };
                    }
                    return u;
                }));

                setIsProModalOpen(false);
            }
        } catch (err) {
            console.error("Failed to update user Pro status", err);
            toast.error(err.response?.data?.error || "Failed to update Pro status");
        } finally {
            setProModalLoading(false);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        const confirmed = await confirm({
            title: "Delete User",
            message: `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone and will remove all their content.`,
            confirmText: "Delete User",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(prev => (Array.isArray(prev) ? prev : []).filter(u => u.id !== userId));
            toast.success("User deleted successfully");
        } catch (err) {
            console.error("Failed to delete user", err);
            toast.error("Failed to delete user");
        }
    };

    const userList = Array.isArray(users) ? users : [];
    
    // Status counts
    const proUsersCount = userList.filter(u => Boolean(u.is_premium || u.isPremium)).length;
    const standardUsersCount = userList.length - proUsersCount;

    const filteredUsers = userList.filter(u => {
        const matchesSearch = 
            (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        const isPro = Boolean(u.is_premium || u.isPremium);
        if (statusFilter === 'pro') return isPro;
        if (statusFilter === 'standard') return !isPro;
        return true;
    });

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in flex flex-col h-full min-h-[500px]">
            {/* Header & Search */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/10">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>Platform Users</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {userList.length}
                        </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage user permissions, content, and Campus Pro Scholar grants
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-bold w-full sm:w-auto">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            All ({userList.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('pro')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                statusFilter === 'pro'
                                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                            }`}
                        >
                            <span>👑 Pro</span>
                            <span>({proUsersCount})</span>
                        </button>
                        <button
                            onClick={() => setStatusFilter('standard')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                statusFilter === 'standard'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Standard ({standardUsersCount})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-2xs"
                        />
                    </div>
                </div>
            </div>

            {/* Table wrapper for flex-1 scrolling */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                            <th className="px-6 py-3.5">User</th>
                            <th className="px-6 py-3.5">Membership</th>
                            <th className="px-6 py-3.5">Level &amp; XP</th>
                            <th className="px-6 py-3.5">Content</th>
                            <th className="px-6 py-3.5">Joined</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const isPro = Boolean(user.is_premium || user.isPremium);
                                const daysLeft = user.daysRemaining ?? user.days_remaining;

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                        {/* User Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.profile_pic ? (
                                                    <img src={user.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 ring-2 ring-transparent group-hover:ring-orange-300 dark:group-hover:ring-orange-500/30 transition-all" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center border border-orange-200/20 dark:border-orange-500/20">
                                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                                                        {isPro && (
                                                            <span title="Active Pro Scholar" className="text-xs">👑</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Membership Status & Manage Button */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {isPro ? (
                                                    <div
                                                        onClick={() => openProModal(user)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 text-[11px] font-black tracking-wide cursor-pointer hover:shadow-xs active:scale-95 transition-all select-none"
                                                        title="Click to manage Pro duration"
                                                    >
                                                        <span>👑</span>
                                                        <span className="uppercase">
                                                            {user.premium_tier === 'ambassador_pro' ? 'Ambassador' : 'Campus Pro'}
                                                        </span>
                                                        {daysLeft != null && (
                                                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/50 px-1.5 py-0.2 rounded-full">
                                                                {daysLeft}d left
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => openProModal(user)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300 text-[11px] font-bold transition-all cursor-pointer select-none"
                                                        title="Grant free 6-Month Campus Pro Scholar"
                                                    >
                                                        <Crown size={12} className="opacity-70" />
                                                        <span>Standard</span>
                                                        <span className="text-orange-500 font-extrabold ml-1">+Grant</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Level & XP */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-bold border border-orange-200/50 dark:border-orange-500/20">
                                                    Lvl {user.level || 1}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{user.xp || 0} XP</span>
                                            </div>
                                        </td>

                                        {/* Content Counts */}
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                                                <p><span className="font-semibold text-slate-800 dark:text-slate-200">{user._count?.videos || 0}</span> Courses</p>
                                                <p><span className="font-semibold text-slate-800 dark:text-slate-200">{user._count?.quizzes || 0}</span> Quizzes</p>
                                                <p><span className="font-semibold text-slate-800 dark:text-slate-200">{user._count?.certificates || 0}</span> Certs</p>
                                            </div>
                                        </td>

                                        {/* Joined Date */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 transition-all duration-200">
                                                <button
                                                    onClick={() => openProModal(user)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Manage Pro Membership"
                                                >
                                                    <Crown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/users/${user.id}`)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                    No users found matching current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer summary */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <div>
                    👑 <span className="font-bold text-amber-600 dark:text-amber-400">{proUsersCount}</span> Pro Scholars active on campus
                </div>
                <div>
                    Showing {filteredUsers.length} of {userList.length} total users
                </div>
            </div>

            {/* 👑 Manage Pro Scholar Access Modal */}
            {isProModalOpen && selectedUserForPro && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                                    👑
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Manage Pro Scholar Access
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                                        {selectedUserForPro.name} ({selectedUserForPro.email})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsProModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveProStatus} className="p-5 space-y-4 text-xs">
                            {/* Pro Status Active / Inactive Toggle */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Membership Status
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormIsPro(true)}
                                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                            formIsPro
                                                ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <span>👑</span>
                                        <span>Active Pro Scholar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormIsPro(false)}
                                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                            !formIsPro
                                                ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-900 dark:text-white ring-2 ring-slate-400/20'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <span>🎓</span>
                                        <span>Standard Free</span>
                                    </button>
                                </div>
                            </div>

                            {formIsPro && (
                                <>
                                    {/* Duration Quick Chips */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">
                                                Grant Duration
                                            </label>
                                            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold uppercase">
                                                Campus Friendly
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: '+3 Months', months: 3 },
                                                { label: '+6 Months', months: 6, tag: 'Campus' },
                                                { label: '+1 Year', months: 12 },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.months}
                                                    type="button"
                                                    onClick={() => handleQuickDuration(opt.months)}
                                                    className={`py-2 px-2 rounded-xl border font-bold text-center transition cursor-pointer relative ${
                                                        formDurationMonths === opt.months
                                                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300'
                                                    }`}
                                                >
                                                    {opt.label}
                                                    {opt.tag && (
                                                        <span className="block text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                                                            {opt.tag}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expiry Date Picker */}
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Valid Until Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formExpiryDate}
                                            onChange={(e) => {
                                                setFormExpiryDate(e.target.value);
                                                setFormDurationMonths(null);
                                            }}
                                            required={formIsPro}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                        />
                                    </div>

                                    {/* Tier Selector */}
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Prestige Tier
                                        </label>
                                        <select
                                            value={formTier}
                                            onChange={(e) => setFormTier(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium"
                                        >
                                            <option value="campus_pro">🎓 Campus Pro Scholar (Default)</option>
                                            <option value="ambassador_pro">🌟 Ambassador Pro Pass</option>
                                            <option value="honorary_pro">👑 Honorary Pro Scholar</option>
                                        </select>
                                    </div>

                                    {/* Note / Grant Reason */}
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Allocation Note / Reason (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Campus Visit 2026, Ambassador Referral, Tech Fest"
                                            value={formNote}
                                            onChange={(e) => setFormNote(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none placeholder-slate-400"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Modal Actions */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsProModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={proModalLoading}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {proModalLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Check size={14} />
                                    )}
                                    <span>Save Pro Access</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersList;

