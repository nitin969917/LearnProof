import React, { useState } from 'react';
import axios from 'axios';
import { X, MessageSquare, Send, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentFeedbackModal({
    isOpen,
    onClose,
    referralCode,
    token,
    onSuccess
}) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        feedbackType: 'feature_request',
        feedbackText: '',
        priority: 'medium'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.feedbackText.trim()) {
            toast.error('Please describe what the student said');
            return;
        }

        setSaving(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/feedback`,
                {
                    code: referralCode,
                    feedbackType: form.feedbackType,
                    feedbackText: form.feedbackText,
                    priority: form.priority
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                toast.success('Feedback sent to LearnProof team! +5 XP awarded.');
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            toast.error(err.response?.data?.error || 'Failed to submit feedback');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                    <X size={20} />
                </button>

                <div className="mb-5 space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        <Zap size={12} /> Campus Research Network
                    </span>
                    <h2 className="text-xl font-black text-gray-900">
                        💬 Share Student Feedback
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        What are students on your campus saying about LearnProof AI? Earn <strong className="text-orange-600">+5 XP</strong> for every valid input.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Feedback Type
                        </label>
                        <select
                            value={form.feedbackType}
                            onChange={(e) => setForm({ ...form, feedbackType: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        >
                            <option value="feature_request">Feature Request (e.g. Hindi translation, PDF export)</option>
                            <option value="bug">Bug / Glitch (e.g. video transcript failed)</option>
                            <option value="student_problem">Student Problem (e.g. struggling with GATE CS syllabus)</option>
                            <option value="product_feedback">Product Feedback & Impressions</option>
                            <option value="partnership_opportunity">Campus Club / Event Partnership Opportunity</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            What did the student say?
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="e.g. 'Several 2nd-year CSE students love the AI summaries for NPTEL lectures, but wished they could export notes as PDF for offline revision before internals.'"
                            value={form.feedbackText}
                            onChange={(e) => setForm({ ...form, feedbackText: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Urgency / Priority
                        </label>
                        <select
                            value={form.priority}
                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        >
                            <option value="low">Low (Nice to have improvement)</option>
                            <option value="medium">Medium (Common peer request)</option>
                            <option value="high">High (Blocking or critical student pain point)</option>
                        </select>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Send size={14} />
                            <span>{saving ? 'Sending...' : 'Submit Feedback (+5 XP)'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
