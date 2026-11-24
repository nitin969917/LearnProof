import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Smartphone,
    Download,
    Mail,
    Share2,
    Check,
    Copy,
    Play,
    ShieldCheck,
    QrCode,
    X,
    ArrowUpRight,
    ArrowLeft,
    PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';

// Official WhatsApp Brand SVG Icon (Crisp Vector)
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
);

const ContactCardPage = () => {
    const navigate = useNavigate();
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);

    useEffect(() => {
        document.title = "LearnProof AI Technologies Private Limited | Connect";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute(
                "content",
                "Official digital visiting card for LearnProof AI Technologies Private Limited. Apps, walkthrough, platform links, and executive connect."
            );
        }
    }, []);

    const appStoreUrl = "https://apps.apple.com/app/learnproof-ai/id6815305441";
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa";
    const videoEmbedUrl = "https://www.youtube.com/embed/07L9iG0th_s?autoplay=1&rel=0&playsinline=1";
    const pageUrl = typeof window !== 'undefined' ? window.location.href : "https://learnproofai.com/contact";
    const whatsappUrl = "https://wa.me/919699176009?text=Hello%20LearnProof%20AI%20Team%2C%20I%20would%20like%20to%20connect%20regarding%20partnerships%20%2F%20investment.";

    const handleCopy = (text, type) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            if (type === 'email') {
                setCopiedEmail(true);
                toast.success("Email copied to clipboard");
                setTimeout(() => setCopiedEmail(false), 2000);
            } else if (type === 'link') {
                setCopiedLink(true);
                toast.success("Link copied to clipboard");
                setTimeout(() => setCopiedLink(false), 2000);
            }
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "LearnProof AI Technologies Private Limited",
                    text: "LearnProof AI - Turning open video learning into verified credentials & interactive practice.",
                    url: pageUrl,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    handleCopy(pageUrl, 'link');
                }
            }
        } else {
            handleCopy(pageUrl, 'link');
        }
    };

    const founders = [
        {
            name: "Nitin Gaikwad",
            role: "Founder & CEO",
            linkedin: "https://www.linkedin.com/in/nitin9699",
            initials: "NG"
        },
        {
            name: "Avishkar Kakade",
            role: "Co-Founder & COO",
            linkedin: "https://www.linkedin.com/in/avishkar-kakade-16536124b/",
            initials: "AK"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-slate-50 to-orange-50/30 text-slate-900 py-6 sm:py-10 px-4 sm:px-6 flex flex-col justify-between selection:bg-orange-100 font-sans">
            {/* Ambient Background Grid */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            {/* Top Navigation Strip */}
            <header className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between mb-4">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-orange-600 transition-all shadow-xs cursor-pointer group"
                >
                    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>learnproofai.com</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
                        title="Display Card QR"
                    >
                        <QrCode size={13} />
                        <span>QR</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                    >
                        {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                        <span>{copiedLink ? "Copied" : "Share"}</span>
                    </button>
                </div>
            </header>

            {/* Main Single Unified Executive Visiting Card */}
            <main className="relative z-10 w-full max-w-xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 relative overflow-hidden"
                >
                    {/* Top Subtle Brand Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

                    {/* 1. Profile Identity Header */}
                    <div className="text-center">
                        <div className="relative mx-auto w-16 h-16 mb-3">
                            <img
                                src="/LP_M_logo.png"
                                alt="LearnProof AI"
                                className="w-16 h-16 rounded-2xl object-contain border border-slate-100 shadow-sm bg-white"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border border-white shadow-xs" title="Verified Entity">
                                <ShieldCheck size={12} />
                            </div>
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            LearnProof AI
                        </h1>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                            LearnProof AI Technologies Private Limited
                        </p>

                        {/* Crisp 2-Line Investor Description */}
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed max-w-md mx-auto">
                            AI-native academic infrastructure transforming open educational video into structured mastery, interactive coding, and verified credentials.
                        </p>
                    </div>

                    {/* 2. Primary Direct Actions (WhatsApp & Email side-by-side) */}
                    <div className="grid grid-cols-2 gap-2.5 mt-5">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition-all active:scale-98 no-underline cursor-pointer"
                        >
                            <WhatsAppIcon className="w-4 h-4" />
                            <span>WhatsApp Chat</span>
                        </a>

                        <a
                            href="mailto:hello@learnproofai.com"
                            className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-98 no-underline cursor-pointer"
                        >
                            <Mail size={14} />
                            <span>Email Us</span>
                        </a>
                    </div>

                    {/* Direct Contact Numbers & Copy Link */}
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                        <button
                            onClick={() => handleCopy("hello@learnproofai.com", "email")}
                            className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-0 text-slate-600 font-medium"
                        >
                            {copiedEmail ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            <span>hello@learnproofai.com</span>
                        </button>

                        <span className="text-slate-300">•</span>

                        <a
                            href="tel:+919699176009"
                            className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors no-underline text-slate-600 font-medium"
                        >
                            <PhoneCall size={12} className="text-slate-400" />
                            <span>+91 96991 76009</span>
                        </a>
                    </div>

                    {/* 3. Integrated Mobile & Desktop App Bar */}
                    <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                                <Smartphone size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">Get Our Apps</p>
                                <p className="text-[10px] text-slate-500">Android, iOS & Desktop</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <a
                                href={playStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-90 transition active:scale-95"
                            >
                                <img
                                    src="/google-play-badge.svg"
                                    alt="Google Play Store"
                                    className="h-8 w-auto object-contain"
                                />
                            </a>

                            <a
                                href={appStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-90 transition active:scale-95"
                            >
                                <img
                                    src="/app-store-badge.svg"
                                    alt="Apple App Store"
                                    className="h-8 w-auto object-contain"
                                />
                            </a>

                            <button
                                onClick={() => navigate('/download')}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Download Desktop Version"
                            >
                                <Download size={12} />
                                <span>Mac/PC</span>
                            </button>
                        </div>
                    </div>

                    {/* 4. 1-Minute Executive Product Walkthrough */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                1-Minute Product Walkthrough
                            </span>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                Demo Video
                            </span>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 shadow-sm group">
                            {showVideoModal ? (
                                <iframe
                                    src={videoEmbedUrl}
                                    title="LearnProof AI Demo"
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div
                                    onClick={() => setShowVideoModal(true)}
                                    className="relative w-full h-full cursor-pointer flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        src="/yt_demo_thumbnail.jpg"
                                        alt="Product Demonstration"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://img.youtube.com/vi/07L9iG0th_s/maxresdefault.jpg";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/20 transition-colors" />
                                    <div className="absolute w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                                        <Play size={18} className="ml-0.5 fill-slate-900" />
                                    </div>
                                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white bg-slate-950/80 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                                        <span className="font-semibold truncate">LearnProof AI Platform Tour</span>
                                        <span className="font-bold text-orange-400 shrink-0 ml-2">Click to Play</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Executive Leadership & Founders */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Leadership & Founders
                            </span>
                            <span className="text-[10px] text-slate-400">Connect on LinkedIn</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {founders.map((founder) => (
                                <a
                                    key={founder.name}
                                    href={founder.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all text-left no-underline cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                            {founder.initials}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                {founder.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate">
                                                {founder.role}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={13} className="text-slate-400 group-hover:text-slate-700 shrink-0 ml-1" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* 6. Official Links Pill Strip */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <a
                                href="https://learnproofai.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 no-underline transition"
                            >
                                <Globe size={13} className="text-orange-500" />
                                <span>Website</span>
                            </a>

                            <a
                                href="https://www.linkedin.com/company/learnproof-ai/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 no-underline transition"
                            >
                                <span>LinkedIn</span>
                                <ArrowUpRight size={11} className="text-slate-400" />
                            </a>

                            <a
                                href="https://instagram.com/learnproofai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 no-underline transition"
                            >
                                <span>Instagram</span>
                                <ArrowUpRight size={11} className="text-slate-400" />
                            </a>

                            <a
                                href="https://youtube.com/@LearnProof_AI"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 no-underline transition"
                            >
                                <span>YouTube</span>
                                <ArrowUpRight size={11} className="text-slate-400" />
                            </a>

                            <a
                                href="mailto:founder@learnproofai.com?subject=Investor%20%2F%20Partner%20Inquiry%3A%20LearnProof%20AI"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-700 no-underline transition"
                            >
                                <span>Investor Relations</span>
                                <ArrowUpRight size={11} className="text-orange-500" />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Minimalist Corporate Footer */}
            <footer className="relative z-10 w-full max-w-xl mx-auto text-center mt-6 text-[11px] text-slate-400 space-y-1">
                <p>© {new Date().getFullYear()} LearnProof AI Technologies Private Limited</p>
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <button onClick={() => navigate('/privacy-policy')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Privacy Policy</button>
                    <span>•</span>
                    <button onClick={() => navigate('/terms')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Terms of Service</button>
                    <span>•</span>
                    <button onClick={() => navigate('/support')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Support</button>
                </div>
            </footer>

            {/* QR Code Modal for In-Person Scanning */}
            <AnimatePresence>
                {showQrModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
                        onClick={() => setShowQrModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xs rounded-2xl bg-white border border-slate-200 p-5 text-center shadow-xl relative"
                        >
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                                <X size={14} />
                            </button>

                            <p className="text-xs font-bold text-slate-900 mb-0.5">LearnProof AI</p>
                            <p className="text-[10px] text-slate-500 mb-3">Scan to view digital visiting card</p>

                            <div className="p-3 bg-slate-50 rounded-xl mx-auto w-fit border border-slate-100">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&color=0-0-0&data=${encodeURIComponent(pageUrl)}`}
                                    alt="Visiting Card QR Code"
                                    className="w-40 h-40 object-contain rounded-md"
                                />
                            </div>

                            <p className="text-[10px] text-slate-400 mt-3 font-mono break-all">
                                {pageUrl}
                            </p>

                            <div className="mt-4 flex gap-1.5">
                                <button
                                    onClick={() => handleCopy(pageUrl, 'link')}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                    {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <Share2 size={12} />
                                    <span>Share</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContactCardPage;
