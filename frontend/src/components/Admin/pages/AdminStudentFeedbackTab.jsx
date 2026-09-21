import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, CheckCircle2, AlertCircle, RefreshCw, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStudentFeedbackTab({ token }) {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFeedback = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/feedback`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                setFeedbackList(res.data.feedback || []);
            }
        } catch (err) {
            console.error('Failed to load feedback:', err);
            toast.error('Failed to load feedback');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [token]);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/feedback/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.success) {
                toast.success(`Feedback marked as ${status}`);
                fetchFeedback(true);
            }
        } catch (err) {
            console.error('Failed to update feedback:', err);
            toast.error('Failed to update feedback status');
        }
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading student feedback...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        Student Feedback & Research Channel
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Direct inputs, bugs, and feature ideas submitted by campus ambassadors.
                    </p>
                </div>
                <button
                    onClick={() => fetchFeedback(true)}
                    disabled={refreshing}
                    className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs cursor-pointer"
                    title="Refresh list"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                </button>
            </div>

            {feedbackList.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-2">
                    <MessageSquare size={32} className="mx-auto text-gray-300" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No student feedback submitted yet</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Ambassadors can submit direct peer suggestions from their hub dashboard to earn +5 XP.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(feedbackList) ? feedbackList : []).map((fb) => (
                        <div
                            key={fb.id}
                            className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-3"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                        {fb.feedbackType?.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        fb.priority === 'high'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {fb.priority} priority
                                    </span>
                                </div>

                                <blockquote className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed italic bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    "{fb.feedbackText}"
                                </blockquote>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                <span className="font-mono text-[11px] text-gray-500">
                                    Via Code: <strong className="text-orange-600">{fb.referralCode}</strong>
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase text-gray-400 mr-1">
                                        Status: {fb.status}
                                    </span>
                                    {fb.status !== 'resolved' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(fb.id, 'resolved')}
                                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                                        >
                                            Mark Resolved
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                            <CheckCircle2 size={13} /> Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
