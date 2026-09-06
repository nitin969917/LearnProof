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

    const getShareUrl = () => {
        if (!referralData?.referralCode) return '';
        const origin = window.location.origin;
        return `${origin}/?ref=${referralData.referralCode}`;
    };

    const handleCopy = () => {
        const shareUrl = getShareUrl();
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Referral link copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShare = async () => {
        const shareUrl = getShareUrl();
        if (!shareUrl) return;

        const shareData = {
            title: 'LearnProof AI - Master Any Subject',
            text: `Hey! Join me on LearnProof AI to learn from any YouTube playlist with AI notes, quizzes, and live study rooms:`,
            url: shareUrl,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.debug('Native share error:', err);
                }
            }
        }

        // WhatsApp fallback
        const text = encodeURIComponent(`Hey! Join me on LearnProof AI to learn from any YouTube playlist with AI notes, quizzes, and live study rooms: ${shareUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    if (loading || !referralData) {
        return null;
    }

    if (compact) {
        return (
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                        <Gift size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Invite Friends</div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                            Code: <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">{referralData.referralCode}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/[0.07] via-amber-500/[0.04] to-orange-500/[0.02] dark:from-orange-950/30 dark:via-gray-900 dark:to-gray-900 border border-orange-200/70 dark:border-orange-900/30 rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm transition-all duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-orange-400/10 dark:bg-orange-500/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 rounded-full bg-amber-400/10 dark:bg-amber-500/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 mt-0.5">
                            <Gift size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] sm:text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={12} className="text-amber-500" /> Refer & Learn Together
                                </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white leading-snug">
                                Invite classmates and earn recognition
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                Share your personal invite link to collaborate in live study rooms and track group streaks.
                            </p>
                        </div>
                    </div>

                    {/* Joined Count Pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-bold text-[10px] sm:text-[11px] shrink-0">
                        <Users size={12} />
                        <span>{referralData.signupCount || 0} Joined</span>
                    </div>
                </div>

                {/* Bottom Action Bar: Code Chip + Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-orange-100/60 dark:border-gray-800">
                    {/* Code Display Chip */}
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800/90 px-3.5 py-2 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-xs flex-1 sm:flex-initial">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Code:</span>
                            <span className="font-mono text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400 tracking-wider">
                                {referralData.referralCode}
                            </span>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-1 text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                            title="Copy code"
                        >
                            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-orange-500/15 active:scale-95 transition-all cursor-pointer"
                        >
                            {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-500/15 active:scale-95 transition-all cursor-pointer"
                            title="Share via WhatsApp or Native Share"
                        >
                            <Share2 size={14} />
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

