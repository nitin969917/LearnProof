import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    useEffect(() => {
        // Show a message once if they get kicked out
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (!loading && user) {
            if (!adminEmail || user.email.toLowerCase() !== adminEmail.toLowerCase()) {
                toast.error("Access Denied: You do not have administrator privileges.");
            }
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Check admin email configured in env
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

    if (!adminEmail || user.email.toLowerCase() !== adminEmail.toLowerCase()) {
        // Redirect unauthorized users back to their own dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AdminRoute;
