import React from 'react';
import { School, Users, Zap, Trophy, Plus, Calendar, CheckCircle2, ChevronRight, Sparkles, Presentation } from 'lucide-react';

export default function MyCampusSection({
    referralData,
    onOpenActivityModal,
    onOpenSessionModal
}) {
    const collegeName = referralData?.targetCollege || 'Sardar Patel Institute of Technology';
    const studentsReached = referralData?.studentsReached || 340;
    const usersJoined = referralData?.signupCount || referralData?.studentsJoined || 82;
    const activeLearners = referralData?.activeLearners || 46;
    const goalTarget = referralData?.campusGoal?.target || 200;
    const goalCurrent = referralData?.campusGoal?.current || usersJoined;
    const goalPercent = Math.min(100, Math.round((goalCurrent / goalTarget) * 100));

    // Combine system sample activities with user logged activities
    const logged = referralData?.loggedActivities || [];
    const completedActivities = [
        ...logged,
        ...(logged.length === 0 ? [
            {
                id: 'sys-1',
                title: 'Shared platform with CSE students',
                date: '18 Sep',
                studentsReached: 45,
                type: 'outreach',
                proofUrl: null
            },
            {
                id: 'sys-2',
                title: 'Collected student feedback on AI notes',
                date: '17 Sep',
                studentsReached: 12,
                type: 'feedback',
                proofUrl: null
            }
        ] : [])
    ];

    const upcomingActivities = [
        {
            id: 'up-1',
            title: 'LearnProof Introduction Session & AI Demo',
            date: '22 Sep',
            location: collegeName,
            status: 'upcoming'
        }
    ];

    return (
        <section id="my-campus" className="space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                {/* Campus Header & Primary Triggers */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
                            <School size={14} className="text-blue-500" />
                            Campus Director Hub
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            🏫 My Campus: {collegeName}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Track real adoption, organize workshops, and own LearnProof's presence at your college.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onOpenActivityModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Add Activity</span>
                        </button>

                        <button
                            onClick={onOpenSessionModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs sm:text-sm rounded-2xl transition active:scale-95 cursor-pointer"
                        >
                            <Presentation size={15} />
                            <span>Request College Session</span>
                        </button>
                    </div>
                </div>

                {/* 4-Metric Grid */}
                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                            Students Reached
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-gray-900">
                                {studentsReached.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">Outreach</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                            LearnProof Users
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-gray-900">
                                {usersJoined.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-blue-600">Signed Up</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-700 block">
                            Active Learners
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-orange-600">
                                {activeLearners.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-orange-600">Daily/Weekly</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                            Campus Rank
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-gray-900">
                                #3
                            </span>
                            <span className="text-xs font-semibold text-purple-600">Top Tier</span>
                        </div>
                    </div>
                </div>

                {/* Campus Community Milestone Goal */}
                <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-orange-700 block">
                                Campus Community Goal
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-gray-900">
                                {goalCurrent} / {goalTarget} verified students
                            </h3>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-orange-600 text-xs font-black border border-orange-200 shadow-2xs">
                            <Sparkles size={13} /> {goalPercent}% Milestone Unlocked
                        </div>
                    </div>

                    {/* Milestone bar */}
                    <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden p-0.5 border border-orange-200">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${goalPercent}%` }}
                        />
                    </div>
                    <p className="text-xs font-semibold text-gray-600 mt-2">
                        🚀 Your campus is <strong className="text-orange-600">{goalPercent}%</strong> toward its first official campus community milestone ({goalTarget} learners).
                    </p>
                </div>

                {/* Activities Sub-Section */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                            <Calendar size={18} className="text-orange-500" />
                            Campus Activities & Operations
                        </h3>
                        <button
                            onClick={onOpenActivityModal}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1"
                        >
                            + Record Activity
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Upcoming */}
                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                                    Upcoming Event
                                </span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    Scheduled
                                </span>
                            </div>

                            {upcomingActivities.map((act) => (
                                <div key={act.id} className="space-y-1">
                                    <h4 className="text-sm font-bold text-gray-900">
                                        🎤 {act.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {act.date} • {act.location}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Completed Activities */}
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                                    Completed Activities ({completedActivities.length})
                                </span>
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Logged
                                </span>
                            </div>

                            <div className="space-y-2.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                {completedActivities.slice(0, 4).map((act, index) => (
                                    <div key={act.id || index} className="flex items-start justify-between text-xs">
                                        <div className="space-y-0.5">
                                            <span className="font-semibold text-gray-800 block">
                                                ✅ {act.title}
                                            </span>
                                            <span className="text-[11px] text-gray-500">
                                                {act.date ? new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                                                {act.studentsReached ? ` • ${act.studentsReached} reached` : ''}
                                            </span>
                                        </div>
                                        {act.proofUrl && (
                                            <a
                                                href={act.proofUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] font-bold text-orange-600 hover:underline"
                                            >
                                                Proof ↗
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
