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
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-6">
                    <Brain className="w-8 h-8 text-indigo-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Model Multi-Benchmark</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Compare intuition generation across all available models side-by-side.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                placeholder="e.g. Master React in 10 Minutes"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={runBenchmark}
                                disabled={loading || !title || !description}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none h-[50px]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {loading ? "Processing All Models..." : "Run Multi-Model Benchmark"}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Description</label>
                        <textarea
                            rows="4"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Paste the full video description here for context..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
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
                                    {data.content}
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
