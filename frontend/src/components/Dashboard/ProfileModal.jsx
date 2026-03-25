import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Award, Activity, Zap } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, token } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!isOpen || !token) return;
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

        fetchProfileData();
    }, [isOpen, token]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative border dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Background */}
                    <div className="h-32 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Profile Content */}
                    <div className="px-6 pb-6 relative flex flex-col items-center">
                        {/* Avatar */}
                        <div className="-mt-14 p-1 bg-white dark:bg-gray-900 rounded-full shadow-lg z-10 w-max">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-100 dark:from-gray-800 to-red-100 dark:to-gray-700 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
                                    <User size={40} />
                                </div>
                            )}
                        </div>

                        {/* Top Info */}
                        <div className="mt-4 mb-6 text-center w-full">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{user?.name || 'Student'}</h2>
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mt-1 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <Mail size={16} />
                                <span className="text-sm">{user?.email || 'No email available'}</span>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            </div>
                        ) : profileData ? (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Level Card */}
                                <div className="bg-orange-50 dark:bg-gray-800 rounded-xl p-4 border border-orange-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                    <div className="bg-orange-100 dark:bg-gray-700 p-2 rounded-full text-orange-600 dark:text-orange-400 mb-2">
                                        <Award size={24} />
                                    </div>
                                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Current Level</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.level}</p>
                                </div>

                                {/* XP Card */}
                                <div className="bg-red-50 dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                                    <div className="bg-red-100 dark:bg-gray-700 p-2 rounded-full text-red-600 dark:text-red-400 mb-2">
                                        <Zap size={24} />
                                    </div>
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Total XP</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.xp}</p>
                                </div>

                                {/* Join Date (Full width) */}
                                <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                                    <div className="bg-white dark:bg-gray-700 p-2 text-gray-500 dark:text-gray-400 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {new Date(profileData.joined_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                Could not load profile statistics.
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 w-full">
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileModal;
