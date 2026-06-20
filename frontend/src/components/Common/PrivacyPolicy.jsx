import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
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
                            Privacy Policy
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last Updated: April 2026</p>
                    </div>

                    <div className="space-y-8 text-gray-600 leading-relaxed font-medium text-sm sm:text-base">
                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">1. Introduction</h2>
                            <p>
                                Welcome to LearnProof AI. We respect your privacy and are committed to protecting your personal data. 
                                This privacy policy will inform you as to how we look after your personal data when you visit our website 
                                and use our services (regardless of where you visit it from) and tell you about your privacy rights.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">2. Data We Collect</h2>
                            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                            <ul className="list-disc pl-5 space-y-2.5 text-gray-500 font-semibold text-xs sm:text-sm">
                                <li><strong className="text-gray-700">Identity Data:</strong> includes first name, last name, username or similar identifier, and profile picture.</li>
                                <li><strong className="text-gray-700">Contact Data:</strong> includes email address.</li>
                                <li><strong className="text-gray-700">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                                <li><strong className="text-gray-700">Usage Data:</strong> includes information about how you use our website and services, such as video watch history, quiz scores, and AI interactions.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">3. YouTube Data Integration</h2>
                            <p>
                                LearnProof AI integrates with YouTube to provide educational content and track learning progress. 
                                By using our services, you may be interacting with YouTube API Services. We only access the data necessary 
                                to provide our core functionality (such as tracking video progress within our application).
                                For more information, please also refer to the Google Privacy Policy.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">4. How We Use Your Data</h2>
                            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                            <ul className="list-disc pl-5 space-y-2.5 text-gray-500 font-semibold text-xs sm:text-sm">
                                <li>To register you as a new user.</li>
                                <li>To provide our AI-driven learning services, including AskMyNotes and quiz generation.</li>
                                <li>To manage our relationship with you, including support tickets and administration.</li>
                                <li>To improve our website, products/services, marketing or customer relationships.</li>
                                <li>To issue and verify digital certificates for your learning achievements.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">5. Data Security</h2>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                                used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data 
                                to those employees, agents, contractors and other third parties who have a business need to know.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">6. Your Legal Rights</h2>
                            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing of your personal data.</p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">7. Contact Us</h2>
                            <p>
                                If you have any questions about this privacy policy or our privacy practices, please contact us at our 
                                support email or through the support system within the LearnProof application.
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

export default PrivacyPolicy;
