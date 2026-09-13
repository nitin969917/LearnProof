import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { Award, Download, Clock, Share2, ShieldCheck, CheckCircle2, AlertCircle, XCircle, ChevronRight, BookOpen } from "lucide-react";
import CertificatePreview from "../Common/CertificatePreview";

const MyCertificates = () => {
  const { token, user } = useAuth();

  // Sub-tabs: 'earned' or 'requests'
  const [subTab, setSubTab] = useState('earned');

  const [certs, setCerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCertificatesAndRequests = async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch for issued certificates and request records
      const [certsRes, requestsRes] = await Promise.all([
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/certs/`,
          { idToken: token },
          { headers }
        ),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/certificates/my-requests`,
          { headers }
        ).catch(() => ({ data: [] }))
      ]);

      setCerts(certsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch certificates data", err);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCertificatesAndRequests();
  }, [token]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full animate-spin border-[3px] border-orange-500/20 border-t-orange-500" />
            <Award className="absolute inset-0 m-auto text-orange-500/40" size={18} />
          </div>
          <p className="text-gray-400 dark:text-gray-500 font-bold text-xs tracking-wider">Fetching credentials...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Credentials & Certifications</h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {certs.length} verified {certs.length === 1 ? 'achievement' : 'achievements'} earned • {requests.length} submitted requests
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setSubTab('earned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'earned'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Award size={14} className={subTab === 'earned' ? 'text-orange-500' : ''} />
            <span>Earned ({certs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'requests'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} className={subTab === 'requests' ? 'text-amber-500' : ''} />
            <span>Requests & Status</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TAB 1: EARNED CERTIFICATES ── */}
      {subTab === 'earned' && (
        <>
          {certs.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 bg-orange-50 dark:bg-orange-900/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
              >
                <span className="text-4xl">🎓</span>
              </motion.div>
              <h2 className="text-base font-black text-gray-900 dark:text-white mb-1">No Certificates Issued Yet</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-[280px] leading-relaxed mb-6">
                Pass certification quizzes and submit verification requests to earn official, verified certificates.
              </p>
              <button
                onClick={() => window.location.href = '/dashboard/library'}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 hover:bg-orange-600 active:scale-95 transition-all"
              >
                Start Learning
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4 sm:gap-6">
              {certs.map((cert, index) => (
                <motion.div
                  key={cert.id || index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xs"
                >
                  {/* Certificate Preview with Template */}
                  <div className="bg-gradient-to-br from-gray-50 to-orange-50/40 dark:from-gray-900 dark:to-gray-800 p-3">
                    <CertificatePreview
                      userName={cert.recipient_name || user?.name}
                      courseName={cert.title}
                      date={cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                      certId={cert.id || cert.certificate_id}
                      template={cert.template}
                    />
                  </div>

                  {/* Card Info Row */}
                  <div className="px-3.5 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                          <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                            Officially Verified
                          </span>
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
                          const certId = cert.certificate_id || cert.id;
                          const url = `${window.location.origin}/verify/${certId}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Verification link copied!");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-gray-100 dark:border-gray-700 transition-all hover:border-orange-300 hover:text-orange-500 active:scale-95"
                      >
                        <Share2 size={12} />
                        Share Proof
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: REQUESTS & STATUS ── */}
      {subTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                <Clock size={28} />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">No Active Requests</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                When you pass a course exam, you can request an official certificate for admin review here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isRejected = req.status === 'REJECTED';

                return (
                  <div
                    key={req.id}
                    className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
                            Course Certification
                          </span>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                            {req.playlist?.name || 'Combined Specialization'}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                            <Clock size={11} />
                            In Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={11} />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
                            <XCircle size={11} />
                            Needs Action
                          </span>
                        )}
                      </div>

                      {/* Request Details */}
                      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center justify-between">
                          <span>Recipient Name:</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{req.fullName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Test Score:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{req.score ? `${Math.round(req.score)}%` : 'Passed'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Submitted:</span>
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Rejection feedback if any */}
                      {isRejected && req.rejectionReason && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-700 dark:text-red-300 mb-4">
                          <span className="font-bold block mb-0.5">Admin Review Feedback:</span>
                          {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                      {isApproved && req.certificate ? (
                        <a
                          href={`${import.meta.env.VITE_BACKEND_URL}${req.certificate.download_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-green-600 text-white rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 hover:bg-green-700"
                        >
                          <Download size={14} />
                          <span>Download Certificate</span>
                        </a>
                      ) : isPending ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          Our administration team is currently verifying your course metrics.
                        </p>
                      ) : (
                        <button
                          onClick={() => window.location.href = '/dashboard/quizzes'}
                          className="text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                          Retake Assessment & Re-request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
