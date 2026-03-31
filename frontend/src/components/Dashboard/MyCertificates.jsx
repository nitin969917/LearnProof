import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Download, ExternalLink, Clock, Share2 } from "lucide-react";
import CertificatePreview from "../Common/CertificatePreview";



const MyCertificates = () => {
  const { token, user } = useAuth();

  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/certs/`,
          { idToken: token }
        );
        setCerts(res.data || []); 
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch certificates");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [token]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <Award className="absolute inset-0 m-auto text-orange-500/40" size={24} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Fetching achievements...</p>
        </div>
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8"
        >
          <div className="w-32 h-32 sm:w-40 sm:h-40 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center">
            <span className="text-6xl sm:text-7xl">🎓</span>
          </div>
          <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <Award className="text-orange-500 h-6 w-6 sm:h-8 sm:w-8" />
          </div>
        </motion.div>
        
        <div className="text-center space-y-3 max-w-sm mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            No Certificates Yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Complete playlists and pass certification quizzes to earn your verified accomplishments!
          </p>
        </div>

        <button 
          onClick={() => window.location.href='/dashboard/library'}
          className="mt-8 px-10 py-4 bg-gray-900 dark:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 dark:hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 hover:-translate-y-1"
        >
          Begin Journey
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 p-4 sm:p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <Award className="text-white" size={32} />
            </div>
            My Certificates
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm sm:text-lg max-w-lg">
            Displaying all your verified achievements. Proudly sharing your success!
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <div className="bg-orange-100 dark:bg-orange-900/40 px-6 py-2.5 rounded-2xl border border-orange-200 dark:border-orange-500/20">
            <span className="text-orange-700 dark:text-orange-300 font-black text-lg">
              {certs.length} <span className="text-sm font-bold uppercase opacity-80 ml-1">Total Earned</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">LearnProof Certified Professional</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {certs.map((cert, index) => (
          <motion.div
            key={cert.id || index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-700 shadow-orange-500/5 transition-all duration-500 overflow-hidden flex flex-col"
          >
            {/* Preview Area with Gradient Background */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none translate-y-2"></div>
              <div className="transform group-hover:scale-[1.03] transition-all duration-700 z-10 w-full px-2 sm:px-4">
                <CertificatePreview 
                  userName={user?.name} 
                  courseName={cert.title} 
                  date={cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                  certId={cert.id}
                />
              </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col flex-1 bg-white dark:bg-gray-800">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Verified Achievement</span>
                </div>
                <h3 className="font-black text-xl sm:text-2xl text-gray-800 dark:text-white truncate mb-2 group-hover:text-orange-500 transition-colors leading-tight">
                  {cert.title || "Certificate"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium">
                  {cert.description || "Earned for high performance in training modules and successful completion of final assessments."}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Issue Date</span>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-orange-500" />
                      <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">
                        {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={cert.download_url ? `${import.meta.env.VITE_BACKEND_URL}${cert.download_url}` : `/certificate/${cert.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-orange-500 dark:hover:bg-orange-500 group/btn"
                  >
                    <Download size={14} className="group-hover/btn:animate-bounce" />
                    View PDF
                  </a>

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/verify/${cert.certificate_id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Verification link copied to clipboard!");
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-orange-200 dark:border-gray-700 transition-all hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-400 group/share"
                  >
                    <Share2 size={14} className="group-hover/share:rotate-12" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyCertificates;
