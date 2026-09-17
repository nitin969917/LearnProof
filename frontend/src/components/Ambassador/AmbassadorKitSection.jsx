import React, { useState } from 'react';
import { Sparkles, Copy, Check, Share2, Download, MessageCircle, Linkedin, Instagram, Presentation, QrCode, FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AmbassadorKitSection({
    referralData,
    shareUrl
}) {
    const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp', 'instagram', 'linkedin', 'offline', 'campus'
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Template copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2500);
    };

    const handleDirectShare = (platform, text) => {
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(shareUrl);
        let url = '';

        if (platform === 'whatsapp') {
            url = `https://api.whatsapp.com/send?text=${encodedText}`;
        } else if (platform === 'linkedin') {
            url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        } else if (platform === 'telegram') {
            url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        } else if (platform === 'twitter') {
            url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        }

        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareUrl)}`;

    const kitData = {
        whatsapp: [
            {
                id: 'wa-group',
                title: 'College Class WhatsApp Group',
                subtitle: 'High conversion for exam prep & semesters',
                badge: 'Recommended 🚀',
                text: `Hey everyone! 👋 Exam prep & YouTube courses getting messy? Stop studying alone and check out LearnProof AI 🚀\n\n✨ 100% Free for our college:\n1️⃣ Turn ANY YouTube course or lecture into organized notes & flashcards instantly.\n2️⃣ Pass quick milestone quizzes & claim verified certificates for your LinkedIn!\n3️⃣ Join 24/7 Live Rooms to study & practice languages with peers.\n\n👉 Join through our campus link: ${shareUrl}`
            },
            {
                id: 'wa-dm',
                title: 'Personal DM to Classmate / Study Buddy',
                subtitle: 'Direct 1-on-1 recommendation',
                badge: 'High Trust 🤝',
                text: `Hey! Thought this would be super helpful for your prep: check out LearnProof AI. It lets you paste any YouTube video and instantly generates clean chapter notes and quizzes so you don't have to write everything by hand.\n\nTry it free here: ${shareUrl}`
            },
            {
                id: 'wa-status',
                title: 'WhatsApp Status / Story Caption',
                subtitle: 'Short & punchy status update',
                badge: 'Broad Reach 📲',
                text: `Turn your free YouTube watching into real proof of learning + certificates 🎓✨ Check LearnProof AI (Free): ${shareUrl}`
            }
        ],
        instagram: [
            {
                id: 'ig-story',
                title: 'Instagram Story Template',
                subtitle: 'With link sticker placement',
                badge: 'Story Sticker 📸',
                text: `POV: You stopped taking manual notes from YouTube lectures and let LearnProof AI summarize and quiz you automatically 🤯📚\n\nDrop in for free with my link sticker! 🔗 ${shareUrl}`
            },
            {
                id: 'ig-reel',
                title: 'Instagram Reel / Short Video Hook',
                subtitle: '30-second script for campus creators',
                badge: 'Viral Hook 🎬',
                text: `Script:\n"If you're a college student watching coding or DSA tutorials on YouTube, you need this free tool. LearnProof AI converts the entire playlist into organized chapter notes, practice quizzes, and verifiable certificates. Link in bio/comments!"\n\nLink: ${shareUrl}`
            },
            {
                id: 'ig-post',
                title: 'Feed Post Caption',
                subtitle: 'Structured post for student communities',
                badge: 'Community 💬',
                text: `Study smarter, not harder. Proud to represent LearnProof AI on our campus! 🎓\n\nGet automated AI notes, peer study rooms, and verified certificates from your favorite YouTube courses. Link in bio! 🚀\n\n#LearnProof #CollegeAmbassador #StudyGram #AItools`
            }
        ],
        linkedin: [
            {
                id: 'li-post',
                title: 'Personal Ambassador Announcement',
                subtitle: 'Professional announcement for your network',
                badge: 'Professional 💼',
                text: `I'm thrilled to share that I've joined LearnProof AI as a Campus Ambassador! 🎓🚀\n\nSelf-directed learning through YouTube is powerful, but accountability and credential validation have always been missing. LearnProof bridges that gap:\n• AI-generated structured notes and flashcards from video lectures\n• Real-time collaborative voice study rooms\n• Verifiable skill certificates to validate your self-taught capabilities\n\nEmpower your daily learning journey today (100% Free): ${shareUrl}\n\n#LearnProof #EdTech #AI #CollegeAmbassador #Students`
            },
            {
                id: 'li-opp',
                title: 'Skill-Building & Upskilling Post',
                subtitle: 'Focusing on placement prep and technical projects',
                badge: 'Career Focus 🎯',
                text: `Building technical depth for campus placements? 💡\n\nRather than passively watching 50 hours of web dev or ML tutorials, LearnProof AI tests your comprehension through AI quizzes and issues shareable proof certificates.\n\nTry it free today: ${shareUrl}\n\n#PlacementPrep #CareerGrowth #TechSkills #LearnProof`
            }
        ],
        offline: [
            {
                id: 'off-qr',
                title: 'Printable Campus QR Poster',
                subtitle: 'Stick on college notice boards, labs & canteens',
                badge: 'Print Ready 🖨️',
                isQr: true,
                text: `Scan to access LearnProof AI with our college pass: ${shareUrl}`
            },
            {
                id: 'off-speech',
                title: '1-Minute Classroom Announcement Speech',
                subtitle: 'Speak in front of class before lectures start',
                badge: 'High Impact 🎤',
                text: `"Good morning everyone! Just taking 60 seconds — if you're preparing for upcoming exams or learning tech from YouTube, check out LearnProof AI. It turns any YouTube playlist into chapter notes and practice quizzes so you save hours of note-taking. It's completely free for our college students, check the class group for the link!"`
            }
        ],
        campus: [
            {
                id: 'camp-pitch',
                title: '2-Minute Club Collaboration Pitch',
                subtitle: 'Present to college coding clubs & student bodies',
                badge: 'Partnership 🤝',
                text: `Pitch outline:\n1. Hook: Our club members spend hours learning from YouTube without structured retention or proof.\n2. Solution: LearnProof AI partners with our club to provide AI-generated notes, live study rooms, and verifiable completion certificates.\n3. Offer: Free student access + club co-branding opportunities for our upcoming tech events.\n\nLearnProof Portal: ${shareUrl}`
            },
            {
                id: 'camp-deck',
                title: 'College Session Slide Deck Outline',
                subtitle: 'Ready presentation agenda for student workshops',
                badge: 'Workshop Deck 📊',
                text: `Slide Agenda:\nSlide 1: The Problem with Passive Video Learning\nSlide 2: Active Recall & Spaced Repetition in 2026\nSlide 3: Live Demo — Turning a YouTube Playlist into AI Notes in 10 Seconds\nSlide 4: Real-time Quizzes & Earning LinkedIn Credentials\nSlide 5: Live Rooms — Group Focus & Speaking Practice\nSlide 6: Q&A & Free Student Access Link: ${shareUrl}`
            }
        ]
    };

    const tabs = [
        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
        { id: 'instagram', label: 'Instagram', icon: <Instagram size={16} /> },
        { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} /> },
        { id: 'offline', label: 'Offline & QR', icon: <QrCode size={16} /> },
        { id: 'campus', label: 'Campus & Decks', icon: <Presentation size={16} /> }
    ];

    return (
        <section id="ambassador-kit" className="space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 mb-2">
                            <Sparkles size={14} className="text-orange-500" />
                            Multi-Channel Growth Engine
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            📣 Ambassador Kit
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Ready-to-use promotional assets, copy templates, classroom scripts, and QR posters.
                        </p>
                    </div>
                </div>

                {/* Platform Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar mt-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer
                                ${activeTab === tab.id
                                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                                }
                            `}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kitData[activeTab]?.map(item => {
                        const isCopied = copiedId === item.id;

                        if (item.isQr) {
                            return (
                                <div key={item.id} className="p-5 rounded-3xl border border-gray-200 bg-gray-50 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                                                {item.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-gray-900">{item.title}</h3>
                                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-3">
                                        <img src={qrDownloadUrl} alt="Campus QR Code" className="w-36 h-36 object-contain rounded-lg" />
                                        <span className="text-[11px] font-mono text-gray-500 font-bold">
                                            Ref: {referralData?.referralCode}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={qrDownloadUrl}
                                            download={`LearnProof_${referralData?.referralCode}_QR.png`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition"
                                        >
                                            <Download size={14} />
                                            <span>Download QR</span>
                                        </a>
                                        <button
                                            onClick={() => handleCopy(item.id, shareUrl)}
                                            className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition cursor-pointer"
                                        >
                                            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={item.id} className="p-5 rounded-3xl border border-gray-200 bg-white flex flex-col justify-between space-y-4 hover:shadow-sm transition">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-gray-900 leading-tight">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.subtitle}</p>

                                    <div className="mt-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 font-mono text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                        {item.text}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => handleCopy(item.id, item.text)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                                    </button>

                                    {activeTab === 'whatsapp' && (
                                        <button
                                            onClick={() => handleDirectShare('whatsapp', item.text)}
                                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                                            title="Share directly to WhatsApp"
                                        >
                                            <Share2 size={14} />
                                        </button>
                                    )}

                                    {activeTab === 'linkedin' && (
                                        <button
                                            onClick={() => handleDirectShare('linkedin', item.text)}
                                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition cursor-pointer flex items-center gap-1"
                                            title="Share to LinkedIn"
                                        >
                                            <Share2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
