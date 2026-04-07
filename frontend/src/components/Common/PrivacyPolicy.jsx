import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-purple-900 selection:text-white">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate('/')}
                    className="mb-8 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </button>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                    Privacy Policy
                </h1>
                <p className="text-gray-400 mb-12">Last Updated: April 2026</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to LearnProof AI. We respect your privacy and are committed to protecting your personal data. 
                            This privacy policy will inform you as to how we look after your personal data when you visit our website 
                            and use our services (regardless of where you visit it from) and tell you about your privacy rights.
                        </p>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
                        <p className="mb-4">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li><strong className="text-gray-300">Identity Data:</strong> includes first name, last name, username or similar identifier, and profile picture.</li>
                            <li><strong className="text-gray-300">Contact Data:</strong> includes email address.</li>
                            <li><strong className="text-gray-300">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                            <li><strong className="text-gray-300">Usage Data:</strong> includes information about how you use our website and services, such as video watch history, quiz scores, and AI interactions.</li>
                        </ul>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. YouTube Data Integration</h2>
                        <p>
                            LearnProof AI integrates with YouTube to provide educational content and track learning progress. 
                            By using our services, you may be interacting with YouTube API Services. We only access the data necessary 
                            to provide our core functionality (such as tracking video progress within our application).
                            For more information, please also refer to the Google Privacy Policy.
                        </p>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. How We Use Your Data</h2>
                        <p className="mb-4">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>To register you as a new user.</li>
                            <li>To provide our AI-driven learning services, including AskMyNotes and quiz generation.</li>
                            <li>To manage our relationship with you, including support tickets and administration.</li>
                            <li>To improve our website, products/services, marketing or customer relationships.</li>
                            <li>To issue and verify digital certificates for your learning achievements.</li>
                        </ul>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                            used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data 
                            to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Your Legal Rights</h2>
                        <p className="mb-4">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>Request access to your personal data.</li>
                            <li>Request correction of your personal data.</li>
                            <li>Request erasure of your personal data.</li>
                            <li>Object to processing of your personal data.</li>
                            <li>Request restriction of processing your personal data.</li>
                            <li>Request transfer of your personal data.</li>
                        </ul>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at our 
                            support email or through the support system within the LearnProof application.
                        </p>
                    </section>
                </div>
                
                <div className="mt-12 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} LearnProof AI. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
