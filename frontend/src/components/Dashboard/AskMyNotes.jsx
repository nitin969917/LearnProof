import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, Trash2, FileText, ChevronRight, 
    MessageSquare, Send, Sparkles, X, Filter,
    BookOpen, CheckCircle, AlertCircle, Image as ImageIcon,
    Download, ExternalLink, Calendar,
    Loader2, Eye, Volume2, VolumeX, Menu, ChevronLeft, Home, ArrowLeft, LogOut, Moon, Sun
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

// API Configuration
const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/ask-my-notes`;

// --- Sub-components (Moved outside to prevent re-mounting and focus loss) ---

const FilePreview = ({ file, onClose, token }) => {
    const [content, setContent] = useState("Loading content...");
    const [loading, setLoading] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const authenticatedUrl = `${file.file_url.startsWith('http') ? file.file_url : backendUrl + file.file_url}${file.file_url.includes('?') ? '&' : '?'}idToken=${token}`;

    useEffect(() => {
        if (!file.filename.toLowerCase().endsWith('.pdf')) {
            setLoading(true);
            axios.get(authenticatedUrl)
                .then(res => {
                    setContent(res.data);
                })
                .catch(err => {
                    console.error("Failed to fetch file content", err);
                    setContent("Error: Could not load file content.");
                })
                .finally(() => setLoading(false));
        }
    }, [authenticatedUrl, file.filename]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1a1c1e] w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
            >
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{file.filename}</h3>
                            <p className="text-xs text-gray-500 font-medium">Internal Asset Preview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <a 
                            href={authenticatedUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all text-gray-500"
                            title="Open in new tab"
                        >
                            <Eye size={20} />
                        </a>
                        <button 
                            onClick={onClose}
                            className="p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all text-gray-400 hover:text-red-500"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative">
                    {file.filename.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                            key={`${file.id}-${file.page}-${file.search}`}
                            src={`${authenticatedUrl}#search=${encodeURIComponent(file.search || '')}&page=${file.page || 1}`} 
                            className="w-full h-full border-none"
                            title={file.filename}
                        />
                    ) : (
                        <div className="p-10 max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>
                <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-orange-500 text-white rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-xl active:scale-95 translate-y-0"
                    >
                        Close Reader
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const CitationPreview = ({ citation, onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700"
        >
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-orange-50/50 dark:bg-orange-900/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600 rounded-lg text-white">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{citation.filename}</h3>
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Page {citation.page}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X size={20} />
                </button>
            </div>
            <div className="p-5 sm:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="relative">
                    <div className="absolute -left-3 sm:-left-4 top-0 bottom-0 w-1 bg-orange-500/20 rounded-full"></div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-sm sm:text-[15px]">
                        "{citation.snippet}"
                    </p>
                </div>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 sm:py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-900 dark:hover:bg-gray-600 transition-all shadow-md"
                >
                    Close Preview
                </button>
            </div>
        </motion.div>
    </motion.div>
);

const SubjectList = ({ subjects, selectedSubject, setSelectedSubject, handleDeleteSubject }) => (
    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        <h5 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4 py-2 mt-4">Subjects</h5>
        <AnimatePresence>
            {subjects.map(s => (
                <motion.div
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedSubject(s)}
                    className={`group relative flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedSubject?.id === s.id
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <BookOpen size={14} className={selectedSubject?.id === s.id ? 'text-orange-600' : 'opacity-40'} />
                        <span className="text-[13px] font-medium truncate">{s.name}</span>
                    </div>
                    <button
                        onClick={(e) => handleDeleteSubject(e, s.id)}
                        className="opacity-100 xl:opacity-0 xl:group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
                    >
                        <Trash2 size={12} />
                    </button>
                    {selectedSubject?.id === s.id && (
                        <motion.div 
                            layoutId="active-dot"
                            className="absolute left-0 w-1 h-4 bg-orange-600 rounded-r-full"
                        />
                    )}
                </motion.div>
            ))}
        </AnimatePresence>
        {subjects.length === 0 && (
            <div className="text-center py-8 px-4 text-gray-400 text-[11px] italic">
                No subjects yet.
            </div>
        )}
    </div>
);

const ChatTab = ({ messages, isThinking, handleSendMessage, chatInput, setChatInput, chatEndRef, onCitationClick, suggestions, handleSuggestionClick }) => (
    <div className="flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 lg:px-20 py-10 space-y-12 custom-scrollbar scroll-smooth">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in fade-in zoom-in duration-1000">
                    <div className="relative">
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="w-24 h-24 bg-gradient-to-tr from-blue-500 via-purple-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl opacity-80 backdrop-blur-3xl"
                        >
                            <Sparkles size={40} className="text-white" />
                        </motion.div>
                    </div>
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-4xl sm:text-5xl font-medium text-gray-900 dark:text-gray-100 tracking-tight">How can I help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500">study today?</span></h3>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-normal leading-relaxed">
                            I've indexed your notes. Ask me to summarize, quiz you, or explain complex topics.
                        </p>
                    </div>

                    {suggestions.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-12">
                            {suggestions.map((s, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="p-5 bg-gray-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-2xl text-left text-[13px] font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-95 shadow-sm hover:shadow-md"
                                >
                                    {s}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-4 sm:gap-6 max-w-[95%] sm:max-w-[85%] ${m.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {m.type === 'ai' && (
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                                        <Sparkles size={16} />
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex flex-col space-y-4">
                                <div className={`${
                                    m.type === 'user' 
                                        ? 'bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-[1.5rem] rounded-tr-none text-gray-800 dark:text-gray-100' 
                                        : 'text-gray-800 dark:text-gray-200 text-[15px] sm:text-[16px] leading-relaxed font-normal'
                                }`}>
                                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:rounded-2xl prose-code:text-orange-600 dark:prose-code:text-orange-400">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>

                                    {m.citations && m.citations.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold mb-4 flex items-center gap-2">
                                                <BookOpen size={12} className="text-orange-500" /> Sources Referenced
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {m.citations.map((c, ci) => (
                                                    <motion.div 
                                                        key={ci} 
                                                        whileHover={{ scale: 1.02 }}
                                                        onClick={() => onCitationClick(c)}
                                                        className="text-[11px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-2 rounded-xl cursor-pointer hover:border-orange-500/50 hover:shadow-sm transition-all flex items-center gap-2 group/cit"
                                                    >
                                                        <span className="font-medium text-gray-600 dark:text-gray-400 group-hover/cit:text-orange-500">{c.filename}</span>
                                                        <span className="text-[9px] font-bold text-orange-500/60 uppercase">P.{c.page}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {isThinking && (
                <div className="flex justify-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-400 flex items-center justify-center text-white animate-pulse">
                            <Sparkles size={16} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <motion.div 
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded-full"
                        />
                        <motion.div 
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                            className="h-4 w-32 bg-gray-100 dark:bg-white/5 rounded-full"
                        />
                    </div>
                </div>
            )}
            <div ref={chatEndRef} className="h-32" />
        </div>

        {/* Floating Command Bar */}
        <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 px-4 sm:px-10 lg:px-20 z-30">
            <div className="max-w-4xl mx-auto">
                <form 
                    onSubmit={handleSendMessage} 
                    className="relative flex items-center group transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-400/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000"></div>
                    
                    <div className="relative flex-1 flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border border-gray-200/50 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-2 transition-all group-focus-within:border-blue-500/50 group-focus-within:ring-1 group-focus-within:ring-blue-500/20">
                        <input
                            type="text"
                            placeholder="Enter a prompt here..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 bg-transparent border-none px-6 py-4 text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0 text-[15px] sm:text-[16px]"
                        />
                        
                        <div className="flex items-center gap-1 sm:gap-2 pr-2">
                             <div className="hidden sm:flex items-center gap-1 mr-2 opacity-40 group-focus-within:opacity-100 transition-opacity">
                                 <Plus size={18} className="text-gray-500 cursor-pointer hover:text-orange-500" />
                                 <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1"></div>
                             </div>

                             <motion.button 
                                whileTap={{ scale: 0.9 }}
                                type="submit" 
                                disabled={!chatInput.trim() || isThinking}
                                className={`p-3 rounded-full transition-all ${
                                    chatInput.trim() && !isThinking 
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30 rotate-0' 
                                        : 'text-gray-400 rotate-0'
                                }`}
                            >
                                <Send size={20} />
                            </motion.button>
                        </div>
                    </div>
                </form>
                <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                    LearnProof AI may display inaccurate info, so double-check its responses.
                </p>
            </div>
        </div>
    </div>
);
;

const FilesTab = ({ notes, handleFileUpload, isUploading, onDeleteAsset, onOpenAsset }) => (
    <div className="flex flex-col gap-8 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Context Material</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Manage the resources used to ground your AI responses.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            <AnimatePresence mode="popLayout">
                {notes.map(n => (
                    <motion.div 
                        key={n.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-orange-100 dark:border-white/5 hover:shadow-2xl hover:shadow-orange-500/10 transition-all group flex flex-col justify-between"
                    >
                        <div className="flex items-start gap-5 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-inner">
                                <FileText size={28} />
                            </div>
                            <div className="overflow-hidden space-y-1">
                                <h4 className="font-black text-gray-900 dark:text-gray-100 truncate text-[15px] tracking-tight" title={n.filename}>
                                    {n.filename}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-md text-[9px] font-black uppercase tracking-widest">Grounded</span>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-[0.1em]">
                                        {new Date(n.uploaded_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onOpenAsset(n)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-orange-600 hover:text-white transition-all border border-gray-100 dark:border-white/5 active:scale-95 shadow-sm"
                            >
                                <Eye size={14} /> Open
                            </button>
                            <button 
                                onClick={() => onDeleteAsset(n.id)}
                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all border border-transparent active:scale-95"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            <label className="border-4 border-dashed border-gray-200 dark:border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 flex flex-col items-center justify-center gap-5 cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group relative overflow-hidden text-center min-h-[200px]">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-transform relative z-10">
                    <Plus className="text-orange-600" size={32} />
                </div>
                <div className="space-y-1 relative z-10">
                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Index Material</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest">PDF / TXT • MAX 10MB</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} disabled={isUploading} />
            </label>
        </div>
    </div>
);


const AskMyNotes = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [notes, setNotes] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'files'
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewFileId, setPreviewFileId] = useState(null);
    const [sessionId, setSessionId] = useState(() => {
        return localStorage.getItem('ask_my_notes_session_id') || Math.random().toString(36).substring(7);
    });
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [chatSessions, setChatSessions] = useState([]);
    const [activeCitation, setActiveCitation] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();

    // FEATURE FLAG: Show "Coming Soon" state as requested
    const IS_COMING_SOON = true;

    if (IS_COMING_SOON) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-full bg-orange-50 dark:bg-gray-900 p-8 text-center animate-in fade-in zoom-in duration-700">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full"></div>
                    <div className="w-24 h-24 bg-gradient-to-tr from-orange-600 to-amber-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                        <Sparkles size={48} className="animate-pulse" />
                    </div>
                </div>
                <div className="space-y-6 max-w-lg">
                    <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Ask My Notes</span> <br/>is Coming Soon!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium leading-relaxed">
                        We're putting the finishing touches on our advanced AI research engine. Soon you'll be able to chat with your PDFs, notes, and textbook snippets.
                    </p>
                    <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                          onClick={() => navigate('/dashboard')}
                          className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            <Home size={20} />
                            Back to Dashboard
                        </button>
                        <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-2xl font-semibold text-sm border border-orange-100 dark:border-orange-900/30">
                            Status: Finalizing RAG Engine
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const chatEndRef = useRef(null);

    useEffect(() => {
        if (token) {
            fetchSubjects();
        }
        
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(false);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [token]);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Consolidated restoration effect: Runs when subjects are loaded
    useEffect(() => {
        if (subjects.length > 0 && !selectedSubject) {
            const savedSubjectId = localStorage.getItem('ask_my_notes_subject_id');
            const savedSessionId = localStorage.getItem('ask_my_notes_session_id');
            
            if (savedSubjectId) {
                const sub = subjects.find(s => s.id === parseInt(savedSubjectId));
                if (sub) {
                    setSelectedSubject(sub);
                    
                    // If we have a session ID, fetch its history specifically
                    if (savedSessionId) {
                        setSessionId(savedSessionId);
                        fetchChatHistory(sub.id, savedSessionId);
                    }
                }
            }
        }
    }, [subjects]);

    useEffect(() => {
        if (selectedSubject) {
            fetchNotes(selectedSubject.id);
            fetchChatSessions(selectedSubject.id);
            fetchSuggestions(selectedSubject.id);
            
            // Only clear local state if we are NOT restoring a session
            // We check if history is already being loaded by comparing against saved ID
            const savedSessionId = localStorage.getItem('ask_my_notes_session_id');
            const savedSubjectId = localStorage.getItem('ask_my_notes_subject_id');
            
            if (parseInt(savedSubjectId) !== selectedSubject.id) {
                // Changing category/subject, start fresh
                setMessages([]);
                const newSid = Math.random().toString(36).substring(7);
                setSessionId(newSid);
                localStorage.setItem('ask_my_notes_session_id', newSid);
                localStorage.setItem('ask_my_notes_subject_id', selectedSubject.id);
            }
            
            setActiveTab('chat');
            setIsSidebarOpen(false); // Close sidebar on mobile when subject changes
        }
    }, [selectedSubject]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${API_BASE}/subjects`, {
                params: { idToken: token }
            });
            setSubjects(res.data.subjects || []);
        } catch (err) {
            setError("Failed to load subjects.");
            setSubjects([]);
        }
    };

    const fetchNotes = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/subjects/${id}/notes`, {
                params: { idToken: token }
            });
            setNotes(res.data.notes || []);
        } catch (err) {
            setError("Failed to load notes.");
            setNotes([]);
        }
    };

    const fetchChatSessions = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/subjects/${id}/chat-sessions`, {
                params: { idToken: token }
            });
            const sessions = res.data.sessions || [];
            setChatSessions(sessions);
            
            // If we have a sessionId but it's not and we have no messages, 
            // check if the current sessionId is in the sessions list.
            // If it is, and we have no messages, fetch its history.
            if (sessionId && messages.length === 0) {
                const exists = sessions.find(s => s.id === sessionId);
                if (exists) {
                    fetchChatHistory(id, sessionId);
                }
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
            setChatSessions([]);
        }
    };

    const fetchSuggestions = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/subjects/${id}/suggestions`, {
                params: { idToken: token }
            });
            setSuggestions(res.data.suggestions || []);
        } catch (err) {
            setSuggestions(["Summarize key concepts", "Key takeaways", "Explain main topics"]);
        }
    };

    const fetchChatHistory = async (subId, sessId) => {
        if (!subId || !sessId) return;
        try {
            setIsThinking(true);
            const res = await axios.get(`${API_BASE}/subjects/${subId}/chat-history`, {
                params: { idToken: token, session_id: sessId }
            });
            
            // Backend returns { history: [...] }
            const rawHistory = res.data.history || [];
            if (!Array.isArray(rawHistory)) {
                console.error("History data is not an array", res.data);
                return;
            }

            const explodedHistory = [];
            rawHistory.forEach(m => {
                if (m.query) explodedHistory.push({ type: 'user', content: m.query });
                if (m.response) {
                    let parsedCitations = [];
                    try {
                        if (m.citations) {
                            parsedCitations = typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations;
                        }
                    } catch (e) {
                        console.warn("Failed to parse citations for message", m.id);
                    }
                    
                    explodedHistory.push({ 
                        type: 'ai', 
                        content: m.response, 
                        citations: Array.isArray(parsedCitations) ? parsedCitations : []
                    });
                }
            });

            console.log(`Loaded ${explodedHistory.length} messages for session ${sessId}`);
            setMessages(explodedHistory);
        } catch (err) {
            console.error("Failed to fetch history", err);
            setError("Could not load chat history.");
        } finally {
            setIsThinking(false);
        }
    };

    const groupSessionsByDate = (sessions) => {
        const groups = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Previous 30 Days': [],
            'Older': []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setDate(lastMonth.getDate() - 30);

        sessions.forEach(s => {
            const date = new Date(s.created_at);
            if (date >= today) groups['Today'].push(s);
            else if (date >= yesterday) groups['Yesterday'].push(s);
            else if (date >= lastWeek) groups['Previous 7 Days'].push(s);
            else if (date >= lastMonth) groups['Previous 30 Days'].push(s);
            else groups['Older'].push(s);
        });

        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    };

    const startNewChat = () => {
        const newSid = Math.random().toString(36).substring(7);
        // Step 1: Update localStorage first to avoid race conditions in effects
        localStorage.setItem('ask_my_notes_session_id', newSid);
        // Step 2: Clear messages and set new session ID
        setMessages([]);
        setSessionId(newSid);
        setActiveTab('chat');
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;
        try {
            await axios.post(`${API_BASE}/subjects`, { 
                name: newSubjectName,
                idToken: token
            });
            setNewSubjectName('');
            fetchSubjects();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create subject.");
        }
    };

    const handleDeleteSubject = async (e, id) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: "Delete Subject",
            message: "Delete this subject and all its notes? This action cannot be undone.",
            confirmText: "Delete",
            type: "danger"
        });
        if (!confirmed) return;
        try {
            await axios.delete(`${API_BASE}/subjects/${id}`, {
                data: { idToken: token }
            });
            if (selectedSubject?.id === id) setSelectedSubject(null);
            fetchSubjects();
        } catch (err) {
            setError("Failed to delete subject.");
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!selectedSubject) return;
        const confirmed = await confirm({
            title: "Remove Document",
            message: "Are you sure you want to remove this document from the context?",
            confirmText: "Remove",
            type: "danger"
        });
        if (!confirmed) return;
        try {
            await axios.delete(`${API_BASE}/subjects/${selectedSubject.id}/notes/${noteId}`, {
                data: { idToken: token }
            });
            fetchNotes(selectedSubject.id);
        } catch (err) {
            setError("Failed to delete document.");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedSubject) return;
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idToken', token);

        try {
            await axios.post(`${API_BASE}/subjects/${selectedSubject.id}/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchNotes(selectedSubject.id);
            setError(null);
        } catch (err) {
            const msg = err.response?.data?.error || "Upload failed. Only .pdf and .txt allowed.";
            setError(msg);
        } finally {
            setIsUploading(false);
        }
    };


    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !selectedSubject || isThinking) return;

        const query = chatInput;
        setChatInput('');
        
        // Add both messages at once to prevent stale index issues
        setMessages(prev => [...prev, 
            { type: 'user', content: query }, 
            { type: 'ai', content: '', citations: [] }
        ]);
        setIsThinking(true);

        try {
            const response = await fetch(`${API_BASE}/subjects/${selectedSubject.id}/chat-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, session_id: sessionId, idToken: token })
            });

            if (!response.ok) throw new Error('Stream failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === 'metadata') {
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    if (newMsgs.length > 0) {
                                        newMsgs[newMsgs.length - 1].citations = data.citations;
                                    }
                                    return newMsgs;
                                });
                            } else if (data.type === 'content') {
                                accumulatedContent += data.content;
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    if (newMsgs.length > 0) {
                                        newMsgs[newMsgs.length - 1].content = accumulatedContent;
                                    }
                                    return newMsgs;
                                });
                            }
                        } catch (pErr) {}
                    }
                }
            }
        } catch (err) {
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = "Connection lost. Please try again.";
                return newMsgs;
            });
        } finally {
            setIsThinking(false);
            fetchChatSessions(selectedSubject.id);
        }
    };

    const handleSuggestionClick = (s) => {
        setChatInput(s);
        // Using setTimeout to ensure state update before sending
        setTimeout(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
        }, 100);
    };

    const speakText = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
        window.speechSynthesis.speak(utterance);
    };



    return (
        <div className="flex h-full bg-orange-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased overflow-hidden relative">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    />
                )}
            </AnimatePresence>

            {/* Minimalist Sidebar */}
            <AnimatePresence>
                {(isSidebarOpen || !isMobile) && (
                    <motion.div 
                        initial={isMobile ? { x: -300 } : { opacity: 0, width: 0 }}
                        animate={{ x: 0, opacity: 1, width: 260 }}
                        exit={isMobile ? { x: -300 } : { opacity: 0, width: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed lg:relative z-50 h-full bg-white dark:bg-gray-800 border-r border-orange-100 dark:border-gray-700 w-[260px] flex flex-col"
                    >
                        <div className="flex flex-col h-full p-4 sm:p-6 gap-4 overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                {/* Logo */}
                                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                                    LearnProof
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <button 
                                onClick={startNewChat}
                                className="flex items-center gap-3 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-semibold hover:bg-orange-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <Plus size={18} />
                                <span className="truncate">New chat</span>
                            </button>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
                                <AnimatePresence mode="wait">
                                    {!selectedSubject ? (
                                        <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <SubjectList 
                                                subjects={subjects} 
                                                selectedSubject={selectedSubject} 
                                                setSelectedSubject={(s) => {
                                                    setSelectedSubject(s);
                                                    if (isMobile) setIsSidebarOpen(false);
                                                }} 
                                                handleDeleteSubject={handleDeleteSubject} 
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            <button 
                                                onClick={() => setSelectedSubject(null)}
                                                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-wider"
                                            >
                                                <ChevronLeft size={14} />
                                                All Notebooks
                                            </button>

                                            <div className="space-y-4">
                                                <h4 className="px-4 text-[13px] font-semibold text-gray-900 dark:text-white truncate uppercase tracking-widest opacity-50">{selectedSubject.name}</h4>
                                                <div className="space-y-1">
                                                    {groupSessionsByDate(chatSessions).map(([label, items]) => (
                                                        <div key={label} className="mt-6 first:mt-0">
                                                            <div className="px-4 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 opacity-60 uppercase">{label}</div>
                                                            <div className="space-y-0.5">
                                                                {items.map(s => (
                                                                    <button 
                                                                        key={s.id}
                                                                        onClick={() => {
                                                                            if (s.id !== sessionId) setMessages([]);
                                                                            setSessionId(s.id);
                                                                            localStorage.setItem('ask_my_notes_session_id', s.id);
                                                                            fetchChatHistory(selectedSubject.id, s.id);
                                                                            setActiveTab('chat');
                                                                            if (isMobile) setIsSidebarOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2 text-[14px] transition-all rounded-lg flex items-center gap-3 relative group ${
                                                                            sessionId === s.id 
                                                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold' 
                                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                                                                        }`}
                                                                    >
                                                                        <MessageSquare size={14} className="opacity-60" />
                                                                        <span className="truncate flex-1">{s.title || `Chat ${s.id.substring(0, 6)}`}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-auto flex flex-col pt-4">
                                <div className="px-4 py-2">
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 transition-all font-medium"
                                    >
                                        <Home size={20} />
                                        <span>Home</span>
                                    </button>
                                </div>

                                <div className="p-4 sm:p-6 space-y-4 border-t border-orange-100 dark:border-gray-700">
                                    {user && (
                                        <div 
                                            className="flex items-center gap-3 px-4 py-3 border border-orange-100 dark:border-gray-700 bg-orange-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                        >
                                            {user.picture ? (
                                                <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold shadow-sm">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.name || 'User'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center justify-center flex-1 gap-2 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 transition-all text-sm font-medium"
                                            title="Logout"
                                        >
                                            <LogOut size={20} />
                                            Logout
                                        </button>

                                        <button
                                            onClick={toggleTheme}
                                            className="flex items-center justify-center px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all"
                                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                            aria-label="Toggle Dark Mode"
                                        >
                                            {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent">
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-orange-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2">
                                <Menu size={20} />
                            </button>
                        )}
                        <h2 className={`text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent ${selectedSubject ? 'hidden sm:block' : 'block'}`}>
                            LearnProof AI
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedSubject && (
                            <div className="flex items-center bg-orange-50 dark:bg-gray-800 p-1 rounded-lg border border-orange-100 dark:border-gray-700 shadow-sm">
                                {[
                                    { id: 'chat', label: 'Chat', icon: <MessageSquare size={14} /> },
                                    { id: 'files', label: 'Context', icon: <FileText size={14} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-white dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Global Error Alert */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 mx-6 mt-6 rounded-2xl flex items-center justify-between text-red-700 dark:text-red-400 z-50 mb-4 shadow-sm"
                            >
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                                <button onClick={() => setError(null)}>
                                    <X size={18} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!selectedSubject ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12"
                        >
                             <div className="relative group">
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 2, -2, 0]
                                    }}
                                    transition={{ repeat: Infinity, duration: 8 }}
                                    className="w-40 h-40 bg-gradient-to-tr from-orange-500/10 via-amber-500/10 to-orange-400/10 rounded-full flex items-center justify-center backdrop-blur-3xl border border-white/20"
                                >
                                    <Sparkles size={80} className="text-orange-500/60" />
                                </motion.div>
                                <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center shadow-2xl border border-gray-100 dark:border-white/5">
                                    <BookOpen size={30} className="text-amber-500" />
                                </div>
                            </div>
                            <div className="max-w-xl space-y-4">
                                <h2 className="text-4xl sm:text-5xl font-medium text-gray-900 dark:text-white tracking-tight leading-tight">Your knowledge, <br/>distilled by <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">AI.</span></h2>
                                <p className="text-gray-500 dark:text-gray-400 text-lg font-normal leading-relaxed">
                                    Create or select a notebook from the sidebar to begin your deep-dive session.
                                </p>
                            </div>
                            
                            <form onSubmit={handleCreateSubject} className="w-full max-w-md relative group">
                                <input
                                    type="text"
                                    placeholder="Name your new notebook..."
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-orange-500/50 rounded-full px-8 py-5 text-lg font-medium transition-all"
                                />
<button type="submit" className="absolute right-3 top-3 p-3 bg-orange-600 text-white rounded-full hover:shadow-lg transition-all active:scale-95">
                                    <Plus size={24} />
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <div className="flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {activeTab === 'chat' && (
                                    <motion.div 
                                        key="chat-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full"
                                    >
                                        <ChatTab 
                                            messages={messages} 
                                            isThinking={isThinking} 
                                            handleSendMessage={handleSendMessage} 
                                            chatInput={chatInput} 
                                            setChatInput={setChatInput} 
                                            chatEndRef={chatEndRef} 
                                            onCitationClick={(citation) => {
                                                const file = notes.find(n => n.filename === citation.filename);
                                                if (file) {
                                                    // Filter out short stop-words and take 3 meaningful words for better matching
                                                    const words = citation.snippet.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
                                                    const searchTerm = words.filter(w => w.length > 2).slice(0, 3).join(' ');
                                                    setSelectedFile({ ...file, page: citation.page, search: searchTerm });
                                                } else {
                                                    setActiveCitation(citation);
                                                }
                                            }}
                                            suggestions={suggestions}
                                            handleSuggestionClick={handleSuggestionClick}
                                        />
                                    </motion.div>
                                )}
                                
                                {activeTab === 'files' && (
                                    <motion.div 
                                        key="files-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full overflow-y-auto custom-scrollbar px-6 lg:px-12 py-8"
                                    >
                                        <div className="max-w-6xl mx-auto space-y-10">
                                            <FilesTab 
                                                notes={notes} 
                                                handleFileUpload={handleFileUpload} 
                                                isUploading={isUploading} 
                                                onDeleteAsset={handleDeleteNote}
                                                onOpenAsset={(file) => setSelectedFile(file)}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {activeCitation && (
                    <CitationPreview 
                        citation={activeCitation} 
                        onClose={() => setActiveCitation(null)} 
                    />
                )}
                {selectedFile && (
                    <FilePreview 
                        file={selectedFile} 
                        onClose={() => setSelectedFile(null)} 
                        token={token}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


export default AskMyNotes;
