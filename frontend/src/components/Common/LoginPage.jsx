import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, 
    Users, 
    MessageSquare, 
    Award, 
    GraduationCap, 
    Lightbulb, 
    Zap, 
    TrendingUp, 
    FileText, 
    ArrowRight, 
    ArrowLeft,
    Mail, 
    Shield, 
    KeyRound,
    X, 
    Loader2, 
    Check, 
    Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { requestNotificationPermissionAndGetToken, updateAppBadge } from '../../utils/fcm';
import { resolvePostAuthRedirect, clearAuthRedirect } from '../../utils/authRedirect';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, loading } = useAuth();
    const [activeFeature, setActiveFeature] = useState(0);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailStep, setEmailStep] = useState('input'); // 'input' | 'otp'
    const [emailInput, setEmailInput] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [reviewerLoading, setReviewerLoading] = useState(false);
    const [devOtpHint, setDevOtpHint] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);

    // Resend countdown timer
    useEffect(() => {
        let timer;
        if (resendCountdown > 0) {
            timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    // ── Carousel Slides (Exact Copy & Aesthetics from Design) ──
    const SLIDES = [
        // Slide 0
        [
            {
                title: "Learn Smarter",
                desc: "AI summaries & key insights",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.524 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                ),
                cardBg: "bg-red-50/70 border-red-100/90 text-red-600",
                iconBg: "bg-red-100/60"
            },
            {
                title: "Connect & Grow",
                desc: "Real-time peer collaboration",
                icon: <Users size={20} className="text-[#6366f1]" />,
                cardBg: "bg-indigo-50/70 border-indigo-100/90 text-indigo-600",
                iconBg: "bg-indigo-100/60"
            },
            {
                title: "Live Learning",
                desc: "Interactive speaking rooms",
                icon: <MessageSquare size={20} className="text-[#10b981]" />,
                cardBg: "bg-emerald-50/70 border-emerald-100/90 text-emerald-600",
                iconBg: "bg-emerald-100/60"
            }
        ],
        // Slide 1
        [
            {
                title: "AI Intuition",
                desc: "Smart notes & concept maps",
                icon: <Lightbulb size={20} className="text-amber-500" />,
                cardBg: "bg-amber-50/70 border-amber-100/90 text-amber-600",
                iconBg: "bg-amber-100/60"
            },
            {
                title: "Practice Arena",
                desc: "Automated quizzes & tests",
                icon: <Zap size={20} className="text-rose-500" />,
                cardBg: "bg-rose-50/70 border-rose-100/90 text-rose-600",
                iconBg: "bg-rose-100/60"
            },
            {
                title: "Study Planner",
                desc: "Daily goals & progress tracking",
                icon: <TrendingUp size={20} className="text-sky-500" />,
                cardBg: "bg-sky-50/70 border-sky-100/90 text-sky-600",
                iconBg: "bg-sky-100/60"
            }
        ],
        // Slide 2
        [
            {
                title: "Credentials",
                desc: "Verifiable PDF certificates",
                icon: <Award size={20} className="text-orange-500" />,
                cardBg: "bg-orange-50/70 border-orange-100/90 text-orange-600",
                iconBg: "bg-orange-100/60"
            },
            {
                title: "Gamification",
                desc: "Daily streaks & leaderboards",
                icon: <Trophy size={20} className="text-indigo-500" />,
                cardBg: "bg-indigo-50/70 border-indigo-100/90 text-indigo-600",
                iconBg: "bg-indigo-100/60"
            },
            {
                title: "Ask My Notes",
                desc: "Chat with PDFs & lectures",
                icon: <FileText size={20} className="text-emerald-500" />,
                cardBg: "bg-emerald-50/70 border-emerald-100/90 text-emerald-600",
                iconBg: "bg-emerald-100/60"
            }
        ]
    ];

    // Auto rotate slides every 5.5s
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % SLIDES.length);
        }, 5500);
        return () => clearInterval(interval);
    }, [SLIDES.length]);

    const [isAuthenticating, setIsAuthenticating] = useState(() => {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const hasHashToken = hash.includes("id_token") || hash.includes("credential");
        const hasSearchToken = search.includes("code=") || search.includes("token=");
        if (hasHashToken || hasSearchToken) {
            sessionStorage.setItem("is_authenticating", "true");
            return true;
        }
        sessionStorage.removeItem("is_authenticating");
        return false;
    });
    const [authStatusMessage, setAuthStatusMessage] = useState("Securing your session, please wait...");

    // Watchdog and Back-Forward Cache (bfcache) / Tab Return Listener to prevent infinite loading
    useEffect(() => {
        const checkAndResetAuth = () => {
            const hash = window.location.hash || '';
            const search = window.location.search || '';
            const hasHashToken = hash.includes("id_token") || hash.includes("credential");
            const hasSearchToken = search.includes("code=") || search.includes("token=");

            if (!hasHashToken && !hasSearchToken) {
                setIsAuthenticating(false);
                sessionStorage.removeItem("is_authenticating");
                sessionStorage.removeItem("linkedin_oauth_state");
            }
        };

        // 1. Check immediately on mount or route navigation back to /login
        checkAndResetAuth();

        // 2. bfcache recovery when browser Back / Forward is clicked
        const handlePageShow = () => {
            checkAndResetAuth();
        };

        // 3. Tab visibility / Window focus recovery (when returning to tab)
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                checkAndResetAuth();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, [location.pathname, location.search]);

    // Safety watchdog: Never allow isAuthenticating to lock the page for more than 8 seconds without URL tokens
    useEffect(() => {
        let timer;
        if (isAuthenticating) {
            timer = setTimeout(() => {
                const hash = window.location.hash || '';
                const search = window.location.search || '';
                const hasHashToken = hash.includes("id_token") || hash.includes("credential");
                const hasSearchToken = search.includes("code=") || search.includes("token=");
                if (!hasHashToken && !hasSearchToken) {
                    console.warn("[LoginPage] Watchdog releasing authenticating lock");
                    setIsAuthenticating(false);
                    sessionStorage.removeItem("is_authenticating");
                }
            }, 8000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isAuthenticating]);

    useEffect(() => {
        // Expose native Google login callback for mobile wrappers
        window.handleNativeGoogleLogin = (idToken) => {
            console.log("Received native Google login token callback.");
            handleLoginFlow(idToken);
        };
        return () => {
            delete window.handleNativeGoogleLogin;
        };
    }, []);

    useEffect(() => {
        // Preload Apple Web SDK to avoid Safari popup blocker on click
        if (typeof window !== 'undefined' && !window.AppleID) {
            const script = document.createElement('script');
            script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
            script.async = true;
            document.head.appendChild(script);
        }

        // Clear any stuck badge on device icon when on login screen
        updateAppBadge(0);
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
            login({ credential: idToken });
            window.history.replaceState(null, '', window.location.pathname);
            toast.success("Welcome to LearnProof AI!");
            
            sessionStorage.removeItem("is_authenticating");
            setIsAuthenticating(false);
            const redirectTo = resolvePostAuthRedirect();
            navigate(redirectTo, { replace: true });

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

    // ── Google Login Handler ──
    const handleManualGoogleLogin = async () => {
        const isCapacitorNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

        if (isCapacitorNative) {
            setIsAuthenticating(true);
            sessionStorage.setItem("is_authenticating", "true");

            if (platform === 'android') {
                try {
                    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                    await GoogleAuth.initialize({
                        clientId: '549492309059-crnp91q3v5ej09givjr6b10re7189ks9.apps.googleusercontent.com',
                        scopes: ['profile', 'email'],
                        grantOfflineAccess: true,
                    });
                    const googleUser = await GoogleAuth.signIn();
                    const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
                    if (idToken) {
                        await handleLoginFlow(idToken);
                        return;
                    }
                } catch (gAuthErr) {
                    console.warn("Android native GoogleAuth attempt failed:", gAuthErr);
                }
            }

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
                    options: { scopes: ['email', 'profile'] }
                });
                const idToken = res?.result?.idToken || res?.result?.accessToken?.token;
                if (idToken) {
                    await handleLoginFlow(idToken);
                    return;
                }
            } catch (socialErr) {
                console.warn("SocialLogin attempt failed:", socialErr);
            }
        }

        const isFlutter = navigator.userAgent.includes('LearnProofApp') || !!window.GoogleSignInChannel;
        if (isFlutter && window.GoogleSignInChannel) {
            window.GoogleSignInChannel.postMessage('signIn');
            return;
        }

        // Web OAuth Redirect
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

    // ── Apple Login Handler ──
    const handleManualAppleLogin = async () => {
        const isAppleCancelOrIgnored = (err) => {
            if (!err) return true;
            let str = '';
            try {
                str = (typeof err === 'object' ? JSON.stringify(err) : String(err)) + ' ' + (err?.error || '') + ' ' + (err?.message || '');
            } catch (_) {
                str = String(err);
            }
            const lower = str.toLowerCase();
            return (
                lower.includes('popup_closed') ||
                lower.includes('closed_by_user') ||
                lower.includes('user_cancelled') ||
                lower.includes('user_canceled') ||
                lower.includes('canceled') ||
                lower.includes('cancelled') ||
                lower.includes('popup_blocked') ||
                lower.includes('1001') ||
                lower.includes('dismissed') ||
                lower.includes('abort')
            );
        };

        try {
            setIsAuthenticating(true);
            sessionStorage.setItem("is_authenticating", "true");

            const isCapacitorNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

            let appleResponse = null;
            if (isCapacitorNative) {
                const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
                const nativeBundleId = import.meta.env.VITE_APPLE_NATIVE_CLIENT_ID || 'com.learnproof.learnProof';
                appleResponse = await SignInWithApple.authorize({
                    clientId: nativeBundleId,
                    redirectURI: 'https://learnproofai.com',
                    scopes: 'email name',
                });
            } else {
                const appleWebServicesId = import.meta.env.VITE_APPLE_CLIENT_ID || 'com.learnproof.web';

                if (typeof window !== 'undefined' && window.AppleID?.auth) {
                    window.AppleID.auth.init({
                        clientId: appleWebServicesId,
                        scope: 'name email',
                        redirectURI: 'https://learnproofai.com',
                        usePopup: true
                    });
                    const res = await window.AppleID.auth.signIn();
                    appleResponse = {
                        response: {
                            user: null,
                            email: res?.user?.email,
                            givenName: res?.user?.name?.firstName,
                            familyName: res?.user?.name?.lastName,
                            identityToken: res?.authorization?.id_token,
                            authorizationCode: res?.authorization?.code
                        }
                    };
                } else {
                    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
                    appleResponse = await SignInWithApple.authorize({
                        clientId: appleWebServicesId,
                        redirectURI: 'https://learnproofai.com',
                        scopes: 'email name',
                    });
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
            setIsAuthenticating(false);
            sessionStorage.removeItem("is_authenticating");

            if (isAppleCancelOrIgnored(err)) {
                // User intentionally cancelled, closed the popup, or popup was closed - do not show any error!
                return;
            }

            console.error("Apple Sign-In error:", err);
            toast.error(err?.message || "Sign in with Apple failed. Please try again.");
        }
    };

    // ── LinkedIn Login Handler ──
    const handleManualLinkedInLogin = async () => {
        setIsAuthenticating(true);
        setAuthStatusMessage("Connecting with LinkedIn...");
        sessionStorage.setItem("is_authenticating", "true");

        const isCapacitorNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

        if (isCapacitorNative) {
            try {
                const { Browser } = await import('@capacitor/browser');
                const { App } = await import('@capacitor/app');
                const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '77qo9l0sx1sbav';
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
                const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
                const redirectUri = `${backendUrl}/api/auth/linkedin/callback`;

                const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
                    `response_type=code` +
                    `&client_id=${clientId}` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&state=${sessionId}` +
                    `&scope=${encodeURIComponent('openid profile email')}`;

                let isHandled = false;
                let pollInterval = null;
                let browserFinishedSub = null;
                let appUrlOpenSub = null;

                const cleanupListeners = () => {
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                    if (browserFinishedSub) {
                        try { browserFinishedSub.remove(); } catch (_) {}
                        browserFinishedSub = null;
                    }
                    if (appUrlOpenSub) {
                        try { appUrlOpenSub.remove(); } catch (_) {}
                        appUrlOpenSub = null;
                    }
                };

                const completeLogin = async (token, isNewUser) => {
                    if (isHandled) return;
                    isHandled = true;
                    cleanupListeners();
                    try {
                        await Browser.close();
                    } catch (_) {}
                    if (isNewUser) {
                        sessionStorage.setItem('prompt_student_profile', 'true');
                    }
                    handleLoginFlow(token);
                };

                // 1. Deep link listener: if learnproofai://auth/linkedin opens app
                try {
                    appUrlOpenSub = await App.addListener('appUrlOpen', (event) => {
                        const urlStr = event?.url || '';
                        if (urlStr.includes('auth/linkedin')) {
                            try {
                                const parsed = new URL(urlStr.replace('learnproofai://', 'https://learnproofai.com/'));
                                const token = parsed.searchParams.get('token');
                                const isNewUser = parsed.searchParams.get('isNewUser') === '1';
                                const error = parsed.searchParams.get('error');
                                if (token) {
                                    completeLogin(token, isNewUser);
                                } else if (error) {
                                    if (isHandled) return;
                                    isHandled = true;
                                    cleanupListeners();
                                    Browser.close().catch(() => {});
                                    setIsAuthenticating(false);
                                    sessionStorage.removeItem('is_authenticating');
                                    toast.error(error);
                                }
                            } catch (_) {}
                        }
                    });
                } catch (_) {}

                // 2. Browser finished listener: if user taps the top-left (X) button on sheet
                try {
                    browserFinishedSub = await Browser.addListener('browserFinished', async () => {
                        setTimeout(async () => {
                            if (isHandled) return;
                            // Check one final time before giving up
                            try {
                                const res = await axios.get(`${backendUrl}/api/auth/linkedin/session/${sessionId}`, { timeout: 3000 });
                                if (res.data?.token) {
                                    completeLogin(res.data.token, res.data.isNewUser);
                                    return;
                                }
                            } catch (_) {}
                            cleanupListeners();
                            setIsAuthenticating(false);
                            sessionStorage.removeItem('is_authenticating');
                        }, 400);
                    });
                } catch (_) {}

                // 3. Active session polling: checks Redis backend every 1.2s
                let pollAttempts = 0;
                pollInterval = setInterval(async () => {
                    pollAttempts++;
                    if (pollAttempts > 75 || isHandled) { // ~90s max
                        cleanupListeners();
                        if (!isHandled) {
                            setIsAuthenticating(false);
                            sessionStorage.removeItem('is_authenticating');
                        }
                        return;
                    }
                    try {
                        const res = await axios.get(`${backendUrl}/api/auth/linkedin/session/${sessionId}`, { timeout: 3500 });
                        if (res.data?.token) {
                            completeLogin(res.data.token, res.data.isNewUser);
                        } else if (res.data?.error) {
                            if (isHandled) return;
                            isHandled = true;
                            cleanupListeners();
                            Browser.close().catch(() => {});
                            setIsAuthenticating(false);
                            sessionStorage.removeItem('is_authenticating');
                            toast.error(res.data.error || 'LinkedIn login failed');
                        }
                    } catch (_) {
                        // ignore network blips and keep polling
                    }
                }, 1200);

                await Browser.open({ url: authUrl, presentationStyle: 'popover' });
                return;
            } catch (err) {
                console.error('[LinkedIn Capacitor] Failed to launch in-app browser:', err);
                setIsAuthenticating(false);
                sessionStorage.removeItem('is_authenticating');
                return;
            }
        }

        const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '77qo9l0sx1sbav';
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

        // Attempt popup first on desktop web for modern, seamless in-page experience
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) {
            const width = 600;
            const height = 680;
            const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
            const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

            try {
                const popup = window.open(
                    authUrl,
                    'LinkedInSignIn',
                    `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
                );

                if (popup && !popup.closed && typeof popup.closed !== 'undefined') {
                    popup.focus();

                    let cleanup = null;

                    const handleAuthSuccess = (token, isNewUser) => {
                        if (cleanup) cleanup();
                        if (isNewUser) {
                            sessionStorage.setItem('prompt_student_profile', 'true');
                        }
                        handleLoginFlow(token);
                    };

                    const handleAuthError = (errMsg) => {
                        if (cleanup) cleanup();
                        setIsAuthenticating(false);
                        sessionStorage.removeItem('is_authenticating');
                        sessionStorage.removeItem('linkedin_oauth_state');
                        if (errMsg && !errMsg.toLowerCase().includes('cancel')) {
                            toast.error(errMsg);
                        }
                    };

                    // 1. BroadcastChannel listener (COOP resilient)
                    let channel = null;
                    try {
                        channel = new BroadcastChannel('linkedin_auth_channel');
                        channel.onmessage = (event) => {
                            const data = event.data;
                            if (data?.type === 'LINKEDIN_AUTH_SUCCESS' && data.token) {
                                handleAuthSuccess(data.token, data.isNewUser);
                            } else if (data?.type === 'LINKEDIN_AUTH_ERROR') {
                                handleAuthError(data.error);
                            }
                        };
                    } catch (_) {}

                    // 2. window.opener postMessage listener
                    const onMessage = (event) => {
                        if (event.origin !== window.location.origin) return;
                        const data = event.data;
                        if (data?.type === 'LINKEDIN_AUTH_SUCCESS' && data.token) {
                            handleAuthSuccess(data.token, data.isNewUser);
                        } else if (data?.type === 'LINKEDIN_AUTH_ERROR') {
                            handleAuthError(data.error);
                        }
                    };
                    window.addEventListener('message', onMessage);

                    // 3. localStorage listener (storage fallback)
                    const onStorage = (event) => {
                        if (event.key === 'linkedin_auth_result' && event.newValue) {
                            try {
                                const data = JSON.parse(event.newValue);
                                localStorage.removeItem('linkedin_auth_result');
                                if (data?.type === 'LINKEDIN_AUTH_SUCCESS' && data.token) {
                                    handleAuthSuccess(data.token, data.isNewUser);
                                } else if (data?.type === 'LINKEDIN_AUTH_ERROR') {
                                    handleAuthError(data.error);
                                }
                            } catch (_) {}
                        }
                    };
                    window.addEventListener('storage', onStorage);

                    // 4. Poll for popup closure (e.g. user manually closes popup window)
                    const pollInterval = setInterval(() => {
                        if (popup.closed) {
                            clearInterval(pollInterval);
                            setTimeout(() => {
                                if (cleanup) cleanup();
                                setIsAuthenticating(false);
                                sessionStorage.removeItem('is_authenticating');
                                sessionStorage.removeItem('linkedin_oauth_state');
                            }, 400);
                        }
                    }, 350);

                    cleanup = () => {
                        if (channel) {
                            try { channel.close(); } catch (_) {}
                        }
                        window.removeEventListener('message', onMessage);
                        window.removeEventListener('storage', onStorage);
                        clearInterval(pollInterval);
                    };

                    return;
                }
            } catch (err) {
                console.warn('[LinkedIn Login] Popup failed, falling back to full-page redirect:', err);
            }
        }

        // Fallback for mobile browsers or if popup is blocked
        window.location.assign(authUrl);
    };

    // ── Resilient Auth API caller with instant localhost priority ──
    const callAuthEndpoint = async (method, path, data = {}) => {
        const isLocal = typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        const localBase = 'http://localhost:8000';
        const remoteBase = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';

        // When running in local development, prioritize local backend on port 8000
        const primary = isLocal ? localBase : remoteBase;
        const fallback = isLocal ? remoteBase : localBase;

        try {
            return await axios({
                method,
                url: `${primary}${path}`,
                data,
                timeout: 5000
            });
        } catch (firstErr) {
            console.warn(`[Auth API] Primary ${primary}${path} failed:`, firstErr.message);
            try {
                return await axios({
                    method,
                    url: `${fallback}${path}`,
                    data,
                    timeout: 5000
                });
            } catch (fallbackErr) {
                console.error(`[Auth API] Fallback ${fallback}${path} also failed:`, fallbackErr.message);
                throw (firstErr.response ? firstErr : fallbackErr);
            }
        }
    };

    // ── App Store Reviewer 1-Click Demo Login ──
    const handleReviewerDemoLogin = async () => {
        try {
            setReviewerLoading(true);
            let res;
            try {
                res = await callAuthEndpoint('post', '/api/auth/demo-login');
            } catch (apiErr) {
                console.warn("[handleReviewerDemoLogin] Backend demo-login failed, using mock reviewer session:", apiErr.message);
            }

            const token = res?.data?.token || 'apple_reviewer_demo_2026';
            login({ credential: token });
            toast.success("Welcome to Demo Mode!");
            setShowEmailModal(false);
            navigate(resolvePostAuthRedirect(), { replace: true });
        } catch (e) {
            console.error("Reviewer demo login error:", e);
            toast.error("Reviewer demo login unavailable.");
        } finally {
            setReviewerLoading(false);
        }
    };

    // ── Email OTP Send & Verify Handlers ──
    const handleSendEmailOtp = async (e) => {
        if (e) e.preventDefault();
        const trimmedEmail = emailInput.trim();
        if (!trimmedEmail) {
            toast.error("Please enter your email address.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        try {
            setEmailLoading(true);
            const res = await callAuthEndpoint('post', '/api/auth/email/send-otp', {
                email: trimmedEmail
            });

            if (res.data?.success) {
                setEmailStep('otp');
                setOtpInput('');
                setResendCountdown(60);
                if (res.data?.devCode) {
                    setDevOtpHint(res.data.devCode);
                    toast.success(`Verification code: ${res.data.devCode}`, { duration: 6000 });
                } else {
                    setDevOtpHint('');
                    toast.success(`Verification code sent to ${trimmedEmail}!`);
                }
            }
        } catch (err) {
            console.error("sendOtp error:", err);
            toast.error(err.response?.data?.error || "Failed to send code. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    const handleVerifyEmailOtp = async (explicitCode, e) => {
        if (e) e.preventDefault();
        const trimmedEmail = emailInput.trim();
        const codeToVerify = (explicitCode !== undefined ? explicitCode : otpInput).toString().trim();

        if (!codeToVerify || codeToVerify.length < 6) {
            toast.error("Please enter the complete 6-digit verification code.");
            return;
        }

        try {
            setEmailLoading(true);
            const res = await callAuthEndpoint('post', '/api/auth/email/verify-otp', {
                email: trimmedEmail,
                otp: codeToVerify
            });

            if (res.data && res.data.token) {
                login({ credential: res.data.token });
                toast.success("Welcome to LearnProof AI!");
                setShowEmailModal(false);
                setEmailStep('input');
                setEmailInput('');
                setOtpInput('');
                navigate(resolvePostAuthRedirect(), { replace: true });
            }
        } catch (err) {
            console.error("verifyOtp error:", err);
            toast.error(err.response?.data?.error || "Incorrect code. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#FFF5F0] via-[#FFFFFF] to-[#FFEFE6] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-x-hidden flex flex-col justify-between items-center py-5 sm:py-8 px-4 sm:px-6 select-none font-sans">
            {/* Subtle top progress bar during authentication */}
            {isAuthenticating && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 animate-pulse z-50 pointer-events-none" />
            )}
            
            {/* ── Background Decorative Texture & Glows ── */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Top-Left Dot Grid Pattern */}
                <div className="absolute top-4 left-4 grid grid-cols-4 gap-2.5 opacity-30">
                    {[...Array(24)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    ))}
                </div>

                {/* Bottom-Right Dot Grid Pattern */}
                <div className="absolute bottom-6 right-4 grid grid-cols-4 gap-2.5 opacity-30">
                    {[...Array(24)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    ))}
                </div>

                {/* Soft ambient gradient waves */}
                <div className="absolute top-0 right-0 w-[380px] h-[380px] bg-gradient-to-bl from-orange-200/35 via-amber-100/20 to-transparent rounded-full blur-[90px]" />
                <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-orange-200/30 via-rose-100/15 to-transparent rounded-full blur-[80px]" />
            </div>

            {/* ── Floating 3D Graduation Cap (Top Right - Original Orange Cap with Bottom-Matching Animation) ── */}
            <div className="absolute top-5 right-4 sm:top-9 sm:right-14 z-10 pointer-events-none flex flex-col items-center">
                <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    className="relative flex flex-col items-center"
                >
                    {/* Sunburst rays */}
                    <div className="flex gap-1.5 mb-1 opacity-70">
                        <span className="w-1 h-2 sm:h-2.5 bg-orange-400 rounded-full rotate-[-25deg]" />
                        <span className="w-1 h-2.5 sm:h-3.5 bg-orange-500 rounded-full" />
                        <span className="w-1 h-2 sm:h-2.5 bg-orange-400 rounded-full rotate-[25deg]" />
                    </div>
                    {/* 3D Cap: Original Orange Gradient Card */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-400 text-white flex items-center justify-center shadow-[0_12px_28px_rgba(249,115,22,0.3)] border border-white/50 backdrop-blur-sm">
                        <GraduationCap size={24} className="sm:size-[30px] drop-shadow-sm" />
                    </div>
                </motion.div>
            </div>

            {/* ── Main Framed Login Container ── */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[375px] sm:max-w-[410px] bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border border-orange-200/70 dark:border-gray-800 rounded-[2rem] sm:rounded-[2.5rem] px-4.5 py-5 sm:px-6 sm:py-6 shadow-[0_16px_40px_rgba(249,115,22,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center space-y-3.5 sm:space-y-4 my-auto overflow-hidden"
            >
                
                {/* 1. Header with Logo & Brand Name */}
                <div className="flex flex-col items-center text-center space-y-1">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative mb-0.5"
                    >
                        <img 
                            src="/LP_logo_login.png" 
                            alt="LearnProof AI" 
                            className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_6px_14px_rgba(249,115,22,0.12)]"
                        />
                    </motion.div>
                </div>

                {/* 2. Welcome Back Headline */}
                <div className="text-center space-y-0.5">
                    <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Sign in to continue your learning journey
                    </p>
                </div>

                {/* 3. Three Featured Cards (Interactive Carousel / Swipeable) */}
                <div className="w-full relative py-0.5">
                    {/* Dedicated overflow clipping container so cards stay strictly below/inside the box border */}
                    <div className="w-full overflow-hidden rounded-2xl py-1 px-0.5 -my-1 -mx-0.5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_, { offset }) => {
                                    if (offset.x < -35) setActiveFeature((prev) => (prev + 1) % SLIDES.length);
                                    else if (offset.x > 35) setActiveFeature((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
                                }}
                                className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full cursor-grab active:cursor-grabbing"
                            >
                                {SLIDES[activeFeature].map((card, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-2xl p-2 sm:p-2.5 border flex flex-col items-center text-center justify-between min-h-[120px] sm:min-h-[130px] shadow-xs transition-all duration-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm ${card.cardBg}`}
                                    >
                                        {/* Icon Container */}
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-xs border border-slate-100 dark:border-gray-700/60 shrink-0 mb-1">
                                            {card.icon}
                                        </div>
                                        
                                        {/* Text */}
                                        <div className="w-full my-auto">
                                            <h3 className="text-[10.5px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                                {card.title}
                                            </h3>
                                            <p className="text-[8.5px] sm:text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                                {card.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Pagination Indicator Dots */}
                    <div className="flex justify-center items-center gap-1.5 mt-2.5">
                        {SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveFeature(idx)}
                                className={`transition-all duration-300 cursor-pointer ${
                                    idx === activeFeature 
                                        ? 'w-5 h-1.5 rounded-full bg-orange-500 shadow-xs' 
                                        : 'w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-gray-700 hover:bg-slate-400'
                                }`}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* 4. Primary Login Action: Continue with Google (Compact & Centered like before) */}
                <div className="w-full flex justify-center pt-0.5">
                    <motion.button
                        whileHover={{ scale: isAuthenticating ? 1 : 1.01, y: isAuthenticating ? 0 : -0.5 }}
                        whileTap={{ scale: isAuthenticating ? 1 : 0.99 }}
                        type="button"
                        disabled={isAuthenticating}
                        onClick={handleManualGoogleLogin}
                        className={`w-full max-w-[245px] sm:max-w-[260px] h-[38px] sm:h-[40px] flex items-center justify-center gap-2.5 px-3 bg-white dark:bg-gray-800 border border-slate-200/90 dark:border-gray-700 rounded-xl shadow-xs hover:shadow hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-200 font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-[13px] ${isAuthenticating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                    </motion.button>
                </div>

                {/* 5. Divider with "or" */}
                <div className="flex items-center gap-2.5 w-full max-w-[245px] sm:max-w-[260px] my-0.5">
                    <div className="flex-1 h-[1px] bg-slate-200 dark:bg-gray-800" />
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        or
                    </span>
                    <div className="flex-1 h-[1px] bg-slate-200 dark:bg-gray-800" />
                </div>

                {/* 6. Alternative Login Tiles Row (Apple, LinkedIn, Email/Reviewer Access) */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full max-w-[245px] sm:max-w-[260px]">
                    {/* Apple Sign-In Tile */}
                    <motion.button
                        whileHover={{ scale: isAuthenticating ? 1 : 1.04, y: isAuthenticating ? 0 : -1 }}
                        whileTap={{ scale: isAuthenticating ? 1 : 0.96 }}
                        disabled={isAuthenticating}
                        onClick={handleManualAppleLogin}
                        className={`flex-1 h-[44px] sm:h-[48px] rounded-2xl bg-white dark:bg-gray-800 border border-slate-200/90 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-gray-600 transition-all flex items-center justify-center group ${isAuthenticating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                        title="Sign in with Apple"
                        aria-label="Sign in with Apple"
                    >
                        <svg className="w-5.5 h-5.5 fill-slate-900 dark:fill-white transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                        </svg>
                    </motion.button>

                    {/* LinkedIn Sign-In Tile */}
                    <motion.button
                        whileHover={{ scale: isAuthenticating ? 1 : 1.04, y: isAuthenticating ? 0 : -1 }}
                        whileTap={{ scale: isAuthenticating ? 1 : 0.96 }}
                        disabled={isAuthenticating}
                        onClick={handleManualLinkedInLogin}
                        className={`flex-1 h-[44px] sm:h-[48px] rounded-2xl bg-white dark:bg-gray-800 border border-slate-200/90 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-[#0A66C2] dark:hover:border-[#0A66C2] transition-all flex items-center justify-center group ${isAuthenticating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                        title="Sign in with LinkedIn"
                        aria-label="Sign in with LinkedIn"
                    >
                        <svg className="w-5.5 h-5.5 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                            <rect width="24" height="24" rx="5" fill="#0A66C2" />
                            <path fill="#FFFFFF" d="M19 19h-3.14V13.8c0-1.24-.02-2.83-1.72-2.83-1.72 0-1.99 1.35-1.99 2.74V19H9V8.88h3.01v1.38h.04c.42-.8 1.45-1.64 2.98-1.64 3.19 0 3.78 2.1 3.78 4.83V19zM5.33 7.49a1.82 1.82 0 1 1 0-3.64 1.82 1.82 0 0 1 0 3.64zM6.9 19H3.76V8.88H6.9V19z" />
                        </svg>
                    </motion.button>

                    {/* Email / Reviewer Demo Access Tile */}
                    <motion.button
                        whileHover={{ scale: isAuthenticating ? 1 : 1.04, y: isAuthenticating ? 0 : -1 }}
                        whileTap={{ scale: isAuthenticating ? 1 : 0.96 }}
                        disabled={isAuthenticating}
                        onClick={() => setShowEmailModal(true)}
                        className={`flex-1 h-[44px] sm:h-[48px] rounded-2xl bg-white dark:bg-gray-800 border border-slate-200/90 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex items-center justify-center group ${isAuthenticating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                        title="Sign in with Email or App Store Reviewer Access"
                        aria-label="Sign in with Email or Demo Access"
                    >
                        <svg className="w-5.5 h-5.5 text-[#f97316] transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="15" x="2" y="4.5" rx="3.5" />
                            <path d="m22 7.5-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7.5" />
                        </svg>
                    </motion.button>
                </div>

                {/* 7. Terms of Service, Privacy Policy & Account Deletion */}
                <p className="text-[9px] sm:text-[9.5px] text-slate-400 dark:text-slate-500 font-medium text-center leading-tight px-2 pt-1 max-w-[310px]">
                    By continuing, you agree to our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-semibold">Terms</a>
                    {', '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-semibold">Privacy Policy</a>
                    {', & '}
                    <a href="/delete-account" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-semibold">Account Deletion</a>
                </p>

            </motion.div>

            {/* ── Floating 3D Lightbulb with Curved Dashed Trail (Bottom Left) ── */}
            <div className="absolute bottom-5 left-3 sm:bottom-8 sm:left-12 z-0 pointer-events-none flex flex-col items-center">
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    className="relative flex flex-col items-center"
                >
                    {/* Glowing rays */}
                    <div className="flex gap-1.5 mb-1 opacity-70">
                        <span className="w-1 h-2 sm:h-2.5 bg-orange-400 rounded-full rotate-[-25deg]" />
                        <span className="w-1 h-2.5 sm:h-3 bg-orange-500 rounded-full" />
                        <span className="w-1 h-2 sm:h-2.5 bg-orange-400 rounded-full rotate-[25deg]" />
                    </div>
                    {/* 3D Lightbulb card */}
                    <div className="w-11 h-11 sm:w-15 sm:h-15 rounded-2xl bg-white dark:bg-gray-800 shadow-[0_10px_25px_rgba(249,115,22,0.18)] border border-orange-100 dark:border-gray-700 flex items-center justify-center">
                        <Lightbulb size={22} className="sm:size-[26px] text-orange-500 drop-shadow-xs" />
                    </div>
                </motion.div>

                {/* Flowing dashed curve connecting lightbulb */}
                <svg className="absolute -bottom-2 left-10 sm:left-12 w-44 sm:w-64 h-12 sm:h-16 pointer-events-none opacity-40 z-0" viewBox="0 0 240 60" fill="none">
                    <path d="M 0 10 Q 70 50 160 20 T 240 40" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 6" />
                </svg>
            </div>

            {/* ── Email & App Store Reviewer Access Modal ── */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="bg-white dark:bg-gray-900 border border-orange-200/80 dark:border-gray-800 rounded-[1.75rem] sm:rounded-3xl p-5 sm:p-5.5 w-full max-w-[360px] sm:max-w-[375px] shadow-[0_20px_50px_rgba(0,0,0,0.22)] relative space-y-3.5"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800/80 pb-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200/50 dark:border-orange-500/20 flex items-center justify-center shrink-0">
                                        {emailStep === 'otp' ? <KeyRound size={15} /> : <Mail size={15} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                            {emailStep === 'otp' ? 'Enter Verification Code' : 'Sign In with Email'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                            {emailStep === 'otp' ? 'Check your inbox for 6-digit code' : 'Fast, secure passwordless login'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEmailModal(false);
                                        setEmailStep('input');
                                    }}
                                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
                                    aria-label="Close modal"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* ── STEP 1: Enter Email ── */}
                            {emailStep === 'input' && (
                                <div className="space-y-3">
                                    {/* 1-Click App Store Reviewer Demo Access (Sleek, Small Icon, Compact Button) */}
                                    <div className="flex items-center justify-between p-2 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-500/30">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-6 h-6 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                                                <Sparkles size={12} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                                                    Reviewer Demo
                                                </span>
                                                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block leading-tight">
                                                    1-click instant test access
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleReviewerDemoLogin}
                                            disabled={reviewerLoading}
                                            className="py-1 px-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white rounded-lg text-[10.5px] font-bold shadow-xs active:scale-95 transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                                        >
                                            {reviewerLoading ? (
                                                <Loader2 size={11} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                                    <span>Demo Login</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-2 my-1">
                                        <div className="flex-1 h-[1px] bg-slate-200/80 dark:bg-gray-800" />
                                        <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            or continue with code
                                        </span>
                                        <div className="flex-1 h-[1px] bg-slate-200/80 dark:bg-gray-800" />
                                    </div>

                                    {/* Email Input Form */}
                                    <form onSubmit={handleSendEmailOtp} className="space-y-2.5">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                                <input
                                                    type="email"
                                                    value={emailInput}
                                                    onChange={(e) => setEmailInput(e.target.value)}
                                                    placeholder="student@university.edu"
                                                    disabled={emailLoading}
                                                    autoFocus
                                                    className="w-full text-xs pl-8.5 pr-3 h-[36px] rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-center pt-0.5">
                                            <button
                                                type="submit"
                                                disabled={emailLoading}
                                                className="h-[34px] px-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-[11.5px] font-semibold shadow-xs hover:shadow-sm transition disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
                                            >
                                                {emailLoading ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        <span>Sending Code...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail size={13} />
                                                        <span>Send Verification Code</span>
                                                        <ArrowRight size={12} className="opacity-80" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ── STEP 2: Enter 6-Digit OTP ── */}
                            {emailStep === 'otp' && (
                                <div className="space-y-3">
                                    {/* Target Email Banner */}
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-500/30 text-xs">
                                        <div className="truncate pr-2">
                                            <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block leading-tight">Code sent to:</span>
                                            <span className="font-semibold text-orange-700 dark:text-orange-300 text-xs truncate block">
                                                {emailInput}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEmailStep('input')}
                                            className="text-[10.5px] font-bold text-orange-500 hover:text-orange-600 hover:underline shrink-0 cursor-pointer"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* 6-Digit OTP Form */}
                                    <form onSubmit={(e) => handleVerifyEmailOtp(undefined, e)} className="space-y-2.5">
                                        <div className="space-y-1 text-center">
                                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                                                Enter 6-Digit Code
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={6}
                                                value={otpInput}
                                                disabled={emailLoading}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setOtpInput(val);
                                                    if (val.length === 6) {
                                                        handleVerifyEmailOtp(val);
                                                    }
                                                }}
                                                placeholder="••••••"
                                                autoFocus
                                                className="w-full text-center text-xl font-mono font-black tracking-[0.35em] h-[42px] px-3 rounded-xl border border-orange-200 dark:border-gray-700 bg-orange-50/40 dark:bg-gray-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition placeholder:tracking-[0.2em] placeholder:text-slate-300 dark:placeholder:text-gray-600"
                                            />
                                            {devOtpHint && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOtpInput(devOtpHint);
                                                        handleVerifyEmailOtp(devOtpHint);
                                                    }}
                                                    className="w-full mt-1.5 py-1 px-2.5 rounded-lg bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-500/30 text-[10px] text-orange-600 dark:text-orange-400 font-medium hover:bg-orange-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <span>Dev code: <strong className="font-mono tracking-wider font-bold">{devOtpHint}</strong> (Click to auto-fill)</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex justify-center pt-0.5">
                                            <button
                                                type="submit"
                                                disabled={emailLoading}
                                                className="h-[34px] px-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-[11.5px] font-semibold shadow-xs hover:shadow-sm transition disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
                                            >
                                                {emailLoading ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        <span>Verifying Code...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={13} />
                                                        <span>Verify & Sign In</span>
                                                        <ArrowRight size={12} className="opacity-80" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Resend & Back Row */}
                                    <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-400">
                                        <button
                                            type="button"
                                            onClick={() => setEmailStep('input')}
                                            className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer text-[10.5px]"
                                        >
                                            <ArrowLeft size={12} />
                                            <span>Back</span>
                                        </button>

                                        {resendCountdown > 0 ? (
                                            <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
                                                Resend in <strong className="text-orange-500 font-mono">{resendCountdown}s</strong>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendEmailOtp}
                                                disabled={emailLoading}
                                                className="text-[10.5px] text-orange-500 hover:text-orange-600 font-bold hover:underline cursor-pointer"
                                            >
                                                Resend Code
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default LoginPage;
