import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import SocialBottomNavBar from "./Social/SocialBottomNavBar";
import { Outlet, useLocation } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import { useAuth } from "../../context/AuthContext.jsx";
import socialApi from "../../api/socialApi.js";
import { useSocialStatusStore } from "../../store/socialStatusStore.js";
import { useSocialMessageStore } from "../../store/socialMessageStore.js";
import { getSocialSocket } from "../../utils/socialSocket.js";
import { requestNotificationPermissionAndGetToken } from "../../utils/fcm.js";

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
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 m-8 bg-red-50 border border-red-200 rounded-lg text-red-900">
                    <h2 className="text-xl font-bold mb-4">Dashboard Crashed</h2>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-sm">{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const DashboardLayout = () => {
    const { user } = useAuth();
    const [socialUser, setSocialUser] = useState(null);

    const initializeStatus = useSocialStatusStore((state) => state.initializeStatus);
    const fetchUnreadCounts = useSocialMessageStore((state) => state.fetchUnreadCounts);
    const incrementUnread = useSocialMessageStore((state) => state.incrementUnread);
    const activeChatUserId = useSocialMessageStore((state) => state.activeChatUserId);
    const activeChatUserIdRef = useRef(activeChatUserId);

    useEffect(() => {
        activeChatUserIdRef.current = activeChatUserId;
    }, [activeChatUserId]);

    useEffect(() => {
        const fetchSocialUser = async () => {
            try {
                const response = await socialApi.get('/users/me');
                setSocialUser(response.data);
            } catch (err) {
                console.error('Failed to sync social user', err);
            }
        };
        if (user) {
            fetchSocialUser();
        }
    }, [user]);

    // Request notification permission and save token on dashboard mount
    useEffect(() => {
        if (user) {
            requestNotificationPermissionAndGetToken().catch(err => {
                console.error("Failed to setup notifications in dashboard:", err);
            });
        }
    }, [user]);

    useEffect(() => {
        if (socialUser) {
            initializeStatus(socialUser.id);
            fetchUnreadCounts();

            // Listen for message events globally to increment notification counters if chat not open
            const socket = getSocialSocket(socialUser.id);
            const handleGlobalMessage = (message) => {
                if (message.senderId.toString() !== activeChatUserIdRef.current?.toString()) {
                    incrementUnread(message.senderId);
                }
            };

            socket.on('receiveMessage', handleGlobalMessage);
            return () => {
                socket.off('receiveMessage', handleGlobalMessage);
            };
        }
    }, [socialUser]);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem('sidebarExpanded');
        return savedState !== null ? savedState === 'true' : false;
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const location = useLocation();

    const isAskMyNotes = location.pathname === '/dashboard/ask-my-notes';
    const isSocialHub = location.pathname.startsWith('/dashboard/social');
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

    // Show social-context nav if on any live-rooms page and user came from Social Hub
    const showSocialBottomNav = (isLiveRoom || isLiveRoomList) && cameFromSocial;
    const toggleSidebar = () => {
        if (!isMobile) {
            setIsSidebarExpanded(prev => {
                const nextState = !prev;
                localStorage.setItem('sidebarExpanded', String(nextState));
                return nextState;
            });
        } else {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        }
    };

    const contentRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
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

    return (
        <div className="flex h-screen bg-orange-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 relative transition-colors duration-200 overflow-hidden">
            {/* Sidebar Overlay for Mobile (triggered from Bottom Nav) */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden transition-all duration-300"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Desktop expands/collapses, Mobile via drawer) */}
            {!isAskMyNotes && !isLiveRoom && (
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
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                {/* Hidden when: ask-my-notes, social hub, inside a live room, or on live-rooms list coming from social */}
                {!isAskMyNotes && !isSocialHub && !isLiveRoom && !showSocialBottomNav && <TopBar onMenuClick={toggleSidebar} />}

                {/* Social Hub-context header shown on /dashboard/live-rooms list when user came from Social Hub.
                    Logo is in the same left position as the main TopBar so the UI feels consistent. */}
                {showSocialBottomNav && isLiveRoomList && (
                    <div className="flex items-center justify-between px-4 h-16 sm:h-20 bg-white dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700 shadow-sm shrink-0 w-full transition-colors duration-200">
                        {/* Left — logo + Social Hub label (same position as main TopBar logo) */}
                        <div className="flex items-center gap-3 h-full min-w-0">
                            <div className="h-full cursor-default flex items-stretch shrink-0">
                                {/* Mobile logo */}
                                <img src="/LP_M_logo.png" alt="LearnProof" className="h-full w-auto object-cover object-left block sm:hidden" />
                                {/* Desktop logo */}
                                <img src="/LP_logo.png" alt="LearnProof" className="h-full w-auto object-cover object-left hidden sm:block" />
                            </div>
                            <div className="border-l border-gray-200 dark:border-gray-700 h-8 mx-1" />
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Social Hub</h1>
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">Live Rooms</p>
                            </div>
                        </div>
                        {/* Right — menu toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-700 transition cursor-pointer"
                            title="Menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                    </div>
                )}

                {/* Dashboard Content */}
                <div 
                    ref={contentRef}
                    className={`flex-1 ${
                        isSocialHub 
                            ? 'p-0 overflow-hidden' 
                            : isAskMyNotes || isLiveRoom 
                                ? 'p-0 overflow-y-auto' 
                                : 'p-4 sm:p-6 pb-24 lg:pb-6 overflow-y-auto'
                    }`}
                >
                    <ErrorBoundary>
                        <Outlet context={{ toggleSidebar }} />
                    </ErrorBoundary>
                </div>
            </main>

            {/* Bottom Navigation for Mobile */}
            {/* Show main BottomNav only when: not in social hub, not in a live room, and not when came from social */}
            {!isSocialHub && !isLiveRoom && !showSocialBottomNav && <BottomNav onMenuClick={toggleSidebar} />
            }

            {/* Social Hub's bottom nav — shown on live-rooms pages when the user navigated from Social Hub */}
            {showSocialBottomNav && (
                <SocialBottomNavBar onMenuClick={toggleSidebar} />
            )}

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};

export default DashboardLayout;
