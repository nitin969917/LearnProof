import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Plus, RefreshCw, X, Users } from "lucide-react";
import ProfileModal from "./ProfileModal";
import { useAuth } from "../../context/AuthContext.jsx";
import socialApi from "../../api/socialApi.js";
import { useSocialStatusStore } from "../../store/socialStatusStore.js";
import { useSocialMessageStore } from "../../store/socialMessageStore.js";
import { getSocialSocket } from "../../utils/socialSocket.js";
import { useSocialFeedStore } from "../../store/socialFeedStore.js";
import { requestNotificationPermissionAndGetToken } from "../../utils/fcm.js";
import UserAvatar from "../Common/UserAvatar.jsx";
import toast from "react-hot-toast";

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
                        <div
                            onClick={() => {
                                toast.dismiss(t.id);
                                navigate(`/dashboard/social/chats/direct/${senderStr}`);
                            }}
                            className={`${
                                t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
                            } transition-all duration-200 max-w-sm w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border border-orange-200/80 dark:border-gray-700/80 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/50 active:scale-98`}
                            style={{ pointerEvents: 'auto' }}
                        >
                            <div className="relative shrink-0">
                                {senderPic ? (
                                    <img src={senderPic} alt={senderName} className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/20" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5100] to-orange-400 text-white font-black flex items-center justify-center text-sm shadow-xs">
                                        {senderName ? senderName[0].toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                                        {senderName}
                                    </p>
                                    <span className="text-[10px] text-[#FF5100] font-black uppercase tracking-wider">
                                        now
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium mt-0.5">
                                    {displayContent}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.dismiss(t.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                                title="Dismiss"
                            >
                                <X size={14} />
                            </button>
                        </div>
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
                        <div
                            onClick={() => {
                                toast.dismiss(t.id);
                                navigate(`/dashboard/social/chats/group/${groupStr}`);
                            }}
                            className={`${
                                t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
                            } transition-all duration-200 max-w-sm w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border border-orange-200/80 dark:border-gray-700/80 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/50 active:scale-98`}
                            style={{ pointerEvents: 'auto' }}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                <Users size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                                        {groupName}
                                    </p>
                                    <span className="text-[10px] text-[#FF5100] font-black uppercase tracking-wider">
                                        now
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium mt-0.5">
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{senderName}: </span>
                                    {displayContent}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.dismiss(t.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                                title="Dismiss"
                            >
                                <X size={14} />
                            </button>
                        </div>
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

    // Listen for incoming friend requests to update Friends tab badge in real-time
    useEffect(() => {
        if (!socialUser || !socialUser.id) return;
        const socket = getSocialSocket(socialUser.id);
        const handleFriendRequest = () => {
            incrementPendingFriendCount();
        };
        socket.on('FRIEND_REQUEST_RECEIVED', handleFriendRequest);
        return () => {
            socket.off('FRIEND_REQUEST_RECEIVED', handleFriendRequest);
        };
    }, [socialUser]);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem('sidebarExpanded');
        return savedState !== null ? savedState === 'true' : false;
    });
    const isMobile = window.innerWidth < 1024;
    const location = useLocation();

    // Listen for live room invitations and live room start notifications to navigate directly to room
    useEffect(() => {
        if (!socialUser || !socialUser.id) return;
        const socket = getSocialSocket(socialUser.id);
        const handleRoomInvitation = (data) => {
            if (!data || !data.roomName) return;
            // If already in this room, don't show alert
            if (location.pathname.includes(data.roomName)) return;

            toast.custom((t) => (
                <div 
                    className={`${
                        t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
                    } transition-all duration-200 max-w-sm w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border border-orange-200/80 dark:border-gray-700/80 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/50 active:scale-98`}
                    style={{ pointerEvents: 'auto' }}
                >
                    <div 
                        onClick={() => {
                            toast.dismiss(t.id);
                            navigate(`/dashboard/live-rooms/${data.roomName}`);
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-black text-sm shrink-0">
                            🔴
                        </div>
                        <div className="flex flex-col text-left truncate">
                            <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                                {data.creatorName ? `${data.creatorName} invited you` : 'Live Room Invitation'}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {data.topic ? `"${data.topic}"` : 'Tap to join room now!'}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                        title="Dismiss"
                    >
                        <X size={15} />
                    </button>
                </div>
            ), { id: `live_room_invite_${data.roomName}`, duration: 5000, position: 'top-center' });
        };

        socket.on('ROOM_INVITATION', handleRoomInvitation);
        return () => {
            socket.off('ROOM_INVITATION', handleRoomInvitation);
        };
    }, [socialUser, navigate, location.pathname]);

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
        </div>
    );

    return layoutContent;
};

export default DashboardLayout;
