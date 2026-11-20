import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, BookOpen, Layers, CheckCircle2, Sparkles, 
    ArrowRight, Loader2, Compass, GraduationCap, School, BrainCircuit,
    Search, CheckSquare, Square, RotateCcw, ChevronDown, ChevronRight, Zap
} from 'lucide-react';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';

export default function LaserScopeModal({ 
    isOpen, 
    onClose, 
    workspace, 
    onStartSprint 
}) {
    const [selectedSourceId, setSelectedSourceId] = useState('');
    const [isLoadingOutline, setIsLoadingOutline] = useState(false);
    const [bookOutline, setBookOutline] = useState(null);
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [expandedChapters, setExpandedChapters] = useState({});
    const [customTopic, setCustomTopic] = useState('');
    const [chapterSearch, setChapterSearch] = useState('');
    const [targetPersona, setTargetPersona] = useState('boards'); // 'kids', 'boards', 'college', 'general'
    const [durationMinutes, setDurationMinutes] = useState(25);

    // Filter available uploaded PDF/document sources
    const docSources = useMemo(() => {
        return (workspace?.sources || []).filter(s => 
            ['PDF', 'DOCX', 'PPTX', 'TXT', 'MARKDOWN'].includes((s.type || '').toUpperCase())
        );
    }, [workspace?.sources]);

    useEffect(() => {
        if (docSources.length > 0 && (!selectedSourceId || !docSources.some(s => String(s.id) === String(selectedSourceId)))) {
            setSelectedSourceId(docSources[0].id);
        }
    }, [docSources, selectedSourceId]);

    // When source changes, fetch table of contents with complete metadata
    useEffect(() => {
        if (!selectedSourceId || !workspace?.id) {
            setBookOutline(null);
            return;
        }

        const selectedSourceObj = docSources.find(s => String(s.id) === String(selectedSourceId));

        const fetchOutline = async () => {
            setIsLoadingOutline(true);
            try {
                const res = await socialApi.post(`/workspaces/${workspace.id}/flowpilot/outline`, {
                    sourceId: selectedSourceId,
                    sourceName: selectedSourceObj?.name || '',
                    fileUrl: selectedSourceObj?.fileUrl || '',
                    workspaceName: workspace?.name || ''
                });
                if (res.data?.success && res.data?.hasOutline && res.data?.chapters?.length > 0) {
                    setBookOutline(res.data);
                    // Expand the first chapter by default
                    if (res.data.chapters[0]?.title) {
                        setExpandedChapters({ [res.data.chapters[0].title]: true });
                    }
                } else {
                    setBookOutline(null);
                }
            } catch (err) {
                console.warn('[LaserScopeModal] Could not parse outline:', err.message);
                setBookOutline(null);
            } finally {
                setIsLoadingOutline(false);
            }
        };

        fetchOutline();
    }, [selectedSourceId, workspace?.id, docSources, workspace?.name]);

    const toggleExpandChapter = (chapterTitle) => {
        setExpandedChapters(prev => ({
            ...prev,
            [chapterTitle]: !prev[chapterTitle]
        }));
    };

    // Toggle entire chapter & all its topics
    const handleToggleChapter = (chapter) => {
        const chapterTitle = chapter.title;
        const chapterTopics = chapter.topics || [];
        const isChapterSelected = selectedChapters.includes(chapterTitle);

        if (isChapterSelected) {
            setSelectedChapters(selectedChapters.filter(c => c !== chapterTitle));
            // Also remove its topics
            setSelectedTopics(selectedTopics.filter(t => !chapterTopics.includes(t)));
        } else {
            setSelectedChapters([...selectedChapters, chapterTitle]);
            // Also add all its topics
            const newTopics = Array.from(new Set([...selectedTopics, ...chapterTopics]));
            setSelectedTopics(newTopics);
        }
    };

    // Toggle an individual topic
    const handleToggleTopic = (topicName, chapterTitle) => {
        if (selectedTopics.includes(topicName)) {
            const nextTopics = selectedTopics.filter(t => t !== topicName);
            setSelectedTopics(nextTopics);
        } else {
            const nextTopics = [...selectedTopics, topicName];
            setSelectedTopics(nextTopics);
            // Ensure the parent chapter is selected as well
            if (!selectedChapters.includes(chapterTitle)) {
                setSelectedChapters([...selectedChapters, chapterTitle]);
            }
        }
    };

    // Quick single-topic laser focus sprint
    const handleQuickFocusTopic = (topicName, chapterTitle) => {
        setSelectedTopics([topicName]);
        setSelectedChapters([chapterTitle]);
        setCustomTopic(topicName);
        toast.success(`Targeted: ${topicName}`, { icon: '🎯' });
    };

    const handleSelectAllChapters = () => {
        if (!bookOutline?.chapters) return;
        const allTitles = bookOutline.chapters.map(c => c.title);
        const allTopics = bookOutline.chapters.flatMap(c => c.topics || []);
        setSelectedChapters(allTitles);
        setSelectedTopics(allTopics);
    };

    const handleClearSelectedChapters = () => {
        setSelectedChapters([]);
        setSelectedTopics([]);
    };

    // Filter chapters and their subtopics based on user search query
    const filteredChapters = useMemo(() => {
        if (!bookOutline?.chapters) return [];
        if (!chapterSearch.trim()) return bookOutline.chapters;
        const query = chapterSearch.toLowerCase();
        return bookOutline.chapters.filter(ch => {
            const matchesTitle = ch.title && ch.title.toLowerCase().includes(query);
            const matchesDesc = ch.description && ch.description.toLowerCase().includes(query);
            const matchesTopic = (ch.topics || []).some(t => t.toLowerCase().includes(query));
            return matchesTitle || matchesDesc || matchesTopic;
        });
    }, [bookOutline?.chapters, chapterSearch]);

    // Automatically expand chapters matching the search
    useEffect(() => {
        if (chapterSearch.trim() && filteredChapters.length > 0) {
            const autoExpanded = {};
            filteredChapters.forEach(ch => {
                autoExpanded[ch.title] = true;
            });
            setExpandedChapters(autoExpanded);
        }
    }, [chapterSearch, filteredChapters]);

    const handleStart = () => {
        const selectedSourceObj = docSources.find(s => String(s.id) === String(selectedSourceId));
        const cleanSourceName = selectedSourceObj?.name?.replace(/\.[^/.]+$/, '')?.replace(/[-_]/g, ' ') || '';
        
        let resolvedTopic = customTopic.trim();
        if (!resolvedTopic) {
            if (selectedTopics.length === 1) {
                resolvedTopic = selectedTopics[0];
            } else if (selectedTopics.length > 1) {
                resolvedTopic = selectedTopics.slice(0, 3).join(' • ');
            } else if (selectedChapters.length > 0) {
                resolvedTopic = selectedChapters.join(', ');
            } else if (cleanSourceName) {
                resolvedTopic = cleanSourceName;
            } else if (workspace?.name && workspace.name.toLowerCase() !== 'new') {
                resolvedTopic = workspace.name;
            } else {
                resolvedTopic = 'Physics & Science Derivations';
            }
        }

        onStartSprint({
            topic: resolvedTopic,
            selectedChapters,
            selectedTopics,
            sourceId: selectedSourceId ? parseInt(selectedSourceId) : null,
            sourceName: selectedSourceObj?.name || '',
            workspaceName: workspace?.name || '',
            targetPersona,
            duration: durationMinutes
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl border border-orange-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header Banner */}
                <div className="relative p-5 sm:p-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-1.5">
                            <Sparkles size={13} className="text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
                            LearnProof FlowPilot™
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Configure Your Deep Study Sprint</h2>
                        <p className="text-xs sm:text-sm text-orange-100 mt-0.5">
                            Select specific chapters & topics to master. Zero fluff, 100% active retention.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-sm">
                    {/* 1. Target Persona Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                            Select Your Academic Goal & Persona:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                                { id: 'boards', label: 'Board Prep', desc: '10th/12th CBSE/ICSE', icon: School },
                                { id: 'college', label: 'College / Exam', desc: 'Engg, Med, CA, UPSC', icon: GraduationCap },
                                { id: 'kids', label: 'Explorer', desc: 'School Kids (Grades 1-8)', icon: Compass },
                                { id: 'general', label: 'Self-Learner', desc: 'Skills & Deep Focus', icon: BrainCircuit }
                            ].map(persona => {
                                const Icon = persona.icon;
                                const isSelected = targetPersona === persona.id;
                                return (
                                    <button
                                        key={persona.id}
                                        type="button"
                                        onClick={() => setTargetPersona(persona.id)}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/40 font-bold shadow-sm' 
                                                : 'border-slate-200 dark:border-gray-800 hover:border-orange-200 dark:hover:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 text-slate-750 dark:text-slate-300'
                                        }`}
                                    >
                                        <Icon size={18} className={`mb-1.5 ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`} />
                                        <div className="font-bold text-xs truncate">{persona.label}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{persona.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Topic Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Topic or Concept to Master:
                            </label>
                            {selectedTopics.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCustomTopic(selectedTopics.join(' • '))}
                                    className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                                >
                                    Use {selectedTopics.length} Selected Topic{selectedTopics.length > 1 ? 's' : ''}
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="e.g. Joins, Normalization BCNF, Relational Algebra, B+ Trees..."
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                        />
                    </div>

                    {/* 3. Laser Scope: Select from Uploaded Book */}
                    {docSources.length > 0 && (
                        <div className="p-4 sm:p-5 rounded-2xl border border-orange-100 dark:border-gray-800 bg-orange-50/40 dark:bg-gray-800/50 space-y-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={17} className="text-orange-500 shrink-0" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                        Laser Scope: Choose Textbook Reference
                                    </span>
                                </div>
                                <select
                                    value={selectedSourceId}
                                    onChange={(e) => setSelectedSourceId(e.target.value)}
                                    className="text-xs bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-1.5 font-medium cursor-pointer max-w-full truncate shadow-sm"
                                >
                                    {docSources.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {isLoadingOutline ? (
                                <div className="py-8 text-center text-xs text-slate-600 dark:text-slate-300 flex flex-col items-center justify-center gap-2">
                                    <Loader2 size={20} className="animate-spin text-orange-500" />
                                    <span className="font-semibold">Extracting chapters and granular topic breakdown...</span>
                                    <span className="text-[11px] text-slate-400">Indexing concepts, formulas, and page breakdown</span>
                                </div>
                            ) : bookOutline?.chapters?.length > 0 ? (
                                <div className="space-y-2.5">
                                    {/* Outline Controls Header */}
                                    <div className="flex items-center justify-between text-xs pt-1">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 flex-wrap">
                                            <span>Chapters & Granular Topics</span>
                                            <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold text-[10px]">
                                                {selectedTopics.length > 0 
                                                    ? `${selectedTopics.length} Topic${selectedTopics.length > 1 ? 's' : ''} Selected` 
                                                    : selectedChapters.length > 0 
                                                        ? `${selectedChapters.length} Chapter${selectedChapters.length > 1 ? 's' : ''} Selected` 
                                                        : `${bookOutline.chapters.length} Chapters Available`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSelectAllChapters}
                                                className="text-[11px] text-orange-600 dark:text-orange-400 hover:text-orange-700 font-bold cursor-pointer"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-slate-300 dark:text-gray-700">|</span>
                                            <button
                                                type="button"
                                                onClick={handleClearSelectedChapters}
                                                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fast Chapter & Topic Filter Search Bar */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={chapterSearch}
                                            onChange={(e) => setChapterSearch(e.target.value)}
                                            placeholder="Search chapters or individual topics (e.g. Joins, BCNF, B+ Trees)..."
                                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                        {chapterSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setChapterSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Scrollable Chapters and Topics List */}
                                    <div className="space-y-2.5 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                                        {filteredChapters.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-slate-400">
                                                No chapters or topics match "{chapterSearch}".
                                            </div>
                                        ) : (
                                            filteredChapters.map((ch, idx) => {
                                                const isChapterChecked = selectedChapters.includes(ch.title);
                                                const isExpanded = !!expandedChapters[ch.title];
                                                const topics = ch.topics || [];
                                                const selectedTopicsInChapter = topics.filter(t => selectedTopics.includes(t));

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`rounded-2xl border transition-all overflow-hidden ${
                                                            isChapterChecked || selectedTopicsInChapter.length > 0
                                                                ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                                                                : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 hover:border-orange-200 dark:hover:border-gray-700'
                                                        }`}
                                                    >
                                                        {/* Chapter Accordion Header */}
                                                        <div className="p-3 flex items-center justify-between gap-2.5">
                                                            <div 
                                                                onClick={() => toggleExpandChapter(ch.title)}
                                                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                                >
                                                                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                                                </button>
                                                                <div className="truncate">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                                                            {ch.title}
                                                                        </span>
                                                                        {ch.pages && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100/70 dark:bg-gray-800 text-orange-800 dark:text-orange-300 font-medium">
                                                                                {ch.pages}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                            {topics.length} topic{topics.length > 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Chapter Select Checkbox */}
                                                            <div 
                                                                onClick={() => handleToggleChapter(ch)}
                                                                className="flex items-center gap-1.5 cursor-pointer pl-2 border-l border-slate-200 dark:border-gray-700"
                                                            >
                                                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                                                                    All Topics
                                                                </span>
                                                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                                                    isChapterChecked 
                                                                        ? 'bg-orange-500 border-orange-500 text-white' 
                                                                        : 'border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                                }`}>
                                                                    {isChapterChecked && <CheckCircle2 size={12} />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expandable Sub-topics List */}
                                                        {isExpanded && topics.length > 0 && (
                                                            <div className="px-3 pb-3 pt-1 border-t border-orange-100/60 dark:border-gray-800/80 bg-orange-50/30 dark:bg-black/20 space-y-1.5">
                                                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 pl-1 pt-1">
                                                                    Select Specific Topic(s) for this Sprint:
                                                                </div>
                                                                {topics.map((topic, tIdx) => {
                                                                    const isTopicChecked = selectedTopics.includes(topic);
                                                                    return (
                                                                        <div
                                                                            key={tIdx}
                                                                            className={`p-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                                                                                isTopicChecked
                                                                                    ? 'bg-orange-100/80 dark:bg-orange-950/60 border-orange-400 text-orange-950 dark:text-orange-200 font-semibold shadow-xs'
                                                                                    : 'bg-white/80 dark:bg-gray-900/60 border-slate-200/80 dark:border-gray-800 hover:border-orange-300 text-slate-700 dark:text-slate-300'
                                                                            }`}
                                                                        >
                                                                            <div 
                                                                                onClick={() => handleToggleTopic(topic, ch.title)}
                                                                                className="flex items-center gap-2 flex-1 cursor-pointer pr-2"
                                                                            >
                                                                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                                                                                    isTopicChecked 
                                                                                        ? 'bg-orange-500 border-orange-500 text-white' 
                                                                                        : 'border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                                                }`}>
                                                                                    {isTopicChecked && <CheckCircle2 size={10} />}
                                                                                </div>
                                                                                <span className="leading-snug">{topic}</span>
                                                                            </div>

                                                                            {/* Target Single Topic Quick Button */}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleQuickFocusTopic(topic, ch.title)}
                                                                                className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 bg-orange-100/60 dark:bg-orange-950/40 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800 shrink-0 flex items-center gap-1 cursor-pointer"
                                                                                title="Focus solely on this single topic in this sprint"
                                                                            >
                                                                                <Zap size={10} />
                                                                                <span>Solo Sprint</span>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Pedagogical sprint tip */}
                                    <div className="p-2.5 rounded-xl bg-orange-100/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                        <Zap size={14} className="text-orange-600 dark:text-orange-400 shrink-0" />
                                        <span>
                                            <strong>Mastery Tip:</strong> Select 1–3 specific topics for a targeted 25-minute sprint, or select an entire chapter to study through sequential topic modules.
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Selected document will be grounded as the primary textbook reference.
                                </p>
                            )}
                        </div>
                    )}

                    {/* 4. Sprint Duration */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                            Deep Focus Sprint Length:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { min: 15, label: '15 Mins', sub: 'Quick Micro-Sprint' },
                                { min: 25, label: '25 Mins', sub: 'Standard Pomodoro' },
                                { min: 45, label: '45 Mins', sub: 'Deep Exam Mastery' }
                            ].map(item => (
                                <button
                                    key={item.min}
                                    type="button"
                                    onClick={() => setDurationMinutes(item.min)}
                                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                                        durationMinutes === item.min
                                            ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold ring-2 ring-orange-500/30'
                                            : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:border-orange-200'
                                    }`}
                                >
                                    <div className="font-bold text-xs">{item.label}</div>
                                    <div className="text-[10px] opacity-75">{item.sub}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleStart}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all transform active:scale-95 cursor-pointer"
                    >
                        <span>Start Flow Study Sprint</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
