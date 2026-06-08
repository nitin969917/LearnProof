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
                    <div className="flex items-center gap-2">
                        <Clock className="text-orange-500 w-5 h-5" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Screen Time</h2>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/20 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                        Active
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
                    <div className="p-2.5 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-xl">
                        <BarChart2 size={20} />
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="min-h-[44px] flex flex-col justify-end">
                    {isEditing ? (
                        <form onSubmit={handleSaveTarget} className="flex items-center justify-between gap-1.5 w-full bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-orange-100 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap uppercase">Target:</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="24"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-14 text-xs font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <span className="text-[10px] font-bold text-gray-400">hrs</span>
                            </div>
                            <div className="flex gap-1">
                                <button type="submit" className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center justify-center">
                                    <Check size={10} />
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)} className="p-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center">
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
