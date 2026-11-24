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
    Sparkles,
    ShieldCheck,
    QrCode,
    X,
    Send,
    Award,
    BookOpen,
    Code2,
    Users,
    ArrowUpRight,
    ArrowLeft,
    PhoneCall,
    HeartHandshake
} from 'lucide-react';
import toast from 'react-hot-toast';

// Official WhatsApp Brand SVG Icon
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
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
        document.title = "LearnProof AI | Official Digital Visiting Card & Links";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content", "Official digital visiting card for LearnProof AI. Download our Android & iOS apps, explore our courses, watch our walkthrough, and connect with us.");
        }
    }, []);

    const appStoreUrl = "https://apps.apple.com/app/learnproof-ai/id6815305441";
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa";
    const videoEmbedUrl = "https://www.youtube.com/embed/07L9iG0th_s?autoplay=1&rel=0&playsinline=1";
    const pageUrl = typeof window !== 'undefined' ? window.location.href : "https://learnproofai.com/contact";
    const whatsappUrl = "https://wa.me/919699176009?text=Hi%20LearnProof%20AI%2C%20I%20scanned%20your%20visiting%20card%20and%20wanted%20to%20connect!";

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

    // Quick Message Form Submission
    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const subject = encodeURIComponent(`Inquiry from Visiting Card: ${contactForm.name}`);
        const body = encodeURIComponent(
            `Name: ${contactForm.name}\n` +
            `Email/Phone: ${contactForm.email}\n\n` +
            `Message:\n${contactForm.message}`
        );
        window.location.href = `mailto:hello@learnproofai.com?subject=${subject}&body=${body}`;
        setIsSubmitting(false);
        toast.success("Opening your email client...");
    };

    const primaryLinks = [
        {
            title: "Official Web Platform",
            desc: "Explore courses, interactive roadmaps & exercises",
            icon: Globe,
            url: "https://learnproofai.com",
            isExternal: true,
            badge: "Visit Website",
            badgeColor: "bg-orange-50 text-orange-600 border-orange-200"
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
            badge: "Follow Us",
            badgeColor: "bg-pink-50 text-pink-600 border-pink-200"
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
            badgeColor: "bg-red-50 text-red-600 border-red-200"
        },
        {
            title: "LinkedIn Company",
            desc: "LearnProof AI • Company updates, insights & careers",
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            ),
            url: "https://www.linkedin.com/company/learnproof-ai/",
            isExternal: true,
            badge: "Connect",
            badgeColor: "bg-blue-50 text-blue-600 border-blue-200"
        },
        {
            title: "Campus Ambassador Program",
            desc: "Lead student learning on your campus & earn rewards",
            icon: Users,
            url: "/ambassador",
            isExternal: false,
            badge: "Join Cohort",
            badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
        },
        {
            title: "Desktop App",
            desc: "Available for macOS (.dmg) & Windows (.exe)",
            icon: Download,
            url: "/download",
            isExternal: false,
            badge: "PC & Mac",
            badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
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
        <div className="min-h-screen bg-orange-50/70 text-gray-900 relative overflow-x-hidden selection:bg-orange-200 font-sans">
            {/* Background Texture & Ambient Warm Gradients (Matching Landing & Download Pages) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(#f97316 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
                />
                <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-orange-200 via-amber-100 to-transparent rounded-full blur-[100px] opacity-60 -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[90px] opacity-50 -translate-x-1/4" />
            </div>

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 hover:bg-white border border-orange-200/80 text-xs font-bold text-gray-700 hover:text-orange-600 transition-all shadow-sm backdrop-blur-md cursor-pointer group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Website</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 hover:bg-white border border-orange-200/80 text-xs font-bold text-gray-700 hover:text-orange-600 transition-all shadow-sm backdrop-blur-md cursor-pointer"
                        title="Display Visiting QR Code"
                    >
                        <QrCode size={15} />
                        <span className="hidden sm:inline">QR Code</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                    >
                        {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                        <span>{copiedLink ? "Copied!" : "Share"}</span>
                    </button>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">
                
                {/* 2-Column Responsive Grid on Desktop, Single Column on Mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    
                    {/* LEFT COLUMN: Digital Visiting Card Identity & Primary Actions */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* Main Identity Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white/90 backdrop-blur-xl border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5 text-center relative overflow-hidden"
                        >
                            {/* Subtle top sunset line */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-red-500 to-amber-400" />

                            {/* Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-extrabold tracking-wide mb-5 shadow-xs">
                                <Sparkles size={12} className="text-orange-500 animate-pulse" />
                                <span>OFFICIAL VISITING CARD</span>
                            </div>

                            {/* Mobile Logo (LP_M_logo.png) */}
                            <div className="relative mx-auto w-24 h-24 mb-4">
                                <div className="absolute inset-0 rounded-2xl bg-orange-400/25 blur-lg" />
                                <div className="relative w-24 h-24 rounded-2xl bg-white border-2 border-orange-100 p-2 shadow-lg flex items-center justify-center overflow-hidden">
                                    <img
                                        src="/LP_M_logo.png"
                                        alt="LearnProof AI Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md border-2 border-white" title="Verified Brand">
                                    <ShieldCheck size={15} />
                                </div>
                            </div>

                            {/* Name & Tagline */}
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                LearnProof AI
                            </h1>
                            <p className="text-orange-600 text-xs sm:text-sm font-bold mt-1">
                                Turn YouTube Into Your Personal University
                            </p>
                            <p className="text-gray-600 text-xs mt-2.5 max-w-xs mx-auto leading-relaxed font-normal">
                                Master any skill with AI Video Intuition, solve auto-generated progressive quizzes, code hands-on, and earn verifiable certificates.
                            </p>

                            {/* Feature Pills */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50/80 border border-orange-200 text-[11px] font-semibold text-gray-700">
                                    <BookOpen size={12} className="text-orange-500" /> AI Video Notes
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] font-semibold text-gray-700">
                                    <Code2 size={12} className="text-amber-600" /> In-Browser IDE
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] font-semibold text-gray-700">
                                    <Award size={12} className="text-emerald-600" /> Verified Certs
                                </span>
                            </div>

                            {/* Prominent Action Buttons (WhatsApp + Email) */}
                            <div className="space-y-2.5 mt-6">
                                {/* Official WhatsApp Button */}
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 no-underline cursor-pointer"
                                >
                                    <WhatsAppIcon className="w-5 h-5" />
                                    <span>Chat on WhatsApp</span>
                                </a>

                                {/* Email Us Button */}
                                <a
                                    href="mailto:hello@learnproofai.com"
                                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition-all transform active:scale-95 no-underline cursor-pointer"
                                >
                                    <Mail size={18} />
                                    <span>Send Us an Email</span>
                                </a>
                            </div>

                            {/* Secondary Quick Contact Strip */}
                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-around text-xs text-gray-500 font-medium">
                                <button
                                    onClick={() => handleCopy("hello@learnproofai.com", "email")}
                                    className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors cursor-pointer bg-transparent border-0 text-gray-600 font-semibold"
                                >
                                    {copiedEmail ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    <span>{copiedEmail ? "Copied Email" : "Copy Email"}</span>
                                </button>

                                <span className="text-gray-300">•</span>

                                <a
                                    href="tel:+919699176009"
                                    className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors no-underline text-gray-600 font-semibold"
                                >
                                    <PhoneCall size={14} className="text-orange-500" />
                                    <span>+91 96991 76009</span>
                                </a>
                            </div>
                        </motion.div>

                        {/* Founders Card */}
                        <div className="bg-white/80 backdrop-blur-md border border-orange-200/70 rounded-3xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <HeartHandshake size={16} className="text-orange-500" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
                                        Leadership & Founders
                                    </h3>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">Connect on LinkedIn</span>
                            </div>

                            <div className="space-y-2">
                                {founders.map((founder) => (
                                    <a
                                        key={founder.name}
                                        href={founder.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between p-3 rounded-2xl bg-orange-50/50 hover:bg-orange-100/60 border border-orange-100 transition-all text-left no-underline"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                                {founder.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                                    {founder.name}
                                                </p>
                                                <p className="text-[11px] text-gray-500 truncate">
                                                    {founder.role}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={15} className="text-gray-400 group-hover:text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1.5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Mobile Apps, Video Demo & Explore Links */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Mobile Apps Store Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-white/90 backdrop-blur-xl border border-orange-200/80 rounded-3xl p-6 shadow-xl shadow-orange-500/5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs shrink-0">
                                        <Smartphone size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-gray-900">Get The LearnProof App</h3>
                                        <p className="text-xs text-gray-500">Available on iOS & Android for focused study</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black tracking-wide shrink-0">
                                    Live on Stores
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <a
                                    href={playStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-orange-50/40 hover:bg-white border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all text-center no-underline"
                                >
                                    <img
                                        src="/google-play-badge.svg"
                                        alt="Get it on Google Play"
                                        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600 mt-1.5 group-hover:text-orange-600">
                                        Android Play Store
                                    </span>
                                </a>

                                <a
                                    href={appStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-orange-50/40 hover:bg-white border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all text-center no-underline"
                                >
                                    <img
                                        src="/app-store-badge.svg"
                                        alt="Download on the App Store"
                                        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600 mt-1.5 group-hover:text-orange-600">
                                        iOS Apple App Store
                                    </span>
                                </a>
                            </div>

                            <div className="mt-3.5 pt-3 border-t border-orange-100/60 flex items-center justify-between text-xs">
                                <span className="text-gray-500">Studying on laptop or Mac?</span>
                                <button
                                    onClick={() => navigate('/download')}
                                    className="font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 cursor-pointer bg-transparent border-0"
                                >
                                    <span>Download Desktop App</span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Video Walkthrough Demo */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                            className="bg-white/90 backdrop-blur-xl border border-orange-200/80 rounded-3xl p-6 shadow-xl shadow-orange-500/5"
                        >
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-xs shrink-0">
                                        <Play size={18} className="ml-0.5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-gray-900">Watch How It Works</h3>
                                        <p className="text-xs text-gray-500">1-Minute interactive walkthrough</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100/70 border border-orange-200 px-2.5 py-1 rounded-full">
                                    HD Demo
                                </span>
                            </div>

                            {/* Responsive 16:9 Video Embed / Poster */}
                            <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-900 border border-orange-100 shadow-md group">
                                {showVideoModal ? (
                                    <iframe
                                        src={videoEmbedUrl}
                                        title="LearnProof AI Demo Walkthrough"
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
                                            alt="Video Walkthrough Thumbnail"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://img.youtube.com/vi/07L9iG0th_s/maxresdefault.jpg";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gray-900/35 group-hover:bg-gray-900/20 transition-colors" />
                                        <div className="absolute w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-active:scale-95 transition-all">
                                            <Play size={22} className="ml-1" fill="white" />
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white bg-gray-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                                            <span className="font-bold truncate">LearnProof AI Platform Walkthrough</span>
                                            <span className="text-[11px] font-bold text-orange-400 shrink-0 ml-2">Click to Play</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Explore & Connect Links Hub */}
                        <div className="bg-white/90 backdrop-blur-xl border border-orange-200/80 rounded-3xl p-6 shadow-xl shadow-orange-500/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-base text-gray-900">Explore & Connect</h3>
                                <span className="text-[11px] font-bold text-gray-500">Official Channels</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {primaryLinks.map((item) => {
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
                                            className="group flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/40 hover:bg-orange-100/50 border border-orange-100/90 hover:border-orange-200 transition-all text-left no-underline cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-orange-200/70 shadow-xs flex items-center justify-center text-orange-600 group-hover:scale-105 transition-all shrink-0">
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-xs text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowUpRight size={16} className="text-gray-400 group-hover:text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1.5" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Inquiry Form */}
                        <div className="bg-white/90 backdrop-blur-xl border border-orange-200/80 rounded-3xl p-6 shadow-xl shadow-orange-500/5">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs shrink-0">
                                    <Send size={15} />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm sm:text-base text-gray-900">Send A Quick Note</h3>
                                    <p className="text-xs text-gray-500">Interested in partnerships, campus tie-ups, or have a query?</p>
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-2.5 mt-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Your Name"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/50 border border-orange-200/80 focus:border-orange-500 focus:bg-white outline-none text-xs text-gray-900 placeholder-gray-400 transition-all"
                                    />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Email or Phone"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/50 border border-orange-200/80 focus:border-orange-500 focus:bg-white outline-none text-xs text-gray-900 placeholder-gray-400 transition-all"
                                    />
                                </div>

                                <textarea
                                    rows={3}
                                    required
                                    placeholder="Write your message..."
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-orange-50/50 border border-orange-200/80 focus:border-orange-500 focus:bg-white outline-none text-xs text-gray-900 placeholder-gray-400 resize-none transition-all"
                                />

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Send size={13} />
                                    <span>Send Message via Email</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Footer Brand Seal */}
                <footer className="mt-12 text-center space-y-3 pt-6 border-t border-orange-200/60">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                        <span>© {new Date().getFullYear()} LearnProof AI</span>
                        <span>•</span>
                        <a href="https://learnproofai.com" className="text-gray-600 hover:text-orange-600 font-bold transition-colors">learnproofai.com</a>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500 font-medium">
                        <button onClick={() => navigate('/privacy-policy')} className="hover:text-orange-600 cursor-pointer bg-transparent border-0 text-gray-500">Privacy Policy</button>
                        <span>•</span>
                        <button onClick={() => navigate('/terms')} className="hover:text-orange-600 cursor-pointer bg-transparent border-0 text-gray-500">Terms of Service</button>
                        <span>•</span>
                        <button onClick={() => navigate('/support')} className="hover:text-orange-600 cursor-pointer bg-transparent border-0 text-gray-500">Support Desk</button>
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setShowQrModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl bg-white border border-orange-200 p-6 text-center shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold mb-3">
                                <QrCode size={13} />
                                <span>Scan to Open Digital Card</span>
                            </div>

                            <h3 className="font-black text-lg text-gray-900 mb-1">LearnProof AI</h3>
                            <p className="text-xs text-gray-500 mb-5">
                                Scan with any mobile camera to view visiting card & links.
                            </p>

                            <div className="p-4 bg-orange-50/50 rounded-2xl mx-auto w-fit border border-orange-100 shadow-sm">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&color=0-0-0&data=${encodeURIComponent(pageUrl)}`}
                                    alt="LearnProof AI Visiting Card QR Code"
                                    className="w-48 h-48 object-contain rounded-lg"
                                />
                            </div>

                            <p className="text-[11px] text-gray-500 mt-4 break-all font-mono">
                                {pageUrl}
                            </p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    onClick={() => handleCopy(pageUrl, 'link')}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    <span>{copiedLink ? "Copied" : "Copy URL"}</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20"
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
