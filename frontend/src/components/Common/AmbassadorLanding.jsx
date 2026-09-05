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
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [openFaq, setOpenFaq] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sampleRefCode, setSampleRefCode] = useState('CAMPUS_LEAD');
    const [copiedSample, setCopiedSample] = useState(false);

    React.useEffect(() => {
        // Handle Google Redirect Fragment if landed on /ambassador with token
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const idToken = params.get('id_token') || params.get('credential');
            if (idToken) {
                login({ credential: idToken }).then(() => {
                    window.history.replaceState(null, '', window.location.pathname);
                    navigate('/ambassador/portal');
                }).catch(err => {
                    console.error("Ambassador login error:", err);
                    toast.error("Login failed. Please try again.");
                });
            }
        }
    }, [login, navigate]);

    const handleManualGoogleLogin = () => {
        sessionStorage.setItem("redirect_to", "/ambassador/portal");
        localStorage.removeItem("redirect_to");
        document.cookie = "redirect_to=; path=/; max-age=0; SameSite=Lax";

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = window.location.origin;
        const nonce = Math.random().toString(36).substring(2);
        const state = encodeURIComponent('/ambassador/portal');
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=id_token` +
            `&scope=${encodeURIComponent('openid email profile')}` +
            `&state=${state}` +
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
            badge: "Official Credential",
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
            description: "Top ambassadors receive custom LearnProof hoodies, premium tees, laptop stickers, and certificate packs delivered to their doorstep.",
            badge: "Swag Box",
            bg: "bg-red-50",
            border: "border-red-100"
        },
        {
            icon: <HeartHandshake className="w-6 h-6 text-emerald-600" />,
            title: "Internship & Career Fast-Track",
            description: "Direct letters of recommendation from the founders, plus priority interviews for engineering, product, and community growth roles.",
            badge: "Career Growth",
            bg: "bg-emerald-50",
            border: "border-emerald-100"
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
            title: "Private Real-Time Telemetry",
            description: "Self-serve analytics dashboard displaying your live link clicks, registered students, conversion rates, and milestone rewards.",
            badge: "Live Telemetry",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            icon: <Users className="w-6 h-6 text-purple-600" />,
            title: "Founder Mentorship & Network",
            description: "Join an exclusive private community of student leaders across universities, with direct monthly sessions and founder access.",
            badge: "VIP Community",
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
            badgeColor: "bg-orange-100/80 text-orange-700 border-orange-200"
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
            badgeColor: "bg-amber-100/80 text-amber-700 border-amber-200"
        },
        {
            tier: "Diamond Lead",
            badge: "💎",
            requirement: "100+ Signups",
            reward: "Stipend Grants, Priority Internship Interview & Keynote Speaker Role in Global Hackathons",
            badgeColor: "bg-purple-100/80 text-purple-700 border-purple-200"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Claim Your Custom Link",
            description: "Sign in with 1-click and customize your unique referral handle (e.g. learnproof.org/?ref=YOUR_NAME) with zero paperwork or delays.",
            icon: <Sparkles className="w-6 h-6 text-orange-600" />
        },
        {
            number: "02",
            title: "Share With Your Campus & Clubs",
            description: "Spread the word across WhatsApp student groups, college Discord servers, LinkedIn, and peer study circles using ready-to-share templates.",
            icon: <Share2 className="w-6 h-6 text-red-500" />
        },
        {
            number: "03",
            title: "Earn Perks & Verifiable Certificates",
            description: "Watch your peers learn on LearnProof AI while you automatically unlock leadership credentials, swag boxes, and recommendation letters.",
            icon: <Trophy className="w-6 h-6 text-emerald-600" />
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFFDFB] via-[#FFF9F5] to-[#FFFDFB] relative overflow-hidden font-sans text-gray-900 selection:bg-orange-200 pt-16 md:pt-18">
            {/* Soft, Clean Ambient Background Glows (Clean & Bright, No Dark Dots) */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-orange-200/40 via-amber-100/30 to-transparent rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200/30 via-orange-100/20 to-transparent rounded-full blur-[130px] pointer-events-none -translate-x-1/4" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-t from-orange-200/25 to-transparent rounded-full blur-[120px] pointer-events-none" />

            {/* ── Sticky Glassmorphism Header / Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100/80 py-1.5 px-4 sm:px-8 lg:px-12 shadow-[0_2px_15px_rgba(249,115,22,0.04)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex shrink-0 items-center">
                        <img src="/LP_logo.png" alt="LearnProof" className="h-10 sm:h-12 w-auto object-contain" />
                    </Link>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-gray-600">
                            <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                            <Link to="/#features" className="hover:text-orange-600 transition-colors">Features</Link>
                            <Link to="/#how-it-works" className="hover:text-orange-600 transition-colors">How It Works</Link>
                            <Link to="/#faq" className="hover:text-orange-600 transition-colors">FAQs</Link>
                            <span className="text-orange-600 font-extrabold flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80 shadow-sm">
                                <Sparkles size={13} className="text-orange-500" />
                                Ambassadors
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {user ? (
                                <button 
                                    onClick={() => navigate('/ambassador/portal')}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_18px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                >
                                    <span>My Dashboard</span>
                                    <ArrowRight size={15} />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handlePrimaryCta}
                                        className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors hidden md:block px-3 py-2 cursor-pointer"
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={handlePrimaryCta}
                                        className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-[0_4px_18px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
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
                            className="w-full bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-xl md:hidden overflow-hidden"
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

                                <div className="h-px bg-orange-100 my-1" />

                                {user ? (
                                    <button 
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            navigate('/ambassador/portal');
                                        }}
                                        className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-red-500 text-white font-bold rounded-xl text-center shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Open Ambassador Dashboard</span>
                                        <ArrowRight size={15} />
                                    </button>
                                ) : (
                                    <div className="flex flex-row gap-3">
                                        <button 
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handlePrimaryCta();
                                            }}
                                            className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-center border border-gray-200 text-sm cursor-pointer"
                                        >
                                            Login
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handlePrimaryCta();
                                            }}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 text-white font-bold rounded-xl text-center shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
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
            <section className="relative z-10 px-4 sm:px-8 lg:px-16 pt-14 pb-16 max-w-6xl mx-auto">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md text-orange-600 text-xs sm:text-sm font-extrabold border border-orange-200/90 shadow-[0_2px_10px_rgba(249,115,22,0.08)] mb-6"
                    >
                        <Sparkles size={16} className="text-orange-500" />
                        <span>Campus Ambassador & Creator Program</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-950 leading-[1.16] mb-5"
                    >
                        Empower Your Campus.{' '}
                        <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                            Lead The AI Learning Movement.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8 font-medium"
                    >
                        Represent LearnProof AI at your university or online tech community. Give your peers verified AI credentials, unlock free Pro perks, earn exclusive swag, and receive official leadership certificates.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
                    >
                        {user ? (
                            <button
                                onClick={handlePrimaryCta}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl font-bold text-sm sm:text-base shadow-[0_6px_25px_rgba(249,115,22,0.35)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Go to Ambassador Dashboard</span>
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handlePrimaryCta}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-3.5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-0.5 border border-orange-100 font-bold text-gray-800 text-sm sm:text-base cursor-pointer"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span>Join Program with Google</span>
                            </button>
                        )}

                        <button
                            onClick={() => document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-7 py-3.5 bg-white/90 hover:bg-white text-gray-700 hover:text-orange-600 border border-orange-200/90 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
                        className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-md border border-orange-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(249,115,22,0.08)] text-left overflow-hidden"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Instant Self-Serve Link Generator</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-wider bg-orange-100/90 px-2.5 py-0.5 rounded-full border border-orange-200">
                                Zero Admin Delay
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
                            <div className="flex-1 min-w-0 flex items-center gap-1 px-3 py-2.5 bg-orange-50/70 border border-orange-200/80 rounded-xl text-xs sm:text-sm font-mono text-gray-800 overflow-hidden">
                                <span className="text-gray-500 select-none shrink-0 text-xs sm:text-sm">learnproof.org/?ref=</span>
                                <input
                                    type="text"
                                    value={sampleRefCode}
                                    onChange={(e) => setSampleRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                    className="bg-transparent border-none outline-none font-bold text-orange-600 flex-1 min-w-0 w-full text-xs sm:text-sm"
                                    placeholder="YOUR_CODE"
                                    maxLength={18}
                                />
                            </div>

                            <button
                                onClick={handleCopySample}
                                className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm ${
                                    copiedSample
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white shadow-md shadow-orange-500/20'
                                }`}
                            >
                                {copiedSample ? <Check size={15} /> : <Copy size={15} />}
                                <span className="whitespace-nowrap">{copiedSample ? 'Copied!' : 'Copy Example Link'}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2.5">
                            * Claim your unique custom link in seconds upon login. No approval queues.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Section Divider */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            </div>

            {/* ── PROGRAM PERKS & BENEFITS ── */}
            <section id="perks" className="relative z-10 py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-orange-600 text-xs font-extrabold border border-orange-200 mb-3 shadow-sm">
                        <Gift size={14} /> Ambassador Perks
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                        Why Top Students & Creators <br />
                        <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                            Join LearnProof
                        </span>
                    </h2>
                    <p className="text-gray-600 mt-3 text-sm sm:text-base leading-relaxed">
                        Earn career-defining credentials and real rewards while helping your campus master AI-grounded learning.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {perks.map((perk, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 sm:p-7 border border-orange-100/90 shadow-[0_4px_24px_rgba(249,115,22,0.05)] hover:shadow-[0_12px_36px_rgba(249,115,22,0.12)] hover:border-orange-300 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${perk.bg} flex items-center justify-center border ${perk.border} shadow-sm`}>
                                        {perk.icon}
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-800 text-[11px] font-extrabold border border-orange-100">
                                        {perk.badge}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
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

            {/* Section Divider */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            </div>

            {/* ── MILESTONE REWARDS PROGRESSION TIERS ── */}
            <section className="relative z-10 py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="relative rounded-3xl bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 border border-orange-100/90 p-8 sm:p-12 shadow-[0_6px_30px_rgba(249,115,22,0.04)]">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-orange-600 text-xs font-extrabold border border-orange-200 mb-3 shadow-sm">
                            <Flame size={14} /> Reward Progression
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                            Milestone <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Reward Tiers</span>
                        </h2>
                        <p className="text-gray-600 mt-2 text-xs sm:text-sm">
                            Unlock bigger rewards automatically as more learners register using your private link.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {tiers.map((tierItem, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-5 sm:p-6 border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200"
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

                                <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-gray-700 leading-relaxed flex items-start gap-2">
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{tierItem.reward}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section Divider */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            </div>

            {/* ── HOW IT WORKS IN 3 STEPS ── */}
            <section id="how-it-works" className="relative z-10 py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-orange-600 text-xs font-extrabold border border-orange-200 mb-3 shadow-sm">
                        <Clock size={14} /> 3-Step Journey
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                        How It <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="text-gray-600 mt-2 text-xs sm:text-sm">
                        Start making an impact in under 60 seconds with our automated workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-6 sm:p-7 border border-orange-100/90 shadow-[0_4px_24px_rgba(249,115,22,0.05)] hover:shadow-md hover:border-orange-300 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                                        {step.number}
                                    </span>
                                    <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm">
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

            {/* Section Divider */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            </div>

            {/* ── FAQ SECTION ── */}
            <section id="faq" className="relative z-10 py-16 px-4 sm:px-8 lg:px-16 max-w-3xl mx-auto">
                <div className="text-center max-w-xl mx-auto mb-10">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-orange-600 text-xs font-extrabold border border-orange-200 mb-3 shadow-sm">
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
                            <div key={i} className="rounded-2xl border border-orange-100 overflow-hidden bg-white shadow-sm transition-all duration-200 hover:border-orange-200">
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                    className={`w-full text-left transition-colors duration-150 p-4 sm:p-5 flex items-center gap-3 cursor-pointer ${
                                        isOpen ? 'bg-orange-50/50' : 'hover:bg-orange-50/20'
                                    }`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        isOpen ? 'bg-orange-500 text-white' : 'bg-orange-100/70 text-orange-700'
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

            {/* ── BIG CALL TO ACTION SHOWCASE BANNER ── */}
            <section className="relative z-10 py-16 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto">
                <div className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 p-8 sm:p-12 lg:p-14 text-white shadow-2xl shadow-orange-500/30 overflow-hidden">
                    {/* Background glow discs */}
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-8 text-center lg:text-left">
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md mb-4 border border-white/30">
                                <Sparkles size={15} /> 100% Free Self-Serve Setup
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                                Ready to Lead Your Campus? <br />
                                <span className="text-amber-200">Start In Under 60 Seconds.</span>
                            </h2>
                            <p className="text-white/95 text-sm sm:text-base lg:text-lg mb-7 leading-relaxed max-w-2xl font-medium">
                                Join student ambassadors and creators driving verified AI learning. Claim your custom link in seconds with zero paperwork, zero approval delays, and instant private analytics.
                            </p>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                                <button
                                    onClick={handlePrimaryCta}
                                    className="px-8 py-3.5 bg-white hover:bg-orange-50 text-orange-600 font-extrabold rounded-2xl text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
                                >
                                    <span>{user ? "Open Ambassador Dashboard" : "Claim Your Ambassador Link Now"}</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Mini Feature Highlights Box */}
                        <div className="lg:col-span-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 sm:p-6 space-y-3.5 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <Award size={18} className="text-amber-200" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Verified Certificate</div>
                                    <div className="text-xs text-white/80">Tamper-proof LinkedIn credential</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <Zap size={18} className="text-amber-200" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Free Pro AI Access</div>
                                    <div className="text-xs text-white/80">Unlimited summaries & tokens</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <Trophy size={18} className="text-amber-200" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Live Leaderboards</div>
                                    <div className="text-xs text-white/80">Real-time click & signup tracking</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <Gift size={18} className="text-amber-200" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">100% Self-Serve</div>
                                    <div className="text-xs text-white/80">Instant custom link generation</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER (Clean, Bright, & Seamless) ── */}
            <footer className="border-t border-orange-100 py-12 px-4 sm:px-8 lg:px-16 bg-white relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0 text-center md:text-left">
                            <img src="/LP_logo.png" alt="LearnProof" className="h-10 w-auto object-contain mx-auto md:mx-0" />
                            <p className="text-gray-600 mt-2 text-sm">The ultimate AI classroom for YouTube learners.</p>
                            <div className="flex justify-center md:justify-start space-x-6 mt-4">
                                <a href="https://www.linkedin.com/company/learnproof-ai/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" aria-label="LinkedIn">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path></svg>
                                </a>
                                <a href="https://instagram.com/learnproofai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" aria-label="Instagram">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </a>
                                <a href="https://youtube.com/@LearnProof_AI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" aria-label="YouTube">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                                </a>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-gray-600 text-sm">
                            <div className="flex flex-col space-y-3">
                                <h4 className="font-bold text-gray-900 mb-1">Platform</h4>
                                <a href="/dashboard" className="hover:text-orange-600 transition-colors">Courses</a>
                                <a href="/dashboard" className="hover:text-orange-600 transition-colors">Roadmaps</a>
                                <a href="/dashboard" className="hover:text-orange-600 transition-colors">Certificates</a>
                                <a href="/ambassador" className="hover:text-orange-600 transition-colors font-semibold text-orange-600">Ambassadors</a>
                                <Link to="/#download" className="hover:text-orange-600 transition-colors text-left">Downloads</Link>
                            </div>
                            <div className="flex flex-col space-y-3">
                                <h4 className="font-bold text-gray-900 mb-1">Company</h4>
                                <a href="/ambassador" className="hover:text-orange-600 transition-colors">Referral Program</a>
                                <a href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</a>
                                <a href="/terms" className="hover:text-orange-600 transition-colors">Terms</a>
                                <a href="/support" className="hover:text-orange-600 transition-colors">Support</a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-orange-100 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs sm:text-sm gap-2">
                        <p>&copy; 2026 LearnProof AI. All rights reserved.</p>
                        <div className="flex space-x-6">
                            <span>Built with ❤️ for lifelong learners</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
