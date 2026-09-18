import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Building2, BookOpen, Calendar, ArrowRight, X } from 'lucide-react';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';

const StudentProfileSetupModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        collegeName: '',
        department: '',
        yearOfStudy: '1st Year'
    });

    useEffect(() => {
        const shouldPrompt = sessionStorage.getItem('prompt_student_profile') === 'true';
        if (shouldPrompt) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        sessionStorage.removeItem('prompt_student_profile');
        setIsOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.collegeName.trim()) {
            toast.error('Please enter your college or university name');
            return;
        }

        setLoading(true);
        try {
            await socialApi.put('/users/profile', {
                collegeName: formData.collegeName.trim(),
                department: formData.department.trim(),
                yearOfStudy: formData.yearOfStudy
            });
            toast.success('College profile saved!');
            handleClose();
        } catch (err) {
            console.error('Failed to update student profile:', err);
            toast.error('Could not save details right now, but you can update it in your profile anytime.');
            handleClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-orange-100 dark:border-gray-800 overflow-hidden"
                >
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 text-white relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                        >
                            <X size={18} />
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Complete Your Student Profile</h3>
                        <p className="text-orange-100 text-xs font-medium mt-1">
                            Connect with classmates and study partners across your campus on LearnProof.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Building2 size={14} className="text-orange-500" />
                                <span>College / University *</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Stanford University, IIT Bombay..."
                                value={formData.collegeName}
                                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <BookOpen size={14} className="text-orange-500" />
                                <span>Major / Department</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Computer Science, Mechanical..."
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Calendar size={14} className="text-orange-500" />
                                <span>Year of Study</span>
                            </label>
                            <select
                                value={formData.yearOfStudy}
                                onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year / Final Year</option>
                                <option value="Masters">Masters / Postgrad</option>
                                <option value="PhD">PhD / Research Scholar</option>
                                <option value="Alumni">Alumni / Graduate</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                            >
                                Skip for now
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <span>Save & Continue</span>
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudentProfileSetupModal;
