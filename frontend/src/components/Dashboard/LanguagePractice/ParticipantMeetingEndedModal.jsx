import React, { useState, useEffect } from 'react';
import { HeartHandshake, Sparkles } from 'lucide-react';

const formatDurationDetailed = (secs) => {
  if (!secs || secs < 0) return '0 min 0 sec';
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) {
    return `${hours} hr ${minutes} min ${seconds} sec`;
  }
  return `${minutes} min ${seconds} sec`;
};

export default function ParticipantMeetingEndedModal({ data, onDismiss }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        {/* Friendly Warm Icon */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <HeartHandshake size={32} className="text-orange-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[12px] shadow">
            👋
          </div>
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight">
          Host Ended the Meeting
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed px-1">
          {data?.message || "The host has ended this live room session. Thank you for participating and practicing together!"}
        </p>

        {/* Practice Time summary */}
        <div className="w-full mb-4 py-2.5 px-3.5 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-gray-600 dark:text-gray-400">Practice Time:</span>
          <span className="font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {formatDurationDetailed(data?.duration || 0)}
          </span>
        </div>

        {/* Countdown Badge */}
        <div className="w-full mb-5 py-2 px-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <span>Returning to rooms in</span>
          <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-500 text-white rounded-full text-[11px] font-black shadow-sm">
            {countdown}
          </span>
          <span>seconds</span>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Return to Live Rooms</span>
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
}
