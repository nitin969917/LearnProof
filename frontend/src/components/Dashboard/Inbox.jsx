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
            <div className="px-3 sm:px-4 pt-3 max-w-2xl mx-auto space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-3 pb-28">
            {/* ── Compact Mobile Header ─────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Your Inbox</h1>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Updates and personalized insights</p>
                </div>
                <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/20 px-2.5 py-1.5 rounded-xl">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                        {messages.filter(m => !m.isRead).length} unread
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Message List */}
                <div className={`${selectedMessage ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-12'} space-y-2`}>
                    {messages.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-gray-700">
                                <InboxIcon size={22} />
                            </div>
                            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200">Your inbox is empty</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mx-auto mt-1 mb-4 max-w-[220px]">Check back later for important updates and notifications.</p>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition-colors active:scale-95"
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
                                    className={`group p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                                        selectedMessage?.id === msg.id
                                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/30'
                                    }`}
                                >
                                    {!msg.isRead && (
                                        <div className="absolute top-0 left-0 w-[3px] h-full bg-orange-500" />
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${!msg.isRead ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'} transition-colors`}>
                                                <Bell size={14} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`font-bold text-xs truncate ${!msg.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {msg.subject}
                                                </h3>
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 shrink-0">
                                                    {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                                                {msg.message}
                                            </p>
                                        </div>
                                        <ChevronRight size={13} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${selectedMessage?.id === msg.id ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`} />
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-fit lg:sticky lg:top-24"
                        >
                            {/* Formal Detail Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                                <button 
                                    onClick={() => setSelectedMessage(null)}
                                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all"
                                >
                                    <ArrowRight className="rotate-180" size={18} />
                                </button>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {new Date(selectedMessage.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-4">
                                {/* Subject + sender */}
                                <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-2">
                                        {selectedMessage.subject}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                                            <User size={12} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">LearnProof Support</p>
                                        <span className="text-gray-300">•</span>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Official</p>
                                    </div>
                                </div>

                                {/* Message Content */}
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </div>

                                {/* Footer */}
                                <div className="pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                                    <button 
                                        onClick={() => setSelectedMessage(null)}
                                        className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all"
                                    >
                                        Close <ArrowRight size={12} />
                                    </button>
                                    <div className="flex items-center gap-1.5 opacity-50">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Verified</span>
                                    </div>
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