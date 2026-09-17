import React, { useState } from 'react';
import { Mic, Copy, Check, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PitchAndFaqSection({ shareUrl }) {
    const [copied, setCopied] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);

    const elevatorPitch = `LearnProof AI is an AI-powered learning platform that brings your YouTube learning, AI notes, quizzes, doubts, roadmaps and progress tracking into one place. Instead of passively watching hours of videos with zero retention, LearnProof tests your knowledge in real-time, gives you structured chapter summaries, and issues verifiable certificates you can directly add to your resume and LinkedIn.`;

    const handleCopyPitch = () => {
        navigator.clipboard.writeText(`${elevatorPitch}\n\n👉 Try it free: ${shareUrl}`);
        setCopied(true);
        toast.success('30-second elevator pitch copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    const faqs = [
        {
            q: 'Is LearnProof completely free for students?',
            a: 'Yes, LearnProof AI is 100% free for students. Anyone can turn YouTube lectures into AI notes, take quizzes, generate flashcards, and join live rooms without any paywall.'
        },
        {
            q: 'Does it work with any YouTube playlist or video?',
            a: 'Yes! Simply copy any public YouTube video or playlist link (DSA, Web Dev, GATE, UPSC, University syllabus) and paste it into LearnProof. The AI extracts transcripts and builds clean notes instantly.'
        },
        {
            q: 'Is there an Android app available?',
            a: 'Yes, LearnProof offers a Progressive Web App (PWA) and an Android APK/TWA that students can install directly on their smartphones for quick study on the go.'
        },
        {
            q: 'How do students earn verified certificates?',
            a: 'When students complete a course playlist and pass the AI milestone comprehension quiz with over 70% score, LearnProof generates a cryptographically verifiable certificate with a unique verification URL for LinkedIn.'
        },
        {
            q: 'How should I answer when students ask "Why not just take notes manually?"',
            a: 'Manual note-taking while watching complex coding or engineering lectures consumes 3x more time and often leads to passive rewording. LearnProof AI automates note extraction and focuses student time on active recall and self-testing.'
        }
    ];

    return (
        <section id="pitch-and-faqs" className="space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* 30-Second Elevator Pitch Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
                                <Mic size={18} />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-orange-700 block">
                                    Ready-Made Verbal Pitch
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-gray-900">
                                    🎤 The 30-Second Elevator Pitch
                                </h3>
                            </div>
                        </div>

                        <button
                            onClick={handleCopyPitch}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            <span>{copied ? 'Copied Pitch!' : 'Copy Pitch'}</span>
                        </button>
                    </div>

                    <blockquote className="p-4 rounded-xl bg-white/90 border border-orange-200/80 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed italic">
                        "{elevatorPitch}"
                    </blockquote>
                    <p className="text-[11px] text-gray-500 font-medium mt-2">
                        💡 Use this pitch when introducing LearnProof in classes, student club orientations, or WhatsApp voice notes.
                    </p>
                </div>

                {/* Common Student Questions & Objection Handling */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="text-orange-500" />
                        <h3 className="text-base font-black text-gray-900">
                            ❓ Student FAQs & Objection Handling
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                        Quick answers to resolve common peer doubts instantly and save your time.
                    </p>

                    <div className="space-y-2 mt-4">
                        {faqs.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-2xl overflow-hidden transition"
                                >
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-gray-900 bg-gray-50 hover:bg-white transition cursor-pointer"
                                    >
                                        <span>{faq.q}</span>
                                        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                    </button>
                                    {isOpen && (
                                        <div className="p-4 bg-white border-t border-gray-100 text-xs text-gray-600 leading-relaxed font-medium">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
