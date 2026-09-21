import React, { useEffect, useState, useRef } from 'react';
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
    const hasProcessedRef = useRef(false);

    useEffect(() => {
        if (hasProcessedRef.current) return;
        hasProcessedRef.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const stateParam = urlParams.get('state') || '';
        // Native apps add '_native' suffix to state to detect the context
        const isNativeApp = stateParam.endsWith('_native');
        const isPopup = !isNativeApp && typeof window !== 'undefined' && (!!window.opener || window.name === 'LinkedInSignIn');

        // For native apps: redirect back to app via custom scheme
        const redirectToNativeApp = (token, isNewUser) => {
            const scheme = `learnproofai://auth/linkedin?token=${encodeURIComponent(token)}&isNewUser=${isNewUser ? '1' : '0'}`;
            window.location.href = scheme;
        };

        const redirectNativeError = (errMsg) => {
            window.location.href = `learnproofai://auth/linkedin?error=${encodeURIComponent(errMsg)}`;
        };
        const notifyOpenerAndClose = (data) => {
            // 1. Deliver via window.opener postMessage
            try {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(data, window.location.origin);
                }
            } catch (e) {
                console.warn('[LinkedIn Callback] postMessage failed:', e);
            }

            // 2. Deliver via BroadcastChannel (COOP-resilient fallback)
            try {
                const channel = new BroadcastChannel('linkedin_auth_channel');
                channel.postMessage(data);
                channel.close();
            } catch (e) {}

            // 3. Deliver via localStorage (storage event fallback)
            try {
                localStorage.setItem('linkedin_auth_result', JSON.stringify({ ...data, _ts: Date.now() }));
            } catch (e) {}

            // 4. Gracefully close the popup
            setTimeout(() => {
                try {
                    window.close();
                } catch (e) {}
            }, 250);
        };

        const processLinkedInAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            if (error) {
                console.warn('[LinkedIn Callback] Auth error or cancellation:', error, errorDescription);
                if (isNativeApp) {
                    setStatusMessage('Authentication cancelled. Returning to app...');
                    redirectNativeError(errorDescription || 'LinkedIn login was cancelled.');
                    return;
                }
                if (isPopup) {
                    setStatusMessage("Authentication cancelled. Closing...");
                    notifyOpenerAndClose({
                        type: 'LINKEDIN_AUTH_ERROR',
                        error: errorDescription || "LinkedIn login was cancelled."
                    });
                    return;
                }
                if (error !== 'user_cancelled_login' && error !== 'user_cancelled_authorize') {
                    toast.error(errorDescription || "LinkedIn login was cancelled.");
                }
                navigate('/login', { replace: true });
                return;
            }

            if (!code) {
                console.warn('[LinkedIn Callback] No authorization code found in URL');
                if (isNativeApp) {
                    redirectNativeError('No authorization code found.');
                    return;
                }
                if (isPopup) {
                    notifyOpenerAndClose({
                        type: 'LINKEDIN_AUTH_ERROR',
                        error: "No authorization code found in URL."
                    });
                    return;
                }
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

                if (res.data && res.data.token) {
                    if (isNativeApp) {
                        setStatusMessage('Authenticated! Returning to LearnProof AI...');
                        redirectToNativeApp(res.data.token, res.data.isNewUser);
                        return;
                    }

                    if (isPopup) {
                        setStatusMessage("Authenticated successfully! Returning to LearnProof AI...");
                        notifyOpenerAndClose({
                            type: 'LINKEDIN_AUTH_SUCCESS',
                            token: res.data.token,
                            isNewUser: res.data.isNewUser
                        });
                        return;
                    }

                    // Fallback for full page redirects
                    login({ credential: res.data.token });
                    toast.success("Welcome to LearnProof AI!");

                    if (res.data.isNewUser) {
                        sessionStorage.setItem('prompt_student_profile', 'true');
                    }

                    const redirectTo = resolvePostAuthRedirect();
                    navigate(redirectTo, { replace: true });

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
                const errMsg = err.response?.data?.details || err.response?.data?.error || err.message || "Failed to sign in with LinkedIn.";
                if (isNativeApp) {
                    setStatusMessage('Authentication failed. Returning to app...');
                    redirectNativeError(errMsg);
                    return;
                }
                if (isPopup) {
                    setStatusMessage("Authentication failed. Closing...");
                    notifyOpenerAndClose({
                        type: 'LINKEDIN_AUTH_ERROR',
                        error: errMsg
                    });
                    return;
                }
                toast.error(errMsg);
                navigate('/login', { replace: true });
            }
        };

        processLinkedInAuth();
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
