import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowLeft, Sparkles, Plus, Trash2, Loader2, Upload, X,
    CheckCircle2, AlertTriangle, Send, FileText, BrainCircuit,
    BookOpen, HelpCircle, RefreshCw, Layers, Save, Check, Play,
    Mic, MicOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';
import socialApi from '../../api/socialApi';
import toast from 'react-hot-toast';
import mermaid from 'mermaid';
import ConfirmModal from '../Common/ConfirmModal';
import { useMemo, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Initialize mermaid once outside the component
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif'
});

/**
 * Custom hook — browser Web Speech API voice input
 * onResult(text, isFinal) is called with each transcript update.
 */
const useVoiceInput = (onResult) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const startListening = useCallback((baseText = '') => {
        if (!isSupported) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            // Collect the FULL transcript from all result segments
            let finalText = '';
            let interimText = '';
            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalText += text;
                else interimText += text;
            }
            const currentTranscript = finalText || interimText;
            const isFinal = !!finalText;

            // REPLACE (not append) — set input to base + current transcript
            const prefix = baseText.trimEnd();
            onResult(prefix ? `${prefix} ${currentTranscript}` : currentTranscript, isFinal);
        };

        recognition.onerror = (e) => {
            console.warn('[Voice] SpeechRecognition error:', e.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    }, [isSupported, onResult]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    useEffect(() => () => stopListening(), [stopListening]);

    return { isListening, isSupported, startListening, stopListening };
};

const sanitizeMermaidLabel = (label) => {
    let prefix = '';
    let suffix = '';
    let inner = '';

    if (label.startsWith('((') && label.endsWith('))')) {
        prefix = '((';
        suffix = '))';
        inner = label.substring(2, label.length - 2);
    } else if (label.startsWith('([') && label.endsWith('])')) {
        prefix = '([';
        suffix = '])';
        inner = label.substring(2, label.length - 2);
    } else if (label.startsWith('[[') && label.endsWith(']]')) {
        prefix = '[[';
        suffix = ']]';
        inner = label.substring(2, label.length - 2);
    } else if (label.startsWith('[(') && label.endsWith(')]')) {
        prefix = '[(';
        suffix = ')]';
        inner = label.substring(2, label.length - 2);
    } else if (label.startsWith('[') && label.endsWith(']')) {
        prefix = '[';
        suffix = ']';
        inner = label.substring(1, label.length - 1);
    } else if (label.startsWith('(') && label.endsWith(')')) {
        prefix = '(';
        suffix = ')';
        inner = label.substring(1, label.length - 1);
    } else if (label.startsWith('{') && label.endsWith('}')) {
        prefix = '{';
        suffix = '}';
        inner = label.substring(1, label.length - 1);
    } else {
        return label;
    }

    inner = inner.trim();
    if (inner.startsWith('"') && inner.endsWith('"')) {
        return label;
    }

    const needsQuoting = /[\(\)\[\]\{\}\|=\-><:;,\*\&\^\%\$\#\@\!\?]/.test(inner);
    if (needsQuoting) {
        const escapedInner = inner.replace(/"/g, '\\"');
        return `${prefix}"${escapedInner}"${suffix}`;
    }

    return label;
};

const cleanMermaidChart = (chartText) => {
    if (!chartText) return '';

    // Normalize full-width/unicode punctuation to standard ASCII
    let text = chartText.trim();
    text = text.replace(/＃/g, '#')
               .replace(/；/g, ';')
               .replace(/：/g, ':')
               .replace(/，/g, ',')
               .replace(/—|–|－/g, '-');

    // Strip markdown code fences if AI wrapped the diagram
    text = text.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // ── Fix 1: Chained arrow-label syntax ────────────────────────────────────
    // AI sometimes writes: A --> "label" --> B  (invalid)
    // Fix to:              A -->|label| B        (valid)
    text = text.replace(
        /([A-Za-z0-9_"'\(\)\[\]]+)\s*--+>?\s*"([^"]+)"\s*--+>\s*([A-Za-z0-9_"'\(\)\[\]]+)/g,
        '$1 -->|$2| $3'
    );

    // ── Fix 1b: Unquoted chained arrow-label syntax (e.g. A --- label --> B) ─
    text = text.replace(
        /([A-Za-z0-9_"'\(\)\[\]]+)\s*--+\s*([^|"\n]+?)\s*--+>\s*([A-Za-z0-9_"'\(\)\[\]]+)/g,
        '$1 -->|$2| $3'
    );

    // ── Fix 2: Quote arrow labels that contain special characters or text ───
    text = text.replace(/(\s*--+>?\s*|==+>?\s*|-\.-+>?\s*)\|([^|"\n]+)\|/g, '$1|"$2"|');

    // ── Detect Node ID Prefix ────────────────────────────────────────────────
    // Check if the graph already uses "id1", "id2" prefix for nodes.
    // If it does, we use "id" as the prefix for any raw numeric IDs. Otherwise, we default to "n".
    const hasIdPrefix = /\bid\d+\b/.test(text);
    const prefix = hasIdPrefix ? 'id' : 'n';

    // ── Temporarily Extract Shape Containers / Labels ────────────────────────
    // We use a non-word character delimiter like ' §LABEL_idx§' to preserve word boundaries
    const labels = [];
    const shapeRegex = /(\(\(.*?\)\)|\(\[.*?\]\)|\[\[.*?\]\]|\[\(.*?\)\]|\[.*?\]|\(.*?\)|\{.*?\})/g;
    
    let tempText = text.replace(shapeRegex, (match) => {
        labels.push(match);
        return ` §LABEL_${labels.length - 1}§`;
    });

    // Split supporting all line endings (\n, \r\n, \r)
    const lines = tempText.split(/\r?\n|\r/);

    // ── Collect all numeric node IDs from the label-less text ────────────────
    const numericIdSet = new Set();
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('%%') || trimmed.startsWith('graph') ||
            trimmed.startsWith('flowchart') || trimmed.startsWith('subgraph') ||
            trimmed === 'end') return;

        const cleanLine = trimmed.replace(/"[^"]*"/g, '');
        // Match numbers that are not preceded by # or . and not followed by letters or .
        const matches = cleanLine.matchAll(/(?<![\w#\.])\b(\d+)\b(?![\w\.])/g);
        for (const m of matches) {
            const num = m[1];
            const index = m.index;
            const before = cleanLine.substring(0, index).trim();
            // Ignore style declarations or parameters
            if (before.endsWith(':') || before.endsWith('stroke-width') || before.endsWith('linkStyle') || before.endsWith('classDef')) {
                continue;
            }
            numericIdSet.add(num);
        }
    });

    // Build replacement map: "1" → "id1", "2" → "id2", etc.
    const idMap = {};
    numericIdSet.forEach(id => { idMap[id] = `${prefix}${id}`; });

    // Helper: rename numeric IDs in a line
    const renameIds = (line) => {
        if (!numericIdSet.size) return line;
        const sortedOldIds = Object.keys(idMap).sort((a, b) => b.length - a.length);
        for (const oldId of sortedOldIds) {
            const newId = idMap[oldId];
            line = line.replace(new RegExp(`(?<![\\w#\\.])\\b${oldId}\\b(?![\\w\\.])`, 'g'), newId);
        }
        return line;
    };

    const processedLines = lines.map(line => {
        let trimmed = line.trim();

        // Remove trailing semicolons from style/class/linkStyle lines
        if (trimmed.endsWith(';')) {
            line = line.substring(0, line.lastIndexOf(';'));
            trimmed = line.trim();
        }

        // ── Fix 4: Convert invalid single '%' comments to double '%%'
        if (trimmed.startsWith('%') && !trimmed.startsWith('%%')) {
            line = '%%' + trimmed.substring(1);
            trimmed = line.trim();
        }

        // Skip directive/comment/structural lines
        if (trimmed.startsWith('%%') || trimmed.startsWith('%%{')) return line;
        if (trimmed === 'end') return line;

        // Fix subgraph labels — wrap in quotes if they contain spaces or special characters
        if (trimmed.startsWith('subgraph ')) {
            const content = trimmed.substring(9).trim();
            if (content && !content.startsWith('"') && !content.endsWith('"')) {
                if (/[\s\{\}\(\)\[\]\|]/.test(content)) {
                    return `subgraph "${content}"`;
                }
            }
            return line;
        }

        // Convert invalid '--' connectors to valid '---' (undirected links)
        line = line.replace(/(?<!-)\s*--\s*(?![->|])/g, ' --- ');

        // Apply numeric ID renaming
        line = renameIds(line);
        trimmed = line.trim();

        // ── Fix 5: Convert invalid '=' to ':' in styles/linkStyles/classDefs
        // Also fix common AI typos like 'xtroke' to 'stroke'
        // DO NOT add double quotes to style attribute values because it causes syntax errors in Mermaid
        if (trimmed.startsWith('style ') || trimmed.startsWith('linkStyle ') || trimmed.startsWith('classDef ')) {
            line = line.replace(/\bxtroke\b/gi, 'stroke');
            line = line.replace(/\b(fill|stroke|stroke-width|color|stroke-dasharray|background|border)\s*=\s*([^,\s;]+)/g, '$1:$2');
            trimmed = line.trim();
        }

        // ── Fix 6: Clean up spaces after commas in class assignment statements
        // e.g. class id1, id2, id3 levelStyle -> class id1,id2,id3 levelStyle
        if (trimmed.startsWith('class ')) {
            const classParts = trimmed.split(/\s+/);
            if (classParts.length >= 3) {
                const className = classParts[classParts.length - 1];
                const idsJoined = classParts.slice(1, classParts.length - 1).join('').replace(/\s+/g, '');
                line = `${classParts[0]} ${idsJoined} ${className}`;
                trimmed = line.trim();
            }
        }

        return line;
    });

    // Reconstruct the text with renamed IDs and original labels
    let result = processedLines.join('\n');
    
    // Restore and sanitize the original shape containers / labels from placeholders
    result = result.replace(/\s*§LABEL_(\d+)§/g, (match, index) => {
        const rawLabel = labels[parseInt(index)];
        return sanitizeMermaidLabel(rawLabel);
    });

    result = result.replace(/\n{3,}/g, '\n\n').trim();

    // Also fix any remaining 'xtroke' typos outside of style blocks
    result = result.replace(/\bxtroke\b/gi, 'stroke');

    // ── Hasse/lattice direction fix ───────────────────────────────────────────
    // Detect if this is a Hasse / vertical hierarchy / lattice diagram
    const lowerText = result.toLowerCase();
    
    // Check if the graph contains nodes named a-g in a classic lattice pattern
    // e.g. a --> b, f --> g, etc.
    const isClassicLetterLattice = /\b[a-g]\s*-->\s*[a-g]\b/.test(result);

    const isHasse = lowerText.includes('hasse') || 
                    lowerText.includes('lattice') || 
                    lowerText.includes('partial order') || 
                    lowerText.includes('poset') || 
                    lowerText.includes('divides') ||
                    lowerText.includes('level') ||
                    lowerText.includes('top level') ||
                    lowerText.includes('bottom level') ||
                    isClassicLetterLattice;

    if (isHasse) {
        // Change Top-to-Bottom (TD/TB) to Bottom-to-Top (BT) so minimal nodes go to the bottom
        result = result.replace(/\b(graph|flowchart)\s+(TD|TB)\b/i, '$1 BT');
    }

    // ── Inject Default Labels for Renamed Numeric IDs ────────────────────────
    // This ensures that renamed numeric nodes (like '1' -> 'n1') render showing '1' instead of 'n1'.
    if (numericIdSet.size > 0) {
        const linesOfResult = result.split('\n');
        // Find the index of the graph header line (e.g. graph TD, flowchart BT)
        const headerIndex = linesOfResult.findIndex(l => 
            /^\s*(graph|flowchart)\s+(TD|TB|BT|RL|LR)\b/i.test(l)
        );
        if (headerIndex !== -1) {
            const declarations = [];
            numericIdSet.forEach(id => {
                const alreadyHasLabel = new RegExp(`\\b${prefix}${id}\\s*([\\(\\[\\{\\"])`).test(result);
                if (!alreadyHasLabel) {
                    declarations.push(`    ${prefix}${id}["${id}"]`);
                }
            });
            if (declarations.length > 0) {
                linesOfResult.splice(headerIndex + 1, 0, ...declarations);
                result = linesOfResult.join('\n');
            }
        }
    }

    return result;
};
const MermaidElement = memo(({ chart }) => {
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const elementId = useRef(`mermaid-${Math.floor(Math.random() * 1000000)}`);

    useEffect(() => {
        const renderChart = async () => {
            try {
                setError(null);
                const cleanedChart = cleanMermaidChart(chart);
                const { svg: renderedSvg } = await mermaid.render(elementId.current, cleanedChart);
                setSvg(renderedSvg);
            } catch (err) {
                console.error('[Mermaid render error]', err);
                const cleaned = cleanMermaidChart(chart);
                setError({
                    message: err.message || String(err),
                    cleanedChart: cleaned
                });
                const container = document.getElementById(elementId.current);
                if (container) container.remove();
            }
        };
        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl text-xs text-red-500 font-mono overflow-x-auto my-3 w-full">
                <p className="font-bold text-sm mb-1">⚠️ Diagram Rendering Error:</p>
                <p className="font-semibold text-red-600 dark:text-red-400 mb-3 bg-red-100/50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200/50 dark:border-red-900/30">{error.message}</p>
                <p className="font-bold mb-1 opacity-70">Processed Chart Syntax Sent to Mermaid:</p>
                <pre className="text-[10px] leading-tight bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800">{error.cleanedChart}</pre>
                <p className="font-bold mt-3 mb-1 opacity-70">Original Response Output:</p>
                <pre className="text-[10px] leading-tight bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl">{chart}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-gray-800 my-3">
                <Loader2 size={16} className="animate-spin text-orange-500" />
                <span className="text-xs text-slate-400 ml-2">Drawing diagram...</span>
            </div>
        );
    }

    return (
        <div 
            className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-gray-800 rounded-3xl shadow-sm flex justify-center overflow-x-auto my-4 transition-all w-full max-w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
});

/* Cycles through contextual thinking phrases every 2s — feels alive like NotebookLM */
const THINKING_PHRASES = [
    'Analysing documents',
    'Thinking',
    'Searching knowledge',
    'Crafting response',
];

const ThinkingIndicator = () => {
    const [phraseIdx, setPhraseIdx] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIdx(prev => (prev + 1) % THINKING_PHRASES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 py-1">
            {/* Pulsing icon ring */}
            <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-orange-400/20 animate-ping" />
                <div className="relative w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin text-orange-500" />
                </div>
            </div>
            {/* Cycling label + bouncing dots */}
            <div className="flex items-center gap-1.5">
                <span
                    key={phraseIdx}
                    className="text-sm font-semibold text-slate-500 dark:text-slate-400 transition-all duration-500"
                >
                    {THINKING_PHRASES[phraseIdx]}
                </span>
                <span className="flex items-end gap-0.5 pb-0.5">
                    <span className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
            </div>
        </div>
    );
};


const preprocessMath = (text) => {
    if (!text) return '';
    
    // Split the text into segments: math blocks (inside $ or $$) and plain text blocks.
    const tokens = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);
    
    const processedTokens = tokens.map((token, index) => {
        if (index % 2 === 0) {
            // Out-of-math block: replace standalone LaTeX symbols with inline math
            let t = token;
            
            const symbolsToWrap = [
                'vee', 'wedge', 'neg', 'in', 'notin', 'forall', 'exists', 
                'cup', 'cap', 'subset', 'subseteq', 'varnothing', 'emptyset',
                'to', 'gets', 'iff', 'implies', 'impliedby', 'oplus', 'otimes',
                'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
                'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
                'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
            ];
            
            symbolsToWrap.forEach(sym => {
                const regex = new RegExp(`\\\\${sym}\\b`, 'g');
                t = t.replace(regex, `$ \\\\${sym} $`);
            });
            
            // Auto-wrap unwrapped LaTeX math environments
            t = t.replace(/\\begin\{(bmatrix|matrix|pmatrix|array|align|equation|cases|split)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
                let mathContent = match;
                // Clean up any nested inline wrappers inside the environment
                mathContent = mathContent.replace(/\$\s*\\(\w+)\s*\$/g, '\\$1');
                return `\n$$\n${mathContent.trim()}\n$$\n`;
            });
            
            return t;
        } else {
            return token;
        }
    });
    
    let result = processedTokens.join('');
    
    // Merge contiguous math blocks separated only by logic symbols/connectives
    let prevResult;
    do {
        prevResult = result;
        result = result.replace(/\$\$\s*([\s\S]*?)\s*\$\$\s*([\s\S]*?)\s*\$\$\s*([\s\S]*?)\s*\$\$/g, (match, g1, g2, g3) => {
            const isMathConnective = /^[\s\n\r,=+\-*\\a-zA-Z$()]*$/.test(g2) && !/[a-zA-Z]{5,}/.test(g2);
            if (isMathConnective) {
                const cleanConnective = g2.replace(/\$/g, '');
                return `$$\n${g1.trim()}\n${cleanConnective.trim()}\n${g3.trim()}\n$$`;
            }
            return match;
        });
    } while (result !== prevResult);
    
    return result;
};

const AskMyNotes = () => {
    // Reusable Custom Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        type: 'danger',
        onConfirm: () => {},
        onCancel: () => {}
    });

    const showConfirm = ({ title, message, confirmText = "Confirm", type = "danger" }) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title,
                message,
                confirmText,
                type,
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    };

    // Memoize ReactMarkdown custom component overrides to prevent component recreation/flickering
    const markdownComponents = useMemo(() => ({
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match && match[1] === 'mermaid') {
                return <MermaidElement chart={String(children).replace(/\n$/, '')} />;
            }
            if (inline) {
                return (
                    <code 
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-mono text-xs break-all whitespace-pre-wrap" 
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            return (
                <code 
                    className={`${className || ''} block overflow-x-auto text-xs font-mono bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl max-w-full`} 
                    {...props}
                >
                    {children}
                </code>
            );
        },
        pre({ children }) {
            return (
                <pre className="w-full overflow-x-auto bg-slate-50 dark:bg-slate-950/50 border border-slate-100/50 dark:border-gray-800/50 rounded-xl my-3 p-3 max-w-full">
                    {children}
                </pre>
            );
        },
        h1({ children }) {
            return <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-7 mb-2 pb-1.5 border-b-2 border-slate-200 dark:border-gray-700">{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-6 mb-1.5">{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mt-5 mb-1">{children}</h3>;
        },
        h4({ children }) {
            return <h4 className="text-base font-bold text-slate-600 dark:text-slate-300 mt-4 mb-0.5">{children}</h4>;
        },
        p({ children }) {
            return <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
            return <ul className="list-disc list-inside space-y-0.5 my-2 text-xs md:text-sm text-slate-700 dark:text-slate-300">{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal list-inside space-y-0.5 my-2 text-xs md:text-sm text-slate-700 dark:text-slate-300">{children}</ol>;
        },
        li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
        },
        hr() {
            return <hr className="my-3 border-slate-100 dark:border-gray-800" />;
        },
        blockquote({ children }) {
            return <blockquote className="border-l-2 border-orange-400 pl-3 my-2 text-xs italic text-slate-500 dark:text-slate-400">{children}</blockquote>;
        },
        strong({ children }) {
            return <strong className="font-bold text-slate-800 dark:text-slate-100">{children}</strong>;
        },
        table({ children }) {
            return (
                <div className="w-full overflow-x-auto my-4 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-gray-900">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-800 text-xs text-left">
                        {children}
                    </table>
                </div>
            );
        },
        th({ children }) {
            return (
                <th className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
                    {children}
                </th>
            );
        },
        td({ children }) {
            return (
                <td className="px-4 py-3 border-t border-slate-100 dark:border-gray-800 text-slate-600 dark:text-slate-300 whitespace-normal leading-relaxed">
                    {children}
                </td>
            );
        }
    }), []);

    // Workspace Hub State
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
    const [newWsName, setNewWsName] = useState('');
    const [newWsDesc, setNewWsDesc] = useState('');
    const [isCreatingWs, setIsCreatingWs] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMobileSourcesOpen, setIsMobileSourcesOpen] = useState(false);
    const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
    const { subjectId } = useParams();
    const navigate = useNavigate();

    // Active Workspace State
    const [sources, setSources] = useState([]);
    const [loadingSources, setLoadingSources] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Chat State
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    // Voice input — replaces input with base + live transcript (no duplication)
    const { isListening, isSupported: isVoiceSupported, startListening, stopListening } = useVoiceInput(
        useCallback((transcript) => {
            // transcript already contains the base prefix from the hook
            setChatInput(transcript);
        }, [])
    );
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesContainerRef = useRef(null);

    // Study Pane / Right Pane State
    const [studyTab, setStudyTab] = useState('notes'); // 'notes' | 'quiz' | 'flashcards'
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [flashcards, setFlashcards] = useState([]);
    const [currentCardIdx, setCurrentCardIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // AI Generation States
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [isGeneratingCards, setIsGeneratingCards] = useState(false);

    // Save notes indicator
    const [isSavingNote, setIsSavingNote] = useState(false);
    const noteSaveTimeoutRef = useRef(null);

    // ==========================================
    // INITIALIZATION & WORKSPACE HUB API CALLS
    // ==========================================
    useEffect(() => {
        fetchWorkspaces();
    }, [subjectId]);

    // Sync studyTab and Quiz states to localStorage
    useEffect(() => {
        if (activeWorkspace) {
            localStorage.setItem('study_tab', studyTab);
        }
    }, [studyTab, activeWorkspace]);

    useEffect(() => {
        if (activeWorkspace) {
            if (activeQuiz) {
                localStorage.setItem('active_quiz_id', activeQuiz.id);
            } else {
                localStorage.removeItem('active_quiz_id');
            }
        }
    }, [activeQuiz, activeWorkspace]);

    useEffect(() => {
        if (activeWorkspace) {
            localStorage.setItem('quiz_answers', JSON.stringify(quizAnswers));
        }
    }, [quizAnswers, activeWorkspace]);

    useEffect(() => {
        if (activeWorkspace) {
            if (quizResult) {
                localStorage.setItem('quiz_result', JSON.stringify(quizResult));
            } else {
                localStorage.removeItem('quiz_result');
            }
        }
    }, [quizResult, activeWorkspace]);

    const fetchWorkspaces = async () => {
        setLoadingWorkspaces(true);
        try {
            const res = await socialApi.get('/workspaces');
            const list = res.data.workspaces || [];
            setWorkspaces(list);

            if (subjectId) {
                const foundWs = list.find(w => w.id === parseInt(subjectId));
                if (foundWs) {
                    handleSelectWorkspace(foundWs, false);
                } else {
                    setActiveWorkspace(null);
                }
            } else {
                setActiveWorkspace(null);
            }
        } catch (err) {
            console.error('Failed to fetch workspaces:', err);
            toast.error('Failed to load workspaces');
        } finally {
            setLoadingWorkspaces(false);
        }
    };

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        if (!newWsName.trim()) return;

        setIsCreatingWs(true);
        try {
            const res = await socialApi.post('/workspaces', {
                name: newWsName.trim(),
                description: newWsDesc.trim()
            });
            setWorkspaces([res.data.workspace, ...workspaces]);
            setNewWsName('');
            setNewWsDesc('');
            toast.success('Subject created!');
        } catch (err) {
            console.error('Failed to create workspace:', err);
            toast.error('Failed to create subject');
        } finally {
            setIsCreatingWs(false);
        }
    };

    const handleDeleteWorkspace = async (wsId, e) => {
        e.stopPropagation(); // Prevent entering workspace
        
        const confirmed = await showConfirm({
            title: "Delete Subject",
            message: "Are you sure you want to delete this subject? This will permanently delete all uploaded files, chats, quizzes, and notes!",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        try {
            await socialApi.delete(`/workspaces/${wsId}`);
            setWorkspaces(workspaces.filter(ws => ws.id !== wsId));
            if (activeWorkspace?.id === wsId) {
                handleBackToWorkspaces();
            }
            toast.success('Subject deleted');
        } catch (err) {
            console.error('Failed to delete workspace:', err);
            toast.error('Failed to delete subject');
        }
    };

    // ==========================================
    // ACTIVE WORKSPACE LOADING & SOURCE INGESTION
    // ==========================================
    const handleSelectWorkspace = async (workspace, shouldNavigate = true) => {
        setActiveWorkspace(workspace);
        localStorage.setItem('active_workspace_id', workspace.id);
        if (shouldNavigate) {
            navigate(`/dashboard/ask-my-notes/${workspace.id}`);
        }
        setSources([]);
        setChats([]);
        setActiveChat(null);
        setMessages([]);
        setNotes([]);
        setActiveNote(null);
        setQuizzes([]);
        setActiveQuiz(null);
        setFlashcards([]);
        
        // Restore tab preference
        const savedTab = localStorage.getItem('study_tab');
        setStudyTab(savedTab || 'notes');

        // Fetch sources, chats, notes, quizzes, flashcards
        fetchSources(workspace.id);
        fetchChats(workspace.id);
        fetchNotes(workspace.id);
        fetchQuizzes(workspace.id);
        fetchFlashcards(workspace.id);
    };

    const handleBackToWorkspaces = () => {
        setActiveWorkspace(null);
        localStorage.removeItem('active_workspace_id');
        localStorage.removeItem('active_chat_id');
        localStorage.removeItem('study_tab');
        localStorage.removeItem('active_quiz_id');
        localStorage.removeItem('quiz_answers');
        localStorage.removeItem('quiz_result');
        navigate('/dashboard/ask-my-notes');
    };

    const fetchSources = async (wsId) => {
        setLoadingSources(true);
        try {
            const res = await socialApi.get(`/workspaces/${wsId}`);
            setSources(res.data.workspace.sources || []);
        } catch (err) {
            console.error('Failed to fetch sources:', err);
        } finally {
            setLoadingSources(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeWorkspace) return;

        // Check file size (25MB limit)
        if (file.size > 25 * 1024 * 1024) {
            toast.error('File size exceeds 25MB limit.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        const toastId = toast.loading(`Uploading & Indexing ${file.name}...`);
        try {
            const res = await socialApi.post(`/workspaces/${activeWorkspace.id}/sources`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Add the new source locally (status will be PROCESSING)
            setSources([res.data.source, ...sources]);
            toast.success('Upload complete! Document is indexing in background.', { id: toastId });

            // Poll sources to monitor indexing status
            pollSourceStatus(activeWorkspace.id);
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Failed to upload document', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const pollSourceStatus = (wsId) => {
        const interval = setInterval(async () => {
            if (!activeWorkspace || activeWorkspace.id !== wsId) {
                clearInterval(interval);
                return;
            }
            try {
                const res = await socialApi.get(`/workspaces/${wsId}`);
                const currentSources = res.data.workspace.sources || [];
                setSources(currentSources);

                // If no source is still in PROCESSING status, stop polling
                const isStillProcessing = currentSources.some(s => s.status === 'PROCESSING' || s.status === 'PENDING');
                if (!isStillProcessing) {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Error polling sources:', err);
                clearInterval(interval);
            }
        }, 4000);
    };

    const handleDeleteSource = async (sourceId) => {
        const confirmed = await showConfirm({
            title: "Delete Document",
            message: "Are you sure you want to delete this file from your subject?",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        try {
            await socialApi.delete(`/workspaces/${activeWorkspace.id}/sources/${sourceId}`);
            setSources(sources.filter(s => s.id !== sourceId));
            toast.success('Source deleted');
        } catch (err) {
            console.error('Failed to delete source:', err);
            toast.error('Failed to delete source');
        }
    };

    // ==========================================
    // CHAT ACTIONS & SSE STREAMING
    // ==========================================
    const fetchChats = async (wsId) => {
        setLoadingChats(true);
        try {
            const res = await socialApi.get(`/workspaces/${wsId}/chats`);
            const chatSessions = res.data.chats || [];
            setChats(chatSessions);
            
            const savedChatId = localStorage.getItem('active_chat_id');
            const foundChat = chatSessions.find(c => c.id === parseInt(savedChatId));
            
            if (foundChat) {
                handleSelectChat(wsId, foundChat);
            } else if (chatSessions.length > 0) {
                handleSelectChat(wsId, chatSessions[0]);
            } else {
                // Auto create first chat session
                handleCreateChat(wsId);
            }
        } catch (err) {
            console.error('Failed to fetch chats:', err);
        } finally {
            setLoadingChats(false);
        }
    };

    const handleCreateChat = async (wsId = activeWorkspace?.id) => {
        if (!wsId) return;
        try {
            const res = await socialApi.post(`/workspaces/${wsId}/chats`, { title: 'New Chat' });
            setChats([res.data.chatSession, ...chats]);
            setActiveChat(res.data.chatSession);
            setMessages([]);
        } catch (err) {
            console.error('Failed to create chat session:', err);
        }
    };

    const handleSelectChat = async (wsId, chat) => {
        setActiveChat(chat);
        localStorage.setItem('active_chat_id', chat.id);
        setLoadingMessages(true);
        setMessages([]);
        try {
            const res = await socialApi.get(`/workspaces/${wsId}/chats/${chat.id}/messages`);
            setMessages(res.data.messages || []);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to fetch chat messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e, customPrompt = null) => {
        e?.preventDefault();
        
        const userPrompt = customPrompt || chatInput.trim();
        if (!userPrompt || isStreaming || !activeWorkspace || !activeChat) return;

        if (!customPrompt) {
            setChatInput('');
        }
        setIsStreaming(true);

        // Add user message locally
        const userMsg = { id: Date.now(), role: 'user', content: userPrompt };
        // Place a temporary placeholder assistant message
        const assistantPlaceholder = { id: Date.now() + 1, role: 'assistant', content: '', citations: [] };

        setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
        scrollToBottom();

        const token = localStorage.getItem('google_token');
        let accumulatedText = '';
        let citations = [];

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/workspaces/${activeWorkspace.id}/chats/${activeChat.id}/message`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ query: userPrompt })
                }
            );

            if (!response.ok) {
                throw new Error('Server returned an error');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunk = decoder.decode(value, { stream: !done });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        const cleaned = line.trim();
                        if (cleaned.startsWith('data:')) {
                            try {
                                const parsed = JSON.parse(cleaned.substring(5).trim());
                                if (parsed.event === 'token') {
                                    accumulatedText += parsed.token;
                                    setMessages(prev => {
                                        const next = [...prev];
                                        if (next.length > 0) {
                                            next[next.length - 1] = {
                                                ...next[next.length - 1],
                                                content: accumulatedText
                                            };
                                        }
                                        return next;
                                    });
                                } else if (parsed.event === 'complete') {
                                    citations = parsed.citations || [];
                                    setMessages(prev => {
                                        const next = [...prev];
                                        if (next.length > 0) {
                                            next[next.length - 1] = {
                                                ...next[next.length - 1],
                                                id: parsed.messageId,
                                                content: accumulatedText,
                                                citations
                                            };
                                        }
                                        return next;
                                    });
                                } else if (parsed.event === 'error') {
                                    throw new Error(parsed.error);
                                }
                            } catch (e) { }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Chat stream failed:', err);
            setMessages(prev => {
                const next = [...prev];
                if (next.length > 0) {
                    next[next.length - 1] = {
                        ...next[next.length - 1],
                        content: `Error: ${err.message || 'Failed to generate response. Ensure LearnProof AI is active.'}`
                    };
                }
                return next;
            });
        } finally {
            setIsStreaming(false);
            scrollToBottom();
            // Refresh chats list to update dynamic titles if first message
            fetchChats(activeWorkspace.id);
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = 0; // 0 = bottom in flex-col-reverse
        }
    };

    // ==========================================
    // STUDY PANE API: NOTES, QUIZZES, FLASHCARDS
    // ==========================================
    const fetchNotes = async (wsId) => {
        try {
            const res = await socialApi.get(`/workspaces/${wsId}/notes`);
            const workspaceNotes = res.data.notes || [];
            setNotes(workspaceNotes);
            if (workspaceNotes.length > 0) {
                setActiveNote(workspaceNotes[0]);
            } else {
                // Auto create empty first note
                handleCreateNote(wsId);
            }
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        }
    };

    const handleCreateNote = async (wsId = activeWorkspace?.id) => {
        if (!wsId) return;
        try {
            const res = await socialApi.post(`/workspaces/${wsId}/notes`, {
                title: `Lesson Note - ${new Date().toLocaleDateString()}`,
                content: ''
            });
            setNotes([res.data.note, ...notes]);
            setActiveNote(res.data.note);
        } catch (err) {
            console.error('Failed to create note:', err);
        }
    };

    const handleUpdateNoteContent = (content) => {
        if (!activeNote || !activeWorkspace) return;

        setActiveNote(prev => ({ ...prev, content }));

        // Clear existing debounce timeout
        if (noteSaveTimeoutRef.current) {
            clearTimeout(noteSaveTimeoutRef.current);
        }

        setIsSavingNote(true);
        // Debounce auto-save to API after 1.5 seconds of silence
        noteSaveTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await socialApi.put(`/workspaces/${activeWorkspace.id}/notes/${activeNote.id}`, {
                    title: activeNote.title,
                    content
                });

                // Update local notes list
                setNotes(notes.map(n => n.id === activeNote.id ? res.data.note : n));
            } catch (err) {
                console.error('Auto-save failed:', err);
            } finally {
                setIsSavingNote(false);
            }
        }, 1500);
    };

    const handleUpdateNoteTitle = async (title) => {
        if (!activeNote || !activeWorkspace || !title.trim()) return;
        try {
            const res = await socialApi.put(`/workspaces/${activeWorkspace.id}/notes/${activeNote.id}`, {
                title: title.trim(),
                content: activeNote.content
            });
            setActiveNote(res.data.note);
            setNotes(notes.map(n => n.id === activeNote.id ? res.data.note : n));
            toast.success('Title updated');
        } catch (err) {
            console.error('Failed to update title:', err);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (notes.length <= 1) {
            toast.error('You must keep at least one note');
            return;
        }
        
        const confirmed = await showConfirm({
            title: "Delete Note",
            message: "Are you sure you want to permanently delete this lesson note?",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        try {
            await socialApi.delete(`/workspaces/${activeWorkspace.id}/notes/${noteId}`);
            const nextNotes = notes.filter(n => n.id !== noteId);
            setNotes(nextNotes);
            setActiveNote(nextNotes[0]);
            toast.success('Note deleted');
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    const fetchQuizzes = async (wsId) => {
        try {
            const details = await socialApi.get(`/workspaces/${wsId}`);
            const list = details.data.workspace.quizzes || [];
            setQuizzes(list);

            // Restore active quiz session on reload
            const savedQuizId = localStorage.getItem('active_quiz_id');
            if (savedQuizId) {
                const foundQuiz = list.find(q => q.id === parseInt(savedQuizId));
                if (foundQuiz) {
                    setActiveQuiz(foundQuiz);
                    
                    const savedAnswers = localStorage.getItem('quiz_answers');
                    if (savedAnswers) {
                        try {
                            setQuizAnswers(JSON.parse(savedAnswers));
                        } catch (e) {}
                    }
                    const savedResult = localStorage.getItem('quiz_result');
                    if (savedResult) {
                        try {
                            setQuizResult(JSON.parse(savedResult));
                        } catch (e) {}
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load quizzes:', err);
        }
    };

    const fetchFlashcards = async (wsId) => {
        try {
            const details = await socialApi.get(`/workspaces/${wsId}`);
            setFlashcards(details.data.workspace.flashcards || []);
            setCurrentCardIdx(0);
            setIsFlipped(false);
        } catch (err) {
            console.error('Failed to load flashcards:', err);
        }
    };

    const handleStartQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setQuizAnswers({});
        setQuizResult(null);
    };

    const handleQuizOptionSelect = (qIdx, optionIdx) => {
        setQuizAnswers(prev => ({
            ...prev,
            [qIdx]: optionIdx
        }));
    };

    const handleSubmitQuiz = () => {
        if (!activeQuiz) return;
        const questions = JSON.parse(activeQuiz.questions);
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
    };

    // ==========================================
    // DIFY AI WORKFLOW TRIGGER ACTIONS
    // ==========================================
    const triggerGenerateSummary = async () => {
        if (sources.length === 0) {
            toast.error('Please upload at least one document to generate a summary!');
            return;
        }

        setIsGeneratingSummary(true);
        const toastId = toast.loading('Reading documents and writing summary...');
        try {
            // Ensure a chat session is selected
            let targetChat = activeChat;
            if (!targetChat) {
                if (chats.length > 0) {
                    targetChat = chats[0];
                    await handleSelectChat(activeWorkspace.id, targetChat);
                } else {
                    // Auto-create chat session
                    const res = await socialApi.post(`/workspaces/${activeWorkspace.id}/chats`, { title: 'AI Study Chat' });
                    targetChat = res.data.chatSession;
                    setChats([targetChat]);
                    setActiveChat(targetChat);
                    setMessages([]);
                }
            }

            // Stream summary directly in active chat thread
            await handleSendMessage(null, "Please read the uploaded subject document(s) and provide a detailed, comprehensive summary of the core concepts, definitions, and lessons in a highly readable academic format.");
            toast.success('Summary generated directly in your chat!', { id: toastId });
        } catch (err) {
            console.error('Summary generation error:', err);
            toast.error('Failed to generate summary.', { id: toastId });
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const triggerGenerateQuiz = async () => {
        if (sources.length === 0) {
            toast.error('Upload documents first to generate a quiz!');
            return;
        }
        setIsGeneratingQuiz(true);
        const id = toast.loading('Assembling interactive test questions...');
        try {
            await socialApi.post(`/workspaces/${activeWorkspace.id}/tools/quiz`, { count: 5, format: 'MCQ' });
            toast.success('Quiz generated successfully!', { id });

            // Reload quizzes
            const details = await socialApi.get(`/workspaces/${activeWorkspace.id}`);
            const updatedQuizzes = details.data.workspace.quizzes || [];
            setQuizzes(updatedQuizzes);
            setStudyTab('quiz');
            if (updatedQuizzes.length > 0) {
                handleStartQuiz(updatedQuizzes[0]);
            }
        } catch (err) {
            console.error('Quiz generation error:', err);
            toast.error(err.response?.data?.error || 'Failed to generate quiz.', { id });
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const triggerGenerateFlashcards = async () => {
        if (sources.length === 0) {
            toast.error('Upload documents first to generate flashcards!');
            return;
        }
        setIsGeneratingCards(true);
        const id = toast.loading('Extracting key concepts into study flashcards...');
        try {
            await socialApi.post(`/workspaces/${activeWorkspace.id}/tools/flashcards`, { count: 8 });
            toast.success('Flashcards generated successfully!', { id });

            // Reload flashcards
            const details = await socialApi.get(`/workspaces/${activeWorkspace.id}`);
            setFlashcards(details.data.workspace.flashcards || []);
            setStudyTab('flashcards');
            setCurrentCardIdx(0);
            setIsFlipped(false);
        } catch (err) {
            console.error('Flashcard generation error:', err);
            toast.error(err.response?.data?.error || 'Failed to generate flashcards.', { id });
        } finally {
            setIsGeneratingCards(false);
        }
    };

    const handleFlipCard = () => {
        setIsFlipped(!isFlipped);
    };

    const handleCardRating = (rating) => {
        toast.success(`Card rated ${rating}. Interval updated!`);
        setIsFlipped(false);
        if (currentCardIdx < flashcards.length - 1) {
            setCurrentCardIdx(currentCardIdx + 1);
        } else {
            toast('Subject study deck finished!', { icon: '🎉' });
            setCurrentCardIdx(0);
        }
    };

    const renderStudyToolsContent = () => {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                {/* Tab Selector */}
                <div className="h-14 shrink-0 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 flex p-1.5 select-none gap-1">
                    {['notes', 'quiz', 'flashcards'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStudyTab(tab)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${studyTab === tab
                                    ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-100 dark:border-gray-700/50'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* TAB A: NOTES PANEL */}
                {studyTab === 'notes' && (
                    <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                        <div className="flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Notebook ({notes.length})
                            </span>
                            <button
                                onClick={() => handleCreateNote()}
                                className="p-1 hover:bg-orange-500/10 text-orange-500 rounded-md transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {notes.length > 0 && activeNote ? (
                            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={activeNote.title}
                                        onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                                        onBlur={(e) => handleUpdateNoteTitle(e.target.value)}
                                        className="w-full font-black text-sm tracking-tight border-b border-transparent hover:border-slate-200 dark:hover:border-gray-800 focus:border-orange-500 dark:focus:border-orange-400 bg-transparent text-slate-800 dark:text-white pb-1 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => handleDeleteNote(activeNote.id)}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <ReactQuill
                                        theme="snow"
                                        value={activeNote.content}
                                        onChange={handleUpdateNoteContent}
                                        className="h-full border-none dark:text-white"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400">
                                No notes yet. Click the + button above to create one.
                            </div>
                        )}
                    </div>
                )}

                {/* TAB B: QUIZ PANEL */}
                {studyTab === 'quiz' && (
                    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                        <div className="flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Subject Quizzes
                            </span>
                        </div>

                        {quizzes.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <HelpCircle className="text-orange-200 dark:text-gray-700 mb-3 animate-pulse" size={36} />
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    No quizzes generated yet. Generate a smart AI quiz from your notes and study materials to test your knowledge!
                                </p>
                                <button
                                    onClick={triggerGenerateQuiz}
                                    disabled={isGeneratingQuiz || sources.length === 0}
                                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    {isGeneratingQuiz ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                                    Generate Quiz
                                </button>
                            </div>
                        ) : activeQuiz ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                                        className="text-xs font-bold text-orange-500 flex items-center gap-1"
                                    >
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">
                                        Active Quiz
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {(() => {
                                        const parsedQuestions = typeof activeQuiz.questions === 'string'
                                            ? JSON.parse(activeQuiz.questions)
                                            : (activeQuiz.questions || []);
                                        return (
                                            <>
                                                <div className="space-y-4">
                                                    {parsedQuestions.map((q, qIdx) => (
                                                        <div key={qIdx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 p-4 rounded-2xl space-y-3">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                {qIdx + 1}. {q.questionText || q.question || q.text}
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                {(q.options || q.choices || []).map((opt, oIdx) => {
                                                                    const isSelected = quizAnswers[qIdx] === oIdx;
                                                                    const isCorrect = (q.correctOption !== undefined ? q.correctOption === oIdx : (q.correctAnswer === oIdx || q.answer === oIdx));
                                                                    const showResults = quizResult !== null;

                                                                    let optionStyle = "border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-800";
                                                                    if (showResults) {
                                                                        if (isCorrect) {
                                                                            optionStyle = "border-green-300 dark:border-green-950 bg-green-500/10 text-green-700 dark:text-green-400";
                                                                        } else if (isSelected) {
                                                                            optionStyle = "border-red-300 dark:border-red-950 bg-red-500/10 text-red-700 dark:text-red-400";
                                                                        }
                                                                    } else if (isSelected) {
                                                                        optionStyle = "border-orange-300 dark:border-orange-850 bg-orange-500/10 text-orange-600 dark:text-orange-400";
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={oIdx}
                                                                            disabled={showResults}
                                                                            onClick={() => handleQuizOptionSelect(qIdx, oIdx)}
                                                                            className={`w-full text-left p-3 border rounded-xl text-xs transition-all flex items-center justify-between ${optionStyle}`}
                                                                        >
                                                                            <span>{opt}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {quizResult && q.explanation && (
                                                                <p className="text-[10px] text-slate-400 leading-relaxed mt-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-dashed border-slate-100 dark:border-gray-800">
                                                                    {q.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {!quizResult ? (
                                                    <button
                                                        onClick={handleSubmitQuiz}
                                                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all"
                                                    >
                                                        Submit Answers
                                                    </button>
                                                ) : (
                                                    <div className="bg-orange-500/5 border border-orange-200 dark:border-orange-950 p-4 rounded-2xl text-center space-y-2">
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Score Result</p>
                                                        <p className="text-3xl font-black text-orange-500">{quizResult.score} / {parsedQuestions.length}</p>
                                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                                            {quizResult.score === parsedQuestions.length ? "Perfect! You master this subject!" : "Review the explanations above to learn from incorrect options."}
                                                        </p>
                                                        <button
                                                            onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                                                            className="w-full py-2 bg-orange-500 text-white rounded-xl text-xs font-bold uppercase"
                                                        >
                                                            Take another quiz
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {quizzes.map((q) => (
                                    <div
                                        key={q.id}
                                        onClick={() => handleStartQuiz(q)}
                                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 rounded-xl hover:border-orange-300 dark:hover:border-orange-900/50 transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{q.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{q.questions?.length || 0} Questions</p>
                                        </div>
                                        <Play size={14} className="text-orange-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB C: FLASHCARDS PANEL */}
                {studyTab === 'flashcards' && (
                    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                        <div className="flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Flashcard Deck
                            </span>
                        </div>

                        {flashcards.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <Layers className="text-orange-200 dark:text-gray-700 mb-3 animate-pulse" size={36} />
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    No cards generated yet. Create spaced-repetition active recall flashcards to learn definitions and concepts!
                                </p>
                                <button
                                    onClick={triggerGenerateFlashcards}
                                    disabled={isGeneratingCards || sources.length === 0}
                                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    {isGeneratingCards ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                                    Generate Cards
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {flashcards[currentCardIdx] && (
                                    <div className="space-y-4">
                                        {/* Flashcard Component */}
                                        <div
                                            onClick={handleFlipCard}
                                            className="w-full min-h-[200px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-gray-800 rounded-3xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:border-orange-300 dark:hover:border-orange-900/50 select-none relative overflow-hidden"
                                        >
                                            {/* Card Header: label + flip hint */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                    isFlipped 
                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                    {isFlipped ? '✓ Answer' : 'Question'}
                                                </span>
                                                <span className="text-[9px] text-slate-300 dark:text-slate-600 font-medium">
                                                    Tap to flip
                                                </span>
                                            </div>

                                            {/* Card Content */}
                                            <div className="flex-1 flex items-center justify-center py-4 text-center">
                                                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                                                    {isFlipped
                                                        ? (flashcards[currentCardIdx].answer || flashcards[currentCardIdx].back || '—')
                                                        : (flashcards[currentCardIdx].question || flashcards[currentCardIdx].front || '—')
                                                    }
                                                </p>
                                            </div>

                                            {/* Progress Indicator */}
                                            <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
                                                Card {currentCardIdx + 1} of {flashcards.length}
                                            </p>
                                        </div>

                                        {/* rating buttons */}
                                        {isFlipped && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCardRating('Hard')}
                                                    className="flex-1 py-2.5 border border-red-200 dark:border-red-950 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors"
                                                >
                                                    Hard
                                                </button>
                                                <button
                                                    onClick={() => handleCardRating('Medium')}
                                                    className="flex-1 py-2.5 border border-amber-200 dark:border-amber-950 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors"
                                                >
                                                    Good
                                                </button>
                                                <button
                                                    onClick={() => handleCardRating('Easy')}
                                                    className="flex-1 py-2.5 border border-green-200 dark:border-green-950 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors"
                                                >
                                                    Easy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // RENDER INTERFACE
    // ==========================================

    // VIEW 1: WORKSPACE HUB
    if (!activeWorkspace) {
        return (
            <div className="flex-1 flex flex-col bg-orange-50/50 dark:bg-gray-950 p-4 sm:p-8 lg:p-12 pb-32 sm:pb-36 h-full overflow-y-auto">
                <div className="max-w-[1600px] mx-auto w-full space-y-12 py-6">

                    {/* Premium Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-orange-200/40 dark:border-gray-800">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                            <div className="p-3.5 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center shrink-0">
                                <BrainCircuit className="text-white" size={32} />
                            </div>
                            <div>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-[9px] mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                    Learning Operating System
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Ask My Notes
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs sm:text-sm max-w-2xl leading-relaxed">
                                    Upload course documents, textbooks, or syllabus sheets to generate AI summaries, customized quizzes, and visual study cards.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-fit self-center bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:shadow-md hover:shadow-orange-500/10 active:scale-[0.98] transition-all shrink-0 cursor-pointer mt-3 sm:mt-0"
                        >
                            <Plus size={14} />
                            Create Subject
                        </button>
                    </div>

                    {/* Subjects Grid */}
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Your Active Subjects</h2>
                        {loadingWorkspaces ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="animate-spin text-orange-500" size={32} />
                            </div>
                        ) : workspaces.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 border border-dashed border-orange-200 dark:border-gray-700 rounded-3xl p-6">
                                <BrainCircuit className="mx-auto text-orange-200 dark:text-gray-700 mb-4 animate-pulse" size={48} />
                                <h3 className="font-bold text-slate-700 dark:text-slate-300">No subjects yet</h3>
                                <p className="text-xs text-slate-400 mt-1">Create your first isolated learning subject to start uploading documents.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {workspaces.map((ws) => (
                                    <div
                                        key={ws.id}
                                        onClick={() => handleSelectWorkspace(ws)}
                                        className="group/card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md hover:shadow-orange-500/5 hover:border-orange-400 dark:hover:border-orange-500/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                                    >
                                        {/* Orange glow accent on hover */}
                                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-500 to-amber-400 transform -translate-x-full group-hover/card:translate-x-0 transition-transform duration-300"></div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                                <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Active Subject</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg pr-6 group-hover/card:text-orange-500 transition-colors duration-300">
                                                {ws.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                {ws.description || "No description provided."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-700/40 mt-4 sm:mt-6 pt-3 sm:pt-4">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                                Created: {new Date(ws.createdAt).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteWorkspace(ws.id, e)}
                                                className="p-1.5 sm:p-2 bg-red-500/5 hover:bg-red-50 text-red-500 hover:text-white rounded-xl transition-all duration-300 border border-red-500/5"
                                            >
                                                <Trash2 size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Premium Animated Modal for Creating Subject */}
                    <AnimatePresence>
                        {isCreateModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{ type: "spring", duration: 0.4 }}
                                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-6 shadow-xl w-full max-w-lg z-10 relative space-y-5 overflow-hidden"
                                >
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                                        <Plus size={18} className="text-orange-500" />
                                        Create New Subject
                                    </h2>

                                    <form onSubmit={(e) => {
                                        handleCreateWorkspace(e);
                                        setIsCreateModalOpen(false);
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Subject Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Database Systems, Semester 5"
                                                value={newWsName}
                                                onChange={(e) => setNewWsName(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs sm:text-sm focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/5 transition-all text-slate-800 dark:text-white shadow-sm font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Optional Description</label>
                                            <input
                                                type="text"
                                                placeholder="Brief details or syllabus notes"
                                                value={newWsDesc}
                                                onChange={(e) => setNewWsDesc(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs sm:text-sm focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/5 transition-all text-slate-800 dark:text-white shadow-sm font-semibold"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsCreateModalOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-250 rounded-xl font-bold text-xs uppercase tracking-wider text-center active:scale-[0.98] transition-all cursor-pointer h-[42px]"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isCreatingWs || !newWsName.trim()}
                                                className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-50 h-[42px] cursor-pointer"
                                            >
                                                {isCreatingWs ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                                Initialize Subject
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // VIEW 2: ACTIVE THREE-PANE STUDY WORKSPACE
    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans">

            {/* Immersive Header */}
            <header className="h-16 shrink-0 bg-white dark:bg-gray-900 border-b border-orange-100 dark:border-gray-800 shadow-sm flex items-center justify-between px-3 sm:px-6 z-10 transition-colors">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToWorkspaces}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 border border-slate-100 dark:border-gray-800"
                        title="Back to subjects"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-gray-800"></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-black text-slate-800 dark:text-white text-sm sm:text-base tracking-tight leading-none truncate max-w-[90px] sm:max-w-none">
                                {activeWorkspace.name}
                            </h2>
                            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full tracking-wider shrink-0">
                                Subject
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right actions: Summary, Sources Toggle, and Tools Toggle */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Summary Button */}
                    <button
                        onClick={triggerGenerateSummary}
                        disabled={isGeneratingSummary || sources.length === 0}
                        className="p-2 sm:py-1.5 sm:px-3 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Generate Summary"
                    >
                        {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        <span className="hidden sm:inline">Summary</span>
                    </button>

                    {/* Sources Button (Mobile only - toggles left drawer) */}
                    <button
                        onClick={() => setIsMobileSourcesOpen(true)}
                        className="flex md:hidden p-2 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 rounded-xl text-xs font-bold items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="Sources list"
                    >
                        <Upload size={16} />
                        <span className="hidden sm:inline">Sources</span>
                    </button>

                    {/* Study Tools Button (Mobile only - toggles right drawer) */}
                    <button
                        onClick={() => setIsMobileToolsOpen(true)}
                        className="flex lg:hidden p-2 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 rounded-xl text-xs font-bold items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="Study Tools"
                    >
                        <BookOpen size={16} />
                        <span className="hidden sm:inline">Tools</span>
                    </button>

                    {isSavingNote && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 shrink-0">
                            <Save size={12} className="animate-pulse" />
                            <span className="hidden md:inline">Auto-Saving...</span>
                        </span>
                    )}
                </div>
            </header>

            {/* Layout Workspace Grid */}
            <div className="flex-1 flex overflow-hidden">

                {/* ==========================================
                    PANE 1: UPLOADED SOURCES (Left, 20% Width)
                    ========================================== */}
                <aside className="w-64 border-r border-orange-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between shrink-0 overflow-y-auto hidden md:flex">
                    <div className="p-4 space-y-6">

                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Uploaded Sources</h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                {sources.length}
                            </span>
                        </div>

                        {/* File Upload Button */}
                        <div>
                            <label className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-500/5 dark:hover:bg-orange-500/5 border border-dashed border-orange-200 dark:border-gray-700 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx,.pptx,.txt,.md"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-orange-500" size={20} />
                                ) : (
                                    <Upload className="text-orange-500" size={20} />
                                )}
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Document</span>
                                <span className="text-[9px] text-slate-400">PDF, DOCX, PPTX (Max 25MB)</span>
                            </label>
                        </div>

                        {/* Sources List */}
                        <div className="space-y-2">
                            {loadingSources ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="animate-spin text-orange-500" size={20} />
                                </div>
                            ) : sources.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                                    No documents uploaded yet.
                                </div>
                            ) : (
                                <div className="space-y-2 overflow-y-auto max-h-[300px]">
                                    {sources.map((src) => (
                                        <div
                                            key={src.id}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-2 group hover:border-orange-200 dark:hover:border-orange-950 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText size={16} className="text-orange-500 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate" title={src.name}>
                                                        {src.name}
                                                    </p>

                                                    {/* Status Badge */}
                                                    <span className="mt-1 flex items-center gap-1">
                                                        {src.status === 'INDEXED' && (
                                                            <span className="text-[9px] text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5">
                                                                <CheckCircle2 size={10} /> Indexed
                                                            </span>
                                                        )}
                                                        {src.status === 'PROCESSING' && (
                                                            <span className="text-[9px] text-orange-500 font-bold flex items-center gap-0.5">
                                                                <Loader2 size={10} className="animate-spin" /> Processing
                                                            </span>
                                                        )}
                                                        {src.status === 'FAILED' && (
                                                            <span
                                                                className="text-[9px] text-red-500 font-bold flex items-center gap-0.5 cursor-help"
                                                                title={src.errorMessage || "Indexing failed"}
                                                            >
                                                                <AlertTriangle size={10} /> Failed
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSource(src.id)}
                                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Sessions list inside Pane 1 */}
                    <div className="border-t border-slate-100 dark:border-gray-800 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Chats</h3>
                            <button
                                onClick={() => handleCreateChat()}
                                className="p-1 hover:bg-orange-500/10 text-orange-500 rounded-md transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[150px]">
                            {chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => handleSelectChat(activeWorkspace.id, chat)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold truncate transition-colors flex items-center justify-between ${activeChat?.id === chat.id
                                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <span>{chat.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ==========================================
                    PANE 2: AI CHAT CANVAS (Center, 50% Width)
                    ========================================== */}
                <section className="flex-1 min-w-0 bg-slate-50 dark:bg-gray-950 flex flex-col justify-between overflow-hidden border-r border-orange-100 dark:border-gray-800">



                    {/* Chat Messages — flex-col-reverse keeps newest at bottom without JS scrolling */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 flex flex-col-reverse gap-6"
                    >
                        {loadingMessages ? (
                            /* Skeleton loader — shown while messages are fetching to prevent empty-state flash */
                            <div className="flex flex-col gap-5 py-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className={`flex flex-col gap-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                                        <div className="h-2 w-16 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
                                        <div className={`rounded-3xl bg-slate-100 dark:bg-gray-800 animate-pulse ${
                                            i % 2 === 0 ? 'w-48 h-10' : 'w-full h-20'
                                        }`} />
                                    </div>
                                ))}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                                <div className="p-4 bg-orange-500/10 rounded-3xl text-orange-500">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">Ask your documents anything</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Upload course materials and ask questions. LearnProof will retrieve relevant context and cite page references.
                                </p>
                            </div>
                        ) : (
                            // Render in reverse so newest message is at the top of the reversed flex container (= visual bottom)
                            [...messages].reverse().map((msg, index) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                                            }`}
                                    >
                                        <div className={`space-y-1 ${msg.role === 'user' ? 'max-w-[85%] sm:max-w-[70%]' : 'w-full'}`}>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                                {msg.role === 'user' ? 'You' : 'LearnProof Assistant'}
                                            </span>

                                            <div className={`text-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'p-4 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700/50 shadow-sm'
                                                    : 'p-5 md:p-6 rounded-3xl bg-white text-slate-800 dark:bg-gray-900 dark:text-slate-100 border border-slate-100 dark:border-gray-800 shadow-sm w-full'
                                                }`}>
                                                {msg.content === '' && isStreaming && index === 0 ? (
                                                    <ThinkingIndicator />
                                                ) : (
                                                    <div className="text-xs md:text-sm leading-relaxed text-slate-700 dark:text-slate-300 max-w-none">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm, remarkMath]}
                                                            rehypePlugins={[rehypeKatex]}
                                                            components={markdownComponents}
                                                        >
                                                            {preprocessMath(msg.content)}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}

                                                {/* Citations Footer */}
                                                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                                    <div className="border-t border-slate-50 dark:border-gray-800 mt-4 pt-3 space-y-1.5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            Sources Cited:
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {msg.citations.map((cite, cIdx) => (
                                                                <span
                                                                    key={cIdx}
                                                                    className="text-[9px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-100 dark:border-gray-700/50"
                                                                    title={`Relevance score: ${Math.round(cite.score * 100)}%`}
                                                                >
                                                                    {cite.document_name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>

                    {/* Chat Prompt Box */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-slate-800 focus-within:border-orange-500 transition-colors">
                                <input
                                    type="text"
                                    placeholder={sources.length === 0 ? "Upload files first to enable chat" : isListening ? "Listening... speak now" : "Ask a question about your files..."}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={isStreaming || sources.length === 0}
                                    className="flex-1 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
                                />
                                {/* Mic button — only shown if browser supports it */}
                                {isVoiceSupported && (
                                    <button
                                        type="button"
                                        onClick={isListening ? stopListening : () => startListening(chatInput)}
                                        disabled={isStreaming || sources.length === 0}
                                        title={isListening ? 'Stop recording' : 'Voice input'}
                                        className={`flex-shrink-0 p-1.5 rounded-xl transition-all ${
                                            isListening
                                                ? 'text-red-500 animate-pulse'
                                                : 'text-slate-400 hover:text-orange-500'
                                        } disabled:opacity-30`}
                                    >
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={!chatInput.trim() || isStreaming}
                                className="flex-shrink-0 p-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </section>

                {/* ==========================================
                    PANE 3: STUDY CONSOLE (Right, 30% Width)
                    ========================================== */}
                <aside className="w-80 bg-white dark:bg-gray-900 border-l border-orange-100 dark:border-gray-800 flex flex-col justify-between shrink-0 overflow-y-auto hidden lg:flex">
                    {renderStudyToolsContent()}
                </aside>
            </div>

            {/* Custom Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />

            {/* Mobile UPLOADED SOURCES sliding drawer */}
            <AnimatePresence>
                {isMobileSourcesOpen && (
                    <div className="fixed inset-0 z-40 md:hidden flex">
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSourcesOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Slide-out Drawer */}
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-72 bg-white dark:bg-gray-950 h-full flex flex-col justify-between p-4 shadow-xl z-10 border-r border-orange-100 dark:border-gray-800 overflow-y-auto"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Uploaded Sources</h3>
                                    <button
                                        onClick={() => setIsMobileSourcesOpen(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* File Upload Area */}
                                <div>
                                    <label className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-500/5 dark:hover:bg-orange-500/5 border border-dashed border-orange-200 dark:border-gray-700 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx,.pptx,.txt,.md"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading ? (
                                            <Loader2 className="animate-spin text-orange-500" size={20} />
                                        ) : (
                                            <Upload className="text-orange-500" size={20} />
                                        )}
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Document</span>
                                        <span className="text-[9px] text-slate-400">PDF, DOCX, PPTX (Max 25MB)</span>
                                    </label>
                                </div>

                                {/* Sources List */}
                                <div className="space-y-2">
                                    {loadingSources ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="animate-spin text-orange-500" size={20} />
                                        </div>
                                    ) : sources.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                                            No documents uploaded yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                            {sources.map((src) => (
                                                <div
                                                    key={src.id}
                                                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-2 group hover:border-orange-200 dark:hover:border-orange-950 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText size={16} className="text-orange-500 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate w-40" title={src.name}>
                                                                {src.name}
                                                            </p>
                                                            <span className="mt-1 flex items-center gap-1">
                                                                {src.status === 'INDEXED' && (
                                                                    <span className="text-[9px] text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5">
                                                                        <CheckCircle2 size={10} /> Indexed
                                                                    </span>
                                                                )}
                                                                {src.status === 'PROCESSING' && (
                                                                    <span className="text-[9px] text-orange-500 font-bold flex items-center gap-0.5">
                                                                        <Loader2 size={10} className="animate-spin" /> Processing
                                                                    </span>
                                                                )}
                                                                {src.status === 'FAILED' && (
                                                                    <span className="text-[9px] text-red-500 font-bold flex items-center gap-0.5" title={src.errorMessage || "Indexing failed"}>
                                                                        <AlertTriangle size={10} /> Failed
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSource(src.id)}
                                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors shrink-0"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mobile STUDY TOOLS sliding drawer (right sidebar) */}
            <AnimatePresence>
                {isMobileToolsOpen && (
                    <div className="fixed inset-0 z-40 md:hidden flex justify-end">
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileToolsOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Slide-out Drawer */}
                        <motion.div
                            initial={{ x: 320 }}
                            animate={{ x: 0 }}
                            exit={{ x: 320 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-80 bg-white dark:bg-gray-950 h-full flex flex-col p-4 shadow-xl z-10 border-l border-orange-100 dark:border-gray-800 overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-2 mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Study Tools</span>
                                <button
                                    onClick={() => setIsMobileToolsOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {renderStudyToolsContent()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AskMyNotes;
