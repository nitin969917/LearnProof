import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    BookOpen,
    Menu,
    X,
    Star,
    MessageCircle,
    CheckSquare,
    HeartHandshake,
    Linkedin,
    Target,
    Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ambassadorFaqs = [
    {
        q: "Who is eligible to become a Campus Ambassador or Creator?",
        a: "Any active college student, coding club lead, educator, or tech content creator can join. There are no registration fees or minimum audience requirements."
    },
    {
        q: "How does referral tracking and attribution work?",
        a: "When you share your unique referral link (e.g. learnproof.org/?ref=YOUR_CODE), any student who visits through your link and creates an account is permanently credited to your ambassador profile in real-time."
    },
    {
        q: "What perks, badges, and rewards do ambassadors receive?",
        a: "Ambassadors earn official Verifiable Leadership Certificates, LinkedIn recommendation badges, free LearnProof Pro access, exclusive merchandise & swag kits, and fast-tracked internship referrals."
    },
    {
        q: "Can I customize my referral code and college name?",
        a: "Yes! Once you log in, you can instantly customize your referral code (e.g. IITB_LEAD or PYTHON_NINJA) and assign your college/organization directly from your self-serve Ambassador Dashboard."
    },
    {
        q: "Is there an admin approval process required before I can start?",
        a: "No! The entire program is 100% self-serve and automated. You get instant access to your customized link, QR codes, social templates, and live analytics immediately upon sign-in."
    }
];

export default function AmbassadorLanding() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [programStats, setProgramStats] = useState({
        totalAmbassadors: 140,
        totalStudentsReferred: 1850,
        collegesRepresented: 42
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [openFaq, setOpenFaq] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sampleRefCode, setSampleRefCode] = useState('CAMPUS_LEAD');
    const [copiedSample, setCopiedSample] = useState(false);

    useEffect(() => {
        // Fetch live public stats
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/public-info`)
            .then(res => {
                if (res.data?.success) {
                    setProgramStats(prev => ({
                        totalAmbassadors: res.data.totalAmbassadors || prev.totalAmbassadors,
                        totalStudentsReferred: res.data.totalStudentsReferred || prev.totalStudentsReferred,
                        collegesRepresented: res.data.collegesRepresented || prev.collegesRepresented
                    }));
                }
            })
            .catch(() => {});

        // Fetch live leaderboard
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/leaderboard`)
            .then(res => {
                if (res.data?.success && res.data.leaderboard) {
                    setLeaderboard(res.data.leaderboard);
                }
            })
            .catch(() => {});
    }, []);

    const handleManualGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = window.location.origin;
        const nonce = Math.random().toString(36).substring(2);
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=id_token` +
            `&scope=${encodeURIComponent('openid email profile')}` +
            `&nonce=${nonce}` +
            `&ux_mode=redirect` +
            `&prompt=select_account`;
            
        window.location.href = authUrl;
    };

    const handlePrimaryCta = () => {
        if (user) {
            navigate('/ambassador/portal');
        } else {
            handleManualGoogleLogin();
        }
    };

    const handleCopySample = () => {
        const url = `${window.location.origin}/?ref=${sampleRefCode}`;
        navigator.clipboard.writeText(url);
        setCopiedSample(true);
        toast.success("Example referral link copied!");
        setTimeout(() => setCopiedSample(false), 2000);
    };

    const perks = [
        {
            icon: <Award className="w-7 h-7 text-orange-600" />,
            title: "Verified Leadership Credentials",
            description: "Receive an official, tamper-proof Certificate of Leadership with an authentic Verification ID to showcase on LinkedIn and your resume.",
            badge: "Certificate",
            bg: "bg-orange-50",
            border: "border-orange-200"
        },
        {
            icon: <Zap className="w-7 h-7 text-amber-600" />,
            title: "Free LearnProof Pro Perks",
            description: "Unlock premium AI video summaries, unlimited course tracking, priority roadmap generations, and higher token quotas for life.",
            badge: "Pro Access",
            bg: "bg-amber-50",
            border: "border-amber-200"
        },
        {
            icon: <Gift className="w-7 h-7 text-red-600" />,
            title: "Exclusive Swag & Goodies",
            description: "Top ambassadors receive custom LearnProof hoodies, t-shirts, laptop stickers, and physical certificate kits delivered to their doorstep.",
            badge: "Merchandise",
            bg: "bg-red-50",
            border: "border-red-200"
        },
        {
            icon: <HeartHandshake className="w-7 h-7 text-emerald-600" />,
            title: "Internship & Career Fast-Track",
            description: "Direct letters of recommendation from the founding team, plus priority interviews for engineering, product, and growth internships.",
            badge: "Career Growth",
            bg: "bg-emerald-50",
            border: "border-emerald-200"
        },
        {
            icon: <TrendingUp className="w-7 h-7 text-blue-600" />,
            title: "Live Analytics & Attribution",
            description: "Self-serve real-time dashboard displaying your link clicks, registered students, conversion rates, and milestone reward progress.",
            badge: "Live Telemetry",
            bg: "bg-blue-50",
            border: "border-blue-200"
        },
        {
            icon: <Users className="w-7 h-7 text-purple-600" />,
            title: "Founder Mentorship & Network",
            description: "Join an exclusive private community of top campus leaders across 40+ universities, with monthly sessions and direct founder access.",
            badge: "Community",
            bg: "bg-purple-50",
            border: "border-purple-200"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Claim Your Custom Link",
            description: "Sign in with 1-click and customize your unique referral handle (e.g., learnproof.org/?ref=YOUR_NAME) with zero paperwork.",
            icon: <Sparkles className="w-7 h-7 text-orange-600" />,
            gradient: "from-orange-500 to-amber-500"
        },
        {
            number: "02",
            title: "Share With Your Campus & Community",
            description: "Spread the word across WhatsApp student groups, college discord servers, LinkedIn, and peer study circles using ready-made templates.",
            icon: <Share2 className="w-7 h-7 text-red-500" />,
            gradient: "from-red-500 to-rose-500"
        },
        {
            number: "03",
            title: "Earn Perks & Verifiable Certificates",
            description: "Watch your referred learners master skills on LearnProof AI while you automatically unlock leadership certificates, swag, and rewards.",
            icon: <Trophy className="w-7 h-7 text-emerald-600" />,
            gradient: "from-emerald-500 to-teal-500"
        }
    ];

    return (
        <div className="min-h-screen bg-orange-50 relative overflow-hidden selection:bg-orange-200 pt-16 md:pt-18 font-sans">
            {/* ── Sticky Glassmorphism Header / Navbar (Identical to Landing.jsx) ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100/50 py-1">
                <div className="w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between">
                    <Link to="/" className="flex shrink-0 items-center cursor-pointer py-0 my-0">
                        <img src="/LP_logo.png" alt="LearnProof" className="h-10 sm:h-14 w-auto object-contain my-0 py-0 block transform -translate-y-[1.5px]" />
                    </Link>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-gray-600 mr-2 lg:mr-4">
                            <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                            <Link to="/#features" className="hover:text-orange-600 transition-colors">Features</Link>
                            <Link to="/#how-it-works" className="hover:text-orange-600 transition-colors">How It Works</Link>
                            <Link to="/#faq" className="hover:text-orange-600 transition-colors">FAQs</Link>
                            <span className="text-orange-600 font-extrabold flex items-center gap-1.5 bg-orange-100/70 px-3 py-1 rounded-full border border-orange-200">
                                <Sparkles size={14} className="text-orange-600" />
                                Ambassadors
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            {user ? (
                                <button 
                                    onClick={() => navigate('/ambassador/portal')}
                                    className="group inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_18px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
                                >
                                    <span>My Dashboard</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleManualGoogleLogin}
                                        className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors hidden md:block"
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={handleManualGoogleLogin}
                                        className="group inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_18px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <span>Join Program</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </>
                            )}

                            {/* Mobile hamburger menu toggle */}
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50/50 transition-colors focus:outline-none"
                                aria-label="Toggle navigation menu"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-xl md:hidden overflow-hidden"
                        >
                            <div className="px-6 py-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
                                <Link 
                                    to="/" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 transition-colors"
                                >
                                    Home
                                </Link>
                                <Link 
                                    to="/#features" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 transition-colors"
                                >
                                    Features
                                </Link>
                                <Link 
                                    to="/#how-it-works" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 transition-colors"
                                >
                                    How It Works
                                </Link>
                                <Link 
                                    to="/#faq" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 transition-colors"
                                >
                                    FAQs
                                </Link>

                                <div className="h-px bg-orange-100/70 my-1" />

                                {user ? (
                                    <button 
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            navigate('/ambassador/portal');
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-500 text-white font-bold rounded-xl text-center shadow-md text-sm flex items-center justify-center gap-2"
                                    >
                                        <span>Open Ambassador Dashboard</span>
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <div className="flex flex-row gap-3">
                                        <button 
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleManualGoogleLogin();
                                            }}
                                            className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-center border border-gray-200 text-sm"
                                        >
                                            Login
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleManualGoogleLogin();
                                            }}
                                            className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-500 text-white font-bold rounded-xl text-center shadow-md text-sm flex items-center justify-center gap-2"
                                        >
                                            <span>Join Program</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ── HERO SECTION ── */}
            <section className="relative px-4 sm:px-8 lg:px-16 pt-12 pb-20 sm:pb-24 max-w-7xl mx-auto">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 shadow-sm mb-6"
                    >
                        <Sparkles size={16} className="text-orange-500" />
                        <span>LearnProof Campus Ambassador & Creator Program</span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.12] tracking-tight mb-6"
                    >
                        Empower Your Campus.{' '}
                        <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-red-500 bg-clip-text text-transparent">
                            Lead The AI Learning Movement.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10"
                    >
                        Represent LearnProof AI at your university or tech community. Give your peers verified AI credentials, unlock free Pro perks, earn exclusive swag, and receive official leadership certificates.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
                    >
                        <button
                            onClick={handlePrimaryCta}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-[0_6px_25px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.55)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                        >
                            <span>{user ? "Go to Ambassador Dashboard" : "Become an Ambassador (100% Free)"}</span>
                            <ArrowRight size={20} />
                        </button>

                        <button
                            onClick={() => document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-7 py-4 bg-white/90 hover:bg-white text-gray-700 hover:text-orange-600 border border-orange-200 rounded-2xl font-bold text-base shadow-md shadow-orange-100/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explore Perks & Rewards</span>
                            <ChevronDown size={18} />
                        </button>
                    </motion.div>

                    {/* Interactive Live Link Generator Simulation Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md border border-orange-200/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-orange-100/80"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                <span>Self-Serve Instant Link Generator</span>
                            </div>
                            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                                Zero Admin Delay
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="w-full flex-1 flex items-center gap-2 px-4 py-3 bg-orange-50/60 border border-orange-200 rounded-xl text-xs sm:text-sm font-mono text-gray-800 overflow-hidden">
                                <span className="text-gray-400 select-none">learnproof.org/?ref=</span>
                                <input
                                    type="text"
                                    value={sampleRefCode}
                                    onChange={(e) => setSampleRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                    className="bg-transparent border-none outline-none font-bold text-orange-600 flex-1 min-w-[100px]"
                                    placeholder="YOUR_CODE"
                                    maxLength={20}
                                />
                            </div>

                            <button
                                onClick={handleCopySample}
                                className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shrink-0 ${
                                    copiedSample
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                                }`}
                            >
                                {copiedSample ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copiedSample ? 'Copied!' : 'Copy Example Link'}</span>
                            </button>
                        </div>
                        <p className="text-left text-[11px] text-gray-400 mt-2.5">
                            * Custom links are claimed instantly on sign in. No waiting for verification emails or admin tickets.
                        </p>
                    </motion.div>

                    {/* Program Stats Pill Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">
                                {programStats.totalAmbassadors}+
                            </div>
                            <div className="text-xs font-bold text-gray-500">Active Ambassadors</div>
                        </div>

                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-2xl sm:text-3xl font-black text-orange-600 mb-0.5">
                                {programStats.totalStudentsReferred}+
                            </div>
                            <div className="text-xs font-bold text-gray-500">Students Empowered</div>
                        </div>

                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">
                                {programStats.collegesRepresented}+
                            </div>
                            <div className="text-xs font-bold text-gray-500">Colleges & Clubs</div>
                        </div>

                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mb-0.5">
                                100%
                            </div>
                            <div className="text-xs font-bold text-gray-500">Verifiable Credentials</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── PROGRAM PERKS & BENEFITS ── */}
            <section id="perks" className="py-20 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold border border-orange-200 mb-4">
                        <Gift size={16} /> Ambassador Perks
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                        Why Top Students & Creators <br />
                        <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                            Join LearnProof
                        </span>
                    </h2>
                    <p className="text-gray-500 mt-4 text-base sm:text-lg leading-relaxed">
                        Earn career-defining credentials and real rewards while helping your campus master AI-grounded learning.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {perks.map((perk, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            className={`bg-white/90 backdrop-blur-md rounded-3xl p-7 border ${perk.border} shadow-lg shadow-orange-100/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className={`w-14 h-14 rounded-2xl ${perk.bg} flex items-center justify-center border ${perk.border} shadow-sm group-hover:scale-105 transition-transform`}>
                                        {perk.icon}
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                        {perk.badge}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2.5">
                                    {perk.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {perk.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── HOW IT WORKS IN 3 STEPS ── */}
            <section id="how-it-works" className="py-20 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold border border-orange-200 mb-4">
                        <Clock size={16} /> 3-Step Journey
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                        How The Ambassador Program{' '}
                        <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                            Works
                        </span>
                    </h2>
                    <p className="text-gray-500 mt-4 text-base sm:text-lg leading-relaxed">
                        Start making an impact in under 60 seconds with our automated workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.12 }}
                            className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-orange-100 shadow-lg shadow-orange-100/50 hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-4xl font-black bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                                        {step.number}
                                    </span>
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── CAMPUS LEADERBOARD SHOWCASE ── */}
            <section className="py-20 px-4 sm:px-8 lg:px-16 max-w-5xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold border border-orange-200 mb-4">
                        <Trophy size={16} /> Campus Champions
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        Live Ambassador <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Leaderboard</span>
                    </h2>
                    <p className="text-gray-500 mt-3 text-sm sm:text-base">
                        Top student ambassadors representing leading institutes across the country.
                    </p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-orange-200/80 shadow-xl shadow-orange-100/70 overflow-hidden">
                    <div className="p-5 sm:p-6 bg-orange-50/50 border-b border-orange-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <School className="text-orange-600" size={20} />
                            <span className="font-bold text-gray-900 text-sm sm:text-base">Top Performing Ambassadors</span>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                            Live Standings
                        </span>
                    </div>

                    <div className="divide-y divide-orange-100/60">
                        {(leaderboard.length > 0 ? leaderboard.slice(0, 5) : [
                            { creatorName: "Aarav Sharma", targetCollege: "IIT Bombay", referralCode: "IITB_LEAD", totalReferred: 52 },
                            { creatorName: "Sneha Patel", targetCollege: "BITS Pilani", referralCode: "BITS_AI", referralCount: 41 },
                            { creatorName: "Rohan Verma", targetCollege: "NIT Trichy", referralCode: "NITT_CODE", totalReferred: 36 },
                            { creatorName: "Ananya Iyer", targetCollege: "Delhi University", referralCode: "DU_CREATOR", totalReferred: 29 },
                            { creatorName: "Vikram Reddy", targetCollege: "IIIT Hyderabad", referralCode: "IIITH_PRO", totalReferred: 24 }
                        ]).map((amb, index) => (
                            <div key={index} className="p-4 sm:p-5 flex items-center justify-between hover:bg-orange-50/40 transition">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                        index === 0 ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-300' :
                                        index === 1 ? 'bg-slate-300 text-slate-800' :
                                        index === 2 ? 'bg-amber-700 text-white' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-gray-900 text-sm sm:text-base truncate flex items-center gap-2">
                                            <span>{amb.creatorName || 'Student Ambassador'}</span>
                                            {index === 0 && <span className="text-amber-500 text-xs">👑</span>}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            <span>{amb.targetCollege || 'College Campus'}</span>
                                            <span>•</span>
                                            <span className="font-mono text-orange-600 font-semibold">{amb.referralCode || amb.code}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="inline-flex items-center gap-1 font-black text-base sm:text-lg text-orange-600">
                                        {amb.totalReferred || amb.referralCount || 0}
                                    </span>
                                    <span className="text-[11px] block font-semibold text-gray-400">learners</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-orange-50/40 text-center border-t border-orange-100">
                        <button
                            onClick={handlePrimaryCta}
                            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
                        >
                            Join the program to see your name on the leaderboard →
                        </button>
                    </div>
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── FAQ SECTION (Matching Landing.jsx Accordion) ── */}
            <section id="faq" className="py-20 px-4 sm:px-8 lg:px-16 max-w-5xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold border border-orange-200 mb-4">
                        <Sparkles size={14} /> Questions
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        Frequently Asked <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Questions</span>
                    </h2>
                    <p className="text-gray-500 mt-3 text-sm sm:text-base">
                        Everything you need to know about joining and excelling as an ambassador.
                    </p>
                </div>

                <div className="space-y-3">
                    {ambassadorFaqs.map((item, i) => {
                        const isOpen = openFaq === i;
                        return (
                            <div key={i} className="rounded-2xl border transition-all duration-300 overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                    className={`w-full text-left transition-all duration-300 focus:outline-none ${
                                        isOpen
                                            ? 'bg-white border-orange-300 shadow-lg shadow-orange-100'
                                            : 'bg-white/70 border-gray-200 hover:border-orange-200 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 px-6 py-5">
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-colors duration-300 ${
                                            isOpen ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-200' : 'bg-orange-50 text-orange-500'
                                        }`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <span className={`flex-1 text-base sm:text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-orange-600' : 'text-gray-800'}`}>
                                            {item.q}
                                        </span>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isOpen ? 'bg-orange-500 text-white rotate-180' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-1 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-orange-100/60 mt-1">
                                                    {item.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── BIG CALL TO ACTION BANNER ── */}
            <section className="py-20 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 p-8 sm:p-14 text-white shadow-2xl shadow-orange-500/30 overflow-hidden text-center">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md mb-6 border border-white/30">
                            <Sparkles size={16} /> Instant 100% Free Onboarding
                        </span>

                        <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                            Ready to Lead Your Campus?
                        </h2>
                        <p className="text-white/90 text-sm sm:text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
                            Join over 140+ student ambassadors and creators already driving the future of verified AI learning. Claim your link in seconds.
                        </p>

                        <button
                            onClick={handlePrimaryCta}
                            className="px-8 sm:px-10 py-4 bg-white hover:bg-orange-50 text-orange-600 rounded-2xl font-black text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 inline-flex items-center gap-3 cursor-pointer"
                        >
                            <span>{user ? "Open Ambassador Dashboard" : "Claim Your Ambassador Link Now"}</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER (Identical to Landing.jsx) ── */}
            <footer className="border-t border-orange-200 py-8 px-4 sm:px-8 lg:px-16 bg-orange-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0">
                            <img src="/LP_logo.png" alt="LearnProof" className="h-10 w-auto object-contain" />
                            <p className="text-gray-600 mt-2">The ultimate AI classroom for YouTube learners.</p>
                            <div className="flex space-x-6 mt-4">
                                <a href="https://www.linkedin.com/company/learnproof-ai/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                    <Linkedin className="w-6 h-6" />
                                </a>
                                <a href="https://youtube.com/@LearnProof_AI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                                </a>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-gray-600">
                            <div className="flex flex-col space-y-3">
                                <h4 className="font-bold text-gray-900 mb-2">Platform</h4>
                                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Courses</Link>
                                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Roadmaps</Link>
                                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Certificates</Link>
                                <Link to="/ambassador" className="hover:text-orange-600 transition-colors font-semibold text-orange-600">Ambassadors</Link>
                                <Link to="/#download" className="hover:text-orange-600 transition-colors">Downloads</Link>
                            </div>
                            <div className="flex flex-col space-y-3">
                                <h4 className="font-bold text-gray-900 mb-2">Company</h4>
                                <Link to="/ambassador" className="hover:text-orange-600 transition-colors">Referral Program</Link>
                                <Link to="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</Link>
                                <Link to="/terms" className="hover:text-orange-600 transition-colors">Terms</Link>
                                <Link to="/support" className="hover:text-orange-600 transition-colors">Support</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-orange-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                        <p>&copy; 2026 LearnProof AI. All rights reserved.</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <span>Built with ❤️ for lifelong learners</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
