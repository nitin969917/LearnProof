import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Presentation, Calendar, Users, School, Phone, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSessionRequestsTab({ token }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSessions = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                setSessions(res.data.sessions || []);
            }
        } catch (err) {
            console.error('Failed to load session requests:', err);
            toast.error('Failed to load session requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [token]);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/sessions/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.success) {
                toast.success(`Session request marked as ${status}`);
                fetchSessions(true);
            }
        } catch (err) {
            console.error('Failed to update session status:', err);
            toast.error('Failed to update session request');
        }
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading session requests...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        College Session & Workshop Bookings
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Requests from campus ambassadors to host workshops, webinars, and AI demos.
                    </p>
                </div>
                <button
                    onClick={() => fetchSessions(true)}
                    disabled={refreshing}
                    className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs cursor-pointer"
                    title="Refresh list"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-2">
                    <Presentation size={32} className="mx-auto text-gray-300" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No session requests submitted yet</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Ambassadors can request in-person or online demos for their college clubs directly from their hub.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((sess) => (
                        <div
                            key={sess.id}
                            className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        {sess.sessionType?.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        sess.status === 'scheduled'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : sess.status === 'completed'
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {sess.status}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                        {sess.college}
                                    </h4>
                                    {sess.department && (
                                        <p className="text-xs text-gray-500 mt-0.5">{sess.department}</p>
                                    )}
                                </div>

                                <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                    <div>👥 <strong>{sess.expectedStudents || 50}</strong> students expected</div>
                                    <div>🗓️ Preferred: <strong>{sess.preferredDate ? new Date(sess.preferredDate).toLocaleDateString() : 'Flexible'}</strong></div>
                                    {sess.contactPerson && <div>📞 Contact: <strong>{sess.contactPerson}</strong></div>}
                                    {sess.notes && <div className="italic text-[11px] text-gray-500 pt-1">"{sess.notes}"</div>}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                <span className="font-mono text-[11px] text-gray-500">
                                    Code: <strong className="text-orange-600">{sess.referralCode}</strong>
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleUpdateStatus(sess.id, 'scheduled')}
                                        className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                                    >
                                        Schedule
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(sess.id, 'completed')}
                                        className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
