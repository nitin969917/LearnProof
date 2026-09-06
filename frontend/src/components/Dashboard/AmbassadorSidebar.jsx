import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Share2,
    Trophy,
    Sparkles,
    Users,
    BookOpen,
    Edit3,
    Copy,
    Check,
    X,
    QrCode,
    School,
    ArrowLeft,
    ExternalLink,
    Gift
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
    const navigate = useNavigate();
    const [copied, setCopied] = React.useState(false);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?ref=${referralData?.referralCode || ''}`
        : '';

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Referral link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const navItems = [
        { id: 'overview', label: 'Overview & KPIs', icon: <LayoutDashboard size={18} />, count: null },
        { id: 'share-link', label: 'Share Link & QR', icon: <Share2 size={18} />, count: null },
        { id: 'milestones', label: 'Rewards & Roadmap', icon: <Trophy size={18} />, count: currentTier?.name },
        { id: 'toolkit', label: 'Promotional Toolkit', icon: <Sparkles size={18} />, count: 'Templates' },
        { id: 'signups', label: 'Referred Students', icon: <Users size={18} />, count: referralData?.recentSignups?.length || 0 }
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
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src="/LP_logo.png" alt="LearnProof" className="h-9 w-auto object-contain" />
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-extrabold text-[10px] tracking-wider uppercase border border-orange-200">
                            Ambassador
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
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar">
                    {/* Ambassador Profile & Tier Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/8 via-amber-500/5 to-transparent border border-orange-200/80 shadow-xs">
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                src={referralData?.creatorPic}
                                name={referralData?.creatorName || 'Ambassador'}
                                className="w-11 h-11 rounded-2xl border-2 border-orange-300 shadow-sm shrink-0"
                                textClassName="text-base font-black"
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-sm text-gray-900 truncate">
                                    {referralData?.creatorName || 'Ambassador'}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 mt-0.5">
                                    <span>{currentTier?.badge}</span>
                                    <span className="truncate">{currentTier?.name || 'Ambassador'}</span>
                                </div>
                            </div>
                        </div>

                        {referralData?.targetCollege && (
                            <div className="mt-2.5 pt-2 border-t border-orange-100 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 truncate">
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
                                title="Copy referral link"
                            >
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="space-y-1">
                        <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Portal Navigation
                        </div>
                        {navItems.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    className={`
                                        w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                                        ${isActive
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
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
                                                text-[10px] font-black px-2 py-0.5 rounded-full shrink-0
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

                    {/* Quick Tools Section */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Quick Actions
                        </div>
                        <button
                            onClick={() => {
                                if (onOpenCustomizeModal) onOpenCustomizeModal();
                                if (onClose) onClose();
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-200/80 transition cursor-pointer"
                        >
                            <Edit3 size={16} className="text-orange-500" />
                            <span>Customize Code</span>
                        </button>

                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/15 active:scale-95 transition cursor-pointer"
                        >
                            {copied ? <Check size={15} /> : <Share2 size={15} />}
                            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Bottom Section: Return to Student App ── */}
                <div className="p-4 border-t border-gray-100 bg-slate-50/70 space-y-2">
                    <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-orange-50 hover:text-orange-600 border border-gray-200 shadow-2xs transition active:scale-95"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-orange-500" />
                            <span>Go to Student App</span>
                        </div>
                        <ExternalLink size={14} className="text-gray-400" />
                    </Link>

                    <Link
                        to="/"
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to LearnProof Home</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
