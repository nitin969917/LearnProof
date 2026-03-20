import React from 'react';
import { motion } from 'framer-motion';
import { Inbox as InboxIcon, ArrowRight, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Inbox = () => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 min-h-[80vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-md w-full text-center space-y-8"
            >
                {/* Visual Illustration */}
                <div className="relative">
                    {/* Background Glow */}
                    <div className="absolute inset-x-0 -top-20 bottom-0 bg-orange-500/10 dark:bg-orange-500/5 blur-[100px] rounded-full" />
                    
                    <motion.div 
                        animate={{ 
                            y: [0, -15, 0],
                            rotate: [0, 2, -2, 0]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="relative z-10 flex justify-center"
                    >
                        <div className="p-8 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl relative">
                            <div className="absolute -top-4 -right-4 p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/40 transform rotate-12">
                                <BellOff className="text-white w-6 h-6" />
                            </div>
                            <InboxIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" strokeWidth={1} />
                        </div>
                    </motion.div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Your inbox is empty
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                        It seems like you're all caught up. New updates, certificate notifications, and expert insights will appear here once they're ready.
                    </p>
                </div>

                {/* Action Button */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group relative inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.5)]"
                    >
                        Start Learning
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Secondary Info */}
                <div className="pt-8 flex items-center justify-center gap-6 text-sm font-medium text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Always Up-to-date
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
                    <div>LearnProof AI</div>
                </div>
            </motion.div>
        </div>
    );
};

export default Inbox;