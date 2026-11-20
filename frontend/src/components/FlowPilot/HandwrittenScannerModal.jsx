import React, { useState, useRef } from 'react';
import { 
    X, Camera, Upload, CheckCircle2, AlertTriangle, 
    Loader2, Award, Sparkles, ArrowRight, RefreshCw, FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { preprocessMath } from '../../utils/mathPreprocessor';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';

export default function HandwrittenScannerModal({
    isOpen,
    onClose,
    examQuestion = '',
    markingRubric = [],
    onGradingComplete
}) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGradeSubmission = async () => {
        if (!previewUrl) {
            toast.error('Please upload or snap a photo of your handwritten paper.');
            return;
        }

        setIsGrading(true);
        try {
            const res = await socialApi.post('/workspaces/flowpilot/grade-handwritten', {
                examQuestion,
                markingRubric,
                imageBase64: previewUrl
            });

            if (res.data?.success) {
                setEvaluation(res.data);
                toast.success('Handwritten paper graded successfully!');
                if (onGradingComplete) {
                    onGradingComplete(res.data);
                }
            } else {
                toast.error('Could not grade handwriting. Please ensure the photo is clear.');
            }
        } catch (err) {
            console.error('[HandwrittenScannerModal] Error:', err);
            toast.error('Failed to grade paper. Check image clarity and connection.');
        } finally {
            setIsGrading(false);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setEvaluation(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl border border-orange-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
                            <Camera size={19} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-orange-100">
                                Rung 4 • Multimodal Paper Grader
                            </div>
                            <h3 className="text-base sm:text-lg font-black tracking-tight">Scan Physical Handwritten Solve</h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-sm">
                    {/* Question Summary */}
                    {examQuestion && (
                        <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-gray-800/60 border border-orange-200/60 dark:border-gray-700">
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 block mb-1">
                                Problem to Solve:
                            </span>
                            <div className="text-xs font-semibold text-slate-850 dark:text-slate-100 leading-relaxed overflow-x-auto">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto my-2 rounded-xl border border-orange-200 dark:border-gray-700">
                                                <table className="min-w-full text-xs divide-y divide-orange-100 dark:divide-gray-800" {...props} />
                                            </div>
                                        ),
                                        th: ({ node, ...props }) => <th className="px-2 py-1.5 bg-orange-100/60 dark:bg-gray-800 text-left font-bold text-[10px]" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-2 py-1.5 border-t border-orange-100 dark:border-gray-800 font-mono text-[10px]" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-1 leading-relaxed" {...props} />,
                                        code: ({ node, ...props }) => <code className="bg-orange-100/60 dark:bg-gray-800 px-1 py-0.5 rounded text-orange-700 dark:text-orange-400 font-mono text-[10px]" {...props} />
                                    }}
                                >
                                    {preprocessMath(examQuestion)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {!evaluation ? (
                        <div className="space-y-4">
                            {/* Upload / Camera Box */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-orange-300 dark:border-orange-500/40 rounded-3xl p-6 text-center cursor-pointer hover:bg-orange-50/40 dark:hover:bg-orange-950/20 transition-all flex flex-col items-center justify-center min-h-[200px]"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {previewUrl ? (
                                    <div className="space-y-3 w-full">
                                        <img 
                                            src={previewUrl} 
                                            alt="Handwritten Paper Preview" 
                                            className="max-h-60 mx-auto rounded-2xl shadow-md border border-slate-200 dark:border-gray-700 object-contain"
                                        />
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                            Photo selected! Tap below to calculate official step marks.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center shadow-sm">
                                            <Camera size={26} />
                                        </div>
                                        <div className="font-bold text-sm text-slate-850 dark:text-slate-100">
                                            Take a photo or upload your notebook page
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                            Gemini 1.5 Multimodal reads your handwriting, formulas, and derivations line-by-line.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Grade Button */}
                            {previewUrl && (
                                <button
                                    onClick={handleGradeSubmission}
                                    disabled={isGrading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                                >
                                    {isGrading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Examiner Inspecting Your Handwritten Steps...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>Grade My Handwriting & Award Board Marks</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Evaluation Results View */
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Score Card Header */}
                            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                            Official Board Step Score
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                            {evaluation.awardedMarks} / {evaluation.totalPossibleMarks || 3} Marks
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase ${
                                        evaluation.awardedMarks >= (evaluation.totalPossibleMarks || 3) * 0.8
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                                    }`}>
                                        {evaluation.awardedMarks >= (evaluation.totalPossibleMarks || 3) * 0.8 ? 'Distinction' : 'Passing'}
                                    </span>
                                </div>
                            </div>

                            {/* Step Breakdown */}
                            <div className="space-y-2">
                                <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Step-by-Step Examiner Audit:
                                </div>
                                {(evaluation.stepEvaluations || []).map((step, idx) => (
                                    <div 
                                        key={idx}
                                        className="p-3 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 flex items-start justify-between gap-3"
                                    >
                                        <div>
                                            <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                                {step.stepName}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {step.comment}
                                            </div>
                                        </div>
                                        <div className="shrink-0 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs font-black text-emerald-600 dark:text-emerald-400">
                                            +{step.awarded} / {step.maxMarks}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Examiner Tip */}
                            {evaluation.examinerTip && (
                                <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2.5">
                                    <Sparkles size={16} className="text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="block font-bold">Examiner Presentation Tip:</strong>
                                        {evaluation.examinerTip}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RefreshCw size={13} />
                                    <span>Re-take Photo</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span>Accept Score & Unlock Victory</span>
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
