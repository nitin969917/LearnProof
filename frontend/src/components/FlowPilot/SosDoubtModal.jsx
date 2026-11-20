import React, { useState } from 'react';
import { 
    X, LifeBuoy, Sparkles, Send, Mic, MicOff, 
    Loader2, CheckCircle2, ArrowRight, Lightbulb
} from 'lucide-react';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';

export default function SosDoubtModal({ 
    isOpen, 
    onClose, 
    contextTopic = '' 
}) {
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [solution, setSolution] = useState(null);
    const [isListening, setIsListening] = useState(false);

    // Browser Web Speech Recognition
    const handleToggleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Voice input is not supported in this browser.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuestion(prev => (prev ? `${prev} ${transcript}` : transcript));
        };
        recognition.start();
    };

    const handleDissolve = async (e) => {
        if (e) e.preventDefault();
        if (!question.trim()) {
            toast.error('Please describe what is confusing you.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await socialApi.post('/workspaces/flowpilot/sos-doubt', {
                contextTopic,
                studentQuestion: question.trim()
            });

            if (res.data?.success) {
                setSolution(res.data);
            } else {
                toast.error('Could not dissolve doubt. Please try again.');
            }
        } catch (err) {
            console.error('[SosDoubtModal] Error:', err);
            toast.error('Failed to resolve doubt. Check network connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setQuestion('');
        setSolution(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl border border-orange-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
                            <LifeBuoy size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-orange-100">
                                Instant Unblocker • Press Spacebar
                            </div>
                            <h3 className="text-base sm:text-lg font-black tracking-tight">S.O.S. Doubt Dissolver</h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-100">
                    {!solution ? (
                        <form onSubmit={handleDissolve} className="space-y-4">
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Don't let one confusing formula or sentence kill your study session. Ask below and get an unforgettable 15-second analogy:
                            </p>
                            <div className="relative">
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="e.g. Why is gamma in the exponent for adiabatic expansion? Or what is the difference between Resistance and Resistivity?"
                                    rows={3}
                                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium resize-none"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handleToggleVoice}
                                    className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all cursor-pointer ${
                                        isListening 
                                            ? 'bg-red-500 text-white animate-pulse' 
                                            : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:text-orange-500'
                                    }`}
                                    title="Speak your doubt"
                                >
                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !question.trim()}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Dissolving Doubt in 5s...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        <span>Dissolve Doubt Now</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Headline */}
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5">
                                <Lightbulb size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                                        {solution.analogyHeadline || 'Core Intuition'}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {solution.visualAnalogy}
                                    </div>
                                </div>
                            </div>

                            {/* Technical Explanation */}
                            {solution.technicalExplanation && (
                                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-gray-700">
                                    <strong className="text-slate-900 dark:text-white font-bold block mb-1">
                                        The Underlying Mechanism:
                                    </strong>
                                    {solution.technicalExplanation}
                                </div>
                            )}

                            {/* Golden Rule */}
                            {solution.quickRuleToRemember && (
                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <span>Exam Rule: {solution.quickRuleToRemember}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                >
                                    Ask Another Doubt
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span>Resume Study Flow</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
