import React from 'react';
import { School, Edit3, Zap, Share2, MessageCircle, ArrowRight, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HubHeader({
    user,
    referralData,
    currentTier,
    refreshing,
    onRefresh,
    onOpenCustomizeModal
}) {
    const collegeName = referralData?.targetCollege;
    const xp = referralData?.xp || 50;
    const nextLevelXp = referralData?.nextLevelXp || 500;
    const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?ref=${referralData?.referralCode || ''}`
        : '';

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        toast.success(`Copied! Code: ${referralData?.referralCode}`);
    };

    const handleWhatsAppShare = () => {
        const text = `Hey everyone! 👋 Exam prep & YouTube courses getting messy? Check out LearnProof AI 🚀\n\n1️⃣ Turn ANY YouTube course or lecture into organized notes & flashcards instantly.\n2️⃣ Pass quick quizzes & claim verified certificates!\n3️⃣ Join 24/7 Live Rooms to study with peers.\n\n👉 Join via our campus link: ${shareUrl}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-4">
            {/* Top Identity & Welcome Card */}
            <div className="relative overflow-hidden bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                {/* Decorative subtle ambient tint */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 via-amber-50/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    {/* Row 1: Badges & Profile Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active Ambassador
                            </span>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                                <span>{currentTier.badge}</span>
                                <span>{currentTier.name}</span>
                            </span>

                            {collegeName ? (
                                <button
                                    onClick={onOpenCustomizeModal}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                    title="Click to change college"
                                >
                                    <School size={13} className="text-slate-500" />
                                    <span>{collegeName}</span>
                                    <Edit3 size={11} className="text-slate-400" />
                                </button>
                            ) : (
                                <button
                                    onClick={onOpenCustomizeModal}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer animate-pulse"
                                >
                                    <School size={13} />
                                    <span>+ Set Your College</span>
                                </button>
                            )}
                        </div>

                        {/* Edit profile link */}
                        <button
                            onClick={onOpenCustomizeModal}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition cursor-pointer self-start sm:self-auto"
                        >
                            <Edit3 size={13} />
                            <span>Edit Referral Code & Details</span>
                        </button>
                    </div>

                    {/* Row 2: Headline Greeting & Subtitle */}
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            👋 Welcome, {referralData?.creatorName || user?.name || 'Ambassador'}!
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 font-medium mt-1 max-w-2xl">
                            Lead LearnProof AI at your campus. Guide classmates, organize student initiatives, and unlock startup experience & verified credentials.
                        </p>
                    </div>

                    {/* Row 3: XP Progression Bar */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/30 border border-orange-100/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                                {currentTier.badge}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                                        {currentTier.name}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-xs font-bold text-orange-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-orange-200/60 shadow-2xs">
                                        <Zap size={12} className="fill-orange-500" /> {xp.toLocaleString()} XP
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium mt-0.5">
                                    {nextLevelXp - xp > 0
                                        ? `${(nextLevelXp - xp).toLocaleString()} XP needed to unlock next tier milestone`
                                        : 'Top Milestone Reached! 🎉'}
                                </p>
                            </div>
                        </div>

                        {/* Progress meter */}
                        <div className="w-full md:w-80 flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-gray-500">Tier Progress</span>
                                <span className="text-orange-600 font-mono">{xpPercent}% ({xp}/{nextLevelXp} XP)</span>
                            </div>
                            <div className="w-full h-3 bg-white rounded-full overflow-hidden p-0.5 border border-orange-200/80 shadow-2xs">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-amber-400 rounded-full transition-all duration-500 shadow-2xs"
                                    style={{ width: `${Math.max(4, xpPercent)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 4: 3-Step Quick Launch Shortcuts for Ambassadors */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {/* 1. WhatsApp Share */}
                        <button
                            onClick={handleWhatsAppShare}
                            className="group p-3.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 transition-all text-left flex items-center justify-between cursor-pointer hover:shadow-xs"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <MessageCircle size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900 truncate">
                                        Share on WhatsApp
                                    </div>
                                    <div className="text-[11px] text-emerald-700 font-medium truncate">
                                        Post in college groups
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={15} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>

                        {/* 2. Copy Code Pill */}
                        <button
                            onClick={handleCopy}
                            className="group p-3.5 rounded-2xl bg-orange-50/60 hover:bg-orange-50 border border-orange-200/80 transition-all text-left flex items-center justify-between cursor-pointer hover:shadow-xs"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs font-mono font-black text-xs">
                                    <Share2 size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                                        <span>Code:</span>
                                        <span className="font-mono text-orange-600 bg-white px-1.5 py-0.5 rounded border border-orange-200 text-[11px]">
                                            {referralData?.referralCode || '...'}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-orange-700 font-medium truncate">
                                        1-click copy campus link
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={15} className="text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>

                        {/* 3. Week Directive Shortcut */}
                        <a
                            href="#missions"
                            className="group p-3.5 rounded-2xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200/80 transition-all text-left flex items-center justify-between hover:shadow-xs"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Target size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900 truncate">
                                        Weekly Missions
                                    </div>
                                    <div className="text-[11px] text-indigo-700 font-medium truncate">
                                        Earn up to +165 XP
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={15} className="text-indigo-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
