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
    BookOpen,
    Headphones,
    Radio,
    Flame,
    Download,
    Send,
    Layers,
    ChevronRight,
    Star,
    CheckCheck
} from 'lucide-react';
import UserAvatar from '../Common/UserAvatar.jsx';

export default function AmbassadorDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedTemplate, setCopiedTemplate] = useState(null);
    const [activeToolkitTab, setActiveToolkitTab] = useState('all-in-one'); // 'all-in-one', 'liverooms', 'youtube-ai', 'certificates', 'qr-poster'

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
        toast.success('Referral link copied to clipboard!');
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
                toast.success('Ambassador link customized successfully!');
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
        toast.success('Promotional template copied!');
        setTimeout(() => setCopiedTemplate(null), 2500);
    };

    const directShare = (platform, text) => {
        const url = getShareUrl();
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);

        let shareLink = '';
        if (platform === 'whatsapp') {
            shareLink = `https://api.whatsapp.com/send?text=${encodedText}`;
        } else if (platform === 'telegram') {
            shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        } else if (platform === 'linkedin') {
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        } else if (platform === 'twitter') {
            shareLink = `https://twitter.com/intent/tweet?text=${encodedText}`;
        }

        if (shareLink) {
            window.open(shareLink, '_blank', 'noopener,noreferrer');
        }
    };

    // Calculate Current Milestone Tier
    const signups = referralData?.signupCount || 0;
    const clicks = referralData?.clicksCount || 0;
    const convRate = clicks > 0 ? ((signups / clicks) * 100).toFixed(1) : 0;

    const tiers = [
        {
            level: 'Bronze',
            minSignups: 0,
            badge: '🥉',
            name: 'Bronze Ambassador',
            perk: 'Early AI Beta Access & Ambassador Badge',
            color: 'text-amber-600 bg-amber-50 border-amber-200'
        },
        {
            level: 'Silver',
            minSignups: 10,
            badge: '🥈',
            name: 'Silver Ambassador',
            perk: 'Certificate of Leadership + Premium AI Features',
            color: 'text-slate-600 bg-slate-100 border-slate-200'
        },
        {
            level: 'Gold',
            minSignups: 50,
            badge: '🥇',
            name: 'Gold Ambassador',
            perk: 'Official LearnProof Swag Kit & Event Sponsorship',
            color: 'text-amber-500 bg-amber-50 border-amber-300'
        },
        {
            level: 'Diamond',
            minSignups: 100,
            badge: '💎',
            name: 'Diamond Lead',
            perk: 'Monthly Creator Stipend & Keynote Speaker Role',
            color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
        }
    ];

    const getTierInfo = () => {
        if (signups >= 100) {
            return {
                name: 'Diamond Lead',
                badge: '💎',
                nextTier: null,
                nextGoal: 100,
                progress: 100,
                perk: 'Monthly Creator Stipend & Keynote Speaker Role'
            };
        } else if (signups >= 50) {
            return {
                name: 'Gold Ambassador',
                badge: '🥇',
                nextTier: 'Diamond Lead (100 Signups)',
                nextGoal: 100,
                progress: Math.min(100, (signups / 100) * 100),
                perk: 'Official LearnProof Swag Kit & Event Sponsorship'
            };
        } else if (signups >= 10) {
            return {
                name: 'Silver Ambassador',
                badge: '🥈',
                nextTier: 'Gold Ambassador (50 Signups)',
                nextGoal: 50,
                progress: Math.min(100, (signups / 50) * 100),
                perk: 'Certificate of Leadership + Premium AI Features'
            };
        } else {
            return {
                name: 'Bronze Ambassador',
                badge: '🥉',
                nextTier: 'Silver Ambassador (10 Signups)',
                nextGoal: 10,
                progress: Math.min(100, (signups / 10) * 100),
                perk: 'Early AI Beta Access & Ambassador Badge'
            };
        }
    };

    const currentTier = getTierInfo();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(getShareUrl())}`;

    // Promotional toolkit templates covering all key features
    const toolkitTemplates = {
        'all-in-one': [
            {
                id: 'all-whatsapp',
                title: 'WhatsApp Class / College Group',
                platform: 'whatsapp',
                badge: 'Highest Conversion 🚀',
                text: `Hey guys! 👋 Stop studying alone and losing track of your courses. Check out LearnProof AI 🚀\n\n✨ What you can do for FREE:\n1️⃣ Live Interactive Study Rooms — Practice languages, interview prep & study with peers in real-time!\n2️⃣ Turn ANY YouTube Playlist into AI notes, summaries & flashcards.\n3️⃣ Pass instant quizzes & claim verified certificates for your LinkedIn!\n\n👉 Join with my link to unlock early ambassador perks: ${getShareUrl()}`
            },
            {
                id: 'all-linkedin',
                title: 'LinkedIn Network Post',
                platform: 'linkedin',
                badge: 'Professional & Resume 💼',
                text: `Proud to represent LearnProof AI as a Campus Ambassador! 🎓🚀\n\nSelf-learning is powerful, but accountability and validation are where most students struggle. LearnProof AI brings together:\n• Live interactive study & language practice rooms with real peers\n• AI-powered structured learning from top YouTube courses\n• Proof-of-learning certificates validated on your profile\n\nEmpower your daily learning journey today (100% Free): ${getShareUrl()}\n\n#LearnProof #EdTech #AI #SelfTaught #CollegeAmbassador #Students`
            },
            {
                id: 'all-telegram',
                title: 'Telegram & Discord Study Channels',
                platform: 'telegram',
                badge: 'Community Friendly 💬',
                text: `⚡ Best student AI tool of the year: LearnProof AI ⚡\n\nTurn YouTube courses into actual proof of learning + join 24/7 live voice study & language rooms with learners worldwide.\n\n🔗 Get Free VIP Access: ${getShareUrl()}`
            }
        ],
        'liverooms': [
            {
                id: 'room-whatsapp',
                title: 'Live Voice & Language Practice Invite',
                platform: 'whatsapp',
                badge: 'Interactive Feature 🎙️',
                text: `Hey everyone! 🎙️ If you want to practice English/language speaking or study with serious peers in live audio rooms, join us on LearnProof Live Rooms!\n\n👥 Hop into live rooms, speak with real learners, and track your daily streak.\n\nJoin my room circle here: ${getShareUrl()}`
            },
            {
                id: 'room-linkedin',
                title: 'Language & Group Study Spotlight',
                platform: 'linkedin',
                badge: 'Collab Learning ✨',
                text: `Struggling to practice English communication or stay focused during study sessions? 🎧\n\nLearnProof AI features live interactive rooms where students collaborate in real-time, solve quizzes together, and build confidence.\n\nJoin our community today: ${getShareUrl()}\n\n#LanguageLearning #SpeakingPractice #Productivity #StudyGroup #LearnProof`
            }
        ],
        'youtube-ai': [
            {
                id: 'yt-whatsapp',
                title: 'YouTube Playlist to Notes & Quiz',
                platform: 'whatsapp',
                badge: 'Study Smarter 📚',
                text: `Watched hundreds of hours of YouTube coding or lecture videos with zero notes? 🤯\n\nLearnProof AI automatically converts any YouTube playlist into structured chapter notes, AI summaries, and practice quizzes so you actually retain knowledge!\n\nTry it free here: ${getShareUrl()}`
            },
            {
                id: 'yt-telegram',
                title: 'Tech & Coding Playlist Transformer',
                platform: 'telegram',
                badge: 'Developer Favorite 💻',
                text: `👨‍💻 Learn DSA, Web Dev, or AI 10x faster: Paste any YouTube course link into LearnProof AI, and it gives you organized notes + instant quizzes after every lesson.\n\n🔗 Link: ${getShareUrl()}`
            }
        ],
        'certificates': [
            {
                id: 'cert-linkedin',
                title: 'Verifiable Proof & Certificate Post',
                platform: 'linkedin',
                badge: 'Career & Portfolio 🏆',
                text: `Did you know you can earn verifiable certificates from your free YouTube self-learning? 📜✨\n\nWith LearnProof AI, you prove what you learned through AI-proctored quizzes and earn credible certificates you can directly showcase to recruiters.\n\nStart validating your skills: ${getShareUrl()}\n\n#Certificates #SelfLearning #CareerGrowth #LearnProofAI`
            },
            {
                id: 'cert-whatsapp',
                title: 'Resume Booster for College Students',
                platform: 'whatsapp',
                badge: 'Placement Prep 🎯',
                text: `Guys, add proof to your resume! 🎓 Take any free course on LearnProof AI, pass the milestone quizzes, and download verified certificates to add to your LinkedIn & resume.\n\nGet started free: ${getShareUrl()}`
            }
        ]
    };

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
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-gradient-to-b from-orange-100/60 via-amber-50/40 to-transparent pointer-events-none -z-10" />

            {/* ── Fixed Glassmorphism Top Navigation ── */}
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
            <main className="pt-24 pb-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-7">
                {/* ── Top Header Banner ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl">{currentTier.badge}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                                {currentTier.name}
                            </span>
                            {referralData?.targetCollege && (
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <School size={12} /> {referralData.targetCollege}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                            Campus Ambassador & Creator Portal
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Track peer signups, promote Live Rooms & AI features, and unlock milestone rewards.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchAmbassadorData(true)}
                            disabled={refreshing}
                            className="p-2.5 text-gray-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition border border-orange-200 shadow-sm cursor-pointer"
                            title="Refresh Analytics"
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

                {/* ── Main Shareable Link & Social Action Bar ── */}
                <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/20">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
                                <Sparkles size={13} /> Your Unique Ambassador Link
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Invite Classmates & Share Everywhere
                            </h2>
                            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                                Every student who registers via your link earns you instant tier points toward verified leadership certificates and swag!
                            </p>
                            
                            {/* Quick 1-Click Social Share Badges */}
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-orange-100">1-Click Share:</span>
                                <button
                                    onClick={() => directShare('whatsapp', `Hey! Check out LearnProof AI for Live Study Rooms & YouTube course notes: ${getShareUrl()}`)}
                                    className="px-3 py-1 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                    <MessageCircle size={13} /> WhatsApp
                                </button>
                                <button
                                    onClick={() => directShare('telegram', `Join me on LearnProof AI: ${getShareUrl()}`)}
                                    className="px-3 py-1 bg-sky-500/80 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                    <Send size={13} /> Telegram
                                </button>
                                <button
                                    onClick={() => directShare('linkedin', `Join LearnProof AI: ${getShareUrl()}`)}
                                    className="px-3 py-1 bg-blue-700/80 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                    <ExternalLink size={13} /> LinkedIn
                                </button>
                                <button
                                    onClick={() => directShare('twitter', `Learning with peers on LearnProof AI: ${getShareUrl()}`)}
                                    className="px-3 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                    𝕏 Post
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/15 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/25 flex flex-col gap-3 min-w-[290px]">
                            <div className="flex items-center justify-between gap-2 bg-black/25 px-3.5 py-2.5 rounded-xl">
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

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="py-2.5 px-3 bg-white text-orange-600 font-extrabold text-xs rounded-xl hover:bg-orange-50 shadow-md transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {copied ? <Check size={15} /> : <Copy size={15} />}
                                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                                </button>
                                <a
                                    href={qrUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-2.5 px-3 bg-orange-950/40 hover:bg-orange-950/60 text-white font-extrabold text-xs rounded-xl border border-white/20 transition transform active:scale-95 flex items-center justify-center gap-1.5 text-center cursor-pointer"
                                >
                                    <QrCode size={15} />
                                    <span>View QR</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── KPI Metrics Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Signups */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Signups</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">{signups}</span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Verified registered students
                        </div>
                    </div>

                    {/* Link Clicks */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Link Clicks</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <MousePointerClick size={20} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">{clicks}</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 font-semibold">
                            Total community link visits
                        </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conversion Rate</span>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">{convRate}%</span>
                        </div>
                        <div className="mt-2 text-xs text-purple-600 font-semibold">
                            Click-to-signup efficiency
                        </div>
                    </div>

                    {/* Current Perk */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Perk</span>
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                <Gift size={20} />
                            </div>
                        </div>
                        <div className="mt-2 text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">
                            {currentTier.perk}
                        </div>
                        <div className="mt-2 text-[11px] text-orange-600 font-bold uppercase tracking-wider">
                            Tier: {currentTier.name}
                        </div>
                    </div>
                </div>

                {/* ── Tier Milestone Roadmap ── */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Trophy className="text-amber-500" size={18} />
                                Ambassador Milestone & Rewards Roadmap
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Reach each referral milestone to unlock exclusive benefits</p>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                            {currentTier.nextTier ? `Next Milestone: ${currentTier.nextTier}` : 'Max Milestone Unlocked 🎉'}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${currentTier.progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                            <span>{signups} Students Referred</span>
                            {currentTier.nextGoal && <span>Target: {currentTier.nextGoal} Signups</span>}
                        </div>
                    </div>

                    {/* 4-Tier Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                        {tiers.map((t) => {
                            const isReached = signups >= t.minSignups;
                            return (
                                <div
                                    key={t.level}
                                    className={`p-4 rounded-2xl border transition-all ${
                                        isReached
                                            ? 'bg-orange-50/40 border-orange-200 shadow-sm'
                                            : 'bg-slate-50/70 border-slate-200 opacity-70'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xl">{t.badge}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.color}`}>
                                            {t.minSignups}+ Signups
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-xs text-gray-900">{t.name}</h4>
                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.perk}</p>
                                    {isReached && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-2">
                                            <CheckCheck size={12} /> Unlocked
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Enhanced Promotional Toolkit (Multi-Category) ── */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                            <div className="flex items-center gap-2">
                                <Share2 className="text-orange-500" size={20} />
                                <h2 className="text-lg font-bold text-gray-900">
                                    Promotional Toolkit (Ready to Share)
                                </h2>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Pre-crafted high-converting message templates covering all platform features: Live Study Rooms, YouTube AI Notes, and Certifications.
                            </p>
                        </div>
                    </div>

                    {/* Toolkit Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                            onClick={() => setActiveToolkitTab('all-in-one')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                                activeToolkitTab === 'all-in-one'
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        >
                            <Sparkles size={14} /> Complete Platform Pitch
                        </button>
                        <button
                            onClick={() => setActiveToolkitTab('liverooms')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                                activeToolkitTab === 'liverooms'
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        >
                            <Radio size={14} className="text-red-400" /> Live Audio & Language Rooms
                        </button>
                        <button
                            onClick={() => setActiveToolkitTab('youtube-ai')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                                activeToolkitTab === 'youtube-ai'
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        >
                            <BookOpen size={14} /> YouTube AI Notes & Quizzes
                        </button>
                        <button
                            onClick={() => setActiveToolkitTab('certificates')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                                activeToolkitTab === 'certificates'
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        >
                            <Award size={14} /> Verifiable Certificates & Career
                        </button>
                        <button
                            onClick={() => setActiveToolkitTab('qr-poster')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                                activeToolkitTab === 'qr-poster'
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        >
                            <QrCode size={14} /> College QR Poster Kit
                        </button>
                    </div>

                    {/* Toolkit Content Area */}
                    {activeToolkitTab !== 'qr-poster' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {toolkitTemplates[activeToolkitTab]?.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="p-4 rounded-2xl bg-orange-50/30 border border-orange-100 hover:border-orange-200 flex flex-col justify-between gap-3 transition hover:shadow-sm"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                                {item.platform === 'whatsapp' && <MessageCircle size={14} className="text-emerald-500" />}
                                                {item.platform === 'linkedin' && <ExternalLink size={14} className="text-blue-600" />}
                                                {item.platform === 'telegram' && <Send size={14} className="text-sky-500" />}
                                                {item.title}
                                            </span>
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                {item.badge}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-orange-100/60 text-xs text-gray-700 leading-relaxed font-sans select-all whitespace-pre-line max-h-48 overflow-y-auto custom-scrollbar">
                                            {item.text}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button
                                            onClick={() => copyTemplate(item.id, item.text)}
                                            className="py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            {copiedTemplate === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                            <span>{copiedTemplate === item.id ? 'Copied!' : 'Copy Text'}</span>
                                        </button>
                                        <button
                                            onClick={() => directShare(item.platform, item.text)}
                                            className={`py-2 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                                item.platform === 'whatsapp' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                item.platform === 'linkedin' ? 'bg-blue-600 hover:bg-blue-700' :
                                                'bg-sky-500 hover:bg-sky-600'
                                            }`}
                                        >
                                            <Send size={14} />
                                            <span>Direct Share</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* QR Poster Kit View */
                        <div className="p-6 bg-gradient-to-br from-orange-50/60 to-amber-50/40 rounded-2xl border border-orange-200 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-3 max-w-lg">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                    <QrCode size={14} /> Campus Noticeboard & Presentation Kit
                                </div>
                                <h3 className="text-xl font-black text-gray-900">
                                    High-Resolution Referral QR Code
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Print or project this QR code during college tech talks, club events, classroom presentations, or post it on student WhatsApp/Telegram bulletin boards. Anyone who scans will immediately land on your link.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <a
                                        href={qrUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                                    >
                                        <Download size={15} /> Download Poster QR
                                    </a>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 shadow-sm transition flex items-center gap-2 cursor-pointer"
                                    >
                                        {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                                        <span>Copy Link Instead</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-lg flex flex-col items-center gap-3 text-center shrink-0">
                                <img src={qrUrl} alt="Referral QR Code" className="w-48 h-48 rounded-xl object-contain bg-slate-50" />
                                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                                    CODE: {referralData?.referralCode || 'LP'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Recent Signups Table/List ── */}
                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-7">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            Students Referred by You ({referralData?.recentSignups?.length || 0})
                        </h2>
                        <span className="text-xs text-gray-400 font-medium">Automatic realtime tracking</span>
                    </div>

                    {referralData?.recentSignups && referralData.recentSignups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {referralData.recentSignups.map((student, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/40 border border-orange-100 hover:bg-orange-50/70 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm overflow-hidden shrink-0 border border-orange-200">
                                            {student.profile_pic ? (
                                                <img src={student.profile_pic} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                student.name?.charAt(0) || 'S'
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-gray-900 truncate">
                                                {student.name || 'Anonymous Student'}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Joined {new Date(student.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shrink-0">
                                        Verified
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400 text-xs sm:text-sm">
                            No signups recorded yet. Share your link above to start earning progress towards {currentTier.name}!
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
