import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

// Lazy load components to optimize bundle size
const LandingPage = lazy(() => import('./components/Landing'));
const DashboardLayout = lazy(() => import('./components/Dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('./components/Dashboard/DashboardHome'));
const MyCertificates = lazy(() => import('./components/Dashboard/MyCertificates'));
const MyLearnings = lazy(() => import('./components/Dashboard/MyLearnings'));
const Inbox = lazy(() => import('./components/Dashboard/Inbox'));
const Quiz = lazy(() => import('./components/Dashboard/Quiz'));
const Classroom = lazy(() => import('./components/Classroom'));
const YouTubeExplorer = lazy(() => import('./components/Dashboard/YouTubeExplorer'));
const PlaylistProgress = lazy(() => import('./components/Dashboard/PlaylistProgress'));
const AIBenchmark = lazy(() => import('./components/Dashboard/AIBenchmark'));
const AskMyNotes = lazy(() => import('./components/Dashboard/AskMyNotes'));
const RoadmapDetail = lazy(() => import('./components/Dashboard/RoadmapDetail'));
const SocialDashboard = lazy(() => import('./components/Dashboard/Social/SocialDashboard'));
const LanguageLearning = lazy(() => import('./components/Dashboard/LanguagePractice/LanguageLearning'));
const LanguageRoom = lazy(() => import('./components/Dashboard/LanguagePractice/LanguageRoom'));
const DailyGoalsPage = lazy(() => import('./components/Dashboard/DailyGoalsPage'));
const LoginPage = lazy(() => import('./components/Common/LoginPage'));

const AdminLayout = lazy(() => import('./components/Admin/AdminLayout'));
const AdminDashboardHome = lazy(() => import('./components/Admin/pages/AdminDashboardHome'));
const AdminUsersList = lazy(() => import('./components/Admin/pages/AdminUsersList'));
const AdminContentList = lazy(() => import('./components/Admin/pages/AdminContentList'));
const AdminUserDetails = lazy(() => import('./components/Admin/pages/AdminUserDetails'));
const AdminInbox = lazy(() => import('./components/Admin/pages/AdminInbox'));
const AdminAppsManagement = lazy(() => import('./components/Admin/pages/AdminAppsManagement'));

const VerifyCertificate = lazy(() => import('./components/Common/VerifyCertificate'));
const Support = lazy(() => import('./components/Common/SupportPage'));
const AdminSupportList = lazy(() => import('./components/Admin/pages/AdminSupportList'));
const PrivacyPolicy = lazy(() => import('./components/Common/PrivacyPolicy'));
const DeleteAccount = lazy(() => import('./components/Common/DeleteAccount'));
const TermsOfService = lazy(() => import('./components/Common/TermsOfService'));
const DownloadPage = lazy(() => import('./components/Common/DownloadPage'));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-400">Loading LearnProof AI...</p>
        </div>
    </div>
);

const App = () => {
    React.useEffect(() => {
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

        const interval = setInterval(trackScreenTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AuthProvider>
            <ModalProvider>
                <Router>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path='/' element={<LandingPage />} />
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
                                <Route path='support' element={<Support />} />
                                
                                {/* Social / Social Dating Features */}
                                <Route path='social' element={<SocialDashboard />} />
                                
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
                </Router>
            </ModalProvider>
        </AuthProvider>
    );
};

export default App;
