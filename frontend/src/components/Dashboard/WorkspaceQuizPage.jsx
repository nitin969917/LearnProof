import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Play, HelpCircle, Loader2, BookOpen, Clock, 
    Calendar, CheckCircle2, XCircle, Award, Sparkles, RefreshCw,
    ChevronRight, FileText, Check, AlertCircle, Brain, Cpu, ShieldAlert
} from 'lucide-react';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';

const TOPIC_CONFIGS = [
    { 
        color: "indigo", 
        border: "border-indigo-200 dark:border-indigo-900/50",
        text: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
        accent: "indigo",
        badge: "Foundation"
    },
    { 
        color: "emerald", 
        border: "border-emerald-200 dark:border-emerald-900/50",
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
        accent: "emerald",
        badge: "Methodology"
    },
    { 
        color: "rose", 
        border: "border-rose-200 dark:border-rose-900/50",
        text: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50/50 dark:bg-rose-950/20",
        accent: "rose",
        badge: "Applications"
    },
    { 
        color: "amber", 
        border: "border-amber-200 dark:border-amber-900/50",
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50/50 dark:bg-amber-950/20",
        accent: "amber",
        badge: "Ethics & Design"
    },
    { 
        color: "sky", 
        border: "border-sky-200 dark:border-sky-900/50",
        text: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50/50 dark:bg-sky-950/20",
        accent: "sky",
        badge: "Supplemental"
    }
];

export default function WorkspaceQuizPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    // Data states
    const [workspace, setWorkspace] = useState(null);
    const [knowledgeMap, setKnowledgeMap] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [sources, setSources] = useState([]);
    
    // Loading states
    const [loadingData, setLoadingData] = useState(true);
    const [isGeneratingMap, setIsGeneratingMap] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    // Custom Quiz Parameters
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionCount, setQuestionCount] = useState(5);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);

    // Active Quiz states
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [activeTopic, setActiveTopic] = useState(0); // Default to first node

    // Load workspace data, quizzes, and knowledge map
    const loadAllData = async () => {
        setLoadingData(true);
        try {
            const wsRes = await socialApi.get(`/workspaces/${subjectId}`);
            setWorkspace(wsRes.data.workspace);
            setQuizzes(wsRes.data.workspace.quizzes || []);
            setSources(wsRes.data.workspace.sources || []);
            
            // Fetch knowledge map
            const mapRes = await socialApi.get(`/workspaces/${subjectId}/knowledge-map`);
            const mapData = mapRes.data.knowledgeMap || [];
            setKnowledgeMap(mapData);
            if (mapData.length > 0) {
                setActiveTopic(0);
            }
        } catch (err) {
            console.error('Failed to load workspace quiz details:', err);
            toast.error('Failed to load quiz dashboard data');
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (subjectId) {
            loadAllData();
        }
    }, [subjectId]);

    // Node selector wrapper
    const handleSelectNode = (idx) => {
        setActiveTopic(idx);
        setSelectedSubtopic(null); // Clear selected subtopic when swapping main nodes
    };

    // Icon helper for learning nodes
    const getTopicIcon = (index) => {
        switch (index) {
            case 0: return <Brain size={18} />;
            case 1: return <Cpu size={18} />;
            case 2: return <ShieldAlert size={18} />;
            case 3: return <BookOpen size={18} />;
            default: return <Sparkles size={18} />;
        }
    };

    // Generate Knowledge Map (Gemini 4-5 topics)
    const handleGenerateKnowledgeMap = async () => {
        if (sources.length === 0) {
            toast.error('Please upload study files in the workspace first!');
            return;
        }
        setIsGeneratingMap(true);
        const toastId = toast.loading("Analyzing files to create a structured Knowledge Map...");
        try {
            const response = await socialApi.post(`/workspaces/${subjectId}/knowledge-map/generate`);
            const mapData = response.data.knowledgeMap || [];
            setKnowledgeMap(mapData);
            if (mapData.length > 0) {
                setActiveTopic(0);
            }
            toast.success("Knowledge Map generated successfully!", { id: toastId });
        } catch (err) {
            console.error("Failed to generate knowledge map:", err);
            toast.error("Failed to extract map concepts. Make sure files are parsed.", { id: toastId });
        } finally {
            setIsGeneratingMap(false);
        }
    };

    // Generate custom topic/subtopic quiz
    const handleGenerateTopicQuiz = async () => {
        if (sources.length === 0) {
            toast.error('Upload documents first to generate a quiz!');
            return;
        }
        if (!selectedTopicData) return;
        
        // Target specifically selected subtopic OR fall back to the main topic
        const targetSubject = selectedSubtopic ? selectedSubtopic : selectedTopicData.topic;
        
        setIsGeneratingQuiz(true);
        const id = toast.loading(`Assembling quiz on "${targetSubject}" (${difficulty})...`);
        try {
            const res = await socialApi.post(`/workspaces/${subjectId}/tools/quiz`, { 
                count: questionCount, 
                format: 'MCQ',
                topic: targetSubject,
                difficulty: difficulty
            });
            toast.success('Quiz generated successfully!', { id });

            // Reload quizzes list and automatically start the newly created quiz
            const details = await socialApi.get(`/workspaces/${subjectId}`);
            const updatedQuizzes = details.data.workspace.quizzes || [];
            setQuizzes(updatedQuizzes);
            
            const newQuiz = updatedQuizzes.find(q => q.id === res.data.quizId);
            if (newQuiz) {
                handleStartQuiz(newQuiz);
            }
        } catch (err) {
            console.error('Quiz generation error:', err);
            toast.error(err.response?.data?.error || 'Failed to generate quiz.', { id });
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    // General Quiz Generation (No Topic)
    const handleGenerateGeneralQuiz = async () => {
        if (sources.length === 0) {
            toast.error('Upload documents first to generate a quiz!');
            return;
        }
        setIsGeneratingQuiz(true);
        const id = toast.loading(`Assembling general interactive quiz (${difficulty})...`);
        try {
            const res = await socialApi.post(`/workspaces/${subjectId}/tools/quiz`, { 
                count: questionCount, 
                format: 'MCQ',
                difficulty: difficulty
            });
            toast.success('General quiz generated!', { id });
            
            const details = await socialApi.get(`/workspaces/${subjectId}`);
            const updatedQuizzes = details.data.workspace.quizzes || [];
            setQuizzes(updatedQuizzes);

            const newQuiz = updatedQuizzes.find(q => q.id === res.data.quizId);
            if (newQuiz) {
                handleStartQuiz(newQuiz);
            }
        } catch (err) {
            console.error('Quiz generation error:', err);
            toast.error('Failed to generate quiz.', { id });
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleStartQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setQuizAnswers({});
        setQuizResult(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleQuizOptionSelect = (qIdx, optionIdx) => {
        setQuizAnswers(prev => ({
            ...prev,
            [qIdx]: optionIdx
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!activeQuiz) return;
        const questions = typeof activeQuiz.questions === 'string' 
            ? JSON.parse(activeQuiz.questions) 
            : (activeQuiz.questions || []);
        
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (quizAnswers[idx] === q.correctAnswer || quizAnswers[idx] === q.answer) {
                correctCount++;
            }
        });

        const score = (correctCount / questions.length) * 100;
        setQuizResult({
            score,
            correctCount,
            total: questions.length
        });
        toast.success(`Quiz Completed! Score: ${correctCount}/${questions.length}`);

        try {
            await socialApi.post(`/workspaces/${subjectId}/quizzes/${activeQuiz.id}/attempts`, {
                score,
                answers: quizAnswers
            });
            // Refresh workspace quizzes list to show the new attempt
            const details = await socialApi.get(`/workspaces/${subjectId}`);
            setQuizzes(details.data.workspace.quizzes || []);
        } catch (err) {
            console.error('Failed to submit quiz attempt:', err);
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
                <Loader2 className="animate-spin text-orange-500 mr-2" size={24} />
                <span className="font-semibold text-sm">Loading Quiz Dashboard...</span>
            </div>
        );
    }

    const selectedTopicData = knowledgeMap[activeTopic] || null;
    const selectedConfig = TOPIC_CONFIGS[activeTopic % TOPIC_CONFIGS.length];

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8 space-y-6 flex flex-col">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-gray-855 pb-5 shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(`/dashboard/ask-my-notes-dev/${subjectId}`)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-gray-800 rounded-xl transition-all"
                        title="Back to Workspace"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span>{workspace?.name || 'Subject'} Quiz Arena</span>
                            <Sparkles className="text-orange-500 animate-pulse" size={18} />
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">Master topics and review persistent history records</p>
                    </div>
                </div>

                {!activeQuiz && sources.length > 0 && (
                    <button
                        onClick={handleGenerateGeneralQuiz}
                        disabled={isGeneratingQuiz}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                        {isGeneratingQuiz ? <Loader2 size={14} className="animate-spin" /> : <Play size={12} className="fill-current" />}
                        Generate General Quiz
                    </button>
                )}
            </div>

            {/* Main Interactive Workspace Area */}
            {activeQuiz ? (
                // Dedicated full screen quiz interface
                <div className="max-w-3xl mx-auto w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-gray-800">
                        <button
                            onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft size={16} /> Exit Quiz Session
                        </button>
                        <span className="text-[10px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full uppercase tracking-wider">
                            Active Test Panel
                        </span>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">{activeQuiz.title}</h2>
                        
                        {/* Questions list */}
                        {(() => {
                            const questions = typeof activeQuiz.questions === 'string'
                                ? JSON.parse(activeQuiz.questions)
                                : (activeQuiz.questions || []);

                            return (
                                <div className="space-y-6">
                                    {questions.map((q, qIdx) => (
                                        <div key={qIdx} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-gray-800/80 p-5 rounded-2xl space-y-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                                {qIdx + 1}. {q.questionText || q.question || q.text}
                                            </p>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {(q.options || q.choices || []).map((opt, oIdx) => {
                                                    const isSelected = quizAnswers[qIdx] === oIdx;
                                                    const isCorrect = (q.correctOption !== undefined ? q.correctOption === oIdx : (q.correctAnswer === oIdx || q.answer === oIdx));
                                                    const showResults = quizResult !== null;

                                                    let optionStyle = "border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-350 hover:border-orange-200";
                                                    if (showResults) {
                                                        if (isCorrect) {
                                                            optionStyle = "border-green-300 dark:border-green-950 bg-green-500/10 text-green-700 dark:text-green-400 font-bold";
                                                        } else if (isSelected) {
                                                            optionStyle = "border-red-300 dark:border-red-950 bg-red-500/10 text-red-700 dark:text-red-400";
                                                        }
                                                    } else if (isSelected) {
                                                        optionStyle = "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold";
                                                    }

                                                    return (
                                                        <button
                                                            key={oIdx}
                                                            disabled={showResults}
                                                            onClick={() => handleQuizOptionSelect(qIdx, oIdx)}
                                                            className={`w-full text-left p-3.5 border rounded-xl text-xs transition-all flex items-center justify-between shadow-sm ${optionStyle}`}
                                                        >
                                                            <span>{opt}</span>
                                                            {showResults && isCorrect && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
                                                            {showResults && isSelected && !isCorrect && <XCircle size={14} className="text-red-500 shrink-0" />}
                                                            {!showResults && isSelected && <Check size={14} className="text-orange-500 shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {quizResult && q.explanation && (
                                                <div className="bg-orange-500/5 border border-dashed border-orange-200 dark:border-orange-950/50 p-3.5 rounded-xl text-slate-500 dark:text-slate-400 space-y-1">
                                                    <p className="text-[10px] font-black text-orange-500 flex items-center gap-1 uppercase tracking-wider">
                                                        <AlertCircle size={10} /> Explanation
                                                    </p>
                                                    <p className="text-xs leading-relaxed">{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {!quizResult ? (
                                        <button
                                            onClick={handleSubmitQuiz}
                                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all"
                                        >
                                            Submit Answers
                                        </button>
                                    ) : (
                                        <div className="bg-orange-500/5 border border-orange-200 dark:border-orange-950 p-6 rounded-3xl text-center space-y-4 shadow-sm">
                                            <Award className="text-orange-500 mx-auto animate-bounce" size={40} />
                                            <div>
                                                <p className="text-xs font-black text-slate-450 uppercase tracking-wider">Session Score</p>
                                                <p className="text-4xl font-black text-orange-500 mt-1">{quizResult.score.toFixed(0)}%</p>
                                                <p className="text-xs text-slate-500 mt-1">({quizResult.correctCount} correct out of {quizResult.total} questions)</p>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                                                {quizResult.score === 100 
                                                    ? "Magnificent! You scored 100% and mastered this concept theme perfectly!"
                                                    : "Great effort! Review the question explanations above to learn and correct mistakes."}
                                            </p>
                                            <button
                                                onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                                                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                            >
                                                Return to Quiz Arena
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            ) : (
                // Full Dashboard with Knowledge Map & Quizzes
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
                    
                    {/* Left: Dedicated Interactive Graphical Roadmap Map (spans 7 cols) */}
                    <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-3 shrink-0">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                                <BookOpen size={16} className="text-orange-500" />
                                Concept Map & Learning Roadmap
                            </h3>
                            {knowledgeMap.length > 0 && (
                                <button
                                    onClick={handleGenerateKnowledgeMap}
                                    disabled={isGeneratingMap}
                                    className="text-[10px] font-bold text-orange-500 hover:underline uppercase flex items-center gap-1 disabled:opacity-50"
                                >
                                    <RefreshCw size={10} className={isGeneratingMap ? 'animate-spin' : ''} />
                                    Regenerate Map
                                </button>
                            )}
                        </div>

                        {knowledgeMap.length === 0 ? (
                            <div className="text-center py-12 px-4 space-y-4 max-w-md mx-auto my-auto flex-1 flex flex-col justify-center">
                                <Sparkles className="text-orange-355 dark:text-gray-700 mx-auto animate-pulse" size={52} />
                                <div>
                                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">Build Mapped Subject Path</h4>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        Analyze study materials to build a structured interactive roadmap representing 4-5 major subjects, key themes, and subtopics across the content.
                                    </p>
                                </div>
                                <button
                                    onClick={handleGenerateKnowledgeMap}
                                    disabled={isGeneratingMap || sources.length === 0}
                                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    {isGeneratingMap ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                                    Analyze & Map Out Concepts
                                </button>
                                {sources.length === 0 && (
                                    <p className="text-[10px] text-red-500 bg-red-500/5 p-2 rounded-lg">
                                        Upload a source document or PDF in the workspace first to build the map!
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1">
                                
                                {/* Mapped Node Path Grid Column (Duolingo style vertical node list with lines) */}
                                <div className="md:col-span-5 flex flex-col justify-around py-4 relative border-r border-slate-100 dark:border-gray-800 pr-2 select-none">
                                    
                                    {/* Visual Connecting Vertical Line */}
                                    <div className="absolute top-10 bottom-10 left-[26px] border-l-2 border-dashed border-slate-200 dark:border-gray-800 z-0"></div>

                                    {knowledgeMap.map((item, idx) => {
                                        const isSelected = activeTopic === idx;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => handleSelectNode(idx)}
                                                className="flex items-center gap-4 cursor-pointer relative z-10 py-2 group"
                                            >
                                                {/* Node Circle */}
                                                <div 
                                                    className={`w-[54px] h-[54px] rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                                        isSelected 
                                                            ? `border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 scale-110 shadow-lg shadow-orange-500/15` 
                                                            : `border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 group-hover:border-slate-350`
                                                    }`}
                                                >
                                                    {getTopicIcon(idx)}
                                                </div>

                                                {/* Node Text */}
                                                <div className="flex-1 min-w-0 pr-1.5">
                                                    <p className={`text-[10px] font-black uppercase tracking-wider ${
                                                        isSelected ? 'text-orange-500' : 'text-slate-405'
                                                    }`}>
                                                        Node #{idx + 1}
                                                    </p>
                                                    <h5 className={`text-xs font-bold truncate ${
                                                        isSelected ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        {item.topic}
                                                    </h5>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Active Selected Detail Card Panel */}
                                <div className="md:col-span-7 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-gray-850 rounded-2xl p-5 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${selectedConfig.border} ${selectedConfig.text} ${selectedConfig.bg}`}>
                                                {selectedConfig.badge}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {selectedTopicData?.subtopics?.length || 0} Sub-Concepts
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-base font-black text-slate-800 dark:text-white">
                                                {selectedTopicData?.topic}
                                            </h4>
                                            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pt-1">
                                                {selectedTopicData?.description}
                                            </p>
                                        </div>

                                        {selectedTopicData?.subtopics && selectedTopicData.subtopics.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Select Mapped Subtopic (Optional)
                                                </p>
                                                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                                    {selectedTopicData.subtopics.map((sub, sIdx) => {
                                                        const isSubSelected = selectedSubtopic === sub;
                                                        return (
                                                            <button 
                                                                key={sIdx}
                                                                onClick={() => setSelectedSubtopic(isSubSelected ? null : sub)}
                                                                className={`text-[9px] px-2.5 py-1 border rounded-lg shadow-sm transition-all flex items-center gap-1 ${
                                                                    isSubSelected 
                                                                        ? `border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold` 
                                                                        : `bg-white dark:bg-gray-900 border-slate-200/50 dark:border-gray-800 text-slate-650 dark:text-slate-400 hover:border-slate-350`
                                                                }`}
                                                            >
                                                                {isSubSelected && <Check size={8} />}
                                                                {sub}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quiz Parameters Settings Panel */}
                                        <div className="bg-white dark:bg-gray-900/50 p-4 border border-slate-100 dark:border-gray-850 rounded-xl space-y-3.5 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                Quiz Parameters
                                            </p>
                                            <div className="grid grid-cols-2 gap-3.5">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 block">Difficulty</label>
                                                    <select 
                                                        value={difficulty} 
                                                        onChange={(e) => setDifficulty(e.target.value)}
                                                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-gray-800 rounded-lg p-2 text-slate-700 dark:text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="Easy">Easy</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="Hard">Hard</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 block">Questions</label>
                                                    <select 
                                                        value={questionCount} 
                                                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-gray-800 rounded-lg p-2 text-slate-700 dark:text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="3">3 Questions</option>
                                                        <option value="5">5 Questions</option>
                                                        <option value="8">8 Questions</option>
                                                        <option value="10">10 Questions</option>
                                                        <option value="15">15 Questions</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerateTopicQuiz}
                                        disabled={isGeneratingQuiz}
                                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        {isGeneratingQuiz ? <Loader2 size={14} className="animate-spin" /> : <Play size={12} className="fill-current" />}
                                        {selectedSubtopic 
                                            ? `Quiz Me on "${selectedSubtopic}" (${difficulty})` 
                                            : `Quiz Me on Node #${activeTopic + 1} (${difficulty})`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Generated Quizzes & Attempts History (spans 5 cols) */}
                    <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-805 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                        <div className="border-b border-slate-100 dark:border-gray-800 pb-3 shrink-0">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                                <Clock size={16} className="text-orange-500" />
                                Mapped Quizzes & Attempts ({quizzes.length})
                            </h3>
                        </div>

                        {quizzes.length === 0 ? (
                            <div className="text-center py-12 px-4 text-slate-400 my-auto flex-1 flex flex-col justify-center">
                                <FileText size={44} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No quizzes generated yet. Use the Concept Map nodes on the left to start learning!</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 max-h-[500px]">
                                {quizzes.map((q) => {
                                    const questions = typeof q.questions === 'string' ? JSON.parse(q.questions) : (q.questions || []);
                                    const attempts = q.attempts || [];

                                    return (
                                        <div 
                                            key={q.id}
                                            className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-gray-855 rounded-2xl space-y-3"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{q.title}</h4>
                                                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                                                        {questions.length} Quiz Questions
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleStartQuiz(q)}
                                                    className="w-7 h-7 bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-500 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm border border-orange-500/5"
                                                    title="Start Quiz"
                                                >
                                                    <Play size={10} className="fill-current ml-0.5" />
                                                </button>
                                            </div>

                                            {/* Attempt logs list */}
                                            {attempts.length > 0 ? (
                                                <div className="pt-2 border-t border-slate-200/50 dark:border-gray-800/80 space-y-1.5">
                                                    <p className="text-[9px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest">
                                                        Attempt Submission logs
                                                    </p>
                                                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-0.5">
                                                        {attempts.map((att, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-[10px] text-slate-500">
                                                                <span className="font-semibold text-slate-650 dark:text-slate-400 flex items-center gap-1">
                                                                    <Award size={10} className="text-orange-500/80" />
                                                                    Attempt #{attempts.length - idx}: {att.score.toFixed(0)}%
                                                                </span>
                                                                <span className="text-slate-450">
                                                                    {new Date(att.attemptedAt).toLocaleDateString(undefined, { 
                                                                        month: 'short', 
                                                                        day: 'numeric' 
                                                                    })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pt-2 border-t border-slate-200/40 dark:border-gray-800/40 text-[9px] text-slate-400 italic">
                                                    No answers submitted yet.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
