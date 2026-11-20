import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Target, Flame, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { playCelebrationSound } from '../../utils/duoAudio';

// Lightweight animated confetti particles
const ConfettiParticle = ({ delay, x, color }) => (
  <motion.div
    initial={{ y: -20, x, opacity: 1, rotate: 0 }}
    animate={{ 
      y: 450, 
      opacity: [1, 1, 0],
      rotate: [0, 360, 720],
      x: x + (Math.random() * 80 - 40)
    }}
    transition={{ duration: 2.5 + Math.random(), delay, ease: "easeOut" }}
    className={`absolute top-0 w-2.5 h-2.5 rounded-sm pointer-events-none z-50 ${color}`}
  />
);

export default function DuolingoCelebrationModal({
  isOpen,
  videoTitle,
  xpEarned = 45,
  accuracy = 100,
  streak = 1,
  onNextLesson,
  onReviewNotes,
  hasNextVideo = true
}) {
  useEffect(() => {
    if (isOpen) {
      playCelebrationSound();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confettiColors = [
    'bg-amber-400', 'bg-orange-500', 'bg-emerald-400', 'bg-cyan-400', 
    'bg-rose-500', 'bg-purple-500', 'bg-yellow-300'
  ];

  return (
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-300 select-none">
      {/* Confetti Explosion */}
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 0.05}
          x={(i * 24) % 360 - 180}
          color={confettiColors[i % confettiColors.length]}
        />
      ))}

      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.8, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-orange-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl text-center space-y-4 sm:space-y-5 relative z-10 max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto custom-scrollbar my-auto"
      >
        {/* Trophy / Victory Badge */}
        <div className="relative inline-block">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.15 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/30"
          >
            <Trophy size={42} className="fill-white" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md"
          >
            <CheckCircle2 size={16} />
          </motion.div>
        </div>

        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-500">
            Lesson Completed!
          </span>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white line-clamp-1 mt-0.5">
            {videoTitle || "Active Lesson"}
          </h2>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 py-1">
          {/* XP */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col items-center">
            <Zap size={18} className="text-amber-500 fill-amber-500 mb-1" />
            <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 font-mono">
              +{xpEarned}
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              XP Earned
            </span>
          </div>

          {/* Accuracy */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center">
            <Target size={18} className="text-emerald-500 mb-1" />
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {accuracy}%
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Accuracy
            </span>
          </div>

          {/* Streak */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 flex flex-col items-center">
            <Flame size={18} className="text-orange-500 fill-orange-500 mb-1" />
            <span className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-400 font-mono">
              {streak} Days
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Streak
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {hasNextVideo && onNextLesson && (
            <button
              type="button"
              onClick={onNextLesson}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to Next Lesson</span>
              <ArrowRight size={15} />
            </button>
          )}

          {onReviewNotes && (
            <button
              type="button"
              onClick={onReviewNotes}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText size={14} />
              <span>Review Handwritten Exam Notes</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
