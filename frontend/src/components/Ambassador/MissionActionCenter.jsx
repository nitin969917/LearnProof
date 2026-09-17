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

    // Initial checklist tasks with direct action shortcuts
    const initialTasks = [
        { id: 'task-groups', label: 'Share LearnProof in 2 college groups', xp: 20, actionType: 'whatsapp', actionLabel: 'Share 📲' },
        { id: 'task-intro', label: 'Introduce LearnProof to 10 batchmates', xp: 30, actionType: 'pitch', actionLabel: '30s Pitch 🗣️' },
        { id: 'task-learners', label: 'Bring 10 new active learners', xp: 50, actionType: 'copy', actionLabel: 'Copy Link 🔗' },
        { id: 'task-feedback', label: 'Collect feedback from 5 students', xp: 25, actionType: 'feedback', actionLabel: 'Feedback 💬' },
        { id: 'task-meetup', label: 'Attend monthly ambassador meeting', xp: 40, actionType: 'meetup', actionLabel: 'Schedule 📅' }
    ];

    const checklistStates = referralData?.checklistStates || {};
    const completedCount = initialTasks.filter(t => checklistStates[t.id]).length;
    const progressPercent = Math.round((completedCount / initialTasks.length) * 100);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?ref=${referralData?.referralCode || ''}`
        : '';

    const handleActionClick = (e, task) => {
        e.stopPropagation();
        if (task.actionType === 'whatsapp') {
            const text = `Hey everyone! 👋 Turn any YouTube course or lecture into instant notes, flashcards & verified certificates on LearnProof AI 🚀\n👉 Join with our campus link: ${shareUrl}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        } else if (task.actionType === 'copy') {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Campus link copied to clipboard!');
        } else if (task.actionType === 'pitch') {
            const el = document.getElementById('pitch-and-faqs');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else if (task.actionType === 'feedback') {
            if (onOpenFeedbackModal) onOpenFeedbackModal();
        } else if (task.actionType === 'meetup') {
            const el = document.getElementById('updates-community');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const toggleTask = async (taskId) => {
        if (!token || !referralData?.referralCode) return;
        const currentVal = Boolean(checklistStates[taskId]);
        const newVal = !currentVal;

        // Optimistic UI update
        if (onTaskStateChange) {
            onTaskStateChange(taskId, newVal);
        }

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
                if (newVal) toast.success('Task completed! XP added to your total.');
            }
        } catch (err) {
            console.error('Failed to update task:', err);
            // Revert on failure
            if (onTaskStateChange) {
                onTaskStateChange(taskId, currentVal);
            }
            toast.error(err.response?.data?.error || 'Could not save task status');
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
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 mb-2">
                            <Target size={13} className="text-orange-500" />
                            Weekly Directive
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            Your Campus Missions This Week
                        </h2>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                            Complete micro-initiatives to onboard classmates, collect feedback, and unlock leadership milestones.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 px-5 py-3.5 rounded-2xl shrink-0">
                        <div className="text-right">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 block">
                                Progress
                            </span>
                            <span className="text-base sm:text-lg font-black text-gray-900">
                                {completedCount} / {initialTasks.length} Completed
                            </span>
                        </div>
                        <div className="w-13 h-13 rounded-2xl bg-white border border-orange-200 shadow-2xs flex items-center justify-center font-mono font-black text-orange-600 text-sm">
                            {progressPercent}%
                        </div>
                    </div>
                </div>

                {/* Checklist items */}
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                            Immediate Action Checklist
                        </h3>
                        <span className="text-[11px] text-gray-500 font-semibold">
                            Click item to mark done
                        </span>
                    </div>

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
                                            ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                                            : 'bg-gray-50/70 hover:bg-white border-gray-200 hover:border-orange-300 hover:shadow-xs'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            className="text-gray-400 group-hover:text-orange-500 transition cursor-pointer shrink-0"
                                        >
                                            {isDone ? (
                                                <CheckCircle2 size={22} className="text-emerald-600 fill-emerald-100" />
                                            ) : (
                                                <Circle size={22} className="text-gray-300 group-hover:text-orange-400" />
                                            )}
                                        </button>
                                        <span className={`text-xs sm:text-sm font-semibold truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                            {task.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {!isDone && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleActionClick(e, task)}
                                                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-bold text-[11px] border border-gray-200 hover:border-orange-300 transition cursor-pointer shadow-2xs active:scale-95"
                                                title="Open action"
                                            >
                                                {task.actionLabel}
                                            </button>
                                        )}

                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
                                            isDone
                                                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                                                : 'bg-white border-gray-200 text-orange-600'
                                        }`}>
                                            {isDone ? <CheckCheck size={12} /> : <Zap size={11} className="fill-orange-500" />}
                                            <span>+{task.xp} XP</span>
                                        </span>
                                    </div>
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
