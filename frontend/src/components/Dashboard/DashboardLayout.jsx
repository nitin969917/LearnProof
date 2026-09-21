import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Plus, RefreshCw, X, Users2, UserPlus, UserCheck } from "lucide-react";
import ProfileModal from "./ProfileModal";
import StudentProfileSetupModal from "../Common/StudentProfileSetupModal";
import { useAuth } from "../../context/AuthContext.jsx";
import socialApi from "../../api/socialApi.js";
import { useSocialStatusStore } from "../../store/socialStatusStore.js";
import { useSocialMessageStore } from "../../store/socialMessageStore.js";
import { getSocialSocket } from "../../utils/socialSocket.js";
import { useSocialFeedStore } from "../../store/socialFeedStore.js";
import { requestNotificationPermissionAndGetToken } from "../../utils/fcm.js";
import UserAvatar from "../Common/UserAvatar.jsx";
import toast from "react-hot-toast";
import SwipeableNotificationToast from "../Common/SwipeableNotificationToast.jsx";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Dashboard caught an error:", error, errorInfo);
        const msg = String(error?.message || error || '');
        if (
            msg.includes('Failed to fetch dynamically imported module') ||
            msg.includes('Importing a module script failed') ||
            msg.includes('error loading dynamically imported module') ||
            msg.includes("reading 'default'") ||
            msg.includes("properties of undefined") ||
            msg.includes("Unexpected token '<'")
        ) {
            const lastReload = sessionStorage.getItem('chunk_reload_timestamp');
            const now = Date.now();
            if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
                sessionStorage.setItem('chunk_reload_timestamp', String(now));
                window.location.reload();
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mb-4 shadow-md">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Updating Dashboard...</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-6">
                        A new update was deployed. We're refreshing your session to load the latest features.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isMatrixActive, matrixClient } = useAuth();
    const socialUser = useSocialFeedStore((state) => state.socialUser);
    const fetchSocialUser = useSocialFeedStore((state) => state.fetchSocialUser);
    const fetchPendingFriendCount = useSocialFeedStore((state) => state.fetchPendingFriendCount);
    const incrementPendingFriendCount = useSocialFeedStore((state) => state.incrementPendingFriendCount);
    const fetchActiveRoomsCount = useSocialFeedStore((state) => state.fetchActiveRoomsCount);
    const [onHeaderAction, setOnHeaderAction] = useState(null);

    const initializeStatus = useSocialStatusStore((state) => state.initializeStatus);
    const fetchUnreadCounts = useSocialMessageStore((state) => state.fetchUnreadCounts);
    const incrementUnread = useSocialMessageStore((state) => state.incrementUnread);
    const activeChatUserId = useSocialMessageStore((state) => state.activeChatUserId);
    const activeChatGroupId = useSocialMessageStore((state) => state.activeChatGroupId);
    const activeChatUserIdRef = useRef(activeChatUserId);
    const activeChatGroupIdRef = useRef(activeChatGroupId);

    useEffect(() => {
        activeChatUserIdRef.current = activeChatUserId;
    }, [activeChatUserId]);

    useEffect(() => {
        activeChatGroupIdRef.current = activeChatGroupId;
    }, [activeChatGroupId]);

    useEffect(() => {
        if (user) {
            fetchSocialUser();
        }
    }, [user, fetchSocialUser]);

    // Request notification permission and save token on dashboard mount
    useEffect(() => {
        if (user) {
            requestNotificationPermissionAndGetToken().catch(err => {
                console.error("Failed to setup notifications in dashboard:", err);
            });
        }
    }, [user]);

    // Keep active rooms count synced in real-time for notification indicators
    useEffect(() => {
        fetchActiveRoomsCount();

        let socket = null;
        const handleRoomsUpdate = () => {
            fetchActiveRoomsCount();
        };

        if (socialUser && socialUser.id) {
            socket = getSocialSocket(socialUser.id);
            if (socket) {
                socket.on('ROOMS_UPDATED', handleRoomsUpdate);
            }
        }

        const roomInterval = setInterval(() => {
            fetchActiveRoomsCount();
        }, 10000);

        return () => {
            if (socket) {
                socket.off('ROOMS_UPDATED', handleRoomsUpdate);
            }
            clearInterval(roomInterval);
        };
    }, [socialUser?.id, fetchActiveRoomsCount]);

    useEffect(() => {
        if (socialUser && socialUser.id) {
            initializeStatus(socialUser.id);
            fetchUnreadCounts();
            fetchPendingFriendCount();
            fetchActiveRoomsCount();

            if (isMatrixActive && matrixClient) {
                const getLocalIdFromMatrixUserId = (matrixUserId) => {
                    if (!matrixUserId) return null;
                    const match = matrixUserId.match(/@user_(\d+):/);
                    return match ? parseInt(match[1]) : matrixUserId;
                };

                const handleMatrixGlobalMessage = (event, room, toStartOfTimeline) => {
                    if (toStartOfTimeline) return;
                    if (event.getType() !== "m.room.message") return;

                    const senderId = getLocalIdFromMatrixUserId(event.getSender());
                    if (senderId === socialUser.id) return; // Ignore messages from self

                    if (senderId && senderId.toString() !== activeChatUserIdRef.current?.toString()) {
                        incrementUnread(senderId);
                    }
                };

                matrixClient.on("Room.timeline", handleMatrixGlobalMessage);
                return () => {
                    matrixClient.removeListener("Room.timeline", handleMatrixGlobalMessage);
                };
            } else {
                // Listen for message events globally to show in-app banner or increment counters
                const socket = getSocialSocket(socialUser.id);
                
                // Direct message handler
                const handleGlobalMessage = (message) => {
                    if (!message || !message.senderId) return;
                    const senderStr = message.senderId.toString();
                    const activeStr = activeChatUserIdRef.current ? activeChatUserIdRef.current.toString() : null;

                    // 1. If currently inside this user's chat, SILENTLY return (real-time chat bubble updates with no banner)
                    if (senderStr === activeStr) {
                        return;
                    }

                    // 2. Different user or on another screen: increment unread count
                    incrementUnread(senderStr);

                    // 3. Display sleek floating in-app banner
                    const senderName = message.sender?.name || 'A friend';
                    const senderPic = message.sender?.profilePicture || null;
                    let displayContent = message.content || 'Sent you a message';
                    try {
                        if (typeof message.content === 'string' && message.content.startsWith('{')) {
                            const parsed = JSON.parse(message.content);
                            displayContent = parsed.text || (parsed.fileUrl ? 'Sent an attachment' : message.content);
                        }
                    } catch (_) {}

                    toast.custom((t) => (
                        <SwipeableNotificationToast
                            t={t}
                            avatar={senderPic}
                            fallbackInitial={senderName ? senderName[0].toUpperCase() : 'U'}
                            avatarBadge={<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" />}
                            title={senderName}
                            body={displayContent}
                            tag="now"
                            onClick={() => navigate(`/dashboard/social/chats/direct/${senderStr}`)}
                        />
                    ), {
                        duration: 4000,
                        position: 'top-center'
                    });
                };

                // Group message handler
                const handleGlobalGroupMessage = (message) => {
                    if (!message || !message.groupId) return;
                    const groupStr = message.groupId.toString();
                    const activeGroupStr = activeChatGroupIdRef.current ? activeChatGroupIdRef.current.toString() : null;

                    // 1. If currently inside this group, SILENTLY return
                    if (groupStr === activeGroupStr) {
                        return;
                    }

                    // 2. Ignore messages sent by self
                    if (message.senderId && socialUser && message.senderId.toString() === socialUser.id?.toString()) {
                        return;
                    }

                    // 3. Display in-app banner for group message
                    const groupName = message.groupName || message.group?.name || 'Group';
                    const senderName = message.senderName || message.sender?.name || 'Someone';
                    let displayContent = message.content || 'Sent a message';
                    try {
                        if (typeof message.content === 'string' && message.content.startsWith('{')) {
                            const parsed = JSON.parse(message.content);
                            displayContent = parsed.text || (parsed.fileUrl ? 'Sent an attachment' : message.content);
                        }
                    } catch (_) {}

                    toast.custom((t) => (
                        <SwipeableNotificationToast
                            t={t}
                            avatar={
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                    <Users2 size={18} />
                                </div>
                            }
                            title={groupName}
                            body={<><span className="font-bold text-gray-800 dark:text-gray-200">{senderName}: </span>{displayContent}</>}
                            tag="now"
                            borderColor="border-purple-200/80 dark:border-purple-900/60"
                            tagColor="text-purple-600 dark:text-purple-400"
                            onClick={() => navigate(`/dashboard/social/chats/group/${groupStr}`)}
                        />
                    ), {
                        duration: 4000,
                        position: 'top-center'
                    });
                };

                socket.on('receiveMessage', handleGlobalMessage);
                socket.on('receiveGroupMessage', handleGlobalGroupMessage);
                return () => {
                    socket.off('receiveMessage', handleGlobalMessage);
                    socket.off('receiveGroupMessage', handleGlobalGroupMessage);
                };
            }
        }
    }, [socialUser, isMatrixActive, matrixClient]);

    // Listen for incoming friend requests and acceptances to update state and notify with dedicated notification cards
    useEffect(() => {
        if (!socialUser || !socialUser.id) return;
        const socket = getSocialSocket(socialUser.id);

        const handleFriendRequest = (data) => {
            useSocialFeedStore.getState().handleFriendRequestReceived(data);
            if (!data?.sender) return;
            const senderName = data.sender.name || 'Someone';
            const senderAvatar = data.sender.profilePicture || null;
            const senderCollege = data.sender.collegeName || data.sender.department || '';

            toast.custom((t) => (
                <SwipeableNotificationToast
                    t={t}
                    avatar={senderAvatar}
                    fallbackInitial={senderName ? senderName[0].toUpperCase() : 'U'}
                    fallbackGradient="from-blue-600 to-indigo-600"
                    avatarBadge={
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-white shadow-xs">
                            <UserPlus size={9} strokeWidth={2.5} />
                        </span>
                    }
                    title={senderName}
                    body={senderCollege ? `Wants to connect • ${senderCollege}` : 'Sent you a connection request!'}
                    tag="request"
                    tagColor="text-blue-600 dark:text-blue-400"
                    borderColor="border-blue-200/80 dark:border-blue-900/60"
                    onClick={() => navigate('/dashboard/social?tab=friends&sub=pending')}
                />
            ), {
                id: `friend_req_${data.requestId || data.sender.id || Date.now()}`,
                duration: 6000,
                position: 'top-center'
            });
        };

        const handleFriendAccepted = (data) => {
            useSocialFeedStore.getState().handleFriendRequestAccepted(data);
            if (!data?.friend?.name) return;
            const friendName = data.friend.name;
            const friendAvatar = data.friend.profilePicture || null;
            const friendCollege = data.friend.collegeName || data.friend.department || '';

            toast.custom((t) => (
                <SwipeableNotificationToast
                    t={t}
                    avatar={friendAvatar}
                    fallbackInitial={friendName ? friendName[0].toUpperCase() : 'U'}
                    fallbackGradient="from-emerald-600 to-teal-600"
                    avatarBadge={
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-white shadow-xs">
                            <UserCheck size={9} strokeWidth={2.5} />
                        </span>
                    }
                    title={friendName}
                    body={friendCollege ? `Connected • ${friendCollege}` : 'Accepted your connection request!'}
                    tag="connected"
                    tagColor="text-emerald-600 dark:text-emerald-400"
                    borderColor="border-emerald-200/80 dark:border-emerald-900/60"
                    onClick={() => navigate('/dashboard/social?tab=friends')}
                />
            ), {
                id: `friend_acc_${data.requestId || data.userId || Date.now()}`,
                duration: 5000,
                position: 'top-center'
            });
        };

        socket.on('FRIEND_REQUEST_RECEIVED', handleFriendRequest);
        socket.on('FRIEND_REQUEST_ACCEPTED', handleFriendAccepted);
        return () => {
            socket.off('FRIEND_REQUEST_RECEIVED', handleFriendRequest);
            socket.off('FRIEND_REQUEST_ACCEPTED', handleFriendAccepted);
        };
    }, [socialUser, navigate]);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem('sidebarExpanded');
        return savedState !== null ? savedState === 'true' : false;
    });
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

    const locationPathRef = useRef(location.pathname);
    useEffect(() => {
        locationPathRef.current = location.pathname;
    }, [location.pathname]);

    // Listen for live room invitations, room creations, and live room start notifications to navigate directly to room
    useEffect(() => {
        const currentUserId = socialUser?.id || user?.id || user?.uid;
        if (!currentUserId) return;
        const socket = getSocialSocket(currentUserId);
        if (!socket) return;

        const handleLiveRoomEvent = (data, eventType) => {
            if (!data || !data.roomName) return;
            // If already in this room, don't show alert
            if (locationPathRef.current && locationPathRef.current.includes(data.roomName)) return;

            // Ignore rooms created/started by self
            if (data.creatorId && String(data.creatorId) === String(currentUserId)) return;

            const creatorName = data.creatorName || data.creator?.name || 'A friend';
            const creatorAvatar = data.creatorAvatar || data.creator?.profilePicture || null;
            const topic = data.topic || 'General Discussion';
            const language = data.language || 'Live Session';

            let title = `${creatorName} invited you`;
            let displayContent = `Join "${topic}" (${language})`;

            if (eventType === 'ROOM_STARTED') {
                title = `🔴 ${creatorName}'s room is LIVE`;
                displayContent = `"${topic}" started now • Tap to join!`;
            } else if (eventType === 'ROOM_CREATED') {
                title = `${creatorName} started a live room`;
                displayContent = `"${topic}" (${language}) • Tap to join!`;
            } else if (eventType === 'ROOM_SCHEDULED') {
                title = `📅 ${creatorName} scheduled a room`;
                displayContent = `"${topic}" scheduled • Tap to view details`;
            }

            toast.custom((t) => (
                <SwipeableNotificationToast
                    t={t}
                    avatar={creatorAvatar}
                    fallbackInitial={creatorName ? creatorName[0].toUpperCase() : 'L'}
                    avatarBadge={<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800 animate-pulse" />}
                    title={title}
                    body={displayContent}
                    tag="live"
                    tagColor="text-red-500"
                    borderColor="border-orange-200/80 dark:border-gray-700/80"
                    onClick={() => navigate(`/dashboard/live-rooms/${data.roomName}`)}
                />
            ), {
                id: `live_room_event_${data.roomName}_${eventType}`,
                duration: 5000,
                position: 'top-center'
            });
        };

        const onRoomInvitation = (data) => handleLiveRoomEvent(data, 'ROOM_INVITATION');
        const onRoomCreated = (data) => handleLiveRoomEvent(data, 'ROOM_CREATED');
        const onRoomStarted = (data) => handleLiveRoomEvent(data, 'ROOM_STARTED');
        const onRoomScheduled = (data) => handleLiveRoomEvent(data, 'ROOM_SCHEDULED');

        socket.on('ROOM_INVITATION', onRoomInvitation);
        socket.on('ROOM_CREATED', onRoomCreated);
        socket.on('ROOM_STARTED', onRoomStarted);
        socket.on('ROOM_SCHEDULED', onRoomScheduled);

        return () => {
            socket.off('ROOM_INVITATION', onRoomInvitation);
            socket.off('ROOM_CREATED', onRoomCreated);
            socket.off('ROOM_STARTED', onRoomStarted);
            socket.off('ROOM_SCHEDULED', onRoomScheduled);
        };
    }, [socialUser?.id, user?.id, user?.uid, navigate]);

    const isAskMyNotes = location.pathname.startsWith('/dashboard/ask-my-notes');
    const isInsideWorkspace = location.pathname.match(/\/dashboard\/ask-my-notes(?:-dev)?\/[^/]+/);
    const isSocialHub = location.pathname.startsWith('/dashboard/social');
    const isInsideSocialChat = location.pathname.match(/\/dashboard\/social\/chats\/(?:direct|group)\/[^/]+/) || (location.pathname.startsWith('/dashboard/social') && location.search.includes('chatId='));
    const isLiveRoom = location.pathname.includes('/dashboard/live-rooms/') && location.pathname !== '/dashboard/live-rooms';
    const isLiveRoomList = location.pathname === '/dashboard/live-rooms';

    // --- Reactive social nav source tracking ---
    // Use useState (not bare sessionStorage) so React re-renders when the source changes.
    const [cameFromSocial, setCameFromSocial] = useState(
        () => sessionStorage.getItem('nav_source') === 'social'
    );

    useEffect(() => {
        if (location.state?.from === 'social') {
            sessionStorage.setItem('nav_source', 'social');
            setCameFromSocial(true);
        } else if (isSocialHub) {
            sessionStorage.setItem('nav_source', 'social');
            setCameFromSocial(true);
        } else if (!isLiveRoom && !isLiveRoomList) {
            // Navigated outside live-rooms context — clear social source
            sessionStorage.removeItem('nav_source');
            setCameFromSocial(false);
        }
    }, [location.pathname, location.state, isSocialHub, isLiveRoom, isLiveRoomList]);

    const showSocialBottomNav = isLiveRoom || isLiveRoomList;
    const contentRef = useRef(null);

    const toggleSidebar = () => {
        if (isMobile) {
            // On mobile: toggle the slide-in drawer
            setIsMobileSidebarOpen(prev => !prev);
        } else {
            // On desktop: collapse/expand the sidebar
            setIsSidebarExpanded(prev => {
                const next = !prev;
                localStorage.setItem('sidebarExpanded', next.toString());
                return next;
            });
        }
    };

    const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark';
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Scroll to top of the dashboard content container on route changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    // Touch gesture swipe handling for mobile subsection switching
    const touchStartRef = useRef({ x: 0, y: 0, time: 0, target: null });

    const handleTouchStart = (e) => {
        if (!isMobile || isLiveRoom || isInsideWorkspace) return;
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
            target: e.target
        };
    };

    const handleTouchEnd = (e) => {
        if (!isMobile || isLiveRoom || isInsideWorkspace) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;

        // Ignore slow gestures (> 650ms) or taps
        if (deltaTime > 650) return;

        // Minimum horizontal swipe distance and maximum vertical deviation
        const minSwipeDistance = 50;
        const maxVerticalDisplacement = 70;

        if (
            Math.abs(deltaX) < minSwipeDistance || 
            Math.abs(deltaY) > maxVerticalDisplacement || 
            Math.abs(deltaX) < Math.abs(deltaY) * 1.3
        ) {
            return;
        }

        // Ignore if touch began on interactive elements (inputs, buttons, scrollable carousels)
        const startTarget = touchStartRef.current.target;
        if (startTarget) {
            const tagName = startTarget.tagName?.toLowerCase();
            if (['input', 'textarea', 'select', 'button', 'a'].includes(tagName)) return;
            if (startTarget.closest('input, textarea, select, button, a, [contenteditable="true"], .no-swipe, [data-no-swipe]')) return;
            const scrollableParent = startTarget.closest('.overflow-x-auto, .overflow-x-scroll');
            if (scrollableParent && scrollableParent.scrollWidth > scrollableParent.clientWidth + 15) {
                return;
            }
        }

        const isSwipeLeft = deltaX < 0;  // Swiped left -> navigate to next tab on the right
        const isSwipeRight = deltaX > 0; // Swiped right -> navigate to previous tab on the left

        // 1. Learn Hub Tabs Swiping
        const isLearnPage = (
            location.pathname.startsWith('/dashboard/library') ||
            location.pathname.startsWith('/dashboard/explore') ||
            location.pathname.startsWith('/dashboard/quiz') ||
            location.pathname.startsWith('/dashboard/ask-my-notes') ||
            location.pathname.startsWith('/dashboard/playlist') ||
            location.pathname.startsWith('/dashboard/roadmap') ||
            location.pathname.startsWith('/dashboard/certificates')
        );

        if (isLearnPage) {
            const learnTabs = [
                '/dashboard/library',
                '/dashboard/explore',
                '/dashboard/quiz',
                '/dashboard/ask-my-notes'
            ];

            let currentIndex = 0;
            if (location.pathname.startsWith('/dashboard/explore')) currentIndex = 1;
            else if (location.pathname.startsWith('/dashboard/quiz')) currentIndex = 2;
            else if (location.pathname.startsWith('/dashboard/ask-my-notes')) currentIndex = 3;
            else currentIndex = 0; // library, playlist, roadmap, certificates

            if (isSwipeLeft && currentIndex < learnTabs.length - 1) {
                navigate(learnTabs[currentIndex + 1]);
            } else if (isSwipeRight && currentIndex > 0) {
                navigate(learnTabs[currentIndex - 1]);
            }
            return;
        }

        // 2. Social Hub Tabs Swiping
        if (isSocialHub) {
            // Ignore if deep inside a full chat conversation screen
            if (location.pathname.includes('/social/chats/') && location.pathname.split('/').length > 4) {
                return;
            }

            const socialTabs = [
                '/dashboard/social/feed',
                '/dashboard/social/discover',
                '/dashboard/social/friends',
                '/dashboard/social/chats'
            ];

            let currentIndex = 0;
            if (location.pathname.includes('/social/discover')) currentIndex = 1;
            else if (location.pathname.includes('/social/friends')) currentIndex = 2;
            else if (location.pathname.includes('/social/chats')) currentIndex = 3;
            else currentIndex = 0; // feed

            if (isSwipeLeft && currentIndex < socialTabs.length - 1) {
                navigate(socialTabs[currentIndex + 1]);
            } else if (isSwipeRight && currentIndex > 0) {
                navigate(socialTabs[currentIndex - 1]);
            }
            return;
        }
    };

    const layoutContent = (
        <div className="flex h-[100dvh] bg-orange-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 relative transition-colors duration-200 overflow-hidden font-sans">
            {/* Sidebar Overlay for Mobile (triggered from Bottom Nav) */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden transition-all duration-300"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Desktop expands/collapses, Mobile via drawer) */}
            {(!isLiveRoom || !isMobile) && (!isInsideWorkspace || !isMobile) && (
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-[60] ${
                        isSidebarExpanded 
                            ? 'w-56 lg:w-56 bg-white dark:bg-gray-800 border-r border-orange-200 dark:border-gray-700' 
                            : 'w-56 lg:w-[90px] bg-transparent border-none'
                    } ${
                        isMobileSidebarOpen 
                            ? 'translate-x-0 bg-white dark:bg-gray-800 border-r border-orange-200 dark:border-gray-700' 
                            : '-translate-x-full lg:translate-x-0'
                    } transition-all duration-300 ease-in-out transform`}
                >
                    <Sidebar
                        isExpanded={isMobile || isSidebarExpanded}
                        onProfileClick={() => setIsProfileModalOpen(true)}
                        onClose={() => setIsMobileSidebarOpen(false)}
                        onMenuClick={toggleSidebar}
                    />
                </aside>
            )}

            {/* Main content area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Bar - rendered uniformly on all pages except full-screen live room sessions & mobile chat */}
                {!isLiveRoom && (!isInsideWorkspace || !isMobile) && (!isInsideSocialChat || !isMobile) && (
                    <TopBar 
                        onMenuClick={toggleSidebar} 
                        onHeaderAction={onHeaderAction}
                        isLiveRoomList={isLiveRoomList}
                    />
                )}

                {/* Dashboard Content */}
                <div 
                    ref={contentRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className={`flex-1 ${
                        isInsideWorkspace || (isInsideSocialChat && isMobile)
                            ? 'p-0 overflow-hidden' 
                            : isSocialHub
                                ? 'p-0 overflow-hidden hide-scrollbar'
                                : isLiveRoom 
                                    ? 'p-0 overflow-y-auto' 
                                    : 'p-4 sm:p-4 pb-24 lg:pb-6 overflow-y-auto hide-scrollbar'
                    }`}
                >
                    <ErrorBoundary>
                        <Outlet context={{ toggleSidebar, setHeaderAction: setOnHeaderAction }} />
                    </ErrorBoundary>
                </div>
            </main>

            {/* Constant Bottom Navigation Bar (Home, Learn, Social, Rooms, Profile) */}
            {!isLiveRoom && !isInsideWorkspace && !isInsideSocialChat && (
                <BottomNav onMenuClick={toggleSidebar} />
            )}

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            <StudentProfileSetupModal />
        </div>
    );

    return layoutContent;
};

export default DashboardLayout;
