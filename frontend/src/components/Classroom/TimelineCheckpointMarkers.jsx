import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

export default function TimelineCheckpointMarkers({
  checkpoints = [],
  currentTime = 0,
  duration = 0,
  completedCheckpoints = [],
  onSeek
}) {
  const [hoveredCp, setHoveredCp] = useState(null);

  if (!checkpoints || checkpoints.length === 0 || duration <= 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center z-20">
      {checkpoints.map((cp, idx) => {
        const pct = Math.min(100, Math.max(0, (cp.timestamp / duration) * 100));
        const isPassed = completedCheckpoints.includes(cp.id || idx);
        const isUpcoming = !isPassed && currentTime < cp.timestamp && (cp.timestamp - currentTime <= 30);
        const isHovered = hoveredCp === (cp.id || idx);

        const formatTime = (sec) => {
          const m = Math.floor(sec / 60);
          const s = Math.round(sec % 60);
          return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        return (
          <div
            key={cp.id || idx}
            style={{ left: `${pct}%` }}
            className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              if (onSeek) onSeek(cp.timestamp);
            }}
            onMouseEnter={() => setHoveredCp(cp.id || idx)}
            onMouseLeave={() => setHoveredCp(null)}
          >
            {/* Tooltip Preview on Hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 2, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-6 z-30 pointer-events-none flex flex-col items-center whitespace-nowrap"
                >
                  <div className="bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-md max-w-xs text-center">
                    <span className="text-amber-400 font-bold mr-1">Q{idx + 1} ({formatTime(cp.timestamp)}):</span>
                    <span className="text-slate-200 truncate">{cp.question ? (cp.question.length > 45 ? cp.question.slice(0, 45) + '...' : cp.question) : 'Quick Check'}</span>
                  </div>
                  <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700/80 rotate-45 -mt-1" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              animate={isUpcoming ? { scale: [1, 1.35, 1] } : isHovered ? { scale: 1.25 } : {}}
              transition={{ repeat: isUpcoming ? Infinity : 0, duration: 1 }}
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all ${
                isPassed
                  ? 'bg-emerald-500 border-white text-white shadow-xs'
                  : isUpcoming
                  ? 'bg-amber-400 border-white text-slate-900 shadow-md shadow-amber-400/50'
                  : 'bg-slate-700/80 border-slate-400/60 text-white/50 hover:border-white hover:bg-slate-600'
              }`}
            >
              {isPassed ? (
                <Check size={9} strokeWidth={3} />
              ) : (
                <Sparkles size={8} />
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
