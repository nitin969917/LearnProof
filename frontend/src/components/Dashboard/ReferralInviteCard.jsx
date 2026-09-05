import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Share2, Copy, Check, Users, Sparkles, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralInviteCard({ compact = false }) {
    const { token } = useAuth();
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCode = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/my-code`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data?.success) {
                    setReferralData(res.data);
                }
            } catch (err) {
                console.debug('Failed to fetch personal referral code:', err?.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCode();
    }, [token]);

    const handleCopy = () => {
        if (!referralData?.referralCode) return;
        const origin = window.location.origin;
        const shareUrl = `${origin}/?ref=${referralData.referralCode}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Referral link copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        if (!referralData?.referralCode) return;
        const shareUrl = `${window.location.origin}/?ref=${referralData.referralCode}`;
        const text = encodeURIComponent(`Hey! Check out LearnProof AI to learn from any YouTube playlist with AI notes, quizzes, and study rooms: ${shareUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    if (loading || !referralData) {
        return null; // Silent if loading or unavailable
    }

    if (compact) {
        return (
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                        <Gift size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Invite Friends</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Your code: <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">{referralData.referralCode}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-purple-500/10 dark:from-orange-950/40 dark:via-gray-900 dark:to-purple-950/30 border border-orange-200/80 dark:border-orange-800/50 rounded-2xl p-5 shadow-sm">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 mt-0.5">
                        <Gift size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={13} /> Refer & Learn Together
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                {referralData.signupCount} Friends Joined
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                            Invite classmates and earn community recognition
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Share your personal link to collaborate in live study rooms and track group streaks.
                        </p>
                    </div>
                </div>

                {/* Code Box & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800/90 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="text-xs text-gray-400 uppercase font-semibold">Code:</span>
                        <span className="font-mono text-sm font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                            {referralData.referralCode}
                        </span>
                    </div>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition active:scale-95"
                    >
                        {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                        <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>

                    <button
                        onClick={handleShareWhatsApp}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
                        title="Share on WhatsApp"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
