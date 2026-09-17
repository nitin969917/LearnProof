import React from 'react';
import { School, Users, Zap, Trophy, Plus, Calendar, CheckCircle2, ChevronRight, Sparkles, Presentation, Edit3 } from 'lucide-react';

export default function MyCampusSection({
    referralData,
    onOpenActivityModal,
    onOpenSessionModal,
    onOpenCustomizeModal
}) {
    const collegeName = referralData?.targetCollege;
    const studentsReached = referralData?.studentsReached || 0;
    const usersJoined = referralData?.signupCount || referralData?.studentsJoined || 0;
    const activeLearners = referralData?.activeLearners || 0;
    const goalTarget = referralData?.campusGoal?.target || 200;
    const goalCurrent = referralData?.campusGoal?.current || usersJoined;
    const goalPercent = goalTarget > 0 && goalCurrent > 0 ? Math.min(100, Math.round((goalCurrent / goalTarget) * 100)) : 0;

    const completedActivities = referralData?.loggedActivities || [];
    const sessionRequests = referralData?.sessionRequests || [];

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
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                                🏫 My Campus: {collegeName || 'No College Selected'}
                            </h2>
                            {!collegeName && (
                                <button
                                    onClick={onOpenCustomizeModal}
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition cursor-pointer"
                                >
                                    <Edit3 size={13} />
                                    <span>Set Your College</span>
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Track real student adoption, record campus activities, and build your campus community.
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
                            Campus Goal
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-gray-900">
                                {goalPercent}%
                            </span>
                            <span className="text-xs font-semibold text-purple-600">Milestone</span>
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
                        {collegeName ? (
                            <>🚀 <strong className="text-gray-900">{collegeName}</strong> is <strong className="text-orange-600">{goalPercent}%</strong> toward its first community milestone ({goalTarget} learners).</>
                        ) : (
                            <>Set your college name to establish your official campus community milestone ({goalTarget} learners).</>
                        )}
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
                        {/* Upcoming / Session Requests */}
                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                                    College Workshops & Sessions
                                </span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    Official
                                </span>
                            </div>

                            {sessionRequests.length > 0 ? (
                                <div className="space-y-2">
                                    {sessionRequests.map((sess) => (
                                        <div key={sess.id} className="p-2.5 bg-white/80 rounded-xl border border-amber-200 text-xs space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-900">🎤 {sess.sessionType?.replace('_', ' ')}</span>
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full capitalize">{sess.status}</span>
                                            </div>
                                            <p className="text-gray-500 text-[11px]">
                                                {sess.college} • {sess.expectedStudents} students expected
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-1.5 py-2">
                                    <h4 className="text-xs font-bold text-gray-900">
                                        Want to host an official session or workshop?
                                    </h4>
                                    <p className="text-[11px] text-gray-500 leading-relaxed">
                                        Coordinate a demo with your college coding or tech club. LearnProof provides speakers, slide decks & swag!
                                    </p>
                                    <button
                                        onClick={onOpenSessionModal}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline pt-1 cursor-pointer"
                                    >
                                        <span>Request a Session</span>
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            )}
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

                            {completedActivities.length > 0 ? (
                                <div className="space-y-2.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                    {completedActivities.map((act, index) => (
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
                            ) : (
                                <div className="py-4 text-center space-y-1">
                                    <span className="text-xs font-bold text-gray-700 block">No activities recorded yet</span>
                                    <p className="text-[11px] text-gray-500">
                                        Click "+ Add Activity" above to record class announcements, club meets, or posters!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
