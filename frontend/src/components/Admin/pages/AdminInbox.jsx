import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Mail, Send, Users, User, Trash2, Search, Filter, CheckCircle, Clock, Edit2, Bell, PlayCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// 12-hour format helper
const formatTime12h = (hour, minute) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = String(minute).padStart(2, '0');
    return `${h}:${m} ${ampm}`;
};

const AdminInbox = () => {
    const { token, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Form state
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'push', or 'schedule'
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Schedule state
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateHour, setTemplateHour] = useState(8);
    const [templateMinute, setTemplateMinute] = useState(0);
    const [templateEnabled, setTemplateEnabled] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, messagesRes, templatesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/users/`, {
                    params: { idToken: token }
                }),
                axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/sent/`, { idToken: token }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notification-templates`, {
                    params: { idToken: token }
                })
            ]);
            setUsers(usersRes.data);
            setMessages(messagesRes.data);
            setTemplates(templatesRes.data);
        } catch (err) {
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (tpl) => {
        setSelectedTemplate(tpl.type);
        setSubject(tpl.title);
        setMessage(tpl.body);
        setTemplateHour(tpl.hour);
        setTemplateMinute(tpl.minute);
        setTemplateEnabled(tpl.enabled);
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

    const handleSendPush = async (e) => {
        e.preventDefault();
        if (!subject || !message || (!isBroadcast && !selectedUser)) {
            toast.error("Please fill all fields");
            return;
        }

        setSending(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/send-push/`, {
                idToken: token,
                receiverUid: isBroadcast ? null : selectedUser,
                isBroadcast,
                title: subject,
                body: message
            });
            toast.success(res.data.message || "Push notification sent successfully!");
            setSubject('');
            setMessage('');
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send push notification");
        } finally {
            setSending(false);
        }
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !subject || !message) {
            toast.error("Please fill all fields");
            return;
        }

        setSending(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notification-templates/`, {
                idToken: token,
                type: selectedTemplate,
                title: subject,
                body: message,
                hour: templateHour,
                minute: templateMinute,
                enabled: templateEnabled
            });
            toast.success(res.data.message || "Daily schedule updated successfully!");
            
            // Refresh list
            const templatesRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notification-templates`, {
                params: { idToken: token }
            });
            setTemplates(templatesRes.data);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update template");
        } finally {
            setSending(false);
        }
    };

    const handleSendTestPush = async (tpl) => {
        if (!user || !user.uid) {
            toast.error("You must be logged in to send a test push");
            return;
        }

        setSending(true);
        try {
            // Replace templates placeholders with admin user details for preview
            const testTitle = tpl.title
                .replace(/{streak}/g, "5")
                .replace(/{name}/g, user.name || "Admin");
            const testBody = tpl.body
                .replace(/{streak}/g, "5")
                .replace(/{name}/g, user.name || "Admin");

            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/send-push/`, {
                idToken: token,
                receiverUid: user.uid,
                isBroadcast: false,
                title: `[Test] ${testTitle}`,
                body: testBody
            });
            
            if (res.data.sentCount === 0) {
                toast.error("No registered FCM tokens found for your account. Please allow push notifications in this browser first!");
            } else {
                toast.success("Test push notification dispatched successfully to your device!");
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send test push notification.");
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
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <Send size={18} className="text-orange-500" />
                                {activeTab === 'inbox' ? 'Compose Message' : activeTab === 'push' ? 'Compose Push Notification' : 'Manage Daily Reminders'}
                            </h2>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 gap-1">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('inbox'); setSubject(''); setMessage(''); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inbox' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    Inbox Mail
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('push'); setSubject(''); setMessage(''); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'push' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    Push Alert
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { 
                                        setActiveTab('schedule'); 
                                        if (templates.length > 0) {
                                            handleSelectTemplate(templates[0]);
                                        } else {
                                            setSubject('');
                                            setMessage('');
                                        }
                                    }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'schedule' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    Daily Schedule
                                </button>
                            </div>
                        </div>
                        <form onSubmit={
                            activeTab === 'inbox' ? handleSendMessage : 
                            activeTab === 'push' ? handleSendPush : 
                            handleSaveTemplate
                        } className="p-6 space-y-4">
                            {/* Daily Schedule Editor */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Select Reminder Slot</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {templates.map(tpl => (
                                                <button
                                                    key={tpl.type}
                                                    type="button"
                                                    onClick={() => handleSelectTemplate(tpl)}
                                                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${selectedTemplate === tpl.type ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                >
                                                    {tpl.type === 'STREAK_KEEP_ALIVE' ? '📚' : '🔥'} {formatTime12h(tpl.hour, tpl.minute)} Alert
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Hour (0-23)</label>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={templateHour}
                                                onChange={(e) => setTemplateHour(parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Minute (0-59)</label>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={templateMinute}
                                                onChange={(e) => setTemplateMinute(parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Notification</span>
                                        <button
                                            type="button"
                                            onClick={() => setTemplateEnabled(!templateEnabled)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${templateEnabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${templateEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Recipient Controls */}
                            {activeTab !== 'schedule' && (
                                <>
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
                                </>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    {activeTab === 'inbox' ? 'Subject' : 'Notification Title'}
                                </label>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder={activeTab === 'inbox' ? "Enter subject..." : "Enter notification title..."}
                                    className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    {activeTab === 'inbox' ? 'Message' : 'Notification Body'}
                                </label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    placeholder={activeTab === 'inbox' ? "Write your message here..." : "Write push message body..."}
                                    className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                />
                                {activeTab === 'schedule' && (
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-medium bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <Info size={12} className="text-orange-500" />
                                        <span>Use tags: <code>{'{name}'}</code> (recipient name), <code>{'{streak}'}</code> (streak count)</span>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={sending}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sending ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                                {activeTab === 'inbox' ? 'Send Message' : activeTab === 'push' ? 'Send Push Notification' : 'Save Reminder Settings'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right context panel: Schedule templates or Sent Messages History */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'schedule' ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                                <div className="space-y-1">
                                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                        <Bell size={20} className="text-orange-500" />
                                        Active Daily Schedules
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure daily streak reminder schedules and notification content</p>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                    {templates.length} Templates
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {templates.map(tpl => {
                                    const isEnabled = tpl.enabled;
                                    return (
                                        <div 
                                            key={tpl.type} 
                                            className={`p-5 rounded-2xl border transition-all ${
                                                isEnabled 
                                                    ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-orange-500/30' 
                                                    : 'bg-slate-100/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900 opacity-60'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full border border-orange-500/20 uppercase tracking-wider">
                                                            {tpl.type === 'STREAK_KEEP_ALIVE' ? 'Streak Keep Alive' : 'Streak At Risk'}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 ${
                                                            isEnabled 
                                                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                                                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                                        }`}>
                                                            <CheckCircle size={10} /> {isEnabled ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                        {tpl.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 self-start px-3 py-1.5 bg-orange-500/10 dark:bg-orange-500/5 text-orange-500 rounded-xl border border-orange-500/20 text-xs font-black">
                                                    <Clock size={14} />
                                                    Sends daily at {formatTime12h(tpl.hour, tpl.minute)}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 mb-4 shadow-inner">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium whitespace-pre-wrap">
                                                    "{tpl.body}"
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-900">
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                    <Info size={12} className="text-slate-400" />
                                                    Supports: <code className="bg-slate-100 dark:bg-slate-800 text-orange-500 px-1 rounded font-bold">{'{streak}'}</code> and <code className="bg-slate-100 dark:bg-slate-800 text-orange-500 px-1 rounded font-bold">{'{name}'}</code>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectTemplate(tpl)}
                                                        className="px-4 py-2 text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                                                    >
                                                        <Edit2 size={12} />
                                                        Edit Details
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={sending}
                                                        onClick={() => handleSendTestPush(tpl)}
                                                        className="px-4 py-2 text-xs font-black bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md shadow-orange-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        <PlayCircle size={12} />
                                                        Send Test Push
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
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
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">To:</span>
                                                        {msg.isBroadcast ? (
                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">All Users</span>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                <img src={msg.receiver?.profile_pic || `https://ui-avatars.com/api/?name=${msg.receiver?.name}`} className="w-4 h-4 rounded-full" alt="" />
                                                                {msg.receiver?.name || "Unknown User"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 whitespace-pre-wrap italic">
                                                        "{msg.message}"
                                                    </p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Delete message"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    </div>
    );
};

export default AdminInbox;
