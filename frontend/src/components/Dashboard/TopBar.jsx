import React, { useState } from 'react';
import { Youtube, Search, Menu, Inbox } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onMenuClick }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [importData, setImportData] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleImport = async () => {
        if (!url.trim()) {
            toast.error("Please enter a Youtube URL");
            return;
        }

        setLoading(true);
        try {

            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/import/`, {
                idToken: token,
                url: url
            });

            if (response.data.success) {
                setImportData(response.data.data);
                toast.success("Imported successfully");
                // You can trigger state update or navigate if needed
            } else {
                toast.error("Something went wrong!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to import. Check URL or token.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!importData) return;

        const toastId = toast.loading("Saving...");
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/save-learning/`, {
                idToken: token,
                data: importData,
            });

            toast.dismiss(toastId);
            toast.success("Learning Saved!");

            const targetId = importData.id;
            const targetType = importData.type;

            setImportData(null);
            setUrl('');

            if (targetType === 'playlist') {
                navigate(`/dashboard/playlist/${targetId}`);
            } else {
                navigate(`/classroom/${targetId}`);
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error("Failed to save learning.");
            console.error(err);
        }
    };

    const handleCancel = () => {
        setImportData(null);
        setUrl('');
    }

    return (
        <>
            <div className="flex items-stretch justify-between bg-white dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700 shadow-sm sticky top-0 z-10 transition-colors duration-200 h-16 sm:h-20 w-full overflow-hidden">
                {/* Left Side: Logo (Flush Left) */}
                <div
                    onClick={() => navigate('/dashboard')}
                    className="h-full cursor-pointer hover:opacity-90 transition-opacity shrink-0 flex items-stretch"
                >
                    {/* Mobile Logo */}
                    <img
                        src="/LP_M_logo.png"
                        alt="LearnProof"
                        className="h-full w-auto object-cover object-left block sm:hidden"
                    />
                    {/* Desktop Logo */}
                    <img
                        src="/LP_logo.png"
                        alt="LearnProof"
                        className="h-full w-auto object-cover object-left hidden sm:block"
                    />
                </div>

                {/* Right Side: Actions (Import & Inbox Group) */}
                <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 px-2 sm:px-4 min-w-0">
                    {/* Desktop Import Bar (sm and up) */}
                    <div className="hidden sm:flex items-center flex-1 max-w-xl bg-orange-50 dark:bg-gray-700 border border-orange-200 dark:border-gray-600 rounded-xl px-4 py-2 gap-2 transition-all duration-200 shadow-sm">
                        <Youtube className="text-orange-500 shrink-0" size={20} />
                        <input
                            type="text"
                            placeholder="Enter Youtube URL..."
                            className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                        />
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="text-white bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shrink-0"
                        >
                            {loading ? "..." : "Import"}
                        </button>
                    </div>

                    {/* Mobile Import Bar (Refined Size & Same Text) */}
                    <div className="flex sm:hidden flex-1 min-w-0 bg-orange-50 dark:bg-gray-700 border border-orange-200 dark:border-gray-600 rounded-xl px-2.5 py-1.5 items-center gap-2 shadow-sm">
                       <input
                            type="text"
                            placeholder="Enter Youtube URL..."
                            className="w-full bg-transparent outline-none text-[11px] text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                        />
                        <button 
                            onClick={handleImport} 
                            disabled={loading}
                            className="bg-orange-600 text-white rounded-lg px-2.5 py-1.5 font-bold text-[10px] uppercase tracking-tight shrink-0 active:scale-90 transition-transform"
                        >
                            {loading ? "..." : "Import"}
                        </button>
                    </div>
                    
                    {/* Inbox Quick Action (Big on mobile, standard on desktop) */}
                    <button
                        onClick={() => navigate('/dashboard/inbox')}
                        className="p-2 sm:p-2.5 text-orange-500 bg-orange-50 dark:bg-slate-700/50 hover:bg-orange-100 dark:hover:bg-slate-600 rounded-lg sm:rounded-xl transition-all shadow-sm shrink-0 border border-orange-100 dark:border-gray-600 active:scale-95"
                        title="Inbox"
                    >
                        <Inbox size={24} className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {importData && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 text-gray-900 dark:text-gray-100"
                        >
                            <h2 className="text-lg font-semibold">
                                Details
                            </h2>

                            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <p>
                                    <strong className="text-orange-600">Title:</strong> {importData.title}
                                </p>
                                <p className="line-clamp-4 overflow-hidden">
                                    <strong className="text-orange-600">Description:</strong>{" "}
                                    {importData.description || "No description"}
                                </p>
                                <p>
                                    <strong className="text-orange-600">URL:</strong>{" "}
                                    <a
                                        href={importData.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-400 hover:underline break-all"
                                    >
                                        Open Video
                                    </a>
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default TopBar;
