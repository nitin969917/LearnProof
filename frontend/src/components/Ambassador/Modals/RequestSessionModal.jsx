import React, { useState } from 'react';
import axios from 'axios';
import { X, Presentation, Calendar, Users, School, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RequestSessionModal({
    isOpen,
    onClose,
    referralCode,
    targetCollege,
    token
}) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        college: targetCollege || '',
        department: '',
        expectedStudents: '60',
        preferredDate: '',
        contactPerson: '',
        sessionType: 'offline_workshop',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/request-session`,
                {
                    code: referralCode,
                    ...form,
                    expectedStudents: Number(form.expectedStudents) || 50
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                toast.success('Session request submitted! Our team will get in touch within 24 hours.');
                onClose();
            }
        } catch (err) {
            console.error('Failed to submit session request:', err);
            toast.error(err.response?.data?.error || 'Failed to submit session request');
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
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Presentation size={12} /> Campus Expansion Operator
                    </span>
                    <h2 className="text-xl font-black text-gray-900">
                        Request a LearnProof Session
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        Host an official LearnProof team workshop, AI demo, or hackathon session at your college.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            College / Institute
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Sardar Patel Institute of Technology"
                            value={form.college}
                            onChange={(e) => setForm({ ...form, college: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Department / Club
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Computer Engineering / Coding Club"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Expected Students
                            </label>
                            <input
                                type="number"
                                min="10"
                                placeholder="e.g. 80"
                                value={form.expectedStudents}
                                onChange={(e) => setForm({ ...form, expectedStudents: e.target.value })}
                                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Preferred Date
                            </label>
                            <input
                                type="date"
                                value={form.preferredDate}
                                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Session Type
                            </label>
                            <select
                                value={form.sessionType}
                                onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
                                className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                            >
                                <option value="offline_workshop">In-Person Workshop & Demo</option>
                                <option value="online_webinar">Live Interactive Webinar</option>
                                <option value="club_orientation">Club Orientation & Co-brand</option>
                                <option value="hackathon_sponsor">Hackathon / Tech Fest Sponsor</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Faculty or Club Contact Person / Phone
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Prof. Sharma or Club President (9876543210)"
                            value={form.contactPerson}
                            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Additional Notes or Context
                        </label>
                        <textarea
                            rows={2}
                            placeholder="e.g. We have a seminar hall with projector ready. Students are preparing for placements."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Send size={14} />
                            <span>{saving ? 'Submitting...' : 'Submit Session Request'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
