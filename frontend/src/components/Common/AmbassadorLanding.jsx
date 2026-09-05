import React, { useState } from 'react';
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
    HeartHandshake,
    Linkedin,
    Clock,
    Flame,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ambassadorFaqs = [
    {
        q: "Who is eligible to become a Campus Ambassador or Creator?",
        a: "Any active college student, coding club lead, educator, or tech content creator can join. There are no registration fees, minimum follower limits, or complex interview processes."
    },
    {
        q: "How does referral tracking and attribution work?",
        a: "When you share your unique referral link (e.g. learnproof.org/?ref=YOUR_CODE), any peer who visits through your link and creates an account is permanently credited to your ambassador profile in real-time."
    },
    {
        q: "What perks, badges, and rewards do ambassadors receive?",
        a: "Ambassadors earn official Verifiable Leadership Certificates, LinkedIn recommendation badges, free LearnProof Pro access, exclusive merchandise & swag kits, and priority internship referrals."
    },
    {
        q: "Can I customize my referral code and college name?",
        a: "Yes! Once you log in, you can instantly customize your referral code (e.g. IITB_LEAD or PYTHON_NINJA) and assign your college/organization directly from your self-serve Ambassador Dashboard."
    },
    {
        q: "Is there an admin approval process required before I can start?",
        a: "No! The entire program is 100% self-serve and automated. You get instant access to your customized link, QR codes, social templates, and private analytics immediately upon sign-in."
    },
    {
        q: "Is my personal progress or referred student list visible to others?",
        a: "No. Your dashboard, referral analytics, and progress towards rewards are private to your account only."
    }
];

export default function AmbassadorLanding() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [openFaq, setOpenFaq] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sampleRefCode, setSampleRefCode] = useState('CAMPUS_LEAD');
    const [copiedSample, setCopiedSample] = useState(false);

    const handleManualGoogleLogin = () => {
        // Set the redirect target so after Google login, user lands on the Ambassador Portal
        sessionStorage.setItem("redirect_to", "/ambassador/portal");
        localStorage.setItem("redirect_to", "/ambassador/portal");

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
            icon: <Award className="w-6 h-6 text-orange-600" />,
            title: "Verified Leadership Certificate",
            description: "Receive an authentic, tamper-proof Certificate of Leadership with a unique Verification ID to showcase on LinkedIn and your resume.",
            badge: "Certificate",
            bg: "bg-orange-50",
            border: "border-orange-100"
        },
        {
            icon: <Zap className="w-6 h-6 text-amber-600" />,
            title: "Free LearnProof Pro Access",
            description: "Unlock full premium AI video summaries, unlimited course tracking, priority roadmap generation, and higher token limits for life.",
            badge: "Pro Access",
            bg: "bg-amber-50",
            border: "border-amber-100"
        },
        {
            icon: <Gift className="w-6 h-6 text-red-600" />,
            title: "Exclusive Merch & Swag Kits",
            description: "Top ambassadors receive custom LearnProof hoodies, t-shirts, laptop stickers, and physical certificate kits delivered to their doorstep.",
            badge: "Merchandise",
            bg: "bg-red-50",
            border: "border-red-100"
        },
        {
            icon: <HeartHandshake className="w-6 h-6 text-emerald-600" />,
            title: "Internship & Career Fast-Track",
            description: "Direct letters of recommendation from the founding team, plus priority interviews for engineering, product, and growth roles.",
            badge: "Career Growth",
            bg: "bg-emerald-50",
            border: "border-emerald-100"
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
            title: "Private Real-Time Analytics",
            description: "Self-serve personal dashboard displaying your link clicks, registered students, conversion rates, and milestone reward progress.",
            badge: "Private Telemetry",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            icon: <Users className="w-6 h-6 text-purple-600" />,
            title: "Founder Mentorship & Network",
            description: "Join an exclusive private community of student leaders across universities, with direct monthly sessions and founder access.",
            badge: "Community",
            bg: "bg-purple-50",
            border: "border-purple-100"
        }
    ];

    const tiers = [
        {
            tier: "Bronze Ambassador",
            badge: "🥉",
            requirement: "1 - 9 Signups",
            reward: "Early AI Beta Access, Verified Digital Badge & Private Community Access",
            badgeColor: "bg-orange-100 text-orange-700 border-orange-200"
        },
        {
            tier: "Silver Ambassador",
            badge: "🥈",
            requirement: "10 - 49 Signups",
            reward: "Official Certificate of Leadership, LinkedIn Verification ID & Pro AI Credits",
            badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
        },
        {
            tier: "Gold Ambassador",
            badge: "🥇",
            requirement: "50 - 99 Signups",
            reward: "Exclusive LearnProof Swag Package (Hoodie, T-Shirt, Stickers) & Letter of Recommendation",
            badgeColor: "bg-amber-100 text-amber-700 border-amber-200"
        },
        {
            tier: "Diamond Lead",
            badge: "💎",
            requirement: "100+ Signups",
            reward: "Stipend Grants, Priority Internship Interview & Keynote Speaker Role in Global Hackathons",
            badgeColor: "bg-purple-100 text-purple-700 border-purple-200"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Claim Your Custom Link",
            description: "Sign in with 1-click and customize your unique referral handle (e.g., learnproof.org/?ref=YOUR_NAME) with zero paperwork.",
            icon: <Sparkles className="w-6 h-6 text-orange-600" />
        },
        {
            number: "02",
            title: "Share With Your Campus & Clubs",
            description: "Spread the word across WhatsApp student groups, college Discord servers, LinkedIn, and peer study circles using ready-made templates.",
            icon: <Share2 className="w-6 h-6 text-red-500" />
        },
        {
            number: "03",
            title: "Earn Perks & Verifiable Certificates",
            description: "Watch your referred learners master skills on LearnProof AI while you automatically unlock leadership certificates, swag, and rewards.",
            icon: <Trophy className="w-6 h-6 text-emerald-600" />
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-200">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-orange-50 via-amber-50/40 to-transparent pointer-events-none -z-10" />
            <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-40 left-10 w-[450px] h-[450px] bg-amber-200/20 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* ── Sticky Glassmorphism Header / Navbar ── */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 px-4 sm:px-8 lg:px-12 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex shrink-0 items-center">
                        <img src="/LP_logo.png" alt="LearnProof" className="h-9 sm:h-11 w-auto object-contain" />
                    </Link>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-gray-600">
                            <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                            <Link to="/#features" className="hover:text-orange-600 transition-colors">Features</Link>
                            <Link to="/#how-it-works" className="hover:text-orange-600 transition-colors">How It Works</Link>
                            <Link to="/#faq" className="hover:text-orange-600 transition-colors">FAQs</Link>
                            <span className="text-orange-600 font-bold flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                <Sparkles size={13} className="text-orange-500" />
                                Ambassadors
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {user ? (
                                <button 
                                    onClick={() => navigate('/ambassador/portal')}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                                >
                                    <span>My Dashboard</span>
                                    <ArrowRight size={15} />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleManualGoogleLogin}
                                        className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors hidden md:block px-3 py-2 cursor-pointer"
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={handleManualGoogleLogin}
                                        className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                                    >
                                        <span>Join Program</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </>
                            )}

                            {/* Mobile hamburger menu toggle */}
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors focus:outline-none cursor-pointer"
                                aria-label="Toggle navigation menu"
                            >
                                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="w-full bg-white border-t border-gray-100 shadow-xl md:hidden overflow-hidden"
                        >
                            <div className="px-6 py-5 flex flex-col gap-3">
                                <Link 
                                    to="/" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 text-sm transition-colors"
                                >
                                    Home
                                </Link>
                                <Link 
                                    to="/#features" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 text-sm transition-colors"
                                >
                                    Features
                                </Link>
                                <Link 
                                    to="/#how-it-works" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 text-sm transition-colors"
                                >
                                    How It Works
                                </Link>
                                <Link 
                                    to="/#faq" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="py-2 px-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 font-bold text-gray-700 text-sm transition-colors"
                                >
                                    FAQs
                                </Link>

                                <div className="h-px bg-gray-100 my-1" />

                                {user ? (
                                    <button 
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            navigate('/ambassador/portal');
                                        }}
                                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-center shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Open Ambassador Dashboard</span>
                                        <ArrowRight size={15} />
                                    </button>
                                ) : (
                                    <div className="flex flex-row gap-3">
                                        <button 
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleManualGoogleLogin();
                                            }}
                                            className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-center border border-gray-200 text-sm cursor-pointer"
                                        >
                                            Login
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleManualGoogleLogin();
                                            }}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-center shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <span>Join Program</span>
                                            <ArrowRight size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ── HERO SECTION ── */}
            <section className="px-4 sm:px-8 lg:px-16 pt-12 pb-20 max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 shadow-sm mb-6"
                    >
                        <Sparkles size={15} className="text-orange-500" />
                        <span>Campus Ambassador & Creator Program</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-950 leading-[1.18] mb-5"
                    >
                        Empower Your Campus.{' '}
                        <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-red-500 bg-clip-text text-transparent">
                            Lead The AI Learning Movement.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8"
                    >
                        Represent LearnProof AI at your university or online tech community. Give your peers verified AI credentials, unlock free Pro perks, earn exclusive swag, and receive official leadership certificates.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                    >
                        {user ? (
                            <button
                                onClick={handlePrimaryCta}
                                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Go to Ambassador Dashboard</span>
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handlePrimaryCta}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 border border-gray-200 font-bold text-gray-800 text-sm sm:text-base cursor-pointer"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span>Join Program with Google</span>
                            </button>
                        )}

                        <button
                            onClick={() => document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-orange-600 border border-gray-200 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explore Perks & Rewards</span>
                            <ChevronDown size={17} />
                        </button>
                    </motion.div>

                    {/* Interactive Live Link Generator Simulation Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl p-5 shadow-xl shadow-orange-500/5 text-left"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Instant Self-Serve Link Generator</span>
                            </div>
                            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                                Zero Admin Delay
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                            <div className="w-full flex-1 flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono text-gray-800">
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
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                                    copiedSample
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                                }`}
                            >
                                {copiedSample ? <Check size={15} /> : <Copy size={15} />}
                                <span>{copiedSample ? 'Copied!' : 'Copy Example Link'}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                            * Claim your unique custom link in seconds upon login. No approval queues.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── PROGRAM PERKS & BENEFITS ── */}
            <section id="perks" className="py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto border-t border-gray-100">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 mb-3">
                        <Gift size={14} /> Ambassador Perks
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                        Why Top Students & Creators <br />
                        <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                            Join LearnProof
                        </span>
                    </h2>
                    <p className="text-gray-500 mt-3 text-sm leading-relaxed">
                        Earn career-defining credentials and real rewards while helping your campus master AI-grounded learning.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {perks.map((perk, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(249,115,22,0.08)] hover:border-orange-200 transition-all duration-200 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-11 h-11 rounded-xl ${perk.bg} flex items-center justify-center border ${perk.border}`}>
                                        {perk.icon}
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                                        {perk.badge}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
                                    {perk.title}
                                </h3>
                                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                    {perk.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── MILESTONE REWARDS PROGRESSION TIERS ── */}
            <section className="py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto border-t border-gray-100 bg-gray-50/50 rounded-3xl my-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 mb-3">
                        <Flame size={14} /> Reward Progression
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                        Milestone <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Reward Tiers</span>
                    </h2>
                    <p className="text-gray-500 mt-2 text-xs sm:text-sm">
                        Unlock bigger rewards automatically as more learners register using your private link.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tiers.map((tierItem, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{tierItem.badge}</span>
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900">
                                            {tierItem.tier}
                                        </h3>
                                        <span className="text-xs font-semibold text-gray-500">
                                            Requirement: <span className="font-bold text-orange-600">{tierItem.requirement}</span>
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierItem.badgeColor} shrink-0`}>
                                    Tier {idx + 1}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-100 text-xs text-gray-700 leading-relaxed flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>{tierItem.reward}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS IN 3 STEPS ── */}
            <section id="how-it-works" className="py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto border-t border-gray-100">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 mb-3">
                        <Clock size={14} /> 3-Step Journey
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                        How It <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="text-gray-500 mt-2 text-xs sm:text-sm">
                        Start making an impact in under 60 seconds with our automated workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-orange-200 transition-all duration-200 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                                        {step.number}
                                    </span>
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ SECTION ── */}
            <section id="faq" className="py-16 px-4 sm:px-8 lg:px-16 max-w-3xl mx-auto border-t border-gray-100">
                <div className="text-center max-w-xl mx-auto mb-10">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 mb-3">
                        <Sparkles size={14} /> Questions
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        Frequently Asked <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Questions</span>
                    </h2>
                </div>

                <div className="space-y-3">
                    {ambassadorFaqs.map((item, i) => {
                        const isOpen = openFaq === i;
                        return (
                            <div key={i} className="rounded-xl border border-gray-200/80 overflow-hidden bg-white shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                    className={`w-full text-left transition-colors duration-150 p-4 sm:p-5 flex items-center gap-3 cursor-pointer ${
                                        isOpen ? 'bg-orange-50/40' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        isOpen ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <span className={`flex-1 text-sm font-bold ${isOpen ? 'text-orange-600' : 'text-gray-800'}`}>
                                        {item.q}
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        >
                                            <div className="px-5 pb-5 pt-1 text-gray-600 text-xs sm:text-sm leading-relaxed border-t border-orange-100/60">
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── BIG CALL TO ACTION BANNER ── */}
            <section className="py-12 px-4 sm:px-8 max-w-4xl mx-auto">
                <div className="relative rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 p-8 sm:p-12 text-white shadow-xl shadow-orange-500/20 text-center overflow-hidden">
                    <div className="relative z-10 max-w-xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md mb-4 border border-white/30">
                            <Sparkles size={14} /> Instant 100% Free Setup
                        </span>

                        <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
                            Ready to Lead Your Campus?
                        </h2>
                        <p className="text-white/90 text-xs sm:text-sm mb-7 leading-relaxed">
                            Join student ambassadors and creators driving verified AI learning. Claim your custom link in seconds with zero paperwork.
                        </p>

                        <button
                            onClick={handlePrimaryCta}
                            className="px-7 py-3 bg-white hover:bg-orange-50 text-orange-600 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                        >
                            <span>{user ? "Open Ambassador Dashboard" : "Claim Your Ambassador Link Now"}</span>
                            <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-gray-100 py-10 px-4 sm:px-8 lg:px-12 bg-white mt-12">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <img src="/LP_logo.png" alt="LearnProof" className="h-9 w-auto object-contain" />
                        <p className="text-gray-500 text-xs mt-2">The ultimate AI classroom for YouTube learners.</p>
                    </div>

                    <div className="flex items-center gap-8 text-xs font-semibold text-gray-600">
                        <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Courses</Link>
                        <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Roadmaps</Link>
                        <Link to="/ambassador" className="text-orange-600 font-bold">Ambassadors</Link>
                        <Link to="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-orange-600 transition-colors">Terms</Link>
                        <Link to="/support" className="hover:text-orange-600 transition-colors">Support</Link>
                    </div>

                    <p className="text-gray-400 text-xs">&copy; 2026 LearnProof AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
