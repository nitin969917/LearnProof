// Dashboard/ProfileCard.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProfileCard = () => {
    const { token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const pl = toast.loading("Loading your learning card...");
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/profile/`, {
                    idToken: token,
                });
                setProfile(res.data);
                toast.success("Profile Loaded", { id: pl });
            } catch (err) {
                toast.error("Failed to load profile", { id: pl });
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProfile();
    }, [token]);

    if (loading) {
        return (
            <div className="bg-white/70 backdrop-blur-lg border border-orange-200 rounded-xl p-6 shadow-lg animate-pulse space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/70 backdrop-blur-lg border border-orange-200 rounded-xl p-6 shadow-lg space-y-4"
        >
            {/* Avatar */}
            <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                {profile?.name ? profile.name[0].toUpperCase() : 'U'}
            </div>

            {/* Info */}
            <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800">{profile?.name || 'User'}</h2>
                <p className="text-sm text-gray-600">{profile?.email || ''}</p>
            </div>

            {/* XP / Stats */}
            <div className="flex items-center justify-center gap-2 text-orange-600 mt-2 text-sm">
                <Zap size={16} />
                <span>{profile?.xp || 0} XP</span>
                <span className='font-bold'>- Level {profile?.level || 1}</span>
            </div>
        </motion.div>
    );
};

export default ProfileCard;
