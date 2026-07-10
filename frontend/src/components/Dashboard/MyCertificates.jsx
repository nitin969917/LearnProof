import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { Award, Download, Clock, Share2, ShieldCheck } from "lucide-react";
import CertificatePreview from "../Common/CertificatePreview";

const MyCertificates = () => {
  const { token, user } = useAuth();

  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;

    const fetchCertificates = async (retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/certs/`,
            { idToken: token }
          );
          if (active) {
            setCerts(res.data || []);
            setLoading(false);
          }
          return;
        } catch (err) {
          console.warn(`MyCertificates fetch attempt ${i + 1} failed:`, err);
          if (i === retries) {
            console.error("Failed to fetch certificates after retries", err);
            if (active) {
              toast.error("Failed to fetch certificates");
              setLoading(false);
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    };

    setLoading(true);
    fetchCertificates();

    return () => { active = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full animate-spin border-[3px] border-orange-500/20 border-t-orange-500" />
            <Award className="absolute inset-0 m-auto text-orange-500/40" size={18} />
          </div>
          <p className="text-gray-400 dark:text-gray-500 font-bold text-xs tracking-wider">Fetching achievements...</p>
        </div>
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-orange-50 dark:bg-orange-900/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
        >
          <span className="text-4xl">🎓</span>
        </motion.div>
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-1">No Certificates Yet</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-[240px] leading-relaxed mb-6">
          Complete playlists and pass certification quizzes to earn verified certificates!
        </p>
        <button
          onClick={() => window.location.href='/dashboard/library'}
          className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 hover:bg-orange-600 active:scale-95 transition-all"
        >
          Start Learning
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28">

      {/* ── Compact Mobile Header ─────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">My Certificates</h1>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {certs.length} verified {certs.length === 1 ? 'achievement' : 'achievements'} earned
          </p>
        </div>
      </div>

      {/* ── Certificates Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4 sm:gap-6">
        {certs.map((cert, index) => (
          <motion.div
            key={cert.id || index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm"
          >
            {/* Certificate Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-orange-50/40 dark:from-gray-900 dark:to-gray-800 p-3">
              <CertificatePreview
                userName={user?.name}
                courseName={cert.title}
                date={cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                certId={cert.id}
              />
            </div>

            {/* Card Info Row */}
            <div className="px-3.5 py-3">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                    <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Verified</span>
                  </div>
                  <h3 className="font-black text-sm text-gray-800 dark:text-white line-clamp-2 leading-snug">
                    {cert.title || "Certificate"}
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                  <Clock size={11} className="text-orange-500" />
                  <span className="font-medium whitespace-nowrap">
                    {cert.issued_at
                      ? new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <a
                  href={cert.download_url ? `${import.meta.env.VITE_BACKEND_URL}${cert.download_url}` : `/certificate/${cert.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-orange-500 dark:hover:bg-orange-500 active:scale-95"
                >
                  <Download size={12} />
                  View PDF
                </a>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/verify/${cert.certificate_id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Verification link copied!");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-gray-100 dark:border-gray-700 transition-all hover:border-orange-300 hover:text-orange-500 active:scale-95"
                >
                  <Share2 size={12} />
                  Share
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyCertificates;
