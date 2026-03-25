import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    const colors = {
        danger: "bg-red-500 hover:bg-red-600 text-white",
        warning: "bg-amber-500 hover:bg-amber-600 text-white",
        info: "bg-orange-500 hover:bg-orange-600 text-white"
    };

    const iconColors = {
        danger: "text-red-500 bg-red-50 dark:bg-red-900/20",
        warning: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        info: "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                    <div className="p-5">
                        <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-full shrink-0 ${iconColors[type]}`}>
                                <AlertCircle size={20} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={onCancel}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3 flex flex-col sm:flex-row-reverse gap-2">
                        <button
                            onClick={onConfirm}
                            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${colors[type]}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmModal;
