import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Plus, RefreshCw } from "lucide-react";
import ProfileModal from "./ProfileModal";
import { useAuth } from "../../context/AuthContext.jsx";
import socialApi from "../../api/socialApi.js";
import { useSocialStatusStore } from "../../store/socialStatusStore.js";
import { useSocialMessageStore } from "../../store/socialMessageStore.js";
import { getSocialSocket } from "../../utils/socialSocket.js";
import { useSocialFeedStore } from "../../store/socialFeedStore.js";
import { requestNotificationPermissionAndGetToken } from "../../utils/fcm.js";
import UserAvatar from "../Common/UserAvatar.jsx";
import LiveRoomPipWindow from "./LanguagePractice/LiveRoomPipWindow";
import { useLiveRoomPipStore } from "../../store/liveRoomPipStore";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

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
    const { activeRoom, clearActiveRoom, showPip } = useLiveRoomPipStore();
    const socialUser = useSocialFeedStore((state) => state.socialUser);
    const fetchSocialUser = useSocialFeedStore((state) => state.fetchSocialUser);
    const fetchPendingFriendCount = useSocialFeedStore((state) => state.fetchPendingFriendCount);
    const incrementPendingFriendCount = useSocialFeedStore((state) => state.incrementPendingFriendCount);
    const [onHeaderAction, setOnHeaderAction] = useState(null);

    const initializeStatus = useSocialStatusStore((state) => state.initializeStatus);
    const fetchUnreadCounts = useSocialMessageStore((state) => state.fetchUnreadCounts);
    const incrementUnread = useSocialMessageStore((state) => state.incrementUnread);
    const activeChatUserId = useSocialMessageStore((state) => state.activeChatUserId);
    const activeChatUserIdRef = useRef(activeChatUserId);

    useEffect(() => {
        activeChatUserIdRef.current = activeChatUserId;
    }, [activeChatUserId]);

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

    useEffect(() => {
        if (socialUser && socialUser.id) {
            initializeStatus(socialUser.id);
            fetchUnreadCounts();
            fetchPendingFriendCount();

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
                // Listen for message events globally to increment notification counters if chat not open
                const socket = getSocialSocket(socialUser.id);
                const handleGlobalMessage = (message) => {
                    if (message && message.senderId) {
                        const senderStr = message.senderId.toString();
                        const activeStr = activeChatUserIdRef.current ? activeChatUserIdRef.current.toString() : null;
                        if (senderStr !== activeStr) {
                            incrementUnread(senderStr);
                        }
                    }
                };

                socket.on('receiveMessage', handleGlobalMessage);
                return () => {
                    socket.off('receiveMessage', handleGlobalMessage);
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const location = useLocation();

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

            {/* Floating Live Room Picture-in-Picture Window */}
            {showPip && <LiveRoomPipWindow />}

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );

    if (activeRoom) {
        return (
            <LiveKitRoom
                serverUrl={activeRoom.serverUrl}
                token={activeRoom.token}
                connect={true}
                video={activeRoom.dbRoom?.mediaType === 'video'}
                audio={true}
                onDisconnected={clearActiveRoom}
            >
                <RoomAudioRenderer />
                {layoutContent}
            </LiveKitRoom>
        );
    }

    return layoutContent;
};

export default DashboardLayout;
