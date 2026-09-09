import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { initializeLaunch } from './utils/launch';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { useLiveRoomPipStore } from './store/liveRoomPipStore';
import LiveRoomPipWindow from './components/Dashboard/LanguagePractice/LiveRoomPipWindow';
import toast from 'react-hot-toast';

// Helper to handle lazy loading chunk failures (e.g. after redeployment where old chunks are deleted)
const lazyWithRetry = (componentImport) => {
    return lazy(async () => {
        try {
            const module = await componentImport();
            if (module && (module.default || typeof module === 'function')) {
                return module;
            }
            throw new Error("Stale chunk module default export is undefined");
        } catch (error) {
            console.warn('Failed to load dynamic chunk asset (likely post-deployment chunk mismatch), reloading page for fresh assets...', error);
            const lastReload = sessionStorage.getItem('chunk_reload_timestamp');
            const now = Date.now();
            if (!lastReload || now - parseInt(lastReload, 10) > 3000) {
                sessionStorage.setItem('chunk_reload_timestamp', String(now));
                window.location.reload();
            }
            // Return dummy empty component to prevent fatal error overlay while browser reloads
            return { default: () => null };
        }
    });
};

// Lazy load components to optimize bundle size
const LandingPage = lazyWithRetry(() => import('./components/Landing'));
const DashboardLayout = lazyWithRetry(() => import('./components/Dashboard/DashboardLayout'));
const DashboardHome = lazyWithRetry(() => import('./components/Dashboard/DashboardHome'));
const MyCertificates = lazyWithRetry(() => import('./components/Dashboard/MyCertificates'));
const MyLearnings = lazyWithRetry(() => import('./components/Dashboard/MyLearnings'));
const Inbox = lazyWithRetry(() => import('./components/Dashboard/Inbox'));
const Quiz = lazyWithRetry(() => import('./components/Dashboard/Quiz'));
const Classroom = lazyWithRetry(() => import('./components/Classroom'));
const YouTubeExplorer = lazyWithRetry(() => import('./components/Dashboard/YouTubeExplorer'));
const PlaylistProgress = lazyWithRetry(() => import('./components/Dashboard/PlaylistProgress'));
const AIBenchmark = lazyWithRetry(() => import('./components/Dashboard/AIBenchmark'));
const AskMyNotes = lazyWithRetry(() => import('./components/Dashboard/AskMyNotesComingSoon'));
const AskMyNotesOriginal = lazyWithRetry(() => import('./components/Dashboard/AskMyNotes'));
const WorkspaceQuizPage = lazyWithRetry(() => import('./components/Dashboard/WorkspaceQuizPage'));
const RoadmapDetail = lazyWithRetry(() => import('./components/Dashboard/RoadmapDetail'));
const SocialDashboard = lazyWithRetry(() => import('./components/Dashboard/Social/SocialDashboard'));
const LanguageLearning = lazyWithRetry(() => import('./components/Dashboard/LanguagePractice/LanguageLearning'));
const LanguageRoom = lazyWithRetry(() => import('./components/Dashboard/LanguagePractice/LanguageRoom'));
const DailyGoalsPage = lazyWithRetry(() => import('./components/Dashboard/DailyGoalsPage'));
const LoginPage = lazyWithRetry(() => import('./components/Common/LoginPage'));

const AdminLayout = lazyWithRetry(() => import('./components/Admin/AdminLayout'));
const AdminDashboardHome = lazyWithRetry(() => import('./components/Admin/pages/AdminDashboardHome'));
const AdminUsersList = lazyWithRetry(() => import('./components/Admin/pages/AdminUsersList'));
const AdminContentList = lazyWithRetry(() => import('./components/Admin/pages/AdminContentList'));
const AdminUserDetails = lazyWithRetry(() => import('./components/Admin/pages/AdminUserDetails'));
const AdminInbox = lazyWithRetry(() => import('./components/Admin/pages/AdminInbox'));
const AdminAppsManagement = lazyWithRetry(() => import('./components/Admin/pages/AdminAppsManagement'));
const AdminReferrals = lazyWithRetry(() => import('./components/Admin/pages/AdminReferrals'));

const VerifyCertificate = lazyWithRetry(() => import('./components/Common/VerifyCertificate'));
const Support = lazyWithRetry(() => import('./components/Common/SupportPage'));
const AdminSupportList = lazyWithRetry(() => import('./components/Admin/pages/AdminSupportList'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/Common/PrivacyPolicy'));
const DeleteAccount = lazyWithRetry(() => import('./components/Common/DeleteAccount'));
const TermsOfService = lazyWithRetry(() => import('./components/Common/TermsOfService'));
const DownloadPage = lazyWithRetry(() => import('./components/Common/DownloadPage'));
const AmbassadorLanding = lazyWithRetry(() => import('./components/Common/AmbassadorLanding'));
const AmbassadorDashboard = lazyWithRetry(() => import('./components/Dashboard/AmbassadorDashboard'));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-400">Loading LearnProof AI...</p>
        </div>
    </div>
);

// In-memory cold launch tracker. Initialized to true only on fresh JS engine process boot (cold start).
// During in-session multitasking (backgrounding/resuming), this stays false so active pages are never reset.
let isAppColdBoot = true;

// ColdStartGuard: If the user completely closed the app and opens it fresh, ensure they start from the main dashboard.
// If the app was NOT closed completely (multitasking / background switch), this does nothing and preserves their page.
const ColdStartGuard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const hasChecked = React.useRef(false);

    React.useEffect(() => {
        if (loading || hasChecked.current || !isAppColdBoot) return;
        hasChecked.current = true;
        isAppColdBoot = false;

        // Clean up any stale route caches left by older app versions
        try {
            localStorage.removeItem('learnproof_last_route');
            sessionStorage.removeItem('learnproof_session_active');
            sessionStorage.removeItem('learnproof_last_route');
        } catch (e) {}

        const isNativeApp = (
            Capacitor.isNativePlatform() || 
            (typeof navigator !== 'undefined' && navigator.userAgent.includes('LearnProofApp'))
        );

        // On cold start of the native mobile app, reset any restored subpage back to dashboard
        if (isNativeApp && user) {
            const path = location.pathname;
            const isBypass = (
                path === '/' ||
                path === '/dashboard' ||
                path === '/download' ||
                path.startsWith('/verify') ||
                path.startsWith('/privacy') ||
                path.startsWith('/terms') ||
                path.startsWith('/delete-account') ||
                path.startsWith('/support') ||
                window.location.hash.includes('id_token=') ||
                window.location.hash.includes('credential=')
            );

            if (!isBypass) {
                console.log('[ColdStartGuard] App opened from cold start on subpage (' + path + '). Resetting to dashboard.');
                navigate('/dashboard', { replace: true });
            }
        }
    }, [loading, user, location.pathname, navigate]);

    return null;
};

// Root route handler:
// 1. Authenticated users opening the app at root start directly on the main dashboard (/dashboard).
// 2. Unauthenticated mobile app users go to /login.
// 3. Unauthenticated web visitors see the public landing page.
const RootRoute = () => {
    const { user, loading } = useAuth();
    const isNativeApp = typeof window !== 'undefined' && (
        Capacitor.isNativePlatform() || 
        navigator.userAgent.includes('LearnProofApp') ||
        window.location.hostname === 'localhost'
    );

    if (loading) return <PageLoader />;

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    if (isNativeApp) {
        return <LoginPage />;
    }

    return <LandingPage />;
};

// Global OAuth Hash & Redirect Interceptor
const OAuthRedirectHandler = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const isProcessed = React.useRef(false);

    React.useEffect(() => {
        if (isProcessed.current) return;
        const hash = window.location.hash;
        if (hash && (hash.includes('id_token=') || hash.includes('credential='))) {
            isProcessed.current = true;
            const params = new URLSearchParams(hash.substring(1));
            const idToken = params.get('id_token') || params.get('credential');
            const state = params.get('state');
            let targetRedirect = null;
            if (state) {
                try {
                    targetRedirect = decodeURIComponent(state);
                } catch (e) {
                    targetRedirect = state;
                }
            }

            if (!targetRedirect) {
                targetRedirect = localStorage.getItem("redirect_to") || sessionStorage.getItem("redirect_to") || "/dashboard";
            }

            // Immediately wipe the hash from URL so child pages don't re-parse or trigger duplicate logins
            window.history.replaceState(null, '', window.location.pathname);
            localStorage.removeItem("redirect_to");
            sessionStorage.removeItem("redirect_to");
            document.cookie = "redirect_to=; path=/; max-age=0; SameSite=Lax";

            if (idToken) {
                // Optimistic instant login (< 1ms)
                login({ credential: idToken });
                const finalTarget = targetRedirect || "/dashboard";
                // Instant client-side transition — zero full-page reload
                navigate(finalTarget, { replace: true });
            }
        }
    }, [login, navigate]);

    return null;
};

// Global LiveKit Meeting & Picture-in-Picture Manager
// Keeps active rooms connected across ALL sections of the application
// (Dashboard, Library, Classroom, Notes, Quizzes, etc.) with floating Google Meet-style PiP.
const GlobalLiveRoomManager = ({ children }) => {
    const { activeRoom, clearActiveRoom, showPip, setShowPip } = useLiveRoomPipStore();

    if (activeRoom) {
        return (
            <LiveKitRoom
                serverUrl={activeRoom.serverUrl}
                token={activeRoom.token}
                connect={true}
                video={false}
                audio={false}
                onDisconnected={() => {
                    const pip = useLiveRoomPipStore.getState();
                    const wasInPip = pip.showPip;
                    if (wasInPip) {
                        pip.setShowPip(false);
                        toast('The host has concluded the live session. 👋', { id: 'pip-session-ended', icon: '👋', duration: 4500 });
                    }
                    if (!pip.hostSummaryData && !pip.participantEndedData) {
                        const currentActive = pip.activeRoom;
                        const isHost = currentActive?.dbRoom?.creatorId && String(currentActive.dbRoom.creatorId) === String(currentActive.userIdentity);
                        if (!isHost && currentActive?.roomName) {
                            pip.setParticipantEndedData({
                                roomName: currentActive.roomName,
                                message: "The host has ended this live practice session. Thank you for participating!",
                                duration: pip.sessionSeconds || 0
                            });
                        }
                    }
                    pip.clearActiveRoom();
                }}
            >
                <RoomAudioRenderer />
                {children}
                {showPip && <LiveRoomPipWindow />}
            </LiveKitRoom>
        );
    }

    return children;
};

const App = () => {
    React.useEffect(() => {
        initializeLaunch();

        const handleUnhandledRejection = (event) => {
            const reason = event.reason;
            const msg = String(reason?.message || reason || '');
            const name = String(reason?.name || '');
            if (
                name === 'UnexpectedConnectionState' ||
                msg.includes('PC manager is closed') ||
                msg.includes('ensureDataTransportConnected')
            ) {
                event.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        if (Capacitor.isNativePlatform()) {
            const updateStatusBar = () => {
                const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
                if (isDark) {
                    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
                    StatusBar.setBackgroundColor({ color: '#0F172A' }).catch(() => {});
                } else {
                    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
                    StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => {});
                }
            };
            updateStatusBar();

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.attributeName === 'class') {
                        updateStatusBar();
                    }
                }
            });
            observer.observe(document.documentElement, { attributes: true });
        }

        const trackScreenTime = () => {
            if (document.visibilityState === 'visible') {
                const d = new Date();
                const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                try {
                    const dataStr = localStorage.getItem('learnproof_screentime') || '{}';
                    const data = JSON.parse(dataStr);
                    data[todayStr] = (data[todayStr] || 0) + 1;
                    localStorage.setItem('learnproof_screentime', JSON.stringify(data));
                } catch (e) {
                    console.error('Error tracking screen time:', e);
                }
            }
        };

        let appStateListener = null;
        if (Capacitor.isNativePlatform()) {
            CapApp.addListener('appStateChange', ({ isActive }) => {
                console.log('[App Lifecycle] App state changed. isActive:', isActive);
                // When resuming from background multitasking, do not alter the current route
                // so the user seamlessly stays on whatever page/video they were viewing.
            }).then(handle => {
                appStateListener = handle;
            }).catch(() => {});
        }

        const interval = setInterval(trackScreenTime, 1000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            if (appStateListener) {
                appStateListener.remove();
            }
        };
    }, []);

    return (
        <AuthProvider>
            <ModalProvider>
                <Router>
                    <GlobalLiveRoomManager>
                        <ColdStartGuard />
                        <OAuthRedirectHandler />
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path='/' element={<RootRoute />} />
                                <Route path='/youtube-learning' element={<LandingPage />} />
                                <Route path='/ai-video-notes' element={<LandingPage />} />
                                <Route path='/youtube-certificates' element={<LandingPage />} />
                                <Route path='/track-youtube-progress' element={<LandingPage />} />
                                <Route path='/ai-study-planner' element={<LandingPage />} />
                                <Route path='/verify/:certId' element={<VerifyCertificate />} />
                                <Route path='/privacy-policy' element={<PrivacyPolicy />} />
                                <Route path='/terms' element={<TermsOfService />} />
                                <Route path='/support' element={<Support />} />
                                <Route path='/delete-account' element={<DeleteAccount />} />
                                <Route path='/login' element={<LoginPage />} />
                                <Route path='/download' element={<DownloadPage />} />
                                <Route path='/ambassador' element={<AmbassadorLanding />} />
                                <Route path='/referrals' element={<AmbassadorLanding />} />
                                <Route path='/campus-ambassador' element={<AmbassadorLanding />} />
                                <Route path='/referral-program' element={<AmbassadorLanding />} />
                                <Route 
                                    path='/ambassador/portal' 
                                    element={
                                        <ProtectedRoute>
                                            <AmbassadorDashboard />
                                        </ProtectedRoute>
                                    } 
                                />
                                <Route 
                                    path='/ambassador/dashboard' 
                                    element={
                                        <ProtectedRoute>
                                            <AmbassadorDashboard />
                                        </ProtectedRoute>
                                    } 
                                />

                                <Route
                                    path='/dashboard/*'
                                    element={
                                        <ProtectedRoute>
                                            <DashboardLayout />
                                        </ProtectedRoute>
                                    }
                                >
                                    <Route index element={<DashboardHome />} />
                                    <Route path="library" element={<MyLearnings />} />
                                    <Route path="explore" element={<YouTubeExplorer />} />
                                    <Route path="certificates" element={<MyCertificates />} />
                                    <Route path="playlist/:id" element={<PlaylistProgress />} />
                                    <Route path="roadmap/:pid" element={<RoadmapDetail />} />
                                    <Route path='inbox' element={<Inbox />} />
                                    <Route path='quiz' element={<Quiz />} />
                                    <Route path='goals' element={<DailyGoalsPage />} />
                                    <Route path='ai-benchmark' element={<AIBenchmark />} />
                                    <Route path='ask-my-notes' element={<AskMyNotes />} />
                                    <Route path='ask-my-notes/:subjectId' element={<AskMyNotes />} />
                                    <Route path='ask-my-notes-dev' element={<AskMyNotesOriginal />} />
                                    <Route path='ask-my-notes-dev/:subjectId' element={<AskMyNotesOriginal />} />
                                    <Route path='ask-my-notes-dev/:subjectId/quiz' element={<WorkspaceQuizPage />} />
                                    <Route path='support' element={<Support />} />
                                    <Route path='ambassador' element={<Navigate to="/ambassador/portal" replace />} />
                                    
                                    {/* Social / Social Hub Features */}
                                    <Route path='social/*' element={<SocialDashboard />} />
                                    
                                    {/* Live Rooms Features */}
                                    <Route path='live-rooms' element={<LanguageLearning />} />
                                    <Route path='live-rooms/:roomName' element={<LanguageRoom />} />
                                    
                                    <Route path='*' element={<Navigate to="/" replace />} />
                                </Route>
                                <Route
                                    path='classroom/:videoId'
                                    element={
                                        <ProtectedRoute>
                                            <Classroom />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Admin Routes */}
                                <Route
                                    path='/admin/*'
                                    element={
                                        <AdminRoute>
                                            <AdminLayout />
                                        </AdminRoute>
                                    }
                                >
                                     <Route path='dashboard' element={<AdminDashboardHome />} />
                                     <Route path='referrals' element={<AdminReferrals />} />
                                     <Route path='users' element={<AdminUsersList />} />
                                     <Route path='users/:id' element={<AdminUserDetails />} />
                                     <Route path='content' element={<AdminContentList />} />
                                     <Route path='support' element={<AdminSupportList />} />
                                     <Route path='inbox' element={<AdminInbox />} />
                                     <Route path='apps' element={<AdminAppsManagement />} />
                                     <Route path='' element={<Navigate to="dashboard" replace />} />
                                </Route>
                                <Route path='*' element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </GlobalLiveRoomManager>
                </Router>
            </ModalProvider>
        </AuthProvider>
    );
};

export default App;
