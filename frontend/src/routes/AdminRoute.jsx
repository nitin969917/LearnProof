import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminRoute = ({ children }) => {
    const { user, token, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(null);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            if (!user || !token) {
                setIsAdmin(false);
                setVerifying(false);
                return;
            }
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/admin-check`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.isAdmin) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                    toast.error("Access Denied: You do not have administrator privileges.");
                }
            } catch (err) {
                console.error("Admin verification failed:", err);
                setIsAdmin(false);
                toast.error("Access Denied: You do not have administrator privileges.");
            } finally {
                setVerifying(false);
            }
        };

        if (!authLoading) {
            verifyAdmin();
        }
    }, [user, token, authLoading]);

    if (authLoading || verifying) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AdminRoute;
