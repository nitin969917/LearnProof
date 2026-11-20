import React, { useState } from 'react';
import { 
    X, Trophy, Sparkles, Calendar, BookOpen, 
    ArrowRight, CheckCircle2, Clock, Zap, Share2, Download
} from 'lucide-react';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';

export default function SprintVictoryModal({
    isOpen,
    onClose,
    workspaceId,
    topic = '',
    durationMinutes = 25,
    rungsCompleted = 4,
    evaluationScore = 100,
    plan = null,
    onOpenNote
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    if (!isOpen) return null;

    // Calculate dates
    const memoryLockDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    const handleSaveToNotebook = async () => {
        setIsSaving(true);
        try {
            // Generate clean summary markdown from plan
            const summaryMd = `# FlowPilot Mastery: ${topic}

**Deep Study Session:** ${durationMinutes} Minutes • **Score:** ${evaluationScore}%
*Mastered on ${new Date().toLocaleDateString()}*

---

### 1. Core Intuition (The "Why")
${plan?.rung1_intuition?.visualAnalogy || 'Core conceptual model mastered.'}

> **Mental Picture:** ${plan?.rung1_intuition?.mentalPicture || ''}

---

### 2. Core Mechanism & Key Equation
${plan?.rung2_mechanism?.explanation || ''}

${(() => {
    const raw = (plan?.rung2_mechanism?.formulaLatex || '').trim();
    if (!raw) return '$$E = mc^2$$';
    const isCode = /SELECT|CREATE|ALTER|DROP|TRUNCATE|INSERT|UPDATE|TABLE|def |class /i.test(raw);
    if (isCode) {
        const clean = raw.replace(/\\texttt\{([^{}]*)\}/g, '$1').replace(/\$+/g, '').trim();
        return `\`\`\`sql\n${clean}\n\`\`\``;
    }
    return `$$${raw.replace(/\$+/g, '').trim()}$$`;
})()}

---

### 3. Exam Traps to Remember
${(plan?.rung3_traps?.traps || []).map((t, idx) => `
**Trap ${idx + 1}:** ${t.trap}  
*Why marks are lost:* ${t.whyStudentsLoseMarks}  
*How to avoid:* ${t.howToAvoid}
`).join('\n')}

---

### 4. Practice & Derivation Proof
**Exam Question:** ${plan?.rung4_proof?.examQuestion || ''}  
**Model Solution:**  
${plan?.rung4_proof?.modelSolution || ''}

---
*Locked in LearnProof Digital Notebook.*
`;

            const res = await socialApi.post(`/workspaces/${workspaceId}/flowpilot/complete`, {
                topic,
                durationMinutes,
                rungsCompleted,
                score: evaluationScore,
                summaryMarkdown: summaryMd
            });

            if (res.data?.success) {
                setIsSaved(true);
                toast.success('Sprint saved to your Digital Notebook (+XP earned)!');
                if (onOpenNote && res.data.noteId) {
                    onOpenNote(res.data.noteId);
                }
            }
        } catch (err) {
            console.error('[SprintVictoryModal] Save error:', err);
            toast.error('Could not save note to workspace.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-orange-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 text-center bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-16 h-16 rounded-3xl bg-white/20 border border-white/30 text-amber-200 mx-auto flex items-center justify-center mb-3 shadow-inner">
                        <Trophy size={32} className="animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-1">
                        <Sparkles size={12} className="text-amber-200" />
                        Sprint Victory!
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">{topic}</h2>
                    <p className="text-xs text-orange-100 mt-1">
                        Unstoppable deep flow. You mastered all 4 cognitive rungs.
                    </p>
                </div>

                {/* Body Stats */}
                <div className="p-5 sm:p-6 space-y-4 text-slate-800 dark:text-slate-100">
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800">
                            <Clock size={16} className="text-orange-500 mx-auto mb-1" />
                            <div className="text-lg font-black text-slate-900 dark:text-white">{durationMinutes}m</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Focus Time</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800">
                            <CheckCircle2 size={16} className="text-emerald-500 mx-auto mb-1" />
                            <div className="text-lg font-black text-slate-900 dark:text-white">{rungsCompleted}/4</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Rungs Locked</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800">
                            <Zap size={16} className="text-amber-500 mx-auto mb-1" />
                            <div className="text-lg font-black text-slate-900 dark:text-white">+{durationMinutes * 10}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">XP Earned</div>
                        </div>
                    </div>

                    {/* Neuro-Spaced Retention Alert */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                        <Calendar size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                                Automated Memory Lock Scheduled
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                Your brain naturally begins decay in 72 hours. We have scheduled a 2-minute recall sprint for <strong>{memoryLockDate} at 8:00 AM</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Notebook Sync Card */}
                    <div className="p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <BookOpen size={18} className="text-orange-500" />
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                    Save to Digital Handwritten Notebook
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Formatted on ruled paper with KaTeX math & highlighters
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveToNotebook}
                            disabled={isSaving || isSaved}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                                isSaved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
                            }`}
                        >
                            {isSaved ? 'Saved ✓' : isSaving ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>

                    {/* Exit Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer active:scale-95"
                    >
                        <span>Finish & Close Desk</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
