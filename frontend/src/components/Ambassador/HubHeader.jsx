import React from 'react';
import { Sparkles, School, RefreshCw, Edit3, BookOpen, CheckCircle, ShieldCheck, Flame, Zap } from 'lucide-react';
import UserAvatar from '../Common/UserAvatar.jsx';

export default function HubHeader({
    user,
    referralData,
    currentTier,
    refreshing,
    onRefresh,
    onOpenCustomizeModal
}) {
    const collegeName = referralData?.targetCollege || 'Campus Ambassador';
    const xp = referralData?.xp || 120;
    const nextLevelXp = referralData?.nextLevelXp || 500;
    const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

    return (
        <div className="space-y-4">
            {/* Top Identity & Welcome Card */}
            <div className="relative overflow-hidden bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                {/* Decorative subtle ambient tint */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/50 via-amber-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Identity & Badges */}
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                You're active this month
                            </span>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                                <span>{currentTier.badge}</span>
                                <span>{currentTier.name}</span>
                            </span>

                            {collegeName && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                    <School size={13} className="text-slate-500" />
                                    {collegeName}
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                                👋 Welcome, {referralData?.creatorName || user?.name || 'Ambassador'}!
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 font-medium mt-1">
                                <span className="text-orange-600 font-bold">LearnProof AI Ambassador Hub</span> • Represent LearnProof AI • Build your campus community • Create real impact
                            </p>
                        </div>
                    </div>

                    {/* Right: Quick actions & XP Badge */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition border border-gray-200 shadow-2xs cursor-pointer"
                            title="Refresh Hub Analytics"
                        >
                            <RefreshCw size={17} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                        </button>

                        <button
                            onClick={onOpenCustomizeModal}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs sm:text-sm rounded-2xl border border-orange-200 transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                            <Edit3 size={15} />
                            <span>Edit Profile & Code</span>
                        </button>

                        <a
                            href="/dashboard"
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/20 transition active:scale-95"
                        >
                            <BookOpen size={15} />
                            <span>Student App</span>
                        </a>
                    </div>
                </div>

                {/* Sub-bar: Level & XP Progression */}
                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                            {currentTier.badge}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                                    {currentTier.name}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                    <Zap size={13} /> {xp.toLocaleString()} XP
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {nextLevelXp - xp > 0
                                    ? `${(nextLevelXp - xp).toLocaleString()} XP to unlock next milestone tier`
                                    : 'Top Ambassador Tier Unlocked!'}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full sm:w-72 flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-gray-500">Tier Progress</span>
                            <span className="text-orange-600">{xpPercent}% ({xp}/{nextLevelXp} XP)</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${xpPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
