import React, { useState, useEffect } from 'react';
import { HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';

const formatDurationDetailed = (secs) => {
  if (!secs || secs < 0) return '0 min 0 sec';
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

export default function ParticipantMeetingEndedModal({ data, onDismiss }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss('rooms');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Friendly Warm Icon */}
        <div className="relative mb-2.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <HeartHandshake size={28} className="text-orange-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] shadow">
            👋
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-1 leading-tight">
          Host Ended the Meeting
        </h3>

        <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 mb-3.5 leading-relaxed max-w-xs">
          {data?.message || "The host has ended this live room session. Thank you for participating and practicing together!"}
        </p>

        {/* Practice Time summary */}
        <div className="w-full mb-3 py-2 px-3 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-gray-600 dark:text-gray-400">Practice Time:</span>
          <span className="font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {formatDurationDetailed(data?.duration || 0)}
          </span>
        </div>

        {/* Countdown Badge */}
        <div className="w-full mb-4 py-1.5 px-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
          <span>Auto-returning in</span>
          <span className="inline-flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] font-black shadow-sm">
            {countdown}
          </span>
          <span>seconds</span>
        </div>

        {/* Action Buttons - Always Side by Side & Compact on Mobile */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onDismiss('rooms')}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Live Rooms</span>
            <Sparkles size={13} />
          </button>
          <button
            onClick={() => onDismiss('dashboard')}
            className="w-full py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-extrabold text-xs rounded-xl border border-gray-200/60 dark:border-gray-700/60 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
