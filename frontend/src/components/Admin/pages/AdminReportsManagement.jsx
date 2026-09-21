import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Flag, 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    Trash2, 
    UserX, 
    Eye, 
    RefreshCw, 
    Search, 
    AlertTriangle, 
    Clock, 
    ExternalLink, 
    MessageSquare, 
    Heart, 
    User, 
    Check, 
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useModal } from '../../../context/ModalContext';

const AdminReportsManagement = () => {
    const { confirm } = useModal();
    const [reports, setReports] = useState([]);
    const [counts, setCounts] = useState({ total: 0, pending: 0, resolved: 0, dismissed: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filters
    const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'resolved', 'dismissed'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    
    // Modal image preview
    const [previewImage, setPreviewImage] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';

    const fetchReports = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const token = localStorage.getItem('google_token');
            const res = await axios.get(`${backendUrl}/api/admin/reports`, {
                params: {
                    status: activeTab === 'all' ? undefined : activeTab,
                    targetType: selectedType === 'all' ? undefined : selectedType
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.data) {
                const reportList = Array.isArray(res.data?.reports)
                    ? res.data.reports
                    : (Array.isArray(res.data) ? res.data : []);
                setReports(reportList);
                setCounts(res.data.counts || { total: 0, pending: 0, resolved: 0, dismissed: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            toast.error('Failed to load moderation reports');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [activeTab, selectedType]);

    const handleAction = async (reportId, action, extraPayload = {}) => {
        let confirmConfig = null;
        if (action === 'delete_post') {
            confirmConfig = {
                title: "Delete Reported Post?",
                message: "This will permanently remove the post and all its comments from the social feed and database.",
                confirmText: "Delete Post",
                type: "danger"
            };
        } else if (action === 'dismiss') {
            confirmConfig = {
                title: "Dismiss Report?",
                message: "Mark this report as reviewed and keep the content active in the feed.",
                confirmText: "Dismiss",
                type: "warning"
            };
        } else if (action === 'ban_user') {
            confirmConfig = {
                title: "Ban User & Remove Post?",
                message: "Are you sure you want to remove this post and flag this author account?",
                confirmText: "Ban Author",
                type: "danger"
            };
        }

        if (confirmConfig) {
            const ok = await confirm(confirmConfig);
            if (!ok) return;
        }

        try {
            setActionLoadingId(reportId);
            const token = localStorage.getItem('google_token');
            const res = await axios.post(`${backendUrl}/api/admin/reports/${reportId}/action`, {
                action,
                ...extraPayload
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Action executed successfully');
                fetchReports(true);
            }
        } catch (err) {
            console.error('Report action error:', err);
            toast.error(err.response?.data?.error || 'Failed to process action');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteReportLog = async (reportId) => {
        const ok = await confirm({
            title: "Delete Report Log?",
            message: "This will remove this moderation audit record.",
            confirmText: "Delete Log",
            type: "danger"
        });
        if (!ok) return;

        try {
            const token = localStorage.getItem('google_token');
            await axios.delete(`${backendUrl}/api/admin/reports/${reportId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            toast.success('Report log removed');
            fetchReports(true);
        } catch (err) {
            toast.error('Failed to delete report log');
        }
    };

    // Filter reports based on search query
    const reportList = Array.isArray(reports) ? reports : [];
    const filteredReports = reportList.filter(r => {
        if (!r) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(r.id || '').includes(q) ||
            (r.reason && r.reason.toLowerCase().includes(q)) ||
            (r.details && r.details.toLowerCase().includes(q)) ||
            (r.reporterEmail && r.reporterEmail.toLowerCase().includes(q)) ||
            (r.targetContent?.content && r.targetContent.content.toLowerCase().includes(q)) ||
            (r.targetContent?.author?.name && r.targetContent.author.name.toLowerCase().includes(q)) ||
            (r.targetContent?.author?.email && r.targetContent.author.email.toLowerCase().includes(q))
        );
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Clock size={12} /> Pending Review
                    </span>
                );
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={12} /> Resolved
                    </span>
                );
            case 'dismissed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                        <XCircle size={12} /> Dismissed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Content Moderation & Reports
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Apple Guideline 1.2 compliance: review user-flagged posts, harmful content, and take swift moderation actions.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        onClick={() => fetchReports(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
                        <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                    </button>
                </div>
            </div>

            {/* Metrics Topbar Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Reports</span>
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                            <Flag size={15} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                        {counts.total}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">All recorded user flags</span>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</span>
                        <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                            <AlertTriangle size={15} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                        {counts.pending}
                    </div>
                    <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">Requires action within 24h</span>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Resolved</span>
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                            <CheckCircle2 size={15} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {counts.resolved}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">Posts deleted or handled</span>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dismissed</span>
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg">
                            <XCircle size={15} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl sm:text-3xl font-black text-gray-700 dark:text-gray-300">
                        {counts.dismissed}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">Marked safe / false alarms</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl overflow-x-auto scrollbar-none">
                    {[
                        { key: 'pending', label: 'Pending', count: counts.pending, alert: counts.pending > 0 },
                        { key: 'all', label: 'All Reports', count: counts.total },
                        { key: 'resolved', label: 'Resolved', count: counts.resolved },
                        { key: 'dismissed', label: 'Dismissed', count: counts.dismissed },
                    ].map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    isActive 
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                        tab.alert 
                                            ? 'bg-amber-500 text-white' 
                                            : isActive ? 'bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search & Type Select */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by reason, user, text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-orange-500 font-semibold"
                    >
                        <option value="all">All Targets</option>
                        <option value="post">Posts</option>
                        <option value="user">Users</option>
                        <option value="comment">Comments</option>
                    </select>
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
                    <RefreshCw size={24} className="animate-spin text-orange-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Loading reported content...</p>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Check size={24} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Clean feed — No reports found</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        {activeTab === 'pending' 
                            ? "All user reports have been moderated and resolved." 
                            : "There are no reports matching your current filter criteria."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReports.map((report) => {
                        const targetPost = report.targetContent;
                        const hasPostData = targetPost && targetPost.exists;
                        const isActionLoading = actionLoadingId === report.id;

                        return (
                            <div 
                                key={report.id} 
                                className={`bg-white dark:bg-gray-800 border rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 ${
                                    report.status === 'pending'
                                        ? 'border-amber-300/80 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                                        : 'border-gray-200/80 dark:border-gray-700/80'
                                }`}
                            >
                                {/* Report Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-400">#{report.id}</span>
                                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                            {report.targetType}
                                        </span>
                                        {getStatusBadge(report.status)}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} />
                                            {new Date(report.createdAt).toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteReportLog(report.id)}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                                            title="Delete Log"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Report Details & Reason */}
                                <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* Left: Report reason & reporter info */}
                                    <div className="lg:col-span-4 space-y-3 bg-red-50/50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                                                <AlertTriangle size={13} /> Flagged Reason
                                            </div>
                                            <p className="text-sm font-extrabold text-red-900 dark:text-red-200 mt-1">
                                                {report.reason}
                                            </p>
                                            {report.details && (
                                                <p className="text-xs text-red-800/90 dark:text-red-300 mt-1 bg-white/60 dark:bg-gray-800/60 p-2 rounded-lg border border-red-200/50 dark:border-red-900/40 italic">
                                                    "{report.details}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-red-200/50 dark:border-red-900/40 text-[11px] text-gray-600 dark:text-gray-400">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block">Reported by:</span>
                                            <span className="font-mono text-[10px] break-all">{report.reporterEmail}</span>
                                            <span className="text-[9px] text-gray-400 block mt-0.5">(UID: {report.reporterId})</span>
                                        </div>

                                        {report.actionTaken && (
                                            <div className="pt-2 border-t border-red-200/50 dark:border-red-900/40 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                <span>Outcome: {report.actionTaken}</span>
                                                {report.resolvedBy && (
                                                    <span className="block text-[10px] font-normal text-gray-500 dark:text-gray-400">
                                                        by {report.resolvedBy}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Content Preview (Post / User) */}
                                    <div className="lg:col-span-8 flex flex-col justify-between bg-gray-50 dark:bg-gray-750/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        {report.targetType === 'post' ? (
                                            hasPostData ? (
                                                <div className="space-y-3">
                                                    {/* Post Author Bar */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            {targetPost.author?.profilePicture ? (
                                                                <img
                                                                    src={targetPost.author.profilePicture}
                                                                    alt={targetPost.author.name}
                                                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                                                />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs">
                                                                    {targetPost.author?.name?.charAt(0) || 'U'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                                    <span>{targetPost.author?.name || 'Anonymous User'}</span>
                                                                    {targetPost.author?.collegeName && (
                                                                        <span className="text-[10px] font-medium text-gray-400">
                                                                            • {targetPost.author.collegeName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 block font-mono">
                                                                    {targetPost.author?.email} (ID: {targetPost.author?.id})
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Heart size={12} className="text-red-500" /> {targetPost.likesCount}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare size={12} className="text-blue-500" /> {targetPost.commentsCount}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Post Text Content */}
                                                    <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
                                                        {targetPost.content || <span className="text-gray-400 italic">No text content</span>}
                                                    </div>

                                                    {/* Post Image (if any) */}
                                                    {targetPost.image && (
                                                        <div className="relative group w-36 h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer">
                                                            <img
                                                                src={targetPost.image}
                                                                alt="Reported media"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                onClick={() => setPreviewImage(targetPost.image)}
                                                            />
                                                            <div 
                                                                onClick={() => setPreviewImage(targetPost.image)}
                                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                            >
                                                                <Eye size={18} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-xs">
                                                    <Info size={20} className="mx-auto mb-2 text-gray-400" />
                                                    <span className="font-bold text-sm block text-gray-700 dark:text-gray-300">
                                                        Post No Longer Exists
                                                    </span>
                                                    <span>The reported post (ID: {report.targetId}) has already been removed or deleted.</span>
                                                </div>
                                            )
                                        ) : (
                                            <div className="py-6 text-xs text-gray-600 dark:text-gray-300">
                                                <span className="font-bold">Target ID:</span> {report.targetId} ({report.targetType})
                                            </div>
                                        )}

                                        {/* Moderation Actions Bar */}
                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-end gap-2.5">
                                            {report.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(report.id, 'dismiss')}
                                                        disabled={isActionLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                        <span>Dismiss (Safe)</span>
                                                    </button>

                                                    {hasPostData && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(report.id, 'ban_user')}
                                                                disabled={isActionLoading}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all shadow-sm active:scale-95"
                                                            >
                                                                <UserX size={14} />
                                                                <span>Ban Author</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleAction(report.id, 'delete_post')}
                                                                disabled={isActionLoading}
                                                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all shadow-sm shadow-red-500/20 active:scale-95"
                                                            >
                                                                <Trash2 size={14} />
                                                                <span>{isActionLoading ? "Processing..." : "Delete Post"}</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {!hasPostData && (
                                                        <button
                                                            onClick={() => handleAction(report.id, 'resolve')}
                                                            disabled={isActionLoading}
                                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            <span>Mark as Resolved</span>
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        Moderation complete
                                                    </span>
                                                    {hasPostData && (
                                                        <button
                                                            onClick={() => handleAction(report.id, 'delete_post')}
                                                            disabled={isActionLoading}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                            <span>Delete Post Now</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Image Preview Lightbox Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black">
                        <img src={previewImage} alt="Enlarged reported media" className="max-w-full max-h-[85vh] object-contain" />
                        <button 
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportsManagement;
