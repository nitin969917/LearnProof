import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Award, BookOpen, CheckCircle, Star, ArrowRight, Youtube, Shield, Zap, Trophy, Target, Clock, Coffee, Lightbulb, TrendingUp, Sparkles, FileText, MessageSquare, CheckSquare, Search, AlertTriangle, Users, ChevronDown, Download, Laptop, Monitor, AlertCircle, Smartphone, Linkedin } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const faqs = [
    {
        q: "What is LearnProof AI?",
        a: "LearnProof AI is an advanced educational platform that uses artificial intelligence to transform YouTube videos into comprehensive learning experiences, complete with automated notes, interactive quizzes, and verifiable certificates."
    },
    {
        q: "How does the YouTube Course Tracker work?",
        a: "By simply importing a YouTube video or playlist, LearnProof AI tracks your progress, parses the content for intuition, and ensures you're mastering the material through AI-grounded assessments."
    },
    {
        q: "Are the certificates truly verifiable?",
        a: "Yes. Every certificate issued by LearnProof AI comes with a unique Verification ID and a public link that can be shared on LinkedIn, resumes, or portfolios for employers to authenticate."
    },
    {
        q: "Is LearnProof AI free to use?",
        a: "We offer a generous free tier that allows anyone to start learning immediately without a credit card. Advanced features and higher limits are available for power learners."
    },
    {
        q: "How does the AI generate quizzes and notes?",
        a: "Our proprietary AI engine analyzes the video content and descriptions to extract key insights, creating contextually accurate summaries and challenging quizzes tailored to the specific material."
    }
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

    return (
        <section id="faq" className="py-24 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-50 to-orange-50/40 border-t border-orange-100">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16"
                >
                    <div>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-4">
                            <Sparkles size={14} /> FAQs
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-black text-gray-900 leading-tight">
                            Common <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Questions</span>
                        </h2>
                    </div>
                    <p className="text-gray-500 text-base lg:text-lg max-w-sm leading-relaxed">
                        Everything you need to know about the LearnProof AI ecosystem.
                    </p>
                </motion.div>

                {/* Accordion Items */}
                <div className="space-y-3">
                    {faqs.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <button
                                    onClick={() => toggle(i)}
                                    className={`w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden focus:outline-none ${
                                        isOpen
                                            ? 'bg-white border-orange-300 shadow-lg shadow-orange-100'
                                            : 'bg-white/70 border-gray-200 hover:border-orange-200 hover:shadow-md'
                                    }`}
                                >
                                    {/* Question row */}
                                    <div className="flex items-center gap-4 px-6 py-5">
                                        {/* Number badge */}
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-colors duration-300 ${
                                            isOpen ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-200' : 'bg-orange-50 text-orange-400'
                                        }`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </div>

                                        <span className={`flex-1 text-base sm:text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-orange-600' : 'text-gray-800'}`}>
                                            {item.q}
                                        </span>

                                        {/* Chevron */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isOpen ? 'bg-orange-500 text-white rotate-180' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>

                                    {/* Answer — animated */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key="answer"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-0">
                                                    <div className="h-px bg-orange-100 mb-4" />
                                                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-[52px]">
                                                        {item.a}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* FAQ Schema for Google */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": faqs.map(f => ({
                        "@type": "Question",
                        "name": f.q,
                        "acceptedAnswer": { "@type": "Answer", "text": f.a }
                    }))
                })}
            </script>
        </section>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showContent, setShowContent] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [userCount, setUserCount] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 50);

        const fetchUserCount = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/public-stats`);
                if (response.ok) {
                    const data = await response.json();
                    setUserCount(data.totalUsers);
                }
            } catch (err) {
                console.error("Error fetching user count:", err);
            }
        };
        fetchUserCount();

        // SEO Map
        const seoMap = {
            '/youtube-learning': {
                title: 'Learn YouTube Smarter | AI Learning Assistant',
                desc: 'Turn any YouTube video into an interactive course with LearnProof AI. Track progress and earn certificates.'
            },
            '/ai-video-notes': {
                title: 'AI Video Notes & Summaries | LearnProof AI',
                desc: 'Instantly generate rich, searchable notes from YouTube videos using our advanced AI Video Intuition engine.'
            },
            '/youtube-certificates': {
                title: 'Earn Verifiable YouTube Certificates | LearnProof AI',
                desc: 'Get cryptographic certificates for completing your YouTube learning journeys. Boost your portfolio today.'
            },
            '/track-youtube-progress': {
                title: 'YouTube Progress Tracker | AI Course Management',
                desc: 'Never lose track of where you left off. Manage your YouTube-based learning with professional progress analytics.'
            },
            '/ai-study-planner': {
                title: 'AI Personalized Study Roadmaps | LearnProof AI',
                desc: 'Generate complete, step-by-step learning paths for any topic using our AI roadmap generator.'
            }
        };

        const seo = seoMap[location.pathname];
        if (seo) {
            document.title = seo.title;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', seo.desc);
        } else {
            // Default SEO
            document.title = 'LearnProof AI | Verified YouTube Learning Certificates';
        }

        // Handle Google Redirect Fragment
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const idToken = params.get('id_token') || params.get('credential');
            if (idToken) {
                handleGoogleSuccess({ credential: idToken });
                // Clean the hash from URL
                window.history.replaceState(null, '', window.location.pathname);
            }
        }

        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const { login, user, loading } = useAuth();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // Handle both GSI component response and useGoogleLogin response
            const idToken = credentialResponse.credential || credentialResponse.id_token;
            
            if (!idToken) {
                console.error("No ID token received", credentialResponse);
                return;
            }

            login({ credential: idToken });
            
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || "Backend login failed");
            }

            const data = await res.json();
            console.log("User synced with backend:", data);

            navigate("/dashboard");
        } catch (err) {
            console.error("Google login error:", err);
            toast.error(`Login failed: ${err.message}`);
        }
    };

    useEffect(() => {
        if (!loading && user) {
            if (location.pathname === '/') {
                navigate("/dashboard");
            }
        }
    }, [user, loading, navigate, location.pathname]);

    const handleManualGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = window.location.origin;
        const nonce = Math.random().toString(36).substring(2);
        
        // Construct the Google OAuth URL manually to guarantee same-tab redirect
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=id_token` +
            `&scope=${encodeURIComponent('openid email profile')}` +
            `&nonce=${nonce}` +
            `&ux_mode=redirect`;
            
        window.location.href = authUrl;
    };



    const features = [
        {
            icon: <Youtube className="w-7 h-7" />,
            title: "Discover YouTube Content",
            description: "Search and find curated YouTube videos tailored to your learning goals right from the dashboard.",
            gradient: "from-red-500 to-rose-500", glow: "rgba(239,68,68,0.18)", accent: "border-red-400", badge: "bg-red-50 text-red-600"
        },
        {
            icon: <Sparkles className="w-7 h-7" />,
            title: "AI Video Intuition",
            description: "Get instant, AI-generated summaries and deep insights extracted directly from video content.",
            gradient: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.18)", accent: "border-violet-400", badge: "bg-violet-50 text-violet-600"
        },
        {
            icon: <FileText className="w-7 h-7" />,
            title: "Rich Text Notes",
            description: "Take formatted, time-stamped notes alongside your videos using a native rich-text editor.",
            gradient: "from-blue-500 to-cyan-500", glow: "rgba(59,130,246,0.18)", accent: "border-blue-400", badge: "bg-blue-50 text-blue-600"
        },
        {
            icon: <MessageSquare className="w-7 h-7" />,
            title: "Community Discussions",
            description: "Engage with fellow learners, ask questions, and share knowledge on specific video topics.",
            gradient: "from-emerald-500 to-teal-500", glow: "rgba(16,185,129,0.18)", accent: "border-emerald-400", badge: "bg-emerald-50 text-emerald-600"
        },
        {
            icon: <CheckSquare className="w-7 h-7" />,
            title: "Daily Tasks & Goals",
            description: "Set personalized daily learning objectives and maintain accountability with persistent task tracking.",
            gradient: "from-orange-500 to-amber-500", glow: "rgba(249,115,22,0.18)", accent: "border-orange-400", badge: "bg-orange-50 text-orange-600"
        },
        {
            icon: <Lightbulb className="w-7 h-7" />,
            title: "AI-Powered Quizzes",
            description: "Test your understanding with personalized, dynamically generated quizzes tailored to video content.",
            gradient: "from-yellow-500 to-orange-500", glow: "rgba(234,179,8,0.18)", accent: "border-yellow-400", badge: "bg-yellow-50 text-yellow-700"
        },
        {
            icon: <Award className="w-7 h-7" />,
            title: "Verifiable Certificates",
            description: "Earn cryptographic certificates proving your completion status with unique verification IDs.",
            gradient: "from-pink-500 to-rose-600", glow: "rgba(236,72,153,0.18)", accent: "border-pink-400", badge: "bg-pink-50 text-pink-600"
        },
        {
            icon: <Trophy className="w-7 h-7" />,
            title: "Gamified Learning XP",
            description: "Level up your profile, earn XP for completing milestones, and unlock exclusive achievements.",
            gradient: "from-amber-500 to-yellow-400", glow: "rgba(245,158,11,0.18)", accent: "border-amber-400", badge: "bg-amber-50 text-amber-700"
        },
        {
            icon: <TrendingUp className="w-7 h-7" />,
            title: "Progress Analytics",
            description: "Visualize your learning journey, track completion rates, and analyze your activity heatmap.",
            gradient: "from-indigo-500 to-blue-600", glow: "rgba(99,102,241,0.18)", accent: "border-indigo-400", badge: "bg-indigo-50 text-indigo-600"
        },
        {
            icon: <Target className="w-7 h-7" />,
            title: "AI-Powered Roadmaps",
            description: "Generate structured, step-by-step learning paths tailored to your specific goals and timelines.",
            gradient: "from-fuchsia-500 to-pink-500", glow: "rgba(217,70,239,0.18)", accent: "border-fuchsia-400", badge: "bg-fuchsia-50 text-fuchsia-600"
        },
        {
            icon: <BookOpen className="w-7 h-7" />,
            title: "Personalized Skill Paths",
            description: "Follow curated sequences of videos and quizzes designed to master specific technical domains.",
            gradient: "from-teal-500 to-emerald-600", glow: "rgba(20,184,166,0.18)", accent: "border-teal-400", badge: "bg-teal-50 text-teal-600"
        },
        {
            icon: <BookOpen className="w-7 h-7" />,
            title: "Smart Notes Q&A (AskMyNotes)",
            description: "Upload personal PDFs or notes and ask questions to get precise, content-based answers instantly.",
            gradient: "from-cyan-500 to-sky-600", glow: "rgba(6,182,212,0.18)", accent: "border-cyan-400", badge: "bg-cyan-50 text-cyan-600"
        },
        {
            icon: <Target className="w-7 h-7" />,
            title: "Subject-Scoped Intelligence",
            description: "Ask questions within a specific subject domain to guarantee highly focused, accurate AI responses.",
            gradient: "from-slate-600 to-gray-700", glow: "rgba(71,85,105,0.18)", accent: "border-slate-400", badge: "bg-slate-50 text-slate-600"
        },
        {
            icon: <Users className="w-7 h-7" />,
            title: "Live Language Room",
            description: "Practice languages in real-time with AI-powered live rooms to speak, listen, and improve fluency.",
            gradient: "from-green-500 to-emerald-600", glow: "rgba(34,197,94,0.18)", accent: "border-green-400", badge: "bg-green-50 text-green-600"
        },
        {
            icon: <Clock className="w-7 h-7" />,
            title: "Daily Target & Screen Time",
            description: "Set daily learning goals and track screen time to build consistent study habits with streak tracking.",
            gradient: "from-orange-600 to-red-500", glow: "rgba(234,88,12,0.18)", accent: "border-orange-500", badge: "bg-orange-50 text-orange-700"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Paste YouTube Link",
            description: "Add any lecture or tutorial video from YouTube instantly.",
            icon: <Youtube className="w-7 h-7" />,
            gradient: "from-red-500 to-rose-600",
            glow: "rgba(239,68,68,0.25)",
            bg: "bg-red-50",
            border: "border-red-200"
        },
        {
            number: "02",
            title: "Generate AI Notes",
            description: "Get instant summaries, structured notes and live note taking.",
            icon: <FileText className="w-7 h-7" />,
            gradient: "from-violet-500 to-purple-600",
            glow: "rgba(139,92,246,0.25)",
            bg: "bg-violet-50",
            border: "border-violet-200"
        },
        {
            number: "03",
            title: "Practice with Quizzes",
            description: "Test your understanding instantly with AI-generated quizzes.",
            icon: <CheckSquare className="w-7 h-7" />,
            gradient: "from-blue-500 to-cyan-500",
            glow: "rgba(59,130,246,0.25)",
            bg: "bg-blue-50",
            border: "border-blue-200"
        },
        {
            number: "04",
            title: "Follow Learning Roadmap",
            description: "Study topics step by step with your AI-curated roadmap.",
            icon: <TrendingUp className="w-7 h-7" />,
            gradient: "from-orange-500 to-amber-500",
            glow: "rgba(249,115,22,0.25)",
            bg: "bg-orange-50",
            border: "border-orange-200"
        },
        {
            number: "05",
            title: "Track Progress & Earn Certificate",
            description: "Monitor learning and get verifiable proof of completion.",
            icon: <Award className="w-7 h-7" />,
            gradient: "from-emerald-500 to-green-600",
            glow: "rgba(16,185,129,0.25)",
            bg: "bg-emerald-50",
            border: "border-emerald-200"
        }
    ];

    const benefits = [
        {
            icon: <Coffee className="w-6 h-6" />,
            title: "Learn at Your Pace",
            description: "No deadlines, no pressure. Learn when it suits you best."
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Verified Learning",
            description: "Prove your skills with certificates that employers trust."
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "AI-Powered Insights",
            description: "Get deep video intuitions and summaries instantly with our advanced AI."
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Track Your Progress",
            description: "Stay motivated with detailed analytics and completion tracking features."
        }
    ];

    return (
        <div className="min-h-screen bg-orange-50 relative overflow-hidden selection:bg-orange-200 pt-16 md:pt-18">
            {/* Header / Sticky Glassmorphism Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrollY > 20 
                    ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-orange-100/50 py-1' 
                    : 'bg-transparent py-2.5'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center cursor-pointer py-0 my-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/LP_logo.png" alt="LearnProof" className="h-14 sm:h-15 w-auto object-contain my-0 py-0 block" />
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
                        <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">About</button>
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Features</button>
                        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">How It Works</button>
                        <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">FAQs</button>
                        <button onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Downloads</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleManualGoogleLogin}
                            className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors hidden sm:block"
                        >
                            Login
                        </button>
                        <button 
                            onClick={handleManualGoogleLogin}
                            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 animate-fade-in"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Background Texture & Blobs */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[120px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[100px] opacity-40 z-0 pointer-events-none -translate-x-1/3"></div>

            {/* Hero Section */}
            < div className="relative z-10 min-h-screen flex items-center justify-between px-4 sm:px-8 lg:px-16 pt-20 pb-10" >
                {/* Animated LearnProof Title with Enhanced Content */}
                < motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={showContent ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
                    className="z-10 max-w-2xl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={showContent ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-orange-200 text-orange-600 text-sm font-bold tracking-wide mb-8 shadow-sm"
                    >
                        <Sparkles size={16} role="img" aria-label="AI Intelligence Feature" />
                        <span>The Ultimate AI Learning Platform</span>
                    </motion.div>

                    <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                        <span className="bg-gradient-to-br from-orange-600 via-red-500 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">LearnProof AI</span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-gray-600 font-medium mb-10 max-w-xl leading-relaxed">
                        Transform <span className="text-gray-900 font-bold border-b-2 border-orange-300">YouTube videos</span> into verifiable achievements with AI-powered course tracking, personalized notes, and quizzes.
                    </p>

                    <div className="flex flex-wrap gap-4 mb-12">
                        {[
                            { text: "Discover Curated Videos", icon: <Youtube size={18} className="text-red-500" /> },
                            { text: "AI-Generated Quizzes", icon: <Zap size={18} className="text-amber-500" /> },
                            { text: "Earn Certificates", icon: <Award size={18} className="text-orange-500" /> },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={showContent ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: 0.4 + (i * 0.1), duration: 0.6 }}
                                className="flex items-center gap-2.5 bg-white/70 backdrop-blur-md border border-gray-200/60 rounded-full px-5 py-2.5 shadow-sm text-gray-700 font-semibold"
                            >
                                <div role="img" aria-label={item.text}>{item.icon}</div>
                                <span>{item.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={showContent ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center gap-6 flex-wrap"
                    >
                        <button 
                            onClick={handleManualGoogleLogin}
                            className="flex items-center gap-3 px-8 py-3.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.2)] transition-all duration-300 transform hover:-translate-y-1 border border-orange-100 font-bold text-gray-700"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>
                        <a
                            href="https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-all duration-300 transform hover:-translate-y-1 hover:opacity-90 drop-shadow-lg hover:drop-shadow-xl"
                            aria-label="Get it on Google Play"
                        >
                            <img
                                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                                alt="Get it on Google Play"
                                className="h-[58px] w-auto"
                            />
                        </a>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white/50 px-4 py-2 rounded-full border border-gray-200/50 backdrop-blur-sm">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Free forever to start</span>
                        </div>
                        {userCount !== null && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white/50 px-4 py-2 rounded-full border border-gray-200/50 backdrop-blur-sm">
                                <Users size={16} className="text-orange-500" />
                                <span>Join <span className="font-bold text-gray-900">{userCount.toLocaleString()}</span> active learners</span>
                            </div>
                        )}
                    </motion.div>
                </motion.div >

                {/* Enhanced Right Side Design */}
                < motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={showContent ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.4, duration: 1, type: "spring", stiffness: 50 }}
                    className="hidden lg:block relative w-full max-w-[650px]"
                >
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        {/* Huge Central Glow */}
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4], rotate: [0, 90, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-orange-500 via-red-400 to-amber-300 rounded-full blur-[90px]"
                        />

                        {/* Background Decorative Rings */}
                        <div className="absolute w-[500px] h-[500px] border-[1px] border-orange-300/30 rounded-full"></div>
                        <div className="absolute w-[350px] h-[350px] border-[1px] border-orange-400/20 rounded-full border-dashed"></div>

                        {/* Main App Mockup Window */}
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute z-10 w-[460px] h-[340px] bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col"
                        >
                            {/* Window Header */}
                            <div className="h-12 bg-white/40 border-b border-white/50 flex items-center px-5 gap-2.5">
                                <div className="w-3.5 h-3.5 rounded-full bg-red-400 border border-red-500/20"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-500/20"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-green-400 border border-green-500/20"></div>
                            </div>
                            {/* Window Body Mockup */}
                            <div className="p-6 flex-1 flex flex-col gap-5">
                                <div className="h-5 w-2/3 bg-gray-200/80 rounded-full"></div>
                                <div className="h-4 w-1/3 bg-gray-200/50 rounded-full"></div>

                                <div className="mt-auto p-5 bg-white/60 rounded-2xl border border-white/60 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl border border-orange-100 flex items-center justify-center shadow-inner">
                                            <Play className="text-orange-500 w-6 h-6 fill-orange-500" />
                                        </div>
                                        <div>
                                            <div className="h-3.5 w-28 bg-gray-300 rounded-full mb-2.5"></div>
                                            <div className="h-2.5 w-16 bg-gray-200 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-orange-500 flex items-center justify-center relative">
                                        <span className="text-sm font-extrabold text-gray-700">75%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Cards (positioned relative to container) */}
                        <motion.div
                            animate={{ y: [0, -15, 0], rotate: [0, 4, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            className="absolute top-[8%] right-[-5%] bg-white/95 backdrop-blur-xl border border-orange-100 rounded-2xl p-4 w-60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] z-20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Certificate Earned!</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">React Fundamentals</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 20, 0], x: [0, -5, 0], rotate: [0, -4, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                            className="absolute bottom-[10%] left-[-8%] bg-gradient-to-br from-orange-50 to-orange-100/90 backdrop-blur-xl border border-orange-200 rounded-2xl p-4 w-52 shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] z-30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transform -rotate-12">
                                    <Star className="w-5 h-5 text-white fill-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Level Up!</p>
                                    <p className="text-xs text-orange-600 font-bold mt-0.5">2,450 XP gained</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, -10, 0], x: [0, 10, 0], rotate: [0, -2, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                            className="absolute top-[28%] left-[-4%] bg-white/95 backdrop-blur-xl border border-red-100 rounded-2xl p-3.5 w-52 shadow-xl z-20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-gray-800">Course Discovered</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">JavaScript Tutorial</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div >
            </div >

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* Videos Section */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-10 sm:py-16 px-3 sm:px-8 lg:px-16"
            >
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-8 sm:mb-12"
                    >
                        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-6 text-gray-800">
                            See LearnProof in <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Action</span>
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto px-2">
                            Watch how LearnProof AI transforms YouTube videos into a complete learning experience with quizzes, notes, and verified certificates.
                        </p>
                    </motion.div>

                    {/* Single YouTube Video */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="bg-white/80 backdrop-blur-xl border border-orange-200 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                        <div className="flex items-center gap-3 mb-3 sm:mb-5 px-1 sm:px-2">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-xl font-bold text-gray-800 leading-tight">Introduction & How to Use</h3>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Discover what LearnProof AI is all about and get started in minutes</p>
                            </div>
                        </div>

                        {/* Responsive video wrapper — fixed 16:9 on all screens */}
                        <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gray-900 shadow-inner"
                             style={{ paddingTop: '56.25%' }}>
                            <iframe
                                src="https://www.youtube.com/embed/HndfbcftAdQ?si=bugw11VaM70ux1bf&vq=hd2160&hd=1&rel=0"
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                title="Introduction to LearnProof AI - How to Use"
                            ></iframe>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* How It Works Section */}
            <motion.section
                id="how-it-works"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 overflow-hidden"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-5 border border-orange-200">
                            <Zap size={14} /> 5 Simple Steps
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-gray-900">
                            How It{" "}
                            <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                                Works
                            </span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
                            Get started in <span className="font-semibold text-orange-500">minutes</span> and transform your YouTube videos into verified learning achievements.
                        </p>
                    </motion.div>

                    {/* Horizontal Step Cards */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-stretch gap-3 sm:gap-2">
                        {steps.map((step, index) => (
                            <React.Fragment key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.12, duration: 0.6, ease: "easeOut" }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                    className="w-72 sm:w-auto sm:h-auto sm:flex-1 group"
                                >
                                    <div className={`w-full h-full bg-white/80 backdrop-blur-sm border ${step.border} rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center`}>
                                        {/* Icon */}
                                        <div className="relative mb-3">
                                            <div
                                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                                style={{ boxShadow: `0 8px 20px ${step.glow}` }}
                                            >
                                                {step.icon}
                                            </div>
                                            {/* Step badge */}
                                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                                                <span className="text-[9px] font-black text-gray-500">{step.number}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1 sm:mb-2 leading-tight">{step.title}</h3>
                                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{step.description}</p>
                                    </div>
                                </motion.div>

                                {/* Arrow connector between steps */}
                                {index < steps.length - 1 && (
                                    <div className="flex items-center justify-center flex-shrink-0">
                                        {/* Desktop: horizontal arrow */}
                                        <div className="hidden sm:flex items-center">
                                            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-orange-300">
                                                <path d="M0 10 H22 M18 4 L26 10 L18 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        {/* Mobile: vertical arrow */}
                                        <div className="sm:hidden text-orange-300">
                                            <svg width="16" height="22" viewBox="0 0 20 28" fill="none">
                                                <path d="M10 0 V22 M4 18 L10 26 L16 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* Features Section */}
            <motion.section
                id="features"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-5 border border-orange-200">
                            <Sparkles size={14} /> 15 Powerful Features
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-gray-900">
                            Why Choose{" "}
                            <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                                LearnProof?
                            </span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Transform your YouTube learning experience with verified progress tracking and achievement certification
                        </p>
                    </motion.div>

                    {/* Mobile: centered single-column cards | Desktop: grid */}
                    <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.5 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                className="w-72 sm:w-auto group relative bg-white border border-orange-100 rounded-2xl p-5 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-default overflow-hidden flex flex-col items-center text-center"
                                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 32px ${feature.glow}`}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                            >
                                {/* Top accent line on hover */}
                                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />

                                {/* Icon tile */}
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}
                                    style={{ boxShadow: `0 4px 14px ${feature.glow}` }}
                                >
                                    {feature.icon}
                                </div>

                                <h3 className="text-sm font-bold text-gray-800 mb-2 leading-snug">{feature.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* Downloads Section */}
            <motion.section
                id="download"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-50 to-orange-50/40 relative overflow-hidden border-t border-b border-orange-100"
            >
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-4 shadow-sm border border-orange-200">
                            <Sparkles size={14} /> Desktop Apps
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                            Download the <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">LearnProof AI</span> App
                        </h2>
                        <p className="text-gray-600 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            Access our full companion client. Run locally on your desktop for high-performance trackability.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6 md:grid md:grid-cols-3 md:gap-8 mb-12 max-w-5xl mx-auto">
                        {/* Android Card */}
                        <div className="w-72 md:w-full h-full bg-white border border-orange-100 rounded-2xl p-6 shadow-md hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-between text-center">
                            <div className="flex flex-col items-center">
                                {/* Icon tile */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white mb-4 shadow-md">
                                    <Smartphone className="w-6 h-6" />
                                </div>

                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full mb-3">
                                    .apk • Google Play Store
                                </span>

                                <h3 className="text-base font-bold text-gray-800 mb-2 leading-snug font-sans">LearnProof AI for Android</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                                    Access your learning space on the go. Synchronized streak tracking and progress heatmap updates.
                                </p>
                            </div>

                            <a
                                href="https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-all duration-300 transform hover:scale-105 hover:opacity-90 drop-shadow-md hover:drop-shadow-lg mt-auto block"
                                aria-label="Get it on Google Play"
                            >
                                <img
                                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                                    alt="Get it on Google Play"
                                    className="h-[48px] w-auto object-contain"
                                />
                            </a>
                        </div>

                        {/* macOS Card */}
                        <div className="w-72 md:w-full h-full bg-white border border-orange-100 rounded-2xl p-6 shadow-md hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-between text-center">
                            <div className="flex flex-col items-center">
                                {/* Icon tile */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-md">
                                    <Laptop className="w-6 h-6" />
                                </div>

                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full mb-3">
                                    .dmg • approx. 80MB
                                </span>

                                <h3 className="text-base font-bold text-gray-800 mb-2 leading-snug font-sans">LearnProof AI for macOS</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                                    Companion desktop environment optimized for macOS. Includes floating note sidebar overlays.
                                </p>
                            </div>

                            <a
                                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/apps/LearnProof-AI.dmg`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all transform active:scale-95 mt-auto"
                            >
                                <Download size={14} />
                                <span>Download for macOS</span>
                            </a>
                        </div>

                        {/* Windows Card */}
                        <div className="w-72 md:w-full h-full bg-white border border-orange-100 rounded-2xl p-6 shadow-md hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-between text-center">
                            <div className="flex flex-col items-center">
                                {/* Icon tile */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white mb-4 shadow-md">
                                    <Monitor className="w-6 h-6" />
                                </div>

                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full mb-3">
                                    .exe • approx. 65MB
                                </span>

                                <h3 className="text-base font-bold text-gray-800 mb-2 leading-snug font-sans">LearnProof AI for Windows</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                                    Native Windows runtime with low resource usage and system tray quick-launch tools.
                                </p>
                            </div>

                            <a
                                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/apps/LearnProof-AI.exe`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-600 transition-all transform active:scale-95 mt-auto"
                            >
                                <Download size={14} />
                                <span>Download for Windows</span>
                            </a>
                        </div>
                    </div>

                    {/* Installation Notes / Help Accordion */}
                    <div className="bg-white/80 rounded-2xl p-6 border border-orange-100 max-w-3xl mx-auto text-left space-y-4">
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <AlertCircle size={16} className="text-orange-500" />
                            <span>Installation Security Guides</span>
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-6 text-xs text-gray-500">
                            <div>
                                <strong className="text-violet-600 block mb-1">macOS User Action:</strong>
                                If you see a &quot;Developer cannot be verified&quot; Gatekeeper alert, Control-click the application icon in your Applications folder and select <strong>Open</strong> to bypass.
                            </div>
                            <div>
                                <strong className="text-orange-600 block mb-1">Windows User Action:</strong>
                                If a Windows SmartScreen banner appears saying &quot;Windows protected your PC&quot;, click <strong>More Info</strong> followed by <strong>Run Anyway</strong>.
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* CTA Section */}
            < motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 px-4 sm:px-8 lg:px-16 bg-white"
            >
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-800">
                            Ready to{" "}
                            <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                                Prove Your Learning?
                            </span>
                        </h2>
                        <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
                            Start your journey of transforming YouTube videos into verified certificates. Join {userCount !== null ? <span className="font-bold text-orange-600">{userCount.toLocaleString()}</span> : '...'} active learners today and showcase your dedication to learning.
                        </p>
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <button 
                                onClick={handleManualGoogleLogin}
                                className="inline-flex items-center gap-3 px-8 py-3.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-100 font-bold text-gray-700"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span>Continue with Google</span>
                            </button>
                            <a
                                href="https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-all duration-300 transform hover:scale-105 hover:opacity-90 drop-shadow-lg hover:drop-shadow-xl"
                                aria-label="Get it on Google Play"
                            >
                                <img
                                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                                    alt="Get it on Google Play"
                                    className="h-[58px] w-auto"
                                />
                            </a>
                        </div>

                        <motion.p
                            className="text-sm text-gray-500 mt-4"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            viewport={{ once: true }}
                        >
                            Free to use • No credit card required • Start immediately
                        </motion.p>
                    </motion.div>
                </div>
            </motion.section >

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* About & Team Section */}
            <section id="about" className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-orange-50 via-white to-orange-50/30 border-t border-orange-100 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-4 border border-orange-200">
                            <Sparkles size={14} /> Company & Team
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                            About <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">LearnProof AI</span>
                        </h2>
                        <p className="text-gray-500 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            A brief story of our mission, the problem we solve, and the team driving our platform forward.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                        
                        {/* Company Story & Problem/Solution (7 cols on large screens) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -35 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="lg:col-span-7 flex flex-col justify-between bg-white/70 backdrop-blur-md border border-orange-100 rounded-3xl p-8 sm:p-10 shadow-lg shadow-orange-100/50 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-orange-500" />
                                        <span>The Problem</span>
                                    </h3>
                                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                        Traditional online learning is broken. While millions use YouTube for education, passive video consumption leads to low retention rates (often under 20%). Furthermore, self-taught individuals face significant challenges proving their self-acquired skills to employers without formal credentials.
                                    </p>
                                </div>

                                <div className="border-t border-orange-50 pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle size={18} className="text-green-500" />
                                        <span>Our Solution</span>
                                    </h3>
                                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                        LearnProof AI transforms passive media consumption into structured, active learning journeys. By overlaying real-time progress tracking, AI-generated intuition summaries, interactive assessments, and cryptographically verifiable certificates, we help students build true competency and display undeniable proof of their skills.
                                    </p>
                                </div>

                                <div className="border-t border-orange-50 pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Target size={18} className="text-red-500" />
                                        <span>Our Story & Mission</span>
                                    </h3>
                                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                        Founded in 2026, LearnProof AI was born from a simple mission: to democratize education. We believe that learning should be self-paced, engaging, and globally recognized. We aim to bridge the gap between open-source education and career-defining credentials.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Team Section (5 cols on large screens) */}
                        <motion.div 
                            initial={{ opacity: 0, x: 35 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-white to-orange-50/20 backdrop-blur-md border border-orange-100 rounded-3xl p-8 sm:p-10 shadow-lg shadow-orange-100/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                        >
                            {/* Decorative background circle */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100/50 rounded-full blur-2xl group-hover:bg-orange-200/50 transition-all duration-500" />
                            
                            <div className="relative z-10">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-6 border border-orange-200">
                                    <Users size={14} /> Our Team
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                                    Team & <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Leadership</span>
                                </h2>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    LearnProof AI is currently being developed independently as a founder-led startup.
                                </p>
                                
                                {/* Founder Card (Nitin Gaikwad) */}
                                <div className="bg-white/80 border border-orange-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img 
                                            src="https://unavatar.io/linkedin/nitin9699" 
                                            alt="Nitin Gaikwad" 
                                            className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500/20 shadow-lg shadow-orange-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallback = document.getElementById('avatar-fallback');
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                        <div 
                                            id="avatar-fallback"
                                            style={{ display: 'none' }}
                                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-200"
                                        >
                                            NG
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Nitin Gaikwad</h3>
                                            <p className="text-xs font-semibold text-orange-600">Founder & Lead Developer</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                                        Nitin is the creator and lead developer of LearnProof AI, building AI-powered study tools for lifelong learners.
                                    </p>
                                    
                                    {/* LinkedIn CTA Button */}
                                    <a 
                                        href="https://www.linkedin.com/in/nitin9699" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all duration-300 transform hover:-translate-y-0.5"
                                    >
                                        <Linkedin size={14} fill="currentColor" />
                                        <span>LinkedIn Profile</span>
                                    </a>
                                </div>
                            </div>

                            <div className="relative z-10 pt-6 mt-6 border-t border-orange-100/80">
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Interested in collaborating or joining the team? Contact us at <a href="mailto:founder@learnproofai.com" className="text-orange-500 hover:underline">founder@learnproofai.com</a>.
                                </p>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* FAQ Section with Schema */}
            <FAQSection />

            {/* Section Divider */}
            <div className="px-8 sm:px-16">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
            </div>

            {/* SEO Keyword Cloud Section (Hidden for SEO) */}
            <section className="sr-only">
                <h2>POPULAR LEARNING SEARCHES</h2>
                <ul>
                    {[
                        "Learn Proof AI", "LearnProof AI", "Learn Proof", "Proof Learn", "LearnAI", "ProofAI", 
                        "AI Study Assistant", "Personalized Learning AI", "Smart Learning Proof", "Educational AI", 
                        "YouTube Course Tracker", "AI Video Insights", "YouTube Study Planner", "AI Note Taker", 
                        "Verifiable Learning Certificates", "Proof of Learning AI", "AI-Powered Education", 
                        "YouTube Learning Platform", "Smart Study Assistant", "AI Transcript Summaries", 
                        "YouTube Progress Tracker", "Learn Faster with AI", "AI-Generated Quizzes", 
                        "Evidence-Based Learning", "Digital Certificates for YouTube", "AI Academic Assistant", 
                        "EdTech AI Solution", "YouTube Knowledge Verification", "AI Continuous Learning", 
                        "Skill Verification AI", "Micro-credentialing from YouTube", "AI-Driven Personal Growth", 
                        "Video Learning Analytics", "Automated Study Notes", "AI Video Summarization", 
                        "Verify YouTube Skills", "LearnProof Certificates", "Proof of Competency AI", 
                        "YouTube Certification Platform", "AI Career Development", "Personalized Skill Paths AI", 
                        "AI Roadmap Generator", "YouTube Learning Evidence", "AI-Powered Knowledge Base", 
                        "Smart Video Learning", "LearnProof Productivity AI", "AI Education Tracker", 
                        "YouTube Mastery AI", "Verified Achievements AI", "YouTube Education Tool"
                    ].map((kw) => (
                        <li key={kw}>{kw}</li>
                    ))}
                </ul>
            </section>


            {/* Footer */}
            < footer className="border-t border-orange-200 py-8 px-4 sm:px-8 lg:px-16 bg-orange-50" >
                <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="mb-6 md:mb-0">
                                <img src="/LP_logo.png" alt="LearnProof" className="h-10 w-auto object-contain" />
                                <p className="text-gray-600 mt-2">The ultimate AI classroom for YouTube learners.</p>
                                <div className="flex space-x-6 mt-4">
                                    <a href="https://www.linkedin.com/company/learnproof-ai/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path></svg>
                                    </a>
                                    <a href="https://instagram.com/learnproofai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    </a>
                                    <a href="https://youtube.com/@LearnProof_AI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 text-gray-600">
                                <div className="flex flex-col space-y-3">
                                    <h4 className="font-bold text-gray-900 mb-2">Platform</h4>
                                    <a href="/dashboard" className="hover:text-orange-600 transition-colors">Courses</a>
                                    <a href="/dashboard" className="hover:text-orange-600 transition-colors">Roadmaps</a>
                                    <a href="/dashboard" className="hover:text-orange-600 transition-colors">Certificates</a>
                                    <button onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors text-left">Downloads</button>
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <h4 className="font-bold text-gray-900 mb-2">Company</h4>
                                    <a href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</a>
                                    <a href="/terms" className="hover:text-orange-600 transition-colors">Terms</a>
                                    <a href="/support" className="hover:text-orange-600 transition-colors">Support</a>
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
            </footer >
        </div >
    );
};

export default LandingPage;