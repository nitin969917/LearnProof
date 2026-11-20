import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, X, ArrowRight } from 'lucide-react';
import QuizMathText from '../Common/QuizMathText';
import { playCorrectSound, playWrongSound, playHeartLostSound } from '../../utils/duoAudio';

export default function DuolingoCheckpointOverlay({
  checkpoint,
  onAnswer,
  onContinue,
  onRewind,
  onSkip,
  onDisableAllCheckpoints
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Keyboard accessibility: 1-4 or A-D to select, Enter to check/continue, Esc to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!checkpoint) return;

      if (e.key === 'Escape') {
        handleSkip();
        return;
      }

      if (e.key === 'Enter') {
        if (!isChecked && selectedOption) {
          handleCheck();
        } else if (isChecked) {
          handleContinue();
        }
        return;
      }

      if (!isChecked && checkpoint.options) {
        const key = e.key.toLowerCase();
        const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
        if (key in map && checkpoint.options[map[key]]) {
          setSelectedOption(checkpoint.options[map[key]]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChecked, selectedOption, checkpoint]);

  if (!checkpoint) return null;

  const handleCheck = () => {
    if (!selectedOption || isChecked) return;

    const cleanSelected = String(selectedOption).trim().toLowerCase();
    const cleanAnswer = String(checkpoint.answer).trim().toLowerCase();

    const optIndex = checkpoint.options.indexOf(selectedOption);
    const letterMap = ['a', 'b', 'c', 'd'];
    const letterAns = letterMap[optIndex];

    const correctInfo = getCorrectAnswerInfo();
    const correct = (selectedOption === correctInfo.text) ||
                    (cleanSelected === String(correctInfo.text || '').trim().toLowerCase()) ||
                    (letterAns && correctInfo.letter && letterAns.toUpperCase() === correctInfo.letter.toUpperCase()) ||
                    (cleanSelected === cleanAnswer) ||
                    (letterAns && cleanAnswer === letterAns);

    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      playCorrectSound();
      onAnswer(true, 15);
    } else {
      playWrongSound();
      playHeartLostSound();
      onAnswer(false, 0);
    }
  };

  const handleContinue = () => {
    onContinue();
  };

  const handleRewind = () => {
    if (onRewind) {
      onRewind(15);
    } else {
      onContinue();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onContinue();
    }
  };

  const getCorrectAnswerInfo = () => {
    if (!checkpoint || !checkpoint.options) return { letter: '', text: '' };
    const rawAns = String(checkpoint.answer || '').trim();
    const letterMap = ['A', 'B', 'C', 'D'];

    // Strip leading "Option " or "Option: " if present
    const strippedAns = rawAns.replace(/^option\s*:?\s*/i, '').trim();

    // 1. Single letter 'A', 'B', 'C', or 'D'
    if (strippedAns.length === 1) {
      const upper = strippedAns.toUpperCase();
      const letterIdx = letterMap.indexOf(upper);
      if (letterIdx !== -1 && checkpoint.options[letterIdx]) {
        return {
          letter: upper,
          text: checkpoint.options[letterIdx]
        };
      }
    }

    // 2. Starts with letter followed by colon/dot/parenthesis, e.g. "B) ...", "B: ...", "B. ..."
    const letterMatch = strippedAns.match(/^([A-D])[\s.:\-)](.*)/i);
    if (letterMatch) {
      const upper = letterMatch[1].toUpperCase();
      const letterIdx = letterMap.indexOf(upper);
      const remainingText = letterMatch[2].trim();
      return {
        letter: upper,
        text: remainingText || (checkpoint.options[letterIdx] || '')
      };
    }

    // 3. Numeric index '0', '1', '2', '3'
    const numIdx = parseInt(strippedAns, 10);
    if (!isNaN(numIdx) && numIdx >= 0 && numIdx < checkpoint.options.length && strippedAns === String(numIdx)) {
      return {
        letter: letterMap[numIdx],
        text: checkpoint.options[numIdx]
      };
    }

    // 4. Exact or case-insensitive match against checkpoint.options
    const cleanLower = strippedAns.toLowerCase();
    const foundIdx = checkpoint.options.findIndex(
      opt => {
        const cleanOpt = String(opt).trim().toLowerCase().replace(/^option\s*:?\s*/i, '');
        return cleanOpt === cleanLower || cleanOpt.includes(cleanLower) || cleanLower.includes(cleanOpt);
      }
    );
    if (foundIdx !== -1) {
      return {
        letter: letterMap[foundIdx],
        text: checkpoint.options[foundIdx]
      };
    }

    // Fallback
    return {
      letter: '',
      text: strippedAns || rawAns
    };
  };

  const correctInfo = getCorrectAnswerInfo();
  const currentIndex = checkpoint.index ?? 0;
  const totalCount = checkpoint.total || 6;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      {/* ── Main Modal Card ── */}
      <div className="w-full max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden transition-all duration-200 my-auto">
        
        {/* ── Header ── */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={handleSkip}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-90 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Skip question [Esc]"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 font-mono">
              Quick Check
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 dark:text-slate-500">
              ({currentIndex + 1} of {totalCount})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onDisableAllCheckpoints && (
              <button
                type="button"
                onClick={onDisableAllCheckpoints}
                className="text-[11px] font-semibold text-gray-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400 transition cursor-pointer underline decoration-dotted"
                title="Stop asking checkpoint questions for videos"
              >
                Turn off quizzes
              </button>
            )}
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition cursor-pointer"
            >
              Skip
            </button>
          </div>
        </div>

        {/* ── Question & Options ── */}
        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 dark:text-white leading-snug">
            <QuizMathText text={checkpoint.question} />
          </h3>

          <div className="space-y-2 sm:space-y-2.5 pt-0.5">
            {checkpoint.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === option;

              let cardStyle = "bg-white dark:bg-slate-800/90 border-2 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50/20";

              if (isChecked) {
                const cleanAns = String(checkpoint.answer).trim().toLowerCase();
                const cleanOpt = String(option).trim().toLowerCase();
                const letterMatch = ['a', 'b', 'c', 'd'][idx];
                const isThisTheCorrectAnswer = cleanOpt === cleanAns || cleanAns === letterMatch;

                if (isThisTheCorrectAnswer) {
                  cardStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm";
                } else if (isSelected && !isCorrect) {
                  cardStyle = "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-sm";
                } else {
                  cardStyle = "opacity-40 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-400";
                }
              } else if (isSelected) {
                cardStyle = "bg-orange-50/80 dark:bg-orange-950/30 border-2 border-orange-500 text-orange-950 dark:text-orange-100 ring-2 ring-orange-500/20 shadow-sm";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isChecked}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer select-none ${cardStyle}`}
                >
                  <span className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-xl flex items-center justify-center font-mono font-black text-xs sm:text-sm border ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-700/80 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {letter}
                  </span>
                  <div className="flex-1 text-xs sm:text-sm font-bold leading-snug">
                    <QuizMathText text={option} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={`px-4 sm:px-6 py-4 border-t transition-colors duration-200 ${
          !isChecked
            ? 'bg-gray-50/90 dark:bg-slate-900/90 border-gray-100 dark:border-slate-800'
            : isCorrect
              ? 'bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50/95 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
        }`}>
          {!isChecked ? (
            <div className="flex items-center justify-between gap-3 w-full">
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition cursor-pointer"
              >
                Skip [Esc]
              </button>

              <button
                type="button"
                disabled={!selectedOption}
                onClick={handleCheck}
                className={`px-7 py-2.5 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  selectedOption
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 active:scale-95'
                    : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                Check Answer
              </button>
            </div>
          ) : isCorrect ? (
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    Great Job!
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">
                    You earned <span className="font-bold text-amber-500 font-mono">+15 XP</span>
                  </div>
                  {checkpoint.explanation && (
                    <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      <QuizMathText text={checkpoint.explanation} />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3">
              {/* Error Message & Correct Answer */}
              <div className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-rose-200/90 dark:border-rose-900/60 shadow-xs">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <X size={16} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                    Not quite!
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5 leading-snug">
                    <span className="font-bold text-gray-900 dark:text-white mr-1.5">Correct Answer:</span>
                    {correctInfo.letter && (
                      <span className="inline-flex items-center justify-center font-mono font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 mr-1.5 border border-emerald-300 dark:border-emerald-700">
                        Option {correctInfo.letter}
                      </span>
                    )}
                    <QuizMathText text={correctInfo.text} className="font-medium text-gray-700 dark:text-slate-300 inline align-baseline" />
                  </div>
                  {checkpoint.explanation && (
                    <div className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">
                      <QuizMathText text={checkpoint.explanation} />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row - Side by Side on Mobile & Desktop */}
              <div className="flex flex-row items-center gap-2 sm:gap-2.5 w-full justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleRewind}
                  className="flex-1 sm:flex-initial sm:w-auto px-3.5 sm:px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Rewind 15 seconds to review video lecture"
                >
                  <RotateCcw size={14} className="text-orange-500 shrink-0" />
                  <span className="whitespace-nowrap">Rewind 15s</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex-1 sm:flex-initial sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                >
                  <span className="whitespace-nowrap">Continue</span>
                  <ArrowRight size={14} className="shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
