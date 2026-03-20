import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Outlet, useLocation } from "react-router-dom";
import ProfileModal from "./ProfileModal";

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
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const isAskMyNotes = location.pathname === '/dashboard/ask-my-notes';
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            {!isAskMyNotes && (
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-orange-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        }`}
                >
                    <Sidebar
                        onProfileClick={() => setIsProfileModalOpen(true)}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </aside>
            )}

            {/* Main content area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                {!isAskMyNotes && <TopBar onMenuClick={toggleSidebar} />}

                {/* Dashboard Content */}
                <div className={`flex-1 overflow-y-auto ${isAskMyNotes ? 'p-0' : 'p-4 sm:p-6'}`}>
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};

export default DashboardLayout;
