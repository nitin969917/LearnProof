import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronRight, Send, HelpCircle, LifeBuoy, History, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowLeft, User, ShieldCheck, Search, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Support = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDashboardView = location.pathname.startsWith('/dashboard');
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
        if (token && view === 'history') {
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
            case 'OPEN': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
            case 'IN_PROGRESS': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
            case 'RESOLVED': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30';
            case 'CLOSED': return 'bg-slate-50 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-900/30';
            default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-900/30';
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

    if (isDashboardView) {
        return (
            <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28 space-y-6 select-none selection:bg-orange-200 dark:bg-gray-900 transition-colors duration-300">
                {/* ── Compact Header ───────────────────────────────────── */}
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                        <LifeBuoy size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Help & Support</h1>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                            Student Assistance Center - Raise tickets and view support history.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex justify-between items-center border-b border-orange-100 dark:border-gray-805 pb-4">
                        <div className="flex p-1 bg-orange-50 dark:bg-gray-850 border border-orange-100/50 dark:border-gray-750/50 rounded-xl w-72 sm:w-80">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = view === tab.id || (tab.id === 'history' && view === 'detail');
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setView(tab.id)}
                                        className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex-1 ${
                                            isActive
                                                ? "text-white"
                                                : "text-gray-550 dark:text-slate-400 hover:text-gray-750 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabSupport"
                                                className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <Icon size={13} className="relative z-10" />
                                        <span className="relative z-10">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main ticketing column */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnimatePresence mode="wait">
                                {view === 'new' && (
                                    <motion.div 
                                        key="new" 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-white dark:bg-gray-805 bg-opacity-75 dark:bg-opacity-75 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm relative overflow-hidden"
                                    >
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-2 text-orange-500">
                                                <Sparkles size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Connect with our team</span>
                                            </div>
                                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Request Assistance</h2>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Please provide accurate context for a swift resolution.</p>
                                        </div>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Case Subject</label>
                                                <input 
                                                    required 
                                                    type="text" 
                                                    value={formState.subject} 
                                                    onChange={(e) => setFormState({...formState, subject: e.target.value})} 
                                                    className="w-full px-4 py-3 bg-orange-50/20 dark:bg-gray-900/50 border border-orange-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold text-sm text-gray-900 dark:text-white" 
                                                    placeholder="What can we help you with?" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Detailed Message</label>
                                                <textarea 
                                                    required 
                                                    rows="4" 
                                                    value={formState.message} 
                                                    onChange={(e) => setFormState({...formState, message: e.target.value})} 
                                                    className="w-full px-4 py-3 bg-orange-50/20 dark:bg-gray-900/50 border border-orange-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold text-sm text-gray-900 dark:text-white resize-none" 
                                                    placeholder="Describe the problem accurately..."
                                                ></textarea>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={isSubmitting} 
                                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-xs border-0 cursor-pointer"
                                            >
                                                {isSubmitting ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} /> Open Ticket</>}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {view === 'history' && (
                                    <motion.div 
                                        key="history" 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="relative group mb-4">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Search across support history..." 
                                                value={searchQuery} 
                                                onChange={(e) => setSearchQuery(e.target.value)} 
                                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 shadow-sm rounded-xl outline-none focus:border-orange-500 transition-all font-semibold text-sm text-gray-900 dark:text-white" 
                                            />
                                        </div>
                                        {loading && filteredTickets.length === 0 ? (
                                            <div className="text-center py-10"><div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                                        ) : filteredTickets.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-semibold text-sm bg-white dark:bg-gray-850 bg-opacity-75 dark:bg-opacity-75 backdrop-blur-xl rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm">No support tickets found.</div>
                                        ) : (
                                            filteredTickets.map(ticket => (
                                                <div 
                                                    key={ticket.id} 
                                                    onClick={() => fetchTicketDetail(ticket.id)} 
                                                    className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-orange-100 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-400 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4"
                                                >
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusStyles(ticket.status)} border whitespace-nowrap`}>
                                                            <MessageSquare size={16} />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm mb-1">{ticket.subject}</h3>
                                                            <div className="flex items-center gap-2.5 text-[9px] uppercase font-bold tracking-wider text-gray-400">
                                                                <span>{formatDate(ticket.created_at)}</span>
                                                                <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                                                                <span className={ticket.status === 'RESOLVED' ? 'text-green-500' : 'text-orange-500'}>{ticket.status}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-orange-500 flex-shrink-0" size={18} />
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}

                                {view === 'detail' && selectedTicket && (
                                    <motion.div 
                                        key="detail" 
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="p-4 sm:p-6 bg-orange-50/30 dark:bg-gray-900/30 border-b border-orange-100 dark:border-gray-700">
                                            <button onClick={() => setView('history')} className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 font-black uppercase text-[9px] mb-3 hover:text-orange-500 transition-colors group bg-transparent border-0 cursor-pointer">
                                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                                            </button>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyles(selectedTicket.status)}`}>{selectedTicket.status}</span>
                                                <span className="text-gray-300 dark:text-gray-600 text-xs font-bold">#{selectedTicket.id}</span>
                                            </div>
                                            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-2">{selectedTicket.subject}</h2>
                                        </div>

                                        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[400px] min-h-[300px] bg-white dark:bg-gray-800">
                                            {/* Original Case Message */}
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">You (Original Case)</span>
                                                    <div className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center font-black text-[9px]">ME</div>
                                                </div>
                                                <div className="bg-orange-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] text-right font-semibold text-xs sm:text-sm leading-relaxed">
                                                    {selectedTicket.message}
                                                </div>
                                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pr-1">{formatDate(selectedTicket.created_at)}</span>
                                            </div>

                                            {/* Response Thread */}
                                            {selectedTicket.responses.map(resp => {
                                                const isFromAdmin = resp.adminId !== null;
                                                return (
                                                    <div key={resp.id} className={`flex flex-col gap-1.5 ${isFromAdmin ? 'items-start' : 'items-end'}`}>
                                                        <div className={`flex items-center gap-2 mb-0.5 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px] shadow-sm ${isFromAdmin ? 'bg-slate-700 text-white' : 'bg-orange-500 text-white'}`}>
                                                                {isFromAdmin ? <ShieldCheck size={12} /> : 'ME'}
                                                            </div>
                                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                                {isFromAdmin ? 'Team Support' : 'You'}
                                                            </span>
                                                        </div>
                                                        <div className={`p-3.5 rounded-2xl shadow-sm max-w-[85%] font-semibold text-xs sm:text-sm leading-relaxed ${
                                                            isFromAdmin 
                                                            ? 'bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 text-slate-800 dark:text-gray-200 rounded-tl-none' 
                                                            : 'bg-orange-500 text-white rounded-tr-none text-right'
                                                        }`}>
                                                            {resp.message}
                                                        </div>
                                                        <div className={`flex items-center gap-2 mt-0.5 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                                                            {isFromAdmin && <span className="text-[8px] font-black text-orange-500 uppercase flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-full"><ShieldCheck size={8} /> Team</span>}
                                                            <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{formatDate(resp.created_at)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {selectedTicket.status !== 'CLOSED' && (
                                            <div className="p-4 border-t border-orange-100 dark:border-gray-700 bg-orange-50/20 dark:bg-gray-900/20">
                                                <form onSubmit={handleRespond} className="relative">
                                                    <textarea 
                                                        required 
                                                        rows="2" 
                                                        value={responseMessage} 
                                                        onChange={(e) => setResponseMessage(e.target.value)} 
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 focus:border-orange-500 rounded-xl outline-none transition-all font-semibold text-xs sm:text-sm resize-none pr-14 text-gray-900 dark:text-white" 
                                                        placeholder="Type your message here..."
                                                    ></textarea>
                                                    <div className="absolute right-2 bottom-2">
                                                        <button 
                                                            type="submit" 
                                                            disabled={isSubmitting || !responseMessage} 
                                                            className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95 disabled:bg-gray-200 dark:disabled:bg-gray-700 border-0 cursor-pointer"
                                                        >
                                                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar widget info */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-orange-100 dark:border-gray-700 text-center relative overflow-hidden shadow-sm">
                                <div className="w-12 h-12 bg-orange-50 dark:bg-gray-900 rounded-xl mx-auto flex items-center justify-center text-orange-500 border border-orange-100 dark:border-gray-700 shadow-inner mb-4">
                                    <Mail size={24} />
                                </div>
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Support Email</h4>
                                <p className="text-sm font-black text-gray-900 dark:text-white mb-4 break-all">hello@learnproofai.com</p>
                                <a 
                                    href="mailto:hello@learnproofai.com" 
                                    className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-lg uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-md shadow-orange-500/10 no-underline cursor-pointer"
                                >
                                    Compose Message
                                </a>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-orange-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-3">
                                    <HelpCircle size={18} className="text-orange-500" />
                                    <h3 className="font-black text-gray-800 dark:text-white text-xs uppercase tracking-widest">General FAQs</h3>
                                </div>
                                <div className="p-4 sm:p-5 space-y-4">
                                    {faqItems.map((item, i) => (
                                        <details key={i} className="group cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                                            <summary className="text-xs font-bold text-gray-700 dark:text-gray-300 list-none flex justify-between items-center group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                                                <span className="pr-4">{item.q}</span>
                                                <ChevronRight size={14} className="group-open:rotate-90 transition-all text-gray-400 dark:text-gray-550 flex-shrink-0" />
                                            </summary>
                                            <div className="mt-2 p-3 bg-orange-50/50 dark:bg-gray-900/50 rounded-xl text-xs font-semibold text-gray-550 dark:text-gray-400 leading-relaxed italic">
                                                {item.a}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 dark:bg-gray-950 relative overflow-hidden flex flex-col justify-between p-4 selection:bg-orange-200 select-none transition-colors duration-300">
            {/* Background Texture & Blobs */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[120px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[100px] opacity-40 z-0 pointer-events-none -translate-x-1/3" />

            <div className="flex-1 max-w-6xl w-full mx-auto relative z-10 py-8 px-2 sm:px-4">
                {/* Back button */}
                <button 
                    onClick={() => navigate(user ? '/dashboard' : '/')}
                    className="mb-8 flex items-center text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-bold transition-colors duration-200 uppercase tracking-widest text-xs gap-2 group cursor-pointer bg-transparent border-0"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    {user ? 'Back to Dashboard' : 'Back to Home'}
                </button>

                <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl border border-orange-200/80 dark:border-gray-700 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(249,115,22,0.08)] space-y-8">
                    {/* Header */}
                    <div className="border-b border-orange-100 dark:border-gray-800 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight uppercase mb-2">
                                Help & Support
                            </h1>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Student Assistance Center</p>
                        </div>
                        <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
                            <LifeBuoy size={32} />
                        </div>
                    </div>

                    {!token ? (
                        /* Unauthenticated public support view */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-orange-50/40 dark:bg-gray-800/40 rounded-2xl p-6 sm:p-8 border border-orange-100/50 dark:border-gray-700 space-y-4">
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Interactive Ticket Support</h2>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-semibold leading-relaxed">
                                        If you have an active account, please log in to submit a support ticket, chat directly with our team, and view your ticket history.
                                    </p>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl uppercase text-xs tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer border-0"
                                    >
                                        Login to Submit Ticket
                                    </button>
                                </div>

                                <div className="bg-orange-50/40 dark:bg-gray-800/40 rounded-2xl p-6 sm:p-8 border border-orange-100/50 dark:border-gray-700 space-y-4">
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Email Support</h2>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-semibold leading-relaxed">
                                        For general inquiries, account deletion requests, or if you cannot log in, you can contact us directly via email.
                                    </p>
                                    <a 
                                        href="mailto:hello@learnproofai.com"
                                        className="inline-block px-6 py-3.5 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 hover:shadow-lg text-gray-700 dark:text-gray-300 font-extrabold rounded-xl uppercase text-xs tracking-widest active:scale-95 transition-all cursor-pointer no-underline"
                                    >
                                        Email hello@learnproofai.com
                                    </a>
                                </div>
                            </div>

                            {/* FAQs Widget */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-orange-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-3">
                                        <HelpCircle size={18} className="text-orange-500" />
                                        <h3 className="font-black text-gray-800 dark:text-white text-xs uppercase tracking-widest">General FAQs</h3>
                                    </div>
                                    <div className="p-4 sm:p-5 space-y-4">
                                        {faqItems.map((item, i) => (
                                            <details key={i} className="group cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                                                <summary className="text-xs font-bold text-gray-700 dark:text-gray-300 list-none flex justify-between items-center group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                                                    <span className="pr-4">{item.q}</span>
                                                    <ChevronRight size={14} className="group-open:rotate-90 transition-all text-gray-400 dark:text-gray-550 flex-shrink-0" />
                                                </summary>
                                                <div className="mt-2 p-3 bg-orange-50/50 dark:bg-gray-900/50 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                                    {item.a}
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Authenticated View */
                        <div className="space-y-6">
                            {/* Navigation Tabs */}
                            <div className="flex justify-between items-center border-b border-orange-100 dark:border-gray-800 pb-4">
                                <div className="flex p-1 bg-orange-50 dark:bg-gray-800 border border-orange-100/50 dark:border-gray-700 rounded-xl">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = view === tab.id || (tab.id === 'history' && view === 'detail');
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setView(tab.id)}
                                                className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 border-0 ${
                                                    isActive 
                                                    ? "text-white bg-orange-500 shadow-md shadow-orange-500/10" 
                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent cursor-pointer"
                                                }`}
                                            >
                                                <Icon size={14} />
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main ticketing column */}
                                <div className="lg:col-span-2 space-y-6">
                                    <AnimatePresence mode="wait">
                                        {view === 'new' && (
                                            <motion.div 
                                                key="new" 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-gray-700 shadow-sm relative overflow-hidden"
                                            >
                                                <div className="mb-6">
                                                    <div className="flex items-center gap-2 mb-2 text-orange-500">
                                                        <Sparkles size={18} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Connect with our team</span>
                                                    </div>
                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Request Assistance</h2>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Please provide accurate context for a swift resolution.</p>
                                                </div>
                                                <form onSubmit={handleSubmit} className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Case Subject</label>
                                                        <input 
                                                            required 
                                                            type="text" 
                                                            value={formState.subject} 
                                                            onChange={(e) => setFormState({...formState, subject: e.target.value})} 
                                                            className="w-full px-4 py-3 bg-orange-50/20 dark:bg-gray-900/50 border border-orange-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold text-sm text-gray-900 dark:text-white" 
                                                            placeholder="What can we help you with?" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Detailed Message</label>
                                                        <textarea 
                                                            required 
                                                            rows="4" 
                                                            value={formState.message} 
                                                            onChange={(e) => setFormState({...formState, message: e.target.value})} 
                                                            className="w-full px-4 py-3 bg-orange-50/20 dark:bg-gray-900/50 border border-orange-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold text-sm text-gray-900 dark:text-white resize-none" 
                                                            placeholder="Describe the problem accurately..."
                                                        ></textarea>
                                                    </div>
                                                    <button 
                                                        type="submit" 
                                                        disabled={isSubmitting} 
                                                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-xs border-0 cursor-pointer"
                                                    >
                                                        {isSubmitting ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} /> Open Ticket</>}
                                                    </button>
                                                </form>
                                            </motion.div>
                                        )}

                                        {view === 'history' && (
                                            <motion.div 
                                                key="history" 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="space-y-4"
                                            >
                                                <div className="relative group mb-4">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search across support history..." 
                                                        value={searchQuery} 
                                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 shadow-sm rounded-xl outline-none focus:border-orange-500 transition-all font-semibold text-sm text-gray-900 dark:text-white" 
                                                    />
                                                </div>
                                                {loading && filteredTickets.length === 0 ? (
                                                    <div className="text-center py-10"><div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                                                ) : filteredTickets.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-semibold text-sm">No support tickets found.</div>
                                                ) : (
                                                    filteredTickets.map(ticket => (
                                                        <div 
                                                            key={ticket.id} 
                                                            onClick={() => fetchTicketDetail(ticket.id)} 
                                                            className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-orange-100 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-400 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4"
                                                        >
                                                            <div className="flex items-center gap-4 overflow-hidden">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusStyles(ticket.status)} border whitespace-nowrap`}>
                                                                    <MessageSquare size={16} />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm mb-1">{ticket.subject}</h3>
                                                                    <div className="flex items-center gap-2.5 text-[9px] uppercase font-bold tracking-wider text-gray-400">
                                                                        <span>{formatDate(ticket.created_at)}</span>
                                                                        <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                                                                        <span className={ticket.status === 'RESOLVED' ? 'text-green-500' : 'text-orange-500'}>{ticket.status}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-orange-500 flex-shrink-0" size={18} />
                                                        </div>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}

                                        {view === 'detail' && selectedTicket && (
                                            <motion.div 
                                                key="detail" 
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full"
                                            >
                                                <div className="p-4 sm:p-6 bg-orange-50/30 dark:bg-gray-900/30 border-b border-orange-100 dark:border-gray-700">
                                                    <button onClick={() => setView('history')} className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 font-black uppercase text-[9px] mb-3 hover:text-orange-500 transition-colors group bg-transparent border-0 cursor-pointer">
                                                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                                                    </button>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyles(selectedTicket.status)}`}>{selectedTicket.status}</span>
                                                        <span className="text-gray-300 dark:text-gray-600 text-xs font-bold">#{selectedTicket.id}</span>
                                                    </div>
                                                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-2">{selectedTicket.subject}</h2>
                                                </div>

                                                <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[400px] min-h-[300px] bg-white dark:bg-gray-800">
                                                    {/* Original Case Message */}
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">You (Original Case)</span>
                                                            <div className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center font-black text-[9px]">ME</div>
                                                        </div>
                                                        <div className="bg-orange-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] text-right font-semibold text-xs sm:text-sm leading-relaxed">
                                                            {selectedTicket.message}
                                                        </div>
                                                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pr-1">{formatDate(selectedTicket.created_at)}</span>
                                                    </div>

                                                    {/* Response Thread */}
                                                    {selectedTicket.responses.map(resp => {
                                                        const isFromAdmin = resp.adminId !== null;
                                                        return (
                                                            <div key={resp.id} className={`flex flex-col gap-1.5 ${isFromAdmin ? 'items-start' : 'items-end'}`}>
                                                                <div className={`flex items-center gap-2 mb-0.5 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px] shadow-sm ${isFromAdmin ? 'bg-slate-700 text-white' : 'bg-orange-500 text-white'}`}>
                                                                        {isFromAdmin ? <ShieldCheck size={12} /> : 'ME'}
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                                        {isFromAdmin ? 'Team Support' : 'You'}
                                                                    </span>
                                                                </div>
                                                                <div className={`p-3.5 rounded-2xl shadow-sm max-w-[85%] font-semibold text-xs sm:text-sm leading-relaxed ${
                                                                    isFromAdmin 
                                                                    ? 'bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 text-slate-800 dark:text-gray-200 rounded-tl-none' 
                                                                    : 'bg-orange-500 text-white rounded-tr-none text-right'
                                                                }`}>
                                                                    {resp.message}
                                                                </div>
                                                                <div className={`flex items-center gap-2 mt-0.5 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                                                                    {isFromAdmin && <span className="text-[8px] font-black text-orange-500 uppercase flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-full"><ShieldCheck size={8} /> Team</span>}
                                                                    <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{formatDate(resp.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {selectedTicket.status !== 'CLOSED' && (
                                                    <div className="p-4 border-t border-orange-100 dark:border-gray-700 bg-orange-50/20 dark:bg-gray-900/20">
                                                        <form onSubmit={handleRespond} className="relative">
                                                            <textarea 
                                                                required 
                                                                rows="2" 
                                                                value={responseMessage} 
                                                                onChange={(e) => setResponseMessage(e.target.value)} 
                                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 focus:border-orange-500 rounded-xl outline-none transition-all font-semibold text-xs sm:text-sm resize-none pr-14 text-gray-900 dark:text-white" 
                                                                placeholder="Type your message here..."
                                                            ></textarea>
                                                            <div className="absolute right-2 bottom-2">
                                                                <button 
                                                                    type="submit" 
                                                                    disabled={isSubmitting || !responseMessage} 
                                                                    className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95 disabled:bg-gray-200 dark:disabled:bg-gray-700 border-0 cursor-pointer"
                                                                >
                                                                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Sidebar widget info */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-orange-100 dark:border-gray-700 text-center relative overflow-hidden shadow-sm">
                                        <div className="w-12 h-12 bg-orange-50 dark:bg-gray-900 rounded-xl mx-auto flex items-center justify-center text-orange-500 border border-orange-100 dark:border-gray-700 shadow-inner mb-4">
                                            <Mail size={24} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Support Email</h4>
                                        <p className="text-sm font-black text-gray-900 dark:text-white mb-4 break-all">hello@learnproofai.com</p>
                                        <a 
                                            href="mailto:hello@learnproofai.com" 
                                            className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-lg uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-md shadow-orange-500/10 no-underline cursor-pointer"
                                        >
                                            Compose Message
                                        </a>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-orange-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-3">
                                            <HelpCircle size={18} className="text-orange-500" />
                                            <h3 className="font-black text-gray-800 dark:text-white text-xs uppercase tracking-widest">General FAQs</h3>
                                        </div>
                                        <div className="p-4 sm:p-5 space-y-4">
                                            {faqItems.map((item, i) => (
                                                <details key={i} className="group cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                                                    <summary className="text-xs font-bold text-gray-700 dark:text-gray-300 list-none flex justify-between items-center group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                                                        <span className="pr-4">{item.q}</span>
                                                        <ChevronRight size={14} className="group-open:rotate-90 transition-all text-gray-400 dark:text-gray-550 flex-shrink-0" />
                                                    </summary>
                                                    <div className="mt-2 p-3 bg-orange-50/50 dark:bg-gray-900/50 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                                        {item.a}
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Public Footer */}
            <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-3 pb-6">
                <div className="flex justify-center items-center gap-6 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    <a href="/" className="hover:text-orange-600 transition-colors">Company</a>
                    <a href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</a>
                    <a href="/terms" className="hover:text-orange-600 transition-colors">Terms</a>
                    <a href="/support" className="hover:text-orange-600 transition-colors">Support</a>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    &copy; 2025 LearnProof AI. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Support;

