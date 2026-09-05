import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Award,
    Sparkles,
    Users,
    TrendingUp,
    CheckCircle,
    ArrowRight,
    Copy,
    Check,
    Share2,
    Shield,
    Gift,
    School,
    Trophy,
    ChevronDown,
    ExternalLink,
    Zap,
    BookOpen
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ambassadorFaqs = [
    {
        q: "Who is eligible to become a Campus Ambassador or Creator?",
        a: "Any active college student, coding club lead, educator, or tech content creator can join. There are no fees or minimum audience requirements."
    },
    {
        q: "How does referral tracking work?",
        a: "When you share your unique referral link (e.g., learnproof.org/?ref=YOUR_CODE), any peer who visits and creates an account is permanently credited to your ambassador profile."
    },
    {
        q: "What perks and rewards do ambassadors receive?",
        a: "Ambassadors earn verified certificates of leadership, LinkedIn badges, free AI Pro credits, exclusive LearnProof swag packages, and priority internship referrals."
    },
    {
        q: "Can I customize my referral link code?",
        a: "Yes! Once logged in, you can choose any unique custom code like IITB_LEAD or CODEWITHDEV directly from your Ambassador Dashboard."
    },
    {
        q: "Is there an admin approval process required?",
        a: "No! The program is 100% self-serve. You get instant access to your link and analytics immediately upon sign-in."
    }
];

export default function AmbassadorLanding() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [programStats, setProgramStats] = useState({
        totalAmbassadors: 120,
        totalStudentsReferred: 1500,
        collegesRepresented: 35
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        // Fetch public program stats & leaderboard
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/public-info`)
            .then(res => {
                if (res.data?.success) {
                    setProgramStats(res.data);
                }
            })
            .catch(() => {});

        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/leaderboard`)
            .then(res => {
                if (res.data?.success) {
                    setLeaderboard(res.data.leaderboard || []);
                }
            })
            .catch(() => {});
    }, []);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await login(credentialResponse);
            toast.success("Welcome to the Ambassador Program!");
            navigate('/dashboard/ambassador');
        } catch (err) {
            console.error("Ambassador login error:", err);
            toast.error("Failed to sign in");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-white font-sans overflow-x-hidden">
            {/* ── Background Gradients ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-orange-600/20 via-amber-500/15 to-purple-600/10 blur-[130px] rounded-full" />
                <div className="absolute top-1/2 -right-40 w-[600px] h-[500px] bg-orange-600/10 blur-[140px] rounded-full" />
            </div>

            {/* ── Header / Navbar ── */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/10 px-4 sm:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap className="text-white fill-white" size={20} />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                            LearnProof <span className="text-orange-500 text-sm font-bold uppercase tracking-wider ml-1 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">Ambassador</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <button
                                onClick={() => navigate('/dashboard/ambassador')}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95"
                            >
                                <span>My Ambassador Dashboard</span>
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="scale-95 origin-right">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Sign in failed')}
                                    theme="filled_black"
                                    shape="pill"
                                    text="signin_with"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Hero Section ── */}
            <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
                    <Sparkles size={14} className="text-orange-400 animate-pulse" />
                    <span>Campus Ambassador & Creator Program 2026</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                    Lead Your Campus. <br />
                    <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                        Empower Peers with AI Learning.
                    </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Help classmates transform any YouTube lecture into verified certificates, interactive quizzes, and AI notes. Earn recognized leadership certificates, swag, and community perks.
                </p>

                {/* Hero CTA Box */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                    {user ? (
                        <button
                            onClick={() => navigate('/dashboard/ambassador')}
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-orange-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>Open Ambassador Portal</span>
                            <ArrowRight size={18} />
                        </button>
                    ) : (
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error('Sign in failed')}
                                theme="filled_black"
                                shape="pill"
                                size="large"
                                text="continue_with"
                            />
                        </div>
                    )}
                </div>

                {/* Live Numbers Strip */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="text-3xl font-extrabold text-orange-400">
                            {programStats.totalAmbassadors}+
                        </div>
                        <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            Campus Leads & Creators
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="text-3xl font-extrabold text-amber-400">
                            {programStats.totalStudentsReferred.toLocaleString()}+
                        </div>
                        <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            Students Empowered
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="text-3xl font-extrabold text-emerald-400">
                            {programStats.collegesRepresented}+
                        </div>
                        <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            Universities & Colleges
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works Section ── */}
            <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        How The Program Works
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">
                        Get started in 30 seconds — no manual approval required.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-md relative">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 font-extrabold flex items-center justify-center mb-4 border border-orange-500/30">
                            1
                        </div>
                        <h3 className="text-lg font-bold text-white">Claim Your Custom Code</h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Sign in with your student Google account. Pick your custom campaign code (e.g. <span className="text-orange-400 font-mono">IITB_AI</span>) and college name.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-md relative">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center mb-4 border border-amber-500/30">
                            2
                        </div>
                        <h3 className="text-lg font-bold text-white">Share With Your Circle</h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Share your link in WhatsApp groups, Telegram study channels, LinkedIn, or college coding events with ready-made promotional templates.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-md relative">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center mb-4 border border-emerald-500/30">
                            3
                        </div>
                        <h3 className="text-lg font-bold text-white">Track & Unlock Tiers</h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Watch signups roll in on your real-time dashboard. Unlock verified certificates of leadership, merchandise, and top leaderboard ranks.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Perks & Milestone Tiers ── */}
            <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Milestones & Ambassador Perks
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">
                        Earn community status, tangible leadership credentials, and exclusive access.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Bronze */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                        <div>
                            <div className="text-2xl mb-2">🥉</div>
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Tier 1 • 1+ Signups</span>
                            <h3 className="text-lg font-bold text-white mt-1">Bronze Ambassador</h3>
                            <ul className="mt-4 space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                    <span>Verified Ambassador Badge</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                    <span>Real-Time Analytics Access</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                    <span>Early AI Features Beta</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Silver */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                        <div>
                            <div className="text-2xl mb-2">🥈</div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tier 2 • 10+ Signups</span>
                            <h3 className="text-lg font-bold text-white mt-1">Silver Ambassador</h3>
                            <ul className="mt-4 space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-slate-300 mt-0.5 shrink-0" />
                                    <span>Certificate of Leadership</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-slate-300 mt-0.5 shrink-0" />
                                    <span>LinkedIn Recommendation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-slate-300 mt-0.5 shrink-0" />
                                    <span>Community Moderator Role</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Gold */}
                    <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 to-orange-500/5 border border-amber-500/30 flex flex-col justify-between">
                        <div>
                            <div className="text-2xl mb-2">🥇</div>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tier 3 • 50+ Signups</span>
                            <h3 className="text-lg font-bold text-white mt-1">Gold Ambassador</h3>
                            <ul className="mt-4 space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                    <span>Official LearnProof Swag Kit</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                    <span>Featured on Global Leaderboard</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                    <span>Free 1-Year AI Pro Pass</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Diamond */}
                    <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-500/10 to-indigo-500/5 border border-purple-500/30 flex flex-col justify-between">
                        <div>
                            <div className="text-2xl mb-2">💎</div>
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tier 4 • 100+ Signups</span>
                            <h3 className="text-lg font-bold text-white mt-1">Diamond Lead</h3>
                            <ul className="mt-4 space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-purple-400 mt-0.5 shrink-0" />
                                    <span>Internship Priority Interview</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-purple-400 mt-0.5 shrink-0" />
                                    <span>Campus Keynote Speaker Role</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-purple-400 mt-0.5 shrink-0" />
                                    <span>Cash Rewards & Stipend Grants</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Live Leaderboard Preview ── */}
            {leaderboard.length > 0 && (
                <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-2">
                            <Trophy size={14} /> Global Rankings
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Top Campus Ambassadors
                        </h2>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                        <div className="divide-y divide-white/10">
                            {leaderboard.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                            idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30' :
                                            idx === 1 ? 'bg-slate-300 text-slate-950' :
                                            idx === 2 ? 'bg-amber-700 text-white' :
                                            'bg-white/10 text-slate-300'
                                        }`}>
                                            #{item.rank}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                                                <School size={12} /> {item.college}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-extrabold text-emerald-400">
                                            {item.signups} Signups
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {item.clicks} link clicks
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── FAQ Section ── */}
            <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-3">
                    {ambassadorFaqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden transition"
                            >
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-sm text-slate-100"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>© 2026 LearnProof AI. Empowering students worldwide.</p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Link to="/privacy-policy" className="hover:text-white transition">Privacy</Link>
                        <Link to="/terms" className="hover:text-white transition">Terms</Link>
                        <Link to="/support" className="hover:text-white transition">Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
