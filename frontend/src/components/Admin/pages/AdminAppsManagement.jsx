import React, { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, HardDrive, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminAppsManagement = () => {
    const { token } = useAuth();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingState, setUploadingState] = useState({
        macos: { uploading: false, progress: 0 },
        windows: { uploading: false, progress: 0 }
    });

    const fetchAppsStatus = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/apps`, { headers });
            setApps(res.data.apps);
        } catch (err) {
            console.error("Failed to load app releases list", err);
            toast.error("Failed to retrieve application file status.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAppsStatus();
    }, [token]);

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleUpload = async (e, platform) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        if (platform === 'macos' && !file.name.endsWith('.dmg')) {
            toast.error("Please upload a .dmg file for macOS release.");
            return;
        }
        if (platform === 'windows' && !file.name.endsWith('.exe')) {
            toast.error("Please upload a .exe file for Windows release.");
            return;
        }

        const formData = new FormData();
        formData.append('appFile', file);

        setUploadingState(prev => ({
            ...prev,
            [platform]: { uploading: true, progress: 0 }
        }));

        try {
            const headers = { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            };

            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/apps/upload?platform=${platform}`,
                formData,
                {
                    headers,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadingState(prev => ({
                            ...prev,
                            [platform]: { uploading: true, progress: percentCompleted }
                        }));
                    }
                }
            );

            toast.success(`LearnProof app for ${platform === 'macos' ? 'macOS' : 'Windows'} updated successfully!`);
            fetchAppsStatus(); // reload status
        } catch (err) {
            console.error("File upload failed", err);
            toast.error("File upload failed. Please try again.");
        } finally {
            setUploadingState(prev => ({
                ...prev,
                [platform]: { uploading: false, progress: 0 }
            }));
            // Clear input
            e.target.value = null;
        }
    };

    if (loading && apps.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <HardDrive className="text-orange-500" size={24} />
                        Desktop App Releases
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View, upload, and update the application build installers served to visitors of the landing page.
                    </p>
                </div>
                <button
                    onClick={fetchAppsStatus}
                    className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Platform Management Cards */}
            <div className="grid md:grid-cols-2 gap-8">
                {apps.map((app) => {
                    const isMac = app.platform === 'macos';
                    const uploadState = uploadingState[app.platform];
                    return (
                        <div key={app.platform} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        isMac ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                    }`}>
                                        {app.label} platform
                                    </span>
                                    {app.exists ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200/20 dark:border-green-500/20">
                                            <CheckCircle size={14} /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200/20 dark:border-red-500/20">
                                            <AlertCircle size={14} /> Missing file
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
                                    LearnProof for {app.label}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Standard target file name: <code className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{app.name}</code>
                                </p>

                                {/* File Metadata Info */}
                                <div className="bg-slate-50/50 dark:bg-slate-955/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3 mb-6">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-400 dark:text-slate-500">File size:</span>
                                        <span className="text-slate-700 dark:text-slate-300">{app.exists ? formatBytes(app.size) : '0 Bytes'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-400 dark:text-slate-500">Last updated:</span>
                                        <span className="text-slate-700 dark:text-slate-300">{app.exists ? new Date(app.updatedAt).toLocaleString() : 'Never'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Uploader / Actions */}
                            <div className="space-y-4">
                                {uploadState.uploading ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                            <span>Uploading release...</span>
                                            <span>{uploadState.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-orange-500 h-full transition-all duration-155" 
                                                style={{ width: `${uploadState.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-orange-50/10 dark:hover:bg-orange-500/5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all">
                                            <Upload size={16} />
                                            <span>{app.exists ? 'Update Installer' : 'Upload Installer'}</span>
                                            <input 
                                                type="file" 
                                                accept={isMac ? '.dmg' : '.exe'} 
                                                className="hidden" 
                                                onChange={(e) => handleUpload(e, app.platform)}
                                            />
                                        </label>
                                        
                                        {app.exists && (
                                            <a
                                                href={`${import.meta.env.VITE_BACKEND_URL}/apps/${app.name}`}
                                                className="px-4 flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-all"
                                                title="Download current file"
                                                download
                                            >
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Instructions Alert */}
            <div className="bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-6 flex gap-4">
                <ShieldAlert className="text-orange-600 dark:text-orange-500 flex-shrink-0" size={24} />
                <div>
                    <h4 className="text-sm font-bold text-orange-850 dark:text-orange-400 flex items-center gap-1.5">
                        <Sparkles size={14} /> Release Upload Instructions
                    </h4>
                    <p className="text-xs text-orange-700 dark:text-orange-500 leading-relaxed mt-2">
                        Uploading a new file will instantly replace the active release file served statically from the backend. macOS release files must be in <strong>.dmg</strong> format and Windows release files must be in <strong>.exe</strong> format. Ensure build names inside the React download component remain matched with these target installer configurations.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminAppsManagement;
