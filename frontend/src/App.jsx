import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/Landing';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import DashboardHome from './components/Dashboard/DashboardHome';
import MyCertificates from './components/Dashboard/MyCertificates';
import MyLearnings from './components/Dashboard/MyLearnings';
import Inbox from './components/Dashboard/Inbox';
import ProtectedRoute from "./routes/ProtectedRoute"
import AdminRoute from "./routes/AdminRoute"
import { AuthProvider } from './context/AuthContext';
import Quiz from './components/Dashboard/Quiz';
import Classroom from './components/Classroom';
import YouTubeExplorer from './components/Dashboard/YouTubeExplorer';
import PlaylistProgress from './components/Dashboard/PlaylistProgress';
import AIBenchmark from './components/Dashboard/AIBenchmark';
import AskMyNotes from './components/Dashboard/AskMyNotes';
import RoadmapDetail from './components/Dashboard/RoadmapDetail';
import SocialDashboard from './components/Dashboard/Social/SocialDashboard';
import LanguageLearning from './components/Dashboard/LanguagePractice/LanguageLearning';
import LanguageRoom from './components/Dashboard/LanguagePractice/LanguageRoom';
import DailyGoalsPage from './components/Dashboard/DailyGoalsPage';
import LoginPage from './components/Common/LoginPage';

import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboardHome from './components/Admin/pages/AdminDashboardHome';
import AdminUsersList from './components/Admin/pages/AdminUsersList';
import AdminContentList from './components/Admin/pages/AdminContentList';
import AdminUserDetails from './components/Admin/pages/AdminUserDetails';
import AdminInbox from './components/Admin/pages/AdminInbox';

import { ModalProvider } from './context/ModalContext';

import VerifyCertificate from './components/Common/VerifyCertificate';
import Support from './components/Common/SupportPage';
import AdminSupportList from './components/Admin/pages/AdminSupportList';
import PrivacyPolicy from './components/Common/PrivacyPolicy';
import DeleteAccount from './components/Common/DeleteAccount';
import TermsOfService from './components/Common/TermsOfService';

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
                            <Route path='' element={<Navigate to="dashboard" replace />} />
                        </Route>
                        <Route path='*' element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ModalProvider>
        </AuthProvider>
    );
};

export default App;
