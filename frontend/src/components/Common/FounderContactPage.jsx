import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    ArrowUpRight,
    Globe,
    Mail,
    MessageCircle,
    Phone,
    Presentation,
    Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { companyLinks, founders, getFounder } from './founders';

const COMPANY = 'LearnProof AI Private Limited';

const whatsappLink = (person) =>
    `https://wa.me/${person.cleanPhone}?text=${encodeURIComponent(`Hello ${person.name}, I got your contact from LearnProof AI.`)}`;

const telLink = (person) => `tel:${person.phone.replace(/\s+/g, '')}`;

const GooglePlayIcon = ({ className = 'w-[18px] h-[20px]' }) => (
    <svg className={className} viewBox="0 0 256 283" aria-hidden="true">
        <path fill="#ea4335" d="M119.553 134.916L1.06 259.061a32.14 32.14 0 0 0 47.062 19.071l133.327-75.934z" />
        <path fill="#fbbc04" d="M239.37 113.814L181.715 80.79l-64.898 56.95l65.162 64.28l57.216-32.67a31.345 31.345 0 0 0 0-55.537z" />
        <path fill="#4285f4" d="M1.06 23.487A30.6 30.6 0 0 0 0 31.61v219.327a32.3 32.3 0 0 0 1.06 8.124l122.555-120.966z" />
        <path fill="#34a853" d="m120.436 141.274l61.278-60.483L48.564 4.503A32.85 32.85 0 0 0 32.051 0C17.644-.028 4.978 9.534 1.06 23.399z" />
    </svg>
);

const AppleIcon = ({ className = 'w-[16px] h-[20px]' }) => (
    <svg className={className} viewBox="0 0 256 315" aria-hidden="true">
        <path fill="#111827" d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262" />
    </svg>
);

const LinkedInIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 256 256" aria-hidden="true">
        <path fill="#0a66c2" d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4c-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.91 39.91 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186zM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009s9.851-22.014 22.008-22.016c12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97zM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453" />
    </svg>
);

const contactActions = (person) => [
    { label: 'Call', href: telLink(person), icon: Phone },
    { label: 'Email', href: `mailto:${person.email}`, icon: Mail },
    { label: 'Chat', href: whatsappLink(person), icon: MessageCircle, external: true },
];

// Full-width link row used for the main actions.
const LinkRow = ({ href, icon: Icon, title, subtitle, primary = false }) => {
    const external = href && /^https?:/.test(href);
    return (
        <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left no-underline cursor-pointer transition active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                primary
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white hover:border-orange-200 text-slate-900 border border-orange-100 shadow-sm shadow-orange-500/5'
            }`}
        >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${primary ? 'bg-white/20 text-white' : 'bg-slate-50 border border-slate-100'}`}>
                {React.isValidElement(Icon) ? Icon : <Icon size={18} strokeWidth={2.25} className={primary ? 'text-white' : 'text-orange-600'} />}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold leading-tight">{title}</span>
                <span className={`block text-[11px] mt-0.5 truncate ${primary ? 'text-white/80' : 'text-slate-500'}`}>{subtitle}</span>
            </span>
            <ArrowUpRight size={15} className={primary ? 'text-white/80' : 'text-slate-300'} />
        </a>
    );
};

const ActionButton = ({ href, icon: Icon, label, external, prominent = false }) => (
    <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`inline-flex items-center justify-center no-underline transition outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
            prominent
                ? 'flex-col gap-1.5 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold border border-orange-100'
                : 'gap-1.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold border border-orange-100'
        }`}
    >
        <Icon size={prominent ? 16 : 13} strokeWidth={2.25} />
        <span>{label}</span>
    </a>
);

const FounderAvatar = ({ person, large = false }) => {
    const [failed, setFailed] = useState(false);
    const frame = large
        ? 'w-[92px] h-[92px] border-4 border-white shadow-lg shadow-orange-500/10'
        : 'w-10 h-10';

    if (!person.avatar || failed) {
        return (
            <span className={`rounded-full bg-orange-500 text-white font-black flex items-center justify-center shrink-0 ${frame} ${large ? 'text-[26px]' : 'text-sm font-bold'}`}>
                {person.initials}
            </span>
        );
    }

    return (
        <img
            src={person.avatar}
            alt={person.name}
            onError={() => setFailed(true)}
            className={`rounded-full object-cover object-center shrink-0 bg-orange-50 ${frame}`}
        />
    );
};

// Small card with Call / Email / Chat, used for the other founder.
const PersonCard = ({ person, to }) => {
    const Header = to ? Link : 'div';
    return (
        <div className="p-3.5 rounded-2xl bg-white border border-orange-100 shadow-sm shadow-orange-500/5">
            <Header {...(to ? { to } : {})} className="flex items-center gap-3 no-underline outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-xl">
                <FounderAvatar person={person} />
                <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 leading-tight">{person.name}</span>
                    <span className="block text-[11px] font-semibold text-orange-500 mt-0.5">{person.role}</span>
                </span>
            </Header>
            <div className="grid grid-cols-3 gap-2 mt-3">
                {contactActions(person).map((action) => (
                    <ActionButton key={action.label} {...action} />
                ))}
            </div>
        </div>
    );
};

const FounderContactPage = ({ slug }) => {
    const person = getFounder(slug);

    useEffect(() => {
        if (!person) return;
        document.title = `${person.name} - ${person.role} | LearnProof AI`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', `${person.name}, ${person.role} at ${COMPANY}. ${person.bio}`);
        }
    }, [person]);

    if (!person) return null;

    const otherFounder = founders.find((f) => f.slug !== person.slug);
    const pageUrl = `${companyLinks.website}${person.path}`;
    const firstName = person.name.split(' ')[0];

    const share = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `${person.name} - ${COMPANY}`, text: person.bio, url: pageUrl });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(pageUrl);
            toast.success('Link copied to clipboard');
        } catch {
            toast.error('Could not copy link');
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF8F1] text-slate-900 font-sans selection:bg-orange-100 flex justify-center">
            <motion.main
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-md px-5 pt-12 pb-10"
            >
                <div className="text-center">
                    <div className="flex justify-center">
                        <FounderAvatar person={person} large />
                    </div>
                    <h1 className="mt-5 text-[26px] font-black tracking-tight text-slate-900">{person.name}</h1>
                    <p className="mt-1 text-sm font-bold text-orange-500">{person.role}</p>
                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        LearnProof AI · Private Limited
                    </p>
                    <p className="mt-4 text-sm text-slate-500 leading-relaxed">{person.bio}</p>
                </div>

                <div className="mt-6 rounded-2xl bg-white border border-orange-100 shadow-sm shadow-orange-500/5 p-2.5">
                    <div className="grid grid-cols-3 gap-2">
                        {contactActions(person).map((action) => (
                            <ActionButton key={action.label} {...action} prominent />
                        ))}
                    </div>
                    <p className="mt-2.5 mb-1 px-1 text-[11px] text-slate-500 text-center break-all">
                        {person.phone} · {person.email}
                    </p>
                </div>

                <div className="mt-6 space-y-2.5">
                    <LinkRow primary href={companyLinks.website} icon={Globe} title="Explore LearnProof AI" subtitle="Visit our official website" />
                    <LinkRow href={companyLinks.playStore} icon={<GooglePlayIcon />} title="Download Android App" subtitle="Google Play Store" />
                    <LinkRow href={companyLinks.appStore} icon={<AppleIcon />} title="Download iOS App" subtitle="Apple App Store" />
                    {companyLinks.pitchDeck && (
                        <LinkRow href={companyLinks.pitchDeck} icon={Presentation} title="Explore Our Pitch Deck" subtitle="Our vision, innovation & journey" />
                    )}
                    <LinkRow href={person.linkedin} icon={<LinkedInIcon />} title={`Connect with ${firstName} on LinkedIn`} subtitle="Follow the startup journey" />
                </div>

                {otherFounder && (
                    <>
                        <h2 className="mt-8 mb-3 text-sm font-black text-slate-900">Also meet</h2>
                        <PersonCard person={otherFounder} to={otherFounder.path} />
                    </>
                )}

                <div className="mt-7 rounded-2xl bg-orange-500 p-5 text-center text-white shadow-lg shadow-orange-500/20">
                    <p className="text-base font-black">Let&apos;s Build the Future Together</p>
                    <p className="mt-1 text-[11px] text-white/80">Investment · Partnerships · Collaboration</p>
                    <a
                        href={`mailto:${person.email}?subject=${encodeURIComponent('Partnership Inquiry: LearnProof AI')}`}
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-bold text-slate-900 no-underline hover:bg-orange-50 transition outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
                    >
                        <span>Get in Touch</span>
                        <ArrowRight size={14} />
                    </a>
                    <button
                        onClick={share}
                        type="button"
                        className="mt-2 inline-flex items-center gap-1.5 bg-transparent border-0 text-[11px] font-semibold text-white/90 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-md"
                    >
                        <Share2 size={12} />
                        <span>Share this card</span>
                    </button>
                </div>

                <div className="mt-6 border-t border-orange-100 pt-4 text-center text-[11px] text-slate-400">
                    <p>© {new Date().getFullYear()} {COMPANY}</p>
                    <p className="mt-0.5 font-semibold text-orange-500">Made in India. Built for the World.</p>
                </div>
            </motion.main>
        </div>
    );
};

export default FounderContactPage;
