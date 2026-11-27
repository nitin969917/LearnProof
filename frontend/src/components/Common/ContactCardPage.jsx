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
    PhoneCall,
    Briefcase,
    Building2,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { founders } from './founders';

// Official WhatsApp Brand Vector Icon
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
        document.title = "LearnProof AI Private Limited | Corporate Connect";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute(
                "content",
                "LearnProof AI Private Limited - Executive contact card, founders connect, ecosystem links, and product overview."
            );
        }
    }, []);

    const appStoreUrl = "https://apps.apple.com/app/learnproof-ai/id6815305441";
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa";
    const videoEmbedUrl = "https://www.youtube.com/embed/07L9iG0th_s?autoplay=1&rel=0&playsinline=1";
    const youtubeVideoLink = "https://www.youtube.com/watch?v=07L9iG0th_s";
    const pageUrl = typeof window !== 'undefined' ? window.location.href : "https://learnproofai.com/contact";

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
                    title: "LearnProof AI Private Limited",
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

    // Founders with individual contact numbers and WhatsApp
    const leadership = founders;

    const channels = [
        {
            name: "Web Platform",
            url: "https://learnproofai.com",
            isExternal: true,
            icon: Globe
        },
        {
            name: "LinkedIn",
            url: "https://www.linkedin.com/company/learnproof-ai/",
            isExternal: true,
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            )
        },
        {
            name: "Instagram",
            url: "https://instagram.com/learnproofai",
            isExternal: true,
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
            )
        },
        {
            name: "YouTube",
            url: "https://youtube.com/@LearnProof_AI",
            isExternal: true,
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-6 sm:py-10 px-4 sm:px-6 flex flex-col justify-center items-center selection:bg-orange-100 font-sans">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            {/* Desktop Centered Content Wrapper */}
            <div className="relative z-10 w-full max-w-4xl mx-auto my-auto flex flex-col justify-center">
                {/* Main Balanced Card (Executive Desktop 2-Panel & Native Mobile Flow) */}
                <main className="w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/5 overflow-hidden"
                    >
                    {/* Top Accent Stripe */}
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        
                        {/* LEFT PANEL: Identity & Direct Leadership Contacts */}
                        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                            
                            {/* Company Branding */}
                            <div>
                                <div className="flex items-center gap-3.5 mb-4">
                                    <div className="relative w-14 h-14 shrink-0">
                                        <img
                                            src="/LP_M_logo.png"
                                            alt="LearnProof AI"
                                            className="w-14 h-14 rounded-2xl object-contain border border-slate-100 shadow-sm bg-white"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border border-white shadow-xs" title="Verified Entity">
                                            <ShieldCheck size={12} />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                                            LearnProof AI
                                        </h1>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                            LearnProof AI Private Limited
                                        </p>
                                    </div>
                                </div>

                                {/* 2-Line Investor Value Proposition */}
                                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                    AI-native academic infrastructure transforming open educational video into structured mastery, interactive coding, and verified credentials.
                                </p>
                            </div>

                            {/* Direct Leadership Contacts with Individual Phone, WhatsApp, and LinkedIn */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Leadership & Founders
                                    </span>
                                    <span className="text-[10px] text-slate-400">Direct Contact</span>
                                </div>

                                <div className="space-y-2.5">
                                    {leadership.map((person) => (
                                        <div
                                            key={person.name}
                                            className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all text-left"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                        {person.initials}
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={() => navigate(person.path)}
                                                            className="font-bold text-xs text-slate-900 hover:text-orange-600 leading-none p-0 bg-transparent border-0 cursor-pointer text-left"
                                                            title={`View ${person.name}'s contact page`}
                                                        >
                                                            {person.name}
                                                        </button>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                                            {person.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                <a
                                                    href={person.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 no-underline"
                                                    title="LinkedIn Profile"
                                                >
                                                    <span>LinkedIn</span>
                                                    <ArrowUpRight size={12} />
                                                </a>
                                            </div>

                                            {/* Action Pills for this Founder (Call + WhatsApp) */}
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60">
                                                <a
                                                    href={`tel:${person.phone.replace(/\s+/g, '')}`}
                                                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px] no-underline transition"
                                                >
                                                    <PhoneCall size={12} className="text-slate-500" />
                                                    <span>{person.phone}</span>
                                                </a>

                                                <a
                                                    href={`https://wa.me/${person.cleanPhone}?text=Hello%20${encodeURIComponent(person.name)}%2C%20I%20got%20your%20contact%20from%20your%20visiting%20card.`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-bold text-[11px] no-underline transition"
                                                >
                                                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                                                    <span>WhatsApp</span>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Corporate Desk Strip */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <button
                                    onClick={() => handleCopy("hello@learnproofai.com", "email")}
                                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-0 text-slate-600 font-medium"
                                >
                                    {copiedEmail ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    <span>hello@learnproofai.com</span>
                                </button>

                                <a
                                    href="mailto:founder@learnproofai.com?subject=Investor%20%2F%20Partner%20Inquiry%3A%20LearnProof%20AI"
                                    className="font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 no-underline"
                                >
                                    <span>Investor Desk</span>
                                    <ArrowUpRight size={12} />
                                </a>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Product Walkthrough Link, App Ecosystem & Verified Channels */}
                        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-slate-50/40">
                            
                            {/* 1. Sleek Walkthrough Link (Replaces Direct Embedded Video) */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Product Architecture
                                    </span>
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded-full">
                                        1-Min Tour
                                    </span>
                                </div>

                                <div
                                    onClick={() => setShowVideoModal(true)}
                                    className="group p-3 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500 group-hover:bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                            <Play size={18} className="ml-0.5 fill-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                Watch 1-Minute Walkthrough
                                            </h4>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                See AI Intuition, coding IDE & verified credentials in action
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-orange-50 text-[10px] font-bold text-slate-700 group-hover:text-orange-600 shrink-0 transition-colors">
                                        Watch Video
                                    </span>
                                </div>
                            </div>

                            {/* 2. Application Ecosystem */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Application Ecosystem
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Live
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                                    <div className="grid grid-cols-2 gap-2">
                                        <a
                                            href={playStoreUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition no-underline"
                                        >
                                            <img
                                                src="/google-play-badge.svg"
                                                alt="Play Store"
                                                className="h-8 w-auto object-contain"
                                            />
                                        </a>

                                        <a
                                            href={appStoreUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition no-underline"
                                        >
                                            <img
                                                src="/app-store-badge.svg"
                                                alt="App Store"
                                                className="h-8 w-auto object-contain"
                                            />
                                        </a>
                                    </div>

                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Desktop: macOS (.dmg) & Windows (.exe)</span>
                                        <button
                                            onClick={() => navigate('/download')}
                                            className="font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                        >
                                            <span>Download</span>
                                            <ArrowUpRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Verified Channels Pill Strip */}
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                                    Official Channels
                                </span>

                                <div className="grid grid-cols-2 gap-2">
                                    {channels.map((ch) => {
                                        const IconComp = ch.icon;
                                        return (
                                            <a
                                                key={ch.name}
                                                href={ch.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-between p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition text-xs font-semibold text-slate-800 no-underline"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <IconComp className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-600 transition-colors" />
                                                    <span className="group-hover:text-orange-600 transition-colors">{ch.name}</span>
                                                </div>
                                                <ArrowUpRight size={12} className="text-slate-400 group-hover:text-slate-700" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

                {/* Corporate Footer */}
                <footer className="w-full text-center mt-6 text-[11px] text-slate-400 space-y-1">
                    <p>© {new Date().getFullYear()} LearnProof AI Private Limited • All rights reserved.</p>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <button onClick={() => navigate('/privacy-policy')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Privacy Policy</button>
                        <span>•</span>
                        <button onClick={() => navigate('/terms')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Terms of Service</button>
                        <span>•</span>
                        <button onClick={() => navigate('/support')} className="hover:text-slate-600 cursor-pointer bg-transparent border-0 text-slate-400">Support Desk</button>
                    </div>
                </footer>
            </div>

            {/* Video Walkthrough Modal */}
            <AnimatePresence>
                {showVideoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                        onClick={() => setShowVideoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
                                <span className="font-bold text-xs">LearnProof AI Platform Walkthrough</span>
                                <button
                                    onClick={() => setShowVideoModal(false)}
                                    className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer bg-transparent border-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="aspect-video w-full bg-black">
                                <iframe
                                    src={videoEmbedUrl}
                                    title="LearnProof AI Walkthrough"
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
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
