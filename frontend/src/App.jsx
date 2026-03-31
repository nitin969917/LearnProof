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

import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboardHome from './components/Admin/pages/AdminDashboardHome';
import AdminUsersList from './components/Admin/pages/AdminUsersList';
import AdminContentList from './components/Admin/pages/AdminContentList';
import AdminUserDetails from './components/Admin/pages/AdminUserDetails';

import { ModalProvider } from './context/ModalContext';

import VerifyCertificate from './components/Common/VerifyCertificate';

const App = () => {
    return (
        <AuthProvider>
            <ModalProvider>
                <Router>
                    <Routes>
                        <Route path='/' element={<LandingPage />} />
                        <Route path='/verify/:certId' element={<VerifyCertificate />} />

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
                            <Route path='ai-benchmark' element={<AIBenchmark />} />
                            <Route path='ask-my-notes' element={<AskMyNotes />} />
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
                            <Route path='' element={<Navigate to="dashboard" replace />} />
                        </Route>
                    </Routes>
                </Router>
            </ModalProvider>
        </AuthProvider>
    );
};

export default App;
