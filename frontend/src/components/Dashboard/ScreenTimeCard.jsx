import { useState, useEffect } from 'react';
import { Clock, BarChart2, Edit2, Check, X } from 'lucide-react';

export default function ScreenTimeCard() {
    const [todayTime, setTodayTime] = useState(0);
    const [targetHours, setTargetHours] = useState(() => {
        try {
            const saved = localStorage.getItem('learnproof_screentime_target');
            return saved ? parseFloat(saved) : 2;
        } catch (e) {
            return 2;
        }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(targetHours.toString());

    const getTodayKey = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        // Initial fetch
        const fetchTime = () => {
            try {
                const dataStr = localStorage.getItem('learnproof_screentime') || '{}';
                const data = JSON.parse(dataStr);
                setTodayTime(data[getTodayKey()] || 0);
            } catch (e) {
                console.error(e);
            }
        };

        fetchTime();

        // Listen/poll for updates every second to match global tracker updates
        const interval = setInterval(fetchTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveTarget = (e) => {
        e.preventDefault();
        const num = parseFloat(editValue);
        if (!isNaN(num) && num > 0) {
            setTargetHours(num);
            localStorage.setItem('learnproof_screentime_target', num.toString());
            setIsEditing(false);
        }
    };

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hrs > 0) {
            return (
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-800 dark:text-white">{hrs}</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-1.5">hr{hrs > 1 ? 's' : ''}</span>
                    <span className="text-2xl font-black text-gray-800 dark:text-white">{mins}</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-1.5">min{mins > 1 ? 's' : ''}</span>
                    <span className="text-lg font-bold text-orange-500/80">{secs}</span>
                    <span className="text-[10px] font-bold text-orange-500/60">s</span>
                </div>
            );
        }

        if (mins > 0) {
            return (
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-800 dark:text-white">{mins}</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-1.5">min{mins > 1 ? 's' : ''}</span>
                    <span className="text-lg font-bold text-orange-500">{secs}</span>
                    <span className="text-[10px] font-bold text-orange-450">s</span>
                </div>
            );
        }

        return (
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-800 dark:text-white">{secs}</span>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">sec{secs !== 1 ? 's' : ''}</span>
            </div>
        );
    };

    // Calculate progress towards custom hours daily learning/screen time target
    const dailyTargetSeconds = targetHours * 3600;
    const percentOfTarget = Math.min(100, Math.round((todayTime / dailyTargetSeconds) * 100));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 hover:shadow-md dark:shadow-gray-900/50">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-orange-50 dark:border-gray-700 bg-gradient-to-r from-orange-50/50 dark:from-gray-800 to-white dark:to-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Clock className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 truncate">Screen Time</h2>
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Today's Usage</p>
                        {formatTime(todayTime)}
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-xl shrink-0">
                        <BarChart2 size={18} />
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="min-h-[44px] flex flex-col justify-end">
                    {isEditing ? (
                        <form onSubmit={handleSaveTarget} className="flex items-center justify-between gap-1 w-full bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-orange-100 dark:border-gray-700">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tgt:</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="24"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-10 text-xs font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <span className="text-[10px] font-bold text-gray-400">h</span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button type="submit" className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center justify-center cursor-pointer outline-none focus:outline-none">
                                    <Check size={10} />
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)} className="p-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center cursor-pointer outline-none focus:outline-none">
                                    <X size={10} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1.5 w-full">
                            <div className="flex items-center gap-1">
                                <span>Daily Target ({targetHours}h)</span>
                                <button
                                    onClick={() => {
                                        setEditValue(targetHours.toString());
                                        setIsEditing(true);
                                    }}
                                    className="p-0.5 hover:text-orange-500 transition text-gray-400 dark:text-gray-500"
                                    title="Set Daily Target"
                                >
                                    <Edit2 size={10} />
                                </button>
                            </div>
                            <span>{percentOfTarget}%</span>
                        </div>
                    )}

                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-orange-400 to-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentOfTarget}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
