import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-orange-50 relative overflow-hidden flex flex-col justify-between p-4 selection:bg-orange-200 select-none">
            {/* Background Texture & Blobs */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200 via-red-100 to-transparent rounded-full blur-[120px] opacity-60 z-0 pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200 to-transparent rounded-full blur-[100px] opacity-40 z-0 pointer-events-none -translate-x-1/3" />

            <div className="flex-1 max-w-4xl w-full mx-auto relative z-10 py-8 px-2 sm:px-4">
                {/* Back button */}
                <button 
                    onClick={() => navigate('/')}
                    className="mb-8 flex items-center text-gray-500 hover:text-orange-600 font-bold transition-colors duration-200 uppercase tracking-widest text-xs gap-2 group cursor-pointer"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="bg-white/75 backdrop-blur-xl border border-orange-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(249,115,22,0.08)] space-y-8">
                    <div className="border-b border-orange-100 pb-6">
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase mb-2">
                            Terms of Service
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last Updated: April 2026</p>
                    </div>

                    <div className="space-y-8 text-gray-600 leading-relaxed font-medium text-sm sm:text-base">
                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using LearnProof AI, you agree to be bound by these Terms of Service. 
                                If you do not agree to all of the terms and conditions, you may not access or use our services.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">2. Description of Service</h2>
                            <p>
                                LearnProof AI provides users with AI-driven learning tools, including progress tracking for YouTube educational 
                                content, rich-text note editor, quiz generation, study roadmaps, and verifiable completion certificates. 
                                We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">3. User Accounts</h2>
                            <p>
                                To use many features of the service, you must authenticate using your Google Account. You agree to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2.5 text-gray-500 font-semibold text-xs sm:text-sm">
                                <li>Maintain the security of your account credentials.</li>
                                <li>Provide accurate and complete information when prompted.</li>
                                <li>Promptly notify us of any unauthorized use of your account.</li>
                                <li>Take full responsibility for all activities that occur under your account.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">4. Third-Party Integrations & YouTube API</h2>
                            <p>
                                Our service integrates with the YouTube API Services to search for and track educational videos. 
                                By using LearnProof AI, you acknowledge and agree that you are also bound by the YouTube Terms of Service 
                                and Google Privacy Policy. We are not responsible for content, privacy policies, or practices of third-party platforms.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">5. User Conduct & Content Guidelines</h2>
                            <p>
                                You agree not to use the service for any unlawful purposes or in any way that violates these terms. 
                                You are solely responsible for any notes, messages, or text you input or upload to the platform. 
                                We reserve the right to remove any content or suspend accounts that engage in abusive, harassing, or malicious activities.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">6. Intellectual Property Rights</h2>
                            <p>
                                All rights, title, and interest in and to the services, logo, branding, features, and website design 
                                are and will remain the exclusive property of LearnProof AI. You may not copy, modify, distribute, 
                                or replicate any part of our platform without prior written permission.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">7. Disclaimer & Limitation of Liability</h2>
                            <p>
                                The services are provided on an "AS IS" and "AS AVAILABLE" basis. LearnProof AI disclaims all warranties of any kind. 
                                In no event shall LearnProof AI be liable for any indirect, incidental, special, consequential, or punitive damages 
                                arising out of or relating to your use of the services.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">8. Contact Information</h2>
                            <p>
                                If you have any questions or concerns regarding these Terms of Service, please contact us at 
                                hello@learnproofai.com or submit a query via our Support system.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            {/* Public Footer */}
            <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-3 pb-6">
                <div className="flex justify-center items-center gap-6 text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <a href="/" className="hover:text-orange-600 transition-colors">Company</a>
                    <a href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</a>
                    <a href="/terms" className="hover:text-orange-600 transition-colors">Terms</a>
                    <a href="/support" className="hover:text-orange-600 transition-colors">Support</a>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    &copy; 2025 LearnProof AI. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default TermsOfService;
