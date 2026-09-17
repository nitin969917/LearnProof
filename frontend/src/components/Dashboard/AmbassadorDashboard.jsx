import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Sparkles,
    Edit3,
    BookOpen,
    Menu,
    RefreshCw,
    Share2,
    Copy,
    Check
} from 'lucide-react';

import AmbassadorSidebar from './AmbassadorSidebar.jsx';
import HubHeader from '../Ambassador/HubHeader.jsx';
import MissionActionCenter from '../Ambassador/MissionActionCenter.jsx';
import MyCampusSection from '../Ambassador/MyCampusSection.jsx';
import CampusImpactAnalytics from '../Ambassador/CampusImpactAnalytics.jsx';
import AmbassadorKitSection from '../Ambassador/AmbassadorKitSection.jsx';
import PitchAndFaqSection from '../Ambassador/PitchAndFaqSection.jsx';
import RewardsRoadmap from '../Ambassador/RewardsRoadmap.jsx';
import GamifiedLeaderboard from '../Ambassador/GamifiedLeaderboard.jsx';
import ProductUpdatesAndCommunity from '../Ambassador/ProductUpdatesAndCommunity.jsx';
import AmbassadorProfileCard from '../Ambassador/AmbassadorProfileCard.jsx';

import LogActivityModal from '../Ambassador/Modals/LogActivityModal.jsx';
import RequestSessionModal from '../Ambassador/Modals/RequestSessionModal.jsx';
import StudentFeedbackModal from '../Ambassador/Modals/StudentFeedbackModal.jsx';

export default function AmbassadorDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Navigation & Drawer
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        code: '',
        category: 'ambassador',
        title: '',
        creatorName: '',
        targetCollege: ''
    });

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            const yOffset = -70;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const fetchAmbassadorData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const codeRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/my-code`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (codeRes.data?.success) {
                setReferralData(codeRes.data);
                setEditForm({
                    code: codeRes.data.referralCode || '',
                    category: codeRes.data.category || 'ambassador',
                    title: codeRes.data.title || '',
                    creatorName: codeRes.data.creatorName || user?.name || '',
                    targetCollege: codeRes.data.targetCollege || ''
                });
            }
        } catch (err) {
            console.error('Error fetching ambassador data:', err);
            toast.error('Failed to load ambassador hub');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAmbassadorData();
    }, [token]);

    const getShareUrl = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://learnproof.xyz';
        return `${origin}/?ref=${referralData?.referralCode || ''}`;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/my-code`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success) {
                toast.success('Ambassador profile customized successfully!');
                setIsEditModalOpen(false);
                fetchAmbassadorData(true);
            }
        } catch (err) {
            console.error('Failed to update code:', err);
            toast.error(err.response?.data?.error || 'Failed to update referral code');
        } finally {
            setSaving(false);
        }
    };

    // Current Tier Calculation
    const signups = referralData?.signupCount || 0;
    const getTierInfo = () => {
        if (signups >= 100) {
            return {
                name: 'Diamond Campus Lead',
                badge: '💎',
                level: 'Diamond',
                nextTier: null,
                nextGoal: 100,
                progress: 100
            };
        } else if (signups >= 50) {
            return {
                name: 'Gold Ambassador',
                badge: '🥇',
                level: 'Gold',
                nextTier: 'Diamond Lead (100 Verified)',
                nextGoal: 100,
                progress: Math.min(100, (signups / 100) * 100)
            };
        } else if (signups >= 10) {
            return {
                name: 'Silver Ambassador',
                badge: '🥈',
                level: 'Silver',
                nextTier: 'Gold Ambassador (50 Verified)',
                nextGoal: 50,
                progress: Math.min(100, (signups / 50) * 100)
            };
        } else {
            return {
                name: 'Bronze Ambassador',
                badge: '🥉',
                level: 'Bronze',
                nextTier: 'Silver Ambassador (10 Verified)',
                nextGoal: 10,
                progress: Math.min(100, (signups / 10) * 100)
            };
        }
    };

    const currentTier = getTierInfo();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Loading LearnProof Ambassador Hub...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200 flex">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-b from-orange-100/50 via-amber-50/30 to-transparent pointer-events-none -z-10" />

            {/* ── Ambassador Hub Sidebar ── */}
            <AmbassadorSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeSection={activeSection}
                onNavigateSection={scrollToSection}
                referralData={referralData}
                currentTier={currentTier}
                onOpenCustomizeModal={() => setIsEditModalOpen(true)}
            />

            {/* ── Main Content Area ── */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* ── Top Bar ── */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-2xs border-b border-gray-200/80 py-3 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-1 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 lg:hidden cursor-pointer"
                            title="Open Hub Menu"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                                <Sparkles size={13} className="text-orange-500" />
                                LearnProof AI Ambassador Hub
                            </span>
                            <span className="text-xs font-semibold text-gray-500 hidden md:inline">
                                • {currentTier.badge} {currentTier.name}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => fetchAmbassadorData(true)}
                            disabled={refreshing}
                            className="p-2 text-gray-600 bg-gray-50 hover:bg-orange-50 rounded-xl transition border border-gray-200 shadow-2xs cursor-pointer"
                            title="Refresh Analytics"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                        </button>

                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition active:scale-95 cursor-pointer"
                        >
                            <Edit3 size={14} />
                            <span className="hidden sm:inline">Customize Code</span>
                        </button>

                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
                        >
                            <BookOpen size={15} />
                            <span className="hidden sm:inline">Student App</span>
                        </Link>
                    </div>
                </header>

                {/* ── Main Scroll Container ── */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-8 pb-24">
                    {/* 1. Hub Header & Identity (Welcome, College, Active Status, XP) */}
                    <div id="overview">
                        <HubHeader
                            user={user}
                            referralData={referralData}
                            currentTier={currentTier}
                            refreshing={refreshing}
                            onRefresh={() => fetchAmbassadorData(true)}
                            onOpenCustomizeModal={() => setIsEditModalOpen(true)}
                        />
                    </div>

                    {/* 2. 🎯 ACT: Weekly Mission & Action Checklist + Category Missions */}
                    <MissionActionCenter
                        referralData={referralData}
                        token={token}
                        onTaskStateChange={(taskId, val) => {
                            setReferralData(prev => ({
                                ...prev,
                                checklistStates: {
                                    ...(prev?.checklistStates || {}),
                                    [taskId]: val
                                }
                            }));
                        }}
                        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                        onOpenSessionModal={() => setIsSessionModalOpen(true)}
                    />

                    {/* 3. 🏫 BUILD: My Campus (Pulse, Goals, Activities Feed, Request Session) */}
                    <MyCampusSection
                        referralData={referralData}
                        onOpenActivityModal={() => setIsActivityModalOpen(true)}
                        onOpenSessionModal={() => setIsSessionModalOpen(true)}
                        onOpenCustomizeModal={() => setIsEditModalOpen(true)}
                    />

                    {/* 4. 📈 IMPACT: Campus Impact & Quality Learner Funnel */}
                    <CampusImpactAnalytics
                        referralData={referralData}
                    />

                    {/* 5. 📣 CONNECT: Multi-channel Ambassador Kit */}
                    <AmbassadorKitSection
                        referralData={referralData}
                        shareUrl={getShareUrl()}
                    />

                    {/* 6. 🎤 30-Second Pitch & Student FAQs */}
                    <PitchAndFaqSection
                        shareUrl={getShareUrl()}
                    />

                    {/* 7. 🏆 GROW: Rewards Roadmap (3D Progression: Growth, Activity, Leadership) */}
                    <RewardsRoadmap
                        referralData={referralData}
                        currentTier={currentTier}
                    />

                    {/* 8. 🏅 GROW: Gamified Leaderboard (India vs College) & XP Explainer */}
                    <GamifiedLeaderboard
                        referralData={referralData}
                        token={token}
                    />

                    {/* 9. 🚀 CONNECT: Product Updates & Core Team Announcements */}
                    <ProductUpdatesAndCommunity
                        referralData={referralData}
                        shareUrl={getShareUrl()}
                        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                    />

                    {/* 10. 👤 Ambassador Profile & Badges Portfolio */}
                    <AmbassadorProfileCard
                        user={user}
                        referralData={referralData}
                        currentTier={currentTier}
                        onOpenCustomizeModal={() => setIsEditModalOpen(true)}
                    />
                </main>
            </div>

            {/* ── Modals ── */}
            <LogActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                referralCode={referralData?.referralCode}
                token={token}
                onSuccess={() => fetchAmbassadorData(true)}
            />

            <RequestSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                referralCode={referralData?.referralCode}
                targetCollege={referralData?.targetCollege}
                token={token}
            />

            <StudentFeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                referralCode={referralData?.referralCode}
                token={token}
                onSuccess={() => fetchAmbassadorData(true)}
            />

            {/* ── Edit Code & Profile Modal ── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-orange-100 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                <Edit3 className="text-orange-500" size={18} />
                                Customize Ambassador Link
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg text-lg cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Custom Referral Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. SPIT_AVISHKAR, IITB_ALEX"
                                    value={editForm.code}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm font-mono font-bold text-orange-600 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    College / University Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sardar Patel Institute of Technology"
                                    value={editForm.targetCollege}
                                    onChange={(e) => setEditForm({ ...editForm, targetCollege: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Display / Creator Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Avishkar Kakade"
                                    value={editForm.creatorName}
                                    onChange={(e) => setEditForm({ ...editForm, creatorName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            {/* Live Link Preview */}
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs">
                                <span className="font-bold text-orange-800 block mb-0.5">Your New Link:</span>
                                <span className="font-mono text-orange-700 break-all font-semibold">
                                    {window.location.origin}/?ref={editForm.code || 'CODE'}
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-orange-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
