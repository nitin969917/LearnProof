import React from 'react';
import { User, School, MapPin, Calendar, Award, CheckCircle2, ShieldCheck, Zap, TrendingUp, Users } from 'lucide-react';
import UserAvatar from '../Common/UserAvatar.jsx';

export default function AmbassadorProfileCard({
    user,
    referralData,
    currentTier,
    onOpenCustomizeModal
}) {
    const name = referralData?.creatorName || user?.name || 'Ambassador Lead';
    const college = referralData?.targetCollege || 'Campus Ambassador';
    const joinedAt = referralData?.createdAt
        ? new Date(referralData.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : 'September 2026';

    const signups = referralData?.signupCount || 0;
    const reached = referralData?.studentsReached || 0;
    const activitiesCount = (referralData?.loggedActivities?.length || 0) + 2;

    const badges = [
        {
            title: 'First 10 Students',
            description: 'Onboarded 10+ active learners',
            icon: '🏅',
            isEarned: signups >= 10
        },
        {
            title: 'Campus Builder',
            description: 'Represented college in LearnProof Hub',
            icon: '🏫',
            isEarned: Boolean(referralData?.targetCollege)
        },
        {
            title: 'Feedback Contributor',
            description: 'Submitted direct student product insights',
            icon: '💡',
            isEarned: (referralData?.feedbackSubmitted || 0) > 0
        },
        {
            title: 'Workshop Host',
            description: 'Organized campus session / tech club collab',
            icon: '🎤',
            isEarned: (referralData?.loggedActivities?.some(a => a.type === 'workshop') || false)
        }
    ];

    return (
        <section id="my-profile" className="space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
                            <User size={13} />
                            Ambassador Portfolio
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            👤 Ambassador Profile
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Official credentials and verified impact record for your resume and LinkedIn.
                        </p>
                    </div>

                    <button
                        onClick={onOpenCustomizeModal}
                        className="px-4 py-2 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer border border-gray-200"
                    >
                        Edit Profile Details
                    </button>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Identity card */}
                    <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <UserAvatar user={{ name: name, profile_pic: user?.profile_pic }} size={64} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-gray-900">{name}</h3>
                                        <ShieldCheck size={18} className="text-orange-500" />
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-orange-700 font-black text-xs border border-orange-200 mt-1 shadow-2xs">
                                        <span>{currentTier.badge}</span>
                                        <span>{currentTier.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 font-medium">
                                <div className="flex items-center gap-2">
                                    <School size={15} className="text-gray-400" />
                                    <span>{college}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={15} className="text-gray-400" />
                                    <span>Ambassador Since {joinedAt}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-[11px] text-gray-500">
                                    <span className="font-bold text-gray-700">Code:</span>
                                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-orange-600 font-bold">
                                        {referralData?.referralCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Verified Impact numbers */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-orange-200/80 text-center">
                            <div>
                                <span className="text-lg font-black text-gray-900 block">{signups}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-500">Learners</span>
                            </div>
                            <div>
                                <span className="text-lg font-black text-gray-900 block">{reached}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-500">Reached</span>
                            </div>
                            <div>
                                <span className="text-lg font-black text-gray-900 block">{activitiesCount}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-500">Activities</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Achievements & Badges */}
                    <div className="lg:col-span-7 space-y-4">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-400 block">
                            Earned Credentials & Badges
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {badges.map((badge, idx) => (
                                <div
                                    key={idx}
                                    className={`
                                        p-4 rounded-2xl border flex items-start gap-3 transition-all
                                        ${badge.isEarned
                                            ? 'bg-white border-gray-200/90 shadow-2xs'
                                            : 'bg-gray-50/60 border-dashed border-gray-200 opacity-60'
                                        }
                                    `}
                                >
                                    <span className="text-2xl shrink-0">{badge.icon}</span>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-xs sm:text-sm font-black text-gray-900">{badge.title}</h4>
                                            {badge.isEarned && <CheckCircle2 size={13} className="text-emerald-500" />}
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                            {badge.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
