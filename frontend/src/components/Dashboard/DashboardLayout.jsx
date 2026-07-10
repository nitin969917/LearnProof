import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import SocialBottomNavBar from "./Social/SocialBottomNavBar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Plus } from "lucide-react";
import ProfileModal from "./ProfileModal";
import { useAuth } from "../../context/AuthContext.jsx";
import socialApi from "../../api/socialApi.js";
import { useSocialStatusStore } from "../../store/socialStatusStore.js";
import { useSocialMessageStore } from "../../store/socialMessageStore.js";
import { getSocialSocket } from "../../utils/socialSocket.js";
import { requestNotificationPermissionAndGetToken } from "../../utils/fcm.js";
import LiveRoomPipWindow from "./LanguagePractice/LiveRoomPipWindow";

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
    const { user, isMatrixActive, matrixClient } = useAuth();
    const [socialUser, setSocialUser] = useState(null);
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
                    if (message.senderId.toString() !== activeChatUserIdRef.current?.toString()) {
                        incrementUnread(message.senderId);
                    }
                };

                socket.on('receiveMessage', handleGlobalMessage);
                return () => {
                    socket.off('receiveMessage', handleGlobalMessage);
                };
            }
        }
    }, [socialUser, isMatrixActive, matrixClient]);

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
    const isInsideWorkspace = location.pathname.startsWith('/dashboard/ask-my-notes/') && location.pathname !== '/dashboard/ask-my-notes';
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

    return (
        <div className="flex h-screen bg-orange-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 relative transition-colors duration-200 overflow-hidden font-sans">
            {/* Sidebar Overlay for Mobile (triggered from Bottom Nav) */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden transition-all duration-300"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Desktop expands/collapses, Mobile via drawer) */}

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
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                {/* Hidden when: social hub, inside a live room, or on live-rooms list coming from social */}
                {!isSocialHub && !isLiveRoom && !showSocialBottomNav && (!isInsideWorkspace || !isMobile) && <TopBar onMenuClick={toggleSidebar} />}                {/* Social Hub-context header — mirrors SocialDashboard header and main TopBar logo position exactly. */}
                {showSocialBottomNav && (!isLiveRoom || !isMobile) && (
                    <div className="bg-white dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700 shadow-sm flex items-stretch justify-between h-16 sm:h-20 shrink-0 w-full transition-colors duration-200 overflow-hidden">
                        {/* Left — flush-left logo identical to TopBar.jsx + SocialDashboard */}
                        <div className="flex items-stretch min-w-0">
                            {/* Logo wrapper: ml-2 sm:ml-0, no left padding on container */}
                            <div className="h-full cursor-default hover:opacity-90 transition-opacity shrink-0 flex items-stretch ml-2 sm:ml-0">
                                {/* Mobile logo */}
                                <img src="/LP_M_logo.png" alt="LearnProof" className="h-full w-auto object-cover object-left block sm:hidden" />
                                {/* Desktop logo */}
                                <img src="/LP_logo.png" alt="LearnProof" className="h-full w-auto object-cover object-left hidden sm:block" />
                            </div>

                            {/* Divider + Title */}
                            <div className="flex items-center gap-3 px-3 md:px-4 min-w-0">
                                <div className="border-l border-gray-200 dark:border-gray-700 h-8"></div>
                                <div className="min-w-0">
                                    <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Social Hub</h1>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-550 uppercase tracking-widest font-black">Live Rooms</p>
                                </div>
                            </div>
                        </div>

                        {/* Right — Create Room action button (if on rooms list) & Profile button */}
                        <div className="flex items-center gap-2.5 shrink-0 px-4 md:px-6">
                            {onHeaderAction && isLiveRoomList && (
                                <button
                                    onClick={onHeaderAction}
                                    className="p-2 sm:p-2.5 text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer flex items-center justify-center border border-orange-600/10 shrink-0 animate-in fade-in zoom-in-95 duration-250"
                                    title="Create Room"
                                >
                                    <Plus size={20} className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
                                </button>
                            )}

                            {/* Profile Action Button */}
                            <button
                                onClick={() => {
                                    localStorage.setItem('social_active_tab', 'profile');
                                    navigate('/dashboard/social?tab=profile');
                                }}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-orange-100 dark:border-gray-750 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                title="My Profile"
                            >
                                {socialUser?.avatar ? (
                                    <img src={socialUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-orange-100 dark:bg-orange-950/40 text-orange-655 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                        {socialUser?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                )}



                {/* Dashboard Content */}
                <div 
                    ref={contentRef}
                    className={`flex-1 ${
                        isSocialHub || isAskMyNotes
                            ? 'p-0 overflow-hidden' 
                            : isLiveRoom 
                                ? 'p-0 overflow-y-auto' 
                                : 'p-4 sm:p-6 pb-24 lg:pb-6 overflow-y-auto'
                    }`}
                >
                    <ErrorBoundary>
                        <Outlet context={{ toggleSidebar, setHeaderAction: setOnHeaderAction }} />
                    </ErrorBoundary>
                </div>
            </main>

            {!isSocialHub && !isLiveRoom && !showSocialBottomNav && !isInsideWorkspace && (
                <BottomNav onMenuClick={toggleSidebar} />
            )}

            {/* Social Hub's bottom nav — shown on live-rooms pages when the user navigated from Social Hub */}
            {showSocialBottomNav && (!isLiveRoom || !isMobile) && (
                <SocialBottomNavBar onMenuClick={toggleSidebar} />
            )}

            {/* Floating Live Room Picture-in-Picture Window */}
            {!isLiveRoom && <LiveRoomPipWindow />}

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};

export default DashboardLayout;
