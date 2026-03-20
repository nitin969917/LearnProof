import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, ShieldAlert } from "lucide-react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Admin Dashboard caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 m-8 bg-red-50 border border-red-200 rounded-2xl text-red-900 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldAlert className="text-red-500" />
                        Admin Dashboard Error
                    </h2>
                    <p className="mb-4 text-red-700">A rendering error occurred in this view. The rest of the dashboard is still operational.</p>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs bg-white/50 p-4 rounded-xl font-mono">{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    // Mapping path to title
    const getPageTitle = () => {
        if (location.pathname.includes('/users')) return 'Manage Users';
        if (location.pathname.includes('/content')) return 'Content Audit';
        return 'Overview';
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
                {/* Admin Topbar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                {getPageTitle()}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-200 font-medium text-sm">
                                <ShieldAlert size={16} />
                                <span>Admin Access</span>
                            </div>
                            {user && (
                                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                    <span className="hidden sm:block text-sm font-medium text-slate-700">{user.name}</span>
                                    {user.profile_pic ? (
                                        <img src={user.profile_pic} alt="Profile" className="w-8 h-8 rounded-full border-2 border-slate-200" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                            {user.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
                        <ErrorBoundary>
                            <Outlet />
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
