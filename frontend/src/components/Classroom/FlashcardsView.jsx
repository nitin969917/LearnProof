import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle, 
  XCircle, 
  Layers, 
  HelpCircle, 
  Flame, 
  Check, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import QuizMathText from '../Common/QuizMathText';

const FlashcardsView = ({ 
  questions = [], 
  loading = false, 
  onStartQuiz,
  onRefresh,
  onExit
}) => {
  const [isStarted, setIsStarted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatus, setCardStatus] = useState({}); // { [origIdx]: 'mastered' | 'review' }
  const [deckOrder, setDeckOrder] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'review'
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize or reset deck order when questions change
  useEffect(() => {
    if (Array.isArray(questions) && questions.length > 0) {
      setDeckOrder(questions.map((_, i) => i));
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
    }
  }, [questions]);

  // Active deck taking filterMode into account
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

  // Stats
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
      if (isFlipped) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 150);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, activeDeck.length, isFlipped]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      if (isFlipped) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev - 1);
        }, 150);
      } else {
        setCurrentIndex(prev => prev - 1);
      }
    }
  }, [currentIndex, isFlipped]);

  const handleRate = useCallback((status) => {
    if (currentOriginalIndex === undefined) return;
    setCardStatus(prev => ({
      ...prev,
      [currentOriginalIndex]: status
    }));

    setTimeout(() => {
      handleNext();
    }, 200);
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
    if (!isStarted || isCompleted) return;

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
  }, [isStarted, isCompleted, handleFlip, handleNext, handlePrev]);

  // 1. START SCREEN: shown before starting flashcards
  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-6 sm:py-9 text-center w-full max-w-md mx-auto">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-3 shadow-xs">
          <Layers className="h-7 w-7 sm:h-9 sm:w-9 text-orange-500" />
        </div>
        <h4 className="text-base sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-1.5">
          Video Flashcards
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          Flip through key questions and formulas to test your recall before taking the quiz test!
        </p>
        <button
          onClick={() => {
            setIsStarted(true);
            if ((!questions || questions.length === 0) && onRefresh) {
              onRefresh();
            }
          }}
          disabled={loading}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading Flashcards...</span>
            </>
          ) : (
            <>
              <span>Start Flashcards</span>
              <ChevronRight size={15} />
            </>
          )}
        </button>
      </div>
    );
  }

  // 2. LOADING STATE (only if no questions loaded yet)
  if (loading && (!questions || questions.length === 0)) {
    return (
      <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Preparing flashcards from video...</p>
      </div>
    );
  }

  // 3. EMPTY / ERROR STATE
  if (!questions || questions.length === 0) {
    return (
      <div className="py-8 text-center max-w-sm mx-auto">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
          Could not load flashcards for this video.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onExit ? onExit() : setIsStarted(false)}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 4. DECK COMPLETE SUMMARY SCREEN
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-7 border border-orange-100/90 dark:border-slate-700 shadow-sm text-center max-w-md mx-auto"
      >
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mb-2.5 shadow-md shadow-orange-500/20">
          <Flame size={26} />
        </div>
        <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white mb-1">
          Deck Complete! 🎉
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Review summary for this study session:
        </p>

        {/* Scorecard */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase mb-0.5">
              <CheckCircle size={13} /> Mastered
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {masteredCount} <span className="text-xs font-normal text-emerald-600/70">/ {questions.length}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase mb-0.5">
              <HelpCircle size={13} /> Review
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300">
              {reviewCount} <span className="text-xs font-normal text-amber-600/70">/ {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>Review Again</span>
          </button>

          {onStartQuiz && (
            <button
              onClick={onStartQuiz}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Take Quiz</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const currentStatus = cardStatus[currentOriginalIndex];

  // 5. COMPACT, ZERO-SCROLLING 3D FLASHCARD VIEW
  return (
    <div className="w-full max-w-xl mx-auto space-y-2.5">
      {/* Top Deck Info Bar */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExit ? onExit() : setIsStarted(false)}
            className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
            title="Exit Flashcards"
          >
            <ArrowLeft size={13} />
            <span>Exit</span>
          </button>
          <span className="font-extrabold text-orange-950 dark:text-orange-100 text-xs">
            Card {currentIndex + 1} of {activeDeck.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            <Check size={11} /> {masteredCount}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
            <HelpCircle size={11} /> {reviewCount}
          </span>
          <button
            onClick={handleShuffle}
            title="Shuffle Deck"
            className="p-1.5 text-gray-500 hover:text-orange-600 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg border border-gray-200/80 dark:border-slate-700 transition cursor-pointer active:scale-95"
          >
            <Shuffle size={13} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200/80 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* COMPACT 3D FLIP CARD (fits mobile without scrolling) */}
      <div className="perspective-1000 w-full h-[220px] sm:h-[250px] relative select-none">
        <div
          onClick={handleFlip}
          className={`transform-style-3d relative w-full h-full rounded-2xl cursor-pointer transition-transform duration-500 shadow-sm hover:shadow-md ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d'
          }}
        >
          {/* FRONT FACE (Question Only, Clean & Concise) */}
          <div
            className="backface-hidden absolute inset-0 w-full h-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-orange-200/90 dark:border-slate-700 flex flex-col justify-between overflow-y-auto custom-scrollbar"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)'
            }}
          >
            {/* Front Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-orange-100 dark:border-slate-700/80 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-extrabold text-[10px] uppercase">
                Question #{currentIndex + 1}
              </span>
              <span className="text-[10px] font-bold text-orange-600/80 dark:text-orange-400/80 flex items-center gap-1">
                <RotateCcw size={11} /> Tap to flip
              </span>
            </div>

            {/* Front Question Content (No bulky stacked option cards) */}
            <div className="py-2 my-auto text-center w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`front-${currentOriginalIndex}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-100 leading-snug break-words"
                >
                  <QuizMathText text={currentCard?.question} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Front Footer */}
            <div className="pt-1.5 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between text-gray-400 dark:text-slate-500 text-[10px] shrink-0">
              <span>💡 Tap card to reveal answer</span>
              {currentStatus === 'mastered' && (
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <Check size={11} /> Mastered
                </span>
              )}
              {currentStatus === 'review' && (
                <span className="text-amber-600 font-bold flex items-center gap-0.5">
                  <HelpCircle size={11} /> Review
                </span>
              )}
            </div>
          </div>

          {/* BACK FACE (Answer & Self Rating) */}
          <div
            className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/70 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/25 border-2 border-emerald-500 flex flex-col justify-between overflow-y-auto custom-scrollbar"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Back Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] uppercase flex items-center gap-1">
                <CheckCircle size={11} /> Correct Answer
              </span>
              <span className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1">
                <RotateCcw size={11} /> Flip Back
              </span>
            </div>

            {/* Back Answer Content */}
            <div className="py-2 my-auto text-center w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`back-${currentOriginalIndex}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500/80 shadow-xs inline-block max-w-full"
                >
                  <div className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100 leading-snug break-words">
                    <QuizMathText text={currentCard?.answer} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Back Self-Rating Buttons */}
            <div 
              className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleRate('review')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                <XCircle size={13} />
                <span>Need Review</span>
              </button>

              <button
                onClick={() => handleRate('mastered')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs shadow-emerald-600/20 active:scale-95"
              >
                <CheckCircle size={13} />
                <span>Mastered</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Bottom Navigation Controls */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl border border-gray-200/80 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
        >
          <ChevronLeft size={15} />
          <span>Prev</span>
        </button>

        <button
          onClick={handleFlip}
          className="flex-1 py-2 px-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
        >
          <RotateCcw size={13} />
          <span>{isFlipped ? "Question" : "Flip"}</span>
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
        >
          <span>{currentIndex === activeDeck.length - 1 ? "Finish" : "Next"}</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default FlashcardsView;
