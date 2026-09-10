import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Inbox as InboxIcon, Mail, Bell, Check, X, UserPlus, Users, 
    MessageSquare, ArrowRight, ChevronRight, User, Clock, 
    Radio, CheckCircle2, Sparkles, ExternalLink, RefreshCw, 
    Volume2, ShieldCheck, UserCheck, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socialApi from '../../api/socialApi.js';
import { useSocialFeedStore } from '../../store/socialFeedStore.js';
import { useSocialMessageStore } from '../../store/socialMessageStore.js';
import { useSocialStatusStore } from '../../store/socialStatusStore.js';
import UserAvatar from '../Common/UserAvatar.jsx';

function formatTimeAgo(dateString) {
    if (!dateString) return 'recently';
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'recently';
    const diffInSec = Math.floor((now - date) / 1000);
    
    if (diffInSec < 60) return 'just now';
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 60) return `${diffInMin}m ago`;
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const Inbox = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // Store states
    const pendingFriendCount = useSocialFeedStore((state) => state.pendingFriendCount);
    const storePendingRequests = useSocialFeedStore((state) => state.pendingRequests);
    const fetchFriends = useSocialFeedStore((state) => state.fetchFriends);
    const acceptFriendRequestLocally = useSocialFeedStore((state) => state.acceptFriendRequestLocally);
    const declineFriendRequestLocally = useSocialFeedStore((state) => state.declineFriendRequestLocally);
    const onlineUserIds = useSocialStatusStore((state) => state.onlineUserIds);
    const socialUser = useSocialFeedStore((state) => state.socialUser);
    const friends = useSocialFeedStore((state) => state.friends);

    const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);
    const unreadByContact = useSocialMessageStore((state) => state.unreadByContact);
    const fetchUnreadCounts = useSocialMessageStore((state) => state.fetchUnreadCounts);

    // Component state
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'requests' | 'messages' | 'rooms' | 'system'
    const [pendingRequests, setPendingRequests] = useState(storePendingRequests || []);
    const [recentChats, setRecentChats] = useState([]);
    const [systemMessages, setSystemMessages] = useState([]);
    const [liveRooms, setLiveRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Track request actions per item (e.g. { [reqId]: 'accepted' | 'declined' })
    const [actionStates, setActionStates] = useState({});

    // Load all inbox notification sources
    const loadInboxData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const promises = [];

            // 1. Fetch friend requests & friends for recent message snippets
            const friendshipPromise = socialApi.get('/social/friendships').then(res => {
                const rawPending = Array.isArray(res.data?.pending) ? res.data.pending : [];
                const rawFriends = Array.isArray(res.data?.friends) ? res.data.friends : [];
                setPendingRequests(rawPending);
                
                // Filter friends who have a lastMessage or unread count
                const activeChats = rawFriends
                    .filter(f => f.lastMessage || (unreadByContact[f.id?.toString()] > 0))
                    .map(f => ({
                        ...f,
                        unreadCount: unreadByContact[f.id?.toString()] || 0
                    }));
                setRecentChats(activeChats);
                return rawFriends;
            }).catch(err => {
                console.error("Failed to load friendships in inbox:", err);
                return [];
            });
            promises.push(friendshipPromise);

            // 2. Fetch system messages from backend
            if (token) {
                promises.push(
                    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/inbox/`, {
                        idToken: token
                    }).then(res => {
                        setSystemMessages(Array.isArray(res.data) ? res.data : []);
                    }).catch(err => {
                        console.error("Failed to load system messages in inbox:", err);
                    })
                );
            }

            // 3. Fetch active language/live rooms (ONLY consider rooms created by friends)
            promises.push(
                Promise.all([friendshipPromise, socialApi.get('/language-rooms')]).then(([friends, res]) => {
                    const friendIds = new Set((friends || []).map(f => Number(f.id)));
                    const rooms = Array.isArray(res.data) ? res.data : [];
                    const currentUserId = socialUser?.id ? Number(socialUser.id) : null;

                    const friendActiveRooms = rooms.filter(r => {
                        const isFutureScheduled = r.scheduledFor && new Date(r.scheduledFor).getTime() > Date.now() && !r.isStartedNotificationSent;
                        if (isFutureScheduled) return false;
                        const creatorId = Number(r.creatorId || r.creator?.id);
                        return creatorId !== currentUserId && friendIds.has(creatorId);
                    });

                    setLiveRooms(friendActiveRooms);
                    useSocialFeedStore.getState().setActiveRoomsCount(friendActiveRooms.length);
                }).catch(() => {
                    setLiveRooms([]);
                    useSocialFeedStore.getState().setActiveRoomsCount(0);
                })
            );

            // 4. Also refresh unread counts in store
            fetchUnreadCounts();

            await Promise.allSettled(promises);
        } catch (error) {
            console.error("Error loading inbox notifications:", error);
        } finally {
            setLoading(false);
            if (isManualRefresh) {
                setRefreshing(false);
                toast.success('Inbox refreshed');
            }
        }
    };

    useEffect(() => {
        loadInboxData();
    }, [token]);

    // Keep pendingRequests in sync if store updates
    useEffect(() => {
        if (storePendingRequests && storePendingRequests.length > 0) {
            setPendingRequests(storePendingRequests);
        }
    }, [storePendingRequests]);

    // Accept friend / follow request directly from inbox
    const handleAcceptRequest = async (reqItem) => {
        const reqId = reqItem.id;
        const senderName = reqItem.sender?.name || 'User';
        
        setActionStates(prev => ({ ...prev, [reqId]: 'accepted' }));
        acceptFriendRequestLocally(reqId);
        setPendingRequests(prev => prev.filter(r => r.id !== reqId));

        try {
            await socialApi.post(`/social/friend-request/${reqId}/accept`);
            toast.success(`Connected with ${senderName}!`);
            fetchFriends(true);
        } catch (err) {
            console.error('Failed to accept request:', err);
            toast.error('Failed to accept request');
            setActionStates(prev => {
                const updated = { ...prev };
                delete updated[reqId];
                return updated;
            });
            loadInboxData();
        }
    };

    // Decline friend / follow request directly from inbox
    const handleDeclineRequest = async (reqItem) => {
        const reqId = reqItem.id;
        const senderId = reqItem.senderId;

        setActionStates(prev => ({ ...prev, [reqId]: 'declined' }));
        declineFriendRequestLocally(senderId);
        setPendingRequests(prev => prev.filter(r => r.id !== reqId));

        try {
            await socialApi.post('/social/remove-friendship', { targetUserId: senderId });
            toast.success('Request declined');
        } catch (err) {
            console.error('Failed to decline request:', err);
            toast.error('Failed to decline request');
            setActionStates(prev => {
                const updated = { ...prev };
                delete updated[reqId];
                return updated;
            });
            loadInboxData();
        }
    };

    // Open chat conversation directly from inbox
    const handleOpenChat = (friend) => {
        localStorage.setItem('social_selected_chat_contact', JSON.stringify({
            id: friend.id,
            type: 'direct',
            name: friend.name,
            profilePicture: friend.profilePicture,
        }));
        navigate('/dashboard/social/chats');
    };

    // View user profile
    const handleViewProfile = (userId) => {
        if (!userId) return;
        navigate(`/dashboard/social?tab=profile&profileId=${userId}`);
    };

    // Mark system message as read
    const handleMarkRead = async (id) => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/mark-read/`, {
                idToken: token,
                messageId: id
            });
            setSystemMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const handleOpenSystemMessage = (msg) => {
        setSelectedMessage(msg);
        if (!msg.isRead) {
            handleMarkRead(msg.id);
        }
    };

    const handleMarkAllSystemRead = async () => {
        const unread = systemMessages.filter(m => !m.isRead);
        if (unread.length === 0) return;
        setSystemMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        try {
            await Promise.all(unread.map(m => 
                axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/mark-read/`, {
                    idToken: token,
                    messageId: m.id
                })
            ));
            toast.success('All announcements marked as read');
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    // Calculate unread tallies
    const unreadSystemCount = systemMessages.filter(m => !m.isRead).length;
    const totalUnreadBadge = pendingRequests.length + totalUnreadCount + unreadSystemCount;

    // Filter items based on active tab
    const showRequests = activeFilter === 'all' || activeFilter === 'requests';
    const showMessages = activeFilter === 'all' || activeFilter === 'messages';
    const showRooms = activeFilter === 'all' || activeFilter === 'rooms';
    const showSystem = activeFilter === 'all' || activeFilter === 'system';

    // ── STRICT TIME SORTING ──────────────────────────────────────────
    // 1. Sort chats: Unread chats always first, then strictly newest lastMessage time descending
    const sortedChats = [...recentChats].sort((a, b) => {
        const aUnread = a.unreadCount || unreadByContact[a.id?.toString()] || 0;
        const bUnread = b.unreadCount || unreadByContact[b.id?.toString()] || 0;
        if (aUnread > 0 && bUnread === 0) return -1;
        if (bUnread > 0 && aUnread === 0) return 1;

        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
    });

    // 2. Sort requests by newest createdAt descending
    const sortedRequests = [...pendingRequests].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    // 3. Sort system messages by newest created_at descending
    const sortedSystemMessages = [...systemMessages].sort((a, b) => {
        if (!a.isRead && b.isRead) return -1;
        if (!b.isRead && a.isRead) return 1;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
    });

    const hasAnyContent = (
        sortedRequests.length > 0 || 
        sortedChats.length > 0 || 
        sortedSystemMessages.length > 0 || 
        liveRooms.length > 0
    );

    if (loading) {
        return (
            <div className="w-full max-w-[1100px] mx-auto px-3 sm:px-6 pt-2 pb-24 space-y-2.5">
                <div className="h-12 bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-100 dark:border-gray-700" />
                <div className="flex gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-white dark:bg-gray-800 rounded-lg animate-pulse border border-gray-100 dark:border-gray-700" />
                    ))}
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-100 dark:border-gray-700" />
                ))}
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1100px] mx-auto px-3 sm:px-6 pt-2 pb-28">
            {/* ── Compact & User-Friendly Header ──────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/80 px-3 py-2 sm:px-4 sm:py-2.5 mb-2.5 shadow-2xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-lg bg-orange-500/10 text-[#FF5100] flex items-center justify-center shrink-0">
                        <Bell size={16} className="stroke-[2.5]" />
                        {liveRooms.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-1.5 ring-white dark:ring-gray-800"></span>
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
                                Inbox & Notifications
                            </h1>
                            {totalUnreadBadge > 0 && (
                                <span className="bg-[#FF5100] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs shrink-0">
                                    {totalUnreadBadge} new
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                            Follow requests, chat messages, and updates
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => loadInboxData(true)}
                        disabled={refreshing}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5100] hover:bg-orange-50 dark:hover:bg-gray-700 transition cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw size={13} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                    {unreadSystemCount > 0 && (
                        <button
                            onClick={handleMarkAllSystemRead}
                            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:text-[#FF5100] hover:bg-orange-50 dark:hover:bg-gray-700 transition cursor-pointer"
                        >
                            <CheckCircle2 size={12} />
                            <span>Mark read</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Compact Filter Tabs ─────────────────────────────────── */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none select-none">
                <button
                    onClick={() => setActiveFilter('all')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeFilter === 'all'
                            ? 'bg-[#FF5100] text-white shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/80'
                    }`}
                >
                    <span>All</span>
                    {totalUnreadBadge > 0 && (
                        <span className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                            activeFilter === 'all' ? 'bg-white/25 text-white' : 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                        }`}>
                            {totalUnreadBadge}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveFilter('requests')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeFilter === 'requests'
                            ? 'bg-[#FF5100] text-white shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/80'
                    }`}
                >
                    <UserPlus size={13} />
                    <span>Requests</span>
                    {sortedRequests.length > 0 && (
                        <span className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                            activeFilter === 'requests' ? 'bg-white/25 text-white' : 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                        }`}>
                            {sortedRequests.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveFilter('messages')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeFilter === 'messages'
                            ? 'bg-[#FF5100] text-white shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/80'
                    }`}
                >
                    <MessageSquare size={13} />
                    <span>Messages</span>
                    {totalUnreadCount > 0 && (
                        <span className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                            activeFilter === 'messages' ? 'bg-white/25 text-white' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        }`}>
                            {totalUnreadCount}
                        </span>
                    )}
                </button>

                {liveRooms.length > 0 && (
                    <button
                        onClick={() => setActiveFilter('rooms')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            activeFilter === 'rooms'
                                ? 'bg-[#FF5100] text-white shadow-xs'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/80'
                        }`}
                    >
                        <Radio size={13} />
                        <span>Live Rooms</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                            activeFilter === 'rooms' ? 'bg-white/25 text-white' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                        }`}>
                            {liveRooms.length}
                        </span>
                    </button>
                )}

                <button
                    onClick={() => setActiveFilter('system')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeFilter === 'system'
                            ? 'bg-[#FF5100] text-white shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/80'
                    }`}
                >
                    <Mail size={13} />
                    <span>System</span>
                    {unreadSystemCount > 0 && (
                        <span className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                            activeFilter === 'system' ? 'bg-white/25 text-white' : 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                        }`}>
                            {unreadSystemCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Main Stream Content ──────────────────────────────────── */}
            <div className="space-y-2.5">
                {/* 1. Live Language Practice Rooms (Only shown when there is a current active room) */}
                {showRooms && liveRooms.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80 dark:border-orange-500/20 rounded-2xl p-3 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Radio size={12} className="text-[#FF5100]" />
                                    Friends in Live Rooms
                                </h3>
                                <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.2 rounded-full">
                                    {liveRooms.length} Live
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard/live-rooms')}
                                className="text-[10px] font-bold text-[#FF5100] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Explore all <ArrowRight size={11} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {liveRooms.slice(0, 4).map(room => {
                                const friendObj = (friends || []).find(f => Number(f.id) === Number(room.creatorId || room.creator?.id));
                                const friendName = room.creator?.name || friendObj?.name || 'Friend';
                                const friendPhoto = room.creator?.profilePicture || friendObj?.profilePicture || '/default-avatar.png';

                                return (
                                    <div 
                                        key={room.id || room.roomName || room.name}
                                        onClick={() => navigate(`/dashboard/live-rooms/${room.roomName || room.name}`)}
                                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 hover:border-orange-300 rounded-xl p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition shadow-2xs hover:shadow-xs active:scale-98"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {/* Friend Avatar with pulsing live dot */}
                                            <div className="relative shrink-0">
                                                <img 
                                                    src={friendPhoto} 
                                                    alt={friendName}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-500/30 bg-orange-50 dark:bg-gray-700"
                                                />
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                    <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                                                </span>
                                            </div>

                                            {/* Details: Friend Name + Host Badge + Topic + Language/Online */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                                                        {friendName}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded-full shrink-0">
                                                        Host
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                    {room.topic || room.roomName || 'Live Room'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                                                    {room.language || 'English'} • {room.participantCount || 1} online
                                                </p>
                                            </div>
                                        </div>

                                        <span className="bg-[#FF5100] hover:bg-[#E04800] text-white text-[11px] font-black px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1 shadow-xs">
                                            Join
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. Connection / Follow Requests (Sorted by time descending) */}
                {showRequests && sortedRequests.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <UserPlus size={13} className="text-[#FF5100]" />
                                Connection Requests ({sortedRequests.length})
                            </h2>
                        </div>
                        {sortedRequests.map((req) => {
                            const sender = req.sender || {};
                            const reqStatus = actionStates[req.id];
                            const isOnline = onlineUserIds.some(id => id.toString() === sender.id?.toString());

                            return (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-200/80 dark:border-orange-500/30 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5100]" />

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pl-1">
                                        {/* User Info */}
                                        <div 
                                            onClick={() => handleViewProfile(sender.id)}
                                            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                                        >
                                            <div className="relative shrink-0">
                                                <UserAvatar 
                                                    src={sender.profilePicture} 
                                                    name={sender.name || 'User'} 
                                                    className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-700" 
                                                />
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-[#FF5100] transition-colors truncate">
                                                        {sender.name || 'User'}
                                                    </h3>
                                                    <span className="text-[9px] bg-orange-100 dark:bg-orange-950/40 text-[#FF5100] px-1.5 py-0.2 rounded-md font-bold uppercase shrink-0">
                                                        Request
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {sender.collegeName || sender.department || 'Student on LearnProof'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                                                    <Clock size={10} />
                                                    <span>{formatTimeAgo(req.createdAt)}</span>
                                                    <span>•</span>
                                                    <span className="text-orange-600 dark:text-orange-400 font-semibold group-hover:underline">
                                                        Profile
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inline Action Buttons */}
                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700/60">
                                            {reqStatus === 'accepted' ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl w-full sm:w-auto justify-center">
                                                    <CheckCircle2 size={14} />
                                                    <span>Connected</span>
                                                </div>
                                            ) : reqStatus === 'declined' ? (
                                                <div className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-xl w-full sm:w-auto text-center">
                                                    <span>Declined</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleAcceptRequest(req)}
                                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#FF5100] hover:bg-[#E04800] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        <Check size={13} className="stroke-[2.5]" />
                                                        <span>Accept</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineRequest(req)}
                                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        <X size={13} className="stroke-[2.5]" />
                                                        <span>Decline</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* 3. Direct Messages (Sorted by time descending: newest & unread at top) */}
                {showMessages && sortedChats.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquare size={13} className="text-blue-500" />
                                Direct Messages ({sortedChats.length})
                            </h2>
                        </div>
                        {sortedChats.map((chat) => {
                            const isOnline = onlineUserIds.some(id => id.toString() === chat.id?.toString());
                            const unread = chat.unreadCount || unreadByContact[chat.id?.toString()] || 0;
                            let lastMsgText = 'No messages yet';
                            let lastMsgTime = chat.createdAt;

                            if (chat.lastMessage) {
                                try {
                                    const parsed = typeof chat.lastMessage.content === 'string' && chat.lastMessage.content.startsWith('{')
                                        ? JSON.parse(chat.lastMessage.content)
                                        : { text: chat.lastMessage.content };
                                    lastMsgText = parsed.text || chat.lastMessage.content || 'Message';
                                } catch {
                                    lastMsgText = chat.lastMessage.content || 'Message';
                                }
                                lastMsgTime = chat.lastMessage.createdAt;
                            }

                            return (
                                <motion.div
                                    key={`chat-${chat.id}`}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleOpenChat(chat)}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex items-center justify-between gap-3 ${
                                        unread > 0 
                                            ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10' 
                                            : 'border-gray-100 dark:border-gray-700/80 hover:border-gray-200 dark:hover:border-gray-600'
                                    }`}
                                >
                                    {unread > 0 && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                    )}

                                    <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                                        <div className="relative shrink-0">
                                            <UserAvatar 
                                                src={chat.profilePicture} 
                                                name={chat.name || 'User'} 
                                                className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-700" 
                                            />
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`font-bold text-xs sm:text-sm truncate ${unread > 0 ? 'text-gray-900 dark:text-white font-black' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {chat.name || 'Friend'}
                                                </h3>
                                                <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                                    {formatTimeAgo(lastMsgTime)}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {lastMsgText}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {unread > 0 && (
                                            <span className="bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                                                {unread}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenChat(chat);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-orange-50/90 hover:bg-orange-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-[#FF5100] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                                        >
                                            <MessageSquare size={12} />
                                            <span>Chat</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* 4. Platform & System Announcements (Sorted by time descending) */}
                {showSystem && sortedSystemMessages.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Mail size={13} className="text-orange-500" />
                                Platform Updates ({sortedSystemMessages.length})
                            </h2>
                        </div>
                        {sortedSystemMessages.map((msg) => (
                            <motion.div
                                key={`sys-${msg.id}`}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleOpenSystemMessage(msg)}
                                className={`bg-white dark:bg-gray-800 rounded-2xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex items-center justify-between gap-3 ${
                                    !msg.isRead 
                                        ? 'border-orange-200 dark:border-orange-500/30 bg-orange-50/15 dark:bg-orange-950/10' 
                                        : 'border-gray-100 dark:border-gray-700/80 hover:border-gray-300'
                                }`}
                            >
                                {!msg.isRead && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5100]" />
                                )}

                                <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className={`font-bold text-xs sm:text-sm truncate ${!msg.isRead ? 'text-gray-900 dark:text-white font-black' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {msg.subject}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 shrink-0">
                                                {formatTimeAgo(msg.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>

                                <ChevronRight size={15} className="text-gray-400 shrink-0" />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* 5. Clean Empty State */}
                {!hasAnyContent && (
                    <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-6 shadow-xs">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-orange-500">
                            <InboxIcon size={24} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white">
                            Your inbox is clear!
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mx-auto mt-1 mb-4 max-w-sm">
                            No new requests, messages, or updates right now. Connect with peers or jump into a live room!
                        </p>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button 
                                onClick={() => navigate('/dashboard/social/discover')}
                                className="px-3.5 py-1.5 bg-[#FF5100] text-white rounded-xl font-bold text-xs hover:bg-[#E04800] transition shadow-xs active:scale-95 cursor-pointer"
                            >
                                Find Friends
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard/live-rooms')}
                                className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs hover:bg-gray-200 transition active:scale-95 cursor-pointer"
                            >
                                Live Rooms
                            </button>
                        </div>
                    </div>
                )}

                {/* If selected filter is empty but other content exists */}
                {hasAnyContent && (
                    (activeFilter === 'requests' && sortedRequests.length === 0) ? (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5">
                            <UserCheck size={24} className="mx-auto mb-2 text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">No Pending Requests</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">You have reviewed all incoming connection requests.</p>
                            <button 
                                onClick={() => navigate('/dashboard/social/discover')}
                                className="px-3 py-1.5 bg-[#FF5100] text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                            >
                                Discover Peers
                            </button>
                        </div>
                    ) : (activeFilter === 'messages' && sortedChats.length === 0) ? (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5">
                            <MessageSquare size={24} className="mx-auto mb-2 text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">No New Messages</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">You're all caught up with your direct chats.</p>
                            <button 
                                onClick={() => navigate('/dashboard/social/chats')}
                                className="px-3 py-1.5 bg-[#FF5100] text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                            >
                                Open Chats
                            </button>
                        </div>
                    ) : (activeFilter === 'rooms' && liveRooms.length === 0) ? (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5">
                            <Radio size={24} className="mx-auto mb-2 text-[#FF5100]" />
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">No Friends Live</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">None of your friends are currently hosting a room.</p>
                            <button 
                                onClick={() => navigate('/dashboard/live-rooms')}
                                className="px-3 py-1.5 bg-[#FF5100] text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                            >
                                Explore Live Rooms
                            </button>
                        </div>
                    ) : (activeFilter === 'system' && sortedSystemMessages.length === 0) ? (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5">
                            <Mail size={24} className="mx-auto mb-2 text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">No System Announcements</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">There are no administrative messages at this time.</p>
                        </div>
                    ) : null
                )}
            </div>

            {/* ── System Message Modal View ─────────────────────────────── */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                                        <ShieldCheck size={15} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                            LearnProof Announcement
                                        </h3>
                                        <p className="text-[9px] text-gray-400">Official Communication</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMessage(null)}
                                    className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
                                <div>
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white leading-snug">
                                        {selectedMessage.subject}
                                    </h2>
                                    <span className="text-[10px] text-gray-400 block mt-0.5">
                                        {new Date(selectedMessage.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                    {selectedMessage.message}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
                                <button 
                                    onClick={() => setSelectedMessage(null)}
                                    className="px-3.5 py-1.5 bg-[#FF5100] hover:bg-[#E04800] text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inbox;