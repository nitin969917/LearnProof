import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Mail, Send, Users, User, Trash2, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminInbox = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Form state
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, messagesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/users/`, {
                    params: { idToken: token }
                }),
                axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/inbox/`, { idToken: token })
            ]);
            setUsers(usersRes.data);
            setMessages(messagesRes.data);
        } catch (err) {
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!subject || !message || (!isBroadcast && !selectedUser)) {
            toast.error("Please fill all fields");
            return;
        }

        setSending(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/send/`, {
                idToken: token,
                receiverUid: isBroadcast ? null : selectedUser,
                isBroadcast,
                subject,
                message
            });
            toast.success("Message sent successfully!");
            setSubject('');
            setMessage('');
            fetchData(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/delete/`, {
                idToken: token,
                messageId: id
            });
            toast.success("Deleted");
            fetchData();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-500/20">
                            <Mail size={24} />
                        </div>
                        Communication Center
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Send announcements and direct messages to users.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compose Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send size={18} className="text-orange-500" />
                                Compose Message
                            </h2>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            {/* Toggle Broadcast */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Users size={18} className={isBroadcast ? "text-orange-500" : "text-slate-400"} />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Broadcast to all</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBroadcast(!isBroadcast)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${isBroadcast ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isBroadcast ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* User Selection if not broadcast */}
                            {!isBroadcast && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Recipient</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Search user..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-1 bg-slate-50/50 dark:bg-slate-800/30">
                                        {filteredUsers.map(user => (
                                            <button
                                                key={user.uid}
                                                type="button"
                                                onClick={() => setSelectedUser(user.uid)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${selectedUser === user.uid ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                            >
                                                <img src={user.profile_pic || `https://ui-avatars.com/api/?name=${user.name}`} className="w-6 h-6 rounded-full border border-white/20" alt="" />
                                                <div className="truncate">
                                                    <div className="font-bold truncate">{user.name}</div>
                                                    <div className="text-[10px] opacity-70 truncate">{user.email}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Subject</label>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter subject..."
                                    className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Message</label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    placeholder="Write your message here..."
                                    className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                />
                            </div>

                            <button
                                disabled={sending}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sending ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sent Messages History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Mail size={18} className="text-orange-500" />
                                Sent History
                            </h2>
                            <div className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                {messages.filter(m => m.senderId).length} Messages
                            </div>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-6 animate-pulse space-y-3">
                                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                                        <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-3/4"></div>
                                    </div>
                                ))
                            ) : messages.filter(m => m.senderId).length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-700">
                                        <Mail size={32} />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold">No sent messages yet.</p>
                                </div>
                            ) : (
                                messages.filter(m => m.senderId).map(msg => (
                                    <motion.div 
                                        layout
                                        key={msg.id} 
                                        className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {msg.isBroadcast ? (
                                                        <span className="text-[10px] font-black bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-widest border border-purple-500/20">
                                                            <Users size={10} /> Broadcast
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-widest border border-blue-500/20">
                                                            <User size={10} /> Direct
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                        {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                                    {msg.subject}
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(msg.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminInbox;
