import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, ExternalLink, Calendar, User, BookOpen, CheckCircle, Sparkles, Youtube } from 'lucide-react';
import CertificatePreview from './CertificatePreview';

const VerifyCertificate = () => {
    const { certId } = useParams();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCert = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/verify-certificate/${certId}`);
                setCert(res.data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "Certificate not found or invalid.");
            } finally {
                setLoading(false);
            }
        };
        fetchCert();
    }, [certId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-orange-600 font-bold uppercase tracking-widest text-sm italic">Verifying Authenticity...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-red-100"
                >
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-red-400 opacity-50" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Verification Failed</h1>
                    <p className="text-gray-500 mb-8 font-medium">{error}</p>
                    <Link to="/" className="inline-block w-full py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors">
                        Return to LearnProof
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 selection:bg-orange-200 py-12 px-4 sm:px-6 lg:px-8">
            {/* SEO Structured Data for this specific certificate */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": cert.title,
                    "description": cert.description,
                    "provider": {
                        "@type": "Organization",
                        "name": "LearnProof AI",
                        "sameAs": "https://learnproofai.com"
                    }
                })}
            </script>

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs font-black uppercase tracking-widest mb-6 border border-green-200"
                    >
                        <CheckCircle size={14} />
                        <span>Officially Verified Achievement</span>
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tighter uppercase">
                        Certificate Verification
                    </h1>
                    <p className="text-gray-500 max-w-xl mx-auto font-medium">
                        This digital record confirms that the individual below has successfully completed 
                        the academic requirements on LearnProof AI.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left Side: Certificate Preview */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="sticky top-12"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-orange-500/10 rounded-[2.5rem] blur-2xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
                            <div className="relative bg-white p-4 sm:p-6 rounded-[2rem] shadow-2xl border border-orange-100 transition-transform duration-500 hover:scale-[1.01]">
                                <CertificatePreview 
                                    userName={cert.issued_to}
                                    courseName={cert.title}
                                    date={new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    certId={cert.certificate_id}
                                />
                                <div className="mt-6 flex justify-center">
                                    <a 
                                        href={`${import.meta.env.VITE_BACKEND_URL}${cert.download_url}`}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                        Download Official PDF Transcript
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Verification Details */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        {/* Recipient Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-orange-50">
                                {cert.user.profile_pic ? (
                                    <img src={cert.user.profile_pic} alt={cert.issued_to} className="w-16 h-16 rounded-2xl shadow-md" />
                                ) : (
                                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-2xl font-black">
                                        {cert.issued_to.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated Learner</p>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{cert.issued_to}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Award size={14} className="text-orange-500" />
                                        <span className="text-xs font-bold text-orange-600">Level {cert.user.level} • {cert.user.xp} XP</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Issue Date</p>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
                                        <Calendar size={14} className="text-orange-400" />
                                        {new Date(cert.issued_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Credential Type</p>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
                                        <Sparkles size={14} className="text-orange-400" />
                                        {cert.type}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Learning Evidence</p>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
                                        <Youtube size={14} className="text-red-500" />
                                        {cert.total_videos} {cert.total_videos === 1 ? 'Video' : 'Videos'} Tracked
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verification ID</p>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold text-xs truncate">
                                        <ShieldCheck size={14} className="text-green-500" />
                                        {cert.certificate_id}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Platform Info */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Sparkles size={100} />
                            </div>
                            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">What is LearnProof?</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
                                LearnProof AI is an advanced educational integrity platform that uses AI to track, verify, and certify learning progress from digital content. This certificate represents demonstrated competence through rigorous AI-generated assessment.
                            </p>
                            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
                                Start Your Journey
                                <ExternalLink size={14} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default VerifyCertificate;
