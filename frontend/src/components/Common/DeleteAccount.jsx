import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldAlert, Trash2, ArrowLeft, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

const DeleteAccount = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (!token) {
            toast.error("Please sign in first to delete your account.");
            navigate('/login');
            return;
        }

        try {
            setIsDeleting(true);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
            
            await axios.delete(`${backendUrl}/api/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    idToken: token
                }
            });

            toast.success("Your account and all associated data have been permanently deleted.");
            
            // Clear local storage and session
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

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 md:p-12 font-sans selection:bg-red-900 selection:text-white">
            <div className="max-w-3xl mx-auto">
                <button 
                    onClick={() => navigate(-1)}
                    className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                        <ShieldAlert size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-rose-400 to-pink-500 bg-clip-text text-transparent tracking-tight">
                            Account Deletion & Data Privacy
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium">
                            Permanent removal of your LearnProof AI account and all associated data
                        </p>
                    </div>
                </div>

                <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
                    {/* Active Deletion Card */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Trash2 size={18} className="text-red-400" />
                                    <span>Delete Account Instantly</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {user ? (
                                        <>Currently signed in as: <strong className="text-white">{user.email || user.name}</strong></>
                                    ) : (
                                        "Sign in to delete your account directly inside the app."
                                    )}
                                </p>
                            </div>

                            {user ? (
                                <button
                                    onClick={() => setIsConfirmOpen(true)}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete My Account</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
                                >
                                    <Lock size={14} />
                                    <span>Sign In First</span>
                                </button>
                            )}
                        </div>

                        <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl text-xs text-red-300 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <strong>Warning:</strong> Deleting your account is immediate and irreversible. All your study progress, playlist bookmarks, AI chat benchmark history, earned certificates, and community notes will be erased from our database.
                            </div>
                        </div>
                    </div>

                    {/* What Data is Deleted */}
                    <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
                        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span>What Data Is Permanently Erased</span>
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                            <li className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                                <strong className="text-slate-200 block mb-0.5">Profile & OAuth Identifiers</strong>
                                Your name, email, profile picture, and Google/Apple authentication tokens.
                            </li>
                            <li className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                                <strong className="text-slate-200 block mb-0.5">Learning History & Roadmaps</strong>
                                Saved playlists, progress milestones, and watch time statistics.
                            </li>
                            <li className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                                <strong className="text-slate-200 block mb-0.5">AI Summaries & Notes</strong>
                                Auto-generated PDF notes, Ask-AI query logs, and benchmark scores.
                            </li>
                            <li className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                                <strong className="text-slate-200 block mb-0.5">Social & Room Activity</strong>
                                Community posts, comments, friend requests, and room participations.
                            </li>
                        </ul>
                    </section>

                    {/* Retention Policy */}
                    <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm text-xs text-slate-400">
                        <h2 className="text-base font-bold text-white mb-2">Compliance & Data Retention</h2>
                        <p className="leading-relaxed">
                            In accordance with Apple App Store Review Guideline 5.1.1(v) and GDPR/CCPA standards, LearnProof AI provides automated real-time account deletion. We do not retain residual copies of your personal data on active servers once initiated.
                        </p>
                    </section>
                </div>

                {/* Double Confirmation Modal */}
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                                <AlertTriangle size={24} />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
                                <p className="text-xs text-slate-400">
                                    Are you sure you want to permanently delete your LearnProof account?
                                </p>
                            </div>

                            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-[11px] text-red-300">
                                Type <strong>DELETE</strong> below to confirm.
                            </div>

                            <input 
                                type="text" 
                                placeholder="Type DELETE to confirm" 
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                            />

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsConfirmOpen(false);
                                        setConfirmText('');
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={confirmText.trim() !== 'DELETE' || isDeleting}
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 text-center text-slate-500 text-xs">
                    &copy; {new Date().getFullYear()} LearnProof AI. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default DeleteAccount;
