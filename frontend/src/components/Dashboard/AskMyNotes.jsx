import React from 'react';
import { Sparkles, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AskMyNotes = () => {
    const navigate = useNavigate();

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
                <div className="pt-8 flex flex-row items-center justify-center gap-3">
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Home size={14} />
                        Back to Dashboard
                    </button>
                    <div className="px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-orange-100 dark:border-orange-900/30 whitespace-nowrap">
                        Status: Finalizing Discovery Engine
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskMyNotes;
