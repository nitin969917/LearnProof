import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, MessageSquare, FileText, ArrowLeft, Hourglass } from 'lucide-react';

const AskMyNotesComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-lg bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-orange-100/80 dark:border-white/5 p-6 sm:p-10 rounded-[2.5rem] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.4)] text-center relative overflow-hidden"
            >
                {/* Header Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-6 border border-orange-100/50 dark:border-orange-500/10">
                    <Sparkles size={12} className="animate-spin" />
                    Feature Preview
                </div>

                {/* Animated Brain/Hourglass Icon */}
                <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full opacity-10 animate-ping pointer-events-none" />
                    <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-red-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/20 rotate-6 hover:rotate-0 transition-transform duration-500">
                        <BrainCircuit size={40} className="stroke-[1.5]" />
                    </div>
                </div>

                {/* Main Heading */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                    Ask My Notes <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">Is Coming Soon!</span>
                </h1>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto mb-8">
                    We are putting the final polish on this feature to deliver an exceptional study experience. 
                    Soon, you will be able to upload files and chat with LearnProof AI to supercharge your learning!
                </p>

                {/* Coming Features Checklist */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-5 border border-slate-100/80 dark:border-white/5 text-left space-y-4 mb-8">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">What to expect:</h3>
                    
                    <div className="grid grid-cols-1 gap-3.5">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                                <FileText size={14} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Chat with PDFs & Notes</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Upload slides, textbooks, or notes and ask questions directly.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                                <MessageSquare size={14} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Personalization</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Get instant summaries, key formula lists, and visual diagrams.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-[1.25rem] transition-all shadow-lg"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </motion.button>
            </motion.div>
        </div>
    );
};

export default AskMyNotesComingSoon;
