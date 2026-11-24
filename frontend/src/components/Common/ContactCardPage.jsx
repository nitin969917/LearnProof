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
    Send,
    Users,
    ArrowUpRight,
    ArrowLeft,
    PhoneCall,
    Briefcase,
    Building2,
    ExternalLink
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
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = "LearnProof AI Technologies Private Limited | Official Connect";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute(
                "content",
                "LearnProof AI Technologies Private Limited - Official digital contact card, executive demo, product links, mobile apps, and leadership connect."
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

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const subject = encodeURIComponent(`Inquiry from Card: ${contactForm.name}`);
        const body = encodeURIComponent(
            `Name: ${contactForm.name}\n` +
            `Contact: ${contactForm.email}\n\n` +
            `Message:\n${contactForm.message}`
        );
        window.location.href = `mailto:founder@learnproofai.com?subject=${subject}&body=${body}`;
        setIsSubmitting(false);
        toast.success("Opening your mail client...");
    };

    const officialLinks = [
        {
            title: "Web Platform",
            desc: "Interactive courses, quizzes & AI notes",
            icon: Globe,
            url: "https://learnproofai.com",
            isExternal: true,
            tag: "learnproofai.com"
        },
        {
            title: "LinkedIn Company",
            desc: "Corporate updates, milestones & team",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            ),
            url: "https://www.linkedin.com/company/learnproof-ai/",
            isExternal: true,
            tag: "Company Page"
        },
        {
            title: "Instagram",
            desc: "@learnproofai • Community & visual updates",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
            ),
            url: "https://instagram.com/learnproofai",
            isExternal: true,
            tag: "@learnproofai"
        },
        {
            title: "YouTube Channel",
            desc: "@LearnProof_AI • Demonstrations & releases",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            ),
            url: "https://youtube.com/@LearnProof_AI",
            isExternal: true,
            tag: "Channel"
        },
        {
            title: "Campus Ambassador Network",
            desc: "Institutional outreach across 50+ universities",
            icon: Users,
            url: "/ambassador",
            isExternal: false,
            tag: "Ambassadors"
        },
        {
            title: "Desktop Application",
            desc: "Available for macOS (.dmg) & Windows (.exe)",
            icon: Download,
            url: "/download",
            isExternal: false,
            tag: "Download"
        }
    ];

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
        <div className="min-h-screen bg-slate-50/80 text-slate-900 relative selection:bg-orange-100 font-sans">
            {/* Subtle Corporate Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />
                <div className="absolute top-0 right-1/4 w-[480px] h-[360px] bg-orange-100/50 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-amber-100/40 rounded-full blur-[90px] pointer-events-none" />
            </div>

            {/* Clean Top Header */}
            <header className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-orange-600 transition-all shadow-xs cursor-pointer group"
                >
                    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>learnproofai.com</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
                        title="View Card QR"
                    >
                        <QrCode size={13} />
                        <span className="hidden sm:inline">QR Code</span>
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

            {/* Main Content Area */}
            <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-16">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: Corporate Identity & Direct Channels */}
                    <div className="lg:col-span-5 space-y-4">
                        
                        {/* Primary Executive Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-center relative overflow-hidden"
                        >
                            {/* Subtle Orange Accent Top Border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

                            {/* Crisp Mobile Logo Avatar */}
                            <div className="relative mx-auto w-16 h-16 mb-3 mt-1">
                                <img
                                    src="/LP_M_logo.png"
                                    alt="LearnProof AI"
                                    className="w-16 h-16 rounded-xl object-contain border border-slate-100 shadow-sm bg-white"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-white" title="Verified Entity">
                                    <ShieldCheck size={12} />
                                </div>
                            </div>

                            {/* Company Name & Entity */}
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                                LearnProof AI
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                                LearnProof AI Technologies Private Limited
                            </p>

                            {/* Clean, Refined 2-Line Investor Description */}
                            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed max-w-xs mx-auto">
                                AI-native learning infrastructure transforming open educational video into structured mastery, verified credentials, and real-time execution.
                            </p>

                            {/* Properly Sized, Elegant Primary Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 mt-5">
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs shadow-xs transition-all active:scale-98 no-underline cursor-pointer"
                                >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                </a>

                                <a
                                    href="mailto:hello@learnproofai.com"
                                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all active:scale-98 no-underline cursor-pointer"
                                >
                                    <Mail size={13} />
                                    <span>Email Us</span>
                                </a>
                            </div>

                            {/* Minimalist Contact Strip */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                                <button
                                    onClick={() => handleCopy("hello@learnproofai.com", "email")}
                                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-0 text-slate-600 font-medium"
                                >
                                    {copiedEmail ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    <span>{copiedEmail ? "Copied" : "hello@learnproofai.com"}</span>
                                </button>

                                <a
                                    href="tel:+919699176009"
                                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors no-underline text-slate-600 font-medium"
                                >
                                    <PhoneCall size={12} className="text-slate-400" />
                                    <span>+91 96991 76009</span>
                                </a>
                            </div>
                        </motion.div>

                        {/* Executive Leadership & Founders Card */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-slate-500" />
                                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Leadership
                                    </h2>
                                </div>
                                <span className="text-[10px] text-slate-400">Founders</span>
                            </div>

                            <div className="space-y-1.5">
                                {founders.map((founder) => (
                                    <a
                                        key={founder.name}
                                        href={founder.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left no-underline"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-orange-600 flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                                                {founder.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                    {founder.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {founder.role}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={13} className="text-slate-400 group-hover:text-slate-700 transition-all shrink-0 ml-1.5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Direct Investor & Partnership Inquiry */}
                        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1.5 text-orange-400 text-xs font-semibold">
                                <Building2 size={14} />
                                <span>Investor & Partner Relations</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                For institutional collaborations, capital inquiries, or campus partnerships:
                            </p>
                            <a
                                href="mailto:founder@learnproofai.com?subject=Investor%20%2F%20Partnership%20Inquiry%3A%20LearnProof%20AI"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-300 hover:text-orange-200 mt-2 underline"
                            >
                                <span>founder@learnproofai.com</span>
                                <ArrowUpRight size={12} />
                            </a>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Apps Ecosystem, Executive Demo & Links */}
                    <div className="lg:col-span-7 space-y-4">

                        {/* Mobile & Desktop Ecosystem */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.05 }}
                            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-3 px-0.5">
                                <div className="flex items-center gap-2">
                                    <Smartphone size={16} className="text-slate-600" />
                                    <div>
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Application Ecosystem</h3>
                                        <p className="text-[11px] text-slate-500">Cross-platform companion for Android, iOS & Desktop</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Available
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <a
                                    href={playStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center no-underline"
                                >
                                    <img
                                        src="/google-play-badge.svg"
                                        alt="Google Play Store"
                                        className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
                                    />
                                </a>

                                <a
                                    href={appStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center no-underline"
                                >
                                    <img
                                        src="/app-store-badge.svg"
                                        alt="Apple App Store"
                                        className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
                                    />
                                </a>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Desktop version: macOS (.dmg) & Windows (.exe)</span>
                                <button
                                    onClick={() => navigate('/download')}
                                    className="font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                >
                                    <span>Download</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Executive Walkthrough Demo (1-Min Overview) */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-3 px-0.5">
                                <div className="flex items-center gap-2">
                                    <Play size={16} className="text-orange-600" />
                                    <div>
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Product Walkthrough</h3>
                                        <p className="text-[11px] text-slate-500">1-minute platform demonstration</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Full Demo
                                </span>
                            </div>

                            {/* Responsive 16:9 Video Frame */}
                            <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-200 shadow-xs group">
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
                                            alt="Video Walkthrough"
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
                                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white bg-slate-950/75 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                                            <span className="font-medium truncate">LearnProof AI Feature Architecture</span>
                                            <span className="font-semibold text-orange-400 shrink-0 ml-2">Play Video</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Official Channels & Explore Links */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between px-0.5">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Corporate & Public Links</h3>
                                <span className="text-[10px] text-slate-400">Verified Channels</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {officialLinks.map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <a
                                            key={item.title}
                                            href={item.url}
                                            target={item.isExternal ? "_blank" : undefined}
                                            rel={item.isExternal ? "noopener noreferrer" : undefined}
                                            onClick={(e) => {
                                                if (!item.isExternal) {
                                                    e.preventDefault();
                                                    navigate(item.url);
                                                }
                                            }}
                                            className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left no-underline cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:text-orange-600 transition-colors shrink-0">
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 truncate">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowUpRight size={13} className="text-slate-400 group-hover:text-slate-700 transition-all shrink-0 ml-1" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Executive Message / Quick Contact Form */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 px-0.5">
                                <Send size={14} className="text-slate-600" />
                                <div>
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Direct Message</h3>
                                    <p className="text-[11px] text-slate-500">Reach the founding team directly</p>
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-2 mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white outline-none text-xs text-slate-900 placeholder-slate-400 transition-all"
                                    />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Email or Phone"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white outline-none text-xs text-slate-900 placeholder-slate-400 transition-all"
                                    />
                                </div>

                                <textarea
                                    rows={2}
                                    required
                                    placeholder="Brief note or inquiry..."
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white outline-none text-xs text-slate-900 placeholder-slate-400 resize-none transition-all"
                                />

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Send size={12} />
                                    <span>Send Message</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Corporate Footer */}
                <footer className="mt-10 text-center space-y-2 pt-5 border-t border-slate-200/60">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium">© {new Date().getFullYear()} LearnProof AI Technologies Private Limited</span>
                        <span>•</span>
                        <a href="https://learnproofai.com" className="text-slate-600 hover:text-orange-600 font-semibold transition-colors">learnproofai.com</a>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
                        <button onClick={() => navigate('/privacy-policy')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Privacy Policy</button>
                        <span>•</span>
                        <button onClick={() => navigate('/terms')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Terms</button>
                        <span>•</span>
                        <button onClick={() => navigate('/support')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Support Desk</button>
                    </div>
                </footer>
            </main>

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
                            <p className="text-[10px] text-slate-500 mb-3">Scan to view visiting card & links</p>

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
