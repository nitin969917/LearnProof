import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Users, CheckCircle2, XCircle, Trash2, ExternalLink, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCampusActivitiesTab({ token }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivities = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/activities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                setActivities(res.data.activities || []);
            }
        } catch (err) {
            console.error('Failed to load activities:', err);
            toast.error('Failed to load campus activities');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [token]);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/activities/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.success) {
                toast.success(`Activity marked as ${status}`);
                fetchActivities(true);
            }
        } catch (err) {
            console.error('Failed to update activity status:', err);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this activity record?')) return;
        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/referrals/admin/activities/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.success) {
                toast.success('Activity removed');
                fetchActivities(true);
            }
        } catch (err) {
            console.error('Failed to delete activity:', err);
            toast.error('Failed to delete activity');
        }
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading campus activities...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        Campus Activities Logged by Ambassadors
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Review offline workshops, student outreach, and proof URLs submitted by campus leaders.
                    </p>
                </div>
                <button
                    onClick={() => fetchActivities(true)}
                    disabled={refreshing}
                    className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs cursor-pointer"
                    title="Refresh list"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                </button>
            </div>

            {activities.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-2">
                    <Calendar size={32} className="mx-auto text-gray-300" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No campus activities submitted yet</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        When ambassadors record class announcements, workshops, or club sessions, they will appear here for review.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wider font-bold">
                            <tr>
                                <th className="py-3 px-4">Ambassador Code</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Activity Title & Notes</th>
                                <th className="py-3 px-4">Reached</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Proof</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {(Array.isArray(activities) ? activities : []).map((act) => (
                                <tr key={act.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                                    <td className="py-3 px-4 font-mono font-bold text-orange-600">
                                        {act.referralCode}
                                    </td>
                                    <td className="py-3 px-4 capitalize font-semibold text-gray-700 dark:text-gray-300">
                                        {act.type?.replace('_', ' ')}
                                    </td>
                                    <td className="py-3 px-4 max-w-xs">
                                        <span className="font-bold text-gray-900 dark:text-white block truncate">
                                            {act.title}
                                        </span>
                                        {act.description && (
                                            <span className="text-[11px] text-gray-500 line-clamp-1">
                                                {act.description}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 font-black text-gray-900 dark:text-white">
                                        {act.studentsReached || 0} students
                                    </td>
                                    <td className="py-3 px-4 text-gray-500">
                                        {act.date ? new Date(act.date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {act.proofUrl ? (
                                            <a
                                                href={act.proofUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline text-[11px]"
                                            >
                                                View Proof <ExternalLink size={11} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-[11px]">No link</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            act.status === 'approved'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : act.status === 'rejected'
                                                ? 'bg-rose-100 text-rose-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {act.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                        <button
                                            onClick={() => handleUpdateStatus(act.id, 'approved')}
                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                                            title="Approve Activity"
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(act.id, 'rejected')}
                                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                            title="Reject Activity"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(act.id)}
                                            className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                                            title="Delete Record"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
