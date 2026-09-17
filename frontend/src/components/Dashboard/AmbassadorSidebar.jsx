import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Target,
    School,
    TrendingUp,
    Sparkles,
    Mic,
    Gift,
    Trophy,
    Rocket,
    Users,
    Edit3,
    Copy,
    Check,
    X,
    BookOpen,
    ArrowLeft,
    ExternalLink,
    Zap,
    Share2
} from 'lucide-react';
import UserAvatar from '../Common/UserAvatar.jsx';
import toast from 'react-hot-toast';

export default function AmbassadorSidebar({
    isOpen,
    onClose,
    activeSection,
    onNavigateSection,
    referralData,
    currentTier,
    onOpenCustomizeModal
}) {
    const [copied, setCopied] = React.useState(false);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?ref=${referralData?.referralCode || ''}`
        : '';

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Ambassador link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} />, count: null },
        { id: 'missions', label: 'Missions & Tasks', icon: <Target size={17} />, count: 'Active' },
        { id: 'my-campus', label: 'My Campus', icon: <School size={17} />, count: referralData?.targetCollege ? 'Hub' : null },
        { id: 'my-impact', label: 'Campus Impact', icon: <TrendingUp size={17} />, count: referralData?.activeLearners ? `${referralData.activeLearners} Active` : null },
        { id: 'ambassador-kit', label: 'Ambassador Kit', icon: <Sparkles size={17} />, count: 'Templates' },
        { id: 'pitch-and-faqs', label: 'Pitch & FAQs', icon: <Mic size={17} />, count: '30s Pitch' },
        { id: 'milestones', label: 'Rewards Roadmap', icon: <Gift size={17} />, count: currentTier?.badge },
        { id: 'leaderboard', label: 'Leaderboard & XP', icon: <Trophy size={17} />, count: `${referralData?.xp || 120} XP` },
        { id: 'updates-community', label: 'Updates & Briefs', icon: <Rocket size={17} />, count: 'New' },
        { id: 'my-profile', label: 'Ambassador Profile', icon: <Users size={17} />, count: null }
    ];

    const handleItemClick = (id) => {
        onNavigateSection(id);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-300"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200/80
                    flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* ── Top Header & Branding ── */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src="/LP_logo.png" alt="LearnProof" className="h-8 w-auto object-contain" />
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-extrabold text-[10px] tracking-wider uppercase border border-orange-200">
                            Ambassador Hub
                        </span>
                    </Link>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 lg:hidden cursor-pointer"
                        title="Close Sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar">
                    {/* Ambassador Profile & Tier Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80 shadow-2xs">
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                user={{ name: referralData?.creatorName || 'Ambassador' }}
                                size={40}
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm text-gray-900 truncate">
                                    {referralData?.creatorName || 'Ambassador'}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 mt-0.5">
                                    <span>{currentTier?.badge}</span>
                                    <span className="truncate">{currentTier?.name || 'Ambassador'}</span>
                                </div>
                            </div>
                        </div>

                        {referralData?.targetCollege && (
                            <div className="mt-2.5 pt-2 border-t border-orange-100 flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 truncate">
                                <School size={13} className="text-orange-500 shrink-0" />
                                <span className="truncate">{referralData.targetCollege}</span>
                            </div>
                        )}

                        {/* Quick Code Badge */}
                        <div className="mt-3 flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-orange-100 shadow-2xs">
                            <span className="font-mono text-xs font-black text-orange-600 tracking-wider truncate">
                                {referralData?.referralCode || '...'}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="p-1 text-gray-400 hover:text-orange-600 transition-colors cursor-pointer"
                                title="Copy ambassador link"
                            >
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="space-y-1">
                        <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Command Center
                        </div>
                        {navItems.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                                        ${isActive
                                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                                            : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={isActive ? 'text-white' : 'text-orange-500'}>
                                            {item.icon}
                                        </span>
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                    {item.count !== null && (
                                        <span
                                            className={`
                                                text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0
                                                ${isActive
                                                    ? 'bg-white/25 text-white'
                                                    : 'bg-orange-100 text-orange-700'
                                                }
                                            `}
                                        >
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Bottom Section: Return to Student App ── */}
                <div className="p-3.5 border-t border-gray-100 bg-slate-50/70 space-y-1.5">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/15 active:scale-95 transition cursor-pointer"
                    >
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        <span>{copied ? 'Link Copied!' : 'Copy Campus Link'}</span>
                    </button>

                    <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-orange-50 hover:text-orange-600 border border-gray-200 shadow-2xs transition active:scale-95"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={15} className="text-orange-500" />
                            <span>Student App</span>
                        </div>
                        <ExternalLink size={13} className="text-gray-400" />
                    </Link>
                </div>
            </aside>
        </>
    );
}
