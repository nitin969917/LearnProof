import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldAlert, Trash2, ArrowLeft, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

const DeleteAccount = () => {
    const navigate = useNavigate();
    const { user, token, logout } = useAuth();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    const handleDeleteAccount = async () => {
        const authToken = token || localStorage.getItem('google_token');
        if (!authToken) {
            toast.error("Please sign in first to delete your account.");
            navigate('/login');
            return;
        }

        try {
            setIsDeleting(true);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
            
            try {
                await axios.delete(`${backendUrl}/api/profile`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                    data: {
                        idToken: authToken
                    }
                });
            } catch (delErr) {
                console.warn("DELETE /api/profile attempt failed, trying POST fallback:", delErr.message);
                await axios.post(`${backendUrl}/api/delete-account`, {
                    idToken: authToken
                }, {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                });
            }

            toast.success("Your account and all associated data have been permanently deleted.");
            
            // Clear local storage and session
            if (logout) logout();
            localStorage.clear();
            sessionStorage.clear();
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (err) {
            console.error("Account deletion failed:", err);
            toast.error(err.response?.data?.error || "Failed to delete account. Please try again or contact support.");
            setIsDeleting(false);
        }
    };

    const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff7f4] via-[#ffffff] to-[#fffbf9] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-800 dark:text-gray-100 p-4 sm:p-6 md:p-10 font-sans selection:bg-orange-200 select-none relative overflow-y-auto">
            {/* Background Texture & Soft Ambient Glows matching LearnProof design */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f97316 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-200/40 via-rose-100/20 to-transparent rounded-full blur-[90px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-[90px] pointer-events-none -translate-x-1/4 translate-y-1/4" />

            <div className="max-w-3xl mx-auto relative z-10 py-3 sm:py-6">
                <button 
                    onClick={handleBack}
                    className="mb-6 sm:mb-8 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>

                <div className="flex items-center gap-3.5 mb-6 sm:mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-sm">
                        <ShieldAlert size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 bg-clip-text text-transparent tracking-tight">
                            Account Deletion & Data Privacy
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            Permanent removal of your LearnProof AI account and all associated data
                        </p>
                    </div>
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                    {/* Active Deletion Card */}
                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-red-200/80 dark:border-red-900/40 rounded-3xl p-5 sm:p-7 md:p-8 shadow-[0_15px_40px_-15px_rgba(239,68,68,0.08)]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                    <span>Delete Account Instantly</span>
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all font-medium">
                                    {user ? (
                                        <>Currently signed in as: <strong className="text-gray-800 dark:text-white font-bold">{user.email || user.name}</strong></>
                                    ) : (
                                        "Sign in to delete your account directly inside the app."
                                    )}
                                </p>
                            </div>

                            {user ? (
                                <button
                                    onClick={() => setIsConfirmOpen(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete My Account</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start sm:self-center shadow-xs"
                                >
                                    <Lock size={14} />
                                    <span>Sign In First</span>
                                </button>
                            )}
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 rounded-2xl text-xs text-red-800 dark:text-red-300 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="leading-relaxed font-medium">
                                <strong className="font-bold text-red-900 dark:text-red-200">Warning:</strong> Deleting your account is immediate and irreversible. All your study progress, playlist bookmarks, AI chat benchmark history, earned certificates, and community notes will be erased from our database.
                            </div>
                        </div>
                    </div>

                    {/* What Data is Deleted */}
                    <section className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-5 sm:p-7 md:p-8 rounded-3xl border border-orange-100/80 dark:border-gray-800 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.04)]">
                        <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span>What Data Is Permanently Erased</span>
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                            <li className="p-4 bg-orange-50/40 dark:bg-gray-800/50 rounded-2xl border border-orange-100/70 dark:border-gray-750">
                                <strong className="text-gray-900 dark:text-gray-100 block mb-1 font-bold">Profile & OAuth Identifiers</strong>
                                <span className="text-gray-600 dark:text-gray-400">Your name, email, profile picture, and Google/Apple authentication tokens.</span>
                            </li>
                            <li className="p-4 bg-orange-50/40 dark:bg-gray-800/50 rounded-2xl border border-orange-100/70 dark:border-gray-750">
                                <strong className="text-gray-900 dark:text-gray-100 block mb-1 font-bold">Learning History & Roadmaps</strong>
                                <span className="text-gray-600 dark:text-gray-400">Saved playlists, progress milestones, and watch time statistics.</span>
                            </li>
                            <li className="p-4 bg-orange-50/40 dark:bg-gray-800/50 rounded-2xl border border-orange-100/70 dark:border-gray-750">
                                <strong className="text-gray-900 dark:text-gray-100 block mb-1 font-bold">AI Summaries & Notes</strong>
                                <span className="text-gray-600 dark:text-gray-400">Auto-generated PDF notes, Ask-AI query logs, and benchmark scores.</span>
                            </li>
                            <li className="p-4 bg-orange-50/40 dark:bg-gray-800/50 rounded-2xl border border-orange-100/70 dark:border-gray-750">
                                <strong className="text-gray-900 dark:text-gray-100 block mb-1 font-bold">Social & Room Activity</strong>
                                <span className="text-gray-600 dark:text-gray-400">Community posts, comments, friend requests, and room participations.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Retention Policy */}
                    <section className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-5 sm:p-7 md:p-8 rounded-3xl border border-orange-100/80 dark:border-gray-800 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.04)] text-xs">
                        <h2 className="text-base font-black text-gray-900 dark:text-white mb-2">Compliance & Data Retention</h2>
                        <p className="leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                            In accordance with Apple App Store Review Guideline 5.1.1(v) and GDPR/CCPA standards, LearnProof AI provides automated real-time account deletion. We do not retain residual copies of your personal data on active servers once initiated.
                        </p>
                    </section>
                </div>

                {/* Double Confirmation Modal */}
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                                <AlertTriangle size={24} />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Confirm Account Deletion</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Are you sure you want to permanently delete your LearnProof account?
                                </p>
                            </div>

                            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-[11px] text-red-800 dark:text-red-300 font-medium">
                                Type <strong className="font-bold text-red-900 dark:text-red-200">DELETE</strong> below to confirm.
                            </div>

                            <input 
                                type="text" 
                                placeholder="Type DELETE to confirm" 
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                autoFocus
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsConfirmOpen(false);
                                        setConfirmText('');
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!isConfirmed || isDeleting}
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-10 sm:mt-12 text-center text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-wider">
                    &copy; 2026 LearnProof AI. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default DeleteAccount;
