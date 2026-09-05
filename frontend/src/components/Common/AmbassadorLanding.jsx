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
    CheckSquare,
    HeartHandshake,
    Linkedin,
    Target,
    Clock,
    Flame,
    Layers,
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
            border: "border-orange-200"
        },
        {
            icon: <Zap className="w-6 h-6 text-amber-600" />,
            title: "Free LearnProof Pro Access",
            description: "Unlock full premium AI video summaries, unlimited course tracking, priority roadmap generation, and higher token limits for life.",
            badge: "Pro Access",
            bg: "bg-amber-50",
            border: "border-amber-200"
        },
        {
            icon: <Gift className="w-6 h-6 text-red-600" />,
            title: "Exclusive Merch & Swag Kits",
            description: "Top ambassadors receive custom LearnProof hoodies, t-shirts, laptop stickers, and physical certificate kits delivered to their doorstep.",
            badge: "Merchandise",
            bg: "bg-red-50",
            border: "border-red-200"
        },
        {
            icon: <HeartHandshake className="w-6 h-6 text-emerald-600" />,
            title: "Internship & Career Fast-Track",
            description: "Direct letters of recommendation from the founding team, plus priority interviews for engineering, product, and growth roles.",
            badge: "Career Growth",
            bg: "bg-emerald-50",
            border: "border-emerald-200"
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
            title: "Private Real-Time Analytics",
            description: "Self-serve personal dashboard displaying your link clicks, registered students, conversion rates, and milestone reward progress.",
            badge: "Private Telemetry",
            bg: "bg-blue-50",
            border: "border-blue-200"
        },
        {
            icon: <Users className="w-6 h-6 text-purple-600" />,
            title: "Founder Mentorship & Network",
            description: "Join an exclusive private community of student leaders across universities, with direct monthly sessions and founder access.",
            badge: "Community",
            bg: "bg-purple-50",
            border: "border-purple-200"
        }
    ];

    const tiers = [
        {
            tier: "Bronze Ambassador",
            badge: "🥉",
            requirement: "1 - 9 Signups",
            reward: "Early AI Beta Access, Verified Digital Badge & Private Community Access",
            color: "from-orange-500 to-amber-600",
            bg: "bg-orange-50",
            border: "border-orange-200"
        },
        {
            tier: "Silver Ambassador",
            badge: "🥈",
            requirement: "10 - 49 Signups",
            reward: "Official Certificate of Leadership, LinkedIn Verification ID & Pro AI Credits",
            color: "from-slate-500 to-slate-700",
            bg: "bg-slate-50",
            border: "border-slate-200"
        },
        {
            tier: "Gold Ambassador",
            badge: "🥇",
            requirement: "50 - 99 Signups",
            reward: "Exclusive LearnProof Swag Package (Hoodie, T-Shirt, Stickers) & Letter of Recommendation",
            color: "from-amber-500 to-orange-500",
            bg: "bg-amber-50",
            border: "border-amber-200"
        },
        {
            tier: "Diamond Lead",
            badge: "💎",
            requirement: "100+ Signups",
            reward: "Stipend Grants, Priority Internship Interview & Keynote Speaker Role in Global Hackathons",
            color: "from-purple-600 to-indigo-600",
            bg: "bg-purple-50",
            border: "border-purple-200"
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
        <div className="min-h-screen bg-orange-50 relative overflow-hidden selection:bg-orange-200 pt-16 md:pt-18 font-sans">
            {/* Background Texture & Ambient Gradient Blobs (Matching Landing.jsx) */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-orange-200 via-amber-100 to-transparent rounded-full blur-[130px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[110px] opacity-40 z-0 pointer-events-none -translate-x-1/3" />

            {/* ── Sticky Glassmorphism Header / Navbar (Matching Landing.jsx) ── */}
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
                                        className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors hidden md:block cursor-pointer"
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={handleManualGoogleLogin}
                                        className="group inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_18px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
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
            <section className="relative z-10 px-4 sm:px-8 lg:px-16 pt-12 pb-16 max-w-6xl mx-auto">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 shadow-sm mb-6"
                    >
                        <Sparkles size={16} className="text-orange-500" />
                        <span>Campus Ambassador & Creator Program</span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.18] tracking-tight mb-6"
                    >
                        Empower Your Campus.{' '}
                        <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                            Lead The AI Learning Movement.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8 font-medium"
                    >
                        Represent LearnProof AI at your university or online tech community. Give your peers verified AI credentials, unlock free Pro perks, earn exclusive swag, and receive official leadership certificates.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                    >
                        {user ? (
                            <button
                                onClick={handlePrimaryCta}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl font-bold text-sm sm:text-base shadow-[0_4px_20px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Go to Ambassador Dashboard</span>
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handlePrimaryCta}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(249,115,22,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 border border-orange-200 font-bold text-gray-800 text-sm sm:text-base cursor-pointer"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span>Join Program with Google</span>
                            </button>
                        )}

                        <button
                            onClick={() => document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-6 py-3.5 bg-white/70 hover:bg-white text-gray-700 hover:text-orange-600 border border-orange-200 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Explore Perks & Rewards</span>
                            <ChevronDown size={18} />
                        </button>
                    </motion.div>

                    {/* Interactive Live Link Generator Simulation Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md border border-orange-200 rounded-3xl p-5 sm:p-6 shadow-xl shadow-orange-100/70"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Self-Serve Instant Link Generator</span>
                            </div>
                            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                                Zero Admin Delay
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="w-full flex-1 flex items-center gap-2 px-4 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-xs sm:text-sm font-mono text-gray-800 overflow-hidden">
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
                                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                                    copiedSample
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20'
                                }`}
                            >
                                {copiedSample ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copiedSample ? 'Copied!' : 'Copy Example Link'}</span>
                            </button>
                        </div>
                        <p className="text-left text-[11px] text-gray-500 mt-2.5">
                            * Custom links are created instantly upon sign in. No waiting for admin verification or tickets.
                        </p>
                    </motion.div>

                    {/* Program Feature Pill Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 mb-0.5">100%</div>
                            <div className="text-xs font-bold text-gray-500">Automated & Self-Serve</div>
                        </div>

                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-black text-orange-600 mb-0.5">Instant</div>
                            <div className="text-xs font-bold text-gray-500">Link Generation</div>
                        </div>

                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-black text-gray-900 mb-0.5">Verified</div>
                            <div className="text-xs font-bold text-gray-500">Leadership Credentials</div>
                        </div>

                        <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-black text-emerald-600 mb-0.5">Free Pro</div>
                            <div className="text-xs font-bold text-gray-500">Access & Swag Tiers</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16 max-w-6xl mx-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── PROGRAM PERKS & BENEFITS ── */}
            <section id="perks" className="py-20 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 mb-4">
                        <Gift size={15} /> Ambassador Perks
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                        Why Top Students & Creators <br />
                        <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                            Join LearnProof
                        </span>
                    </h2>
                    <p className="text-gray-600 mt-4 text-sm sm:text-base leading-relaxed">
                        Earn career-defining credentials and real rewards while helping your campus master AI-grounded learning.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {perks.map((perk, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.06 }}
                            className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border ${perk.border} shadow-lg shadow-orange-100/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className={`w-12 h-12 rounded-2xl ${perk.bg} flex items-center justify-center border ${perk.border} shadow-sm group-hover:scale-105 transition-transform`}>
                                        {perk.icon}
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                        {perk.badge}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                                    {perk.title}
                                </h3>
                                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                    {perk.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16 max-w-6xl mx-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── MILESTONE REWARDS PROGRESSION TIERS ── */}
            <section className="py-20 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 mb-4">
                        <Flame size={15} /> Reward Progression
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        Clear Milestone <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Reward Tiers</span>
                    </h2>
                    <p className="text-gray-600 mt-3 text-xs sm:text-base">
                        Unlock bigger rewards automatically as more learners register using your link.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tiers.map((tierItem, idx) => (
                        <div
                            key={idx}
                            className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border ${tierItem.border} shadow-lg shadow-orange-100/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{tierItem.badge}</span>
                                        <div>
                                            <h3 className="font-bold text-base sm:text-lg text-gray-900">
                                                {tierItem.tier}
                                            </h3>
                                            <span className="text-xs font-semibold text-gray-500">
                                                Requirement: <span className="font-bold text-orange-600">{tierItem.requirement}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200 shrink-0">
                                        Tier {idx + 1}
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100/80">
                                    <div className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span>Perks Unlocked:</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                        {tierItem.reward}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16 max-w-6xl mx-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── HOW IT WORKS IN 3 STEPS ── */}
            <section id="how-it-works" className="py-20 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 mb-4">
                        <Clock size={15} /> 3-Step Journey
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        How It <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="text-gray-600 mt-3 text-xs sm:text-base">
                        Start making an impact in under 60 seconds with our automated workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            className="bg-white/90 backdrop-blur-md rounded-3xl p-7 border border-orange-100 shadow-lg shadow-orange-100/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <span className="text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                                        {step.number}
                                    </span>
                                    <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
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

            {/* ── SECTION DIVIDER ── */}
            <div className="px-8 sm:px-16 max-w-6xl mx-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* ── FAQ SECTION (Matching Landing.jsx Accordion) ── */}
            <section id="faq" className="py-20 px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 mb-4">
                        <Sparkles size={14} /> Questions
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        Frequently Asked <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Questions</span>
                    </h2>
                    <p className="text-gray-500 mt-3 text-xs sm:text-sm">
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
                                    className={`w-full text-left transition-all duration-300 focus:outline-none cursor-pointer ${
                                        isOpen
                                            ? 'bg-white border-orange-300 shadow-lg shadow-orange-100'
                                            : 'bg-white/70 border-gray-200 hover:border-orange-200 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors duration-300 ${
                                            isOpen ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-200' : 'bg-orange-50 text-orange-500'
                                        }`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <span className={`flex-1 text-sm sm:text-base font-bold transition-colors duration-300 ${isOpen ? 'text-orange-600' : 'text-gray-800'}`}>
                                            {item.q}
                                        </span>
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isOpen ? 'bg-orange-500 text-white rotate-180' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <ChevronDown size={14} />
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
                                                <div className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6 text-gray-600 text-xs sm:text-sm leading-relaxed border-t border-orange-100/60 mt-1">
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
            <section className="py-16 px-4 sm:px-8 lg:px-16 max-w-5xl mx-auto">
                <div className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 p-8 sm:p-12 text-white shadow-2xl shadow-orange-500/25 overflow-hidden text-center">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md mb-4 border border-white/30">
                            <Sparkles size={15} /> Instant 100% Free Setup
                        </span>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                            Ready to Lead Your Campus?
                        </h2>
                        <p className="text-white/90 text-sm sm:text-base mb-8 leading-relaxed max-w-xl mx-auto">
                            Join student ambassadors and creators driving verified AI learning. Claim your link in seconds with zero admin paperwork.
                        </p>

                        <button
                            onClick={handlePrimaryCta}
                            className="px-8 sm:px-10 py-3.5 bg-white hover:bg-orange-50 text-orange-600 rounded-xl font-black text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2.5 cursor-pointer"
                        >
                            <span>{user ? "Open Ambassador Dashboard" : "Claim Your Ambassador Link Now"}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER (Matching Landing.jsx Exactly) ── */}
            <footer className="border-t border-orange-200 py-10 px-4 sm:px-8 lg:px-16 bg-orange-50/80">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="max-w-sm">
                            <img src="/LP_logo.png" alt="LearnProof" className="h-10 w-auto object-contain" />
                            <p className="text-gray-600 text-sm mt-2">The ultimate AI classroom for YouTube learners.</p>
                            <div className="flex space-x-5 mt-4">
                                <a href="https://www.linkedin.com/company/learnproof-ai/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" aria-label="LinkedIn">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="https://youtube.com/@LearnProof_AI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" aria-label="YouTube">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 text-gray-600 text-sm">
                            <div className="flex flex-col space-y-2.5">
                                <h4 className="font-bold text-gray-900 mb-1">Platform</h4>
                                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Courses</Link>
                                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Roadmaps</Link>
                                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Certificates</Link>
                                <Link to="/ambassador" className="hover:text-orange-600 transition-colors font-bold text-orange-600">Ambassadors</Link>
                                <Link to="/#download" className="hover:text-orange-600 transition-colors">Downloads</Link>
                            </div>
                            <div className="flex flex-col space-y-2.5">
                                <h4 className="font-bold text-gray-900 mb-1">Company</h4>
                                <Link to="/ambassador" className="hover:text-orange-600 transition-colors">Referral Program</Link>
                                <Link to="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</Link>
                                <Link to="/terms" className="hover:text-orange-600 transition-colors">Terms</Link>
                                <Link to="/support" className="hover:text-orange-600 transition-colors">Support</Link>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-orange-200/80 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs">
                        <p>&copy; 2026 LearnProof AI. All rights reserved.</p>
                        <div className="flex space-x-6 mt-3 md:mt-0">
                            <span>Built with ❤️ for lifelong learners</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
