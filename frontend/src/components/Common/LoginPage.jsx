import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle, Shield, Youtube, Zap, Lightbulb, TrendingUp, Users, MessageSquare, Award, GraduationCap, Video, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { requestNotificationPermissionAndGetToken } from '../../utils/fcm';
import { resolvePostAuthRedirect, clearAuthRedirect } from '../../utils/authRedirect';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, loading } = useAuth();
    const [activeFeature, setActiveFeature] = useState(0);

    const SLIDES = [
        // Slide 0
        [
            {
                title: "Learn Smarter",
                desc: "AI YouTube tracking & summaries",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.524 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                ),
                bgClass: "bg-gradient-to-b from-[#fff6f2]/80 to-white dark:from-[#2e1d1a]/20 dark:to-gray-900 border border-[#feebe3] dark:border-[#3d2722]/40",
                lineColor: "bg-red-500"
            },
            {
                title: "Connect & Grow",
                desc: "Real-time peer collaboration",
                icon: <Users size={18} className="text-[#4f46e5]" />,
                bgClass: "bg-gradient-to-b from-[#f6f5ff]/80 to-white dark:from-[#1b1c30]/20 dark:to-gray-900 border border-[#e8e6ff] dark:border-[#252643]/40",
                lineColor: "bg-indigo-500"
            },
            {
                title: "Live Learning",
                desc: "Interactive speaking rooms",
                icon: <MessageSquare size={18} className="text-[#059669]" />,
                bgClass: "bg-gradient-to-b from-[#f2faf6]/80 to-white dark:from-[#152a22]/20 dark:to-gray-900 border border-[#e0f4ea] dark:border-[#1c3a2f]/40",
                lineColor: "bg-emerald-500"
            }
        ],
        // Slide 1
        [
            {
                title: "AI Intuition",
                desc: "Smart notes & concept maps",
                icon: <Lightbulb size={18} className="text-amber-500" />,
                bgClass: "bg-gradient-to-b from-[#fffaf0]/80 to-white dark:from-[#2e261a]/20 dark:to-gray-900 border border-[#fef0d5] dark:border-[#3e3423]/40",
                lineColor: "bg-amber-500"
            },
            {
                title: "Practice Arena",
                desc: "Automated quizzes & tests",
                icon: <Zap size={18} className="text-rose-500" />,
                bgClass: "bg-gradient-to-b from-[#fff5f6]/80 to-white dark:from-[#2e1b21]/20 dark:to-gray-900 border border-[#ffe3e6] dark:border-[#3e242c]/40",
                lineColor: "bg-rose-500"
            },
            {
                title: "Study Planner",
                desc: "Progress tracking & planner",
                icon: <TrendingUp size={18} className="text-sky-500" />,
                bgClass: "bg-gradient-to-b from-[#f2f9fe]/80 to-white dark:from-[#152535]/20 dark:to-gray-900 border border-[#e0f1fe] dark:border-[#1a3147]/40",
                lineColor: "bg-sky-500"
            }
        ],
        // Slide 2
        [
            {
                title: "Credentials",
                desc: "Verifiable PDF certificates",
                icon: <Award size={18} className="text-orange-500" />,
                bgClass: "bg-gradient-to-b from-[#fff6f2]/80 to-white dark:from-[#2e1d1a]/20 dark:to-gray-900 border border-[#feebe3] dark:border-[#3d2722]/40",
                lineColor: "bg-orange-500"
            },
            {
                title: "Gamification",
                desc: "Daily streaks & leaderboards",
                icon: <Trophy size={18} className="text-indigo-500" />,
                bgClass: "bg-gradient-to-b from-[#f6f5ff]/80 to-white dark:from-[#1b1c30]/20 dark:to-gray-900 border border-[#e8e6ff] dark:border-[#252643]/40",
                lineColor: "bg-indigo-500"
            },
            {
                title: "Auto Summaries",
                desc: "Auto PDF note extraction",
                icon: <FileText size={18} className="text-emerald-500" />,
                bgClass: "bg-gradient-to-b from-[#f2faf6]/80 to-white dark:from-[#152a22]/20 dark:to-gray-900 border border-[#e0f4ea] dark:border-[#1c3a2f]/40",
                lineColor: "bg-emerald-500"
            }
        ]
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const [isAuthenticating, setIsAuthenticating] = useState(() => {
        const hash = window.location.hash;
        const hasHashToken = hash.includes("id_token") || hash.includes("credential");
        if (hasHashToken) {
            sessionStorage.setItem("is_authenticating", "true");
            return true;
        }
        sessionStorage.removeItem("is_authenticating");
        return false;
    });

    useEffect(() => {
        // Expose native Google login callback for the Flutter wrapper
        window.handleNativeGoogleLogin = (idToken) => {
            console.log("Received native Google login token callback.");
            handleLoginFlow(idToken);
        };
        return () => {
            delete window.handleNativeGoogleLogin;
        };
    }, []);

    useEffect(() => {
        // If already logged in, redirect to destination immediately
        if (!loading && user) {
            navigate(resolvePostAuthRedirect(), { replace: true });
            return;
        }

        // Handle Google Redirect Fragment (hash)
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const idToken = params.get('id_token') || params.get('credential');
            if (idToken) {
                setIsAuthenticating(true);
                sessionStorage.setItem("is_authenticating", "true");
                handleLoginFlow(idToken);
            }
        }
    }, [user, loading, navigate]);

    const handleLoginFlow = async (idToken) => {
        try {
            // Instant optimistic login (< 1ms)
            login({ credential: idToken });
            
            // Clean the hash from URL immediately
            window.history.replaceState(null, '', window.location.pathname);
            toast.success("Welcome back to LearnProof AI!");
            
            sessionStorage.removeItem("is_authenticating");
            setIsAuthenticating(false);
            const redirectTo = resolvePostAuthRedirect();
            
            // Instant client-side navigation
            navigate(redirectTo, { replace: true });

            // Setup push notifications in background without blocking UI
            setTimeout(() => {
                requestNotificationPermissionAndGetToken().catch(err => {
                    console.warn("Background notifications setup:", err);
                });
            }, 2000);
        } catch (err) {
            console.error("Authentication error:", err);
            toast.error(err.message || "Failed to sign in. Please try again.");
            setIsAuthenticating(false);
            sessionStorage.removeItem("is_authenticating");
        }
    };

    const platform = (typeof window !== 'undefined' && window.Capacitor?.getPlatform?.()) || 'web';
    const isAndroid = platform === 'android';
    const isIOS = platform === 'ios';
    const isAppleDevice = typeof navigator !== 'undefined' && /Macintosh|iPhone|iPad|iPod/.test(navigator.userAgent);
    const showAppleLogin = isIOS || (!isAndroid && isAppleDevice);

    const handleManualGoogleLogin = async () => {
        // 1. Check if running in Capacitor Native app (Android or iOS)
        const isCapacitorNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

        if (isCapacitorNative) {
            setIsAuthenticating(true);
            sessionStorage.setItem("is_authenticating", "true");

            // Option A: On Android, use @codetrix-studio/capacitor-google-auth (GoogleAuth) registered natively in MainActivity.java
            if (platform === 'android') {
                try {
                    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                    await GoogleAuth.initialize({
                        clientId: '549492309059-crnp91q3v5ej09givjr6b10re7189ks9.apps.googleusercontent.com',
                        scopes: ['profile', 'email'],
                        grantOfflineAccess: true,
                    });
                    const googleUser = await GoogleAuth.signIn();
                    console.log("Capacitor GoogleAuth response on Android:", googleUser);
                    const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
                    if (idToken) {
                        await handleLoginFlow(idToken);
                        return;
                    }
                } catch (gAuthErr) {
                    console.warn("Android native GoogleAuth attempt failed:", gAuthErr);
                    const errStr = gAuthErr?.message || (typeof gAuthErr === 'object' ? JSON.stringify(gAuthErr) : String(gAuthErr));
                    if (errStr.includes('canceled') || errStr.includes('12501') || errStr.includes('CANCELED') || errStr.includes('USER_CANCELLED')) {
                        setIsAuthenticating(false);
                        sessionStorage.removeItem("is_authenticating");
                        return;
                    }
                    // If plugin is not implemented or failed, continue to fallback without alerting
                }
            }

            // Option B: Try @capgo/capacitor-social-login (registered for iOS SPM and newer builds)
            try {
                const { SocialLogin } = await import('@capgo/capacitor-social-login');
                await SocialLogin.initialize({
                    google: {
                        webClientId: '549492309059-crnp91q3v5ej09givjr6b10re7189ks9.apps.googleusercontent.com',
                        iOSClientId: '549492309059-6k98pip4c51rdsh69cls1s7ti2s8ci8n.apps.googleusercontent.com',
                        iOSServerClientId: '549492309059-crnp91q3v5ej09givjr6b10re7189ks9.apps.googleusercontent.com',
                        mode: 'online',
                    }
                });
                const res = await SocialLogin.login({
                    provider: 'google',
                    options: {
                        scopes: ['email', 'profile']
                    }
                });
                console.log("Capacitor SocialLogin Google response:", res);
                const idToken = res?.result?.idToken || res?.result?.accessToken?.token;
                if (idToken) {
                    await handleLoginFlow(idToken);
                    return;
                }
            } catch (socialErr) {
                console.warn("SocialLogin attempt failed/not implemented:", socialErr);
                const errStr = socialErr?.message || (typeof socialErr === 'object' ? JSON.stringify(socialErr) : String(socialErr));
                if (errStr.includes('canceled') || errStr.includes('12501') || errStr.includes('CANCELED') || errStr.includes('USER_CANCELLED')) {
                    setIsAuthenticating(false);
                    sessionStorage.removeItem("is_authenticating");
                    return;
                }
                // Do NOT show raw "plugin is not implemented" error toast!
            }

            // Option C: On iOS, try GoogleAuth if SocialLogin was not configured
            if (platform === 'ios') {
                try {
                    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                    await GoogleAuth.initialize({
                        clientId: '549492309059-6k98pip4c51rdsh69cls1s7ti2s8ci8n.apps.googleusercontent.com',
                        scopes: ['profile', 'email'],
                        grantOfflineAccess: true,
                    });
                    const googleUser = await GoogleAuth.signIn();
                    const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
                    if (idToken) {
                        await handleLoginFlow(idToken);
                        return;
                    }
                } catch (_) {}
            }
        }

        const isFlutter = navigator.userAgent.includes('LearnProofApp') || !!window.GoogleSignInChannel;
        
        if (isFlutter) {
            console.log("Triggering native Google Sign-In via channel...");
            if (window.GoogleSignInChannel) {
                window.GoogleSignInChannel.postMessage('signIn');
            } else {
                console.error("GoogleSignInChannel not found in window object.");
                toast.error("Google Sign-In is unavailable in this app version.");
            }
            return;
        }

        // Web (Desktop & Mobile Browser) & Universal Webview Fallback — Immediate zero-delay redirect
        setIsAuthenticating(true);
        sessionStorage.setItem("is_authenticating", "true");
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '549492309059-crnp91q3v5ej09givjr6b10re7189ks9.apps.googleusercontent.com';
        const redirectUri = window.location.origin;
        const nonce = Math.random().toString(36).substring(2);
        const redirectTo = resolvePostAuthRedirect();
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=id_token` +
            `&scope=${encodeURIComponent('openid email profile')}` +
            `&state=${encodeURIComponent(redirectTo)}` +
            `&nonce=${nonce}` +
            `&ux_mode=redirect` +
            `&prompt=select_account`;
            
        window.location.assign(authUrl);
    };

    const handleManualAppleLogin = async () => {
        try {
            setIsAuthenticating(true);
            sessionStorage.setItem("is_authenticating", "true");

            const isCapacitorNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

            let appleResponse = null;
            if (isCapacitorNative) {
                const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
                appleResponse = await SignInWithApple.authorize({
                    clientId: 'com.learnproof.learnProofTwa',
                    redirectURI: 'https://learnproofai.com',
                    scopes: 'email name',
                });
            } else {
                // If on web browser, attempt to import or prompt iOS app usage
                try {
                    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
                    appleResponse = await SignInWithApple.authorize({
                        clientId: 'com.learnproof.learnProofTwa',
                        redirectURI: 'https://learnproofai.com',
                        scopes: 'email name',
                    });
                } catch (webErr) {
                    setIsAuthenticating(false);
                    sessionStorage.removeItem("is_authenticating");
                    toast("Sign in with Apple is designed for the iOS mobile app. On desktop, please continue with Google or Demo.", { icon: '🍎' });
                    return;
                }
            }

            if (appleResponse && appleResponse.response?.identityToken) {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
                const res = await axios.post(`${backendUrl}/api/auth/apple`, {
                    identityToken: appleResponse.response.identityToken,
                    authorizationCode: appleResponse.response.authorizationCode,
                    fullName: appleResponse.response.givenName || appleResponse.response.familyName ? {
                        givenName: appleResponse.response.givenName,
                        familyName: appleResponse.response.familyName
                    } : null,
                    email: appleResponse.response.email,
                    user: appleResponse.response.user
                });

                if (res.data && res.data.token) {
                    login({ credential: res.data.token });
                    toast.success("Welcome to LearnProof AI!");
                    setIsAuthenticating(false);
                    sessionStorage.removeItem("is_authenticating");
                    navigate(resolvePostAuthRedirect(), { replace: true });
                    return;
                }
            }

            setIsAuthenticating(false);
            sessionStorage.removeItem("is_authenticating");
        } catch (err) {
            console.error("Apple Sign-In error:", err);
            setIsAuthenticating(false);
            sessionStorage.removeItem("is_authenticating");
            const errStr = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            if (errStr.includes('canceled') || errStr.includes('1001') || errStr.includes('CANCELED')) {
                return;
            }
            if (errStr.includes('1000')) {
                toast.error("Apple Sign-In capability requires a paid Apple Developer Program account on iOS. Please use Google Login or Demo Access.");
                return;
            }
            toast.error(err.message || "Apple Sign-In failed.");
        }
    };

    const handleReviewerDemoLogin = async () => {
        try {
            setIsAuthenticating(true);
            sessionStorage.setItem("is_authenticating", "true");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
            const res = await axios.post(`${backendUrl}/api/auth/demo-login`);
            if (res.data && res.data.token) {
                login({ credential: res.data.token });
                toast.success("Welcome, App Store Reviewer!");
                setIsAuthenticating(false);
                sessionStorage.removeItem("is_authenticating");
                navigate(resolvePostAuthRedirect(), { replace: true });
            }
        } catch (e) {
            setIsAuthenticating(false);
            sessionStorage.removeItem("is_authenticating");
            toast.error("Reviewer demo login unavailable.");
        }
    };

    const handleManualLinkedInLogin = () => {
        setIsAuthenticating(true);
        sessionStorage.setItem("is_authenticating", "true");
        const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '77qo9i0sx1sbav';
        const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
        const state = Math.random().toString(36).substring(2);
        sessionStorage.setItem("linkedin_oauth_state", state);
        const redirectTo = resolvePostAuthRedirect();
        sessionStorage.setItem("redirect_to", redirectTo);

        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
            `response_type=code` +
            `&client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}` +
            `&scope=${encodeURIComponent('openid profile email')}`;

        window.location.assign(authUrl);
    };

    if (loading || isAuthenticating) {
        return (
            <div className="min-h-screen bg-orange-50 relative overflow-hidden flex flex-col items-center justify-center select-none">
                {/* Background Texture & Blobs */}
                <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[100px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[80px] opacity-40 z-0 pointer-events-none -translate-x-1/3" />

                <div className="relative z-10 flex flex-col items-center gap-6 bg-white/70 backdrop-blur-xl border border-orange-200/80 rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(249,115,22,0.06)] max-w-sm w-full mx-4">
                    {/* Pulsing Logo */}
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="h-32 sm:h-40 flex items-center justify-center"
                    >
                        <img src="/LP_logo_login.png" alt="LearnProof" className="h-32 sm:h-40 w-auto object-contain" />
                    </motion.div>
                    <div className="text-center space-y-1.5">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">LearnProof AI</h2>
                        <p className="text-xs text-gray-500 font-semibold">Securing your session, please wait...</p>
                    </div>
                    {/* Spinner */}
                    <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mt-2" />
                </div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="h-[100dvh] bg-gradient-to-br from-[#fff7f4] via-[#ffffff] to-[#fffbf9] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 selection:bg-orange-200 select-none">
            
            {/* Mesh dot grid background overlay matching mockup */}
            <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f97316 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
            
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[-20%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-br from-orange-200/40 via-rose-100/20 to-transparent rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-[90px]" />
            </div>
 
            {/* Main Centered Box Container Wrapper */}
            <div className="flex-1 flex items-center justify-center relative z-10 py-4 sm:py-10 w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-orange-100/70 dark:border-gray-800 rounded-[2.5rem] px-5 py-5 sm:p-8 shadow-[0_20px_50px_rgba(249,115,22,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center space-y-5 sm:space-y-6 relative"
                >
                    {/* Logo & Headline Swoop Lines */}
                    <div className="relative w-full flex flex-col items-center text-center">
                        {/* SVG Swoop Connector Lines from screenshot */}
                        <svg className="absolute top-2 left-1/2 -translate-x-1/2 w-[240px] h-[100px] pointer-events-none opacity-50 z-0" viewBox="0 0 240 100" fill="none">
                            <path d="M 30 80 Q 100 40 210 16" stroke="url(#orange-grad)" strokeWidth="1" strokeDasharray="3 3" />
                            <circle cx="30" cy="80" r="3" fill="#f97316" className="animate-pulse" />
                            <defs>
                                <linearGradient id="orange-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#ffedd5" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div className="relative z-10 flex items-center justify-center w-full">
                            {/* Main Shield Logo */}
                            <div className="relative">
                                <img src="/LP_logo_login.png" alt="LearnProof Logo" className="h-28 w-auto object-contain" />
                            </div>
                            
                            {/* Connected Floating Graduation Cap Icon */}
                            <div className="absolute top-0 right-8 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <GraduationCap size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Welcome message */}
                    <div className="text-center space-y-1.5 z-10 w-full">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-none">
                            Welcome 👋
                        </h2>
                        <p className="text-xs text-slate-455 mt-1 font-semibold dark:text-slate-400">
                            Sign in to continue your learning journey
                        </p>
                    </div>

                    {/* Swipeable Feature Carousel Card widget */}
                    <div className="w-full relative overflow-hidden h-[140px] flex items-center justify-center z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.5}
                                onDragEnd={(e, { offset }) => {
                                    const swipeThreshold = 50;
                                    if (offset.x < -swipeThreshold) {
                                        // Swipe Left -> next
                                        setActiveFeature((prev) => (prev + 1) % SLIDES.length);
                                    } else if (offset.x > swipeThreshold) {
                                        // Swipe Right -> previous
                                        setActiveFeature((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
                                    }
                                }}
                                className="flex flex-row gap-2 w-full justify-between items-stretch select-none h-full"
                            >
                                {SLIDES[activeFeature].map((item, idx) => (
                                    <div 
                                        key={idx}
                                        className={`flex-1 flex flex-col items-center text-center p-3 pt-4 pb-4 ${item.bgClass} rounded-[1.25rem] shadow-[0_4px_25px_rgba(0,0,0,0.015)] relative overflow-hidden transition-all duration-300 h-full min-w-0 font-sans`}
                                    >
                                        {/* White rounded square icon bubble matching screenshot */}
                                        <div className="w-11 h-11 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3 shrink-0 shadow-[0_6px_16px_rgba(0,0,0,0.02)] border border-slate-100/35 dark:border-gray-700">
                                            {item.icon}
                                        </div>
                                        <h4 className="text-[10px] font-bold text-[#0f172a] dark:text-white tracking-tight leading-none text-center truncate w-full px-1 font-sans">
                                            {item.title}
                                        </h4>
                                        <p className="text-[8px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-tight flex-1 text-center font-sans mt-1 px-0.5">
                                            {item.desc}
                                        </p>
                                        <div className={`absolute bottom-2.5 w-5 h-[2px] ${item.lineColor} opacity-90 rounded-full`} />
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Pagination Dots Indicator */}
                    <div className="flex justify-center items-center gap-2 shrink-0 select-none z-10">
                        {SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveFeature(idx)}
                                className={`transition-all duration-300 cursor-pointer ${
                                    idx === activeFeature 
                                        ? 'w-4 h-1.5 rounded-full bg-orange-500 shadow-sm' 
                                        : 'w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-gray-800'
                            }`}
                                title={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Secure badge block */}
                    <div className="flex items-center gap-1.5 text-[9px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider bg-orange-500/5 px-4 py-1.5 rounded-full border border-orange-500/10 z-10">
                        <Shield size={10} className="text-orange-500 animate-pulse" />
                        <span>Secure • Private • Trusted</span>
                    </div>

                    {/* Auth Login Action Button */}
                    <div className="w-full space-y-3 z-10">
                        {/* Continue with Google */}
                        <motion.button 
                            whileHover={{ scale: 1.01, y: -0.5 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleManualGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300 font-bold text-gray-700 dark:text-gray-200 text-xs h-12 cursor-pointer border-slate-200/80"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4.5 h-4.5 shrink-0" />
                            <span>Continue with Google</span>
                        </motion.button>

                        {/* Sign in with Apple (Mandatory for App Store Guideline 4.8 on iOS) */}
                        {showAppleLogin && (
                            <motion.button 
                                whileHover={{ scale: 1.01, y: -0.5 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleManualAppleLogin}
                                className="w-full flex items-center justify-center gap-2.5 px-6 bg-black text-white hover:bg-zinc-900 border border-black rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.15)] transition-all duration-300 font-bold text-xs h-12 cursor-pointer"
                            >
                                <svg className="w-4 h-4 fill-current mb-0.5 shrink-0" viewBox="0 0 170 170">
                                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.31-5.77-8.8-10.34-18.73-13.72-29.79-3.37-11.06-5.06-21.84-5.06-32.34 0-14.35 3.59-26.06 10.77-35.12 7.18-9.06 16.2-13.67 27.06-13.84 4.58 0 9.77 1.25 15.57 3.75 5.8 2.5 9.78 3.84 11.96 4.02 1.96-.28 5.99-1.68 12.09-4.22 6.1-2.54 11.39-3.71 15.86-3.51 11.85.62 21.6 4.87 29.25 12.75-10.45 6.32-15.58 14.99-15.38 26.01.2 8.78 3.59 16.27 10.18 22.47 6.59 6.2 14.54 9.68 23.85 10.45-2.07 6.1-4.68 12.51-7.83 19.23zM119.22 31.84c0-7.39 2.65-14.18 7.95-20.37 5.3-6.19 11.75-9.97 19.35-11.34.2 1.34.3 2.55.3 3.63 0 7.39-2.65 14.18-7.95 20.37-5.3 6.19-11.75 9.97-19.35 11.34-.2-1.34-.3-2.55-.3-3.63z"/>
                                </svg>
                                <span>Continue with Apple</span>
                            </motion.button>
                        )}

                        {/* Continue with LinkedIn */}
                        <motion.button 
                            whileHover={{ scale: 1.01, y: -0.5 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleManualLinkedInLogin}
                            className="w-full flex items-center justify-center gap-2.5 px-6 bg-[#0A66C2] text-white hover:bg-[#004182] border border-[#0A66C2] rounded-2xl shadow-[0_4px_25px_rgba(10,102,194,0.12)] transition-all duration-300 font-bold text-xs h-12 cursor-pointer"
                        >
                            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
                            </svg>
                            <span>Continue with LinkedIn</span>
                        </motion.button>

                        {/* Terms of Service agreement text */}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center leading-normal px-2 pt-0.5">
                            By continuing, you agree to our{' '}
                            <a href="/terms" className="text-orange-500 hover:underline font-semibold">Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy-policy" className="text-orange-500 hover:underline font-semibold">Privacy Policy</a>
                        </p>

                        {/* App Store Reviewer Demo Login Shortcut */}
                        <div className="text-center pt-1">
                            <button
                                type="button"
                                onClick={handleReviewerDemoLogin}
                                className="text-[10px] text-slate-400 hover:text-orange-500 underline transition-colors cursor-pointer"
                            >
                                App Store Reviewer Demo Access
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Branding Footer */}
            <div className="relative z-10 w-full max-w-md mx-auto text-center pb-2 shrink-0 pt-6">
                <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
                    &copy; 2026 LEARNPROOF AI. ALL RIGHTS RESERVED.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
