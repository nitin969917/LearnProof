import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Share2,
    Copy,
    Check,
    Users,
    MousePointerClick,
    TrendingUp,
    Award,
    Sparkles,
    Edit3,
    School,
    Gift,
    Trophy,
    QrCode,
    MessageCircle,
    ExternalLink,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';

export default function AmbassadorDashboard() {
    const { user, token } = useAuth();

    const [referralData, setReferralData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedTemplate, setCopiedTemplate] = useState(null);

    // Edit Code / Profile Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        code: '',
        category: 'ambassador',
        title: '',
        creatorName: '',
        targetCollege: ''
    });

    const fetchAmbassadorData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [codeRes, leaderRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/my-code`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/leaderboard`)
            ]);

            if (codeRes.data?.success) {
                setReferralData(codeRes.data);
                setEditForm({
                    code: codeRes.data.referralCode || '',
                    category: codeRes.data.category || 'ambassador',
                    title: codeRes.data.title || '',
                    creatorName: codeRes.data.creatorName || user?.name || '',
                    targetCollege: codeRes.data.targetCollege || ''
                });
            }

            if (leaderRes.data?.success) {
                setLeaderboard(leaderRes.data.leaderboard || []);
            }
        } catch (err) {
            console.error('Error fetching ambassador data:', err);
            toast.error('Failed to load ambassador dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAmbassadorData();
    }, [token]);

    const getShareUrl = () => {
        const origin = window.location.origin;
        return `${origin}/?ref=${referralData?.referralCode || ''}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getShareUrl());
        setCopied(true);
        toast.success('Referral link copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/my-code`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success) {
                toast.success('Ambassador link updated!');
                setIsEditModalOpen(false);
                fetchAmbassadorData(true);
            }
        } catch (err) {
            console.error('Failed to update code:', err);
            toast.error(err.response?.data?.error || 'Failed to update referral code');
        } finally {
            setSaving(false);
        }
    };

    const copyTemplate = (type, text) => {
        navigator.clipboard.writeText(text);
        setCopiedTemplate(type);
        toast.success('Template copied to clipboard!');
        setTimeout(() => setCopiedTemplate(null), 2500);
    };

    // Calculate Current Milestone Tier
    const signups = referralData?.signupCount || 0;
    const clicks = referralData?.clicksCount || 0;
    const convRate = clicks > 0 ? ((signups / clicks) * 100).toFixed(1) : 0;

    const getTierInfo = () => {
        if (signups >= 100) {
            return {
                name: 'Diamond Lead',
                badge: '💎',
                color: 'from-purple-500 to-indigo-500',
                nextTier: null,
                nextGoal: 100,
                progress: 100,
                perk: 'Stipend Grants & Keynote Speaker Role'
            };
        } else if (signups >= 50) {
            return {
                name: 'Gold Ambassador',
                badge: '🥇',
                color: 'from-amber-500 to-orange-500',
                nextTier: 'Diamond Lead (100 Signups)',
                nextGoal: 100,
                progress: Math.min(100, (signups / 100) * 100),
                perk: 'Official LearnProof Swag Kit'
            };
        } else if (signups >= 10) {
            return {
                name: 'Silver Ambassador',
                badge: '🥈',
                color: 'from-slate-400 to-slate-600',
                nextTier: 'Gold Ambassador (50 Signups)',
                nextGoal: 50,
                progress: Math.min(100, (signups / 50) * 100),
                perk: 'Certificate of Leadership'
            };
        } else {
            return {
                name: 'Bronze Ambassador',
                badge: '🥉',
                color: 'from-orange-500 to-amber-600',
                nextTier: 'Silver Ambassador (10 Signups)',
                nextGoal: 10,
                progress: Math.min(100, (signups / 10) * 100),
                perk: 'Early AI Beta Access & Community Badge'
            };
        }
    };

    const tier = getTierInfo();

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getShareUrl())}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* ── Top Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{tier.badge}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                            {tier.name}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        Campus Ambassador & Creator Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {referralData?.targetCollege ? `Representing ${referralData.targetCollege}` : 'Manage your community link, track peer conversions, and unlock milestone perks.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchAmbassadorData(true)}
                        disabled={refreshing}
                        className="p-2.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-600 shadow-sm"
                        title="Refresh Stats"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold text-sm rounded-xl transition"
                    >
                        <Edit3 size={16} />
                        <span>Customize Code</span>
                    </button>
                </div>
            </div>

            {/* ── Main Shareable Link Card ── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/15">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
                            <Sparkles size={13} /> Your Official Referral Link
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Share with Classmates & Followers
                        </h2>
                        <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                            Anyone who signs up through this link is credited directly to your ambassador leadership profile.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20 flex flex-col gap-3 min-w-[280px]">
                        <div className="flex items-center justify-between gap-2 bg-black/20 px-3.5 py-2.5 rounded-xl">
                            <div className="font-mono text-sm font-bold truncate text-amber-200">
                                {getShareUrl()}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition active:scale-95 shrink-0"
                                title="Copy Link"
                            >
                                {copied ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
                            </button>
                        </div>

                        <button
                            onClick={handleCopy}
                            className="w-full py-2.5 bg-white text-orange-600 font-extrabold text-sm rounded-xl hover:bg-amber-50 shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            <span>{copied ? 'Copied to Clipboard!' : 'Copy Invite Link'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KPI Metrics Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Signups */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Signups</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{signups}</span>
                    </div>
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Verified registered students
                    </div>
                </div>

                {/* Link Clicks */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Link Clicks</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <MousePointerClick size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{clicks}</span>
                    </div>
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Total link visits
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
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{convRate}%</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Click-to-signup conversion
                    </div>
                </div>

                {/* Current Perk */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Perk</span>
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <Gift size={20} />
                        </div>
                    </div>
                    <div className="mt-2 text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                        {tier.perk}
                    </div>
                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                        Tier Level: {tier.name}
                    </div>
                </div>
            </div>

            {/* ── Tier Milestone Progress Bar ── */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white">
                    <span className="flex items-center gap-2">
                        <span>{tier.badge} Current: {tier.name}</span>
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {tier.nextTier ? `Next: ${tier.nextTier}` : 'Max Tier Achieved 🎉'}
                    </span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${tier.progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{signups} Signups Completed</span>
                    {tier.nextGoal && <span>Target: {tier.nextGoal} Signups</span>}
                </div>
            </div>

            {/* ── Promotional Toolkit (1-Click Templates) ── */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Share2 className="text-orange-500" size={20} />
                        Promotional Toolkit (Ready to Share)
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Copy ready-made messages crafted for WhatsApp groups, LinkedIn, and Discord.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* WhatsApp */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                    <MessageCircle size={14} /> WhatsApp Group
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed line-clamp-4">
                                "Hey everyone! 👋 If you're studying from YouTube lectures, check out LearnProof AI. It auto-generates notes, quizzes, and certificates: {getShareUrl()}"
                            </p>
                        </div>
                        <button
                            onClick={() => copyTemplate('whatsapp', `Hey everyone! 👋 If you're studying from YouTube lectures or playlists, check out LearnProof AI. It automatically turns any YouTube playlist into AI notes, quizzes, and verifiable certificates. Sign up free here: ${getShareUrl()}`)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            {copiedTemplate === 'whatsapp' ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedTemplate === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp Post'}</span>
                        </button>
                    </div>

                    {/* LinkedIn */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                    <ExternalLink size={14} /> LinkedIn Post
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed line-clamp-4">
                                "Proud to represent LearnProof AI on our campus! An incredible platform transforming self-directed YouTube education into validated mastery: {getShareUrl()}"
                            </p>
                        </div>
                        <button
                            onClick={() => copyTemplate('linkedin', `Excited to share that I'm serving as a Campus Ambassador for LearnProof AI! 🚀\n\nLearnProof AI transforms any YouTube course into structured learning with AI notes, quizzes, and verifiable certificates for your portfolio.\n\nTry it out free: ${getShareUrl()}\n\n#LearnProof #AI #EdTech #SelfTaught`)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            {copiedTemplate === 'linkedin' ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedTemplate === 'linkedin' ? 'Copied!' : 'Copy LinkedIn Post'}</span>
                        </button>
                    </div>

                    {/* QR Code Poster */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                                    <QrCode size={14} /> QR Code Poster
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Print or scan this QR code for college notice boards, events, and club presentations.
                            </p>
                        </div>
                        <a
                            href={qrUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 text-center"
                        >
                            <QrCode size={14} />
                            <span>Download QR Code</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* ── Recent Signups List ── */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    Students Referred by You ({referralData?.recentSignups?.length || 0})
                </h2>

                {referralData?.recentSignups && referralData.recentSignups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {referralData.recentSignups.map((student, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-sm overflow-hidden">
                                        {student.profile_pic ? (
                                            <img src={student.profile_pic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            student.name?.charAt(0) || 'S'
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {student.name || 'Anonymous Student'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Joined {new Date(student.joinedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                                    +1 Verified
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-400 text-xs sm:text-sm">
                        No signups recorded yet. Share your link above to start earning progress towards {tier.name}!
                    </div>
                )}
            </div>

            {/* ── Edit Code Modal ── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="text-orange-500" size={18} />
                                Customize Ambassador Link
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg text-lg"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Custom Referral Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. IITB_ALEX, CODEWITHDEV"
                                    value={editForm.code}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-orange-600 dark:text-orange-400 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    College / University Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. IIT Bombay, Delhi University"
                                    value={editForm.targetCollege}
                                    onChange={(e) => setEditForm({ ...editForm, targetCollege: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    Display / Creator Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Alex Johnson"
                                    value={editForm.creatorName}
                                    onChange={(e) => setEditForm({ ...editForm, creatorName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            {/* Live Link Preview */}
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl text-xs">
                                <span className="font-semibold text-orange-800 dark:text-orange-300 block mb-0.5">Your New Link:</span>
                                <span className="font-mono text-orange-700 dark:text-orange-400 break-all">
                                    {window.location.origin}/?ref={editForm.code || 'CODE'}
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
