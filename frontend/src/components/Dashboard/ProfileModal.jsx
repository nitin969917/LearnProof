import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Award, Activity, Zap, ExternalLink, Sparkles } from 'lucide-react';
import axios from 'axios';
import socialApi from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import { useSocialFeedStore } from '../../store/socialFeedStore';
import UserAvatar from '../Common/UserAvatar.jsx';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [socialProfile, setSocialProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const socialUser = useSocialFeedStore((state) => state.socialUser);

    useEffect(() => {
        if (!isOpen) return;

        // 1. Fetch latest Social Hub profile directly so profile picture is always up-to-date
        const fetchSocial = async () => {
            try {
                const res = await socialApi.get('/users/me');
                if (res.data) {
                    setSocialProfile(res.data);
                    if (useSocialFeedStore.getState().updateSocialUser) {
                        useSocialFeedStore.getState().updateSocialUser(res.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch latest social user:", err);
            }
        };

        // 2. Fetch academic/gamification stats
        const fetchProfileData = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/profile/`, {
                    idToken: token
                });
                setProfileData(res.data);
            } catch (err) {
                console.error("Failed to load profile details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSocial();
        fetchProfileData();
    }, [isOpen, token]);

    if (!isOpen) return null;

    // Prioritize Social Hub profile picture (custom uploaded photo)
    const avatarSrc = 
        socialProfile?.profilePicture || 
        socialProfile?.avatar || 
        socialUser?.profilePicture || 
        socialUser?.avatar || 
        profileData?.profile_pic || 
        profileData?.avatar || 
        user?.picture || 
        user?.avatar;

    const displayName = socialProfile?.name || socialUser?.name || profileData?.name || user?.name || 'Student';
    const displayEmail = socialProfile?.email || socialUser?.email || profileData?.email || user?.email || 'Student Account';
    const userLevel = profileData?.level ?? socialProfile?.level ?? socialUser?.level ?? 1;
    const userXp = profileData?.xp ?? socialProfile?.xp ?? socialUser?.xp ?? 0;
    const joinDate = profileData?.joined_at || socialProfile?.created_at || socialUser?.created_at || user?.created_at;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 15 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative border border-slate-200/80 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Decorative Banner */}
                    <div className="h-28 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 relative overflow-hidden">
                        {/* Ambient decorative elements */}
                        <div className="absolute -top-8 -left-8 w-28 h-28 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />

                        {/* Top Micro Header Pill */}
                        <div className="absolute top-3 left-3.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold tracking-wider uppercase">
                            <Sparkles size={10} className="text-yellow-300" />
                            <span>Student Profile</span>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute top-3 right-3 bg-black/20 hover:bg-black/40 active:scale-95 text-white/90 hover:text-white rounded-full p-1.5 transition-all cursor-pointer backdrop-blur-md border border-white/10"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Profile Content */}
                    <div className="px-5 pb-4 relative flex flex-col items-center">
                        {/* Avatar */}
                        <div className="relative -mt-12 select-none">
                            <div className="p-1 bg-white dark:bg-slate-900 rounded-full shadow-xl ring-4 ring-white dark:ring-slate-900">
                                <UserAvatar
                                    src={avatarSrc}
                                    name={displayName}
                                    className="w-20 h-20 rounded-full object-cover shadow-inner"
                                    textClassName="text-2xl font-black text-white"
                                />
                            </div>
                            <div className="absolute -bottom-1 right-0 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-[10px] font-black tracking-wider uppercase shadow-md border-2 border-white dark:border-slate-900 flex items-center">
                                <span>Lv.{userLevel}</span>
                            </div>
                        </div>

                        {/* Top Info */}
                        <div className="mt-2 mb-3 text-center w-full">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {displayName}
                            </h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1 truncate px-2">
                                <Mail size={12} className="shrink-0 text-slate-400" />
                                <span className="truncate">{displayEmail}</span>
                            </p>
                        </div>

                        {/* Stats Section */}
                        {loading ? (
                            <div className="flex justify-center items-center py-5 w-full">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="w-full space-y-2">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {/* Level Card */}
                                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 dark:from-amber-950/30 dark:to-orange-950/10 rounded-2xl p-2.5 sm:p-3 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-2.5 shadow-2xs">
                                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
                                            <Award size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Level</p>
                                            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{userLevel}</p>
                                        </div>
                                    </div>

                                    {/* Total XP Card */}
                                    <div className="bg-gradient-to-br from-rose-500/10 to-red-500/5 dark:from-rose-950/30 dark:to-red-950/10 rounded-2xl p-2.5 sm:p-3 border border-rose-200/60 dark:border-rose-800/40 flex items-center gap-2.5 shadow-2xs">
                                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
                                            <Zap size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Total XP</p>
                                            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{userXp}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Join Date */}
                                {joinDate && (
                                    <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                            <Activity size={13} className="text-orange-500 shrink-0" />
                                            <span>Member Since</span>
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
                                            {new Date(joinDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons: Small, compact, sleek & centered */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center gap-2">
                            <button
                                onClick={onClose}
                                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer text-xs active:scale-95"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/dashboard/social?tab=profile');
                                }}
                                className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs rounded-lg shadow-sm shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                                <User size={13} />
                                <span>View Profile</span>
                                <ExternalLink size={11} className="opacity-80" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileModal;
