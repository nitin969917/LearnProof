import React from 'react';
import { useNavigate } from 'react-router-dom';

const DeleteAccount = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-red-900 selection:text-white">
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

                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                    Account Deletion Request
                </h1>
                <p className="text-gray-400 mb-12">LearnProof AI Data Privacy & Deletion</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">How to Request Account Deletion</h2>
                        <p className="mb-4">
                            Since LearnProof AI uses "Continue with Google" securely through OAuth for account access, 
                            you do not have a traditional password with us. However, you can still request the full 
                            deletion of your account and all associated data from our servers at any time.
                        </p>
                        <ul className="list-decimal pl-5 space-y-2 text-gray-400">
                            <li>Send an email to <a href="mailto:learnproofai@gmail.com" className="text-blue-400 hover:text-blue-300 underline">learnproofai@gmail.com</a> from the Google email address associated with your account.</li>
                            <li>Use the subject line: <strong>"Account Deletion Request"</strong>.</li>
                            <li>Include a short message confirming that you would like your account and all associated data permanently deleted.</li>
                        </ul>
                    </section>

                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">What Data Will Be Deleted?</h2>
                        <p className="mb-4">Once your request is processed natively on our end, the following data will be permanently and irrevocably deleted from our specific database sources:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li><strong className="text-gray-300">Profile Data:</strong> Your name and email address received via Google OAuth.</li>
                            <li><strong className="text-gray-300">Learning History:</strong> Your saved videos, bookmarks, and playlist progression within the app.</li>
                            <li><strong className="text-gray-300">AI Interactions:</strong> Generated quizzes, conversational notes, and historical chat benchmark summaries.</li>
                        </ul>
                    </section>
                    
                    <section className="bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold text-white mb-4">Retention & Processing Period</h2>
                        <p className="text-gray-400">
                            All account deletion requests are processed manually within <strong>7 business days</strong>.  
                            Once processed, the deletion is final. We do not retain any residual copies of your data 
                            on active or backup servers once your request is fulfilled. 
                        </p>
                        <p className="text-gray-400 mt-4">
                            Note: If you have shared data externally or published reviews, those may remain anonymized.
                            Furthermore, this does not delete your Google account itself, only your connection and data hosted within LearnProof AI.
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

export default DeleteAccount;
