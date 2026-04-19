import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Award, BookOpen, CheckCircle, Star, ArrowRight, Youtube, Shield, Zap, Trophy, Target, Clock, Coffee, Lightbulb, TrendingUp, Sparkles, FileText, MessageSquare, CheckSquare, Search, AlertTriangle } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showContent, setShowContent] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 50);

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
            icon: <Youtube className="w-8 h-8" />,
            title: "Discover YouTube Content",
            description: "Search and find curated YouTube videos tailored to your learning goals right from the dashboard."
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: "AI Video Intuition",
            description: "Get instant, AI-generated summaries and deep insights extracted directly from video content."
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: "Rich Text Notes",
            description: "Take formatted, time-stamped notes alongside your videos using a native rich-text editor."
        },
        {
            icon: <MessageSquare className="w-8 h-8" />,
            title: "Community Discussions",
            description: "Engage with fellow learners, ask questions, and share knowledge on specific video topics."
        },
        {
            icon: <CheckSquare className="w-8 h-8" />,
            title: "Daily Tasks & Goals",
            description: "Set personalized daily learning objectives and maintain accountability with persistent task tracking."
        },
        {
            icon: <Lightbulb className="w-8 h-8" />,
            title: "AI-Powered Quizzes",
            description: "Test your understanding with personalized, dynamically generated quizzes tailored to video content."
        },
        {
            icon: <Award className="w-8 h-8" />,
            title: "Verifiable Certificates",
            description: "Earn cryptographic certificates proving your completion status with unique verification IDs."
        },
        {
            icon: <Trophy className="w-8 h-8" />,
            title: "Gamified Learning XP",
            description: "Level up your profile, earn XP for completing milestones, and unlock exclusive achievements."
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: "Progress Analytics",
            description: "Visualize your learning journey, track completion rates, and analyze your activity heatmap."
        },
        {
            icon: <Target className="w-8 h-8" />,
            title: "AI-Powered Roadmaps",
            description: "Generate structured, step-by-step learning paths tailored to your specific goals and timelines."
        },
        {
            icon: <BookOpen className="w-8 h-8" />,
            title: "Personalized Skill Paths",
            description: "Follow curated sequences of videos and quizzes designed to master specific technical domains."
        },
        {
            icon: <BookOpen className="w-8 h-8" />,
            title: "Smart Notes Q&A (AskMyNotes)",
            description: "Upload personal PDFs or notes and ask questions to get precise, content-based answers instantly."
        },
        {
            icon: <Target className="w-8 h-8" />,
            title: "Subject-Scoped Intelligence",
            description: "Ask questions within a specific subject domain to guarantee highly focused, accurate AI responses."
        },
        {
            icon: <Search className="w-8 h-8" />,
            title: "Evidence-Based Answers",
            description: "Verify information instantly with exact citations and text snippets straight from your uploaded notes."
        },
        {
            icon: <AlertTriangle className="w-8 h-8" />,
            title: "Strict \"Not Found\" Guarantee",
            description: "Eliminate AI guesswork. The system clearly states if a requested answer is not found in your notes."
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Discover Content",
            description: "Search for specific topics or let AI recommend the best YouTube resources for you",
            icon: <Youtube className="w-6 h-6" />
        },
        {
            number: "02",
            title: "Watch & Learn",
            description: "Complete your learning with progress tracking",
            icon: <Play className="w-6 h-6" />
        },
        {
            number: "03",
            title: "Take Quiz",
            description: "Test your knowledge with AI-generated questions",
            icon: <Lightbulb className="w-6 h-6" />
        },
        {
            number: "04",
            title: "Get Certified",
            description: "Receive verifiable certificates for your achievements",
            icon: <Award className="w-6 h-6" />
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
        <div className="min-h-screen bg-orange-50 relative overflow-hidden selection:bg-orange-200">
            {/* Background Texture & Blobs */}
            < div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} ></div >
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
                        className="flex flex-col sm:flex-row items-center gap-6"
                    >
                        <button 
                            onClick={handleManualGoogleLogin}
                            className="flex items-center gap-3 px-8 py-3.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.2)] transition-all duration-300 transform hover:-translate-y-1 border border-orange-100 font-bold text-gray-700"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white/50 px-4 py-2 rounded-full border border-gray-200/50 backdrop-blur-sm">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Free forever to start</span>
                        </div>
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

            {/* Videos Section */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-16 px-4 sm:px-8 lg:px-16"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-800">
                            See LearnProof in <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">Action</span>
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Watch our introduction and learn how to make the most of your AI learning journey.
                        </p>
                    </motion.div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Intro Video */}
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="bg-white/80 backdrop-blur-xl border border-orange-200 rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-3 mb-5 px-2">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Introduction</h3>
                                    <p className="text-sm text-gray-500 font-medium">Discover what LearnProof AI is all about</p>
                                </div>
                            </div>
                            <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-gray-100/50 bg-gray-50 shadow-inner relative group">
                                <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl z-10"></div>
                                <iframe 
                                    src="https://drive.google.com/file/d/1IKaW11_N2w1lZzh3tx9GGLiu2LMy6Ro3/preview" 
                                    className="w-full h-full relative z-0"
                                    allow="autoplay; encrypted-media" 
                                    allowFullScreen
                                    title="Introduction to LearnProof"
                                ></iframe>
                            </div>
                        </motion.div>

                        {/* How to Use Video */}
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="bg-white/80 backdrop-blur-xl border border-orange-200 rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-3 mb-5 px-2">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Lightbulb className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">How to Use</h3>
                                    <p className="text-sm text-gray-500 font-medium">A quick tutorial to get you started</p>
                                </div>
                            </div>
                            <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-gray-100/50 bg-gray-50 shadow-inner relative group">
                                <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl z-10"></div>
                                <iframe 
                                    src="https://drive.google.com/file/d/1RjXIjOJudLngSfPLc17SFXoAtVZDuTq9/preview" 
                                    className="w-full h-full relative z-0"
                                    allow="autoplay; encrypted-media" 
                                    allowFullScreen
                                    title="How to Use LearnProof"
                                ></iframe>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section >

            {/* Benefits Section */}
            < motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-16 px-4 sm:px-8 lg:px-16 bg-white/50"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mt-16 text-center text-gray-600 leading-loose border-t border-orange-100 pt-16">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 uppercase tracking-wider">Your Personal AI Campus</h3>
                    <p className="mb-6">
                        LearnProof AI is not just another course tracker; it's a complete ecosystem designed for modern learners who leverage YouTube as their primary educational resource. We've combined state-of-the-art Large Language Models (LLMs) with intuitive progress tracking to create an environment where every video watched is a step toward a verified credential.
                    </p>
                    <p>
                        Whether you're mastering computer science, delving into history, or learning a new language, our AI agents work in the background to summarize transcripts, generate relevant assessments, and provide immediate feedback on your performance. No more passive watching—with LearnProof, you engage, you learn, and you prove your competency to the world.
                    </p>
                </div>
            </motion.section >

            {/* Features Section */}
            < motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 px-4 sm:px-8 lg:px-16"
            >
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-800">
                            Why Choose{" "}
                            <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                                LearnProof?
                            </span>
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Transform your YouTube learning experience with verified progress tracking and achievement certification
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.6 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="bg-white/70 backdrop-blur-lg border border-orange-200 rounded-xl p-6 hover:border-orange-400 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="text-orange-600 mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section >

            {/* How It Works Section */}
            < motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-r from-orange-100 to-red-100"
            >
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-800">How It Works</h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Get started in minutes and transform your learning journey
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                                viewport={{ once: true }}
                                className="text-center relative"
                            >
                                <div className="mb-6 relative">
                                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                                        {step.number}
                                    </div>
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-500 mx-auto border-2 border-orange-200">
                                        {step.icon}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-orange-400 to-red-400 opacity-30 transform translate-x-4" />
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-gray-800">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section >

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
                            Start your journey of transforming YouTube videos into verified certificates and showcase your dedication to learning
                        </p>
                        <button 
                            onClick={handleManualGoogleLogin}
                            className="inline-flex items-center gap-3 px-8 py-3.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-100 font-bold text-gray-700 mb-6"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>

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

            {/* FAQ Section with Schema */}
            <section className="py-24 px-4 sm:px-8 lg:px-16 bg-white border-t border-orange-100">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Common Questions</h2>
                        <p className="text-gray-500 text-lg font-medium">Everything you need to know about the LearnProof AI ecosystem.</p>
                    </motion.div>

                    <div className="space-y-4">
                        {[
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
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-orange-50/50 rounded-2xl p-6 border border-transparent hover:border-orange-200 transition-all"
                            >
                                <h3 className="text-lg font-black text-gray-900 mb-3 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{item.q}</h3>
                                <p className="text-gray-600 leading-relaxed font-medium">{item.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* FAQ Schema for Google */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What is LearnProof AI?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "LearnProof AI is an advanced educational platform that uses artificial intelligence to transform YouTube videos into comprehensive learning experiences, complete with automated notes, interactive quizzes, and verifiable certificates."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "How does the YouTube Course Tracker work?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "By simply importing a YouTube video or playlist, LearnProof AI tracks your progress, parses the content for intuition, and ensures you're mastering the material through AI-grounded assessments."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Are the certificates truly verifiable?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes. Every certificate issued by LearnProof AI comes with a unique Verification ID and a public link that can be shared on LinkedIn, resumes, or portfolios for employers to authenticate."
                                }
                            }
                        ]
                    })}
                </script>
            </section>

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
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                                    LearnProof
                                </h3>
                                <p className="text-gray-600 mt-2">The ultimate AI classroom for YouTube learners.</p>
                                <div className="flex space-x-6 mt-4">
                                    <a href="https://www.linkedin.com/company/learnproof-ai/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path></svg>
                                    </a>
                                    <a href="https://instagram.com/learnproofai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    </a>
                                    <a href="https://youtube.com/@learnproofai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors">
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
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <h4 className="font-bold text-gray-900 mb-2">Company</h4>
                                    <a href="/privacy" className="hover:text-orange-600 transition-colors">Privacy</a>
                                    <a href="/terms" className="hover:text-orange-600 transition-colors">Terms</a>
                                    <a href="mailto:hello@learnproofai.com" className="hover:text-orange-600 transition-colors">Support</a>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-orange-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                            <p>&copy; 2025 LearnProof AI. All rights reserved.</p>
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