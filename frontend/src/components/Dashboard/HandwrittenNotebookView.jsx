import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from '../../utils/mathPreprocessor';
import { 
  Copy, Check, Sparkles, BookOpen, PenTool, 
  Grid, AlignLeft, Moon, Share2, ZoomIn, ZoomOut, Bookmark, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * HandwrittenNotebookView
 * Renders standard AI markdown responses into an authentic student digital notebook
 * with ruled/grid paper, handwriting typography, highlighter marks, and post-it notes.
 * No extra AI image tokens required.
 */
export default function HandwrittenNotebookView({
  content = '',
  title = 'Study Notes',
  pageNumber = 1,
  totalPages = 1,
  paperStyle = 'ruled',
  onCopy,
  copied = false,
  isPdfExportMode = false,
  onOpenInCodeEditor,
  CodeEditorBlock
}) {
  const notebookRef = useRef(null);

  // Paper styling class
  const getPaperClass = () => {
    switch (paperStyle) {
      case 'grid':
        return 'notebook-grid-paper border-sky-200/70 dark:border-slate-800';
      case 'chalkboard':
        return 'notebook-chalkboard-paper text-slate-100 border-slate-700/80';
      case 'ruled':
      default:
        return 'notebook-ruled-paper border-amber-200/70 dark:border-slate-800';
    }
  };

  // Clean title text for display
  const cleanedTitle = (title || 'Study Notes')
    .replace(/^#+\s*/, '')
    .replace(/^Topic\s+\d+\s*:\s*/i, '')
    .trim();

  return (
    <div className="space-y-3 font-sans">
      {/* Main Handwritten Notebook Canvas */}
      <div
        ref={notebookRef}
        className={`topic-page-card notebook-page-card relative rounded-2xl border p-4 sm:p-8 transition-all duration-200 shadow-sm overflow-hidden select-text ${getPaperClass()}`}
      >
        {/* Spiral Binder Ring Header Graphic (Pure CSS/SVG) */}
        <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-around px-6 pointer-events-none opacity-40">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shadow-inner"
            />
          ))}
        </div>

        {/* Notebook Top Header Metadata */}
        <div className={`relative pt-3 pb-3 mb-4 border-b flex items-center justify-between gap-3 ${
          paperStyle === 'chalkboard'
            ? 'border-slate-700/80 text-slate-300'
            : 'border-red-300/40 dark:border-rose-500/30 text-slate-400 dark:text-slate-500'
        }`}>
          <div className="flex items-center gap-2 pl-4 sm:pl-7">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider ${
              paperStyle === 'chalkboard'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300/30'
            }`}>
              <Bookmark size={11} />
              <span>Topic {pageNumber} of {totalPages}</span>
            </span>
            <span className={`text-[11px] font-bold italic hidden md:inline ${
              paperStyle === 'chalkboard' ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
            }`}>
              LearnProof AI Study Notes
            </span>
          </div>

          <div className="flex items-center gap-2 pr-2 text-xs font-bold">
            <span className="hidden sm:inline text-slate-400">
              Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>

            {/* In PDF Export mode, hide interactive action buttons */}
            {!isPdfExportMode && onCopy && (
              <button
                onClick={onCopy}
                title="Copy notes"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                  paperStyle === 'chalkboard'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:text-amber-600'
                }`}
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Topic Title with Hand-drawn Wavy Underline (Renders LaTeX math inside title) */}
        <div className="pl-6 sm:pl-10 mb-6">
          <h2 className={`font-handwriting text-2xl sm:text-3xl font-bold tracking-wide leading-tight m-0 ${
            paperStyle === 'chalkboard'
              ? 'text-yellow-200'
              : 'text-slate-900 dark:text-amber-200'
          }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
              components={{
                p: ({ node, ...props }) => <span {...props} />,
              }}
            >
              {preprocessMath(cleanedTitle)}
            </ReactMarkdown>
          </h2>
          {/* Hand-drawn Wavy Underline SVG */}
          <svg
            className={`w-48 sm:w-64 h-3 mt-1 ${
              paperStyle === 'chalkboard' ? 'text-amber-400' : 'text-amber-500/80'
            }`}
            viewBox="0 0 200 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 5.5C25 2 45 7.5 70 4C95 0.5 120 7 145 3.5C170 0 185 6.5 199 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Handwritten Markdown Body */}
        <div className={`font-handwriting pl-6 sm:pl-10 text-base sm:text-lg leading-[30px] sm:leading-[32px] ${
          paperStyle === 'chalkboard'
            ? 'text-slate-100'
            : 'text-slate-900 dark:text-slate-200'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
            components={{
              // Headings with marker aesthetic
              h1: ({ node, ...props }) => (
                <div className="my-5">
                  <h1 className={`font-handwriting text-2xl sm:text-3xl font-bold tracking-wide m-0 ${
                    paperStyle === 'chalkboard' ? 'text-yellow-200' : 'text-indigo-950 dark:text-amber-300'
                  }`} {...props} />
                  <div className={`h-1 w-24 rounded-full mt-1 ${
                    paperStyle === 'chalkboard' ? 'bg-yellow-400 opacity-80' : 'bg-amber-400 opacity-70'
                  }`}></div>
                </div>
              ),
              h2: ({ node, ...props }) => (
                <div className="mt-6 mb-3">
                  <h2 className={`font-handwriting text-xl sm:text-2xl font-bold inline-block px-1 border-b-2 m-0 ${
                    paperStyle === 'chalkboard' 
                      ? 'text-amber-200 border-amber-400' 
                      : 'text-amber-900 dark:text-amber-200 border-amber-400/80'
                  }`} {...props} />
                </div>
              ),
              h3: ({ node, ...props }) => (
                <h3 className={`font-handwriting text-lg sm:text-xl font-bold mt-4 mb-2 m-0 ${
                  paperStyle === 'chalkboard' ? 'text-sky-300' : 'text-sky-950 dark:text-sky-300'
                }`} {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className={`font-handwriting text-base sm:text-lg font-bold mt-3 mb-1 ${
                  paperStyle === 'chalkboard' ? 'text-emerald-300' : 'text-slate-900 dark:text-slate-200'
                }`} {...props} />
              ),

              // Paragraphs aligned with lined paper spacing
              p: ({ node, ...props }) => (
                <p className={`mb-4 leading-relaxed tracking-wide break-words ${
                  paperStyle === 'chalkboard' ? 'text-slate-100' : 'text-slate-900 dark:text-slate-200'
                }`} {...props} />
              ),

              // Highlighted text for **bold** (looks like real chalk / highlighter on notebook)
              strong: ({ node, ...props }) => (
                <strong className={`font-bold tracking-wide ${
                  paperStyle === 'chalkboard' ? 'highlighter-chalk' : 'highlighter-yellow'
                }`} {...props} />
              ),

              // Pen emphasis for *italic*
              em: ({ node, ...props }) => (
                <em className={`font-semibold italic tracking-wide ${
                  paperStyle === 'chalkboard' ? 'text-violet-300' : 'text-indigo-900 dark:text-indigo-300'
                }`} {...props} />
              ),

              // Bullet points with hand-drawn aesthetic
              ul: ({ node, ...props }) => (
                <ul className="my-3 space-y-2 list-none pl-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="my-3 space-y-2 list-decimal pl-5 font-bold" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className={`flex items-start gap-2.5 leading-relaxed tracking-wide ${
                  paperStyle === 'chalkboard' ? 'text-slate-100' : 'text-slate-900 dark:text-slate-200'
                }`} {...props}>
                  <span className={`font-black text-sm select-none shrink-0 mt-0.5 ${
                    paperStyle === 'chalkboard' ? 'text-yellow-300' : 'text-amber-500'
                  }`}>✦</span>
                  <div className="flex-1">{props.children}</div>
                </li>
              ),

              // Blockquotes rendered as Post-it Sticky Notes with Washi Tape
              blockquote: ({ node, ...props }) => (
                <div className="my-6 relative max-w-xl">
                  <div className="sticky-note-card p-4 sm:p-5 font-handwriting text-sm sm:text-base leading-relaxed">
                    <div className="washi-tape"></div>
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 mb-1 text-xs uppercase tracking-wider">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      <span>Key Takeaway / Exam Tip</span>
                    </div>
                    <div className="italic text-slate-900">{props.children}</div>
                  </div>
                </div>
              ),

              // Code snippet rendered as a clean Index Card attached to the notebook
              pre: ({ node, children, ...props }) => <>{children}</>,
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-([a-zA-Z0-9_+#-]+)/.exec(className || '');
                const contentStr = String(children || '');
                const isMultiLine = contentStr.includes('\n');
                const isBlock = inline === false || Boolean(match) || isMultiLine;

                if (!isBlock) {
                  return (
                    <code className={`font-mono text-xs sm:text-sm px-1.5 py-0.5 rounded font-bold ${
                      paperStyle === 'chalkboard'
                        ? 'bg-slate-800 text-amber-300 border border-slate-600'
                        : 'bg-amber-100/80 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-300/50'
                    }`} {...props}>
                      {children}
                    </code>
                  );
                }

                if (CodeEditorBlock) {
                  return (
                    <div className="my-4 font-sans">
                      <CodeEditorBlock className={className || 'language-python'} onOpenInEditor={onOpenInCodeEditor} {...props}>
                        {children}
                      </CodeEditorBlock>
                    </div>
                  );
                }

                return (
                  <div className="my-4 p-3 sm:p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm shadow-md border border-slate-700/80 overflow-x-auto">
                    <pre className="m-0">{children}</pre>
                  </div>
                );
              },

              // Tables rendered with ruled notebook borders
              table: ({ node, ...props }) => (
                <div className={`overflow-x-auto my-5 rounded-xl border shadow-2xs font-sans text-xs sm:text-sm ${
                  paperStyle === 'chalkboard'
                    ? 'border-slate-700 bg-slate-900/60'
                    : 'border-amber-300/60 dark:border-slate-700'
                }`}>
                  <table className="w-full border-collapse" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className={`font-bold border-b ${
                  paperStyle === 'chalkboard'
                    ? 'bg-slate-800 text-amber-300 border-slate-700'
                    : 'bg-amber-100/80 dark:bg-slate-800 text-amber-950 dark:text-amber-200 border-amber-300/60'
                }`} {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody className={`divide-y ${
                  paperStyle === 'chalkboard'
                    ? 'divide-slate-800 bg-slate-900/40 text-slate-100'
                    : 'divide-amber-200/50 dark:divide-slate-800 bg-white/70 dark:bg-slate-900/60'
                }`} {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr className={`${
                  paperStyle === 'chalkboard'
                    ? 'hover:bg-slate-800/40'
                    : 'hover:bg-amber-50/50 dark:hover:bg-slate-800/40'
                } transition-colors`} {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className={`px-3.5 py-2 font-semibold border-r last:border-r-0 ${
                  paperStyle === 'chalkboard'
                    ? 'text-amber-300 border-slate-700'
                    : 'text-amber-950 dark:text-amber-200 border-amber-200/50'
                }`} {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className={`px-3.5 py-2 border-r last:border-r-0 ${
                  paperStyle === 'chalkboard'
                    ? 'text-slate-100 border-slate-700'
                    : 'text-slate-700 dark:text-slate-300 border-amber-200/50'
                }`} {...props} />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Notebook Bottom Signature */}
        <div className="mt-8 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[11px] font-handwriting text-slate-400 dark:text-slate-500 pl-6 sm:pl-10 pr-2">
          <span>✍️ LearnProof AI Classroom Notes</span>
          <span>Page {pageNumber}</span>
        </div>
      </div>
    </div>
  );
}
