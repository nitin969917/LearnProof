import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
    X, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
    ArrowLeft, Mic, MicOff, LifeBuoy, Camera, Play, Pause, 
    RotateCcw, Trophy, BookOpen, Volume2, ShieldCheck, Check,
    Layers, ChevronRight, PenTool, Compass
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from '../../utils/mathPreprocessor';
import toast from 'react-hot-toast';
import socialApi from '../../api/socialApi';
import SosDoubtModal from './SosDoubtModal';
import HandwrittenScannerModal from './HandwrittenScannerModal';
import SprintVictoryModal from './SprintVictoryModal';

function FormulaOrCodeBlock({ content }) {
    const [copied, setCopied] = useState(false);
    if (!content || typeof content !== 'string') return null;

    let text = content.trim();

    // Strip wrapping markdown code blocks or math delimiters
    text = text.replace(/^(\$\$|\\\[|```(?:sql|latex|math|text)?)\s*/i, '');
    text = text.replace(/\s*(\$\$|\\\]|```)$/i, '').trim();

    // Extract content from \texttt{...} or \text{...} if it was wrapped by LLM
    if (/\\texttt\{[\s\S]*?\}/.test(text)) {
        text = text.replace(/\\texttt\{([^{}]*)\}/g, '$1\n').trim();
    }
    if (/\\text\{[\s\S]*?\}/.test(text) && !/\\frac|\\sum|\\int|\\sigma|\\pi/.test(text)) {
        text = text.replace(/\\text\{([^{}]*)\}/g, '$1\n').trim();
    }

    // Strip any dangling single or double dollar signs
    text = text.replace(/^\$+|\$+$/g, '').trim();

    // Detect if this is Code / SQL Syntax vs Mathematical LaTeX
    const codeKeywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
        'ALTER', 'TABLE', 'DROP', 'TRUNCATE', 'JOIN', 'GROUP BY', 'ORDER BY',
        'HAVING', 'CONSTRAINT', 'FOREIGN KEY', 'PRIMARY KEY', 'INDEX',
        'DATABASE', 'SCHEMA', 'REFERENCES', 'CHECK', 'DEFAULT', 'VALUES',
        'FUNCTION', 'CLASS', 'DEF', 'CONST', 'LET', 'VAR', 'RETURN'
    ];
    const upperText = text.toUpperCase();
    const hasCodeKeyword = codeKeywords.some(kw => new RegExp(`\\b${kw}\\b`).test(upperText));
    const isCode = hasCodeKeyword || (text.includes(';') && !text.includes('\\;'));

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Syntax copied to clipboard!');
    };

    if (isCode) {
        return (
            <div className="rounded-2xl bg-slate-950 dark:bg-black border border-orange-500/30 overflow-hidden shadow-md text-left">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-orange-400">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                            Key Governing Syntax & Commands
                        </span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer font-sans"
                    >
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                </div>
                <div className="p-4 sm:p-5 overflow-x-auto">
                    <pre className="font-mono text-xs sm:text-sm text-orange-200 leading-relaxed whitespace-pre-wrap selection:bg-orange-500/30">
                        {text}
                    </pre>
                </div>
            </div>
        );
    }

    // Mathematical formula
    return (
        <div className="p-5 rounded-2xl bg-orange-50/40 dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-900/50 text-center shadow-inner overflow-x-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 block mb-2">
                Fundamental Governing Equation:
            </span>
            <div className="text-lg sm:text-xl font-mono text-slate-900 dark:text-white py-1">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {`$$${preprocessMath(text)}$$`}
                </ReactMarkdown>
            </div>
        </div>
    );
}

export default function FlowPilotStudyDesk({
    isOpen,
    onClose,
    workspaceId,
    initialPlan,
    onOpenNote
}) {
    // Multi-topic modules support
    const modules = useMemo(() => {
        if (initialPlan?.topicModules && Array.isArray(initialPlan.topicModules) && initialPlan.topicModules.length > 0) {
            return initialPlan.topicModules;
        }
        return [{
            moduleId: 1,
            topicName: initialPlan?.topic || 'Core Concept',
            rung1_intuition: initialPlan?.rung1_intuition,
            rung2_mechanism: initialPlan?.rung2_mechanism,
            rung3_traps: initialPlan?.rung3_traps,
            rung4_proof: initialPlan?.rung4_proof
        }];
    }, [initialPlan]);

    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [completedModuleIndices, setCompletedModuleIndices] = useState([]);
    const [completedRungsMap, setCompletedRungsMap] = useState({});

    // Current active module being studied
    const currentModule = modules[activeModuleIndex] || modules[0] || initialPlan;
    const currentCompletedRungs = completedRungsMap[activeModuleIndex] || [];

    // Current Active Rung (1 to 4) within the active module
    const [activeRung, setActiveRung] = useState(1);

    // Timer State
    const totalMinutes = initialPlan?.estimatedMinutes || (modules.length > 1 ? modules.length * 20 : 25);
    const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    // Modals
    const [isSosOpen, setIsSosOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isVictoryOpen, setIsVictoryOpen] = useState(false);

    // Rung 1 Interactive Checkpoint
    const [rung1Answered, setRung1Answered] = useState(false);

    // Voice State for Rung 2
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceEvaluation, setVoiceEvaluation] = useState(null);
    const [isEvaluatingVoice, setIsEvaluatingVoice] = useState(false);

    // Rung 4 Grading Results
    const [rung4Evaluation, setRung4Evaluation] = useState(null);
    const [showRung4CheatSheet, setShowRung4CheatSheet] = useState(false);

    // 5-Pillar Masterclass Sub-Tabs for Rung 2 ('theory', 'notations', 'algorithm', 'example')
    const [rung2ActiveTab, setRung2ActiveTab] = useState('theory');

    // Mermaid Diagram Container Ref
    const mermaidRef = useRef(null);

    // Global Spacebar shortcut for S.O.S. Doubt Dissolver
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setIsSosOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Timer Countdown
    useEffect(() => {
        if (!isTimerRunning || secondsLeft <= 0) return;
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, secondsLeft]);

    // Format MM:SS
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Sanitize Mermaid code to ensure valid quotes and diagram type
    const sanitizeMermaid = (rawCode) => {
        if (!rawCode) return '';
        let cleaned = rawCode.trim();
        // Strip markdown code fences
        cleaned = cleaned.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Ensure diagram header exists
        if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie)/i.test(cleaned)) {
            cleaned = `graph TD\n${cleaned}`;
        }

        // Auto-quote unquoted node labels containing parentheses or special characters: A[Label (with details)] -> A["Label (with details)"]
        cleaned = cleaned.replace(/(\b[A-Za-z0-9_]+)\[([^"\]\n]*[\(\)\{\}\<\>\:\/][^"\]\n]*)\]/g, (match, id, text) => {
            return `${id}["${text.replace(/"/g, "'")}"]`;
        });

        return cleaned;
    };

    // Render Mermaid diagram on Rung 2 if code is available for current module
    useEffect(() => {
        if (activeRung === 2 && currentModule?.rung2_mechanism?.diagramCode) {
            import('mermaid').then(m => {
                const mermaid = m.default || m;
                const isDark = document.documentElement.classList.contains('dark');
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'base',
                    themeVariables: isDark ? {
                        darkMode: true,
                        background: '#111827',
                        primaryColor: '#1f2937',
                        primaryTextColor: '#f8fafc',
                        primaryBorderColor: '#ea580c',
                        lineColor: '#fb923c',
                        secondaryColor: '#374151',
                        tertiaryColor: '#111827',
                        mainBkg: '#1f2937',
                        nodeBorder: '#ea580c',
                        textColor: '#f8fafc'
                    } : {
                        darkMode: false,
                        background: '#ffffff',
                        primaryColor: '#fff7ed',
                        primaryTextColor: '#7c2d12',
                        primaryBorderColor: '#ea580c',
                        lineColor: '#f97316',
                        secondaryColor: '#fed7aa',
                        tertiaryColor: '#f8fafc',
                        nodeBorder: '#ea580c',
                        mainBkg: '#fff7ed',
                        textColor: '#431407'
                    },
                    securityLevel: 'loose'
                });
                if (mermaidRef.current) {
                    const raw = currentModule.rung2_mechanism.diagramCode;
                    const sanitized = sanitizeMermaid(raw);
                    const renderId = `mermaid-graph-${Date.now()}`;
                    try {
                        mermaid.render(renderId, sanitized)
                            .then(({ svg }) => {
                                if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
                            })
                            .catch(err => {
                                console.warn('[FlowPilot] Mermaid render error (recovered):', err?.message || err);
                                if (mermaidRef.current) {
                                    mermaidRef.current.innerHTML = `<div class="p-3 text-xs font-mono text-left bg-slate-900/80 rounded-xl text-orange-200 whitespace-pre-wrap">${sanitized}</div>`;
                                }
                            });
                    } catch (e) {
                        console.warn('[FlowPilot] Mermaid parse exception:', e.message);
                    }
                }
            });
        }
    }, [activeRung, currentModule]);

    // Switch Topic Module
    const switchModule = (index) => {
        if (index === activeModuleIndex) return;
        setActiveModuleIndex(index);
        setActiveRung(1);
        setRung1Answered(false);
        setVoiceTranscript('');
        setVoiceEvaluation(null);
        setIsListening(false);
        setRung4Evaluation(null);
        setRung2ActiveTab('theory');
        setShowRung4CheatSheet(false);
    };

    // Toggle Voice Recognition for Socratic Check
    const handleToggleVoice = useCallback(() => {
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
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setVoiceTranscript(transcript);

            // Immediately evaluate spoken answer against current module's checkpoint
            setIsEvaluatingVoice(true);
            try {
                const res = await socialApi.post('/workspaces/flowpilot/evaluate-voice', {
                    question: currentModule?.rung2_mechanism?.voiceCheckpoint?.question || '',
                    idealAnswer: currentModule?.rung2_mechanism?.voiceCheckpoint?.idealAnswer || '',
                    expectedKeywords: currentModule?.rung2_mechanism?.voiceCheckpoint?.expectedKeywords || [],
                    studentSpeech: transcript
                });

                if (res.data?.success) {
                    setVoiceEvaluation(res.data);
                    if (res.data.isCorrect) {
                        toast.success(`${res.data.praiseWord} Concept validated!`);
                    } else {
                        toast(res.data.shortFeedback, { icon: '💡' });
                    }
                }
            } catch (err) {
                console.error('[Voice Check] Evaluation error:', err);
            } finally {
                setIsEvaluatingVoice(false);
            }
        };

        recognition.start();
    }, [currentModule, isListening]);

    // Complete Rung and Advance (with topic-by-topic module progression)
    const handleCompleteRung = (rungNum) => {
        setCompletedRungsMap(prev => {
            const currentList = prev[activeModuleIndex] || [];
            if (!currentList.includes(rungNum)) {
                return { ...prev, [activeModuleIndex]: [...currentList, rungNum] };
            }
            return prev;
        });

        if (rungNum < 4) {
            setActiveRung(rungNum + 1);
        } else {
            // Rung 4 completed for this module
            if (!completedModuleIndices.includes(activeModuleIndex)) {
                setCompletedModuleIndices(prev => [...prev, activeModuleIndex]);
            }

            if (activeModuleIndex < modules.length - 1) {
                // Advance to the next topic module in this chapter
                const nextIdx = activeModuleIndex + 1;
                switchModule(nextIdx);
                toast.success(`🎉 Topic ${activeModuleIndex + 1} Mastered! Advanced to: ${modules[nextIdx].topicName}`);
            } else {
                // All topics in the chapter sprint mastered! Full Victory!
                setIsVictoryOpen(true);
            }
        }
    };

    if (!isOpen || !initialPlan) return null;

    // Calculate total completed rungs across all modules for overall mastery bar
    const totalPossibleRungs = modules.length * 4;
    const totalCompletedRungs = Object.values(completedRungsMap).reduce((sum, arr) => sum + arr.length, 0);
    const overallProgressPercent = Math.min(100, Math.round((totalCompletedRungs / totalPossibleRungs) * 100));

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden select-none">
            {/* Top Focus Horizon Bar */}
            <div className="h-16 px-4 sm:px-8 border-b border-orange-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center justify-between z-10 shrink-0 shadow-sm">
                {/* Left: Topic Title */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center font-black shadow-md shadow-orange-500/20 text-white shrink-0">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold uppercase text-[9px] px-2 py-0.5 rounded-full tracking-wider">
                                FlowPilot Study Desk
                            </span>
                            {modules.length > 1 && (
                                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-full">
                                    Topic {activeModuleIndex + 1} of {modules.length}
                                </span>
                            )}
                        </div>
                        <h1 className="text-sm sm:text-base font-black truncate max-w-[200px] sm:max-w-md text-slate-900 dark:text-white tracking-tight mt-0.5">
                            {currentModule.topicName || initialPlan.topic || 'Deep Study Sprint'}
                        </h1>
                    </div>
                </div>

                {/* Center: Focus Timer & Cognitive Pulse */}
                <div className="hidden sm:flex items-center gap-4 bg-orange-50/60 dark:bg-gray-800 border border-orange-100 dark:border-gray-700/60 rounded-full px-5 py-2 shadow-xs">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className="p-1 hover:text-orange-600 dark:hover:text-orange-400 transition-all text-slate-500 dark:text-slate-400 cursor-pointer"
                            title={isTimerRunning ? 'Pause Sprint' : 'Resume Sprint'}
                        >
                            {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <span className="font-mono text-sm font-black tracking-wider text-orange-600 dark:text-orange-400">
                            {formatTime(secondsLeft)}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Focus</span>
                    </div>

                    {/* Cognitive Pulse Indicator */}
                    <div className="flex items-center gap-1.5 pl-3 border-l border-orange-200 dark:border-gray-700">
                        <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pulse</div>
                        <div className="flex items-center gap-0.5">
                            {[12, 18, 10, 22, 14, 20].map((h, i) => (
                                <div
                                    key={i}
                                    style={{ height: `${h}px`, animationDelay: `${i * 150}ms` }}
                                    className="w-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-full animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: S.O.S. Button & Close */}
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setIsSosOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                        title="Shortcut: Ctrl+Space / Cmd+Space"
                    >
                        <LifeBuoy size={15} className="animate-spin text-amber-600 dark:text-amber-400" style={{ animationDuration: '8s' }} />
                        <span className="hidden sm:inline">Doubt S.O.S.</span>
                        <kbd className="hidden md:inline px-1 py-0.5 rounded bg-white dark:bg-black/40 text-[9px] font-mono text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">Space</kbd>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                        title="Exit Study Desk"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Multi-Topic Stepper Bar (Rendered when chapter has multiple topics selected) */}
            {modules.length > 1 && (
                <div className="bg-orange-50/90 dark:bg-gray-900 border-b border-orange-200/70 dark:border-gray-800 px-4 sm:px-8 py-2 flex items-center justify-between gap-3 overflow-x-auto z-10 shrink-0">
                    <div className="flex items-center gap-2 shrink-0">
                        <Layers size={14} className="text-orange-500" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Chapter Curriculum ({modules.length} Topics):
                        </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                        {modules.map((mod, idx) => {
                            const isCurrent = activeModuleIndex === idx;
                            const isDone = completedModuleIndices.includes(idx);
                            const modRungs = completedRungsMap[idx]?.length || 0;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => switchModule(idx)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        isCurrent
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20'
                                            : isDone
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                            : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-gray-700 hover:border-orange-300'
                                    }`}
                                >
                                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                        isCurrent 
                                            ? 'bg-white/20 text-white' 
                                            : isDone 
                                            ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' 
                                            : 'bg-slate-100 dark:bg-gray-700 text-slate-500'
                                    }`}>
                                        {isDone ? <Check size={11} /> : idx + 1}
                                    </span>
                                    <span className="truncate max-w-[130px] sm:max-w-[180px]">
                                        {mod.topicName || `Topic ${idx + 1}`}
                                    </span>
                                    {!isDone && !isCurrent && modRungs > 0 && (
                                        <span className="text-[9px] opacity-75 font-mono">({modRungs}/4)</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Stage Grid: Left Rung Ladder + Center Active Canvas */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: 4-Rung Mastery Ladder */}
                <div className="w-64 sm:w-72 border-r border-orange-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
                    <div>
                        <div className="flex items-center justify-between mb-3 px-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                4-Rung Mastery Ladder
                            </span>
                            {modules.length > 1 && (
                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                    Topic #{activeModuleIndex + 1}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {[
                                { rung: 1, title: 'Rung 1: Core Intuition', desc: "Understand the 'Why'", data: currentModule.rung1_intuition },
                                { rung: 2, title: 'Rung 2: Core Mechanism', desc: 'Master the Process & Formulas', data: currentModule.rung2_mechanism },
                                { rung: 3, title: 'Rung 3: Trap Detector', desc: 'Identify Board/Exam Traps', data: currentModule.rung3_traps },
                                { rung: 4, title: 'Rung 4: Proof Problem', desc: 'Apply & Solve on Paper', data: currentModule.rung4_proof }
                            ].map(item => {
                                const isCompleted = currentCompletedRungs.includes(item.rung);
                                const isActive = activeRung === item.rung;
                                const isLocked = item.rung > 1 && !currentCompletedRungs.includes(item.rung - 1) && !isCompleted;

                                return (
                                    <div
                                        key={item.rung}
                                        onClick={() => !isLocked && setActiveRung(item.rung)}
                                        className={`p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden ${
                                            isActive
                                                ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/30'
                                                : isCompleted
                                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300'
                                                : isLocked
                                                ? 'border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/40 opacity-50 cursor-not-allowed'
                                                : 'border-slate-200/80 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-orange-200 dark:hover:border-gray-700 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-black ${isActive ? 'text-orange-600 dark:text-orange-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {item.title}
                                            </span>
                                            {isCompleted ? (
                                                <CheckCircle2 size={15} className="text-emerald-500" />
                                            ) : isLocked ? (
                                                <span className="text-[10px] text-slate-400">🔒</span>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                            {item.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress Summary Card */}
                    <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-gray-800/60 border border-orange-100 dark:border-gray-800 mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-500 dark:text-slate-400">
                                {modules.length > 1 ? 'Chapter Mastery' : 'Session Mastery'}
                            </span>
                            <span className="font-mono font-black text-orange-600 dark:text-orange-400">
                                {overallProgressPercent}%
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                            <div 
                                style={{ width: `${overallProgressPercent}%` }}
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
                            />
                        </div>
                        {modules.length > 1 && (
                            <div className="text-[10px] text-slate-400 font-medium flex justify-between pt-0.5">
                                <span>{completedModuleIndices.length} of {modules.length} topics done</span>
                                <span>{totalCompletedRungs}/{totalPossibleRungs} rungs</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Stage: Dynamic Active Learning Card */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-gray-950 select-text">
                    <div className="max-w-3xl mx-auto w-full space-y-6">
                        {/* ======================================================== */}
                        {/* RUNG 1: CORE INTUITION (The "Aha!" Moment)              */}
                        {/* ======================================================== */}
                        {activeRung === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-800 shadow-sm space-y-5">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider">
                                        Rung 1 • The Core Mental Picture
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {currentModule.rung1_intuition?.title || 'The Core Intuition'}
                                    </h2>

                                    {/* Visual Analogy */}
                                    <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-gray-800/60 border border-orange-200/60 dark:border-gray-700/60 text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {preprocessMath(currentModule.rung1_intuition?.visualAnalogy || '')}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Mental Picture */}
                                    {currentModule.rung1_intuition?.mentalPicture && (
                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200/80 dark:border-gray-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                            <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">Mental Model:</span>
                                            <span>{currentModule.rung1_intuition.mentalPicture}</span>
                                        </div>
                                    )}

                                    {/* Real-World Mapping Bridge */}
                                    {currentModule.rung1_intuition?.realWorldMapping && (
                                        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                                            <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">Real-World Bridge:</span>
                                            <span>{currentModule.rung1_intuition.realWorldMapping}</span>
                                        </div>
                                    )}

                                    {/* Intuition Checkpoint */}
                                    {currentModule.rung1_intuition?.checkQuestion && (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-3">
                                            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                                                <Sparkles size={14} />
                                                10-Second Intuition Checkpoint:
                                            </div>
                                            <p className="text-sm font-bold text-slate-850 dark:text-slate-100">
                                                {currentModule.rung1_intuition.checkQuestion}
                                            </p>

                                            {!rung1Answered ? (
                                                <button
                                                    onClick={() => setRung1Answered(true)}
                                                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                                                >
                                                    Reveal Intuition Verification
                                                </button>
                                            ) : (
                                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                    <span><strong>Verified:</strong> {currentModule.rung1_intuition.checkAnswer}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-2 flex justify-end">
                                        <button
                                            onClick={() => handleCompleteRung(1)}
                                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                                        >
                                            <span>Mastered Intuition → Advance to Mechanism</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* RUNG 2: CORE MECHANISM & FORMULAS (LaTeX & Diagrams)     */}
                        {/* ======================================================== */}
                        {activeRung === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-800 shadow-sm space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider">
                                            Rung 2 • 5-Pillar Masterclass Hub
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400">
                                            Comprehensive Exam Readiness
                                        </span>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {currentModule.rung2_mechanism?.title || 'Core Mechanism & Construction Rules'}
                                    </h2>

                                    {/* 5-Pillar Masterclass Sub-Navigation Tabs */}
                                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-gray-800/80 rounded-2xl overflow-x-auto">
                                        <button
                                            onClick={() => setRung2ActiveTab('theory')}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                                rung2ActiveTab === 'theory'
                                                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <BookOpen size={14} />
                                            <span>1. Theory & Rules</span>
                                        </button>

                                        <button
                                            onClick={() => setRung2ActiveTab('notations')}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                                rung2ActiveTab === 'notations'
                                                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <PenTool size={14} />
                                            <span>2. Drawing & Notations Guide</span>
                                            <span className="text-[9px] bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                                                Key
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => setRung2ActiveTab('algorithm')}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                                rung2ActiveTab === 'algorithm'
                                                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Compass size={14} />
                                            <span>3. Solving Algorithm</span>
                                        </button>

                                        <button
                                            onClick={() => setRung2ActiveTab('example')}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                                rung2ActiveTab === 'example'
                                                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Trophy size={14} />
                                            <span>4. Solved Case Study</span>
                                        </button>
                                    </div>

                                    {/* TAB 1: Theory & Mechanism */}
                                    {rung2ActiveTab === 'theory' && (
                                        <div className="space-y-4 animate-in fade-in duration-150">
                                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="leading-relaxed" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                                        code: ({ node, ...props }) => <code className="bg-orange-50 dark:bg-gray-800 px-1 py-0.5 rounded text-orange-600 dark:text-orange-400 font-mono text-xs" {...props} />
                                                    }}
                                                >
                                                    {preprocessMath(currentModule.rung2_mechanism?.explanation || '')}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Key LaTeX Formula or Code Syntax */}
                                            {currentModule.rung2_mechanism?.formulaLatex && (
                                                <FormulaOrCodeBlock content={currentModule.rung2_mechanism.formulaLatex} />
                                            )}

                                            {/* Mermaid / Vector Diagram Canvas */}
                                            {currentModule.rung2_mechanism?.diagramCode && (
                                                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/90 border border-orange-100 dark:border-gray-700 overflow-x-auto shadow-xs">
                                                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-orange-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <Sparkles size={13} className="text-orange-500" />
                                                            Visual Architecture / Flow Diagram
                                                        </span>
                                                        <span className="text-slate-400 font-mono text-[9px]">Interactive Model</span>
                                                    </div>
                                                    <div ref={mermaidRef} className="mermaid flex justify-center py-2 min-h-[140px] items-center" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: Official Exam Notations & Drawing Guide */}
                                    {rung2ActiveTab === 'notations' && (
                                        <div className="space-y-4 animate-in fade-in duration-150">
                                            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <PenTool size={16} className="text-orange-500 shrink-0" />
                                                    <span><strong>Examiner Directive:</strong> In board exams, drawing the wrong shape loses 100% of the component marks. Master these exact shapes.</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {((currentModule.rung2_mechanism?.examNotations && currentModule.rung2_mechanism.examNotations.length > 0)
                                                    ? currentModule.rung2_mechanism.examNotations
                                                    : [
                                                        { name: 'Strong Entity Set', shape: 'Solid Rectangle [___]', meaning: 'Independent real-world object (e.g. Student, Doctor)', howToDraw: 'Draw a single-line rectangle. Label in CAPITAL letters.' },
                                                        { name: 'Weak Entity Set', shape: 'Double Rectangle [[___]]', meaning: 'Entity lacking a primary key of its own; depends on owner entity', howToDraw: 'Draw two concentric rectangles. Must connect to identifying relationship.' },
                                                        { name: 'Primary Key Attribute', shape: 'Underlined Ellipse (_Key_)', meaning: 'Attribute that uniquely identifies each entity tuple', howToDraw: 'Draw an oval and explicitly UNDERLINE the text. Examiners deduct marks if underline is omitted.' },
                                                        { name: 'Multivalued Attribute', shape: 'Double Ellipse ((___))', meaning: 'Attribute having multiple values for one entity (e.g. Phone, Skills)', howToDraw: 'Draw two concentric ovals attached to the entity.' },
                                                        { name: 'Derived Attribute', shape: 'Dashed Ellipse (- - -)', meaning: 'Attribute computed dynamically from another attribute (e.g. Age from DOB)', howToDraw: 'Draw a dashed or dotted oval boundary.' },
                                                        { name: 'Relationship Diamond', shape: 'Diamond <___>', meaning: 'Association connecting participating entities', howToDraw: 'Draw a diamond with active verb inside. Annotate lines with cardinality (1, N, M).' }
                                                    ]
                                                ).map((notat, idx) => (
                                                    <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-orange-100 dark:border-gray-700 shadow-xs space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-gray-900 border border-orange-200 dark:border-gray-700 text-orange-600 dark:text-orange-400">
                                                                {notat.shape}
                                                            </span>
                                                            <span className="text-[10px] font-black uppercase text-slate-400">Symbol #{idx + 1}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{notat.name}</h4>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notat.meaning}</p>
                                                        <div className="p-2.5 rounded-xl bg-orange-50/50 dark:bg-gray-900/60 border border-orange-100 dark:border-gray-700/60 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                                                            <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">How to Draw:</span>
                                                            <span>{notat.howToDraw}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: Step-by-Step Construction Algorithm */}
                                    {rung2ActiveTab === 'algorithm' && (
                                        <div className="space-y-4 animate-in fade-in duration-150">
                                            <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs text-orange-900 dark:text-orange-300 flex items-center gap-2">
                                                <Compass size={16} className="text-orange-500 shrink-0" />
                                                <span><strong>The 4-Step Board Execution Recipe:</strong> Follow these 4 steps in exact sequence whenever given any exam question.</span>
                                            </div>

                                            <div className="space-y-3">
                                                {((currentModule.rung2_mechanism?.stepByStepAlgorithm && currentModule.rung2_mechanism.stepByStepAlgorithm.length > 0)
                                                    ? currentModule.rung2_mechanism.stepByStepAlgorithm
                                                    : [
                                                        { stepNumber: 1, title: 'Linguistic Noun & Verb Extraction', rule: 'Read the exam prompt carefully. Underline all NOUNS (these become candidate Entity Rectangles) and circle all VERBS (these become Relationship Diamonds).', proTip: 'Do not make an attribute an entity (e.g., Student_Age is an attribute oval, not an entity).' },
                                                        { stepNumber: 2, title: 'Designate Attributes & Primary Keys', rule: 'Attach attribute ovals to their respective entities. Identify the unique attribute and UNDERLINE it (e.g. Roll_No, Dept_ID).', proTip: 'Check for composite attributes (branch them out) and multivalued attributes (double oval).' },
                                                        { stepNumber: 3, title: 'Map Directional Cardinalities (1:1, 1:N, M:N)', rule: 'Ask both directions: Can 1 Department have many Students? (Yes -> N). Can 1 Student belong to many Departments? (No -> 1). Mark 1 on Department side and N on Student side.', proTip: 'Examiners award distinct marks for having correct 1, N, M letters on lines.' },
                                                        { stepNumber: 4, title: 'Identify Participation (Total vs Partial)', rule: 'Ask: Must EVERY student belong to a department? If yes, draw a DOUBLE LINE between Student and relationship diamond.', proTip: 'Weak entities always have total participation (double lines).' }
                                                    ]
                                                ).map((algo, idx) => (
                                                    <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-orange-100 dark:border-gray-700 shadow-xs space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black">
                                                                {algo.stepNumber || idx + 1}
                                                            </span>
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{algo.title}</h4>
                                                        </div>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-8">
                                                            {algo.rule}
                                                        </p>
                                                        {algo.proTip && (
                                                            <div className="ml-8 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                                                                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">💡 Board Examiner Tip:</span>
                                                                <span>{algo.proTip}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 4: Solved Case Walkthrough */}
                                    {rung2ActiveTab === 'example' && (
                                        <div className="space-y-4 animate-in fade-in duration-150">
                                            {(() => {
                                                const example = currentModule.rung2_mechanism?.workedExample || {
                                                    title: 'Solved Board Exam Problem: University Department System',
                                                    problemPrompt: 'A University has Students and Departments. Each Student has Roll_No (unique), Name, and Phone (multiple). Each Department has Dept_ID (unique) and Dept_Name. A student belongs to one department, but a department employs multiple students. Draw the complete E-R diagram with full Chen notation.',
                                                    stepBreakdown: [
                                                        'Step 1: Entities identified -> STUDENT, DEPARTMENT (drawn as 2 rectangles).',
                                                        'Step 2: Attributes -> STUDENT has Roll_No (underlined PK), Name (oval), Phone (double oval). DEPARTMENT has Dept_ID (underlined PK), Dept_Name (oval).',
                                                        'Step 3: Relationship -> BELONGS_TO diamond connecting STUDENT and DEPARTMENT.',
                                                        'Step 4: Cardinality -> 1 Department has N Students. Cardinality 1:N.'
                                                    ],
                                                    solutionSummary: 'Final model contains 2 strong entities, 1 binary relationship with 1:N cardinality, 1 multivalued attribute, and 2 underlined primary keys.'
                                                };

                                                return (
                                                    <div className="space-y-4">
                                                        <div className="p-5 rounded-2xl bg-orange-50/60 dark:bg-gray-800/80 border border-orange-200/80 dark:border-gray-700 space-y-2">
                                                            <div className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">
                                                                {example.title}
                                                            </div>
                                                            <p className="text-xs sm:text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed">
                                                                "{example.problemPrompt}"
                                                            </p>
                                                        </div>

                                                        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 space-y-3">
                                                            <div className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                                Step-by-Step Construction Walkthrough:
                                                            </div>
                                                            <div className="space-y-2">
                                                                {(example.stepBreakdown || []).map((st, sIdx) => (
                                                                    <div key={sIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                                                            ✓
                                                                        </span>
                                                                        <span className="leading-relaxed">{st}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {example.solutionSummary && (
                                                            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                                <span><strong>Final Exam Takeaway:</strong> {example.solutionSummary}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* Socratic Voice Checkpoint Box */}
                                    {currentModule.rung2_mechanism?.voiceCheckpoint && (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs font-black uppercase tracking-wider text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                                                    <Mic size={14} className="text-orange-500" />
                                                    Socratic Spoken Voice Check:
                                                </div>
                                                {voiceEvaluation?.isCorrect && (
                                                    <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                        Passed ✓
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm font-bold text-slate-850 dark:text-slate-100">
                                                "{currentModule.rung2_mechanism.voiceCheckpoint.question}"
                                            </p>

                                            {/* Mic Recorder Button */}
                                            <div className="flex items-center gap-3 pt-1">
                                                <button
                                                    onClick={handleToggleVoice}
                                                    disabled={isEvaluatingVoice}
                                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                                                        isListening
                                                            ? 'bg-red-500 text-white animate-pulse'
                                                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                                                    }`}
                                                >
                                                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                                                    <span>{isListening ? 'Listening (Speak now)...' : 'Speak Your Answer (10s)'}</span>
                                                </button>

                                                {voiceTranscript && (
                                                    <div className="text-xs text-slate-600 dark:text-slate-300 italic truncate max-w-xs">
                                                        "{voiceTranscript}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Live Feedback */}
                                            {voiceEvaluation && (
                                                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                                                    voiceEvaluation.isCorrect
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                                                        : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                                                }`}>
                                                    <Sparkles size={14} className="shrink-0" />
                                                    <span><strong>{voiceEvaluation.praiseWord}</strong> {voiceEvaluation.shortFeedback}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-2 flex justify-between items-center">
                                        <button
                                            onClick={() => setActiveRung(1)}
                                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                                        >
                                            ← Back to Intuition
                                        </button>
                                        <button
                                            onClick={() => handleCompleteRung(2)}
                                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                                        >
                                            <span>Mechanism Mastered → View Exam Traps</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* RUNG 3: THE EXAM TRAP DETECTOR (Board / Univ Secrets)    */}
                        {/* ======================================================== */}
                        {activeRung === 3 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-800 shadow-sm space-y-5">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider">
                                        Rung 3 • The Board & University Exam Trap Detector
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Where 75%+ of Students Lose Marks
                                    </h2>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Examiners design questions specifically around these misconceptions. Lock them in now so you never lose marks.
                                    </p>

                                    {/* Trap List */}
                                    <div className="space-y-3.5">
                                        {(currentModule.rung3_traps?.traps || []).map((t, idx) => (
                                            <div 
                                                key={idx}
                                                className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2"
                                            >
                                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                                                    <AlertTriangle size={17} className="shrink-0" />
                                                    <span>Trap #{idx + 1}: {t.trap}</span>
                                                </div>
                                                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    <strong className="text-rose-700 dark:text-rose-300 font-bold">Why examiners deduct marks: </strong>
                                                    {t.whyStudentsLoseMarks}
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                                                    <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
                                                    <span><strong>Rule to Avoid:</strong> {t.howToAvoid}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2 flex justify-between items-center">
                                        <button
                                            onClick={() => setActiveRung(2)}
                                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                                        >
                                            ← Back to Mechanism
                                        </button>
                                        <button
                                            onClick={() => handleCompleteRung(3)}
                                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                                        >
                                            <span>Traps Understood → Unlock Final Paper Challenge</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* RUNG 4: PEN-AND-PAPER PROOF CHALLENGE                    */}
                        {/* ======================================================== */}
                        {activeRung === 4 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-800 shadow-sm space-y-5">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                                        Rung 4 • Final Pen-and-Paper Proof Problem
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {currentModule.rung4_proof?.title || 'Solve on Physical Paper'}
                                    </h2>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Take real pen and paper on your desk. Solve the problem below, then scan your notebook for official board step-marking.
                                    </p>

                                    {/* Quick Drawing Notations Cheat Sheet Button */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setShowRung4CheatSheet(prev => !prev)}
                                            className="px-3.5 py-1.5 rounded-xl border border-orange-200 dark:border-gray-700 bg-orange-50/70 hover:bg-orange-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-orange-700 dark:text-orange-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                                        >
                                            <PenTool size={13} className="text-orange-500" />
                                            <span>{showRung4CheatSheet ? 'Hide Drawing Reference' : '📋 Open Notations & Algorithm Cheat Sheet'}</span>
                                        </button>
                                    </div>

                                    {showRung4CheatSheet && (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-gray-900 border border-amber-200/80 dark:border-gray-700 space-y-3 animate-in fade-in duration-150">
                                            <div className="flex items-center justify-between pb-1 border-b border-amber-200/60 dark:border-gray-800">
                                                <div className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 tracking-wider flex items-center gap-1.5">
                                                    <Compass size={14} className="text-orange-500" />
                                                    <span>Quick Paper Sketching Reference</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400">Chen & Board Conventions</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {[
                                                    { shape: '[ Rectangle ]', label: 'Strong Entity Set', rule: 'Capital name inside' },
                                                    { shape: '[[ Double Rect ]]', label: 'Weak Entity Set', rule: 'Owner-dependent' },
                                                    { shape: '( Oval )', label: 'Simple Attribute', rule: 'Attached to entity' },
                                                    { shape: '(_Underline_)', label: 'Primary Key (PK)', rule: 'Underline required!' },
                                                    { shape: '(( Double Oval ))', label: 'Multivalued Attribute', rule: 'e.g. Phone, Skills' },
                                                    { shape: '(- - Dashed - -)', label: 'Derived Attribute', rule: 'e.g. Age from DOB' },
                                                    { shape: '< Diamond >', label: 'Relationship Set', rule: 'Active verb inside' },
                                                    { shape: '1 : N / M : N', label: 'Cardinality Ratios', rule: 'Write on line edges' },
                                                    { shape: '=== Double Line', label: 'Total Participation', rule: 'Mandatory link' },
                                                ].map((ch, idx) => (
                                                    <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs space-y-0.5">
                                                        <div className="font-mono font-black text-orange-600 dark:text-orange-400 text-[11px]">{ch.shape}</div>
                                                        <div className="text-[11px] font-bold text-slate-850 dark:text-slate-200">{ch.label}</div>
                                                        <div className="text-[9px] text-slate-500 dark:text-slate-400">{ch.rule}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* The Exam Problem */}
                                    <div className="p-5 rounded-2xl bg-orange-50/40 dark:bg-gray-800 border border-orange-200 dark:border-orange-900/50 space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                                            Realistic Exam Question ({currentModule.rung4_proof?.totalMarks || 3} Marks):
                                        </span>
                                        <div className="text-sm sm:text-base font-medium text-slate-850 dark:text-slate-100 leading-relaxed">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    table: ({ node, ...props }) => (
                                                        <div className="overflow-x-auto my-3 rounded-xl border border-orange-200 dark:border-gray-700 shadow-xs">
                                                            <table className="min-w-full text-xs divide-y divide-orange-100 dark:divide-gray-800" {...props} />
                                                        </div>
                                                    ),
                                                    th: ({ node, ...props }) => (
                                                        <th className="px-3 py-2 bg-orange-100/70 dark:bg-gray-800 text-left font-black text-slate-850 dark:text-slate-200 uppercase text-[10px] tracking-wider" {...props} />
                                                    ),
                                                    td: ({ node, ...props }) => (
                                                        <td className="px-3 py-2 border-t border-orange-100 dark:border-gray-800 text-slate-750 dark:text-slate-300 font-mono text-xs bg-white dark:bg-gray-900/60" {...props} />
                                                    ),
                                                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-black text-slate-900 dark:text-white" {...props} />,
                                                    code: ({ node, ...props }) => <code className="bg-orange-100/70 dark:bg-gray-800 px-1.5 py-0.5 rounded text-orange-700 dark:text-orange-400 font-mono text-xs font-semibold" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1.5 my-2.5 font-semibold" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5 my-2.5" {...props} />,
                                                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                                }}
                                            >
                                                {preprocessMath(currentModule.rung4_proof?.examQuestion || '')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Step-Marking Rubric Table */}
                                    <div className="space-y-2">
                                        <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Examiner Marking Rubric:
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {(currentModule.rung4_proof?.markingRubric || []).map((rubric, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs">
                                                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between mb-0.5">
                                                        <span>{rubric.step}</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">+{rubric.marks}M</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{rubric.criterion}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scan / Upload Action Card */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-teal-500/10 border border-orange-200/80 dark:border-gray-700 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50/10 border border-orange-200 dark:border-gray-700 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center">
                                            <Camera size={24} />
                                        </div>
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                            Ready to verify your handwritten solution?
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                                            Gemini 1.5 Multimodal reads your handwriting and calculates official step-marks in 2 seconds.
                                        </p>

                                        <button
                                            onClick={() => setIsScannerOpen(true)}
                                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                                        >
                                            <Camera size={16} />
                                            <span>Scan My Notebook & Award Marks</span>
                                        </button>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center">
                                        <button
                                            onClick={() => setActiveRung(3)}
                                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                                        >
                                            ← Back to Traps
                                        </button>
                                        
                                        {activeModuleIndex < modules.length - 1 ? (
                                            <button
                                                onClick={() => handleCompleteRung(4)}
                                                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                                            >
                                                <span>Topic {activeModuleIndex + 1} Mastered → Next Topic</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleCompleteRung(4)}
                                                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                                            >
                                                <span>Finish Chapter Sprint & View Victory</span>
                                                <Trophy size={14} className="text-white" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <SosDoubtModal
                isOpen={isSosOpen}
                onClose={() => setIsSosOpen(false)}
                contextTopic={currentModule.topicName || initialPlan.topic}
            />

            <HandwrittenScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                examQuestion={currentModule.rung4_proof?.examQuestion}
                markingRubric={currentModule.rung4_proof?.markingRubric}
                onGradingComplete={(res) => {
                    setRung4Evaluation(res);
                }}
            />

            <SprintVictoryModal
                isOpen={isVictoryOpen}
                onClose={() => {
                    setIsVictoryOpen(false);
                    onClose();
                }}
                workspaceId={workspaceId}
                topic={initialPlan.topic}
                durationMinutes={totalMinutes}
                rungsCompleted={totalCompletedRungs || (modules.length * 4)}
                evaluationScore={rung4Evaluation?.awardedMarks ? Math.round((rung4Evaluation.awardedMarks / (rung4Evaluation.totalPossibleMarks || 3)) * 100) : 100}
                plan={initialPlan}
                onOpenNote={onOpenNote}
            />
        </div>
    );
}
