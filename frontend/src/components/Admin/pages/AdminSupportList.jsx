import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Filter, MessageSquare, Clock, CheckCircle, ChevronRight, ArrowLeft, Send, ShieldCheck, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../../../context/ModalContext';

const AdminSupportList = () => {
    const { token } = useAuth();
    const { confirm } = useModal();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDeleteTicket = async (id, subject) => {
        const confirmed = await confirm({
            title: "Delete Support Ticket",
            message: `Are you sure you want to permanently delete support ticket "${subject || `#${id}`}"? This will delete all responses and cannot be undone.`,
            confirmText: "Delete Ticket",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/support/admin/tickets/${id}?idToken=${token}`);
            toast.success("Support ticket deleted successfully");
            setTickets(prev => prev.filter(t => t.id !== id));
            if (selectedTicket && selectedTicket.id === id) {
                setSelectedTicket(null);
            }
        } catch (err) {
            console.error("Failed to delete ticket", err);
            toast.error(err.response?.data?.error || "Failed to delete support ticket");
        }
    };

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/support/admin/tickets?idToken=${token}`);
            setTickets(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load support tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTickets();
    }, [token]);

    useEffect(() => {
        let interval;
        if (selectedTicket && token) {
            interval = setInterval(async () => {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets/${selectedTicket.id}?idToken=${token}`);
                setSelectedTicket(res.data);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [selectedTicket, token]);

    const handleRespond = async (e) => {
        e.preventDefault();
        if (!token || !selectedTicket || !responseMessage) return;
        setIsSubmitting(true);
        
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets/${selectedTicket.id}/respond`, {
                idToken: token,
                message: responseMessage,
                status: 'IN_PROGRESS'
            });
            
            toast.success("Response sent!");
            setResponseMessage('');
            // Refresh detailed ticket
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets/${selectedTicket.id}?idToken=${token}`);
            setSelectedTicket(res.data);
            fetchTickets();
        } catch (err) {
            console.error(err);
            toast.error("Failed to send response");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/support/admin/tickets/${id}`, {
                idToken: token,
                status
            });
            toast.success(`Status updated to ${status}`);
            fetchTickets();
            if (selectedTicket && selectedTicket.id === id) {
                setSelectedTicket({ ...selectedTicket, status });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.user.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6">
            <AnimatePresence mode="wait">
                {!selectedTicket ? (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full"
                    >
                        {/* Header & Filters */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Support Tickets</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm shadow-inner"
                                    />
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto gap-1 border border-slate-200/55 dark:border-slate-700/50">
                                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                        >
                                            {status.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                                        <th className="px-6 py-4">Ticket</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {filteredTickets.length > 0 ? (
                                        filteredTickets.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white line-clamp-1">{ticket.subject}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.message}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {ticket.user.profile_pic ? (
                                                            <img src={ticket.user.profile_pic} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">{ticket.user.name.charAt(0)}</div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{ticket.user.name}</p>
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{ticket.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)} bg-opacity-10 dark:bg-opacity-20`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(ticket.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button 
                                                            onClick={() => setSelectedTicket(ticket)}
                                                            className="p-2 text-slate-400 dark:text-slate-550 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                                                            title="View Ticket"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteTicket(ticket.id, ticket.subject)}
                                                            className="p-2 text-slate-400 dark:text-slate-550 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete Ticket"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No tickets found matching your criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full"
                    >
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedTicket(null)} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedTicket.subject}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ticket ID: #{selectedTicket.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(selectedTicket.status)} bg-opacity-10 dark:bg-opacity-20`}>{selectedTicket.status}</span>
                                <select 
                                    value={selectedTicket.status}
                                    onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm dark:text-slate-200"
                                >
                                    <option value="OPEN">Set Open</option>
                                    <option value="IN_PROGRESS">Set In Progress</option>
                                    <option value="RESOLVED">Set Resolved</option>
                                    <option value="CLOSED">Set Closed</option>
                                </select>
                                <button
                                    onClick={() => handleDeleteTicket(selectedTicket.id, selectedTicket.subject)}
                                    className="p-2 text-slate-400 dark:text-slate-550 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-slate-200 dark:border-slate-750"
                                    title="Delete Support Ticket"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Chat / Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/20">
                            {/* User Info Card */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {selectedTicket.user.profile_pic ? (
                                        <img src={selectedTicket.user.profile_pic} alt="" className="w-12 h-12 rounded-full ring-2 ring-slate-100 dark:ring-slate-800 object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-300">{selectedTicket.user.name.charAt(0)}</div>
                                    )}
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">{selectedTicket.user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTicket.user.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Submitted</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatDate(selectedTicket.created_at)}</p>
                                </div>
                            </div>

                            {/* Ticket Message */}
                            <div className="flex gap-3 max-w-[85%] md:max-w-[75%] mr-auto">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1.5 mb-1">{selectedTicket.user.name}</span>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-sm shadow-orange-500/5">
                                        <p className="text-slate-750 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-1.5 mt-1">{formatDate(selectedTicket.created_at)}</span>
                                </div>
                            </div>

                            {/* Responses */}
                            {selectedTicket.responses.map(resp => {
                                const isAdmin = !!resp.adminId;
                                return (
                                    <div key={resp.id} className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350'}`}>
                                            {isAdmin ? <ShieldCheck size={20} /> : <User size={20} />}
                                        </div>
                                        <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 mb-1">
                                                {isAdmin ? 'System Admin' : selectedTicket.user.name}
                                            </span>
                                            <div className={`p-4 rounded-2xl border shadow-sm ${
                                                isAdmin 
                                                    ? 'bg-orange-500 text-white border-transparent rounded-tr-none' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-700 dark:text-slate-300'
                                            }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{resp.message}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1.5 mt-1">
                                                {formatDate(resp.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply Form */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <form onSubmit={handleRespond} className="relative">
                                <textarea 
                                    required
                                    rows="3"
                                    placeholder="Type your response to the user..."
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-orange-500/30 rounded-2xl outline-none transition-all text-slate-800 dark:text-slate-200 font-medium resize-none shadow-inner"
                                />
                                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting || !responseMessage}
                                        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-orange-500/30 transition-all disabled:bg-slate-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Send Response <Send size={16} /></>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSupportList;
