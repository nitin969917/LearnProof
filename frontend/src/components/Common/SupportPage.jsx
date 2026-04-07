import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronRight, Send, HelpCircle, LifeBuoy, History, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowLeft, User, ShieldCheck, Search, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Support = () => {
    const { token, user } = useAuth();
    const [view, setView] = useState('new'); // 'new', 'history', 'detail'
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [formState, setFormState] = useState({
        subject: '',
        message: '',
        priority: 'NORMAL'
    });
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    useEffect(() => {
        if (view === 'history') {
            fetchTickets();
        }
    }, [view, token]);

    useEffect(() => {
        let interval;
        if (view === 'detail' && selectedTicket && token) {
            interval = setInterval(() => {
                fetchTicketDetail(selectedTicket.id, true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [view, selectedTicket, token]);

    const fetchTickets = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets?idToken=${token}`);
            setTickets(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load your support history");
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetail = async (id, silent = false) => {
        if (!token) return;
        if (!silent) setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets/${id}?idToken=${token}`);
            setSelectedTicket(res.data);
            if (!silent) setView('detail');
        } catch (err) {
            console.error(err);
            if (!silent) toast.error("Failed to load ticket details");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;
        setIsSubmitting(true);
        
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets`, {
                idToken: token,
                ...formState
            });
            
            toast.success("Ticket created successfully!");
            setFormState({ subject: '', message: '', priority: 'NORMAL' });
            setView('history');
        } catch (err) {
            console.error(err);
            toast.error("Failed to create ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRespond = async (e) => {
        e.preventDefault();
        if (!token || !selectedTicket || !responseMessage) return;
        setIsSubmitting(true);
        
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets/${selectedTicket.id}/respond`, {
                idToken: token,
                message: responseMessage
            });
            
            toast.success("Message sent!");
            setResponseMessage('');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/support/tickets/${selectedTicket.id}?idToken=${token}`);
            setSelectedTicket(res.data);
        } catch (err) {
            console.error('Support reply error:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to send response";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800';
            case 'IN_PROGRESS': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800';
            case 'RESOLVED': return 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-800';
            case 'CLOSED': return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700';
            default: return 'bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800';
        }
    };

    const tabs = [
        { id: "new", label: "New Ticket", icon: Plus },
        { id: "history", label: "History", icon: History }
    ];

    const faqItems = [
        { q: "How to earn certificates?", a: "Complete all videos and quizzes in a course with a high passing score." },
        { q: "Are the certificates officially verified?", a: "Yes, every certificate has a unique ID and QR code for public verification." },
        { q: "How does AI Intuition work?", a: "It uses deep learning to extract architectural intuition and key points from transcripts." },
        { q: "Can I share my achievements?", a: "Direct sharing is enabled for LinkedIn, X, and your personal portfolio." }
    ];

    const filteredTickets = tickets.filter(t => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section - Mobile Responsive */}
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-6">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white flex flex-col sm:flex-row items-center gap-4">
                        <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
                            <LifeBuoy className="text-white" size={32} />
                        </div>
                        Help & Support
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm sm:text-lg max-w-xl">Student Assistance Center</p>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = view === tab.id || (tab.id === 'history' && view === 'detail');
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex-1 sm:flex-none ${
                                    isActive 
                                    ? "text-white" 
                                    : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200"
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabSupport"
                                        className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20"
                                        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                                    />
                                )}
                                <Icon size={14} className="relative z-10 sm:w-4 sm:h-4" />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {/* New Ticket View */}
                        {view === 'new' && (
                            <motion.div 
                                key="new" 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-xl shadow-orange-500/5 overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none hidden sm:block">
                                    <LifeBuoy size={160} />
                                </div>

                                <div className="mb-10">
                                    <div className="flex items-center gap-2 mb-3 text-orange-500">
                                        <Sparkles size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Connect with our team</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Request Assistance</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Please provide accurate context for a swift resolution.</p>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-6 relative">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Case Subject</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={formState.subject} 
                                            onChange={(e) => setFormState({...formState, subject: e.target.value})} 
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm text-gray-900 dark:text-white" 
                                            placeholder="What can we help you with?" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Detailed Message</label>
                                        <textarea 
                                            required 
                                            rows="4" 
                                            value={formState.message} 
                                            onChange={(e) => setFormState({...formState, message: e.target.value})} 
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm text-gray-900 dark:text-white resize-none" 
                                            placeholder="Describe the problem accurately..."
                                        ></textarea>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-xs"
                                    >
                                        {isSubmitting ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} /> Open Ticket</>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* History View */}
                        {view === 'history' && (
                            <motion.div 
                                key="history" 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="relative group mb-6">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Search across support history..." 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                        className="w-full pl-14 pr-6 py-4 sm:py-5 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 shadow-sm rounded-2xl outline-none focus:border-orange-500 transition-all font-medium text-sm text-gray-900 dark:text-white" 
                                    />
                                </div>
                                {loading && filteredTickets.length === 0 ? (
                                    <div className="text-center py-20"><div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                                ) : (
                                    filteredTickets.map(ticket => (
                                        <div 
                                            key={ticket.id} 
                                            onClick={() => fetchTicketDetail(ticket.id)} 
                                            className="group bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-gray-700 hover:border-orange-500 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 sm:gap-5 overflow-hidden">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusStyles(ticket.status)} border whitespace-nowrap`}>
                                                    <MessageSquare size={18} className="sm:w-6 sm:h-6" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h3 className="font-black text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base mb-1">{ticket.subject}</h3>
                                                    <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500">
                                                        <span>{formatDate(ticket.created_at)}</span>
                                                        <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                                                        <span className={ticket.status === 'RESOLVED' ? 'text-green-500' : 'text-orange-500'}>{ticket.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-orange-500 flex-shrink-0" size={20} />
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {/* Detail View - DARK MODE & MOBILE POLISHED */}
                        {view === 'detail' && selectedTicket && (
                            <motion.div 
                                key="detail" 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col h-full ring-1 ring-orange-500/5"
                            >
                                <div className="p-5 sm:p-8 bg-gray-50/80 dark:bg-gray-900/40 border-b border-orange-50 dark:border-gray-700 backdrop-blur-sm">
                                    <button onClick={() => setView('history')} className="flex items-center gap-2 text-gray-400 font-black uppercase text-[10px] mb-4 hover:text-orange-500 transition-colors group">
                                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                                    </button>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(selectedTicket.status)}`}>{selectedTicket.status}</span>
                                        <span className="text-gray-300 dark:text-gray-600 text-xs font-black tracking-widest">#{selectedTicket.id}</span>
                                    </div>
                                    <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-2">{selectedTicket.subject}</h2>
                                </div>

                                <div className="p-4 sm:p-8 space-y-10 overflow-y-auto max-h-[600px] min-h-[400px] bg-white dark:bg-gray-800">
                                    {/* Original Case Message - USER (RIGHT) */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">You (Original Case)</span>
                                            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-orange-500/20">ME</div>
                                        </div>
                                        <div className="bg-orange-500 text-white p-4 sm:p-5 rounded-2xl rounded-tr-none shadow-xl shadow-orange-500/10 w-fit max-w-[90%] sm:max-w-[80%] text-right font-medium text-sm leading-relaxed">
                                            {selectedTicket.message}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pr-1">{formatDate(selectedTicket.created_at)}</span>
                                    </div>

                                    {/* Response Thread */}
                                    {selectedTicket.responses.map(resp => {
                                        const isFromAdmin = resp.adminId !== null;
                                        return (
                                            <div key={resp.id} className={`flex flex-col gap-2 ${isFromAdmin ? 'items-start' : 'items-end'}`}>
                                                <div className={`flex items-center gap-2.5 mb-1 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-lg ${isFromAdmin ? 'bg-slate-700 dark:bg-slate-900/80 text-white shadow-slate-900/10' : 'bg-orange-500 text-white shadow-orange-500/10'}`}>
                                                        {isFromAdmin ? <ShieldCheck size={16} /> : 'ME'}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-xs">
                                                        {isFromAdmin ? 'Team Support' : 'You'}
                                                    </span>
                                                </div>
                                                <div className={`p-4 sm:p-5 rounded-2xl shadow-sm w-fit max-w-[90%] sm:max-w-[80%] font-medium text-sm leading-relaxed transition-all duration-300 ${
                                                    isFromAdmin 
                                                    ? 'bg-gray-100 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-tl-none' 
                                                    : 'bg-orange-500 text-white rounded-tr-none text-right shadow-xl shadow-orange-500/5'
                                                }`}>
                                                    {resp.message}
                                                </div>
                                                <div className={`flex flex-col sm:flex-row items-center gap-3 mt-1 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                                                    {isFromAdmin && <span className="text-[9px] font-black text-orange-500 uppercase flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full"><ShieldCheck size={10} /> Priority Team</span>}
                                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{formatDate(resp.created_at)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedTicket.status !== 'CLOSED' && (
                                    <div className="p-4 sm:p-6 border-t border-orange-50 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/60 backdrop-blur-md">
                                        <form onSubmit={handleRespond} className="relative group">
                                            <textarea 
                                                required 
                                                rows="2" 
                                                value={responseMessage} 
                                                onChange={(e) => setResponseMessage(e.target.value)} 
                                                className="w-full px-5 py-4 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-orange-500/30 rounded-2xl outline-none transition-all font-medium text-sm resize-none pr-16 shadow-inner text-gray-900 dark:text-white" 
                                                placeholder="Type your message here..."
                                            ></textarea>
                                            <div className="absolute right-3 bottom-3 transform transition-all group-focus-within:scale-105">
                                                <button 
                                                    type="submit" 
                                                    disabled={isSubmitting || !responseMessage} 
                                                    className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                                                >
                                                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar Widgets - Mobile Adjusted */}
                <div className="space-y-6">
                    {/* Official Connector */}
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-gray-700 text-center relative group overflow-hidden shadow-sm">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-900 rounded-2xl mx-auto flex items-center justify-center text-orange-500 border border-orange-50 dark:border-gray-700 shadow-xl group-hover:scale-110 transition-transform duration-700 mb-6 relative z-10">
                            <Mail size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Support Email</h4>
                        <p className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 mb-6 break-all">hello@learnproofai.com</p>
                        <a 
                            href="mailto:hello@learnproofai.com" 
                            className="block w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                        >
                            Compose Message
                        </a>
                    </div>

                    {/* Common Academy Questions */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-orange-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-orange-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex items-center gap-3">
                            <HelpCircle size={18} className="text-orange-500" />
                            <h3 className="font-black text-gray-800 dark:text-gray-200 text-[10px] sm:text-xs uppercase tracking-widest">General FAQs</h3>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4">
                            {faqItems.map((item, i) => (
                                <details key={i} className="group cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                                    <summary className="text-xs font-bold text-gray-700 dark:text-gray-300 list-none flex justify-between items-center group-hover:text-orange-500 transition-colors leading-snug">
                                        <span className="pr-4">{item.q}</span>
                                        <ChevronRight size={14} className="group-open:rotate-90 transition-all text-gray-400 flex-shrink-0" />
                                    </summary>
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                        {item.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
