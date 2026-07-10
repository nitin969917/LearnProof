import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    const colors = {
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
        warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20",
        info: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
    };

    const iconColors = {
        danger: "text-red-500 bg-red-500/10",
        warning: "text-amber-500 bg-amber-500/10",
        info: "text-orange-500 bg-orange-500/10"
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
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-2xl text-center"
                >
                    {/* Close button at top-right */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                    >
                        <X size={18} />
                    </button>

                    {/* Centered Icon */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${iconColors[type]}`}>
                        <AlertCircle size={26} />
                    </div>

                    {/* Centered Title */}
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                        {title}
                    </h3>

                    {/* Centered Message */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                        {message}
                    </p>

                    {/* Action Buttons in One Row */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all active:scale-95 ${colors[type]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmModal;
