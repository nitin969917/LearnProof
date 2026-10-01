import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  Flame, 
  Check, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import QuizMathText from '../Common/QuizMathText';

const FlashcardsView = ({ 
  questions = [], 
  loading = false, 
  onStartQuiz,
  onRefresh
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatus, setCardStatus] = useState({}); // { [origIdx]: 'mastered' | 'review' }
  const [deckOrder, setDeckOrder] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'review'
  const [isCompleted, setIsCompleted] = useState(false);

  // Auto-fetch if questions are missing and not currently loading
  useEffect(() => {
    if ((!questions || questions.length === 0) && !loading && onRefresh) {
      onRefresh();
    }
  }, []);

  // Initialize or reset deck order when questions change
  useEffect(() => {
    if (Array.isArray(questions) && questions.length > 0) {
      setDeckOrder(questions.map((_, i) => i));
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
    }
  }, [questions]);

  // Filtered deck order based on filterMode
  const activeDeck = useMemo(() => {
    if (!Array.isArray(deckOrder) || deckOrder.length === 0) return [];
    if (filterMode === 'review') {
      const reviewIndices = deckOrder.filter(idx => cardStatus[idx] === 'review');
      return reviewIndices.length > 0 ? reviewIndices : deckOrder;
    }
    return deckOrder;
  }, [deckOrder, filterMode, cardStatus]);

  const currentOriginalIndex = activeDeck[currentIndex] ?? 0;
  const currentCard = questions[currentOriginalIndex];

  // Stats calculation
  const masteredCount = useMemo(() => {
    return Object.values(cardStatus).filter(s => s === 'mastered').length;
  }, [cardStatus]);

  const reviewCount = useMemo(() => {
    return Object.values(cardStatus).filter(s => s === 'review').length;
  }, [cardStatus]);

  const progressPct = useMemo(() => {
    if (!activeDeck.length) return 0;
    return Math.round(((currentIndex + 1) / activeDeck.length) * 100);
  }, [currentIndex, activeDeck.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < activeDeck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, activeDeck.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleRate = useCallback((status) => {
    if (currentOriginalIndex === undefined) return;
    setCardStatus(prev => ({
      ...prev,
      [currentOriginalIndex]: status
    }));

    // Auto advance to next card after brief moment
    setTimeout(() => {
      handleNext();
    }, 220);
  }, [currentOriginalIndex, handleNext]);

  const handleShuffle = useCallback(() => {
    setIsFlipped(false);
    setDeckOrder(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setCurrentIndex(0);
    setIsCompleted(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setIsCompleted(false);
    setFilterMode('all');
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-orange-100/90 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center animate-pulse">
            <Layers className="text-orange-500 animate-bounce" size={30} />
          </div>
          <Sparkles className="absolute -top-1.5 -right-1.5 text-amber-500 animate-spin" size={20} />
        </div>
        <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
          Generating AI Flashcards...
        </h4>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
          Extracting key definitions, mechanisms, and active recall cards specifically for this video lesson.
        </p>
      </div>
    );
  }

  // Empty state (only shown if not loading and questions array is empty)
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-orange-100/90 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-3.5 shadow-2xs">
          <Layers size={28} />
        </div>
        <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
          Flashcards for this Video
        </h4>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mb-5 leading-relaxed">
          Active recall flashcards let you test yourself on key concepts, algorithms, and formulas before taking the test.
        </p>
        <button
          onClick={onRefresh || onStartQuiz}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer flex items-center gap-2"
        >
          <Sparkles size={16} />
          <span>Generate Flashcards Now</span>
        </button>
      </div>
    );
  }

  // Study Completion Summary
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-orange-100/90 dark:border-slate-700 shadow-sm text-center max-w-lg mx-auto"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mb-3 shadow-md shadow-orange-500/20">
          <Flame size={32} />
        </div>
        <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mb-1">
          Deck Complete! 🎉
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          Great job practicing with active recall! Here is your study summary:
        </p>

        {/* Scorecard */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-1">
              <CheckCircle size={14} /> Mastered
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {masteredCount} <span className="text-xs sm:text-sm font-normal text-emerald-600/70">/ {questions.length}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase mb-1">
              <HelpCircle size={14} /> Needs Review
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">
              {reviewCount} <span className="text-xs sm:text-sm font-normal text-amber-600/70">/ {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={15} />
            <span>Review Again</span>
          </button>

          {reviewCount > 0 && (
            <button
              onClick={() => {
                setFilterMode('review');
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsCompleted(false);
              }}
              className="flex-1 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <HelpCircle size={15} />
              <span>Practice {reviewCount} Review Cards</span>
            </button>
          )}

          {onStartQuiz && (
            <button
              onClick={onStartQuiz}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Take Timed Quiz</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const currentStatus = cardStatus[currentOriginalIndex];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Top Deck Info & Toolbar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-extrabold text-orange-950 dark:text-orange-100">
            Card {currentIndex + 1} of {activeDeck.length}
          </span>
          {filterMode === 'review' && (
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Flagged Only ({activeDeck.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            <Check size={12} /> {masteredCount} Mastered
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
            <HelpCircle size={12} /> {reviewCount} Review
          </span>

          {/* Shuffle button */}
          <button
            onClick={handleShuffle}
            title="Shuffle Deck"
            className="p-1.5 sm:p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-xl border border-gray-200/80 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Shuffle size={14} />
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            title="Restart from beginning"
            className="p-1.5 sm:p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-xl border border-gray-200/80 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200/80 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full h-[380px] sm:h-[420px] relative select-none">
        <div
          onClick={handleFlip}
          className={`transform-style-3d relative w-full h-full rounded-2xl sm:rounded-3xl cursor-pointer transition-transform duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d'
          }}
        >
          {/* FRONT FACE (Question / Prompt) */}
          <div
            className="backface-hidden absolute inset-0 w-full h-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border-2 border-orange-200/90 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between overflow-y-auto custom-scrollbar"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)'
            }}
          >
            {/* Front Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-orange-100 dark:border-slate-700/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                  Question #{currentIndex + 1}
                </span>
                {currentStatus === 'mastered' && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} /> Mastered
                  </span>
                )}
                {currentStatus === 'review' && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <HelpCircle size={10} /> Review
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-orange-600/80 dark:text-orange-400/80 flex items-center gap-1">
                <RotateCcw size={12} /> Flip to Reveal
              </span>
            </div>

            {/* Front Question Content */}
            <div className="py-3 my-auto overflow-y-auto custom-scrollbar">
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug sm:leading-relaxed mb-3">
                <QuizMathText text={currentCard?.question} />
              </div>

              {/* Distractor hints */}
              {Array.isArray(currentCard?.options) && currentCard.options.length > 0 && (
                <div className="pt-2.5 border-t border-dashed border-gray-100 dark:border-slate-700/70">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                    Options to consider:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {currentCard.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx} 
                        className="px-2.5 py-1.5 rounded-lg bg-gray-50/80 dark:bg-slate-700/40 border border-gray-200/50 dark:border-slate-600 text-xs text-gray-700 dark:text-slate-300 break-words"
                      >
                        <span className="font-bold text-gray-400 dark:text-slate-500 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                        <QuizMathText text={opt} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Front Footer Hint */}
            <div className="pt-2.5 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between text-gray-400 dark:text-slate-500 text-[11px] shrink-0">
              <span>💡 Tap anywhere on card to reveal answer</span>
              <span className="hidden sm:inline">Spacebar ␣</span>
            </div>
          </div>

          {/* BACK FACE (Answer / Solution) */}
          <div
            className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/25 border-2 border-emerald-500 shadow-md flex flex-col justify-between overflow-y-auto custom-scrollbar"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Back Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/80 dark:border-emerald-800/60 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1">
                <CheckCircle size={12} /> Correct Answer
              </span>
              <span className="text-[11px] font-bold text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1">
                <RotateCcw size={12} /> Flip Back
              </span>
            </div>

            {/* Back Answer Content */}
            <div className="py-2.5 my-auto overflow-y-auto custom-scrollbar space-y-2.5">
              <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 dark:border-emerald-500/80 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  Answer
                </span>
                <div className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                  <QuizMathText text={currentCard?.answer} />
                </div>
              </div>

              {/* Show original question briefly as reference */}
              <div className="text-xs text-gray-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-700">
                <strong className="text-gray-800 dark:text-slate-200 block mb-1 text-[11px] uppercase tracking-wider">
                  Question
                </strong>
                <div className="line-clamp-3">
                  <QuizMathText text={currentCard?.question} />
                </div>
              </div>
            </div>

            {/* Back Footer Self-Assessment Buttons */}
            <div 
              className="pt-2.5 border-t border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2.5 shrink-0"
              onClick={(e) => e.stopPropagation()} // Prevent accidental flip on rating click
            >
              <button
                onClick={() => handleRate('review')}
                className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <XCircle size={15} />
                <span>Need Review</span>
              </button>

              <button
                onClick={() => handleRate('mastered')}
                className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/20 active:scale-95"
              >
                <CheckCircle size={15} />
                <span>Got It! Mastered</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-2 sm:py-2.5 px-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold text-xs sm:text-sm rounded-xl border border-gray-200/80 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <button
          onClick={handleFlip}
          className="flex-1 py-2 sm:py-2.5 px-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
        >
          <RotateCcw size={14} />
          <span>{isFlipped ? "Question" : "Flip"}</span>
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-2 sm:py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
        >
          <span>{currentIndex === activeDeck.length - 1 ? "Finish" : "Next"}</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick CTA to Switch to Quiz */}
      {onStartQuiz && (
        <div className="pt-2 border-t border-orange-200/50 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 bg-orange-50/60 dark:bg-orange-950/20 p-2.5 sm:p-3 rounded-xl border">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-xs text-orange-950 dark:text-orange-200 font-medium">
              Done with active recall? Test yourself under exam conditions.
            </span>
          </div>
          <button
            onClick={onStartQuiz}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer active:scale-95 shrink-0"
          >
            Start Timed Quiz →
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardsView;
