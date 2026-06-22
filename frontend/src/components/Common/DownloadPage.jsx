import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Monitor, Laptop, Download, ShieldCheck, HelpCircle, AlertCircle, Sparkles, Smartphone } from 'lucide-react';

const DownloadPage = () => {
    const navigate = useNavigate();
    const [detectedOS, setDetectedOS] = useState('windows'); // 'windows', 'macos', 'android', 'other'

    // Detect user OS
    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
            setDetectedOS('macos');
        } else if (userAgent.includes('windows')) {
            setDetectedOS('windows');
        } else if (userAgent.includes('android')) {
            setDetectedOS('android');
        } else {
            setDetectedOS('other');
        }
        
        document.title = "Download LearnProof AI App | Desktop & Mobile";
    }, []);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const macDownloadUrl = `${backendUrl}/apps/LearnProof-AI.dmg`;
    const winDownloadUrl = `${backendUrl}/apps/LearnProof-AI.exe`;
    const androidDownloadUrl = "https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa";

    const platforms = [
        {
            id: 'macos',
            name: 'macOS',
            icon: <Laptop className="w-12 h-12" />,
            extension: '.dmg',
            size: 'approx. 80MB',
            url: macDownloadUrl,
            color: 'from-violet-500 to-indigo-600',
            glow: 'rgba(124, 58, 237, 0.15)',
            accent: 'border-violet-200',
            textColor: 'text-violet-600',
            btnBg: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700',
            instructions: [
                "Download the `LearnProof-AI.dmg` file to your Mac.",
                "Double-click the downloaded file to mount the disk image.",
                "Drag the LearnProof application icon to your Applications folder.",
                "Security Note: Because the app is recently built, if macOS shows a \"Developer Cannot Be Verified\" prompt, right-click (or Control-click) the app in your Applications folder, choose Open, and click Open anyway."
            ]
        },
        {
            id: 'windows',
            name: 'Windows',
            icon: <Monitor className="w-12 h-12" />,
            extension: '.exe',
            size: 'approx. 65MB',
            url: winDownloadUrl,
            color: 'from-orange-500 to-red-600',
            glow: 'rgba(249, 115, 22, 0.15)',
            accent: 'border-orange-200',
            textColor: 'text-orange-600',
            btnBg: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
            instructions: [
                "Download the `LearnProof-AI.exe` installer file.",
                "Double-click the file to start the installation wizard.",
                "Follow the on-screen instructions to finish setting up.",
                "Security Note: If Windows SmartScreen blocks launch with a \"Windows protected your PC\" banner, click More Info and select Run Anyway to complete installation."
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-orange-50 relative overflow-hidden selection:bg-orange-200 py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Texture & Blobs */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[100px] opacity-60 z-0 pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[90px] opacity-40 z-0 pointer-events-none -translate-x-1/4" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header Back Link */}
                <button
                    onClick={() => navigate('/')}
                    className="group mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-orange-100 shadow-sm"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Landing</span>
                </button>

                {/* Page Title */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-orange-200 text-orange-600 text-sm font-bold tracking-wide mb-4 shadow-sm"
                    >
                        <Sparkles size={14} className="text-orange-500 animate-pulse" />
                        <span>Take Your Learning Offline</span>
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
                        Download the <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">LearnProof AI</span> App
                    </h1>
                    <p className="text-gray-600 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                        Access AI Video Intuition, take beautiful interactive notes, and track your YouTube learning streaks directly from your desktop.
                    </p>
                </div>

                {/* Platforms Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {platforms.map((platform) => {
                        const isRecommended = detectedOS === platform.id;
                        return (
                            <motion.div
                                key={platform.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className={`bg-white/80 backdrop-blur-xl border-2 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all duration-300 relative ${
                                    isRecommended ? `${platform.accent} shadow-2xl` : 'border-gray-100'
                                }`}
                                style={{ boxShadow: isRecommended ? `0 12px 36px -8px ${platform.glow}` : undefined }}
                            >
                                {isRecommended && (
                                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r ${platform.color} text-white text-[11px] font-black tracking-widest uppercase py-1 px-4 rounded-full shadow-md`}>
                                        ★ Recommended for your device
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-lg`}>
                                            {platform.icon}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                                            {platform.extension} • {platform.size}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">LearnProof for {platform.name}</h3>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        Get the full LearnProof companion experience. Runs locally on your device with optimized system resource usage.
                                    </p>

                                    <a
                                        href={platform.url}
                                        className={`w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-300 transform active:scale-95 ${platform.btnBg}`}
                                    >
                                        <Download size={18} />
                                        <span>Download for {platform.name}</span>
                                    </a>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100/80">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
                                        <HelpCircle size={16} className={platform.textColor} />
                                        <span>How to Install & Run</span>
                                    </h4>
                                    <ol className="space-y-3">
                                        {platform.instructions.map((step, idx) => (
                                            <li key={idx} className="flex gap-2.5 text-xs text-gray-500 leading-relaxed">
                                                <span className={`font-black flex-shrink-0 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] ${platform.textColor}`}>
                                                    {idx + 1}
                                                </span>
                                                <span>
                                                    {step.includes("Security Note:") ? (
                                                        <>
                                                            <strong className="text-orange-600 block mt-1 font-bold">
                                                                ⚠ {step.split("Security Note:")[0]} Security Action Needed:
                                                            </strong>
                                                            {step.split("Security Note:")[1]}
                                                        </>
                                                    ) : (
                                                        step
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Additional Platforms (Mobile) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/50 border border-gray-200/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-sm"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-left flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">Looking for Android?</h4>
                                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                                    Take the LearnProof AI experience on the go. Available for installation via Google Play.
                                </p>
                            </div>
                        </div>

                        <a
                            href={androidDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-md transform active:scale-95"
                        >
                            <span>Get it on Google Play</span>
                        </a>
                    </div>
                </motion.div>

                {/* Footer Security Badge */}
                <div className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span>Secure Download • All files are scanned and verified virus-free.</span>
                </div>
            </div>
        </div>
    );
};

export default DownloadPage;
