import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, Users, Link as LinkIcon, Plus, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogActivityModal({
    isOpen,
    onClose,
    referralCode,
    token,
    onSuccess
}) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        type: 'outreach',
        title: '',
        description: '',
        studentsReached: '',
        proofUrl: '',
        date: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const activityTypes = [
        { id: 'outreach', label: 'Student Outreach', xp: 20 },
        { id: 'whatsapp_community', label: 'WhatsApp Community Distribution', xp: 20 },
        { id: 'club_collab', label: 'College Club Collaboration', xp: 50 },
        { id: 'workshop', label: 'Workshop / Presentation Session', xp: 50 },
        { id: 'social_media', label: 'Social Media Promotion (IG/LinkedIn)', xp: 20 },
        { id: 'feedback_collection', label: 'Feedback Collection Drive', xp: 25 },
        { id: 'campus_event', label: 'Campus Event / Tech Fest Demo', xp: 50 },
        { id: 'other', label: 'Other Campus Initiative', xp: 20 }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('Please enter an activity title');
            return;
        }

        setSaving(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/activities`,
                {
                    code: referralCode,
                    ...form,
                    studentsReached: Number(form.studentsReached) || 0
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                toast.success('Campus activity recorded! +XP awarded.');
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Failed to log activity:', err);
            toast.error(err.response?.data?.error || 'Failed to record activity');
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
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        <Zap size={12} /> Campus Director Log
                    </span>
                    <h2 className="text-xl font-black text-gray-900">
                        Log Campus Activity
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        Record offline or online campus work to gain verified ambassador XP and milestone progress.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            What did you do?
                        </label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        >
                            {activityTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.label} (+{t.xp} XP)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Activity Title
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Shared platform with CSE 3rd Year students"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Students Reached
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="e.g. 45"
                                value={form.studentsReached}
                                onChange={(e) => setForm({ ...form, studentsReached: e.target.value })}
                                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Date Conducted
                            </label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Proof / Link (Optional)
                        </label>
                        <input
                            type="url"
                            placeholder="https://drive.google.com/... or Instagram / LinkedIn post link"
                            value={form.proofUrl}
                            onChange={(e) => setForm({ ...form, proofUrl: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Brief Notes / Highlights
                        </label>
                        <textarea
                            rows={2}
                            placeholder="e.g. Discussed AI Notes with members of the coding club. Positive response to YouTube playlist converter."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white resize-none"
                        />
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
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Plus size={14} />
                            <span>{saving ? 'Recording...' : 'Record Activity (+XP)'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
