import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Video, LogOut, Settings, ShieldAlert, LifeBuoy, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

const AdminSidebar = ({ onClose }) => {
    const { logout } = useAuth();
    const { confirm } = useModal();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const confirmed = await confirm({
            title: "Sign Out",
            message: "Are you sure you want to sign out of the Admin Portal?",
            confirmText: "Sign Out",
            type: "danger"
        });

        if (confirmed) {
            logout();
            navigate('/');
        }
    };

    const navItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview' },
        { path: '/admin/users', icon: <Users size={20} />, label: 'Manage Users' },
        { path: '/admin/content', icon: <Video size={20} />, label: 'Content Audit' },
        { path: '/admin/support', icon: <LifeBuoy size={20} />, label: 'Support Tickets' },
        { path: '/admin/inbox', icon: <Mail size={20} />, label: 'Communication Center' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <ShieldAlert size={18} className="text-white" />
                    </div>
                    <span>System Admin</span>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                    &times;
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Management</div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
                >
                    <Settings size={20} />
                    <span>User Portal</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
