import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Zap, Award, Users, Filter, Medal, School, ChevronRight, Flame } from 'lucide-react';
import UserAvatar from '../Common/UserAvatar.jsx';

export default function GamifiedLeaderboard({
    referralData,
    token
}) {
    const [scope, setScope] = useState('college'); // 'college' | 'india'
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);

    const collegeName = referralData?.targetCollege || 'College Campus';
    const xp = referralData?.xp || 320;
    const nextLevelXp = referralData?.nextLevelXp || 500;
    const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

    const fetchLeaderboard = async (selectedScope) => {
        setLoading(true);
        try {
            const params = {
                scope: selectedScope,
                ...(selectedScope === 'college' ? { college: collegeName } : {})
            };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/leaderboard`, {
                params,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.data?.success && res.data?.leaderboard) {
                setLeaderboard(res.data.leaderboard);
            }
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(scope);
    }, [scope, collegeName]);

    const xpEarningRules = [
        { activity: 'Verified Student Joined', xp: '+10 XP', icon: '🎓' },
        { activity: 'Student Feedback Submitted', xp: '+5 XP', icon: '💬' },
        { activity: 'Campus Activity Logged', xp: '+20 XP', icon: '📢' },
        { activity: 'Student Workshop / Session', xp: '+50 XP', icon: '🎤' },
        { activity: 'College Club Collaboration', xp: '+50 XP', icon: '🤝' },
        { activity: 'Monthly Mission Completed', xp: '+100 XP', icon: '🎯' }
    ];

    // Fallback data if API returns empty array for new college
    const displayList = leaderboard.length > 0 ? leaderboard : [
        { rank: 1, name: 'Rahul Sharma', college: collegeName, signups: 34, xp: 482 },
        { rank: 2, name: 'Priya Mehta', college: collegeName, signups: 28, xp: 420 },
        { rank: 3, name: referralData?.creatorName || 'You (Avishkar)', college: collegeName, signups: referralData?.signupCount || 12, xp: xp, isCurrent: true },
        { rank: 4, name: 'Sneha Patil', college: collegeName, signups: 16, xp: 340 }
    ];

    return (
        <section id="leaderboard" className="space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 mb-2">
                            <Trophy size={14} className="text-amber-500" />
                            Ambassador Recognition
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            🏆 Ambassador Leaderboard & XP System
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Friendly campus and national competition based on overall community growth, activities, and verified learners.
                        </p>
                    </div>

                    {/* Scope Selector */}
                    <div className="inline-flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
                        <button
                            onClick={() => setScope('college')}
                            className={`
                                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer
                                ${scope === 'college' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}
                            `}
                        >
                            <School size={13} />
                            <span>My College ({collegeName.split(' ')[0]})</span>
                        </button>
                        <button
                            onClick={() => setScope('india')}
                            className={`
                                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer
                                ${scope === 'india' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}
                            `}
                        >
                            <Medal size={13} />
                            <span>All India</span>
                        </button>
                    </div>
                </div>

                {/* Two Column Layout: Leaderboard + XP Explainer */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 7 cols: Leaderboard */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                            <span>Ambassador</span>
                            <div className="flex gap-6">
                                <span>Signups</span>
                                <span>Total XP</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {displayList.map((item, idx) => {
                                const isCurrent = item.isCurrent || (referralData?.referralCode && item.code === referralData.referralCode);
                                const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                                return (
                                    <div
                                        key={idx}
                                        className={`
                                            flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all
                                            ${isCurrent
                                                ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-500/20 shadow-xs'
                                                : 'bg-white border-gray-200/90 hover:border-orange-200'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-7 text-center font-black text-sm text-gray-700">
                                                {rankIcon}
                                            </span>
                                            <UserAvatar user={{ name: item.name, profile_pic: item.avatar }} size={32} />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-xs sm:text-sm text-gray-900 truncate block">
                                                        {item.name}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500 text-white">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-400 truncate block">
                                                    {item.college || collegeName}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-right shrink-0">
                                            <span className="text-xs font-bold text-gray-500 w-12">
                                                {item.signups || 0}
                                            </span>
                                            <span className="text-xs font-black text-orange-600 flex items-center gap-1 w-16 justify-end">
                                                <Zap size={12} /> {item.xp || 0}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right 5 cols: XP Engine Card */}
                    <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-orange-200 space-y-4">
                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-700">
                                <Zap size={14} />
                                <span>LearnProof XP Engine</span>
                            </div>
                            <h3 className="text-base font-black text-gray-900 mt-1">
                                Earn XP & Level Up
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Every action on campus directly converts into XP and accelerates your leadership status.
                            </p>
                        </div>

                        {/* XP Breakdown Rules */}
                        <div className="space-y-2 bg-white/90 p-3.5 rounded-2xl border border-orange-200/80">
                            {xpEarningRules.map((rule, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center gap-2">
                                        <span>{rule.icon}</span>
                                        <span className="font-semibold text-gray-800">{rule.activity}</span>
                                    </div>
                                    <span className="font-black text-orange-600">{rule.xp}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 text-[11px] text-gray-500 font-medium leading-relaxed">
                            💡 High XP ambassadors get featured on our official Instagram, receive direct recommendation letters from LearnProof leadership, and unlock creator stipends.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
