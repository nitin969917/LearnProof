import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Heart, Info, RefreshCw } from 'lucide-react';

export default function DuolingoHud({
  streak = 1,
  xp = 0,
  hearts = 5,
  maxHearts = 5,
  recentXpGain = null,
  recentHeartLost = false,
  comboCount = 0,
  onRefillHearts = null
}) {
  const [showHeartsModal, setShowHeartsModal] = useState(false);

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 select-none">
      {/* 1. Daily Streak Pill */}
      <div 
        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-orange-500/30 rounded-xl"
        title={`${streak} Day Streak! Study daily to keep the flame alive.`}
      >
        <motion.div
          animate={{ scale: [1, 1.25, 1], rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <Flame size={15} className="text-orange-500 fill-orange-500" />
        </motion.div>
        <span className="text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400 font-mono">
          {streak}
        </span>
        <span className="hidden md:inline text-[10px] font-bold text-orange-500/80 uppercase tracking-wider">
          Days
        </span>
      </div>

      {/* 2. XP Counter with Floating Popups */}
      <div className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 dark:from-yellow-500/20 dark:to-amber-500/20 border border-amber-400/30 rounded-xl">
        <Zap size={14} className="text-amber-500 fill-amber-500" />
        <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
          {xp}
        </span>
        <span className="hidden md:inline text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">
          XP
        </span>

        {/* Floating XP Gain Badge (+15 XP) */}
        <AnimatePresence>
          {recentXpGain && (
            <motion.div
              key={recentXpGain.id || Date.now()}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -22, scale: 1.15 }}
              exit={{ opacity: 0, y: -36, scale: 0.8 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-lg shadow-emerald-500/30 font-mono flex items-center gap-0.5 whitespace-nowrap"
            >
              +{recentXpGain.amount} XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Hearts (Lives) */}
      <div 
        onClick={() => setShowHeartsModal(true)}
        className="relative flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 rounded-xl cursor-pointer hover:bg-rose-500/15 transition-all"
        title="Hearts (Lives). Click to inspect."
      >
        <motion.div
          animate={recentHeartLost ? { scale: [1, 1.4, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Heart size={14} className={`text-rose-500 ${hearts > 0 ? 'fill-rose-500' : 'fill-none'}`} />
        </motion.div>
        
        {/* Mobile / Compact display: "4" or Desktop hearts: [❤️ ❤️ ❤️ ❤️ 🤍] */}
        <div className="flex items-center gap-0.5">
          <span className="sm:hidden text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
            {hearts}
          </span>
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: maxHearts }).map((_, i) => (
              <Heart
                key={i}
                size={11}
                className={i < hearts ? "text-rose-500 fill-rose-500" : "text-gray-300 dark:text-gray-600 fill-transparent"}
              />
            ))}
          </div>
        </div>

        {/* Floating Heart Lost Bubble (-1 ❤️) */}
        <AnimatePresence>
          {recentHeartLost && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -22, scale: 1.15 }}
              exit={{ opacity: 0, y: -36, scale: 0.8 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black shadow-lg shadow-rose-500/30 font-mono flex items-center gap-0.5 whitespace-nowrap"
            >
              -1 ❤️
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Fire Combo Streak Badge (if 3+ correct in a row) */}
      <AnimatePresence>
        {comboCount >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-md text-[10px] font-black uppercase tracking-wider animate-pulse"
          >
            <Flame size={12} className="fill-white" />
            <span>{comboCount} In A Row!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hearts Info / Refill Modal */}
      {showHeartsModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowHeartsModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center">
              <Heart size={36} className="fill-rose-500" />
            </div>

            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {hearts} of {maxHearts} Hearts Left
            </h3>

            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Hearts protect your learning flow. Each incorrect checkpoint answer consumes 1 heart. Hearts automatically refill daily, or you can practice revision to restore them!
            </p>

            <div className="pt-2 flex flex-col gap-2">
              {hearts < maxHearts && onRefillHearts && (
                <button
                  type="button"
                  onClick={() => {
                    onRefillHearts();
                    setShowHeartsModal(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} /> Refill Full Hearts (Practice Bonus)
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowHeartsModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
