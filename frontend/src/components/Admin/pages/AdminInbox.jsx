import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { 
    Mail, Send, Users, User, Trash2, Search, Filter, CheckCircle, 
    Clock, Edit2, Bell, PlayCircle, Info, Sparkles, MessageSquare, 
    Smartphone, Check, X, ShieldAlert, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useModal } from '../../../context/ModalContext';

// 12-hour format helper
const formatTime12h = (hour, minute) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = String(minute).padStart(2, '0');
    return `${h}:${m} ${ampm}`;
};

const TEMPLATE_PRESETS = [
    {
        title: "🚀 New AI Features Launched!",
        subject: "Explore new AI Workspaces & Notes on LearnProof!",
        message: "Hi {name}! We just rolled out powerful new AI study tools, smart workspaces, and interactive quiz engines to boost your daily learning. Jump in and try them out today!"
    },
    {
        title: "🔥 Keep Your Study Streak Alive!",
        subject: "Don't break your {streak}-day learning streak!",
        message: "You're doing fantastic! Complete today's 15-minute learning session to maintain your streak and earn bonus platform XP."
    },
    {
        title: "🏆 Campus Ambassador Reward Update",
        subject: "Your Campus Referral Rewards are Live",
        message: "Thanks for sharing LearnProof with your college! Check your ambassador portal to see your latest referral count and milestone perks."
    },
    {
        title: "📢 System Maintenance Notice",
        subject: "Scheduled Platform Performance Upgrade",
        message: "We're performing scheduled infrastructure optimization tonight at 2:00 AM UTC. LearnProof will remain fully operational with faster video indexing."
    }
];

const AdminInbox = () => {
    const { token, user } = useAuth();
    const { confirm } = useModal();
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Mode state: 'inbox' (Direct/Broadcast Mail), 'push' (Instant Push Alert), 'schedule' (Automated Daily Reminders)
    const [activeTab, setActiveTab] = useState('inbox');
    const [isBroadcast, setIsBroadcast] = useState(true);
    const [selectedUserUid, setSelectedUserUid] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'broadcast', 'direct'
    const [historySearch, setHistorySearch] = useState('');

    // Schedule state
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateHour, setTemplateHour] = useState(8);
    const [templateMinute, setTemplateMinute] = useState(0);
    const [templateEnabled, setTemplateEnabled] = useState(true);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

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
            setUsers(usersRes.data || []);
            setMessages(messagesRes.data || []);
            setTemplates(templatesRes.data || []);
            if (templatesRes.data?.length > 0 && !selectedTemplate) {
                handleSelectTemplate(templatesRes.data[0]);
            }
        } catch (err) {
            toast.error("Failed to fetch communication data");
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

    const applyPreset = (preset) => {
        setSubject(preset.subject);
        setMessage(preset.message);
        toast.success(`Applied template: "${preset.title}"`);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim() || (!isBroadcast && !selectedUserUid)) {
            toast.error("Please provide both subject, message and select a recipient");
            return;
        }

        setSending(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/send/`, {
                idToken: token,
                receiverUid: isBroadcast ? null : selectedUserUid,
                isBroadcast,
                subject: subject.trim(),
                message: message.trim()
            });
            toast.success(isBroadcast ? "Broadcast message sent to all learners!" : "Direct message delivered successfully!");
            setSubject('');
            setMessage('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleSendPush = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim() || (!isBroadcast && !selectedUserUid)) {
            toast.error("Please provide title, message body and choose a target");
            return;
        }

        setSending(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/send-push/`, {
                idToken: token,
                receiverUid: isBroadcast ? null : selectedUserUid,
                isBroadcast,
                title: subject.trim(),
                body: message.trim()
            });
            toast.success(res.data.message || "Push notification dispatched successfully!");
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
        if (!selectedTemplate || !subject.trim() || !message.trim()) {
            toast.error("Please fill in all template fields");
            return;
        }

        setSending(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notification-templates/`, {
                idToken: token,
                type: selectedTemplate,
                title: subject.trim(),
                body: message.trim(),
                hour: templateHour,
                minute: templateMinute,
                enabled: templateEnabled
            });
            toast.success(res.data.message || "Daily schedule updated successfully!");
            
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
        const confirmed = await confirm({
            title: "Delete Sent Message?",
            message: "Are you sure you want to permanently delete this message record from system logs?",
            confirmText: "Delete",
            type: "danger"
        });
        if (!confirmed) return;
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/delete/`, {
                idToken: token,
                messageId: id
            });
            toast.success("Message record deleted");
            fetchData();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedUserObj = users.find(u => u.uid === selectedUserUid);

    const filteredMessages = messages
        .filter(m => m.senderId)
        .filter(m => {
            if (historyFilter === 'broadcast') return m.isBroadcast;
            if (historyFilter === 'direct') return !m.isBroadcast;
            return true;
        })
        .filter(m => {
            if (!historySearch.trim()) return true;
            const q = historySearch.toLowerCase();
            return (
                (m.subject || '').toLowerCase().includes(q) ||
                (m.message || '').toLowerCase().includes(q) ||
                (m.receiver?.name || '').toLowerCase().includes(q) ||
                (m.receiver?.email || '').toLowerCase().includes(q)
            );
        });

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Top Command Bar & Statistics */}
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-500/5 dark:via-transparent p-6 rounded-3xl border border-orange-500/15 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Broadcast & Notification Engine
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Communication Center
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Dispatch in-app notifications, browser push alerts, and manage automated daily study reminders.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Users size={16} className="text-blue-500" />
                        <span>{users.length} Learners</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Bell size={16} className="text-orange-500" />
                        <span>{templates.filter(t => t.enabled).length} Active Crons</span>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-all shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Mode Switcher Banner (Tabs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    type="button"
                    onClick={() => { setActiveTab('inbox'); }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 ${
                        activeTab === 'inbox'
                            ? 'bg-white dark:bg-slate-900 border-orange-500 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20'
                            : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className={`p-3 rounded-xl ${activeTab === 'inbox' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Mail size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">In-App Mail</h3>
                            {activeTab === 'inbox' && <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Direct to student notification bell & messages tray</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveTab('push'); }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 ${
                        activeTab === 'push'
                            ? 'bg-white dark:bg-slate-900 border-orange-500 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20'
                            : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className={`p-3 rounded-xl ${activeTab === 'push' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Smartphone size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Instant Push Alert</h3>
                            {activeTab === 'push' && <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Direct to device lockscreen via Firebase FCM</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => { 
                        setActiveTab('schedule'); 
                        if (templates.length > 0) handleSelectTemplate(templates[0]);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 ${
                        activeTab === 'schedule'
                            ? 'bg-white dark:bg-slate-900 border-orange-500 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20'
                            : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className={`p-3 rounded-xl ${activeTab === 'schedule' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Daily Streak Schedule</h3>
                            {activeTab === 'schedule' && <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Automated daily cron jobs for streak preservation</p>
                    </div>
                </button>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form & Presets (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Quick Presets */}
                    {activeTab !== 'schedule' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Sparkles size={14} className="text-amber-500" />
                                Quick Template Presets
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATE_PRESETS.map((preset, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                                    >
                                        {preset.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Compose Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send size={18} className="text-orange-500" />
                                {activeTab === 'inbox' ? 'Compose In-App Mail' : activeTab === 'push' ? 'Dispatch Instant Push' : 'Edit Automated Cron'}
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                {activeTab === 'inbox' ? 'Web + Mobile' : activeTab === 'push' ? 'FCM Devices' : 'Recurring'}
                            </span>
                        </div>

                        <form onSubmit={
                            activeTab === 'inbox' ? handleSendMessage : 
                            activeTab === 'push' ? handleSendPush : 
                            handleSaveTemplate
                        } className="p-6 space-y-5">
                            {/* Schedule Specific Controls */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-4 bg-orange-50/40 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                                        Select Target Cron Slot
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {templates.map(tpl => (
                                            <button
                                                key={tpl.type}
                                                type="button"
                                                onClick={() => handleSelectTemplate(tpl)}
                                                className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                                                    selectedTemplate === tpl.type 
                                                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20' 
                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-500/40'
                                                }`}
                                            >
                                                {tpl.type === 'STREAK_KEEP_ALIVE' ? '🌅 Morning Reminder' : '🔥 Evening At Risk'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Dispatch Hour (0-23)</label>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={templateHour}
                                                onChange={(e) => setTemplateHour(parseInt(e.target.value) || 0)}
                                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Minute (0-59)</label>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={templateMinute}
                                                onChange={(e) => setTemplateMinute(parseInt(e.target.value) || 0)}
                                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Trigger Daily at {formatTime12h(templateHour, templateMinute)}</span>
                                        <button
                                            type="button"
                                            onClick={() => setTemplateEnabled(!templateEnabled)}
                                            className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                                templateEnabled 
                                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {templateEnabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Recipient Targeting (for Inbox & Push) */}
                            {activeTab !== 'schedule' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                        Audience & Targeting
                                    </label>

                                    {/* Segmented Switcher */}
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsBroadcast(true)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                isBroadcast
                                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Users size={14} />
                                            <span>Broadcast to All ({users.length})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsBroadcast(false)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                !isBroadcast
                                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <User size={14} />
                                            <span>Specific Learner</span>
                                        </button>
                                    </div>

                                    {/* User Selector Dropdown */}
                                    {!isBroadcast && (
                                        <div className="space-y-2 pt-1">
                                            {selectedUserObj ? (
                                                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {selectedUserObj.profile_pic ? (
                                                            <img src={selectedUserObj.profile_pic} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                                                {selectedUserObj.name?.charAt(0) || 'U'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedUserObj.name}</p>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{selectedUserObj.email}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedUserUid('')}
                                                        className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400 text-xs font-bold"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input 
                                                            type="text"
                                                            placeholder="Search learner by name or email..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="max-h-44 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl p-1.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-1 custom-scrollbar">
                                                        {filteredUsers.length > 0 ? (
                                                            filteredUsers.slice(0, 30).map(u => (
                                                                <button
                                                                    key={u.uid}
                                                                    type="button"
                                                                    onClick={() => setSelectedUserUid(u.uid)}
                                                                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-colors hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                                >
                                                                    {u.profile_pic ? (
                                                                        <img src={u.profile_pic} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                                                            {u.name?.charAt(0) || 'U'}
                                                                        </div>
                                                                    )}
                                                                    <div className="truncate flex-1">
                                                                        <div className="font-bold text-slate-900 dark:text-white truncate">{u.name}</div>
                                                                        <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-400">No matching learners found</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Message Subject */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <span>{activeTab === 'inbox' ? 'Subject' : 'Notification Title'}</span>
                                    <span className="text-[10px] font-normal text-slate-400">{subject.length}/100</span>
                                </div>
                                <input 
                                    type="text"
                                    maxLength={100}
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder={activeTab === 'inbox' ? "e.g., Weekly Learning Digest..." : "e.g., Don't break your streak today! 🔥"}
                                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Message Body */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <span>{activeTab === 'inbox' ? 'Message Content' : 'Push Body'}</span>
                                    <span className="text-[10px] font-normal text-slate-400">{message.length}/500</span>
                                </div>
                                <textarea 
                                    value={message}
                                    maxLength={500}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    placeholder={activeTab === 'inbox' ? "Write your message content here..." : "Write brief lockscreen notification message..."}
                                    className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none text-slate-900 dark:text-white leading-relaxed"
                                />
                                {activeTab === 'schedule' && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <Info size={13} className="text-orange-500 shrink-0" />
                                        <span>Dynamic Tags: <code className="bg-orange-100 dark:bg-orange-950 text-orange-600 px-1 rounded font-bold">{'{name}'}</code> and <code className="bg-orange-100 dark:bg-orange-950 text-orange-600 px-1 rounded font-bold">{'{streak}'}</code></span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                disabled={sending}
                                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sending ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                                {activeTab === 'inbox' ? 'Dispatch In-App Message' : activeTab === 'push' ? 'Dispatch Push Notification' : 'Save Cron Settings'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Sent History OR Schedule Manager (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {activeTab === 'schedule' ? (
                        /* Automated Schedules Manager */
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                        <Bell size={20} className="text-orange-500" />
                                        Automated Streak Crons
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated push notifications sent every day to active learners</p>
                                </div>
                                <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30">
                                    {templates.length} Slots Active
                                </span>
                            </div>

                            <div className="space-y-4">
                                {templates.map(tpl => {
                                    const isEnabled = tpl.enabled;
                                    const isMorning = tpl.type === 'STREAK_KEEP_ALIVE';

                                    return (
                                        <div 
                                            key={tpl.type} 
                                            className={`p-5 rounded-2xl border transition-all ${
                                                isEnabled 
                                                    ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 hover:border-orange-500/40' 
                                                    : 'bg-slate-100/40 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 opacity-60'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                                                            {isMorning ? '🌅 Morning Streak Alert' : '🔥 Evening Urgency Alert'}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 ${
                                                            isEnabled 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                                        }`}>
                                                            <CheckCircle size={10} /> {isEnabled ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                        {tpl.title}
                                                    </h3>
                                                </div>

                                                <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-200 dark:border-orange-900/30 text-xs font-bold flex items-center gap-1.5 self-start shrink-0">
                                                    <Clock size={13} />
                                                    Runs daily at {formatTime12h(tpl.hour, tpl.minute)}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 shadow-sm">
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                    "{tpl.body}"
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                                <span className="text-slate-400 text-[11px]">
                                                    Template Type: <code className="font-mono text-slate-600 dark:text-slate-300">{tpl.type}</code>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectTemplate(tpl)}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
                                                    >
                                                        <Edit2 size={12} /> Edit Template
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={sending}
                                                        onClick={() => handleSendTestPush(tpl)}
                                                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20 disabled:opacity-50"
                                                    >
                                                        <PlayCircle size={12} /> Send Test Push
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Sent History Card */
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                        <Mail size={20} className="text-orange-500" />
                                        Dispatched Communication Log
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Audit history of all broadcast announcements and direct user emails</p>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
                                    {filteredMessages.length} Messages
                                </span>
                            </div>

                            {/* History Search & Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search history by subject, body or user..."
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    {[
                                        { key: 'all', label: 'All' },
                                        { key: 'broadcast', label: 'Broadcasts' },
                                        { key: 'direct', label: 'Direct' }
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setHistoryFilter(tab.key)}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                                historyFilter === tab.key
                                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 pb-4 custom-scrollbar">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse space-y-3">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                                        </div>
                                    ))
                                ) : filteredMessages.length === 0 ? (
                                    <div className="p-16 text-center space-y-3">
                                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                                            <Mail size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No communication records found</p>
                                        <p className="text-xs text-slate-400">Compose and dispatch your first announcement from the left panel.</p>
                                    </div>
                                ) : (
                                    filteredMessages.map(msg => (
                                        <motion.div 
                                            layout
                                            key={msg.id} 
                                            className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-slate-100/80 dark:border-slate-800 transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {msg.isBroadcast ? (
                                                            <span className="text-[10px] font-black bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider border border-purple-200 dark:border-purple-900/30">
                                                                <Users size={11} /> Broadcast (All Learners)
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider border border-blue-200 dark:border-blue-900/30">
                                                                <User size={11} /> Direct User Mail
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-slate-400 font-medium">
                                                            {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {msg.subject}
                                                    </h3>

                                                    {!msg.isBroadcast && msg.receiver && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                            <span>To:</span>
                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                                                                {msg.receiver.profile_pic ? (
                                                                    <img src={msg.receiver.profile_pic} className="w-4 h-4 rounded-full object-cover" alt="" />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-[9px]">
                                                                        {msg.receiver.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                )}
                                                                <span>{msg.receiver.name}</span>
                                                                <span className="text-slate-400 text-[11px]">({msg.receiver.email})</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                                                            {msg.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shrink-0"
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
