import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { Outlet, useLocation } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import { useAuth } from "../../context/AuthContext.jsx";
import socialApi from "../../api/socialApi.js";
import { useSocialStatusStore } from "../../store/socialStatusStore.js";
import { useSocialMessageStore } from "../../store/socialMessageStore.js";
import { getSocialSocket } from "../../utils/socialSocket.js";

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
                            ? 'w-64 lg:w-64 bg-white dark:bg-gray-800 border-r border-orange-200 dark:border-gray-700' 
                            : 'w-64 lg:w-[90px] bg-transparent border-none'
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
                {!isAskMyNotes && !isSocialHub && !isLiveRoom && <TopBar onMenuClick={toggleSidebar} />}

                {/* Dashboard Content */}
                <div className={`flex-1 ${
                    isSocialHub 
                        ? 'p-0 overflow-hidden' 
                        : isAskMyNotes || isLiveRoom 
                            ? 'p-0 overflow-y-auto' 
                            : 'p-4 sm:p-6 pb-24 lg:pb-6 overflow-y-auto'
                }`}>
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>

            {/* Bottom Navigation for Mobile */}
            {!isSocialHub && !isLiveRoom && <BottomNav onMenuClick={toggleSidebar} />}

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};

export default DashboardLayout;
