import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Play, CheckCircle, Circle, ArrowLeft, Clock, Sparkles, BookOpen, AlertCircle, X, Trophy, Lock, Award, ChevronLeft, ChevronRight, Video, Library } from 'lucide-react';

const Quiz = () => {
    const [token] = useState(useAuth().token); // Use token from context
    const { token: authToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const [videos, setVideos] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedHistoryQuiz, setSelectedHistoryQuiz] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(300); // 5 min
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const playlistScrollRef = useRef(null);

    const scroll = (direction) => {
        if (playlistScrollRef.current) {
            const { scrollLeft, clientWidth } = playlistScrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            playlistScrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        if (!authToken) return;

        const fetchQuizTargets = async () => {
            setLoading(true);
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-list/`, { idToken: authToken });
                setVideos(res.data.videos || []);
                setPlaylists(res.data.playlists || []);

                const historyRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-history/?idToken=${authToken}`);
                setHistory((historyRes.data || []).filter(q => q.score !== null));
            } catch (err) {
                console.error(err);
                toast.error("Failed to load quiz options");
            } finally {
                setLoading(false);
            }
        };

        fetchQuizTargets();
    }, [authToken]);

    useEffect(() => {
        if (!quizData) return;

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // auto-submit when time runs out
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quizData]);

    const handleStartQuiz = async (type, id) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/start-quiz/`, {
                idToken: authToken,
                contentType: type,
                contentId: id,
            });
            toast.dismiss();
            setQuizData(res.data.quiz);
            setAnswers({});
            setTimeLeft(res.data.quiz.time_limit * 60); 
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                toast.error(err.response.data.message || "Prerequisites not met");
            } else {
                toast.error("Failed to start quiz");
            }
        }
    };

    const handleAnswer = (qIdx, value) => {
        setAnswers(prev => ({ ...prev, [qIdx]: value }));
    };

    const handleSubmit = async () => {
        if (!quizData) return;

        setSubmitting(true);
        try {
            const answerList = quizData.questions.map((_, idx) => answers[idx] || "");
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/submit-quiz/`, {
                idToken: authToken,
                quizId: quizData.quiz_id,
                answers: answerList,
            });
            setResult(res.data);
            toast.success("Quiz submitted!");
            setQuizData(null); 
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit quiz");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (quizData) {
        const questions = quizData.questions;
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                {/* Header for Quiz */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b dark:border-slate-700/50 p-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    if(window.confirm('Are you sure you want to quit the quiz? Progress will be lost.')) {
                                        setQuizData(null);
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <h2 className="text-lg font-bold dark:text-white uppercase tracking-tight">Certification Test</h2>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${timeLeft < 300 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'}`}>
                            <Clock size={18} className={timeLeft < 60 ? 'animate-pulse' : ''} />
                            <span className="font-mono font-bold text-lg">
                                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-32">
                    <div className="space-y-12">
                        {questions.map((q, idx) => {
                            const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;
                            
                            return (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50"
                                >
                                    <div className="flex gap-4 items-start mb-6">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </span>
                                        <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-slate-100 leading-relaxed">
                                            {q.question}
                                        </p>
                                    </div>

                                    {hasOptions ? (
                                        <div className="grid grid-cols-1 gap-3 ml-0 sm:ml-12">
                                            {q.options.map((opt, optIdx) => (
                                                <label 
                                                    key={optIdx}
                                                    className={`group relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                        answers[idx] === opt 
                                                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500 ring-1 ring-orange-500' 
                                                        : 'bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-500/50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`q-${idx}`}
                                                        value={opt}
                                                        checked={answers[idx] === opt}
                                                        onChange={() => handleAnswer(idx, opt)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex-shrink-0 flex items-center justify-center transition-colors ${
                                                        answers[idx] === opt 
                                                        ? 'border-orange-500 bg-orange-500' 
                                                        : 'border-gray-300 dark:border-slate-600 group-hover:border-orange-300'
                                                    }`}>
                                                        {answers[idx] === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className={`text-base font-medium transition-colors ${
                                                        answers[idx] === opt ? 'text-orange-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'
                                                    }`}>
                                                        {opt}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="ml-0 sm:ml-12">
                                            <textarea
                                                value={answers[idx] || ""}
                                                onChange={e => handleAnswer(idx, e.target.value)}
                                                placeholder="Type your answer here..."
                                                rows={3}
                                                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
                                            />
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                                <AlertCircle size={14} />
                                                <span>AI will evaluate your descriptive answer.</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Submit Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {Object.keys(answers).length} of {questions.length} answered
                            </p>
                        </div>
                        <div className="w-full sm:w-auto">
                            <button
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="w-full sm:w-64 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 h-12"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Submitting Test...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit Certification Test</span>
                                        <ArrowLeft className="rotate-180" size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 transition-colors duration-300">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-100 dark:border-slate-700/50 relative overflow-hidden"
                >
                    {/* Decorative Background */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 ${result.passed ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                        {result.passed ? <Trophy size={40} /> : <X size={40} />}
                    </div>

                    <h2 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">
                        {result.passed ? "Test Passed!" : "Needs More Work"}
                    </h2>
                    
                    <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                        {result.passed 
                            ? "Congratulations! You've successfully demonstrated your mastery of this topic." 
                            : "Don't give up! Review the course material and try again to earn your certificate."}
                    </p>

                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-slate-700/50">
                        <span className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Final Score</span>
                        <span className={`text-5xl font-black ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.score}%
                        </span>
                    </div>

                    <div className="space-y-3">
                        {result.passed && result.certificate_url && (
                            <a
                                href={result.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                            >
                                <Award size={20} />
                                View Certificate
                            </a>
                        )}
                        <button
                            onClick={() => setResult(null)}
                            className="w-full px-8 py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all active:scale-[0.98]"
                        >
                            Return to Selection
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }
    if (selectedHistoryQuiz) {
        const questions = JSON.parse(selectedHistoryQuiz.questions);
        const userAnswers = selectedHistoryQuiz.user_answers ? JSON.parse(selectedHistoryQuiz.user_answers) : [];

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-8 transition-colors duration-300">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => setSelectedHistoryQuiz(null)}
                        className="mb-8 flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-white font-bold rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} />
                        Back to Selection
                    </button>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700/50 overflow-hidden"
                    >
                        {/* Summary Header */}
                        <div className="p-6 sm:p-10 border-b dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedHistoryQuiz.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {selectedHistoryQuiz.passed ? "Certification Earned" : "Attempt Failed"}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                    {selectedHistoryQuiz.video ? selectedHistoryQuiz.video.name : selectedHistoryQuiz.playlist?.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                                    <Clock size={14} />
                                    Attempted on {new Date(selectedHistoryQuiz.attempted_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-center sm:text-right bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-inner border border-gray-100 dark:border-slate-700/50 min-w-[140px]">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Final Score</p>
                                <p className={`text-4xl font-black ${selectedHistoryQuiz.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {selectedHistoryQuiz.score}%
                                </p>
                            </div>
                        </div>

                        {/* Question Breakdown */}
                        <div className="p-6 sm:p-10 space-y-12">
                            {questions.map((q, idx) => {
                                const userAnswer = userAnswers[idx];
                                const isCorrect = userAnswer === q.answer;

                                return (
                                    <div key={idx} className="relative">
                                        <div className="flex gap-4 items-start mb-6">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </span>
                                            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 leading-relaxed">
                                                {q.question}
                                            </p>
                                        </div>

                                        <div className="grid gap-3 sm:ml-12">
                                            {q.options.map((opt, optIdx) => {
                                                const isSelected = opt === userAnswer;
                                                const isActualAnswer = opt === q.answer;

                                                let borderStyle = "border-gray-100 dark:border-slate-700/50";
                                                let bgStyle = "bg-gray-50/50 dark:bg-slate-900/20";
                                                let textStyle = "text-gray-600 dark:text-slate-400";
                                                let icon = null;

                                                if (isSelected && isCorrect) {
                                                    borderStyle = "border-green-500 dark:border-green-500/50";
                                                    bgStyle = "bg-green-50 dark:bg-green-900/20";
                                                    textStyle = "text-green-900 dark:text-green-300 font-bold";
                                                    icon = <CheckCircle size={16} className="text-green-500" />;
                                                } else if (isSelected && !isCorrect) {
                                                    borderStyle = "border-red-500 dark:border-red-500/50";
                                                    bgStyle = "bg-red-50 dark:bg-red-900/20";
                                                    textStyle = "text-red-900 dark:text-red-300 font-bold";
                                                    icon = <X size={16} className="text-red-500" />;
                                                } else if (isActualAnswer) {
                                                    borderStyle = "border-green-200 dark:border-green-900/30";
                                                    bgStyle = "bg-green-50/30 dark:bg-green-900/5 shadow-inner";
                                                    textStyle = "text-green-700 dark:text-green-400/80 font-medium italic";
                                                    icon = <CheckCircle size={14} className="opacity-50" />;
                                                }

                                                return (
                                                    <div key={optIdx} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${borderStyle} ${bgStyle}`}>
                                                        <span className={`text-sm ${textStyle}`}>{opt}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isSelected && <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Your Answer</span>}
                                                            {!isSelected && isActualAnswer && <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Correct Answer</span>}
                                                            {icon}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (

        <div className="max-w-[1600px] mx-auto p-4 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <Award className="text-orange-500 w-8 h-8" />
                        Quiz Center
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Test your knowledge and track your progress across your learning journey.</p>
                </div>
            </div>

            <div className="space-y-12">
                {/* Section 1: Completed Playlists (Horizontal Scroll) */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                            <Library className="w-6 h-6 text-orange-500" />
                            Completed Playlists
                        </h3>
                    </div>

                    {playlists.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-700/50 shadow-sm">
                            <BookOpen className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-slate-400 text-lg">No completed playlists available for quizzes.</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            {/* Navigation Buttons */}
                            <button
                                onClick={() => scroll('left')}
                                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-slate-800/90 border border-orange-100 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center text-orange-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 hidden md:flex"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-slate-800/90 border border-orange-100 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center text-orange-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 hidden md:flex"
                            >
                                <ChevronRight size={24} />
                            </button>

                            <div 
                                ref={playlistScrollRef}
                                className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory hide-scrollbar"
                            >
                                {playlists.map(pl => (
                                    <motion.div
                                        key={pl.pid}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex-shrink-0 w-[400px] snap-start"
                                    >
                                        <div className={`h-full group/card relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all duration-300 ${
                                            pl.is_eligible 
                                            ? 'border-orange-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/30' 
                                            : 'border-gray-100 dark:border-slate-800 opacity-80'
                                        }`}>
                                            <div className="flex flex-col h-full justify-between gap-6">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-xl line-clamp-2 min-h-[3.5rem] leading-tight">{pl.name}</h4>
                                                    
                                                    <div className="mt-6">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Progress</span>
                                                            <span className="text-[11px] font-black text-orange-500 dark:text-orange-400">
                                                                {pl.passed_video_quizzes} / {pl.total_videos} PASSED
                                                            </span>
                                                        </div>
                                                        <div className="h-2.5 bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden p-0.5">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(pl.passed_video_quizzes / pl.total_videos) * 100}%` }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${pl.passed_video_quizzes === pl.total_videos ? 'from-green-500 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'from-orange-400 to-amber-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t dark:border-slate-700/50 flex items-center justify-between">
                                                    {!pl.is_eligible ? (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-gray-100 dark:border-slate-700">
                                                            <Lock size={14} />
                                                            Locked
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold uppercase tracking-widest">
                                                            <CheckCircle size={14} />
                                                            Ready
                                                        </div>
                                                    )}

                                                    <button
                                                        disabled={!pl.is_eligible}
                                                        onClick={() => handleStartQuiz("playlist", pl.pid)}
                                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                                            pl.is_eligible
                                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:scale-[1.05] active:scale-95'
                                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {pl.is_eligible ? "Take Test" : "Unlock"}
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Section 2: Attempt History (Grid Layout) */}
                <section className="bg-white/40 dark:bg-slate-800/20 rounded-[2.5rem] p-8 border border-gray-100 dark:border-slate-700/30">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-orange-500" />
                            Attempt History
                        </h3>
                        <div className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-xs font-bold text-gray-500 dark:text-slate-400">
                            {history.length} Total Attempts
                        </div>
                    </div>
                    
                    {history.length === 0 ? (
                        <div className="text-center py-20 opacity-40">
                            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium dark:text-slate-400">You haven't attempted any quizzes yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(hist => (
                                    <motion.div
                                        key={hist.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -4 }}
                                        className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-transparent dark:border-slate-700/50 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/30 cursor-pointer transition-all group"
                                        onClick={() => setSelectedHistoryQuiz(hist)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`p-3 rounded-2xl flex-shrink-0 transition-colors ${hist.video ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'}`}>
                                                {hist.video ? <Video size={20} /> : <Library size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-800 dark:text-slate-200 text-sm line-clamp-1 group-hover:text-orange-500 transition-colors">
                                                    {hist.video ? hist.video.name : hist.playlist?.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 font-medium">
                                                    {new Date(hist.attempted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
                                            <div className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight shadow-sm ${
                                                hist.passed 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            }`}>
                                                {hist.score}%
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 border dark:border-slate-700">
                                                <ChevronRight size={18} className="text-orange-500" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {history.length > itemsPerPage && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className={`p-2 rounded-xl border transition-all ${
                                            currentPage === 1 
                                            ? 'text-gray-300 dark:text-slate-700 border-gray-100 dark:border-slate-700 cursor-not-allowed' 
                                            : 'text-orange-500 border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 active:scale-95'
                                        }`}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: Math.ceil(history.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                                    currentPage === page 
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-110' 
                                                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(history.length / itemsPerPage), prev + 1))}
                                        className={`p-2 rounded-xl border transition-all ${
                                            currentPage === Math.ceil(history.length / itemsPerPage)
                                            ? 'text-gray-300 dark:text-slate-700 border-gray-100 dark:border-slate-700 cursor-not-allowed' 
                                            : 'text-orange-500 border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 active:scale-95'
                                        }`}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Quiz;
