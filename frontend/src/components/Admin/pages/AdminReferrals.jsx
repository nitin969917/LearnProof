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
    BarChart3,
    Edit3,
    ChevronDown,
    X,
    Layers,
    FolderPlus,
    Building2,
    Trophy,
    ArrowUpRight
} from 'lucide-react';

const AdminReferrals = () => {
    const { token } = useAuth();
    const { confirm } = useModal();

    // Main Tab State: 'links' or 'groups'
    const [mainTab, setMainTab] = useState('links');

    // Referral Campaigns State
    const [stats, setStats] = useState(null);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);

    // Ambassador Groups State
    const [groups, setGroups] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [groupSubTab, setGroupSubTab] = useState('custom'); // 'custom' | 'colleges'
    const [groupSearchQuery, setGroupSearchQuery] = useState('');

    // Create Campaign Modal State
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

    // Edit Campaign Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    // Ambassador Group Modals State
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [groupFormData, setGroupFormData] = useState({
        name: '',
        college: '',
        description: '',
        referralCodeIds: []
    });

    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [savingGroupEdit, setSavingGroupEdit] = useState(false);

    const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
    const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);
    const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

    // Search query inside group creation/editing ambassador checklist
    const [ambassadorPickerSearch, setAmbassadorPickerSearch] = useState('');

    const fetchData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [statsRes, codesRes, groupsRes, collegesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes?limit=150`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/groups`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/colleges`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats(statsRes.data);
            setCodes(codesRes.data.codes || []);
            setGroups(groupsRes.data.groups || []);
            setColleges(collegesRes.data.colleges || []);
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

    const handleCategoryChange = async (id, newCategory, name) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes/${id}`, {
                category: newCategory
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setCodes(prev => prev.map(c => c.id === id ? { ...c, category: newCategory } : c));
                const categoryLabel = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);
                toast.success(`Updated ${name || 'user'} status to ${categoryLabel}!`);
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to update category:', err);
            toast.error(err.response?.data?.error || 'Failed to update category');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingItem) return;

        setSavingEdit(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/codes/${editingItem.id}`, editingItem, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Campaign details updated successfully!');
                setIsEditModalOpen(false);
                setEditingItem(null);
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to update campaign:', err);
            toast.error(err.response?.data?.error || 'Failed to update campaign');
        } finally {
            setSavingEdit(false);
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

    // ==========================================
    // AMBASSADOR GROUP ACTIONS
    // ==========================================

    const handleCreateGroupSubmit = async (e) => {
        e.preventDefault();
        if (!groupFormData.name.trim()) {
            toast.error('Please enter a group name');
            return;
        }

        setCreatingGroup(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/groups`, groupFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success(res.data.message || 'Ambassador group created!');
                setIsCreateGroupModalOpen(false);
                setGroupFormData({
                    name: '',
                    college: '',
                    description: '',
                    referralCodeIds: []
                });
                setAmbassadorPickerSearch('');
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to create group:', err);
            toast.error(err.response?.data?.error || 'Failed to create group');
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleEditGroupSubmit = async (e) => {
        e.preventDefault();
        if (!editingGroup || !editingGroup.name.trim()) return;

        setSavingGroupEdit(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/groups/${editingGroup.id}`, {
                name: editingGroup.name,
                college: editingGroup.college,
                description: editingGroup.description,
                referralCodeIds: editingGroup.referralCodeIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Ambassador group updated successfully!');
                setIsEditGroupModalOpen(false);
                setEditingGroup(null);
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to update group:', err);
            toast.error(err.response?.data?.error || 'Failed to update group');
        } finally {
            setSavingGroupEdit(false);
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        const confirmed = await confirm({
            title: 'Delete Ambassador Group',
            message: `Are you sure you want to delete group "${groupName}"? Group members and their referral tracking links will NOT be deleted.`,
            confirmText: 'Delete Group',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setGroups(prev => prev.filter(g => g.id !== groupId));
                toast.success('Ambassador group deleted');
                if (isGroupDetailsModalOpen && selectedGroupDetails?.group?.id === groupId) {
                    setIsGroupDetailsModalOpen(false);
                }
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to delete group:', err);
            toast.error('Failed to delete ambassador group');
        }
    };

    const handleViewOpenGroupDetails = async (groupId) => {
        setLoadingGroupDetails(true);
        setIsGroupDetailsModalOpen(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSelectedGroupDetails(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch group details:', err);
            toast.error('Failed to load group performance details');
        } finally {
            setLoadingGroupDetails(false);
        }
    };

    const handleRemoveMemberFromGroup = async (groupId, codeId) => {
        if (!selectedGroupDetails?.group) return;
        const remainingIds = selectedGroupDetails.group.members
            .filter(m => m.id !== codeId)
            .map(m => m.id);

        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/groups/${groupId}`, {
                name: selectedGroupDetails.group.name,
                college: selectedGroupDetails.group.college,
                description: selectedGroupDetails.group.description,
                referralCodeIds: remainingIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Member removed from group');
                handleViewOpenGroupDetails(groupId);
                fetchData(true);
            }
        } catch (err) {
            console.error('Failed to remove member:', err);
            toast.error('Failed to remove member');
        }
    };

    const handleCreateGroupFromCollege = (collegeItem) => {
        setGroupFormData({
            name: `${collegeItem.collegeName} Ambassadors`,
            college: collegeItem.collegeName,
            description: `Campus ambassador team for ${collegeItem.collegeName}`,
            referralCodeIds: collegeItem.ambassadorIds || []
        });
        setGroupSubTab('custom');
        setIsCreateGroupModalOpen(true);
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

    // Filter groups
    const filteredGroups = useMemo(() => {
        return groups.filter(g => {
            const q = groupSearchQuery.toLowerCase();
            return !q ||
                g.name.toLowerCase().includes(q) ||
                (g.college && g.college.toLowerCase().includes(q)) ||
                (g.description && g.description.toLowerCase().includes(q));
        });
    }, [groups, groupSearchQuery]);

    // Available ambassadors for selection in create/edit group modal
    const pickerAmbassadors = useMemo(() => {
        return codes.filter(item => {
            const q = ambassadorPickerSearch.toLowerCase();
            if (!q) return true;
            return item.code.toLowerCase().includes(q) ||
                (item.creatorName && item.creatorName.toLowerCase().includes(q)) ||
                (item.targetCollege && item.targetCollege.toLowerCase().includes(q));
        });
    }, [codes, ambassadorPickerSearch]);

    // Aggregated group KPI calculations
    const groupMetrics = useMemo(() => {
        const totalGroups = groups.length;
        const totalMembers = groups.reduce((acc, g) => acc + (g.membersCount || 0), 0);
        const topGroup = groups.length > 0
            ? [...groups].sort((a, b) => b.totalSignups - a.totalSignups)[0]
            : null;
        const topCollege = colleges.length > 0
            ? colleges[0]
            : null;

        return {
            totalGroups,
            totalMembers,
            topGroupName: topGroup ? topGroup.name : '—',
            topGroupSignups: topGroup ? topGroup.totalSignups : 0,
            topCollegeName: topCollege ? topCollege.collegeName : '—',
            topCollegeSignups: topCollege ? topCollege.totalSignups : 0
        };
    }, [groups, colleges]);

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
                        Generate & monitor custom referral links, track colleges, and manage ambassador cohorts.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="p-2.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition shadow-sm cursor-pointer"
                        title="Refresh data"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                    {mainTab === 'links' ? (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition duration-200 cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>Create Campaign Link</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setGroupFormData({ name: '', college: '', description: '', referralCodeIds: [] });
                                setIsCreateGroupModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition duration-200 cursor-pointer"
                        >
                            <FolderPlus size={18} />
                            <span>Create Ambassador Group</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Primary View Navigation Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl max-w-fit border border-gray-200 dark:border-gray-700 shadow-xs">
                <button
                    onClick={() => setMainTab('links')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition duration-200 cursor-pointer ${
                        mainTab === 'links'
                            ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <BarChart3 size={16} />
                    <span>Campaign Links & Ambassadors</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-gray-200/80 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {codes.length}
                    </span>
                </button>

                <button
                    onClick={() => setMainTab('groups')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition duration-200 cursor-pointer ${
                        mainTab === 'groups'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <Layers size={16} />
                    <span>Ambassador Groups & College Analytics</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        {groups.length} Groups
                    </span>
                </button>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: CAMPAIGN LINKS & INDIVIDUAL AMBASSADORS (ORIGINAL VIEW)           */}
            {/* ========================================================================= */}
            {mainTab === 'links' && (
                <div className="space-y-6">
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
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {metrics.ambassadorsCount} Ambassadors · {metrics.creatorsCount} Creators
                            </div>
                        </div>

                        {/* Total Link Clicks */}
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

                        {/* Attributed Signups */}
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
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                                                                className="p-1.5 text-gray-400 hover:text-orange-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
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

                                                    {/* Category with Interactive Role Selector */}
                                                    <td className="py-4 px-6">
                                                        <div className="relative inline-flex items-center">
                                                            <select
                                                                value={item.category || 'student'}
                                                                onChange={(e) => handleCategoryChange(item.id, e.target.value, item.creatorName || (item.referrer ? item.referrer.name : item.code))}
                                                                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 pr-7 appearance-none cursor-pointer border transition outline-none shadow-2xs ${
                                                                    item.category === 'ambassador'
                                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                                                                        : item.category === 'creator'
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                                        : item.category === 'student'
                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
                                                                }`}
                                                                title="Click to change role"
                                                            >
                                                                <option value="student" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">🎓 Student</option>
                                                                <option value="ambassador" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">👑 Ambassador</option>
                                                                <option value="creator" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">✨ Creator</option>
                                                                <option value="campaign" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">🏆 Campaign</option>
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                                <ChevronDown size={12} />
                                                            </div>
                                                        </div>
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
                                                            className="inline-flex items-center gap-1.5 focus:outline-none cursor-pointer"
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
                                                                onClick={() => {
                                                                    setEditingItem({
                                                                        id: item.id,
                                                                        code: item.code,
                                                                        category: item.category || 'ambassador',
                                                                        title: item.title || '',
                                                                        creatorName: item.creatorName || (item.referrer ? item.referrer.name : ''),
                                                                        targetCollege: item.targetCollege || '',
                                                                        rewardNotes: item.rewardNotes || '',
                                                                        isActive: item.isActive
                                                                    });
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition cursor-pointer"
                                                                title="Edit Campaign Details"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopy(item.code)}
                                                                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition cursor-pointer"
                                                                title="Copy Share Link"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id, item.code)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
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
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: AMBASSADOR GROUPS & COLLEGE ANALYTICS (NEW FEATURE)                 */}
            {/* ========================================================================= */}
            {mainTab === 'groups' && (
                <div className="space-y-6">
                    {/* Groups KPI Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Groups */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ambassador Groups</span>
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Layers size={20} />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{groupMetrics.totalGroups}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Active cohorts & regional teams
                            </div>
                        </div>

                        {/* Total Grouped Ambassadors */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Grouped Members</span>
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{groupMetrics.totalMembers}</span>
                            </div>
                            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                Across all active groups
                            </div>
                        </div>

                        {/* Top Group */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Performing Group</span>
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Trophy size={20} />
                                </div>
                            </div>
                            <div className="mt-3 truncate">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{groupMetrics.topGroupName}</span>
                            </div>
                            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                {groupMetrics.topGroupSignups} signups registered
                            </div>
                        </div>

                        {/* Top College */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Performing College</span>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Building2 size={20} />
                                </div>
                            </div>
                            <div className="mt-3 truncate">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{groupMetrics.topCollegeName}</span>
                            </div>
                            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {groupMetrics.topCollegeSignups} signups registered
                            </div>
                        </div>
                    </div>

                    {/* Sub-Tabs: Custom Groups vs College Benchmark */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                            <button
                                onClick={() => setGroupSubTab('custom')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    groupSubTab === 'custom'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Custom Ambassador Groups ({groups.length})
                            </button>
                            <button
                                onClick={() => setGroupSubTab('colleges')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    groupSubTab === 'colleges'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                College Leaderboard ({colleges.length})
                            </button>
                        </div>

                        {groupSubTab === 'custom' && (
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search group by name, college..."
                                    value={groupSearchQuery}
                                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* SUB-VIEW 1: CUSTOM AMBASSADOR GROUPS GRID */}
                    {groupSubTab === 'custom' && (
                        <div>
                            {filteredGroups.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                                        <Layers size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Ambassador Groups Found</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 mb-6">
                                        Create customized cohorts by college (e.g. "COEP Pune", "IIT Bombay") or initiative names to monitor team referral performance.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setGroupFormData({ name: '', college: '', description: '', referralCodeIds: [] });
                                            setIsCreateGroupModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition cursor-pointer"
                                    >
                                        <FolderPlus size={18} />
                                        <span>Create First Group</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredGroups.map(group => (
                                        <div
                                            key={group.id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition group relative overflow-hidden"
                                        >
                                            <div className="space-y-3">
                                                {/* Header & Badges */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                                            {group.name}
                                                        </h3>
                                                        {group.college && (
                                                            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                                                <Building2 size={12} />
                                                                {group.college}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingGroup({
                                                                    id: group.id,
                                                                    name: group.name,
                                                                    college: group.college || '',
                                                                    description: group.description || '',
                                                                    referralCodeIds: group.members.map(m => m.id)
                                                                });
                                                                setIsEditGroupModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition cursor-pointer"
                                                            title="Edit Group"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteGroup(group.id, group.name)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                                                            title="Delete Group"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {group.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {group.description}
                                                    </p>
                                                )}

                                                {/* Metric Stats Pills */}
                                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-center">
                                                    <div className="bg-gray-50 dark:bg-gray-900/40 p-2 rounded-xl">
                                                        <div className="text-[11px] font-semibold text-gray-400 uppercase">Members</div>
                                                        <div className="text-base font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                                                            {group.membersCount}
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-xl">
                                                        <div className="text-[11px] font-semibold text-blue-500 uppercase">Clicks</div>
                                                        <div className="text-base font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                                                            {group.totalClicks.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl">
                                                        <div className="text-[11px] font-semibold text-emerald-500 uppercase">Signups</div>
                                                        <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                                                            {group.totalSignups.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Top Member / Conversion Info */}
                                                <div className="flex items-center justify-between text-xs pt-1">
                                                    <div className="text-gray-500 dark:text-gray-400">
                                                        Conv. Rate: <span className="font-bold text-gray-800 dark:text-gray-200">{group.conversionRate}%</span>
                                                    </div>
                                                    {group.topMember && (
                                                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[160px] flex items-center gap-1">
                                                            <Trophy size={13} className="text-amber-500 shrink-0" />
                                                            <span className="truncate">{group.topMember.name} ({group.topMember.signups})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-700/60">
                                                <button
                                                    onClick={() => handleViewOpenGroupDetails(group.id)}
                                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition cursor-pointer"
                                                >
                                                    <span>View Group Performance & Members</span>
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUB-VIEW 2: COLLEGE PERFORMANCE LEADERBOARD (AUTO-AGGREGATED) */}
                    {groupSubTab === 'colleges' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Building2 size={18} className="text-indigo-500" />
                                        College Referral Benchmarks ({colleges.length})
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Automatically grouped and ranked from all ambassador campaigns with a target college specified.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <th className="py-3.5 px-6">Rank & College</th>
                                            <th className="py-3.5 px-6 text-center">Ambassadors</th>
                                            <th className="py-3.5 px-6 text-center">Total Clicks</th>
                                            <th className="py-3.5 px-6 text-center">Total Signups</th>
                                            <th className="py-3.5 px-6 text-center">Conv. %</th>
                                            <th className="py-3.5 px-6">Top Ambassador</th>
                                            <th className="py-3.5 px-6 text-right">Quick Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                                        {colleges.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-12 text-center text-gray-400 dark:text-gray-500">
                                                    No colleges specified across any ambassador referral links yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            colleges.map((c, index) => (
                                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                                                index === 0
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                                    : index === 1
                                                                    ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                    : index === 2
                                                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                                                                    : 'text-gray-400'
                                                            }`}>
                                                                #{index + 1}
                                                            </span>
                                                            <div>
                                                                <span className="font-bold text-gray-900 dark:text-white">
                                                                    {c.collegeName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-6 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                                            {c.totalAmbassadors}
                                                        </span>
                                                    </td>

                                                    <td className="py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-300">
                                                        {c.totalClicks.toLocaleString()}
                                                    </td>

                                                    <td className="py-4 px-6 text-center">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            {c.totalSignups.toLocaleString()}
                                                        </span>
                                                    </td>

                                                    <td className="py-4 px-6 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            {c.conversionRate}%
                                                        </span>
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        {c.topAmbassador ? (
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <Trophy size={13} className="text-amber-500" />
                                                                <span className="font-semibold text-gray-900 dark:text-white">{c.topAmbassador.name}</span>
                                                                <span className="text-gray-400 font-mono">({c.topAmbassador.signups} signups)</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>

                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => handleCreateGroupFromCollege(c)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 transition cursor-pointer"
                                                            title="Turn this college cohort into a managed group"
                                                        >
                                                            <FolderPlus size={14} />
                                                            <span>Create Group</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODALS                                                                    */}
            {/* ========================================================================= */}

            {/* CREATE CAMPAIGN MODAL (ORIGINAL) */}
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
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                            >
                                <X size={20} />
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
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
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
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                                >
                                    {creating ? 'Creating...' : 'Create Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT CAMPAIGN MODAL (ORIGINAL) */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="text-orange-500" size={20} />
                                Edit Campaign / Ambassador
                            </h3>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingItem(null);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Referral Code
                                    </label>
                                    <input
                                        type="text"
                                        value={editingItem.code || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Role / Category
                                    </label>
                                    <select
                                        value={editingItem.category || 'ambassador'}
                                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                                    >
                                        <option value="student">🎓 Student</option>
                                        <option value="ambassador">👑 Ambassador</option>
                                        <option value="creator">✨ Creator</option>
                                        <option value="campaign">🏆 Campaign</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Creator / Ambassador Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingItem.creatorName || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, creatorName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Target College / Uni
                                    </label>
                                    <input
                                        type="text"
                                        value={editingItem.targetCollege || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, targetCollege: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Campaign Title
                                </label>
                                <input
                                    type="text"
                                    value={editingItem.title || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Notes / Commission Terms
                                </label>
                                <textarea
                                    rows="2"
                                    value={editingItem.rewardNotes || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, rewardNotes: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingItem(null);
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                                >
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE AMBASSADOR GROUP MODAL */}
            {isCreateGroupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FolderPlus className="text-indigo-600 dark:text-indigo-400" size={20} />
                                    Create Ambassador Group
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Group ambassadors by college, team, or cohort to monitor joint performance
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateGroupModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroupSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Group / Cohort Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. COEP Pune Stars, West Zone Leads"
                                        value={groupFormData.name}
                                        onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Associated College (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. COEP Tech, IIT Bombay"
                                        value={groupFormData.college}
                                        onChange={(e) => setGroupFormData({ ...groupFormData, college: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Description / Purpose
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Core team driving signups for the Pune orientation fest"
                                    value={groupFormData.description}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Ambassador Picker */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Select Ambassadors to Include ({groupFormData.referralCodeIds.length} selected)
                                    </label>
                                    {groupFormData.referralCodeIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setGroupFormData({ ...groupFormData, referralCodeIds: [] })}
                                            className="text-xs text-red-500 hover:underline cursor-pointer"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>

                                <div className="relative mb-2">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search available ambassadors by name, code or college..."
                                        value={ambassadorPickerSearch}
                                        onChange={(e) => setAmbassadorPickerSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-100 dark:border-gray-700/80 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-900/30">
                                    {pickerAmbassadors.length === 0 ? (
                                        <div className="text-center py-6 text-xs text-gray-400">
                                            No ambassadors found matching search.
                                        </div>
                                    ) : (
                                        pickerAmbassadors.map(item => {
                                            const isSelected = groupFormData.referralCodeIds.includes(item.id);
                                            return (
                                                <label
                                                    key={item.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition border ${
                                                        isSelected
                                                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                                                            : 'bg-white dark:bg-gray-800/60 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) {
                                                                    setGroupFormData({
                                                                        ...groupFormData,
                                                                        referralCodeIds: groupFormData.referralCodeIds.filter(id => id !== item.id)
                                                                    });
                                                                } else {
                                                                    setGroupFormData({
                                                                        ...groupFormData,
                                                                        referralCodeIds: [...groupFormData.referralCodeIds, item.id]
                                                                    });
                                                                }
                                                            }}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <div>
                                                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                                <span>{item.creatorName || (item.referrer ? item.referrer.name : 'Ambassador')}</span>
                                                                <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">({item.code})</span>
                                                            </div>
                                                            {item.targetCollege && (
                                                                <div className="text-[11px] text-gray-400">
                                                                    {item.targetCollege}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.signupCount} signups</span>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateGroupModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingGroup}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                                >
                                    {creatingGroup ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT AMBASSADOR GROUP MODAL */}
            {isEditGroupModalOpen && editingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="text-indigo-600 dark:text-indigo-400" size={20} />
                                Edit Ambassador Group
                            </h3>
                            <button
                                onClick={() => {
                                    setIsEditGroupModalOpen(false);
                                    setEditingGroup(null);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditGroupSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Group / Cohort Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editingGroup.name}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Associated College (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={editingGroup.college}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, college: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Description / Purpose
                                </label>
                                <input
                                    type="text"
                                    value={editingGroup.description}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Ambassador Picker */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Manage Group Members ({editingGroup.referralCodeIds.length} selected)
                                    </label>
                                </div>

                                <div className="relative mb-2">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search available ambassadors..."
                                        value={ambassadorPickerSearch}
                                        onChange={(e) => setAmbassadorPickerSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white focus:outline-none"
                                    />
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-100 dark:border-gray-700/80 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-900/30">
                                    {pickerAmbassadors.map(item => {
                                        const isSelected = editingGroup.referralCodeIds.includes(item.id);
                                        return (
                                            <label
                                                key={item.id}
                                                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition border ${
                                                    isSelected
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                                                        : 'bg-white dark:bg-gray-800/60 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                setEditingGroup({
                                                                    ...editingGroup,
                                                                    referralCodeIds: editingGroup.referralCodeIds.filter(id => id !== item.id)
                                                                });
                                                            } else {
                                                                setEditingGroup({
                                                                    ...editingGroup,
                                                                    referralCodeIds: [...editingGroup.referralCodeIds, item.id]
                                                                });
                                                            }
                                                        }}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                            <span>{item.creatorName || (item.referrer ? item.referrer.name : 'Ambassador')}</span>
                                                            <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">({item.code})</span>
                                                        </div>
                                                        {item.targetCollege && (
                                                            <div className="text-[11px] text-gray-400">
                                                                {item.targetCollege}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.signupCount} signups</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditGroupModalOpen(false);
                                        setEditingGroup(null);
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingGroupEdit}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                                >
                                    {savingGroupEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* GROUP PERFORMANCE & MEMBERS BREAKDOWN MODAL */}
            {isGroupDetailsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 border border-gray-100 dark:border-gray-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        {loadingGroupDetails || !selectedGroupDetails ? (
                            <div className="py-20 flex items-center justify-center">
                                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {/* Group Modal Header */}
                                <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {selectedGroupDetails.group.name}
                                            </h3>
                                            {selectedGroupDetails.group.college && (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    {selectedGroupDetails.group.college}
                                                </span>
                                            )}
                                        </div>
                                        {selectedGroupDetails.group.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {selectedGroupDetails.group.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsGroupDetailsModalOpen(false);
                                            setSelectedGroupDetails(null);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Metric Cards Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Members</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                            {selectedGroupDetails.group.membersCount}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Clicks</div>
                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                            {selectedGroupDetails.group.totalClicks.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Signups</div>
                                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                            {selectedGroupDetails.group.totalSignups.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Conversion</div>
                                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                                            {selectedGroupDetails.group.conversionRate}%
                                        </div>
                                    </div>
                                </div>

                                {/* Content Scrollable Body */}
                                <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                                    {/* Members Breakdown Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Users size={16} className="text-indigo-500" />
                                                Group Ambassadors ({selectedGroupDetails.group.members.length})
                                            </h4>
                                        </div>

                                        <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                                    <tr>
                                                        <th className="py-2.5 px-4">Ambassador</th>
                                                        <th className="py-2.5 px-4">Code & Link</th>
                                                        <th className="py-2.5 px-4">College</th>
                                                        <th className="py-2.5 px-4 text-center">Clicks</th>
                                                        <th className="py-2.5 px-4 text-center">Signups</th>
                                                        <th className="py-2.5 px-4 text-center">Conv. %</th>
                                                        <th className="py-2.5 px-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                                    {selectedGroupDetails.group.members.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="7" className="py-6 text-center text-gray-400">
                                                                No ambassadors added to this group yet. Edit group to assign members.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        selectedGroupDetails.group.members.map(member => {
                                                            const mConv = member.clicksCount > 0
                                                                ? ((member.signupCount / member.clicksCount) * 100).toFixed(1)
                                                                : 0;

                                                            return (
                                                                <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                                                                    <td className="py-3 px-4">
                                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                                            {member.creatorName || (member.referrer ? member.referrer.name : 'Unknown')}
                                                                        </div>
                                                                        {member.referrer?.email && (
                                                                            <div className="text-[11px] text-gray-400">{member.referrer.email}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-1.5 font-mono font-bold text-orange-600 dark:text-orange-400">
                                                                            <span>{member.code}</span>
                                                                            <button
                                                                                onClick={() => handleCopy(member.code)}
                                                                                className="p-1 text-gray-400 hover:text-orange-500 rounded cursor-pointer"
                                                                                title="Copy Link"
                                                                            >
                                                                                <Copy size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                                        {member.targetCollege || '—'}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center font-medium text-gray-700 dark:text-gray-300">
                                                                        {member.clicksCount}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {member.signupCount}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                                                                        {mConv}%
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right">
                                                                        <button
                                                                            onClick={() => handleRemoveMemberFromGroup(selectedGroupDetails.group.id, member.id)}
                                                                            className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                                                                            title="Remove from group"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Recent Signups Attributed to Group Members */}
                                    {selectedGroupDetails.recentAttributions && selectedGroupDetails.recentAttributions.length > 0 && (
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <UserCheck size={16} className="text-emerald-500" />
                                                Recent Signups from Group Ambassadors
                                            </h4>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {selectedGroupDetails.recentAttributions.map((attr, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs overflow-hidden">
                                                                {attr.referredUser?.profile_pic ? (
                                                                    <img src={attr.referredUser.profile_pic} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    attr.referredUser?.name?.charAt(0) || 'U'
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                                    {attr.referredUser?.name || 'Registered User'}
                                                                </div>
                                                                <div className="text-[11px] text-gray-400 truncate max-w-[130px]">
                                                                    {attr.referredUser?.email || '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                                                                {attr.referralCode?.code}
                                                            </span>
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                {new Date(attr.createdAt || attr.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReferrals;
