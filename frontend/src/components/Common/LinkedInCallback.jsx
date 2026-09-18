import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { resolvePostAuthRedirect } from '../../utils/authRedirect';
import { requestNotificationPermissionAndGetToken } from '../../utils/fcm';

const LinkedInCallback = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [statusMessage, setStatusMessage] = useState("Connecting with LinkedIn...");

    useEffect(() => {
        let isCancelled = false;

        const processLinkedInAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            if (error) {
                console.warn('[LinkedIn Callback] Auth error or cancellation:', error, errorDescription);
                if (error !== 'user_cancelled_login' && error !== 'user_cancelled_authorize') {
                    toast.error(errorDescription || "LinkedIn login was cancelled.");
                }
                navigate('/login', { replace: true });
                return;
            }

            if (!code) {
                console.error('[LinkedIn Callback] No authorization code found in URL');
                toast.error("Missing authorization code from LinkedIn.");
                navigate('/login', { replace: true });
                return;
            }

            try {
                setStatusMessage("Securing your session with LinkedIn...");
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
                const redirectUri = `${window.location.origin}/auth/linkedin/callback`;

                const res = await axios.post(`${backendUrl}/api/auth/linkedin`, {
                    code,
                    redirectUri
                });

                if (isCancelled) return;

                if (res.data && res.data.token) {
                    // Log in via AuthContext
                    login({ credential: res.data.token });
                    toast.success("Welcome to LearnProof AI!");

                    // If user is brand new or college is empty, flag for student profile prompt
                    if (res.data.isNewUser) {
                        sessionStorage.setItem('prompt_student_profile', 'true');
                    }

                    const redirectTo = resolvePostAuthRedirect();
                    navigate(redirectTo, { replace: true });

                    // Background push notification setup
                    setTimeout(() => {
                        requestNotificationPermissionAndGetToken().catch(err => {
                            console.warn("Background notification setup:", err);
                        });
                    }, 2000);
                } else {
                    throw new Error("No authentication token received");
                }
            } catch (err) {
                console.error('[LinkedIn Callback] Processing failed:', err);
                if (!isCancelled) {
                    const errMsg = err.response?.data?.details || err.response?.data?.error || err.message || "Failed to sign in with LinkedIn.";
                    toast.error(errMsg);
                    navigate('/login', { replace: true });
                }
            }
        };

        processLinkedInAuth();

        return () => {
            isCancelled = true;
        };
    }, [login, navigate]);

    return (
        <div className="min-h-screen bg-orange-50 relative overflow-hidden flex flex-col items-center justify-center select-none">
            {/* Background Texture & Blobs */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[100px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[80px] opacity-40 z-0 pointer-events-none -translate-x-1/3" />

            <div className="relative z-10 flex flex-col items-center gap-6 bg-white/70 backdrop-blur-xl border border-orange-200/80 rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(249,115,22,0.06)] max-w-sm w-full mx-4 text-center">
                {/* Pulsing Logo */}
                <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="h-28 flex items-center justify-center"
                >
                    <img src="/LP_logo_login.png" alt="LearnProof" className="h-28 w-auto object-contain" />
                </motion.div>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-sm">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
                        </svg>
                        <span>LinkedIn Authentication</span>
                    </div>
                    <p className="text-xs text-gray-600 font-semibold">{statusMessage}</p>
                </div>

                {/* Spinner */}
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mt-1" />
            </div>
        </div>
    );
};

export default LinkedInCallback;
