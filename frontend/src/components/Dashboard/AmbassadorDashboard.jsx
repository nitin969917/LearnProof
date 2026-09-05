import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
    CheckCircle2,
    ArrowLeft,
    BookOpen,
    LogOut,
    Home
} from 'lucide-react';
import UserAvatar from '../Common/UserAvatar.jsx';

export default function AmbassadorDashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

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
            const codeRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/my-code`, {
                headers: { Authorization: `Bearer ${token}` }
            });

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
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-gray-500">Loading Ambassador Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-orange-200">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-orange-50 via-amber-50/30 to-transparent pointer-events-none -z-10" />

            {/* ── Standalone Glassmorphism Header ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-3 px-4 sm:px-8 lg:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex shrink-0 items-center">
                            <img src="/LP_logo.png" alt="LearnProof" className="h-9 sm:h-11 w-auto object-contain" />
                        </Link>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200">
                            <Sparkles size={13} className="text-orange-500" />
                            Ambassador Portal
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-bold text-xs sm:text-sm rounded-xl border border-gray-200 shadow-sm transition active:scale-95"
                        >
                            <BookOpen size={16} className="text-orange-500" />
                            <span>Go to Student App</span>
                        </Link>

                        {user && (
                            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                <UserAvatar
                                    src={user.profile_pic}
                                    name={user.name}
                                    className="w-9 h-9 rounded-xl border border-gray-200 shadow-sm"
                                    textClassName="text-sm font-bold"
                                />
                                <span className="hidden md:inline font-bold text-sm text-gray-800 truncate max-w-[120px]">
                                    {user.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Main Container ── */}
            <main className="pt-24 pb-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-6">
                {/* ── Top Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{tier.badge}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                                {tier.name}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                            Campus Ambassador & Creator Portal
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            {referralData?.targetCollege ? `Representing ${referralData.targetCollege}` : 'Manage your community link, track peer conversions, and unlock milestone perks.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchAmbassadorData(true)}
                            disabled={refreshing}
                            className="p-2.5 text-gray-600 bg-orange-50/70 hover:bg-orange-100 rounded-xl transition border border-orange-200 shadow-sm cursor-pointer"
                            title="Refresh Stats"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                        >
                            <Edit3 size={16} />
                            <span>Customize Code</span>
                        </button>
                    </div>
                </div>

                {/* ── Main Shareable Link Card ── */}
                <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/20">
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

                        <div className="bg-white/15 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/25 flex flex-col gap-3 min-w-[280px]">
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
                                className="w-full py-2.5 bg-white text-orange-600 font-extrabold text-sm rounded-xl hover:bg-orange-50 shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-500">Total Signups</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">{signups}</span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-600 font-semibold">
                            Verified registered students
                        </div>
                    </div>

                    {/* Link Clicks */}
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-500">Total Link Clicks</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <MousePointerClick size={20} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">{clicks}</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 font-semibold">
                            Total link visits
                        </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-500">Conversion Rate</span>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">{convRate}%</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 font-medium">
                            Click-to-signup conversion
                        </div>
                    </div>

                    {/* Current Perk */}
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-500">Current Perk</span>
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                <Gift size={20} />
                            </div>
                        </div>
                        <div className="mt-2 text-sm font-bold text-gray-900 line-clamp-2">
                            {tier.perk}
                        </div>
                        <div className="mt-2 text-xs text-orange-600 font-bold">
                            Tier Level: {tier.name}
                        </div>
                    </div>
                </div>

                {/* ── Tier Milestone Progress Bar ── */}
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-orange-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                        <span className="flex items-center gap-2">
                            <span>{tier.badge} Current: {tier.name}</span>
                        </span>
                        <span className="text-xs font-bold text-orange-600">
                            {tier.nextTier ? `Next Goal: ${tier.nextTier}` : 'Max Tier Achieved 🎉'}
                        </span>
                    </div>

                    <div className="w-full bg-orange-100/60 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${tier.progress}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{signups} Signups Completed</span>
                        {tier.nextGoal && <span>Target: {tier.nextGoal} Signups</span>}
                    </div>
                </div>

                {/* ── Promotional Toolkit (1-Click Templates) ── */}
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-orange-100 shadow-sm space-y-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Share2 className="text-orange-500" size={20} />
                            Promotional Toolkit (Ready to Share)
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Copy ready-made messages crafted for WhatsApp groups, LinkedIn, and Discord.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* WhatsApp */}
                        <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 flex flex-col justify-between gap-3">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                        <MessageCircle size={14} /> WhatsApp Group
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-4">
                                    "Hey everyone! 👋 If you're studying from YouTube lectures, check out LearnProof AI. It auto-generates notes, quizzes, and certificates: {getShareUrl()}"
                                </p>
                            </div>
                            <button
                                onClick={() => copyTemplate('whatsapp', `Hey everyone! 👋 If you're studying from YouTube lectures or playlists, check out LearnProof AI. It automatically turns any YouTube playlist into AI notes, quizzes, and verifiable certificates. Sign up free here: ${getShareUrl()}`)}
                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {copiedTemplate === 'whatsapp' ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedTemplate === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp Post'}</span>
                            </button>
                        </div>

                        {/* LinkedIn */}
                        <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 flex flex-col justify-between gap-3">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                                        <ExternalLink size={14} /> LinkedIn Post
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-4">
                                    "Proud to represent LearnProof AI on our campus! An incredible platform transforming self-directed YouTube education into validated mastery: {getShareUrl()}"
                                </p>
                            </div>
                            <button
                                onClick={() => copyTemplate('linkedin', `Excited to share that I'm serving as a Campus Ambassador for LearnProof AI! 🚀\n\nLearnProof AI transforms any YouTube course into structured learning with AI notes, quizzes, and verifiable certificates for your portfolio.\n\nTry it out free: ${getShareUrl()}\n\n#LearnProof #AI #EdTech #SelfTaught`)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {copiedTemplate === 'linkedin' ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedTemplate === 'linkedin' ? 'Copied!' : 'Copy LinkedIn Post'}</span>
                            </button>
                        </div>

                        {/* QR Code Poster */}
                        <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 flex flex-col justify-between gap-3">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                                        <QrCode size={14} /> QR Code Poster
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
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
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-orange-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        Students Referred by You ({referralData?.recentSignups?.length || 0})
                    </h2>

                    {referralData?.recentSignups && referralData.recentSignups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {referralData.recentSignups.map((student, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/40 border border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm overflow-hidden">
                                            {student.profile_pic ? (
                                                <img src={student.profile_pic} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                student.name?.charAt(0) || 'S'
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {student.name || 'Anonymous Student'}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Joined {new Date(student.joinedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
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
            </main>

            {/* ── Edit Code Modal ── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-orange-100 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Edit3 className="text-orange-500" size={18} />
                                Customize Ambassador Link
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg text-lg cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Custom Referral Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. IITB_ALEX, CODEWITHDEV"
                                    value={editForm.code}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm font-mono font-bold text-orange-600 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    College / University Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. IIT Bombay, Delhi University"
                                    value={editForm.targetCollege}
                                    onChange={(e) => setEditForm({ ...editForm, targetCollege: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Display / Creator Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Alex Johnson"
                                    value={editForm.creatorName}
                                    onChange={(e) => setEditForm({ ...editForm, creatorName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            {/* Live Link Preview */}
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs">
                                <span className="font-semibold text-orange-800 block mb-0.5">Your New Link:</span>
                                <span className="font-mono text-orange-700 break-all">
                                    {window.location.origin}/?ref={editForm.code || 'CODE'}
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-orange-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
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
