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
    ExternalLink,
    Play,
    Sparkles,
    ShieldCheck,
    MessageCircle,
    UserPlus,
    QrCode,
    X,
    Send,
    Award,
    BookOpen,
    Code2,
    Users,
    ArrowUpRight,
    GraduationCap,
    HeartHandshake
} from 'lucide-react';
import toast from 'react-hot-toast';

const ContactCardPage = () => {
    const navigate = useNavigate();
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = "LearnProof AI | Official Digital Visiting Card & Links";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content", "Connect with LearnProof AI. Download our mobile & desktop apps, watch our tutorial, explore our platform, and reach out directly.");
        }
    }, []);

    const appStoreUrl = "https://apps.apple.com/app/learnproof-ai/id6815305441";
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa";
    const videoEmbedUrl = "https://www.youtube.com/embed/07L9iG0th_s?autoplay=1&rel=0&playsinline=1";
    const pageUrl = typeof window !== 'undefined' ? window.location.href : "https://learnproofai.com/contact";

    // Copy to clipboard helper
    const handleCopy = (text, type) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            if (type === 'email') {
                setCopiedEmail(true);
                toast.success("Email copied to clipboard!");
                setTimeout(() => setCopiedEmail(false), 2000);
            } else if (type === 'link') {
                setCopiedLink(true);
                toast.success("Link copied to clipboard!");
                setTimeout(() => setCopiedLink(false), 2000);
            }
        }
    };

    // Native Web Share API
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "LearnProof AI - Digital Visiting Card",
                    text: "Check out LearnProof AI - Master any skill from YouTube with AI Intuition and verifiable certificates!",
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

    // Generate & Download VCF (vCard 3.0) for 1-click Contact Saving on iOS & Android
    const handleSaveContact = () => {
        const vCardData = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:LearnProof AI',
            'ORG:LearnProof AI Technologies',
            'TITLE:AI Learning Platform',
            'TEL;TYPE=CELL,VOICE:+919699176009',
            'EMAIL;TYPE=PREF,INTERNET:hello@learnproofai.com',
            'EMAIL;TYPE=WORK,INTERNET:founder@learnproofai.com',
            'URL:https://learnproofai.com',
            'NOTE:LearnProof AI turns YouTube videos into your personal university with AI Intuition, verified credentials, and interactive coding.',
            'X-SOCIALPROFILE;type=instagram:https://instagram.com/learnproofai',
            'X-SOCIALPROFILE;type=youtube:https://youtube.com/@LearnProof_AI',
            'X-SOCIALPROFILE;type=linkedin:https://www.linkedin.com/company/learnproof-ai/',
            'END:VCARD'
        ].join('\r\n');

        const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'LearnProof-AI.vcf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Contact file downloaded! Tap to add to contacts.");
    };

    // Quick Message Form Submission
    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const subject = encodeURIComponent(`Inquiry from Visiting Card: ${contactForm.name}`);
        const body = encodeURIComponent(
            `Name: ${contactForm.name}\n` +
            `Email: ${contactForm.email}\n\n` +
            `Message:\n${contactForm.message}`
        );
        window.location.href = `mailto:hello@learnproofai.com?subject=${subject}&body=${body}`;
        setIsSubmitting(false);
        toast.success("Opening your email client...");
    };

    const primaryLinks = [
        {
            title: "Official Website",
            desc: "Explore AI courses, playlists & practice tools",
            icon: Globe,
            url: "https://learnproofai.com",
            isExternal: true,
            badge: "Web Platform",
            badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            glow: "hover:border-emerald-500/40"
        },
        {
            title: "Instagram",
            desc: "@learnproofai • Daily visual insights & updates",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
            ),
            url: "https://instagram.com/learnproofai",
            isExternal: true,
            badge: "Follow @learnproofai",
            badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
            glow: "hover:border-pink-500/40"
        },
        {
            title: "YouTube Channel",
            desc: "@LearnProof_AI • Masterclasses & feature walkthroughs",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            ),
            url: "https://youtube.com/@LearnProof_AI",
            isExternal: true,
            badge: "Subscribe",
            badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
            glow: "hover:border-red-500/40"
        },
        {
            title: "LinkedIn Page",
            desc: "LearnProof AI • Company updates, insights & careers",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            ),
            url: "https://www.linkedin.com/company/learnproof-ai/",
            isExternal: true,
            badge: "Connect",
            badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
            glow: "hover:border-blue-500/40"
        },
        {
            title: "Campus Ambassador Program",
            desc: "Lead student learning on your campus & earn rewards",
            icon: Users,
            url: "/ambassador",
            isExternal: false,
            badge: "Join Cohort",
            badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            glow: "hover:border-amber-500/40"
        },
        {
            title: "Desktop Application",
            desc: "Download for macOS (.dmg) & Windows (.exe)",
            icon: Download,
            url: "/download",
            isExternal: false,
            badge: "PC & Mac",
            badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
            glow: "hover:border-violet-500/40"
        }
    ];

    const founders = [
        {
            name: "Nitin Gaikwad",
            role: "Founder & Product Architect",
            linkedin: "https://www.linkedin.com/in/nitin9699",
            initials: "NG"
        },
        {
            name: "Avishkar Kakade",
            role: "Co-Founder & Operations",
            linkedin: "https://www.linkedin.com/in/avishkar-kakade-16536124b/",
            initials: "AK"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-orange-500/30 font-sans">
            {/* Ambient Background Gradient Orbs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-orange-500/20 via-amber-500/10 to-transparent rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -left-48 w-[400px] h-[400px] bg-gradient-to-r from-red-500/10 to-transparent rounded-full blur-[100px]" />
                <div className="absolute bottom-10 -right-48 w-[450px] h-[450px] bg-gradient-to-l from-orange-500/10 to-transparent rounded-full blur-[100px]" />
                {/* Tech Dot Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{ backgroundImage: 'radial-gradient(#f97316 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
                />
            </div>

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full max-w-xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                    <img src="/LP_M_logo.png" alt="LearnProof" className="w-5 h-5 rounded-md object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span>LearnProof AI</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="inline-flex items-center justify-center p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-orange-400 transition-all backdrop-blur-md cursor-pointer"
                        title="Display QR Code"
                    >
                        <QrCode size={18} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-xs font-bold text-orange-400 hover:text-orange-300 transition-all backdrop-blur-md cursor-pointer"
                    >
                        {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                        <span>{copiedLink ? "Copied!" : "Share"}</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 w-full max-w-xl mx-auto px-4 py-4 pb-20 space-y-6">
                
                {/* Digital Visiting Card Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden text-center"
                >
                    {/* Glowing Accent Ring */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                    
                    {/* Top Pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[11px] font-bold tracking-wide mb-4">
                        <Sparkles size={12} className="text-orange-400 animate-pulse" />
                        <span>OFFICIAL VISITING CARD</span>
                    </div>

                    {/* Logo Avatar */}
                    <div className="relative mx-auto w-24 h-24 mb-4">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 blur-lg opacity-40 animate-pulse" />
                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-orange-500/40 p-2 flex items-center justify-center shadow-inner overflow-hidden">
                            <img
                                src="/LP_logo.png"
                                alt="LearnProof AI"
                                className="w-full h-full object-contain drop-shadow"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/LP_M_logo.png";
                                }}
                            />
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md border-2 border-slate-900" title="Verified Brand">
                            <ShieldCheck size={14} />
                        </div>
                    </div>

                    {/* Brand Titles */}
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        LearnProof AI
                    </h1>
                    <p className="text-orange-400 text-xs sm:text-sm font-semibold mt-1">
                        Turn YouTube Into Your Personal University
                    </p>
                    <p className="text-slate-400 text-xs mt-2.5 max-w-sm mx-auto leading-relaxed">
                        Extract AI Intuition from any video lecture, solve progressive checkpoint quizzes, code hands-on, and earn verifiable cryptographic certificates.
                    </p>

                    {/* Quick Feature Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
                            <BookOpen size={12} className="text-orange-400" /> AI Video Notes
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
                            <Code2 size={12} className="text-amber-400" /> In-Browser IDE
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
                            <Award size={12} className="text-emerald-400" /> Verifiable Certs
                        </span>
                    </div>

                    {/* Top Action Buttons (Save Contact + Direct Email) */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            onClick={handleSaveContact}
                            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 cursor-pointer"
                        >
                            <UserPlus size={16} />
                            <span>Save Contact</span>
                        </button>

                        <a
                            href="mailto:hello@learnproofai.com"
                            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs sm:text-sm transition-all transform active:scale-95 cursor-pointer no-underline"
                        >
                            <Mail size={16} className="text-orange-400" />
                            <span>Email Us</span>
                        </a>
                    </div>

                    {/* Direct Contact Links Strip */}
                    <div className="mt-4 pt-4 border-t border-slate-800/70 flex items-center justify-around text-xs text-slate-400">
                        <a
                            href="https://wa.me/919699176009?text=Hi%20LearnProof%20AI%2C%20I%20scanned%20your%20visiting%20card%20and%20wanted%20to%20connect!"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                        >
                            <MessageCircle size={15} className="text-emerald-400" />
                            <span>WhatsApp Chat</span>
                        </a>

                        <span className="text-slate-700">•</span>

                        <button
                            onClick={() => handleCopy("hello@learnproofai.com", "email")}
                            className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer bg-transparent border-0 text-slate-400"
                        >
                            {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            <span>{copiedEmail ? "Copied Email" : "Copy Email"}</span>
                        </button>
                    </div>
                </motion.div>

                {/* Mobile Apps Section - High Priority for Visiting Card Scanners */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-3xl p-5 sm:p-6 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                <Smartphone size={16} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-white">Get The Mobile App</h3>
                                <p className="text-[11px] text-slate-400">Learn on the go with zero distractions</p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            Live on Stores
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href={playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/40 transition-all text-center no-underline"
                        >
                            <img
                                src="/google-play-badge.svg"
                                alt="Google Play"
                                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                            <span className="text-[10px] font-semibold text-slate-400 mt-1.5 group-hover:text-slate-200">
                                Android Google Play
                            </span>
                        </a>

                        <a
                            href={appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/40 transition-all text-center no-underline"
                        >
                            <img
                                src="/app-store-badge.svg"
                                alt="App Store"
                                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                            <span className="text-[10px] font-semibold text-slate-400 mt-1.5 group-hover:text-slate-200">
                                iOS Apple App Store
                            </span>
                        </a>
                    </div>
                </motion.div>

                {/* Tutorial Walkthrough Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800/90 backdrop-blur-md relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                <Play size={16} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-white">Watch How It Works</h3>
                                <p className="text-[11px] text-slate-400">Quick 2-minute product walkthrough</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                            HD Video
                        </span>
                    </div>

                    {/* Video Player or Interactive Preview */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 group shadow-lg">
                        {showVideoModal ? (
                            <iframe
                                src={videoEmbedUrl}
                                title="LearnProof AI Demo Video"
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div
                                onClick={() => setShowVideoModal(true)}
                                className="relative w-full h-full cursor-pointer overflow-hidden flex items-center justify-center"
                            >
                                <img
                                    src="/yt_demo_thumbnail.jpg"
                                    alt="Demo Video Thumbnail"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://img.youtube.com/vi/07L9iG0th_s/maxresdefault.jpg";
                                    }}
                                />
                                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />
                                <div className="absolute w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-active:scale-95 transition-all">
                                    <Play size={22} className="ml-1" fill="white" />
                                </div>
                                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/90 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                    <span className="font-semibold truncate">LearnProof AI Feature Walkthrough</span>
                                    <span className="text-[10px] font-bold text-orange-400 shrink-0 ml-2">Tap to Play</span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Explore Links Hub (Visiting / Linktree Directory) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Explore & Connect
                        </h2>
                        <span className="text-[11px] text-slate-500">All Official Channels</span>
                    </div>

                    <div className="space-y-2.5">
                        {primaryLinks.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                                <motion.a
                                    key={item.title}
                                    href={item.url}
                                    target={item.isExternal ? "_blank" : undefined}
                                    rel={item.isExternal ? "noopener noreferrer" : undefined}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    onClick={(e) => {
                                        if (!item.isExternal) {
                                            e.preventDefault();
                                            navigate(item.url);
                                        }
                                    }}
                                    className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/90 transition-all text-left no-underline ${item.glow}`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:text-orange-400 group-hover:scale-105 transition-all shrink-0">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors truncate">
                                                    {item.title}
                                                </h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate mt-0.5 font-normal">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <ArrowUpRight size={18} className="text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
                                </motion.a>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Message / Send Inquiry Box */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl p-5 sm:p-6 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Send size={15} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-white">Send A Quick Note</h3>
                            <p className="text-[11px] text-slate-400">Got a question or want to partner? Drop us a line.</p>
                        </div>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-3 mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                                type="text"
                                required
                                placeholder="Your Name"
                                value={contactForm.name}
                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-orange-500 outline-none text-xs text-white placeholder-slate-500 transition-colors"
                            />
                            <input
                                type="email"
                                required
                                placeholder="Your Email / Phone"
                                value={contactForm.email}
                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-orange-500 outline-none text-xs text-white placeholder-slate-500 transition-colors"
                            />
                        </div>

                        <textarea
                            rows={3}
                            required
                            placeholder="How can we help you? (Partnership, campus tie-up, feedback...)"
                            value={contactForm.message}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-orange-500 outline-none text-xs text-white placeholder-slate-500 resize-none transition-colors"
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Send size={13} />
                            <span>Send Message via Email</span>
                        </button>
                    </form>
                </motion.div>

                {/* Founders Section */}
                <div className="rounded-3xl p-5 bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <HeartHandshake size={15} className="text-orange-400" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Founders & Leadership</h4>
                        </div>
                        <span className="text-[10px] text-slate-500">Connect on LinkedIn</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {founders.map((founder) => (
                            <a
                                key={founder.name}
                                href={founder.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-left no-underline"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow shrink-0">
                                        {founder.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-xs text-white group-hover:text-orange-400 transition-colors truncate">
                                            {founder.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                            {founder.role}
                                        </p>
                                    </div>
                                </div>
                                <ArrowUpRight size={14} className="text-slate-500 group-hover:text-orange-400 shrink-0 ml-1.5" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer Brand Seal */}
                <footer className="pt-4 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <span>© {new Date().getFullYear()} LearnProof AI</span>
                        <span>•</span>
                        <a href="https://learnproofai.com" className="text-slate-400 hover:text-orange-400 transition-colors">learnproofai.com</a>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                        <button onClick={() => navigate('/privacy-policy')} className="hover:text-slate-300 cursor-pointer bg-transparent border-0 text-slate-500">Privacy Policy</button>
                        <span>•</span>
                        <button onClick={() => navigate('/terms')} className="hover:text-slate-300 cursor-pointer bg-transparent border-0 text-slate-500">Terms of Service</button>
                        <span>•</span>
                        <button onClick={() => navigate('/support')} className="hover:text-slate-300 cursor-pointer bg-transparent border-0 text-slate-500">Support Desk</button>
                    </div>
                </footer>
            </main>

            {/* QR Code Modal (for in-person scanning or displaying) */}
            <AnimatePresence>
                {showQrModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowQrModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-center shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
                                <QrCode size={13} />
                                <span>Scan to Open Digital Card</span>
                            </div>

                            <h3 className="font-extrabold text-lg text-white mb-1">LearnProof AI</h3>
                            <p className="text-xs text-slate-400 mb-5">
                                Scan with any mobile camera to view our visiting card & links.
                            </p>

                            {/* Crisp SVG QR Code generated with QR Server API with fallback */}
                            <div className="p-4 bg-white rounded-2xl mx-auto w-fit shadow-xl">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&color=0-0-0&data=${encodeURIComponent(pageUrl)}`}
                                    alt="LearnProof AI Visiting Card QR Code"
                                    className="w-48 h-48 object-contain"
                                />
                            </div>

                            <p className="text-[11px] text-slate-400 mt-4 break-all font-mono">
                                {pageUrl}
                            </p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    onClick={() => handleCopy(pageUrl, 'link')}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    <span>{copiedLink ? "Copied" : "Copy URL"}</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Share2 size={14} />
                                    <span>Share Link</span>
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
