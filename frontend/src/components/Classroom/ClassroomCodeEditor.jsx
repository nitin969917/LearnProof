import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  Terminal,
  Code2,
  Sliders,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  FileCode2,
  EyeOff
} from 'lucide-react';
import { executeCode, convertCodeSnippet } from '../../api/compilerApi';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';

const STARTER_CODE = {
  python: `# LearnProof Python 3 Runner
# Enter your code below and press 'Run Code' (⌘+Enter)

def main():
    print("🚀 Hello from LearnProof Code Editor!")
    
    # Example: Simple DSA problem
    nums = [12, 34, 54, 2, 3]
    print(f"Original Array: {nums}")
    print(f"Sorted Array:   {sorted(nums)}")
    print(f"Sum of Array:    {sum(nums)}")

if __name__ == "__main__":
    main()
`,
  cpp: `// LearnProof C++ 17 Runner
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

using namespace std;

int main() {
    cout << "🚀 Hello from LearnProof C++ Editor!" << endl;
    
    vector<int> nums = {12, 34, 54, 2, 3};
    cout << "Original Array: ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    sort(nums.begin(), nums.end());
    cout << "Sorted Array:   ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    int total = accumulate(nums.begin(), nums.end(), 0);
    cout << "Sum: " << total << endl;
    
    return 0;
}
`,
  java: `// LearnProof Java Runner
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Hello from LearnProof Java Editor!");
        
        int[] nums = {12, 34, 54, 2, 3};
        System.out.println("Original Array: " + Arrays.toString(nums));
        
        Arrays.sort(nums);
        System.out.println("Sorted Array:   " + Arrays.toString(nums));
        
        int sum = 0;
        for (int n : nums) sum += n;
        System.out.println("Sum: " + sum);
    }
}
`,
  javascript: `// LearnProof JavaScript (Node.js) Runner
function main() {
    console.log("🚀 Hello from LearnProof JavaScript Editor!");
    
    const nums = [12, 34, 54, 2, 3];
    console.log("Original Array:", nums);
    
    const sorted = [...nums].sort((a, b) => a - b);
    console.log("Sorted Array:  ", sorted);
    
    const sum = nums.reduce((a, b) => a + b, 0);
    console.log("Sum:", sum);
}

main();
`,
  c: `// LearnProof C Runner
#include <stdio.h>
#include <stdlib.h>

int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    printf("🚀 Hello from LearnProof C Editor!\\n");
    
    int nums[] = {12, 34, 54, 2, 3};
    int n = sizeof(nums) / sizeof(nums[0]);
    
    qsort(nums, n, sizeof(int), compare);
    
    printf("Sorted Array: ");
    int sum = 0;
    for (int i = 0; i < n; i++) {
        printf("%d ", nums[i]);
        sum += nums[i];
    }
    printf("\\nSum: %d\\n", sum);
    
    return 0;
}
`,
  typescript: `// LearnProof TypeScript Runner
function processNumbers(nums: number[]): { sorted: number[]; sum: number } {
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((acc, curr) => acc + curr, 0);
    return { sorted, sum };
}

const numbers: number[] = [12, 34, 54, 2, 3];
console.log("🚀 Hello from LearnProof TypeScript Editor!");
const result = processNumbers(numbers);
console.log("Sorted Array:", result.sorted);
console.log("Sum:", result.sum);
`
};

const LANGUAGES = [
  { id: 'python', label: 'Python 3', badge: 'PY', ext: '.py' },
  { id: 'cpp', label: 'C++ 17', badge: 'C++', ext: '.cpp' },
  { id: 'java', label: 'Java (JDK 21)', badge: 'JAVA', ext: '.java' },
  { id: 'javascript', label: 'JavaScript (Node.js)', badge: 'JS', ext: '.js' },
  { id: 'c', label: 'C (C11)', badge: 'C', ext: '.c' },
  { id: 'typescript', label: 'TypeScript', badge: 'TS', ext: '.ts' }
];

export default function ClassroomCodeEditor({
  code: externalCode,
  language: externalLanguage,
  videoId,
  onCodeChange,
  onLanguageChange,
  onHideTab
}) {
  const [language, setLanguage] = useState(() => {
    if (externalLanguage) return externalLanguage;
    try {
      if (videoId) {
        const saved = localStorage.getItem(`learnproof_lang_${videoId}`);
        if (saved) return saved;
      }
      return localStorage.getItem('learnproof_lang_draft') || 'python';
    } catch {
      return 'python';
    }
  });

  const [code, setCode] = useState(() => {
    if (externalCode) return externalCode;
    try {
      if (videoId) {
        const saved = localStorage.getItem(`learnproof_code_${videoId}`);
        if (saved !== null) return saved;
      }
      return localStorage.getItem('learnproof_code_draft') || STARTER_CODE.python;
    } catch {
      return STARTER_CODE.python;
    }
  });

  const [stdin, setStdin] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState('output'); // 'output' | 'stdin'
  const [output, setOutput] = useState('');
  const [errorOutput, setErrorOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [exitCode, setExitCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(13); // 12, 13, 15
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConvertingCode, setIsConvertingCode] = useState(false);
  const [convertingTargetLang, setConvertingTargetLang] = useState(null);

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const editorContainerRef = useRef(null);
  const preRef = useRef(null);
  const prevExternalLangRef = useRef(language);
  const prevExternalCodeRef = useRef(code);
  const langCacheRef = useRef({});

  // Sync external language if parent explicitly changes it
  useEffect(() => {
    if (externalLanguage && externalLanguage !== prevExternalLangRef.current) {
      prevExternalLangRef.current = externalLanguage;
      setLanguage(externalLanguage);
    }
  }, [externalLanguage]);

  // Sync external code if parent explicitly changes it
  useEffect(() => {
    if (externalCode !== undefined && externalCode !== null && externalCode !== prevExternalCodeRef.current) {
      prevExternalCodeRef.current = externalCode;
      setCode(externalCode);
    }
  }, [externalCode]);

  // Listen for global custom event to open code in editor from AI Notes
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      const { code: incomingCode, language: incomingLang } = e.detail || {};
      if (incomingLang) {
        const normalized = incomingLang.toLowerCase();
        const matched = LANGUAGES.find(l => l.id === normalized || l.badge.toLowerCase() === normalized);
        if (matched) {
          setLanguage(matched.id);
          prevExternalLangRef.current = matched.id;
          if (onLanguageChange) onLanguageChange(matched.id);
        }
      }
      if (incomingCode) {
        setCode(incomingCode);
        prevExternalCodeRef.current = incomingCode;
        if (onCodeChange) onCodeChange(incomingCode);
      }
      // Switch focus to editor
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    };

    window.addEventListener('learnproof:open-code-editor', handleGlobalOpen);
    return () => window.removeEventListener('learnproof:open-code-editor', handleGlobalOpen);
  }, [onCodeChange, onLanguageChange]);

  // Compute line count for line number gutter
  const lineCount = useMemo(() => {
    return (code || '').split('\n').length;
  }, [code]);

  const langAliases = {
    py: 'python',
    python3: 'python',
    js: 'javascript',
    node: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'c',
    cs: 'csharp',
    java: 'java',
    go: 'go',
    rust: 'rust',
    sh: 'bash',
    bash: 'bash'
  };

  const prismLang = langAliases[language] || language || 'javascript';

  // Real-time colorful Prism syntax highlighting
  const highlightedCode = useMemo(() => {
    try {
      const codeToHighlight = (code || '') + ((code || '').endsWith('\n') ? ' ' : '');
      if (Prism && Prism.languages[prismLang]) {
        return Prism.highlight(codeToHighlight, Prism.languages[prismLang], prismLang);
      }
      return Prism.highlight(codeToHighlight, Prism.languages.clike || Prism.languages.javascript, 'javascript');
    } catch {
      return (code || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [code, prismLang]);

  // Synchronize scroll between textarea, line numbers, and syntax highlighted pre
  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Switch language with intelligent AI code conversion and smart caching
  const handleLanguageChange = async (newLang) => {
    if (newLang === language || isConvertingCode) return;
    const oldLang = language;

    // Cache current code before switching
    if (code) {
      langCacheRef.current[oldLang] = code;
    }

    try {
      if (videoId) localStorage.setItem(`learnproof_lang_${videoId}`, newLang);
      localStorage.setItem('learnproof_lang_draft', newLang);
    } catch (e) {}

    // 1. Instant cache hit: If user previously converted or edited code in newLang
    if (langCacheRef.current[newLang]) {
      const cached = langCacheRef.current[newLang];
      setLanguage(newLang);
      prevExternalLangRef.current = newLang;
      if (onLanguageChange) onLanguageChange(newLang);
      setCode(cached);
      prevExternalCodeRef.current = cached;
      try {
        if (videoId) localStorage.setItem(`learnproof_code_${videoId}`, cached);
        localStorage.setItem('learnproof_code_draft', cached);
      } catch (e) {}
      if (onCodeChange) onCodeChange(cached);
      return;
    }

    // 2. Starter code check: If current code is unmodified starter template or blank, load new starter template
    const isStarter = Object.values(STARTER_CODE).some(starter => starter.trim() === code.trim());
    if (isStarter || !code.trim()) {
      const starter = STARTER_CODE[newLang] || '';
      setLanguage(newLang);
      prevExternalLangRef.current = newLang;
      if (onLanguageChange) onLanguageChange(newLang);
      setCode(starter);
      langCacheRef.current[newLang] = starter;
      prevExternalCodeRef.current = starter;
      try {
        if (videoId) localStorage.setItem(`learnproof_code_${videoId}`, starter);
        localStorage.setItem('learnproof_code_draft', starter);
      } catch (e) {}
      if (onCodeChange) onCodeChange(starter);
      return;
    }

    // 3. Custom code: Convert custom code to target language using Vertex AI
    try {
      setIsConvertingCode(true);
      setConvertingTargetLang(newLang);
      // Immediately reflect selection in parent so dropdown and active labels match
      setLanguage(newLang);
      prevExternalLangRef.current = newLang;
      if (onLanguageChange) onLanguageChange(newLang);

      const res = await convertCodeSnippet({
        code,
        fromLanguage: oldLang,
        toLanguage: newLang
      });
      if (res && res.code) {
        setCode(res.code);
        langCacheRef.current[newLang] = res.code;
        prevExternalCodeRef.current = res.code;
        try {
          if (videoId) localStorage.setItem(`learnproof_code_${videoId}`, res.code);
          localStorage.setItem('learnproof_code_draft', res.code);
        } catch (e) {}
        if (onCodeChange) onCodeChange(res.code);
      }
    } catch (err) {
      console.error('[Code Editor] Auto-convert failed:', err);
      // Revert back on error
      setLanguage(oldLang);
      prevExternalLangRef.current = oldLang;
      if (onLanguageChange) onLanguageChange(oldLang);
      toast.error(`Could not convert to ${LANGUAGES.find(l => l.id === newLang)?.label || newLang}. You can continue editing in ${LANGUAGES.find(l => l.id === oldLang)?.label || oldLang}.`);
    } finally {
      setIsConvertingCode(false);
      setConvertingTargetLang(null);
    }
  };

  // Reset to starter template
  const handleReset = () => {
    const starter = STARTER_CODE[language] || '';
    setCode(starter);
    setOutput('');
    setErrorOutput('');
    setExecutionTime(null);
    setExitCode(null);
  };

  // Clear code
  const handleClear = () => {
    setCode('');
    setOutput('');
    setErrorOutput('');
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Execute Code
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveBottomTab('output');
    setOutput('');
    setErrorOutput('');
    setExecutionTime(null);
    setExitCode(null);

    const startTime = performance.now();

    try {
      const result = await executeCode({
        language,
        code,
        stdin
      });

      const totalClientMs = Math.round(performance.now() - startTime);

      setOutput(result.stdout || '');
      setErrorOutput(result.stderr || '');
      setExitCode(result.exitCode ?? 0);
      setExecutionTime(result.executionTime ?? totalClientMs);
    } catch (err) {
      console.error('[Code Editor] Run Error:', err);
      const msg = err.response?.data?.message || err.message || 'Execution error';
      setErrorOutput(`Execution failed: ${msg}\nMake sure your local backend is running (port 8000).`);
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  // Keydown handler: Tab key indentation and Cmd/Ctrl + Enter execution
  const handleKeyDown = (e) => {
    // Cmd + Enter (Mac) or Ctrl + Enter (Windows/Linux) to run
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
      return;
    }

    // Tab key handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const tabSpaces = '    '; // 4 spaces
      const updatedCode = code.substring(0, selectionStart) + tabSpaces + code.substring(selectionEnd);
      setCode(updatedCode);
      langCacheRef.current[language] = updatedCode;
      prevExternalCodeRef.current = updatedCode;
      try {
        if (videoId) localStorage.setItem(`learnproof_code_${videoId}`, updatedCode);
        localStorage.setItem('learnproof_code_draft', updatedCode);
      } catch (err) {}
      if (onCodeChange) onCodeChange(updatedCode);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + 4;
          textareaRef.current.selectionEnd = selectionStart + 4;
        }
      }, 0);
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setCode(val);
    langCacheRef.current[language] = val;
    prevExternalCodeRef.current = val;
    try {
      if (videoId) localStorage.setItem(`learnproof_code_${videoId}`, val);
      localStorage.setItem('learnproof_code_draft', val);
    } catch (err) {}
    if (onCodeChange) onCodeChange(val);
  };

  return (
    <div
      ref={editorContainerRef}
      className={`flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12131f] shadow-sm transition-all duration-200 no-tab-swipe ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full'
      }`}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-slate-100/90 dark:bg-[#181926] border-b border-slate-200 dark:border-slate-800/80 text-xs select-none">
        {/* Left: Window Controls & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Mac OS Window Dots */}
          <div className="hidden sm:flex items-center gap-1.5 opacity-90 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#f38ba8] inline-block shadow-xs"></span>
            <span className="w-3 h-3 rounded-full bg-[#f9e2af] inline-block shadow-xs"></span>
            <span className="w-3 h-3 rounded-full bg-[#a6e3a1] inline-block shadow-xs"></span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={isConvertingCode && convertingTargetLang ? convertingTargetLang : language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isConvertingCode}
              aria-label="Select Programming Language"
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 text-xs cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 text-slate-400 pointer-events-none" />
          </div>

          {isConvertingCode && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse ml-1">
              <Sparkles size={12} className="animate-spin" />
              <span>Converting to {LANGUAGES.find(l => l.id === convertingTargetLang)?.label || convertingTargetLang}...</span>
            </span>
          )}

          {/* Font Size Selector */}
          <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-lg px-1.5 py-0.5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 pl-1">Size:</span>
            {[12, 13, 15].map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition ${
                  fontSize === sz
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions & Run Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer text-xs shadow-2xs"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="hidden sm:inline text-[11px]">Copy</span>
              </>
            )}
          </button>

          {/* Reset Template Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer text-xs shadow-2xs"
            title="Reset to Starter Template"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            title="Clear Code"
          >
            <Trash2 size={13} />
          </button>

          {/* Optional Hide Tab for this course */}
          {onHideTab && (
            <button
              onClick={onHideTab}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer text-xs shadow-2xs"
              title="Hide Code Editor tab for this course"
            >
              <EyeOff size={13} />
              <span className="hidden sm:inline text-[11px]">Hide Tab</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Primary RUN Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm hover:shadow-emerald-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            title="Run Code (⌘+Enter / Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" />
                <span>Run Code</span>
                <span className="hidden md:inline-block text-[10px] font-normal opacity-70 ml-0.5">
                  (⌘+↵)
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Output Split Body */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 ${isFullscreen ? 'flex-1 overflow-hidden' : 'min-h-[460px]'}`}>
        {/* Left Column: Code Textarea with Line Numbers and Real-Time Syntax Highlighting */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151624]">
          <div className="relative flex-1 flex overflow-hidden min-h-[300px] lg:min-h-[460px]">
            {/* Line Number Gutter */}
            <div
              ref={lineNumbersRef}
              className="w-10 sm:w-12 select-none font-mono text-[11px] sm:text-xs text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-[#12131f] border-r border-slate-200/80 dark:border-slate-800/80 overflow-hidden"
              style={{
                boxSizing: 'border-box',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '4px',
                paddingRight: '8px',
                fontSize: `${fontSize}px`,
                lineHeight: `${Math.round(fontSize * 1.6)}px`
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i + 1}
                  style={{
                    height: `${Math.round(fontSize * 1.6)}px`,
                    lineHeight: `${Math.round(fontSize * 1.6)}px`
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Interactive Syntax-Highlighted Editor Container */}
            <div className="relative flex-1 overflow-hidden code-editor-body">
              {/* AI Conversion Overlay */}
              {isConvertingCode && (
                <div className="absolute inset-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Converting code to {LANGUAGES.find(l => l.id === convertingTargetLang)?.label || convertingTargetLang} with AI...
                  </span>
                </div>
              )}

              {/* Syntax Highlighted Layer (Background) */}
              <pre
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none select-none text-slate-800 dark:text-[#cdd6f4] bg-transparent"
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  border: 'none',
                  boxSizing: 'border-box',
                  fontSize: `${fontSize}px`,
                  lineHeight: `${Math.round(fontSize * 1.6)}px`,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  tabSize: 4,
                  letterSpacing: '0px',
                  wordSpacing: '0px',
                  whiteSpace: 'pre',
                  wordBreak: 'keep-all',
                  overflowWrap: 'normal',
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />

              {/* Editable Textarea (Foreground with transparent text and visible caret) */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder="Write or paste your code here..."
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="absolute inset-0 w-full h-full bg-transparent resize-none focus:outline-none overflow-auto border-none selection:bg-indigo-500/30 selection:text-transparent"
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  border: 'none',
                  boxSizing: 'border-box',
                  fontSize: `${fontSize}px`,
                  lineHeight: `${Math.round(fontSize * 1.6)}px`,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  tabSize: 4,
                  letterSpacing: '0px',
                  wordSpacing: '0px',
                  whiteSpace: 'pre',
                  wordBreak: 'keep-all',
                  overflowWrap: 'normal',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  caretColor: '#6366f1'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Console Output & Stdin Panel (5 Cols Desktop) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-50 dark:bg-[#10111a] min-h-[220px]">
          {/* Panel Tab Selector */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/70 dark:bg-[#161726] border-b border-slate-200 dark:border-slate-800/90 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveBottomTab('output')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                  activeBottomTab === 'output'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Terminal size={12} />
                <span>Console Output</span>
                {executionTime !== null && (
                  <span className="text-[10px] font-mono font-normal opacity-80 text-emerald-600 dark:text-emerald-400">
                    ({executionTime}ms)
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveBottomTab('stdin')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                  activeBottomTab === 'stdin'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Sliders size={12} />
                <span>Input (stdin)</span>
                {stdin.trim() && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                )}
              </button>
            </div>

            {/* Execution status indicator badge */}
            {activeBottomTab === 'output' && (output || errorOutput || executionTime !== null) && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                {exitCode === 0 ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                    <CheckCircle2 size={11} />
                    <span>Success</span>
                  </span>
                ) : exitCode !== null ? (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-800/40">
                    <AlertCircle size={11} />
                    <span>Error</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Panel Body */}
          <div className="flex-1 p-3 overflow-auto flex flex-col font-mono text-xs">
            {activeBottomTab === 'output' ? (
              <div className="flex-1 flex flex-col">
                {isRunning ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <span className="text-xs">Compiling & executing program...</span>
                  </div>
                ) : output || errorOutput ? (
                  <div className="space-y-3">
                    {/* Standard Output */}
                    {output && (
                      <div className="text-slate-800 dark:text-emerald-400 whitespace-pre-wrap leading-relaxed select-text font-mono">
                        {output}
                      </div>
                    )}

                    {/* Standard Error Output */}
                    {errorOutput && (
                      <div className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 whitespace-pre-wrap leading-relaxed select-text font-mono">
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          <AlertCircle size={12} />
                          <span>Standard Error / Traceback:</span>
                        </div>
                        {errorOutput}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-600 select-none">
                    <Terminal size={24} className="mb-2 opacity-50" />
                    <p className="text-xs m-0">Output will appear here after execution.</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">⌘+Enter</kbd> or click <strong>Run Code</strong>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Stdin Input Tab */
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Enter input data passed to program's standard input (stdin):</span>
                  {stdin && (
                    <button
                      onClick={() => setStdin('')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Clear Input
                    </button>
                  )}
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder={`Example for competitive programming:\n5\n1 2 3 4 5`}
                  className="flex-1 w-full p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={8}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
