import { useState, useEffect } from 'react';
import { Clock, BarChart2, Edit2, Check, X, ChevronRight } from 'lucide-react';

export default function ScreenTimeCard() {
    const [todayTime, setTodayTime] = useState(0);
    const [targetHours, setTargetHours] = useState(() => {
        try {
            const saved = localStorage.getItem('learnproof_screentime_target');
            return saved ? parseFloat(saved) : 2;
        } catch {
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

    const hrs = Math.floor(todayTime / 3600);
    const mins = Math.floor((todayTime % 3600) / 60);

    // Calculate progress towards custom hours daily learning/screen time target
    const dailyTargetSeconds = targetHours * 3600;
    const percentOfTarget = Math.min(100, Math.round((todayTime / dailyTargetSeconds) * 100));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-750 p-3.5 sm:p-5 flex flex-col justify-between transform transition-all duration-300 hover:shadow-md dark:shadow-gray-900/50">
            {/* Header: Clock + Title + Green Dot + Chevron */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-50 dark:border-gray-700/50">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" strokeWidth={2.4} />
                    <h2 className="text-xs sm:text-base font-bold text-gray-900 dark:text-white truncate">Focus Time</h2>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                </div>
                <ChevronRight size={16} className="text-orange-500 shrink-0 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
            </div>

            {/* Body */}
            <div className="pt-2.5 sm:pt-3 flex flex-col gap-2.5 sm:gap-3 flex-1 justify-between">
                <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider truncate">
                            TODAY'S FOCUS
                        </p>
                        <div className="flex items-baseline gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                            <span className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {hrs > 0 ? `${hrs}h ${mins}` : mins}
                            </span>
                            <span className="text-[10px] sm:text-sm font-bold text-gray-500 dark:text-gray-400 ml-0.5">
                                {hrs > 0 ? 'm' : 'mins'}
                            </span>
                        </div>
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#FFF5ED] dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                        <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" strokeWidth={2.4} />
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="pt-1">
                    {isEditing ? (
                        <form onSubmit={handleSaveTarget} className="flex items-center justify-between gap-1 w-full bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-orange-100 dark:border-gray-700 mb-1.5">
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
                        <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 w-full">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="truncate">of {targetHours}h target</span>
                                <button
                                    onClick={() => {
                                        setEditValue(targetHours.toString());
                                        setIsEditing(true);
                                    }}
                                    className="p-0.5 hover:text-orange-500 transition text-gray-400 dark:text-gray-500 shrink-0"
                                    title="Set Daily Target"
                                >
                                    <Edit2 size={10} />
                                </button>
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300 shrink-0 ml-1">{percentOfTarget}%</span>
                        </div>
                    )}

                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-[#F97316] h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentOfTarget}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

