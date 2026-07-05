import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, Shield, Youtube, Zap, Lightbulb, TrendingUp, Users, MessageSquare, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { requestNotificationPermissionAndGetToken } from '../../utils/fcm';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, loading } = useAuth();
    const [isAuthenticating, setIsAuthenticating] = useState(() => {
        const hash = window.location.hash;
        const hasHashToken = hash.includes("id_token") || hash.includes("credential");
        const wasAuthenticating = sessionStorage.getItem("is_authenticating") === "true";
        if (hasHashToken) {
            sessionStorage.setItem("is_authenticating", "true");
        }
        return hasHashToken || wasAuthenticating;
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
        // If already logged in, redirect to dashboard immediately
        if (!loading && user) {
            navigate("/dashboard");
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
        setIsAuthenticating(true);
        sessionStorage.setItem("is_authenticating", "true");
        try {
            await login({ credential: idToken });
            // Clean the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            toast.success("Welcome back to LearnProof AI!");
            
            // Request notification permission after login
            requestNotificationPermissionAndGetToken().catch(err => {
                console.error("Failed to setup notifications after login:", err);
            });
            
            sessionStorage.removeItem("is_authenticating");
            const redirectTo = sessionStorage.getItem("redirect_to") || "/dashboard";
            sessionStorage.removeItem("redirect_to");
            navigate(redirectTo);
        } catch (err) {
            console.error("Authentication error:", err);
            toast.error(err.message || "Failed to sign in. Please try again.");
            setIsAuthenticating(false);
            sessionStorage.removeItem("is_authenticating");
        }
    };

    const handleManualGoogleLogin = () => {
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

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        // MUST redirect to window.location.origin to match the authorized redirect URIs in Google Cloud Console
        const redirectUri = window.location.origin;
        const nonce = Math.random().toString(36).substring(2);
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=id_token` +
            `&scope=${encodeURIComponent('openid email profile')}` +
            `&nonce=${nonce}` +
            `&ux_mode=redirect`;
            
        window.location.href = authUrl;
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
        <div className="min-h-screen bg-orange-50 relative overflow-hidden flex flex-col justify-between p-4 selection:bg-orange-200 select-none">
            {/* Background Texture & Blobs */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[120px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[100px] opacity-40 z-0 pointer-events-none -translate-x-1/3" />

            {/* Spacer / Container to center card */}
            <div className="flex-1 flex items-center justify-center relative z-10 py-8">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md bg-white/75 backdrop-blur-xl border border-orange-200/80 rounded-[2.5rem] px-5 py-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(249,115,22,0.12)] flex flex-col items-center"
                >
                    {/* Brand Logo */}
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="h-40 sm:h-48 flex items-center justify-center -mt-2 -mb-2 cursor-pointer"
                    >
                        <img src="/LP_logo_login.png" alt="LearnProof" className="h-40 sm:h-48 w-auto object-contain" />
                    </motion.div>

                    <div className="text-center space-y-1 mb-3">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight uppercase">
                            Welcome
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            Sign in to your learning account
                        </p>
                    </div>

                    {/* Features Checklist inside a nice styled inner card */}
                    <div className="bg-orange-50/40 rounded-2xl px-3 sm:px-5 py-4 border border-orange-100/50 w-full space-y-3 mt-1 flex flex-col items-center">
                        <div className="space-y-3 w-full text-center">
                            {[
                                { text: "Social Learning & Real-Time Collaboration", icon: <Users className="w-4 h-4 text-indigo-500" /> },
                                { text: "AI-Powered YouTube Course Learning", icon: <Youtube className="w-4 h-4 text-red-500" /> },
                                { text: "Progress Tracking & Study Planner", icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
                                { text: "Interactive Speaking Rooms", icon: <MessageSquare className="w-4 h-4 text-emerald-500" /> },
                                { text: "Certificates & Achievements", icon: <Award className="w-4 h-4 text-orange-500" /> },
                                { text: "Smart Notes & AI Intuition", icon: <Lightbulb className="w-4 h-4 text-yellow-500" /> },
                                { text: "AI Quiz & Roadmaps", icon: <Zap className="w-4 h-4 text-amber-500" /> }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center justify-center gap-2">
                                    <div className="shrink-0 w-5 h-5 flex items-center justify-center">{feature.icon}</div>
                                    <span className="text-[11px] sm:text-xs text-gray-700 font-bold leading-tight whitespace-nowrap">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Secure Badge */}
                    <div className="mt-6 mb-5 flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-wider bg-orange-100/40 px-3.5 py-2 rounded-full border border-orange-200/50">
                        <Shield size={12} className="text-gray-500" />
                        <span>Secure Sign In</span>
                    </div>

                    {/* Login Button */}
                    <div className="w-full flex justify-center">
                        <motion.button 
                            whileHover={{ scale: 1.02, y: -0.5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleManualGoogleLogin}
                            className="flex items-center gap-2.5 px-4 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(249,115,22,0.15)] transition-all duration-300 transform border border-orange-100 font-bold text-gray-700 text-sm h-[40px] w-[230px] justify-center cursor-pointer"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4.5 h-4.5" />
                            <span className="whitespace-nowrap">Continue with Google</span>
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Public Footer */}
            <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-3 pb-6">
                <div className="flex justify-center items-center gap-6 text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <a href="/" className="hover:text-orange-600 transition-colors">Company</a>
                    <a href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</a>
                    <a href="/terms" className="hover:text-orange-600 transition-colors">Terms</a>
                    <a href="/support" className="hover:text-orange-600 transition-colors">Support</a>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    &copy; 2025 LearnProof AI. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
