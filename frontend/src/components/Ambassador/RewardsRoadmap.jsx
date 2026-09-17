import React from 'react';
import { Trophy, Gift, Award, CheckCircle2, ChevronRight, Sparkles, Shield, Star } from 'lucide-react';

export default function RewardsRoadmap({
    referralData,
    currentTier
}) {
    const signups = referralData?.signupCount || 0;

    const tiers = [
        {
            level: 'Bronze',
            badge: '🥉',
            minSignups: '0–9 verified students',
            title: 'Bronze Ambassador',
            dimension: 'Foundation & Community Access',
            color: 'border-amber-200 bg-amber-50/40 text-amber-900',
            badgeBg: 'bg-amber-100 text-amber-800',
            isUnlocked: true,
            perks: [
                'Official LearnProof Ambassador Badge & Verified Title',
                'Access to multi-channel Ambassador Toolkit & scripts',
                'Direct entry into the Ambassador Discord/WhatsApp Circle'
            ]
        },
        {
            level: 'Silver',
            badge: '🥈',
            minSignups: '10–49 verified students',
            title: 'Silver Ambassador',
            dimension: 'Community Validation & Leadership',
            color: 'border-slate-200 bg-slate-50 text-slate-900',
            badgeBg: 'bg-slate-200 text-slate-800',
            isUnlocked: signups >= 10,
            perks: [
                'Official Certificate of Leadership & Community Management',
                'Early access to beta AI learning features (AskMyNotes)',
                'Featured spot on the LearnProof Campus Directory'
            ]
        },
        {
            level: 'Gold',
            badge: '🥇',
            minSignups: '50–99 verified students',
            title: 'Gold Ambassador',
            dimension: 'High Campus Influence & Events',
            color: 'border-yellow-300 bg-yellow-50/50 text-yellow-950',
            badgeBg: 'bg-yellow-200 text-yellow-900',
            isUnlocked: signups >= 50,
            perks: [
                'Official LearnProof Merchandise Kit (T-Shirt, Stickers, Notebook)',
                'Direct event co-sponsorship for college coding/hackathon clubs',
                'Letters of Recommendation from LearnProof Leadership'
            ]
        },
        {
            level: 'Diamond',
            badge: '💎',
            minSignups: '100+ verified students + activity',
            title: 'Diamond Campus Lead',
            dimension: 'Startup Operator & Core Team',
            color: 'border-indigo-200 bg-indigo-50/40 text-indigo-950',
            badgeBg: 'bg-indigo-100 text-indigo-800',
            isUnlocked: signups >= 100,
            perks: [
                'Direct strategic interaction & 1-on-1 mentorship with founders',
                'Core community access & product roadmap advisory seat',
                'Lead major campus initiatives & creator stipend opportunities',
                'Priority consideration for full-time internships & roles'
            ]
        }
    ];

    return (
        <section id="milestones" className="space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="pb-6 border-b border-gray-100">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 mb-2">
                        <Award size={14} className="text-orange-500" />
                        Multi-Dimensional Progression
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                        🏆 Rewards & Leadership Roadmap
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                        Tier advancement is evaluated across 3 dimensions: <strong className="text-gray-800">Growth</strong>, <strong className="text-gray-800">Campus Activity</strong>, and <strong className="text-gray-800">Community Leadership</strong>.
                    </p>
                </div>

                {/* Tiers Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tiers.map((tier) => (
                        <div
                            key={tier.level}
                            className={`
                                p-5 rounded-3xl border flex flex-col justify-between transition-all
                                ${tier.color}
                                ${tier.isUnlocked ? 'shadow-xs ring-1 ring-black/5' : 'opacity-85'}
                            `}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">{tier.badge}</span>
                                    {tier.isUnlocked ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 size={12} /> Unlocked
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                            Locked
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-base font-black text-gray-900 leading-tight">
                                        {tier.title}
                                    </h3>
                                    <span className="text-xs font-bold text-orange-600 block mt-0.5">
                                        {tier.minSignups}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-black/5 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                        Perks & Milestones
                                    </span>
                                    <ul className="space-y-1.5 text-xs text-gray-700">
                                        {tier.perks.map((perk, i) => (
                                            <li key={i} className="flex items-start gap-1.5 leading-tight">
                                                <span className="text-orange-500 font-bold shrink-0">•</span>
                                                <span className="font-medium">{perk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/5 text-[11px] font-bold text-gray-500">
                                Dimension: <span className="text-gray-800">{tier.dimension}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
