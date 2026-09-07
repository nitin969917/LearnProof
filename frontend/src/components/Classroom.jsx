import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlayCircle,
  Play,
  ArrowLeft,
  CheckCircle,
  Check,
  Clock,
  BookOpen,
  MessageSquare,
  FileText,
  Send,
  User,
  Sparkles,
  Image as ImageIcon,
  X,
  Reply,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Bot,
  Copy,
  Plus,
  Download,
  Layers,
  RefreshCw,
  Shuffle,
  Printer
} from "lucide-react";
import { useModal } from "../context/ModalContext";
import YouTube from 'react-youtube';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import 'react-quill-new/dist/quill.snow.css';
import { motion } from "framer-motion";
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

const INDIAN_LANGS = [
  'English', 'Hindi', 'Marathi', 'Bengali', 'Telugu',
  'Tamil', 'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam'
];

const preprocessMarkdown = (text) => {
  if (!text) return "";

  let processed = text;

  // Convert literal escaped newlines (from JSON encoding) to real newlines
  if (processed.includes('\\n')) {
    processed = processed.replace(/\\n/g, '\n');
  }

  // Split multiple block math blocks on the same line (e.g. $$ block1 $$ $$ block2 $$) into separate lines
  processed = processed.replace(/\$\$\s+\$\$/g, '$$$$\n$$$$');

  // Remove literal newlines and carriage returns inside block math delimiters (KaTeX parsing fixes)
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (match, math) => {
    const cleanedMath = math.replace(/[\r\n]+/g, ' ');
    return `$$${cleanedMath}$$`;
  });

  // 1. Convert HTML break tags to newlines BEFORE line-by-line processing
  processed = processed.replace(/<br\s*\/?>/gi, '\n');

  // Fix nested dollar signs inside \boxed{...} (common malformed LaTeX)
  processed = processed.replace(/\\boxed\{([^{}]*)\}/g, (match, content) => {
    return `\\boxed{${content.replace(/\$/g, '')}}`;
  });

  // Repair hybrid/malformed probability expressions like P$A\cap B$=P(A)\,P(B|A) or $P$\Omega$=1$
  // This matches a variety of P$Event$ = Expression styles and standardizes them to $P(Event) = Expression$
  // It uses a negative lookahead to avoid eating conversational text like ", where..." or "and..."
  processed = processed.replace(/(?:\$?P\$([a-zA-Z\\{}_\s\cap\cup\theta\Omega\alpha\beta]+)\$=\s*([a-zA-Z0-9\\|()_\s\\+*/\approx\sim\to{}.,&;!\\~#-]+?)\$?)(?=\s+[a-z]{3,}\b|[\s.,;:!]*$)/g, (match, event, expr) => {
    const cleanEvent = event.replace(/\$/g, '');
    const cleanExpr = expr.replace(/\$/g, '');
    return `$P(${cleanEvent}) = ${cleanExpr}$`;
  });

  // Convert standalone math lines that contain LaTeX commands but are not wrapped in delimiters
  processed = processed.split('\n').map(line => {
    let trimmed = line.trim();
    if (!trimmed) return line;

    // Clean up mismatched leading/trailing delimiters on the line first
    if (trimmed.startsWith('$$') && !trimmed.endsWith('$$')) {
      trimmed = trimmed.substring(2).trim();
    } else if (!trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      trimmed = trimmed.substring(0, trimmed.length - 2).trim();
    }
    if (trimmed.startsWith('$') && !trimmed.endsWith('$')) {
      trimmed = trimmed.substring(1).trim();
    } else if (!trimmed.startsWith('$') && trimmed.endsWith('$')) {
      trimmed = trimmed.substring(0, trimmed.length - 1).trim();
    }

    // Only process if the line contains LaTeX commands OUTSIDE of already delimited math blocks
    const lineWithoutMath = trimmed.replace(/\$\$.*?\$\$/g, '').replace(/\$.*?\$/g, '');
    const hasLatex = /\\[a-zA-Z]+/.test(lineWithoutMath);

    if (hasLatex) {
      const isAlreadyBlock = trimmed.startsWith('$$') && trimmed.endsWith('$$');
      const isAlreadyInline = trimmed.startsWith('$') && trimmed.endsWith('$');

      if (!isAlreadyBlock && !isAlreadyInline) {
        // Strip out \text{...} blocks entirely so text descriptions inside math don't count as conversational words
        let mathOnlyText = trimmed.replace(/\\text\{[^{}]*\}/g, '');

        // Strip all LaTeX commands and math/formatting symbols to count actual English conversational words
        const cleanText = mathOnlyText
          .replace(/\\[a-zA-Z]+/g, '')
          .replace(/[\d$={}+*/<>()\[\]|,\-_.:;?!\s]+/g, ' ');

        const words = cleanText.trim().split(/\s+/).filter(w => {
          const cleanWord = w.replace(/[^a-zA-Z]/g, '');
          return cleanWord.length > 2;
        });

        // If it contains very few non-math English words, it's a math equation block
        if (words.length <= 3) {
          const cleanedLine = trimmed.replace(/\$/g, '');
          if (cleanedLine.includes('=')) {
            return `$$${cleanedLine.trim()}$$`;
          } else {
            return `$${cleanedLine.trim()}$`;
          }
        }
      }
    }
    // Return the cleaned line (with mismatched delimiters stripped) if we processed it
    return trimmed;
  }).join('\n');

  // 2. Convert block math delimiters: \[ or \\[ or any number of backslashes followed by [ to $$
  processed = processed
    .replace(/\\+\[/g, () => '$$')
    .replace(/\\+\]/g, () => '$$');

  // 3. Convert parenthesized inline math delimiters: \(( math )\) to $ math $
  processed = processed.replace(/\\+\(\s*\(\s*(.*?)\s*\)\s*\\+\)/g, (_, math) => `$${math}$`);

  // 4. Convert normal inline math delimiters: \( or \\( to $
  processed = processed
    .replace(/\\+\(/g, () => '$')
    .replace(/\\+\)/g, () => '$');

  // 6. Fix list item question headers starting with a single asterisk:
  processed = processed.replace(/^\*(?=[a-zA-Z0-9])(.*?)\*?$/gm, '**$1**');

  // 7. Fix spaced bold markers at the start of lists like * *Non-negativity : **
  // Safe lookup: only match if the second asterisk is NOT followed by another asterisk (prevents matching * ** list items)
  processed = processed.replace(/\*\s+\*(?!\*)(.*?)\s*\*\*/g, '**$1**');

  // 8. Wrap raw/unwrapped math expressions inside conversational lines in inline math delimiters
  processed = processed.split('\n').map(line => {
    // This matches equations that start with typical math symbols (\, single uppercase letters, brackets, or numbers),
    // contain LaTeX commands, and do not include conversational words, ensuring we don't match already delimited math.
    const regex = /(?<!\$)(?:\\|\b[A-Z]\b|[A-Z]\s*[(_{]|[{([0-9])(?:[a-zA-Z0-9\\|(){}[\]_=<>\-+*/\approx\sim\to&;!~#\s]*?\\[a-zA-Z]+[a-zA-Z0-9\\|(){}[\]_=<>\-+*/\approx\sim\to&;!~#\s]*?)(?=\s+[a-z]{3,}\b|[\s.,;:!]*$)(?!\$)/g;
    return line.replace(regex, (match) => {
      // Clean up internal dollar signs if there are any malformed fragments
      const cleanMatch = match.replace(/\$/g, '');
      return `$${cleanMatch.trim()}$`;
    });
  }).join('\n');

  return processed.trim();
};

// Custom Modern Code Editor Component with Prism Syntax Highlighting
const CodeEditorBlock = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = match ? match[1].toLowerCase() : '';
  const langAliases = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'c',
    cs: 'csharp',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    sql: 'sql',
    html: 'markup',
    xml: 'markup',
    css: 'css',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml'
  };
  const lang = langAliases[rawLang] || rawLang || 'javascript';
  const rawCode = String(children || '').replace(/\n$/, '');

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = useMemo(() => {
    try {
      if (Prism.languages[lang]) {
        return Prism.highlight(rawCode, Prism.languages[lang], lang);
      }
      return Prism.highlight(rawCode, Prism.languages.clike || Prism.languages.javascript, 'javascript');
    } catch {
      return null;
    }
  }, [rawCode, lang]);

  return (
    <div 
      className="my-3 sm:my-4 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#181825] border border-slate-200 dark:border-slate-800 shadow-xs text-left no-tab-swipe"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Code Editor Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-[#11111b] border-b border-slate-200 dark:border-slate-800/90 text-xs select-none">
        <div className="flex items-center gap-2">
          {/* Mac OS Window Dots */}
          <div className="flex items-center gap-1.5 opacity-90">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f38ba8] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#f9e2af] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#a6e3a1] inline-block"></span>
          </div>
          {/* Language Badge */}
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 ml-1">
            {rawLang || 'code'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div 
        className="code-editor-body p-3 sm:p-4 overflow-x-auto text-[11.5px] sm:text-xs leading-relaxed font-mono text-slate-800 dark:text-slate-100"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {highlightedCode ? (
          <pre 
            className="m-0 p-0 bg-transparent font-mono whitespace-pre text-slate-800 dark:text-slate-100"
            dangerouslySetInnerHTML={{ __html: highlightedCode }} 
          />
        ) : (
          <pre className="m-0 p-0 bg-transparent font-mono whitespace-pre text-slate-800 dark:text-slate-100">{rawCode}</pre>
        )}
      </div>
    </div>
  );
};

const cleanTopicTitle = (title, idx) => {
  if (!title || typeof title !== 'string') return `Topic ${idx + 1}`;
  let t = title.trim();
  t = t.replace(/^Chapter\s*(\d+)[:\s-]*/i, 'Topic $1: ');
  t = t.replace(/^Chapter\s*(\d+)$/i, 'Topic $1');
  return t;
};

const parseIntuitionData = (raw) => {
  if (!raw) return null;

  const extractWithRegex = (str) => {
    try {
      const catMatch = str.match(/"subjectCategory"\s*:\s*"([^"]+)"/);
      const labelMatch = str.match(/"categoryLabel"\s*:\s*"([^"]+)"/);
      const timeMatch = str.match(/"estimatedReadTimeMinutes"\s*:\s*(\d+)/);

      const pageRegex = /\{\s*"pageNumber"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)(?="\s*\}\s*(?:,|\]))/g;
      const pages = [];
      let m;
      while ((m = pageRegex.exec(str)) !== null) {
        let content = m[3];
        content = content
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        pages.push({
          pageNumber: parseInt(m[1], 10),
          title: cleanTopicTitle(m[2], pages.length),
          content: content.trim()
        });
      }

      if (pages.length > 0) {
        return {
          subjectCategory: catMatch ? catMatch[1] : 'theory_humanities',
          categoryLabel: labelMatch ? labelMatch[1] : 'Study Notes & Core Intuition',
          estimatedReadTimeMinutes: timeMatch ? parseInt(timeMatch[1], 10) : 5,
          totalPages: pages.length,
          pages: pages
        };
      }
    } catch (e) {}
    return null;
  };

  let obj = null;
  if (typeof raw === 'object') {
    obj = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.includes('"pages"') || trimmed.startsWith('{')) {
      try {
        obj = JSON.parse(trimmed);
      } catch (e) {
        obj = extractWithRegex(trimmed);
      }
    }
  }

  // Check if obj is double-wrapped (e.g. pages[0].content contains the real JSON)
  if (obj && Array.isArray(obj.pages) && obj.pages.length === 1 && typeof obj.pages[0].content === 'string') {
    const innerStr = obj.pages[0].content.trim();
    if (innerStr.includes('"pages"') && (innerStr.startsWith('{') || innerStr.startsWith('```'))) {
      try {
        const cleanedInner = innerStr.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim();
        const unwrapped = JSON.parse(cleanedInner);
        if (unwrapped && Array.isArray(unwrapped.pages) && unwrapped.pages.length > 0) {
          obj = unwrapped;
        }
      } catch (e) {
        const unwrappedRegex = extractWithRegex(innerStr);
        if (unwrappedRegex && unwrappedRegex.pages.length > 0) {
          obj = unwrappedRegex;
        }
      }
    }
  }

  if (obj && Array.isArray(obj.pages) && obj.pages.length > 0) {
    return {
      subjectCategory: obj.subjectCategory || 'theory_humanities',
      categoryLabel: obj.categoryLabel || 'Study Notes & Core Intuition',
      estimatedReadTimeMinutes: obj.estimatedReadTimeMinutes || 5,
      totalPages: obj.pages.length,
      pages: obj.pages.map((p, idx) => {
        let contentStr = typeof p.content === 'string' ? p.content.trim() : JSON.stringify(p.content);
        if (contentStr.includes('\\n')) {
          contentStr = contentStr.replace(/\\n/g, '\n');
        }
        return {
          pageNumber: p.pageNumber || idx + 1,
          title: cleanTopicTitle(p.title, idx),
          content: contentStr
        };
      })
    };
  }

  if (typeof raw === 'string') {
    let plainContent = raw.trim();
    if (plainContent.includes('\\n')) {
      plainContent = plainContent.replace(/\\n/g, '\n');
    }
    return {
      subjectCategory: 'theory_humanities',
      categoryLabel: 'Study Notes & Core Intuition',
      estimatedReadTimeMinutes: Math.max(3, Math.round(plainContent.split(/\s+/).length / 180)),
      totalPages: 1,
      pages: [
        {
          pageNumber: 1,
          title: 'Topic 1: Comprehensive Study Notes',
          content: plainContent
        }
      ]
    };
  }

  return null;
};

const getDynamicSuggestedQuestions = (video, parsedIntuition, seed = 0) => {
  const rawTitle = video?.name || '';
  // Clean title: remove chapter numbers, prefixes like "5.5 ", "1.2 - ", "#10 "
  const cleanTitle = rawTitle.replace(/^[0-9]+(\.[0-9]+)*[\s\-:]+/, '').replace(/^#\d+[\s\-:]*/, '').trim() || 'this lecture';
  
  // Extract topic titles if available
  const topics = (parsedIntuition?.pages || [])
    .map(p => p.title?.replace(/^Topic\s*\d+[:\s-]*/i, '').trim())
    .filter(Boolean);
    
  const t1 = topics[0] || cleanTitle;
  const t2 = topics[1] || topics[0] || cleanTitle;
  const category = parsedIntuition?.subjectCategory || 'theory';

  // Construct a rich, topic-grounded question pool
  const pool = [
    {
      icon: "💡",
      text: `Can you explain ${cleanTitle} in simple terms with an intuitive analogy?`,
      badge: "Core Intuition"
    },
    {
      icon: "⚙️",
      text: `How does ${t1} work step-by-step under the hood?`,
      badge: "Deep Dive"
    },
    {
      icon: "📝",
      text: `What are the most common exam and technical interview questions on ${cleanTitle}?`,
      badge: "Exam Prep"
    },
    category === 'coding' || /code|python|java|c\+\+|javascript|sql|os|algorithm|deadlock|thread|process|database/i.test(rawTitle)
      ? {
          icon: "💻",
          text: `Can you give a clean code / pseudo-code implementation demonstrating ${t1}?`,
          badge: "Practical Code"
        }
      : category === 'math_science' || /math|calculus|algebra|physics|chemistry|equation|theorem/i.test(rawTitle)
      ? {
          icon: "📐",
          text: `Summarize the key mathematical formulas, variables, and step-by-step proofs for this lecture.`,
          badge: "Formulas"
        }
      : {
          icon: "⚡",
          text: `What are the practical real-world applications and industrial trade-offs of ${t1}?`,
          badge: "Applications"
        },
    {
      icon: "⚠️",
      text: `What common misconceptions or mistakes do students make when answering questions on ${cleanTitle}?`,
      badge: "Common Pitfalls"
    },
    {
      icon: "🔄",
      text: `How does ${t1} compare with alternative approaches or related concepts?`,
      badge: "Trade-offs"
    },
    {
      icon: "🎯",
      text: `What core problem does ${cleanTitle} solve and why is it important in real systems?`,
      badge: "Big Picture"
    },
    {
      icon: "🧠",
      text: `Can you provide a quick 2-minute revision summary covering ${t2}?`,
      badge: "Quick Revision"
    }
  ];

  const start = (seed * 4) % pool.length;
  const selected = [];
  for (let i = 0; i < 4; i++) {
    selected.push(pool[(start + i) % pool.length]);
  }
  return selected;
};

const extractFollowUpQuestions = (content) => {
  if (!content) return [];
  const followUpMatch = content.match(/(?:Suggested Next Questions|Next Recommended Questions|Recommended Follow-ups)[\s\S]*?(?:$)/i);
  if (!followUpMatch) return [];
  
  const section = followUpMatch[0];
  const questions = [];
  const lines = section.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      const q = trimmed.replace(/^[-*\d.]+\s*/, '').replace(/[*_`#]/g, '').trim();
      if (q && q.length > 5 && q.length < 160 && (q.endsWith('?') || q.includes('How') || q.includes('What') || q.includes('Why') || q.includes('Explain') || q.includes('Can') || q.includes('Compare') || q.includes('Give'))) {
        questions.push(q);
      }
    }
  }
  return questions.slice(0, 3);
};

const getCategoryStyle = (category) => {
  switch (category) {
    case 'coding':
      return {
        badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: '💻',
        activePill: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20',
        accentBorder: 'border-emerald-500/30'
      };
    case 'math_science':
      return {
        badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
        icon: '📐',
        activePill: 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sky-500/20',
        accentBorder: 'border-sky-500/30'
      };
    case 'business_finance':
      return {
        badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: '📈',
        activePill: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-500/20',
        accentBorder: 'border-amber-500/30'
      };
    case 'tutorial_workflow':
      return {
        badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
        icon: '🛠️',
        activePill: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/20',
        accentBorder: 'border-cyan-500/30'
      };
    default:
      return {
        badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
        icon: '📚',
        activePill: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20',
        accentBorder: 'border-indigo-500/30'
      };
  }
};

const Classroom = () => {

  const { user, token, loading: authLoading } = useAuth();
  const { confirm } = useModal();
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [player, setPlayer] = useState(null);
  const [playerError, setPlayerError] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [hasSeeked, setHasSeeked] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [hasCancelledOverlay, setHasCancelledOverlay] = useState(false);

  // Track continuous progress to avoid spamming the backend
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  // Tabs State
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState("");
  const [noteFiles, setNoteFiles] = useState([]); // Saved files from server
  const [newNoteFiles, setNewNoteFiles] = useState([]); // Pending files to upload
  const [deletedFileIds, setDeletedFileIds] = useState([]); // IDs of server files marked for deletion
  const [previewFile, setPreviewFile] = useState(null); // File to show in popup modal
  const [savingNote, setSavingNote] = useState(false);
  const latestProgressRef = useRef(0);
  const activeVideoRef = useRef(null); // Ref for auto-scrolling
  const playerContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Playlist Pagination State
  const [playlistPage, setPlaylistPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // AI Doubt Chatbot State (Inside AI Intuition / Chatbot Tab)
  const [aiChatMessages, setAiChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`learnproof_ai_chat_${videoId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const aiChatBottomRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom of AI chat when new messages arrive or loading
    if (activeTab === 'ai-chat') {
      aiChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, aiChatLoading, activeTab]);

  useEffect(() => {
    // Load persisted AI chat when changing videos
    if (videoId) {
      try {
        const saved = localStorage.getItem(`learnproof_ai_chat_${videoId}`);
        setAiChatMessages(saved ? JSON.parse(saved) : []);
      } catch {
        setAiChatMessages([]);
      }
      setAiChatInput('');
      setAiChatLoading(false);
    }
  }, [videoId]);

  const updateAiMessages = (newMessages) => {
    setAiChatMessages(newMessages);
    if (videoId) {
      try {
        localStorage.setItem(`learnproof_ai_chat_${videoId}`, JSON.stringify(newMessages));
      } catch (e) {
        console.error('Failed to save AI chat to storage', e);
      }
    }
  };

  const handleStartNewChat = () => {
    updateAiMessages([]);
    setAiChatInput('');
    toast.success('Started a new conversation!');
  };

  const handleSendAiQuestion = async (customQuestion) => {
    const question = (customQuestion || aiChatInput).trim();
    if (!question || aiChatLoading || !video?.vid) return;

    const userMsg = { role: 'user', content: question, timestamp: new Date() };
    const updatedWithUser = [...aiChatMessages, userMsg];
    updateAiMessages(updatedWithUser);
    setAiChatInput('');
    setAiChatLoading(true);

    try {
      const token = localStorage.getItem('google_token');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/video-ask-ai/`, {
        videoId: video.vid,
        question,
        chatHistory: aiChatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        language: selectedLanguage || 'English'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data.answer) {
        const aiMsg = { role: 'assistant', content: res.data.answer, timestamp: new Date() };
        updateAiMessages([...updatedWithUser, aiMsg]);
      } else {
        throw new Error('No answer received');
      }
    } catch (err) {
      console.error('Error asking AI doubt:', err);
      toast.error('Failed to get answer from AI. Please try again.');
      updateAiMessages([...updatedWithUser, {
        role: 'assistant',
        content: '⚠️ I encountered an issue connecting to the AI tutor. Please check your network and try asking again.',
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelectVideo = (targetVid) => {
    setShowNextOverlay(false);
    setHasCancelledOverlay(false);
    setPlayer(null);
    navigate(`/classroom/${targetVid}`);
  };

  const currentIdx = playlist?.videos && video ? playlist.videos.findIndex(v => v.vid === video.vid) : -1;
  const nextVideo = (playlist?.videos && currentIdx !== -1 && currentIdx < playlist.videos.length - 1)
    ? playlist.videos[currentIdx + 1]
    : null;

  // Lock document scroll on desktop so the browser page-level scrollbar is hidden.
  // On mobile (< 1024px) we allow natural page scrolling.
  useEffect(() => {
    const lockScroll = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
      } else {
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
      }
    };
    lockScroll();
    window.addEventListener('resize', lockScroll);
    return () => {
      // Restore scroll when leaving classroom
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      window.removeEventListener('resize', lockScroll);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleFullscreenToggle = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    latestProgressRef.current = liveProgress;
  }, [liveProgress]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // ID of comment being replied to

  const [intuitionContent, setIntuitionContent] = useState("");
  const [modelName, setModelName] = useState("");
  const [loadingIntuition, setLoadingIntuition] = useState(false);
  const [intuitionCountdown, setIntuitionCountdown] = useState(15);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isContinuousView, setIsContinuousView] = useState(false);
  const [copiedChapter, setCopiedChapter] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [generatedPdfName, setGeneratedPdfName] = useState('');
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const pdfOffscreenRef = useRef(null);

  const parsedIntuition = useMemo(() => parseIntuitionData(intuitionContent), [intuitionContent]);
  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const dynamicSuggestions = useMemo(() => getDynamicSuggestedQuestions(video, parsedIntuition, suggestionSeed), [video, parsedIntuition, suggestionSeed]);


  // Quiz State
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 min
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  // Quiz History:
  // - Attempted Quiz History: Submitting a quiz stores exactly what the user selected in the database.
  // - Immediate Review: Added an immediate "Review Answers" button after submission so users can check correct answers without leaving the results screen.
  // - History List: Both the Dashboard and Classroom Video Quiz tab display a list of "Previous Attempts" (filtered for the specific video), which users can click to see a detailed, interactive test review.
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedHistoryQuiz, setSelectedHistoryQuiz] = useState(null);

  // Touch swipe handling for switching Classroom tabs on mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const classroomTabs = useMemo(() => [
    ...(playlist ? [{ id: 'playlist', label: 'Playlist', shortLabel: 'Playlist', icon: PlayCircle, hideOnDesktop: true }] : []),
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: BookOpen },
    { id: 'intuition', label: 'AI Notes', shortLabel: 'AI Notes', icon: Sparkles },
    { id: 'ai-chat', label: 'Ask AI Chatbot', shortLabel: 'AI Chat', icon: Bot },
    { id: 'quiz', label: 'AI Quiz', shortLabel: 'Quiz', icon: CheckCircle },
    { id: 'notes', label: 'Notes', shortLabel: 'Notes', icon: FileText },
    { id: 'discussion', label: `Discussion (${(comments && comments.length) || 0})`, shortLabel: 'Discuss', badge: (comments && comments.length) || 0, icon: MessageSquare },
  ], [playlist, comments]);

  const visibleClassroomTabs = useMemo(() => {
    return classroomTabs.filter(t => !t.hideOnDesktop || (typeof window !== 'undefined' && window.innerWidth < 1024));
  }, [classroomTabs]);

  const handleTouchStart = (e) => {
    // Never switch tabs via swipe when on AI Notes, AI Chat, or touching any scrollable elements/tables/code/buttons
    if (activeTab === 'intuition' || activeTab === 'ai-chat') {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    if (e.target?.closest?.('.no-tab-swipe, .overflow-x-auto, table, pre, code, select, button, input, textarea, .intuition-markdown')) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    setTouchEnd(null);
    if (e.targetTouches?.[0]) {
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const handleTouchMove = (e) => {
    if (activeTab === 'intuition' || activeTab === 'ai-chat') return;
    if (e.target?.closest?.('.no-tab-swipe, .overflow-x-auto, table, pre, code, select, button, input, textarea, .intuition-markdown')) return;
    if (e.targetTouches?.[0]) {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const handleTouchEnd = () => {
    if (activeTab === 'intuition' || activeTab === 'ai-chat') {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5 && Math.abs(distanceX) > minSwipeDistance) {
      const idx = visibleClassroomTabs.findIndex(t => t.id === activeTab);
      if (idx !== -1) {
        if (distanceX > 0 && idx < visibleClassroomTabs.length - 1) {
          // Swipe Left -> next tab
          setActiveTab(visibleClassroomTabs[idx + 1].id);
        } else if (distanceX < 0 && idx > 0) {
          // Swipe Right -> previous tab
          setActiveTab(visibleClassroomTabs[idx - 1].id);
        }
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    const el = document.getElementById(`classroom-tab-${activeTab}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  const fetchDiscussionData = async () => {
    try {
      const noteRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/video-note/?idToken=${token}&videoId=${videoId}`);
      setNoteContent(noteRes.data.content || "");
      if (noteRes.data.files && noteRes.data.files.length > 0) {
        setNoteFiles(noteRes.data.files.map(f => ({
          id: f.id,
          url: f.file.startsWith('http') ? f.file : `${import.meta.env.VITE_BACKEND_URL}/${f.file}`,
          name: f.original_name || f.file.split('/').pop()
        })));
      } else {
        setNoteFiles([]);
      }

      const commentRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/video-comment/?idToken=${token}&videoId=${videoId}`);
      setComments(commentRes.data || []);
    } catch (err) {
      console.error("Failed to fetch notes or comments", err);
    }
  };

  const fetchIntuition = async (lang = null, forceRefresh = false) => {
    // If a specific language is requested or forceRefresh, we fetch
    if (!lang && !forceRefresh && intuitionContent) return;

    setLoadingIntuition(true);
    if (lang) setSelectedLanguage(lang); // Track the user's choice

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/video-intuition/?idToken=${token}&videoId=${videoId}${lang ? `&targetLanguage=${lang}` : ''}${forceRefresh ? '&refresh=true' : ''}`;
      const res = await axios.get(url);
      setIntuitionContent(res.data.content);
      setModelName(res.data.model_name || "");
      setActiveChapterIndex(0);
      if (forceRefresh) {
        toast.success("Regenerated deep, multi-topic study notes!");
      }
    } catch (err) {
      console.error("Failed to fetch intuition", err);
      toast.error("Failed to generate intuition.");
    } finally {
      setLoadingIntuition(false);
    }
  };

  const handleCopyChapter = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedChapter(true);
    toast.success("Topic notes copied to clipboard!");
    setTimeout(() => setCopiedChapter(false), 2000);
  };

  const downloadPdfBlob = async (blob, fileName) => {
    // 1. If Web Share API is available (iOS Safari, Android Chrome, Capacitor WebViews), open native Save/Share Sheet
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'LearnProof AI Study Notes'
        });
        toast.success("PDF saved / shared successfully!");
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // User dismissed share sheet
      console.warn('Share API fallback to browser download:', e);
    }

    // 2. Standard browser anchor download
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    downloadLink.target = '_blank';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    toast.success("PDF downloaded to your device!");
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }, 1500);
  };

  const generatePdfBlob = async (containerElement) => {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    const sanitizeColorsInDoc = (clonedDoc) => {
      const dummyCanvas = clonedDoc.createElement('canvas');
      dummyCanvas.width = 1;
      dummyCanvas.height = 1;
      const ctx = dummyCanvas.getContext('2d');

      const sanitizeColorValue = (val) => {
        if (!val || typeof val !== 'string') return val;
        if (!val.includes('oklch') && !val.includes('lab') && !val.includes('color(')) return val;
        try {
          ctx.fillStyle = '#000000';
          ctx.fillStyle = val;
          return ctx.fillStyle;
        } catch (e) {
          return '#000000';
        }
      };

      const allElements = clonedDoc.querySelectorAll('*');
      const colorProps = [
        'color', 'backgroundColor', 'borderColor',
        'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
        'outlineColor', 'textDecorationColor', 'fill', 'stroke'
      ];

      allElements.forEach((el) => {
        const computed = clonedDoc.defaultView ? clonedDoc.defaultView.getComputedStyle(el) : null;
        colorProps.forEach((prop) => {
          if (el.style && el.style[prop] && (el.style[prop].includes('oklch') || el.style[prop].includes('lab') || el.style[prop].includes('color('))) {
            el.style[prop] = sanitizeColorValue(el.style[prop]);
          } else if (computed && computed[prop] && (computed[prop].includes('oklch') || computed[prop].includes('lab') || computed[prop].includes('color('))) {
            el.style[prop] = sanitizeColorValue(computed[prop]);
          }
        });

        if (el.style && el.style.boxShadow && (el.style.boxShadow.includes('oklch') || el.style.boxShadow.includes('lab'))) {
          el.style.boxShadow = 'none';
        }
      });
    };

    const pageCards = containerElement.querySelectorAll('.pdf-topic-page-card');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 mm
    const pageHeight = 297; // A4 mm

    if (pageCards && pageCards.length > 0) {
      for (let i = 0; i < pageCards.length; i++) {
        const card = pageCards[i];
        const canvas = await html2canvas(card, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          onclone: (clonedDoc) => {
            sanitizeColorsInDoc(clonedDoc);
          }
        });

        const cardHeightMm = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        if (i > 0) pdf.addPage();

        if (cardHeightMm <= pageHeight) {
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, cardHeightMm, '', 'FAST');
        } else {
          let remainingHeight = cardHeightMm;
          let currentPos = 0;
          pdf.addImage(imgData, 'JPEG', 0, currentPos, imgWidth, cardHeightMm, '', 'FAST');
          remainingHeight -= pageHeight;
          while (remainingHeight > 0) {
            currentPos -= pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, currentPos, imgWidth, cardHeightMm, '', 'FAST');
            remainingHeight -= pageHeight;
          }
        }
      }
    } else {
      const canvas = await html2canvas(containerElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc) => {
          sanitizeColorsInDoc(clonedDoc);
        }
      });

      const totalHeightMm = (canvas.height * imgWidth) / canvas.width;
      let remaining = totalHeightMm;
      let pos = 0;
      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      pdf.addImage(imgData, 'JPEG', 0, pos, imgWidth, totalHeightMm, '', 'FAST');
      remaining -= pageHeight;

      while (remaining > 0) {
        pos -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, pos, imgWidth, totalHeightMm, '', 'FAST');
        remaining -= pageHeight;
      }
    }

    return pdf.output('blob');
  };

  const handleOpenPdfPreview = () => {
    if (!parsedIntuition || !parsedIntuition.pages || parsedIntuition.pages.length === 0) {
      toast.error("Please generate study notes first.");
      return;
    }

    const titleStr = video?.name || 'Lecture Study Notes';
    const sanitized = titleStr.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 60);
    const fileName = `${sanitized}_Study_Notes.pdf`;
    setGeneratedPdfName(fileName);

    setShowPdfPreviewModal(true);
  };

  const handleDownloadGeneratedPdf = async () => {
    const titleStr = video?.name || 'Lecture Study Notes';
    const sanitized = titleStr.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 60);
    const fileName = `${sanitized}_Study_Notes.pdf`;

    if (generatedPdfBlob) {
      await downloadPdfBlob(generatedPdfBlob, fileName);
      return;
    }

    setDownloadingPdf(true);
    const toastId = toast.loading("Compiling high-resolution PDF document...");
    try {
      if (!pdfOffscreenRef.current) throw new Error("Template not mounted");

      const pdfBlob = await generatePdfBlob(pdfOffscreenRef.current);
      setGeneratedPdfBlob(pdfBlob);
      setGeneratedPdfUrl(URL.createObjectURL(pdfBlob));
      toast.dismiss(toastId);
      await downloadPdfBlob(pdfBlob, fileName);
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Download encountered an issue. Opening print dialog...", { id: toastId });
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };


  const fetchQuizHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-history/?idToken=${token}`);
      // Only keep history relevant to this specific video
      const historyForVideo = res.data.filter(q => {
        // Try all possible matches to be super resilient
        const matchesVid = q.video?.vid && String(q.video.vid) === String(videoId);
        const matchesDbId = video?.id && q.videoId === video.id;
        const matchesRawVid = q.videoId && String(q.videoId) === String(videoId); // Fallback

        return (matchesVid || matchesDbId || matchesRawVid) && q.score !== null;
      });
      setQuizHistory(historyForVideo);
    } catch (err) {
      console.error("Failed to fetch quiz history", err);
    }
  };

  const handleDeleteQuizHistory = async (id) => {
    if (!id || !token) return;
    if (!window.confirm("Are you sure you want to delete this quiz attempt?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-history/${id}?idToken=${token}`);
      toast.success("Quiz attempt deleted");
      if (selectedHistoryQuiz?.id === id) {
        setSelectedHistoryQuiz(null);
      }
      fetchQuizHistory();
    } catch (err) {
      console.error("Failed to delete quiz history attempt:", err);
      toast.error("Failed to delete quiz attempt");
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-orange-50 dark:bg-gray-900 text-orange-600 dark:text-orange-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xl font-semibold">Resuming session...</span>
        </div>
      </div>
    );
  }

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const formData = new FormData();
      formData.append('idToken', token);
      formData.append('videoId', videoId);
      formData.append('content', noteContent);

      // Append array of new files
      newNoteFiles.forEach(file => {
        formData.append('new_files', file);
      });

      // Append array of deleted file IDs
      if (deletedFileIds.length > 0) {
        formData.append('deleted_file_ids', JSON.stringify(deletedFileIds));
      }

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/video-note/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Sync back down with exact server state
      if (res.data.files) {
        setNoteFiles(res.data.files.map(f => ({
          id: f.id,
          url: f.file.startsWith('http') ? f.file : `${import.meta.env.VITE_BACKEND_URL}/${f.file}`,
          name: f.original_name || f.file.split('/').pop()
        })));
      } else {
        setNoteFiles([]);
      }
      setNewNoteFiles([]); // Clear pending uploads
      setDeletedFileIds([]); // Clear pending deletions

      toast.success("Note saved successfully");
    } catch (err) {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/video-comment/`, {
        idToken: token,
        videoId: videoId,
        content: newComment,
        parent_id: replyTo // Include parent if replying
      });

      if (replyTo) {
        // Find parent and add reply locally (or just re-fetch)
        // For simplicity and to ensure correct ordering, let's re-fetch or update existing tree
        setComments(comments.map(c => {
          if (c.id === replyTo) {
            return { ...c, replies: [...(c.replies || []), res.data] };
          }
          return c;
        }));
      } else {
        setComments([...comments, res.data]);
      }

      setNewComment("");
      setReplyTo(null);
      toast.success("Comment posted");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = await confirm({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment? This cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/video-comment/`, {
        data: { idToken: token, commentId }
      });

      // Remove from state
      const removeNode = (list) => {
        return list
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies ? removeNode(c.replies) : []
          }));
      };

      setComments(removeNode(comments));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };



  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/classroom/`,
          {
            idToken: token,
            videoId: videoId,
          }
        );

        setVideo(res.data.video);
        setLiveProgress(res.data.video.watch_progress || 0);
        setLastSavedProgress(res.data.video.watch_progress || 0);
        setHasSeeked(false);
        setPlaylist(res.data.playlist);
        if (res.data.playlist && window.innerWidth < 1024) {
          setActiveTab('playlist');
        } else if (!res.data.playlist && activeTab === 'playlist') {
          setActiveTab('overview');
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load classroom");
      } finally {
        setLoading(false);
      }
    };
    if (token && videoId) {
      setPlayer(null); // Reset player reference so stale progress doesn't trigger overlays
      setShowNextOverlay(false); // Reset next video overlay
      setHasCancelledOverlay(false); // Reset next video cancel state
      setIntuitionContent(""); // Clear previous intuition when video changes
      setQuizData(null);
      setQuizResult(null);
      setQuizHistory([]);
      setSelectedHistoryQuiz(null);
      setPlayerError(false); // Reset player error on video change
      fetchClassroom();
      fetchDiscussionData();
    }
  }, [token, videoId]);

  // Sync pagination with active video
  useEffect(() => {
    if (playlist?.videos?.length > 0 && videoId) {
      const vIndex = playlist.videos.findIndex(v => v.vid === videoId);
      if (vIndex !== -1) {
        const pageOfVideo = Math.floor(vIndex / ITEMS_PER_PAGE) + 1;
        setPlaylistPage(pageOfVideo);
      }
    }
  }, [playlist, videoId]);

  // Auto-scroll to the active video in the playlist
  useEffect(() => {
    // Only scroll if we are directly viewing the playlist tab, 
    // or if the video id/playlist itself just loaded on desktop
    if (activeVideoRef.current) {
      if (window.innerWidth >= 1024 || activeTab === 'playlist') {
        // Prevent aggressive document scrolls by safely scrolling within the parent
        activeVideoRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [videoId, playlistPage, activeTab === 'playlist']);

  // Fetch intuition only when the tab is opened
  useEffect(() => {
    if (activeTab === 'intuition') {
      fetchIntuition();
    }
    if (activeTab === 'quiz') {
      fetchQuizHistory();
    }
  }, [activeTab, token, videoId, video]);

  // Intuition Generation Countdown
  useEffect(() => {
    let interval;
    if (loadingIntuition) {
      setIntuitionCountdown(15);
      interval = setInterval(() => {
        setIntuitionCountdown(prev => (prev > 1 ? prev - 1 : 1));
      }, 1000);
    } else {
      setIntuitionCountdown(15);
    }
    return () => clearInterval(interval);
  }, [loadingIntuition]);

  // Quiz Timer
  useEffect(() => {
    if (!quizData) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(); // auto-submit when time runs out
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizData]);

  const handleStartQuiz = async () => {
    setLoadingQuiz(true);
    setQuizResult(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/start-quiz/`, {
        idToken: token,
        contentType: 'video',
        contentId: videoId,
      });
      toast.dismiss();
      setQuizData(res.data.quiz);
      setAnswers({});
      setTimeLeft(res.data.quiz.time_limit * 60); // Use time_limit from backend (convert to seconds)
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to start quiz. Check your connection.";

      if (err.response?.status === 403) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleQuizAnswer = (qIdx, value) => {
    setAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    setSubmittingQuiz(true);
    try {
      const answerList = (quizData?.questions || []).map((_, idx) => answers[idx] || "");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/submit-quiz/`, {
        idToken: token,
        quizId: quizData.quiz_id,
        answers: answerList,
      });
      setQuizResult(res.data);
      await fetchQuizHistory();
      toast.success("Quiz submitted!");
      setQuizData(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const updatePlaylistVideoState = (vid, updates) => {
    setPlaylist(prev => {
      if (!prev || !prev.videos) return prev;
      return {
        ...prev,
        videos: prev.videos.map(v => 
          v.vid === vid ? { ...v, ...updates } : v
        )
      };
    });
  };

  const markAsCompleted = async () => {
    if (!video) return;
    setMarking(true);
    const loader = toast.loading("Marking as completed...");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/mark-completed/`, {
        idToken: token,
        videoId: video.vid,
      });
      toast.success("Marked as completed", { id: loader });
      setVideo({ ...video, watch_progress: 100, is_completed: true });
      setLiveProgress(100);
      updatePlaylistVideoState(video.vid, { watch_progress: 100, is_completed: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as completed", { id: loader });
    } finally {
      setMarking(false);
    }
  };

  const unmarkAsCompleted = async () => {
    if (!video) return;
    setMarking(true);
    const loader = toast.loading("Unmarking as completed...");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/unmark-completed/`, {
        idToken: token,
        videoId: video.vid,
      });
      toast.success("Unmarked", { id: loader });
      setVideo({ ...video, watch_progress: 0, is_completed: false });
      setLiveProgress(0);
      updatePlaylistVideoState(video.vid, { watch_progress: 0, is_completed: false });
    } catch (err) {
      console.error(err);
      toast.error("Failed to unmark", { id: loader });
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => {
    let interval;
    if (player && player.getCurrentTime && video && video.vid === videoId) {
      interval = setInterval(async () => {
        try {
          if (!player || !player.getCurrentTime) return;
          const currentTime = await player.getCurrentTime();
          const duration = await player.getDuration();

          if (duration > 0 && currentTime > 0) {
            const percentRaw = (currentTime / duration) * 100;
            const percentage = Math.round(percentRaw);

            setLiveProgress(percentage);

            // Auto-trigger next overlay to block YouTube annotations (which can start up to 20s before the end)
            // Ensure video has actually played past 50% and is for current videoId
            const triggerOffset = duration > 60 ? 20 : (duration * 0.1);
            if (
              duration - currentTime <= triggerOffset && 
              currentTime >= duration * 0.5 && 
              nextVideo && 
              !showNextOverlay && 
              !hasCancelledOverlay &&
              video.vid === videoId
            ) {
              console.log(`Auto-triggering next overlay ${triggerOffset}s before end to block annotations`);
              setShowNextOverlay(true);
            }

            // Only save to backend every 2% changes or if it reached >95%
            if (percentage > lastSavedProgress + 2 || (percentage > 95 && lastSavedProgress <= 95)) {
              console.log("Saving progress to backend:", percentage);
              setLastSavedProgress(percentage);

              if (percentage >= 95 && !video.is_completed) {
                // Auto-mark completed
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/mark-completed/`, {
                  idToken: token,
                  videoId: video.vid,
                });
                setVideo(prev => ({ ...prev, watch_progress: 100, is_completed: true }));
                updatePlaylistVideoState(video.vid, { watch_progress: 100, is_completed: true });
              } else {
                // Just update partial progress
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/update-progress/`, {
                  idToken: token,
                  videoId: video.vid,
                  progress: percentage
                });
                setVideo(prev => ({ ...prev, watch_progress: percentage }));
                updatePlaylistVideoState(video.vid, { watch_progress: percentage });
              }
            }
          }
        } catch (err) {
          // Ignore player errors during unmounts/loading
        }
      }, 1000); // Check every 1 second
    }

    // POLICY COMPLIANCE: Pause video if tab is hidden (No background playback)
    const handleVisibilityChange = () => {
      if (document.hidden && player && player.pauseVideo) {
        player.pauseVideo();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Final save on unmount/video change if progress changed
      if (latestProgressRef?.current > lastSavedProgress) {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/update-progress/`, {
          idToken: token,
          videoId: video?.vid,
          progress: latestProgressRef.current
        }).catch(() => { });
      }
    };
  }, [player, video, videoId, lastSavedProgress, token, nextVideo, showNextOverlay, hasCancelledOverlay]);

  const handlePlayerStateChange = async (event) => {
    // YT.PlayerState.PLAYING is 1
    if (event.data === 1) {
      if (!hasSeeked && video?.watch_progress > 0 && video?.watch_progress < 98) {
        setHasSeeked(true);
        const duration = await event.target.getDuration();
        if (duration > 0) {
          const seekSeconds = (video.watch_progress / 100) * duration;
          event.target.seekTo(seekSeconds);
          setLastSavedProgress(video.watch_progress);
        }
      }
      
      // Auto-restore playback speed
      const savedSpeed = parseFloat(localStorage.getItem('learnproof_playback_speed') || '1');
      if (savedSpeed !== 1) {
        event.target.setPlaybackRate(savedSpeed);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-orange-500 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
          <p className="text-lg text-gray-700 font-medium">Loading classroom...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your content</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Video Not Found</h2>
          <p className="text-gray-600">The requested video could not be loaded.</p>
          <button
            onClick={() => {
              if (playlist?.pid) {
                navigate(`/dashboard/playlist/${playlist.pid}`);
              } else {
                navigate(-1);
              }
            }}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto uppercase text-[10px] font-black tracking-widest"
          >
            <ArrowLeft size={16} /> Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-0 lg:h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto lg:h-screen lg:overflow-hidden">
        {/* Premium Header */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
            <button
              onClick={() => {
                if (playlist?.pid) {
                  navigate(`/dashboard/playlist/${playlist.pid}`);
                } else {
                  navigate(-1);
                }
              }}
              className="group flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-orange-500 text-sm font-black uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Live progress chip */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">{Math.round(liveProgress)}% watched</span>
              </div>

              <button
                onClick={video.is_completed ? unmarkAsCompleted : markAsCompleted}
                disabled={marking}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${video.is_completed
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100'
                    : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30'
                  }`}
              >
                {marking ? (
                  <div className={`animate-spin rounded-full h-4 w-4 border-2 ${video.is_completed ? 'border-green-500 border-t-transparent' : 'border-white border-t-transparent'}`}></div>
                ) : (
                  <CheckCircle size={14} />
                )}
                <span className="hidden sm:inline">
                  {video.is_completed ? 'Completed ✓' : 'Mark as Done'}
                </span>
                <span className="sm:hidden">
                  {video.is_completed ? '✓' : 'Done'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 lg:overflow-y-auto w-full max-w-full bg-white dark:bg-gray-900 transition-colors duration-200">
          {/* Enhanced Video Player */}
          <div ref={playerContainerRef} className="bg-black relative shadow-2xl aspect-video w-full flex items-center justify-center shrink-0">
            <YouTube
              key={video.vid}
              videoId={video.vid}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  playsinline: 1,
                  rel: 0,
                  modestbranding: 0,
                  enablejsapi: 1,
                  origin: typeof window !== 'undefined' ? window.location.origin : 'https://learnproofai.com'
                }
              }}
              className="absolute top-0 left-0 w-full h-full"
              containerClassName="w-full h-full absolute inset-0"
              onReady={(e) => {
                setPlayer(e.target);
                setPlayerError(false);
                // Auto-restore playback speed
                const savedSpeed = parseFloat(localStorage.getItem('learnproof_playback_speed') || '1');
                if (savedSpeed !== 1) {
                  e.target.setPlaybackRate(savedSpeed);
                }
              }}
              onStateChange={handlePlayerStateChange}
              onPlaybackRateChange={(e) => {
                const newRate = e.data;
                console.log("Playback speed changed to:", newRate);
                localStorage.setItem('learnproof_playback_speed', newRate.toString());
              }}
              onEnd={() => {
                if (nextVideo) {
                  console.log("Video ended, triggering next overlay");
                  setShowNextOverlay(true);
                  // Exit native iframe fullscreen so overlay is visible
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                }
              }}
              onError={() => setPlayerError(true)}
            />

            {/* Fallback overlay when YouTube blocks embedding */}
            {playerError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-gray-950 text-white text-center px-6">
                <div className="p-5 bg-red-500/10 rounded-full border border-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black mb-2">Embedding Restricted</h3>
                  <p className="text-gray-400 text-sm max-w-sm">The video owner has disabled embedded playback. You can still watch this video directly on YouTube.</p>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${video.vid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-3.5 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-700 transition-all hover:scale-105 shadow-2xl shadow-red-500/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  Watch on YouTube
                </a>
              </div>
            )}

            {/* Custom Next Video recommendation overlay */}
            {showNextOverlay && nextVideo && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 text-white text-center p-2 sm:p-4 transition-all duration-300 animate-fade-in">
                <div className="max-w-[90%] w-[320px] sm:max-w-md bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl flex flex-col items-center gap-2 sm:gap-4">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Next Lesson Up
                  </div>
                  
                  {/* Thumbnail is hidden on mobile to avoid overflow inside portrait player aspect-ratio */}
                  <div className="hidden sm:block relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg group">
                    <img 
                      src={`https://img.youtube.com/vi/${nextVideo.vid}/hqdefault.jpg`} 
                      alt={nextVideo.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg cursor-pointer" onClick={() => handleSelectVideo(nextVideo.vid)}>
                        <Play size={18} className="text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center px-1 sm:px-2">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-100 line-clamp-1 sm:line-clamp-2 leading-snug">
                      {nextVideo.name}
                    </h4>
                  </div>

                  <div className="flex gap-2 sm:gap-3 w-full mt-1 sm:mt-2">
                    <button 
                      onClick={() => {
                        setShowNextOverlay(false);
                        setHasCancelledOverlay(true);
                      }} 
                      className="flex-1 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-lg sm:rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSelectVideo(nextVideo.vid)}
                      className="flex-1 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-lg sm:rounded-xl transition-all shadow-lg shadow-orange-500/25"
                    >
                      Play Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="bg-white dark:bg-gray-900 flex-1 min-w-0 transition-colors duration-200">
            <div className="max-w-5xl mx-auto p-3 sm:p-6 pb-3 sm:pb-6 text-gray-900 dark:text-white">
              <div className="flex items-start gap-2 mb-4">
                <h1 className="text-sm md:text-base font-bold leading-snug flex-1 text-gray-800 dark:text-white line-clamp-2">{video.name}</h1>
                <a
                  href={`https://www.youtube.com/watch?v=${video.vid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Watch on YouTube"
                  className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(liveProgress)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-2 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                  />
                </div>
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest min-w-fit">
                  {Math.round(liveProgress)}%
                </span>
              </div>

              {/* Premium Tabs Switcher - Fixed non-scrollable equal width */}
              <div className="mt-4">
                <div className="w-full grid grid-flow-col auto-cols-fr bg-gray-50/90 dark:bg-slate-800/60 rounded-2xl p-1 sm:p-1.5 gap-0.5 sm:gap-1 border border-gray-200/70 dark:border-slate-700/60">
                  {visibleClassroomTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`classroom-tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-0.5 sm:px-2 rounded-xl text-center transition-all duration-200 select-none cursor-pointer z-10 ${
                          isActive
                            ? 'text-white font-extrabold'
                            : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 font-bold'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeClassroomTabPill"
                            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/25 -z-10"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                          />
                        )}
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 sm:size-[15px]" />
                        <span className="text-[9px] min-[380px]:text-[10px] sm:text-xs tracking-tight truncate max-w-full leading-tight">
                          <span className="hidden lg:inline">{tab.label}</span>
                          <span className="lg:hidden">{tab.shortLabel}</span>
                          {tab.badge > 0 && (
                            <span className="ml-0.5 text-[8px] sm:text-[10px] opacity-80 lg:hidden">({tab.badge})</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div 
                  className="pt-2.5 pb-2 sm:pt-4 sm:pb-6 min-h-[350px] touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {activeTab === 'playlist' && playlist && (() => {
                    const allVideos = playlist.videos || [];
                    const totalPages = Math.ceil(allVideos.length / ITEMS_PER_PAGE);
                    const paginatedVideos = allVideos.slice((playlistPage - 1) * ITEMS_PER_PAGE, playlistPage * ITEMS_PER_PAGE);

                    return (
                      <div className="lg:hidden space-y-4">
                        <div className="space-y-1 divide-y divide-gray-50 dark:divide-slate-800/50">
                          {paginatedVideos.map((v, index) => {
                            const absoluteIndex = (playlistPage - 1) * ITEMS_PER_PAGE + index;
                            const isActive = v.vid === videoId;
                            const progress = Math.round(isActive ? liveProgress : (v.watch_progress || 0));
                            return (
                              <div
                                key={v.vid}
                                ref={isActive ? activeVideoRef : null}
                                onClick={() => handleSelectVideo(v.vid)}
                                className={`group flex gap-3 p-3 cursor-pointer transition-all duration-200 rounded-xl ${isActive
                                    ? 'bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200 dark:ring-orange-900/50'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                                  }`}
                              >
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={`https://img.youtube.com/vi/${v.vid}/default.jpg`}
                                    alt={v.name}
                                    className={`w-20 h-12 object-cover rounded-lg shadow-sm ${isActive ? 'ring-2 ring-orange-400' : ''}`}
                                  />
                                  {(v.is_completed || (v.watch_progress || 0) >= 90) && !isActive && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 z-10" title="Completed">
                                      <Check size={11} strokeWidth={3.5} />
                                    </div>
                                  )}
                                  <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-gray-800 dark:bg-slate-700 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm">
                                    {absoluteIndex + 1}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className={`text-xs font-bold line-clamp-2 mb-1 leading-snug ${isActive ? 'text-orange-600' : 'text-gray-700 dark:text-slate-300'}`}>
                                    {v.name}
                                  </h3>
                                  <div className="h-1 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div style={{ width: `${progress}%` }} className={`h-1 rounded-full ${v.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button
                              disabled={playlistPage === 1}
                              onClick={() => setPlaylistPage(p => p - 1)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-orange-500 transition-colors"
                            >
                              <ArrowLeft size={14} /> Previous
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                              Page {playlistPage} of {totalPages}
                            </span>
                            <button
                              disabled={playlistPage === totalPages}
                              onClick={() => setPlaylistPage(p => p + 1)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-orange-500 transition-colors"
                            >
                              Next <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="prose dark:prose-invert max-w-none break-words overflow-hidden bg-gray-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <div className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-line break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-bold" />
                          }}
                        >
                          {video.description || "No description available for this video."}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Intuition Tab */}
                  {activeTab === 'intuition' && (
                    <div 
                      className="space-y-3 sm:space-y-3.5 no-tab-swipe"
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      {/* Top Action Card: Ask AI Doubt */}
                      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 shadow-2xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="p-1 sm:p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl text-white shadow-2xs shrink-0">
                            <Bot size={15} className="sm:size-[18px]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white m-0 flex items-center gap-1.5 truncate">
                              <span>Have doubts?</span>
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-2xs shrink-0">
                                AI Tutor
                              </span>
                            </h4>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-300 m-0 mt-0.5 truncate hidden xs:block sm:block">
                              Ask questions or get explanations directly from our AI professor.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('ai-chat')}
                          className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg sm:rounded-xl shadow-xs transition hover:scale-105 active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
                        >
                          <Sparkles size={11} className="shrink-0" />
                          <span>AI Chatbot</span>
                        </button>
                      </div>

                      {/* AI Notes & Core Intuition Card */}
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-2.5 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-indigo-800/80 transition-colors duration-200 break-words overflow-hidden shadow-xs">
                        {/* Top Header Bar */}
                        <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 pb-2 sm:pb-3.5 border-b border-indigo-200/80 dark:border-indigo-800">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <div className="p-1 sm:p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-md shrink-0">
                              <Sparkles className="text-indigo-600 dark:text-indigo-400" size={13} />
                            </div>
                            <h3 className="text-xs sm:text-base font-bold text-indigo-900 dark:text-indigo-100 leading-tight m-0 truncate">
                              AI Notes & Study Guide
                            </h3>
                          </div>

                          {/* Top Controls: Language Picker & Actions */}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Open & Download Visual PDF */}
                            {parsedIntuition && (
                              <button
                                onClick={handleOpenPdfPreview}
                                title="Open & Download Interactive Visual PDF Study Guide"
                                className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] sm:text-xs shadow-2xs transition hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <FileText size={11} />
                                <span>PDF</span>
                              </button>
                            )}

                            {/* Regenerate / Refresh */}
                            <button
                              disabled={loadingIntuition}
                              onClick={() => fetchIntuition(selectedLanguage, true)}
                              title="Regenerate In-Depth Notes"
                              className="p-1 sm:p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-gray-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-400 disabled:opacity-50 transition cursor-pointer shadow-2xs"
                            >
                              <RefreshCw size={12} className={loadingIntuition ? 'animate-spin' : ''} />
                            </button>

                            {/* Language Picker Dropdown */}
                            <div className="relative shrink-0">
                              <select
                                disabled={loadingIntuition}
                                onChange={(e) => fetchIntuition(e.target.value)}
                                value={selectedLanguage}
                                className="appearance-none px-2 py-1 pr-5 rounded-lg text-[9px] sm:text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer shadow-2xs transition-all hover:border-indigo-300 dark:hover:border-indigo-500"
                              >
                                <option value="" disabled>Select Language</option>
                                {INDIAN_LANGS.map((lang) => (
                                  <option key={lang} value={lang} className="text-gray-700 dark:text-slate-200">
                                    {lang}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                <ChevronRight size={9} className="rotate-90" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {loadingIntuition ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto">
                            <div className="relative mb-6">
                              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                              <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600 text-lg">
                                {intuitionCountdown}
                              </div>
                            </div>
                            <p className="font-semibold text-sm sm:text-base animate-pulse text-indigo-600 dark:text-indigo-400 text-center m-0">
                              Synthesizing textbook-quality digital study notes...
                            </p>
                            <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70 mt-2 text-center max-w-sm m-0">
                              Classifying subject curriculum & constructing comprehensive topic study notes
                            </p>
                          </div>
                        ) : parsedIntuition ? (
                          <div className="space-y-3 sm:space-y-4">
                            {/* Topic Pill Navigation & View Switcher (for multi-topic notes) */}
                            {parsedIntuition.totalPages > 1 && (
                              <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-800/70 p-1 sm:p-2.5 rounded-xl border border-indigo-100 dark:border-slate-700/60">
                                {/* Topic Pill Selector */}
                                <div 
                                  className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 min-w-0 no-tab-swipe"
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onTouchMove={(e) => e.stopPropagation()}
                                  onTouchEnd={(e) => e.stopPropagation()}
                                >
                                  {parsedIntuition.pages.map((p, idx) => {
                                    const isActive = !isContinuousView && activeChapterIndex === idx;
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          setIsContinuousView(false);
                                          setActiveChapterIndex(idx);
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                                          isActive
                                            ? `${getCategoryStyle(parsedIntuition.subjectCategory).activePill} shadow-xs`
                                            : 'bg-indigo-50/60 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-slate-700'
                                        }`}
                                      >
                                        Topic {p.pageNumber || idx + 1}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Continuous View Switcher */}
                                <div className="flex items-center shrink-0">
                                  <button
                                    onClick={() => setIsContinuousView(!isContinuousView)}
                                    title={isContinuousView ? "Switch to single topic view" : "Read all topics continuously"}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer border whitespace-nowrap ${
                                      isContinuousView
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <Layers size={11} className="shrink-0" />
                                    <span>{isContinuousView ? 'Continuous' : 'Read All'}</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Content Display: Continuous Mode vs Paginated Topic Mode */}
                            {isContinuousView && parsedIntuition.totalPages > 1 ? (
                              <div className="space-y-4 sm:space-y-8">
                                {parsedIntuition.pages.map((page, idx) => (
                                  <div key={idx} className="bg-white/80 dark:bg-slate-900/60 p-3 sm:p-6 rounded-xl border border-indigo-100/80 dark:border-slate-800 shadow-2xs">
                                    <div className="flex items-center justify-between pb-2 sm:pb-3 mb-2.5 sm:mb-4 border-b border-gray-100 dark:border-slate-800">
                                      <h3 className="text-sm sm:text-lg font-bold text-indigo-950 dark:text-indigo-200 m-0">
                                        {page.title}
                                      </h3>
                                      <button
                                        onClick={() => handleCopyChapter(page.content)}
                                        title="Copy Topic Notes"
                                        className="p-1 rounded text-gray-400 hover:text-indigo-600 transition cursor-pointer"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                    <div className="prose max-w-none text-gray-800 dark:text-gray-200 leading-relaxed intuition-markdown">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                          h1: ({ node, ...props }) => <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-5 mb-2.5 break-words" {...props} />,
                                          h2: ({ node, ...props }) => <h2 className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-200 mt-4 mb-2 break-words" {...props} />,
                                          h3: ({ node, ...props }) => <h3 className="text-sm sm:text-base font-bold text-indigo-900 dark:text-indigo-300 first:mt-2 mt-4 mb-2 break-words" {...props} />,
                                          h4: ({ node, ...props }) => <h4 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1.5 break-words" {...props} />,
                                          strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-gray-100 break-words" {...props} />,
                                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                          li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                          p: ({ node, ...props }) => <p className="mb-4 text-gray-800 dark:text-gray-300 break-words" {...props} />,
                                          pre: ({ node, children, ...props }) => <>{children}</>,
                                          code: ({ node, inline, className, children, ...props }) => inline
                                            ? <code className="bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-mono text-[11.5px] sm:text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50 break-all" {...props}>{children}</code>
                                            : <CodeEditorBlock className={className} {...props}>{children}</CodeEditorBlock>,
                                          table: ({ node, ...props }) => (
                                            <div 
                                              className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-2xs no-tab-swipe"
                                              onTouchStart={(e) => e.stopPropagation()}
                                              onTouchMove={(e) => e.stopPropagation()}
                                              onTouchEnd={(e) => e.stopPropagation()}
                                            >
                                              <table className="w-full text-xs sm:text-sm text-left border-collapse" {...props} />
                                            </div>
                                          ),
                                          thead: ({ node, ...props }) => <thead className="bg-indigo-50/80 dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 font-bold border-b border-gray-200 dark:border-slate-700" {...props} />,
                                          tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900/70" {...props} />,
                                          tr: ({ node, ...props }) => <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors" {...props} />,
                                          th: ({ node, ...props }) => <th className="px-3.5 py-2.5 font-semibold text-indigo-900 dark:text-indigo-200 border-r last:border-r-0 border-gray-200 dark:border-slate-700/60" {...props} />,
                                          td: ({ node, ...props }) => <td className="px-3.5 py-2.5 text-gray-700 dark:text-slate-300 border-r last:border-r-0 border-gray-200 dark:border-slate-700/60" {...props} />,
                                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 italic text-gray-700 dark:text-gray-300 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-r-lg" {...props} />
                                        }}
                                      >
                                        {preprocessMarkdown(page.content)}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Single or Active Topic Card */
                              (() => {
                                const currentPage = parsedIntuition.pages[activeChapterIndex] || parsedIntuition.pages[0];
                                if (!currentPage) return null;

                                return (
                                  <div className="bg-white/90 dark:bg-slate-900/60 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-100/90 dark:border-slate-800 shadow-2xs">
                                    {/* Topic Header */}
                                    <div className="flex items-center justify-between pb-2 sm:pb-3 mb-2.5 sm:mb-4 border-b border-gray-100 dark:border-slate-800">
                                      <div className="min-w-0 pr-2">
                                        {parsedIntuition.totalPages > 1 && (
                                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                                            Topic {activeChapterIndex + 1} of {parsedIntuition.totalPages}
                                          </span>
                                        )}
                                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white m-0 truncate">
                                          {currentPage.title}
                                        </h3>
                                      </div>

                                      <button
                                        onClick={() => handleCopyChapter(currentPage.content)}
                                        title="Copy Topic Notes"
                                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer shrink-0"
                                      >
                                        <Copy size={11} className="sm:size-[12px]" />
                                        <span>{copiedChapter ? "Copied!" : "Copy"}</span>
                                      </button>
                                    </div>

                                    {/* Markdown Content */}
                                    <div className="prose max-w-none text-gray-800 dark:text-gray-200 leading-relaxed intuition-markdown">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                          h1: ({ node, ...props }) => <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-5 mb-2.5 break-words" {...props} />,
                                          h2: ({ node, ...props }) => <h2 className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-200 mt-4 mb-2 break-words" {...props} />,
                                          h3: ({ node, ...props }) => <h3 className="text-sm sm:text-base font-bold text-indigo-900 dark:text-indigo-300 first:mt-2 mt-4 mb-2 break-words" {...props} />,
                                          h4: ({ node, ...props }) => <h4 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1.5 break-words" {...props} />,
                                          strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-gray-100 break-words" {...props} />,
                                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                          li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                          p: ({ node, ...props }) => <p className="mb-4 text-gray-800 dark:text-gray-300 break-words" {...props} />,
                                          pre: ({ node, children, ...props }) => <>{children}</>,
                                          code: ({ node, inline, className, children, ...props }) => inline
                                            ? <code className="bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-mono text-[11.5px] sm:text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50 break-all" {...props}>{children}</code>
                                            : <CodeEditorBlock className={className} {...props}>{children}</CodeEditorBlock>,
                                          table: ({ node, ...props }) => (
                                            <div 
                                              className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-2xs no-tab-swipe"
                                              onTouchStart={(e) => e.stopPropagation()}
                                              onTouchMove={(e) => e.stopPropagation()}
                                              onTouchEnd={(e) => e.stopPropagation()}
                                            >
                                              <table className="w-full text-xs sm:text-sm text-left border-collapse" {...props} />
                                            </div>
                                          ),
                                          thead: ({ node, ...props }) => <thead className="bg-indigo-50/80 dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 font-bold border-b border-gray-200 dark:border-slate-700" {...props} />,
                                          tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900/70" {...props} />,
                                          tr: ({ node, ...props }) => <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors" {...props} />,
                                          th: ({ node, ...props }) => <th className="px-3.5 py-2.5 font-semibold text-indigo-900 dark:text-indigo-200 border-r last:border-r-0 border-gray-200 dark:border-slate-700/60" {...props} />,
                                          td: ({ node, ...props }) => <td className="px-3.5 py-2.5 text-gray-700 dark:text-slate-300 border-r last:border-r-0 border-gray-200 dark:border-slate-700/60" {...props} />,
                                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 italic text-gray-700 dark:text-gray-300 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-r-lg" {...props} />
                                        }}
                                      >
                                        {preprocessMarkdown(currentPage.content)}
                                      </ReactMarkdown>
                                    </div>

                                    {/* Bottom Topic Pagination Controls */}
                                    {parsedIntuition.totalPages > 1 && (
                                      <div className="flex items-center justify-between pt-3 mt-4 sm:pt-4 sm:mt-6 border-t border-gray-100 dark:border-slate-800">
                                        <button
                                          disabled={activeChapterIndex === 0}
                                          onClick={() => {
                                            setActiveChapterIndex(i => Math.max(0, i - 1));
                                            window.scrollTo({ top: 400, behavior: 'smooth' });
                                          }}
                                          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-gray-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                        >
                                          <ChevronLeft size={13} className="sm:size-[14px]" />
                                          <span>Previous</span>
                                        </button>

                                        <span className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-slate-500">
                                          {activeChapterIndex + 1} / {parsedIntuition.totalPages}
                                        </span>

                                        {activeChapterIndex < parsedIntuition.totalPages - 1 ? (
                                          <button
                                            onClick={() => {
                                              setActiveChapterIndex(i => Math.min(parsedIntuition.totalPages - 1, i + 1));
                                              window.scrollTo({ top: 400, behavior: 'smooth' });
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                                          >
                                            <span>Next Topic</span>
                                            <ChevronRight size={13} className="sm:size-[14px]" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setActiveTab('quiz')}
                                            className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs transition cursor-pointer"
                                          >
                                            <CheckCircle size={12} className="sm:size-[13px]" />
                                            <span>Take Quiz</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <p>No study notes generated yet.</p>
                            <button
                              onClick={() => fetchIntuition()}
                              className="mt-3 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 cursor-pointer"
                            >
                              Generate Study Notes Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ask AI Chatbot Tab */}
                  {activeTab === 'ai-chat' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm flex flex-col h-[580px] sm:h-[650px] max-h-[85vh] overflow-hidden">
                      {/* Chat Header */}
                      <div className="flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-sm shrink-0">
                            <Bot size={18} className="sm:size-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 m-0">
                              <span className="truncate">AI Lecture Doubt Solver & Chatbot</span>
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                                Live Tutor
                              </span>
                            </h4>
                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 m-0 mt-0.5 truncate">
                              Ask any doubt or question from <strong className="text-gray-700 dark:text-slate-200 font-semibold">{video?.name}</strong>.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleStartNewChat}
                          disabled={aiChatMessages.length === 0 && !aiChatInput}
                          className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer rounded-xl flex items-center justify-center shadow-xs active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Start New Chat"
                          aria-label="New Chat"
                        >
                          <Plus size={16} className="sm:size-[18px]" />
                        </button>
                      </div>

                      {/* Quick Doubt Suggestion Prompts - Dynamically Tailored to Lecture */}
                      {aiChatMessages.length === 0 && (
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 bg-gradient-to-b from-indigo-50/30 via-white to-white dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-900 flex flex-col justify-start">
                          <div className="w-full max-w-2xl mx-auto space-y-2.5 sm:space-y-4">
                            <div className="text-center space-y-1">
                              <div className="inline-flex items-center justify-center p-2 sm:p-2.5 bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-1 shadow-xs">
                                <Sparkles size={18} className="sm:size-5" />
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white m-0">
                                Ask anything about this lecture
                              </h3>
                              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 m-0">
                                Click a tailored question below to ask instantly or type your own:
                              </p>
                            </div>

                            {/* Header Bar with Subject Badge & Shuffle Action */}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 px-2.5 py-1 rounded-lg">
                                <Sparkles size={12} className="text-indigo-500" />
                                <span className="truncate max-w-[200px] sm:max-w-xs">{parsedIntuition?.categoryLabel || 'Topic Doubt Solver'}</span>
                              </div>

                              <button
                                onClick={() => setSuggestionSeed(s => s + 1)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 px-2.5 py-1 rounded-lg transition shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                                title="Shuffle suggested questions"
                              >
                                <Shuffle size={12} />
                                <span>Shuffle Questions</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                              {dynamicSuggestions.map((item, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => handleSendAiQuestion(item.text)}
                                  className="group flex flex-col justify-between p-3 sm:p-3.5 bg-white dark:bg-slate-800/90 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-gray-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-xl transition-all duration-200 text-left shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <span className="text-base shrink-0 select-none mt-0.5">{item.icon}</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug">
                                      {item.text}
                                    </span>
                                  </div>
                                  {item.badge && (
                                    <span className="self-end mt-2 text-[9px] font-bold uppercase tracking-wider text-indigo-500/90 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 px-1.5 py-0.5 rounded">
                                      {item.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Message Stream Directly Connected to Input */}
                      {aiChatMessages.length > 0 && (
                        <div className="space-y-4 overflow-y-auto p-3.5 sm:p-4 custom-scrollbar flex-1 min-h-0">
                          {aiChatMessages.map((msg, mIdx) => {
                            const followUps = msg.role === 'assistant' ? extractFollowUpQuestions(msg.content) : [];
                            return (
                              <div
                                key={mIdx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}
                              >
                                <div
                                  className={`rounded-2xl p-3.5 sm:p-4 text-sm ${
                                    msg.role === 'user'
                                      ? 'max-w-[85%] bg-orange-500 text-white rounded-tr-xs shadow-sm font-medium'
                                      : 'w-full bg-gray-50 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs'
                                  }`}
                                >
                                  {msg.role === 'user' ? (
                                    <p className="whitespace-pre-wrap leading-relaxed m-0">{msg.content}</p>
                                  ) : (
                                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed intuition-markdown">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 break-words" {...props} />,
                                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1 space-y-1" {...props} />,
                                          li: ({ node, ...props }) => <li className="break-words" {...props} />,
                                          pre: ({ node, children, ...props }) => <>{children}</>,
                                          code: ({ node, inline, className, children, ...props }) => inline
                                            ? <code className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded font-mono text-xs font-semibold" {...props}>{children}</code>
                                            : <CodeEditorBlock className={className} {...props}>{children}</CodeEditorBlock>
                                        }}
                                      >
                                        {preprocessMarkdown(msg.content)}
                                      </ReactMarkdown>

                                      {/* Interactive Follow-Up Questions Chips */}
                                      {followUps.length > 0 && (
                                        <div className="mt-3 pt-2.5 border-t border-indigo-100 dark:border-slate-700/80">
                                          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Sparkles size={11} />
                                            <span>Suggested Follow-ups (click to ask):</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                            {followUps.map((fq, fIdx) => (
                                              <button
                                                key={fIdx}
                                                onClick={() => handleSendAiQuestion(fq)}
                                                disabled={aiChatLoading}
                                                className="text-left text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-400 transition cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
                                              >
                                                💡 {fq}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-end">
                                        <button
                                          onClick={() => handleCopyText(msg.content, mIdx)}
                                          className="text-[10px] font-bold text-gray-400 hover:text-indigo-500 flex items-center gap-1 transition cursor-pointer"
                                        >
                                          {copiedIndex === mIdx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                          <span>{copiedIndex === mIdx ? 'Copied' : 'Copy answer'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {aiChatLoading && (
                            <div className="flex justify-start w-full text-gray-400 dark:text-slate-400">
                              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-gray-100 dark:border-slate-700 shadow-xs">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-1">AI Tutor is thinking...</span>
                              </div>
                            </div>
                          )}
                          <div ref={aiChatBottomRef} />
                        </div>
                      )}

                      {/* Directly Connected Chat Input Bar */}
                      <div className="p-2.5 sm:p-3 bg-gray-50/80 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 shrink-0">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendAiQuestion();
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            placeholder="Ask any doubt about this lecture..."
                            value={aiChatInput}
                            onChange={(e) => setAiChatInput(e.target.value)}
                            disabled={aiChatLoading}
                            className="flex-1 px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner"
                          />
                          <button
                            type="submit"
                            disabled={!aiChatInput.trim() || aiChatLoading}
                            className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                          >
                            <span>Ask AI</span>
                            <Send size={13} />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Quiz Tab */}
                  {activeTab === 'quiz' && (
                    <div className="bg-orange-50/50 dark:bg-orange-900/10 p-3.5 sm:p-6 rounded-2xl border border-orange-100 dark:border-orange-800 transition-colors duration-200">
                      <div className="flex items-center justify-between mb-3.5 pb-3 sm:mb-5 sm:pb-4 border-b border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg shrink-0">
                            <CheckCircle className="text-orange-600 dark:text-orange-400" size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg sm:text-xl font-bold text-orange-900 dark:text-orange-100 m-0 leading-tight">Video Quiz</h3>
                              {quizHistory.some(h => h.passed) && (
                                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle size={10} /> Passed
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-orange-600/80 dark:text-orange-400/80 m-0 mt-0.5">Test your knowledge to unlock playlist certification.</p>
                          </div>
                        </div>
                      </div>

                      {selectedHistoryQuiz ? (() => {
                        const questions = JSON.parse(selectedHistoryQuiz.questions);
                        const userAnswers = selectedHistoryQuiz.user_answers ? JSON.parse(selectedHistoryQuiz.user_answers) : [];

                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 relative"
                          >
                            <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-slate-700">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => setSelectedHistoryQuiz(null)}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-xs active:scale-95 shrink-0"
                                  title="Back to Quiz Menu"
                                  aria-label="Back to Quiz Menu"
                                >
                                  <ArrowLeft size={18} />
                                </button>
                                <div>
                                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white m-0 leading-tight">Detailed Review</h2>
                                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">
                                    Attempted: {new Date(selectedHistoryQuiz.attempted_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedHistoryQuiz.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {selectedHistoryQuiz.passed ? "Passed" : "Failed"} • {selectedHistoryQuiz.score}%
                                </span>
                                <button
                                  onClick={() => handleDeleteQuizHistory(selectedHistoryQuiz.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl transition-colors flex items-center justify-center cursor-pointer border border-gray-100 dark:border-slate-700 shadow-xs active:scale-95 shrink-0"
                                  title="Delete this quiz attempt"
                                  aria-label="Delete Attempt"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-8">
                              {(questions || []).map((q, idx) => {
                                const userAnswer = userAnswers[idx];
                                const isCorrect = userAnswer === q.answer;

                                return (
                                  <div key={idx} className="pb-8 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                                    <p className="font-semibold text-lg text-gray-800 dark:text-slate-200 mb-4 leading-relaxed"><span className="text-orange-500 mr-2">{idx + 1}.</span> {q.question}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {(q.options || []).map((opt, optIdx) => {
                                        const isSelected = opt === userAnswer;
                                        const isActualAnswer = opt === q.answer;

                                        let bgClass = "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600";
                                        if (isSelected && isCorrect) bgClass = "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300 ring-1 ring-green-500";
                                        else if (isSelected && !isCorrect) bgClass = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300 ring-1 ring-red-500";
                                        else if (isActualAnswer) bgClass = "bg-green-50/50 dark:bg-green-900/10 border-green-300 text-green-700 dark:text-green-400 border-dashed";

                                        return (
                                          <div key={optIdx} className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-center ${bgClass}`}>
                                            <span className="text-sm font-medium leading-snug">{opt}</span>
                                            <div className="mt-2 flex items-center gap-1.5 opacity-90">
                                              {isSelected && isCorrect && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Your Correct Answer</span>}
                                              {isSelected && !isCorrect && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><X size={12} /> Your Incorrect Answer</span>}
                                              {!isSelected && isActualAnswer && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Correct Answer</span>}
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
                        );
                      })()
                        : quizResult ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded shadow max-w-md mx-auto text-center border dark:border-slate-700"
                          >
                            <h2 className="text-xl font-bold mb-2 dark:text-white mt-0">{quizResult.passed ? "🎉 Congratulations!" : "Better luck next time!"}</h2>
                            <p className="mb-4 dark:text-slate-300">Your Score: {quizResult.score}%</p>
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => setSelectedHistoryQuiz(quizResult.quiz)}
                                className="w-full px-4 py-2.5 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition shadow-sm cursor-pointer"
                              >
                                Review Answers
                              </button>
                              <button
                                onClick={() => {
                                  setQuizResult(null);
                                  fetchQuizHistory();
                                }}
                                className="w-full px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition cursor-pointer"
                              >
                                Close Results
                              </button>
                            </div>
                          </motion.div>
                        ) : quizData ? (
                          <div className="bg-white dark:bg-slate-800 rounded shadow p-6 border dark:border-slate-700 relative">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-semibold dark:text-white m-0">Quiz</h2>
                              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 m-0">Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
                            </div>
                            {quizData?.questions?.map && quizData.questions.map((q, idx) => (
                              <div key={idx} className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:mb-0">
                                <p className="font-medium text-gray-800 dark:text-slate-200 mb-3 text-lg leading-relaxed">{idx + 1}. {q.question}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {(q.options || []).map((opt, optIdx) => (
                                    <label key={optIdx} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${answers[idx] === opt
                                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                      }`}>
                                      <input
                                        type="radio"
                                        name={`question-${idx}`}
                                        value={opt}
                                        checked={answers[idx] === opt}
                                        onChange={() => handleQuizAnswer(idx, opt)}
                                        className="mt-1 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                      />
                                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                              <button
                                disabled={submittingQuiz}
                                onClick={() => {
                                  setQuizData(null);
                                  toast("Quiz cancelled.");
                                }}
                                className="px-6 py-2.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={submittingQuiz}
                                onClick={handleSubmitQuiz}
                                className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                              >
                                {submittingQuiz ? "Submitting..." : "Submit Answers"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-5 sm:py-9 text-center w-full">
                            <CheckCircle className="text-orange-400/50 mb-3 h-12 w-12 sm:h-16 sm:w-16" />
                            <h4 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Ready to test your knowledge?</h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">Take a 10-question quiz generated by AI specifically for this video to earn XP!</p>
                            <button
                              onClick={handleStartQuiz}
                              disabled={loadingQuiz}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-7 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                            >
                              {loadingQuiz ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Generating Quiz...
                                </>
                              ) : "Start Quiz Now"}
                            </button>

                            {quizHistory.length > 0 && (
                              <div className="mt-16 w-full max-w-2xl mx-auto text-left">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-3">
                                  <Clock size={20} className="text-orange-500" /> Previous Attempts
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                  {(quizHistory || []).map(hist => (
                                    <motion.div
                                      key={hist.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      onClick={() => setSelectedHistoryQuiz(hist)}
                                      className="flex justify-between items-center p-3.5 sm:p-4 bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all group"
                                    >
                                      <div>
                                        <p className="font-semibold text-gray-800 dark:text-slate-200 m-0 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-xs sm:text-sm">
                                          Attempt on {new Date(hist.attempted_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2.5">
                                        <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg ${hist.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {hist.score}%
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteQuizHistory(hist.id);
                                          }}
                                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                          title="Delete attempt"
                                          aria-label="Delete attempt"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                        <ArrowLeft size={16} className="text-gray-400 rotate-180 group-hover:text-orange-500 transition-colors" />
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20 flex items-start gap-3">
                        <FileText className="text-orange-500 dark:text-orange-400 mt-0.5" size={20} />
                        <div>
                          <h4 className="font-semibold text-orange-800 dark:text-orange-300">Private Notes</h4>
                          <p className="text-sm text-orange-600/80 dark:text-orange-400/80">These notes are visible only to you. Take down important concepts here.</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl mb-12 quill-container relative z-10 pb-12">
                        <ReactQuill
                          theme="snow"
                          value={noteContent}
                          onChange={setNoteContent}
                          placeholder="Type your notes here... (Auto-saves on save button click)"
                          className="h-64 text-gray-800 dark:text-gray-200"
                        />
                      </div>

                      {/* Handwritten Notes Uploader */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="text-gray-500 dark:text-gray-400" size={20} />
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Handwritten Notes</h4>
                          </div>
                          <label className="cursor-pointer bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  const filesArray = Array.from(e.target.files);
                                  const validFiles = [];

                                  filesArray.forEach(file => {
                                    if (file.size > 2 * 1024 * 1024) {
                                      toast.error(`"${file.name}" exceeds the 2MB limit.`);
                                    } else {
                                      validFiles.push(file);
                                    }
                                  });

                                  if (validFiles.length > 0) {
                                    setNewNoteFiles([...newNoteFiles, ...validFiles]);
                                  }

                                  // Reset input so the same file can be re-selected if necessary
                                  e.target.value = null;
                                }
                              }}
                            />
                            Upload Files
                          </label>
                        </div>

                        {/* File Previews */}
                        <div className="space-y-3 mb-4">
                          {/* Render Server Files */}
                          {noteFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-full">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="text-orange-500 shrink-0" size={24} />
                                <div className="flex flex-col truncate">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(file.name.toLowerCase().endsWith(".pdf")) ? "PDF Document" : "Image File"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setPreviewFile({ url: file.url, name: file.name })}
                                  className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                                >
                                  View Full Size
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletedFileIds([...deletedFileIds, file.id]);
                                    setNoteFiles(noteFiles.filter(f => f.id !== file.id));
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                  title="Remove Saved File"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Render Unsaved New Files */}
                          {newNoteFiles.map((file, idx) => (
                            <div key={`new-${idx}`} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 rounded-lg p-3 w-full shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="text-blue-500 shrink-0" size={24} />
                                <div className="flex flex-col truncate">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-blue-500 dark:text-blue-400">
                                    Unsaved {(file.type === "application/pdf") ? "PDF Document" : "Image File"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setPreviewFile({ url: URL.createObjectURL(file), name: file.name })}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                                >
                                  View Preview
                                </button>
                                <button
                                  onClick={() => {
                                    const newArr = [...newNoteFiles];
                                    newArr.splice(idx, 1);
                                    setNewNoteFiles(newArr);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                  title="Remove Pending File"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          className="bg-gray-900 dark:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                          {savingNote ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : "Save Notes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Discussion Tab */}
                  {activeTab === 'discussion' && (
                    <div className="flex flex-col h-[500px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {comments.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={48} className="mb-2 opacity-20" />
                            <p>No messages yet. Start the discussion!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              const renderComment = (comment, isReply = false) => (
                                <div key={comment.id} className={`flex flex-col ${isReply ? 'ml-11 mt-3' : ''}`}>
                                  <div className="flex gap-3 animate-fade-in group">
                                    {comment.user_picture ? (
                                      <img src={comment.user_picture} alt="User" className="w-8 h-8 rounded-full shadow-sm shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shadow-sm shrink-0">
                                        {comment.user_name?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                    <div className="flex flex-col max-w-[85%]">
                                      <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{comment.user_name || 'Anonymous'}</span>
                                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                          {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                      </div>
                                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap relative">
                                        {comment.content}

                                        {/* Actions */}
                                        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => setReplyTo(comment.id)}
                                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                                            title="Reply"
                                          >
                                            <Reply size={14} />
                                          </button>
                                          {user?.uid === comment.user_uid && (
                                            <button
                                              onClick={() => handleDeleteComment(comment.id)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                              title="Delete"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Render Replies */}
                                  {comment.replies && (comment.replies || []).map(reply => renderComment(reply, true))}
                                </div>
                              );
                              return (comments || []).map(c => renderComment(c));
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        {replyTo && (
                          <div className="mb-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-between animate-fade-in">
                            <span className="text-xs text-orange-700 flex items-center gap-1">
                              <Reply size={12} /> Replying to <strong>{comments.find(c => c.id === replyTo)?.user_name || 'message'}</strong>
                            </span>
                            <button onClick={() => setReplyTo(null)} className="text-orange-400 hover:text-orange-600 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handlePostComment(); }} className="flex items-center gap-2 relative">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? "Write a reply..." : "Message the community..."}
                            className="flex-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-600 rounded-full py-3 px-5 pr-12 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                            autoFocus={!!replyTo}
                          />
                          <button
                            type="submit"
                            disabled={postingComment || !newComment.trim()}
                            className="absolute right-2 top-1.5 bottom-1.5 w-9 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-gray-300"
                          >
                            {postingComment ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <Send size={16} className="-ml-0.5" />
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Playlist Sidebar */}
      {playlist && (
        <div className="hidden lg:flex w-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-800 lg:h-screen lg:overflow-hidden flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-orange-500 text-white rounded-lg">
                <PlayCircle size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Playlist</span>
            </div>
            <h2 className="text-sm font-black text-gray-800 dark:text-white line-clamp-2 leading-snug">{playlist.name}</h2>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
              {(playlist.videos || []).length} lessons
            </p>
          </div>

          {/* Video List */}
          {(() => {
            const allVideos = playlist.videos || [];
            const totalPages = Math.ceil(allVideos.length / ITEMS_PER_PAGE);
            const paginatedVideos = allVideos.slice((playlistPage - 1) * ITEMS_PER_PAGE, playlistPage * ITEMS_PER_PAGE);

            return (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
                  {paginatedVideos.map((v, index) => {
                    const absoluteIndex = (playlistPage - 1) * ITEMS_PER_PAGE + index;
                    const isActive = v.vid === videoId;
                    const progress = Math.round(isActive ? liveProgress : (v.watch_progress || 0));
                    return (
                      <div
                        key={v.vid}
                        ref={isActive ? activeVideoRef : null}
                        onClick={() => handleSelectVideo(v.vid)}
                        className={`group flex gap-3 p-3 cursor-pointer transition-all duration-200 ${isActive
                          ? 'bg-orange-50 dark:bg-orange-900/10 border-r-2 border-orange-500'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={`https://img.youtube.com/vi/${v.vid}/default.jpg`}
                            alt={v.name}
                            className={`w-20 h-12 object-cover rounded-xl shadow-sm transition-all ${isActive ? 'ring-2 ring-orange-400' : ''}`}
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-orange-500/30 rounded-xl flex items-center justify-center">
                              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                <Play size={10} className="text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                          {(v.is_completed || (v.watch_progress || 0) >= 90) && !isActive && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 z-10" title="Completed">
                              <Check size={11} strokeWidth={3.5} />
                            </div>
                          )}
                          <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-gray-800 dark:bg-slate-700 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm">
                            {absoluteIndex + 1}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xs font-bold line-clamp-2 mb-1.5 leading-snug transition-colors ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-slate-300 group-hover:text-orange-500'
                            }`}>
                            {v.name}
                          </h3>
                          {/* Progress bar */}
                          <div className="h-1 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progress}%` }}
                              className={`h-1 rounded-full transition-all duration-500 ${v.is_completed ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'
                                }`}
                            ></div>
                          </div>
                          <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">
                            {progress}% watched
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Pagination Footer */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                    <button
                      disabled={playlistPage === 1}
                      onClick={() => setPlaylistPage(p => p - 1)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      Page {playlistPage} of {totalPages}
                    </span>
                    <button
                      disabled={playlistPage === totalPages}
                      onClick={() => setPlaylistPage(p => p + 1)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setPreviewFile(null)}>
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 truncate pr-4">
                <FileText size={20} className="text-orange-500 shrink-0" />
                <span className="truncate">{previewFile.name}</span>
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              {previewFile.url && previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col">
                  <iframe
                    src={previewFile.url}
                    className="w-full h-full rounded-lg shadow-sm bg-white dark:bg-gray-800"
                    title="PDF Preview"
                  />
                  <div className="mt-4 text-center">
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                      Open in new tab if preview doesn't load
                    </a>
                  </div>
                </div>
              ) : (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for High-Quality PDF Compilation */}
      {parsedIntuition && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '794px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -9999
          }}
        >
          <div
            id="pdf-preview-printable"
            ref={pdfOffscreenRef}
            style={{
              width: '794px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Each Topic as a Standalone Page Card with Safe Top and Bottom Margins */}
            {parsedIntuition.pages.map((page, idx) => (
              <div
                key={idx}
                className="pdf-topic-page-card"
                style={{
                  width: '794px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  padding: '36px 40px 48px 40px',
                  boxSizing: 'border-box',
                  marginBottom: '16px'
                }}
              >
                {/* PDF Header & Brand Cover Banner on Every Page */}
                <div style={{ borderBottom: '2px solid #4f46e5', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '5px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', letterSpacing: '0.8px' }}>
                        LEARNPROOF AI
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Digital Study Guide & Notes
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10px', color: '#64748b' }}>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        PAGE {idx + 1} OF {parsedIntuition.totalPages}
                      </span>
                    </div>
                  </div>

                  <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#1e1b4b', margin: '4px 0', lineHeight: 1.3 }}>
                    {video?.name || 'Lecture Study Notes'}
                  </h1>
                </div>

                {/* Topic Banner */}
                <div style={{ backgroundColor: '#eef2ff', borderLeft: '4px solid #4f46e5', padding: '8px 12px', borderRadius: '0 8px 8px 0', marginBottom: '14px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block' }}>
                    TOPIC {page.pageNumber || idx + 1} OF {parsedIntuition.totalPages}
                  </span>
                  <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b', margin: '2px 0 0 0' }}>
                    {page.title}
                  </h2>
                </div>

                {/* Markdown Content */}
                <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.6' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ node, ...props }) => <h1 style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b', marginTop: '14px', marginBottom: '8px' }} {...props} />,
                      h2: ({ node, ...props }) => <h2 style={{ fontSize: '13.5px', fontWeight: '700', color: '#312e81', marginTop: '12px', marginBottom: '6px' }} {...props} />,
                      h3: ({ node, ...props }) => <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#3730a3', marginTop: '10px', marginBottom: '4px' }} {...props} />,
                      h4: ({ node, ...props }) => <h4 style={{ fontSize: '11.5px', fontWeight: '600', color: '#4338ca', marginTop: '8px', marginBottom: '4px' }} {...props} />,
                      p: ({ node, ...props }) => <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.6', marginBottom: '8px' }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '8px', fontSize: '11.5px', color: '#334155' }} {...props} />,
                      ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', marginBottom: '8px', fontSize: '11.5px', color: '#334155' }} {...props} />,
                      li: ({ node, ...props }) => <li style={{ marginBottom: '4px', color: '#334155' }} {...props} />,
                      strong: ({ node, ...props }) => <strong style={{ fontWeight: '700', color: '#0f172a' }} {...props} />,
                      pre: ({ node, children, ...props }) => <>{children}</>,
                      code: ({ node, inline, className, children, ...props }) => inline
                        ? <code style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 4px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600' }} {...props}>{children}</code>
                        : (
                          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px', margin: '12px 0', overflowX: 'auto' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '11px', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {String(children || '').replace(/\n$/, '')}
                            </pre>
                          </div>
                        ),
                      table: ({ node, ...props }) => (
                        <div style={{ margin: '12px 0', overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #cbd5e1' }} {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead style={{ backgroundColor: '#eef2ff', color: '#1e1b4b', fontWeight: '700' }} {...props} />,
                      th: ({ node, ...props }) => <th style={{ border: '1px solid #cbd5e1', padding: '6px 10px', textAlign: 'left', color: '#1e1b4b' }} {...props} />,
                      td: ({ node, ...props }) => <td style={{ border: '1px solid #e2e8f0', padding: '6px 10px', color: '#334155' }} {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote style={{ borderLeft: '4px solid #6366f1', padding: '6px 12px', backgroundColor: '#f5f3ff', color: '#3730a3', fontStyle: 'italic', margin: '10px 0', borderRadius: '0 6px 6px 0', fontSize: '11.5px' }} {...props} />
                      )
                    }}
                  >
                    {preprocessMarkdown(page.content)}
                  </ReactMarkdown>
                </div>

                {/* Topic Page Footer */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                  <span>LearnProof AI Study Notes</span>
                  <span>Topic {page.pageNumber || idx + 1} • {page.title}</span>
                  <span>Page {idx + 1} of {parsedIntuition.totalPages}</span>
                </div>
              </div>
            ))}

            {/* Revision Checklist Page at Bottom */}
            <div
              className="pdf-topic-page-card"
              style={{
                width: '794px',
                backgroundColor: '#ffffff',
                padding: '36px 40px 48px 40px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ padding: '16px 18px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>🎓 Study Revision Checklist</div>
                  <div style={{ fontSize: '11px', color: '#15803d', marginTop: '3px' }}>Review core concepts above • Re-test intuition with LearnProof AI Quiz</div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>learnproofai.com</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Multi-Page Visual PDF Document Preview & Download Modal */}
      {showPdfPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setShowPdfPreviewModal(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[92vh] max-h-[92vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Top Header Bar */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate m-0">
                    {generatedPdfName || `${video?.name || 'Lecture'}_Study_Notes.pdf`}
                  </h3>
                  <p className="text-[10px] text-slate-400 m-0 truncate">
                    Study Notes Document • {parsedIntuition?.totalPages || 1} {(parsedIntuition?.totalPages || 1) === 1 ? 'Page' : 'Pages'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Download PDF Button */}
                <button
                  disabled={downloadingPdf}
                  onClick={handleDownloadGeneratedPdf}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Download PDF file to device"
                >
                  {downloadingPdf ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>{downloadingPdf ? "Saving PDF..." : "Download PDF"}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body - Interactive Multi-Page Document Viewer */}
            <div className="flex-1 w-full bg-slate-950 overflow-y-auto p-3 sm:p-6 flex flex-col items-center gap-6">
              {parsedIntuition?.pages?.map((page, idx) => (
                <div
                  key={idx}
                  className="w-full max-w-[760px] bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200/80 relative"
                >
                  {/* Page Top Header Bar */}
                  <div className="border-b-2 border-indigo-600 pb-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 text-white px-2.5 py-1 rounded-md font-black text-xs tracking-wider">
                        LEARNPROOF AI
                      </div>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide truncate max-w-[200px] sm:max-w-md">
                        {video?.name || 'Lecture Study Notes'}
                      </span>
                    </div>
                    <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                      Page {idx + 1} of {parsedIntuition.totalPages}
                    </span>
                  </div>

                  {/* Topic Title Banner */}
                  <div className="bg-indigo-50 border-l-4 border-indigo-600 p-3 rounded-r-xl mb-5">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                      TOPIC {page.pageNumber || idx + 1} OF {parsedIntuition.totalPages}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-indigo-950 m-0 mt-0.5">
                      {page.title}
                    </h2>
                  </div>

                  {/* Markdown Content */}
                  <div className="prose max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-base sm:text-lg font-extrabold text-indigo-950 mt-4 mb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm sm:text-base font-bold text-indigo-900 mt-3 mb-1.5" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xs sm:text-sm font-bold text-indigo-800 mt-2.5 mb-1" {...props} />,
                        h4: ({ node, ...props }) => <h4 className="text-xs font-semibold text-indigo-700 mt-2 mb-1" {...props} />,
                        p: ({ node, ...props }) => <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 text-xs sm:text-sm text-slate-700 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 text-xs sm:text-sm text-slate-700 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                        code: ({ node, inline, className, children, ...props }) => inline
                          ? <code className="bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold" {...props}>{children}</code>
                          : <CodeEditorBlock code={String(children || '').replace(/\n$/, '')} />,
                        table: ({ node, ...props }) => (
                          <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full border-collapse text-xs" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-indigo-50/80 text-indigo-950 font-bold border-b border-slate-200" {...props} />,
                        th: ({ node, ...props }) => <th className="border border-slate-200 px-3 py-2 text-left font-bold" {...props} />,
                        td: ({ node, ...props }) => <td className="border border-slate-200 px-3 py-2 text-slate-700" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 p-3 my-3 text-xs text-indigo-900 italic rounded-r-lg" {...props} />
                        )
                      }}
                    >
                      {preprocessMarkdown(page.content)}
                    </ReactMarkdown>
                  </div>

                  {/* Page Footer */}
                  <div className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-400">
                    <span>LearnProof AI Study Companion</span>
                    <span>Topic {page.pageNumber || idx + 1} • {page.title}</span>
                    <span>Page {idx + 1} of {parsedIntuition.totalPages}</span>
                  </div>
                </div>
              ))}

              {/* Revision Checklist Card at Bottom */}
              <div className="w-full max-w-[760px] bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-200 p-5 shadow-lg flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs sm:text-sm font-black text-emerald-800">🎓 Study Revision Checklist</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Review core intuition above • Re-test intuition with LearnProof AI Quiz</div>
                </div>
                <button
                  onClick={handleDownloadGeneratedPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Mobile Bottom Download Action Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-center sm:hidden flex items-center justify-center gap-3 shrink-0">
              <button
                disabled={downloadingPdf}
                onClick={handleDownloadGeneratedPdf}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>{downloadingPdf ? "Saving PDF..." : "Download Complete PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classroom;
