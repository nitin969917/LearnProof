import React, { useState } from 'react';
import axios from 'axios';
import { Target, CheckCircle2, Circle, ArrowRight, Award, Zap, Users, MessageSquare, Presentation, Rocket, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MissionActionCenter({
    referralData,
    token,
    onTaskStateChange,
    onOpenFeedbackModal,
    onOpenSessionModal
}) {
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    // Initial checklist tasks
    const initialTasks = [
        { id: 'task-groups', label: 'Share LearnProof in 2 relevant college groups', xp: 20 },
        { id: 'task-intro', label: 'Introduce LearnProof to 10 students or batchmates', xp: 30 },
        { id: 'task-learners', label: 'Bring 10 new active learners to the platform', xp: 50 },
        { id: 'task-feedback', label: 'Collect feedback from 5 students using AI Notes', xp: 25 },
        { id: 'task-meetup', label: 'Attend the monthly ambassador community meeting', xp: 40 }
    ];

    const checklistStates = referralData?.checklistStates || {};
    const completedCount = initialTasks.filter(t => checklistStates[t.id]).length;
    const progressPercent = Math.round((completedCount / initialTasks.length) * 100);

    const toggleTask = async (taskId) => {
        if (!token || !referralData?.referralCode) return;
        const currentVal = Boolean(checklistStates[taskId]);
        const newVal = !currentVal;

        setUpdatingTaskId(taskId);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/checklist`,
                {
                    code: referralData.referralCode,
                    taskId,
                    completed: newVal
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                if (newVal) toast.success('Task marked completed! Keep growing your campus.');
                if (onTaskStateChange) {
                    onTaskStateChange(taskId, newVal);
                }
            }
        } catch (err) {
            console.error('Failed to update task:', err);
            toast.error('Could not save task status');
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const categorizedMissions = [
        {
            category: 'Starter Mission',
            color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800',
            badgeBg: 'bg-emerald-500',
            icon: <Users size={16} className="text-emerald-600" />,
            title: 'Get your first 10 students',
            description: 'Onboard 10 peer learners to verify initial campus interest.',
            reward: '🏅 Silver Ambassador Progress',
            progress: `${Math.min(10, referralData?.signupCount || 0)} / 10`,
            isCompleted: (referralData?.signupCount || 0) >= 10
        },
        {
            category: 'Community Mission',
            color: 'border-blue-200 bg-blue-50/50 text-blue-800',
            badgeBg: 'bg-blue-500',
            icon: <Rocket size={16} className="text-blue-600" />,
            title: 'Create awareness among 50 students',
            description: 'Distribute class templates & QR posters in classrooms or labs.',
            reward: '+50 XP Bonus',
            progress: `${Math.min(50, referralData?.studentsReached || 0)} / 50 reached`,
            isCompleted: (referralData?.studentsReached || 0) >= 50
        },
        {
            category: 'Feedback Mission',
            color: 'border-purple-200 bg-purple-50/50 text-purple-800',
            badgeBg: 'bg-purple-500',
            icon: <MessageSquare size={16} className="text-purple-600" />,
            title: 'Collect feedback from 10 students',
            description: 'Gather genuine insights on what students need for semester exams.',
            reward: '+50 XP Bonus',
            progress: `${referralData?.feedbackSubmitted || 0} / 10 collected`,
            action: onOpenFeedbackModal,
            actionLabel: 'Submit Feedback',
            isCompleted: (referralData?.feedbackSubmitted || 0) >= 10
        },
        {
            category: 'Campus Mission',
            color: 'border-amber-200 bg-amber-50/50 text-amber-800',
            badgeBg: 'bg-amber-500',
            icon: <Presentation size={16} className="text-amber-600" />,
            title: 'Organize a LearnProof intro session',
            description: 'Host a short demo or workshop with your college tech or coding club.',
            reward: '+100 XP & Swag Sponsor',
            progress: '1 Session Goal',
            action: onOpenSessionModal,
            actionLabel: 'Request Session',
            isCompleted: (referralData?.loggedActivities?.filter(a => a.type === 'workshop').length || 0) > 0
        },
        {
            category: 'Growth Mission',
            color: 'border-rose-200 bg-rose-50/50 text-rose-800',
            badgeBg: 'bg-rose-500',
            icon: <Award size={16} className="text-rose-600" />,
            title: 'Bring 100 active learners from your campus',
            description: 'Transform your college into an official LearnProof AI flagship campus.',
            reward: 'Special Founder Recognition & Core Invite',
            progress: `${referralData?.activeLearners || 0} / 100 active`,
            isCompleted: (referralData?.activeLearners || 0) >= 100
        }
    ];

    return (
        <section id="missions" className="space-y-6">
            {/* Top Mission Banner & Checklist */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 mb-2">
                            <Target size={14} className="text-orange-500" />
                            Weekly Directive
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            🎯 Your Mission This Week
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Help 25 students discover LearnProof AI and form an active campus cohort.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-orange-50/80 border border-orange-200/80 px-5 py-3.5 rounded-2xl">
                        <div className="text-right">
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 block">
                                Mission Progress
                            </span>
                            <span className="text-lg font-black text-gray-900">
                                {completedCount} / {initialTasks.length} Completed
                            </span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white border border-orange-200 shadow-xs flex items-center justify-center">
                            <span className="text-base font-black text-orange-600">{progressPercent}%</span>
                        </div>
                    </div>
                </div>

                {/* Checklist items */}
                <div className="mt-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Immediate Action Checklist
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {initialTasks.map((task) => {
                            const isDone = Boolean(checklistStates[task.id]);
                            const isPending = updatingTaskId === task.id;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={`
                                        group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none
                                        ${isDone
                                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                            : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-orange-300 text-gray-800 hover:shadow-xs'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            className="text-gray-400 group-hover:text-orange-500 transition cursor-pointer"
                                        >
                                            {isDone ? (
                                                <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-100" />
                                            ) : (
                                                <Circle size={20} className="text-gray-300 group-hover:text-orange-400" />
                                            )}
                                        </button>
                                        <span className={`text-xs sm:text-sm font-semibold truncate ${isDone ? 'line-through text-gray-400' : ''}`}>
                                            {task.label}
                                        </span>
                                    </div>

                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-orange-600 shrink-0 shadow-2xs">
                                        <Zap size={11} /> +{task.xp} XP
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Categorized Tiered Missions System */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">
                            🚀 Campus Operating Missions
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            Complete structured missions to unlock verified certificates, XP & leadership opportunities.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorizedMissions.map((mission, idx) => (
                        <div
                            key={idx}
                            className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${mission.color}`}
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/80 border border-current">
                                        {mission.icon}
                                        {mission.category}
                                    </span>

                                    {mission.isCompleted ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                            <CheckCheck size={12} /> Achieved
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold opacity-80">
                                            {mission.progress}
                                        </span>
                                    )}
                                </div>

                                <h4 className="text-base font-black text-gray-900 leading-tight">
                                    {mission.title}
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {mission.description}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                                <div className="text-[11px] font-black tracking-wide text-gray-900">
                                    Reward: <span className="text-orange-600">{mission.reward}</span>
                                </div>

                                {mission.action && !mission.isCompleted && (
                                    <button
                                        onClick={mission.action}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gray-900 hover:bg-orange-600 px-3 py-1.5 rounded-xl transition cursor-pointer"
                                    >
                                        <span>{mission.actionLabel}</span>
                                        <ArrowRight size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
