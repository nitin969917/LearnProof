import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Sparkles, Send, Loader2, Cpu, Zap, Brain, Globe, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const preprocessMarkdown = (text) => {
  if (!text) return "";

  let processed = text;

  // 1. Convert block math delimiters: \[ or \\[ or any number of backslashes followed by [ to $$
  processed = processed
    .replace(/\\+\[/g, () => '$$')
    .replace(/\\+\]/g, () => '$$');

  // 2. Convert parenthesized inline math delimiters: \(( math )\) to $ math $
  processed = processed.replace(/\\+\(\s*\(\s*(.*?)\s*\)\s*\\+\)/g, (_, math) => `$${math}$`);

  // 3. Convert normal inline math delimiters: \( or \\( to $
  processed = processed
    .replace(/\\+\(/g, () => '$')
    .replace(/\\+\)/g, () => '$');

  // 4. Convert literal parentheses containing LaTeX commands to math delimiters:
  // e.g. ( \overline{W} ) -> $ \overline{W} $
  processed = processed.replace(/\(\s*([^)]*?\\[a-zA-Z][^)]*?)\s*\)/g, (_, math) => `$${math}$`);

  // 5. Convert HTML break tags to newlines
  processed = processed.replace(/<br\s*\/?>/gi, '\n');

  // 6. Fix list item question headers starting with a single asterisk:
  processed = processed.replace(/^\*(?=[a-zA-Z0-9])(.*?)\*?$/gm, '**$1**');

  return processed;
};

const AIBenchmark = () => {
    const { token } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const runBenchmark = async () => {
        if (!title || !description) return;
        setLoading(true);
        setResults(null);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ai/benchmark/`, {
                title,
                description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
        } catch (error) {
            console.error("Benchmark failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const modelIcons = {
        "Gemini 2.5 Flash": <Sparkles className="w-5 h-5 text-blue-500" />,
        "Gemini 3 Flash": <Zap className="w-5 h-5 text-purple-500" />,
        "Groq (Llama 3.3)": <Cpu className="w-5 h-5 text-orange-500" />,
        "Cerebras (Fast Inference)": <Brain className="w-5 h-5 text-indigo-500" />,
        "OpenRouter (Free Router)": <Globe className="w-5 h-5 text-green-500" />,
        "Gemini 2.5 Lite": <ShieldCheck className="w-5 h-5 text-gray-500" />
    };

    return (
        <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28">
            {/* ── Compact Mobile Header + Form ────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
                <div className="p-3.5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
                            <Brain size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">AI Benchmark</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Compare models side-by-side</p>
                        </div>
                    </div>
                </div>

                <div className="p-3.5 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Video Title</label>
                        <input
                            type="text"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                            placeholder="e.g. Master React in 10 Minutes"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Video Description</label>
                        <textarea
                            rows="3"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                            placeholder="Paste the full video description here..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={runBenchmark}
                        disabled={loading || !title || !description}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? "Processing All Models..." : "Run Multi-Model Benchmark"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {results && Object.entries(results).map(([name, data]) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[500px]"
                        >
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    {modelIcons[name]}
                                    <span className="font-bold text-gray-900 dark:text-white">{name}</span>
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${data.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {data.status}
                                </span>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto prose dark:prose-invert prose-sm max-w-none scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {preprocessMarkdown(data.content)}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {!results && !loading && (
                <div className="text-center py-20 bg-white/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Ready to benchmark. Enter video details above.</p>
                </div>
            )}
        </div>
    );
};

export default AIBenchmark;
