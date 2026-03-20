import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Download, ExternalLink, Clock } from "lucide-react";

const CertificatePreview = ({ userName, courseName, date, certId }) => {
  return (
    <div className="relative w-full aspect-[1.414/1] bg-white border-[6px] border-[#1e293b] p-1.5 shadow-inner overflow-hidden select-none group-hover:shadow-2xl transition-all duration-500 rounded-sm">
      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-t border-l border-orange-400 opacity-50"></div>
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-t border-r border-orange-400 opacity-50"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-b border-l border-orange-400 opacity-50"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-b border-r border-orange-400 opacity-50"></div>
      </div>

      {/* Inner Gold/Premium Border */}
      <div className="w-full h-full border-2 border-[#f59e0b]/30 relative flex flex-col items-center justify-between py-8 px-4">
        {/* Background Watermark/Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
           <Award size={200} className="rotate-12 text-[#1e293b]" strokeWidth={1} />
        </div>

        {/* Header */}
        <div className="text-center relative z-10">
          <p className="text-[14px] font-black text-[#1e293b] leading-tight tracking-[0.15em] uppercase">Certificate of Achievement</p>
          <div className="h-[1px] w-12 bg-orange-400 mx-auto mt-1 opacity-60"></div>
          <p className="text-[7px] text-[#64748b] font-bold tracking-[0.25em] uppercase mt-1">This achievement is officially verified</p>
        </div>

        {/* Recipient */}
        <div className="text-center relative z-10 py-2">
          <p className="text-[6px] text-[#94a3b8] font-bold uppercase mb-2 tracking-widest">Proudly Presented To</p>
          <p className="text-[18px] font-black text-[#f97316] uppercase leading-tight truncate px-4 w-full max-w-[200px] font-serif tracking-tight">
            {userName || "Learner"}
          </p>
          <div className="h-[0.5px] w-32 bg-[#cbd5e1] mx-auto mt-1"></div>
        </div>

        {/* Course */}
        <div className="text-center px-4 relative z-10">
          <p className="text-[7px] text-[#64748b] mb-2 font-medium">for successfully mastering the curriculum and passing the final examination for</p>
          <p className="text-[11px] font-bold text-[#1e293b] italic leading-tight inline-block px-4 py-1.5 bg-orange-50/50 rounded-lg border border-orange-100/50">
            {courseName}
          </p>
        </div>

        {/* Bottom Section: Date & ID */}
        <div className="w-full flex justify-between items-end px-8 relative z-10 mt-2">
          <div className="flex flex-col items-center">
            <p className="text-[5px] text-[#94a3b8] uppercase font-bold mb-1 tracking-tighter">Issue Date</p>
            <p className="text-[6px] font-black text-[#1e293b]">{date}</p>
            <div className="w-12 h-[0.5px] bg-[#1e293b]/20 mt-1"></div>
          </div>
          
          <div className="flex flex-col items-center relative -bottom-2">
            <div className="w-10 h-10 rounded-full border-2 border-orange-400 flex flex-col items-center justify-center bg-white shadow-lg">
              <ShieldCheck size={16} className="text-orange-500" />
              <p className="text-[4px] font-black text-orange-600 uppercase mt-0.5">Verified</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-[5px] text-[#94a3b8] uppercase font-bold mb-1 tracking-tighter">Verify ID</p>
            <p className="text-[6px] font-black text-[#1e293b] truncate w-14 text-center">{certId}</p>
            <div className="w-12 h-[0.5px] bg-[#1e293b]/20 mt-1"></div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-col items-center opacity-70">
           <p className="text-[7px] font-black text-[#1e293b] tracking-wider">LEARNPROOF ACADEMY</p>
           <p className="text-[4px] text-[#64748b] font-medium tracking-[0.2em] uppercase">Global Certification Authority</p>
        </div>
      </div>
    </div>
  );
};

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
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-slate-400 font-medium tracking-wide">Fetching your achievements...</p>
        </div>
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center text-gray-400 dark:text-slate-500 space-y-6 flex-1 py-12 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="text-8xl p-8 bg-orange-50 dark:bg-orange-900/20 rounded-full animate-pulse">🎓</div>
          <Award className="absolute bottom-0 right-0 text-orange-500 h-10 w-10" />
        </motion.div>
        
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200">
            No Certificates Yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Every expert started as a beginner. Complete playlists and pass certification quizzes to earn your verified certificates!
          </p>
        </div>

        <a 
          href="/dashboard" 
          className="px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 hover:-translate-y-1 active:scale-95"
        >
          Explore Courses
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 p-4 sm:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <Award className="text-white" size={32} />
            </div>
            My Certificates
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-3 text-lg">
            Displaying all your verified achievements. Proudly sharing your success!
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-orange-100 dark:bg-orange-900/40 px-6 py-2.5 rounded-2xl border border-orange-200 dark:border-orange-500/20">
            <span className="text-orange-700 dark:text-orange-300 font-black text-lg">
              {certs.length} <span className="text-sm font-bold uppercase opacity-80 ml-1">Total Earned</span>
            </span>
          </div>
          <p className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mr-2">LearnProof Certified Professional</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {certs.map((cert, index) => (
          <motion.div
            key={cert.id || index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-gray-100 dark:border-slate-700/50 transition-all duration-500 overflow-hidden flex flex-col"
          >
            {/* Preview Area with Gradient Background */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-slate-900 dark:to-slate-800 flex justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
              <div className="transform group-hover:scale-[1.05] group-hover:-rotate-1 transition-all duration-700 z-10 w-full">
                <CertificatePreview 
                  userName={user?.name} 
                  courseName={cert.title} 
                  date={cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                  certId={cert.id}
                />
              </div>
            </div>

            <div className="p-8 flex flex-col flex-1 bg-white dark:bg-slate-800">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Verified Achievement</span>
                </div>
                <h3 className="font-black text-2xl text-gray-800 dark:text-white truncate mb-2 group-hover:text-orange-500 transition-colors leading-tight">
                  {cert.title || "Certificate"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                  {cert.description || "Earned for high performance in training modules and successful completion of final assessments."}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Issue Date</span>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-orange-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-200">
                      {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                    </span>
                  </div>
                </div>
                
                <a
                  href={cert.download_url ? `${import.meta.env.VITE_BACKEND_URL}${cert.download_url}` : `/certificate/${cert.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-gray-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:bg-orange-500 dark:hover:bg-orange-500 hover:scale-105 active:scale-95 group/btn"
                >
                  <Download size={16} className="group-hover/btn:animate-bounce" />
                  View PDF
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyCertificates;
