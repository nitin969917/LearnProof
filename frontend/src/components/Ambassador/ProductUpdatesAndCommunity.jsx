import React from 'react';
import { Rocket, Bell, MessageCircle, Share2, Sparkles, Calendar, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductUpdatesAndCommunity({
    referralData,
    shareUrl,
    onOpenFeedbackModal
}) {
    const updates = referralData?.productUpdates || [
        {
            id: 'upd-1',
            badge: 'Major Release',
            title: 'AI Notes 2.0 & Instant Quizzes',
            summary: 'Convert YouTube lectures directly into markdown notes, flashcards & proctored quizzes.'
        },
        {
            id: 'upd-2',
            badge: 'Interactive',
            title: 'Live Voice & Study Rooms',
            summary: 'Real-time collaborative audio spaces for interview practice, languages, and focus sessions.'
        },
        {
            id: 'upd-3',
            badge: 'Coming Soon',
            title: 'AskMyNotes AI Doubt Solver',
            summary: 'Chat with your notes in natural language to clarify complex concepts instantly.'
        }
    ];

    const announcements = referralData?.announcements || [
        {
            id: 'ann-1',
            title: 'Monthly Ambassador Community Meetup',
            date: '28 Sep • 7:00 PM IST',
            description: 'Strategy briefing with LearnProof founders on campus growth, upcoming AI tools & leadership opportunities.'
        },
        {
            id: 'ann-2',
            title: '7-Day AI Notes & Quiz Challenge',
            date: 'Active This Week',
            description: 'Guide classmates to create 3 AI notes to unlock certificate fast-track and special campus badges.'
        }
    ];

    const shareUpdateToCampus = (updateTitle) => {
        const text = `Hey everyone! 🚀 LearnProof AI just rolled out a major new update: ${updateTitle}!\n\nCheck it out for free with our college pass: ${shareUrl}`;
        navigator.clipboard.writeText(text);
        toast.success('Campus update message copied to clipboard!');
    };

    return (
        <section id="updates-community" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 cols: What's New at LearnProof */}
                <div className="lg:col-span-7 bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-1">
                                <Rocket size={13} className="text-blue-500" />
                                Product Pulse
                            </div>
                            <h2 className="text-xl font-black text-gray-900">
                                🚀 What's New at LearnProof
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Fresh features you can demonstrate to peers and student clubs.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        {updates.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-orange-200 transition"
                            >
                                <div className="space-y-1 max-w-md">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white text-orange-600 border border-gray-200">
                                            {item.badge}
                                        </span>
                                        <h3 className="text-sm font-black text-gray-900">{item.title}</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>

                                <button
                                    onClick={() => shareUpdateToCampus(item.title)}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-orange-500 hover:text-white text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition shrink-0 cursor-pointer shadow-2xs"
                                >
                                    <Share2 size={13} />
                                    <span>Share to Campus</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right 5 cols: Ambassador Announcements & Team Connect */}
                <div className="lg:col-span-5 bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div className="pb-4 border-b border-gray-100">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-1">
                                <Bell size={13} className="text-emerald-500" />
                                Directives
                            </div>
                            <h2 className="text-xl font-black text-gray-900">
                                📢 Ambassador Updates
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Core briefings, upcoming meetings & campaigns.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {announcements.map((ann) => (
                                <div key={ann.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs sm:text-sm font-black text-gray-900">{ann.title}</h3>
                                    </div>
                                    <span className="text-[11px] font-bold text-orange-600 block">
                                        🗓️ {ann.date}
                                    </span>
                                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                        {ann.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Direct Contact Core Team Banner */}
                    <div className="p-4 rounded-2xl bg-gray-900 text-white space-y-2">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={16} className="text-orange-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                                Have an Idea or Question?
                            </h3>
                        </div>
                        <p className="text-xs text-gray-300">
                            Share feedback or ask questions directly to the LearnProof product core team.
                        </p>
                        <button
                            onClick={onOpenFeedbackModal}
                            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white text-white hover:text-gray-900 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            <span>💬 Share Student Feedback (+5 XP)</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
