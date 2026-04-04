import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox as InboxIcon, Mail, CheckCircle, Trash2, ArrowRight, Bell, Calendar, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Inbox = () => {
    const { token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/inbox/`, {
                idToken: token
            });
            setMessages(res.data);
        } catch (err) {
            console.error("Inbox fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/mark-read/`, {
                idToken: token,
                messageId: id
            });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const openMessage = (msg) => {
        setSelectedMessage(msg);
        if (!msg.isRead) {
            handleMarkRead(msg.id);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-h-[80vh] animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
                            <Mail size={24} />
                        </div>
                        Your Inbox
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Keep up with the latest updates and personalized insights.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {messages.filter(m => !m.isRead).length} Unread
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Message List */}
                <div className={`${selectedMessage ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
                    {messages.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-700">
                                <InboxIcon size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Your inbox is empty</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">Check back later for important updates and notifications.</p>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-xl font-black text-sm hover:bg-orange-600 transition-colors"
                            >
                                Start Learning
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => openMessage(msg)}
                                    className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                                        selectedMessage?.id === msg.id
                                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-md'
                                    }`}
                                >
                                    {!msg.isRead && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[2px_0_10px_rgba(249,115,22,0.4)]" />
                                    )}
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className={`p-3 rounded-xl ${!msg.isRead ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'} transition-colors`}>
                                                <Bell size={20} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                    {msg.isBroadcast ? 'Platform Announcement' : 'Direct Message'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                    {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <h3 className={`font-bold truncate ${!msg.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {msg.subject}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1 font-medium">
                                                {msg.message}
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <ChevronRight size={18} className={`transition-transform group-hover:translate-x-1 ${selectedMessage?.id === msg.id ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message Detail View */}
                <AnimatePresence mode="wait">
                    {selectedMessage && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col h-fit sticky top-24"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                <button 
                                    onClick={() => setSelectedMessage(null)}
                                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    <ArrowRight className="rotate-180" size={20} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                        <Bell size={18} />
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px]">Message Details</span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        {new Date(selectedMessage.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                        {selectedMessage.subject}
                                    </h2>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">From Platform Team</p>
                                            <p className="font-bold text-gray-800 dark:text-gray-200">System Administrator</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                                    {selectedMessage.message}
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                                    <button 
                                        onClick={() => setSelectedMessage(null)}
                                        className="inline-flex items-center gap-2 text-orange-500 font-black text-sm uppercase tracking-widest hover:gap-3 transition-all"
                                    >
                                        Back to Message List <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Inbox;