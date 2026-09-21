import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import toast from 'react-hot-toast';
import {
    Award,
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    Palette,
    Search,
    Filter,
    RefreshCw,
    Download,
    ExternalLink,
    Plus,
    Edit3,
    Trash2,
    ShieldCheck,
    Check,
    AlertCircle,
    User,
    BookOpen,
    Eye,
    ChevronRight,
    Star,
    Sparkles,
    Sliders
} from 'lucide-react';
import CertificatePreview from '../../Common/CertificatePreview';
import { getCertificatePdfUrl } from '../../../utils/certificateHelper';

const AdminCertificates = () => {
    const { token, user } = useAuth();
    const { confirm } = useModal();

    // Main Tabs: 'requests', 'issued', 'templates'
    const [activeTab, setActiveTab] = useState('requests');

    // Stats
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalIssued: 0,
        totalTemplates: 0
    });

    // Requests Tab state
    const [requests, setRequests] = useState([]);
    const [requestFilter, setRequestFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
    const [requestSearch, setRequestSearch] = useState('');

    // Issued Certificates state
    const [issuedCerts, setIssuedCerts] = useState([]);
    const [issuedSearch, setIssuedSearch] = useState('');

    // Templates state
    const [templates, setTemplates] = useState([]);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal: Review & Approve / Reject
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [recipientNameOverride, setRecipientNameOverride] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    // Modal: Create / Edit Template
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        slug: '',
        description: '',
        layout: 'classic',
        primaryColor: '#1e293b',
        accentColor: '#f59e0b',
        textColor: '#0f172a',
        backgroundColor: '#ffffff',
        titleText: 'CERTIFICATE OF ACHIEVEMENT',
        subtitleText: 'THIS IS OFFICIALLY PRESENTED TO',
        bodyText: 'for successfully mastering the curriculum and passing the comprehensive examination for',
        issuerName: 'LearnProof Academy',
        issuerTitle: 'Global Certification Authority',
        signatoryName: 'Academic Director',
        signatoryTitle: 'Head of Certifications',
        sealText: 'VERIFIED',
        isDefault: false
    });

    // Fetch All Data
    const fetchData = async (isRefresh = false) => {
        if (!token) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch Stats, Requests, Issued, Templates in parallel
            const [statsRes, requestsRes, issuedRes, templatesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/stats`, { headers }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/requests`, {
                    headers,
                    params: { status: 'ALL' }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/certificates`, { headers }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/templates`, { headers })
            ]);

            setStats(statsRes.data);
            const reqList = Array.isArray(requestsRes.data)
                ? requestsRes.data
                : (Array.isArray(requestsRes.data?.requests) ? requestsRes.data.requests : []);
            const certList = Array.isArray(issuedRes.data)
                ? issuedRes.data
                : (Array.isArray(issuedRes.data?.certificates) ? issuedRes.data.certificates : []);
            const tplList = Array.isArray(templatesRes.data)
                ? templatesRes.data
                : (Array.isArray(templatesRes.data?.templates) ? templatesRes.data.templates : []);

            setRequests(reqList);
            setIssuedCerts(certList);
            setTemplates(tplList);

            if (tplList.length > 0 && !previewTemplate) {
                const defaultT = tplList.find(t => t.isDefault) || tplList[0];
                setPreviewTemplate(defaultT);
            }
        } catch (err) {
            console.error('Failed to fetch certificate management data:', err);
            toast.error('Failed to load certificate records.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    // Filtered Requests
    const filteredRequests = useMemo(() => {
        const safeReqs = Array.isArray(requests) ? requests : [];
        return safeReqs.filter(req => {
            if (!req) return false;
            const matchStatus = requestFilter === 'ALL' || req.status === requestFilter;
            const searchLower = (requestSearch || '').toLowerCase();
            const matchSearch =
                !requestSearch ||
                (req.fullName && req.fullName.toLowerCase().includes(searchLower)) ||
                (req.user?.name && req.user.name.toLowerCase().includes(searchLower)) ||
                (req.user?.email && req.user.email.toLowerCase().includes(searchLower)) ||
                (req.playlist?.name && req.playlist.name.toLowerCase().includes(searchLower));
            return matchStatus && matchSearch;
        });
    }, [requests, requestFilter, requestSearch]);

    // Filtered Issued Certificates
    const filteredIssuedCerts = useMemo(() => {
        const safeCerts = Array.isArray(issuedCerts) ? issuedCerts : [];
        return safeCerts.filter(cert => {
            if (!cert) return false;
            const searchLower = (issuedSearch || '').toLowerCase();
            return (
                !issuedSearch ||
                (cert.certificate_id && cert.certificate_id.toLowerCase().includes(searchLower)) ||
                (cert.user?.name && cert.user.name.toLowerCase().includes(searchLower)) ||
                (cert.user?.email && cert.user.email.toLowerCase().includes(searchLower)) ||
                (cert.playlist?.name && cert.playlist.name.toLowerCase().includes(searchLower))
            );
        });
    }, [issuedCerts, issuedSearch]);

    // Open Review Modal
    const handleOpenReview = (request, defaultAction = 'approve') => {
        setSelectedRequest(request);
        setReviewAction(defaultAction);
        setRecipientNameOverride(request.fullName || request.user?.name || '');
        setAdminNotes(request.adminNotes || '');
        setRejectionReason('');

        const defaultTemp = templates.find(t => t.isDefault) || templates[0];
        setSelectedTemplateId(request.templateId ? request.templateId.toString() : (defaultTemp ? defaultTemp.id.toString() : ''));
        setIsReviewModalOpen(true);
    };

    // Submit Approval or Rejection
    const handleProcessRequest = async () => {
        if (!selectedRequest) return;
        setProcessingAction(true);

        try {
            const headers = { Authorization: `Bearer ${token}` };

            if (reviewAction === 'approve') {
                const res = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/requests/${selectedRequest.id}/approve`,
                    {
                        templateId: selectedTemplateId ? parseInt(selectedTemplateId) : null,
                        recipientName: recipientNameOverride,
                        adminNotes
                    },
                    { headers }
                );

                toast.success('Certificate officially approved and minted!');
            } else {
                if (!rejectionReason.trim()) {
                    toast.error('Please specify a rejection reason.');
                    setProcessingAction(false);
                    return;
                }

                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/requests/${selectedRequest.id}/reject`,
                    {
                        reason: rejectionReason,
                        adminNotes
                    },
                    { headers }
                );

                toast.success('Certificate request rejected.');
            }

            setIsReviewModalOpen(false);
            fetchData(true);
        } catch (err) {
            console.error('Error processing request:', err);
            toast.error(err.response?.data?.error || 'Action failed.');
        } finally {
            setProcessingAction(false);
        }
    };

    // Revoke Certificate
    const handleRevokeCert = async (certId) => {
        const confirmed = await confirm({
            title: 'Revoke Certificate',
            message: 'Are you sure you want to revoke this verified certificate? The public verification page will mark it as revoked.',
            confirmText: 'Revoke',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/certificates/${certId}/revoke`,
                {},
                { headers }
            );
            toast.success('Certificate revoked successfully.');
            fetchData(true);
        } catch (err) {
            console.error('Revoke error:', err);
            toast.error('Failed to revoke certificate.');
        }
    };

    // Open Create Template Modal
    const handleOpenCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            name: '',
            slug: '',
            description: '',
            layout: 'classic',
            primaryColor: '#1e293b',
            accentColor: '#f59e0b',
            textColor: '#0f172a',
            backgroundColor: '#ffffff',
            titleText: 'CERTIFICATE OF ACHIEVEMENT',
            subtitleText: 'THIS IS OFFICIALLY PRESENTED TO',
            bodyText: 'for successfully mastering the curriculum and passing the comprehensive examination for',
            issuerName: 'LearnProof Academy',
            issuerTitle: 'Global Certification Authority',
            signatoryName: 'Academic Director',
            signatoryTitle: 'Head of Certifications',
            sealText: 'VERIFIED',
            isDefault: false
        });
        setIsTemplateModalOpen(true);
    };

    // Open Edit Template Modal
    const handleOpenEditTemplate = (tmpl) => {
        setEditingTemplate(tmpl);
        setTemplateForm({
            name: tmpl.name,
            slug: tmpl.slug,
            description: tmpl.description || '',
            layout: tmpl.layout || 'classic',
            primaryColor: tmpl.primaryColor || '#1e293b',
            accentColor: tmpl.accentColor || '#f59e0b',
            textColor: tmpl.textColor || '#0f172a',
            backgroundColor: tmpl.backgroundColor || '#ffffff',
            titleText: tmpl.titleText || 'CERTIFICATE OF ACHIEVEMENT',
            subtitleText: tmpl.subtitleText || 'THIS IS OFFICIALLY PRESENTED TO',
            bodyText: tmpl.bodyText || '',
            issuerName: tmpl.issuerName || 'LearnProof Academy',
            issuerTitle: tmpl.issuerTitle || 'Global Certification Authority',
            signatoryName: tmpl.signatoryName || 'Academic Director',
            signatoryTitle: tmpl.signatoryTitle || 'Head of Certifications',
            sealText: tmpl.sealText || 'VERIFIED',
            isDefault: Boolean(tmpl.isDefault)
        });
        setIsTemplateModalOpen(true);
    };

    // Save Template (Create or Update)
    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        setSavingTemplate(true);

        try {
            const headers = { Authorization: `Bearer ${token}` };

            if (editingTemplate) {
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/templates/${editingTemplate.id}`,
                    templateForm,
                    { headers }
                );
                toast.success('Certificate template updated!');
            } else {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/templates`,
                    templateForm,
                    { headers }
                );
                toast.success('Certificate template created!');
            }

            setIsTemplateModalOpen(false);
            fetchData(true);
        } catch (err) {
            console.error('Error saving template:', err);
            toast.error(err.response?.data?.error || 'Failed to save template.');
        } finally {
            setSavingTemplate(false);
        }
    };

    // Set Template as Default
    const handleSetDefaultTemplate = async (tmpl) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/certificates/admin/templates/${tmpl.id}`,
                { isDefault: true },
                { headers }
            );
            toast.success(`"${tmpl.name}" is now the default template.`);
            fetchData(true);
        } catch (err) {
            console.error('Set default error:', err);
            toast.error('Failed to set default template.');
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Title & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Award size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Certificate Management & Governance
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Verify learner assessments, approve certificates, and design credential templates.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>

                    {activeTab === 'templates' && (
                        <button
                            onClick={handleOpenCreateTemplate}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                        >
                            <Plus size={15} />
                            <span>New Template</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pending Requests</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        {stats.pendingRequests}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Awaiting admin review</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Issued</span>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                            <ShieldCheck size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-green-600 dark:text-green-400">
                        {stats.totalIssued}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Verified certificates</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Approved Total</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <CheckCircle size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {stats.approvedRequests}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Overall approved</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Design Templates</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <Palette size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                        {templates.length}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Custom styles available</p>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6 px-1">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'requests'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Clock size={16} />
                    <span>Certificate Requests</span>
                    {stats.pendingRequests > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white">
                            {stats.pendingRequests}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('issued')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'issued'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Award size={16} />
                    <span>Issued Credentials</span>
                    <span className="text-xs font-normal text-gray-400">({issuedCerts.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('templates')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'templates'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Palette size={16} />
                    <span>Certificate Templates</span>
                    <span className="text-xs font-normal text-gray-400">({templates.length})</span>
                </button>
            </div>

            {/* TAB 1: CERTIFICATE REQUESTS */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                            {[
                                { id: 'ALL', label: 'All Requests' },
                                { id: 'PENDING', label: 'Pending Review' },
                                { id: 'APPROVED', label: 'Approved' },
                                { id: 'REJECTED', label: 'Rejected' }
                            ].map(pill => (
                                <button
                                    key={pill.id}
                                    onClick={() => setRequestFilter(pill.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                        requestFilter === pill.id
                                            ? 'bg-orange-500 text-white shadow-xs'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={requestSearch}
                                onChange={(e) => setRequestSearch(e.target.value)}
                                placeholder="Search learner or course..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Table / List */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xs">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs text-gray-400 font-bold">Loading requests...</p>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="py-20 text-center px-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mx-auto mb-3">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">No requests found</h3>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    {requestFilter === 'PENDING'
                                        ? 'All caught up! No pending certificate requests require review right now.'
                                        : 'No certificate requests matched your search criteria.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="py-3.5 px-4">Learner</th>
                                            <th className="py-3.5 px-4">Course / Specialization</th>
                                            <th className="py-3.5 px-4 text-center">Score</th>
                                            <th className="py-3.5 px-4">Requested Date</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredRequests.map((req) => {
                                            const isPending = req.status === 'PENDING';
                                            const isApproved = req.status === 'APPROVED';
                                            const isRejected = req.status === 'REJECTED';

                                            return (
                                                <tr key={req.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                                                    {/* Learner Info */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {req.user?.profile_pic ? (
                                                                <img
                                                                    src={req.user.profile_pic}
                                                                    alt={req.user.name}
                                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 font-bold flex items-center justify-center">
                                                                    {req.user?.name?.charAt(0) || 'U'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white">
                                                                    {req.fullName || req.user?.name}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400">
                                                                    {req.user?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Course / Playlist */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-xs">
                                                            {req.playlist?.name || 'Combined Specialization'}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                            <BookOpen size={11} />
                                                            <span>{req.playlist?.videos?.length || 1} video lessons</span>
                                                        </div>
                                                    </td>

                                                    {/* Score */}
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-xs">
                                                            {req.score ? `${Math.round(req.score)}%` : 'Passed'}
                                                        </span>
                                                    </td>

                                                    {/* Requested Date */}
                                                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                                                        {new Date(req.created_at).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="py-3.5 px-4">
                                                        {isPending && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                                                <Clock size={11} />
                                                                Pending Review
                                                            </span>
                                                        )}
                                                        {isApproved && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                                                <CheckCircle size={11} />
                                                                Approved
                                                            </span>
                                                        )}
                                                        {isRejected && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                                                <XCircle size={11} />
                                                                Rejected
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        {isPending ? (
                                                            <button
                                                                onClick={() => handleOpenReview(req, 'approve')}
                                                                className="px-3 py-1.5 bg-orange-500 text-white rounded-xl font-bold text-[11px] hover:bg-orange-600 shadow-xs transition-all"
                                                            >
                                                                Review & Verify
                                                            </button>
                                                        ) : isApproved && req.certificate ? (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <a
                                                                    href={getCertificatePdfUrl(req.certificate)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40"
                                                                    title="View PDF"
                                                                >
                                                                    <Download size={14} />
                                                                </a>
                                                                <a
                                                                    href={`/verify/${req.certificate.certificate_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 text-gray-500 hover:text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40"
                                                                    title="Public Verify Page"
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-gray-400 italic">
                                                                {req.rejectionReason ? `Reason: ${req.rejectionReason.slice(0, 20)}...` : 'Resolved'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: ISSUED CERTIFICATES */}
            {activeTab === 'issued' && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="relative w-full sm:w-80">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={issuedSearch}
                                onChange={(e) => setIssuedSearch(e.target.value)}
                                placeholder="Search by Certificate ID, Student, or Course..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        <div className="text-xs text-gray-500">
                            Showing <span className="font-bold text-gray-900 dark:text-white">{filteredIssuedCerts.length}</span> issued credentials
                        </div>
                    </div>

                    {/* Issued Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xs">
                        {filteredIssuedCerts.length === 0 ? (
                            <div className="py-20 text-center px-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mx-auto mb-3">
                                    <Award size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">No issued certificates found</h3>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    Approved certificates will show up here along with their unique verification links and PDF documents.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="py-3.5 px-4">Certificate ID</th>
                                            <th className="py-3.5 px-4">Recipient</th>
                                            <th className="py-3.5 px-4">Course</th>
                                            <th className="py-3.5 px-4">Template</th>
                                            <th className="py-3.5 px-4">Issued At</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Links & Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredIssuedCerts.map((cert) => (
                                            <tr key={cert.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                                                {/* Cert ID */}
                                                <td className="py-3.5 px-4 font-mono text-[11px] text-gray-800 dark:text-gray-200">
                                                    {cert.certificate_id.slice(0, 8)}...
                                                </td>

                                                {/* Recipient */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900 dark:text-white">
                                                        {cert.request?.fullName || cert.user?.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {cert.user?.email}
                                                    </div>
                                                </td>

                                                {/* Course */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-xs">
                                                        {cert.playlist?.name || 'Specialization Course'}
                                                    </div>
                                                </td>

                                                {/* Template */}
                                                <td className="py-3.5 px-4">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-semibold">
                                                        {cert.template?.name || 'Classic Academic'}
                                                    </span>
                                                </td>

                                                {/* Issued At */}
                                                <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                                                    {new Date(cert.issued_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                            cert.status === 'ACTIVE'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {cert.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={getCertificatePdfUrl(cert)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 text-gray-600 hover:text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40"
                                                            title="Download PDF"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                        <a
                                                            href={`/verify/${cert.certificate_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 text-gray-600 hover:text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40"
                                                            title="Public Verification Link"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                        {cert.status === 'ACTIVE' && (
                                                            <button
                                                                onClick={() => handleRevokeCert(cert.id)}
                                                                className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                title="Revoke Certificate"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: CERTIFICATE TEMPLATES */}
            {activeTab === 'templates' && (
                <div className="space-y-6">
                    {/* Gallery and Preview Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Templates List (Left Column) */}
                        <div className="lg:col-span-5 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Available Templates ({templates.length})
                                </h3>
                                <button
                                    onClick={handleOpenCreateTemplate}
                                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                                >
                                    <Plus size={14} />
                                    <span>New Template</span>
                                </button>
                            </div>

                            {templates.map((tmpl) => {
                                const isSelected = previewTemplate?.id === tmpl.id;
                                return (
                                    <div
                                        key={tmpl.id}
                                        onClick={() => setPreviewTemplate(tmpl)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-500 shadow-sm'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                        {tmpl.name}
                                                    </span>
                                                    {tmpl.isDefault && (
                                                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <Star size={9} fill="currentColor" />
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                                    {tmpl.description || `Layout: ${tmpl.layout}`}
                                                </p>
                                            </div>

                                            {/* Color Palette Indicators */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span
                                                    className="w-4 h-4 rounded-full border border-white shadow-2xs"
                                                    style={{ backgroundColor: tmpl.primaryColor }}
                                                    title={`Primary: ${tmpl.primaryColor}`}
                                                />
                                                <span
                                                    className="w-4 h-4 rounded-full border border-white shadow-2xs"
                                                    style={{ backgroundColor: tmpl.accentColor }}
                                                    title={`Accent: ${tmpl.accentColor}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                                            <span className="text-[10px] font-mono text-gray-400 uppercase">
                                                Style: {tmpl.layout}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {!tmpl.isDefault && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetDefaultTemplate(tmpl);
                                                        }}
                                                        className="text-[10px] font-bold text-gray-500 hover:text-amber-500"
                                                    >
                                                        Set Default
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEditTemplate(tmpl);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-orange-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Interactive Template Preview (Right Column) */}
                        <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Eye size={18} className="text-orange-500" />
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                            Live Certificate Preview: {previewTemplate?.name || 'Selected Template'}
                                        </h3>
                                    </div>
                                    {previewTemplate && (
                                        <button
                                            onClick={() => handleOpenEditTemplate(previewTemplate)}
                                            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                                        >
                                            <Edit3 size={13} />
                                            <span>Customize Template</span>
                                        </button>
                                    )}
                                </div>

                                {/* Render Certificate Preview component */}
                                <div className="max-w-xl mx-auto my-2">
                                    <CertificatePreview
                                        userName="Alex M. Harrison"
                                        courseName="Advanced Systems Architecture & Cloud Engineering"
                                        date={new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        certId="LP-PREVIEW-2026"
                                        template={previewTemplate}
                                    />
                                </div>
                            </div>

                            {/* Template details footer */}
                            {previewTemplate && (
                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Layout</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{previewTemplate.layout}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Authority</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">{previewTemplate.issuerName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Signatory</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{previewTemplate.signatoryName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Seal Text</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{previewTemplate.sealText}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Review & Approve / Reject Certificate Request */}
            {isReviewModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                        Verify & Issue Certificate
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Review learner credentials, select certificate template, and finalize approval.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Learner & Course Summary Card */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Learner Name</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedRequest.user?.name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Email Address</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 truncate block">{selectedRequest.user?.email}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Course Playlist</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 truncate block">{selectedRequest.playlist?.name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Quiz Result</span>
                                    <span className="font-black text-green-600 dark:text-green-400">
                                        {selectedRequest.score ? `${Math.round(selectedRequest.score)}% (Passed)` : 'Passed'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Request Date</span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {new Date(selectedRequest.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Learner XP</span>
                                    <span className="text-orange-500 font-bold">{selectedRequest.user?.xp || 0} XP</span>
                                </div>
                            </div>

                            {/* User notes if any */}
                            {selectedRequest.userNotes && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                                    <span className="font-bold block mb-0.5">Learner Note:</span>
                                    {selectedRequest.userNotes}
                                </div>
                            )}

                            {/* Action Choice: Approve or Reject */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                                    Action Decision
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('approve')}
                                        className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            reviewAction === 'approve'
                                                ? 'bg-green-50 dark:bg-green-950/40 border-green-500 text-green-700 dark:text-green-400 shadow-xs'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500'
                                        }`}
                                    >
                                        <CheckCircle size={16} />
                                        <span>Approve & Mint Certificate</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('reject')}
                                        className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            reviewAction === 'reject'
                                                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-400 shadow-xs'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500'
                                        }`}
                                    >
                                        <XCircle size={16} />
                                        <span>Reject Request</span>
                                    </button>
                                </div>
                            </div>

                            {reviewAction === 'approve' ? (
                                <>
                                    {/* Name Override */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            Recipient Name to Print on Certificate
                                        </label>
                                        <input
                                            type="text"
                                            value={recipientNameOverride}
                                            onChange={(e) => setRecipientNameOverride(e.target.value)}
                                            placeholder="Enter legal / official name"
                                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    {/* Template Selection */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            Choose Certificate Design Template
                                        </label>
                                        <select
                                            value={selectedTemplateId}
                                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                        >
                                            {templates.map(tmpl => (
                                                <option key={tmpl.id} value={tmpl.id}>
                                                    {tmpl.name} ({tmpl.layout}) {tmpl.isDefault ? '— Default' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Admin Notes */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            Admin Notes (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Internal remarks or approval record"
                                            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Rejection Reason */}
                                    <div>
                                        <label className="text-xs font-bold text-red-600 dark:text-red-400 block mb-1">
                                            Rejection Reason (Will be sent to student inbox) *
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                            placeholder="e.g. Please complete the remaining course lessons or ensure your full legal name is provided."
                                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-red-300 dark:border-red-900 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                            Internal Admin Notes (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Internal rationale"
                                            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsReviewModalOpen(false)}
                                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleProcessRequest}
                                disabled={processingAction}
                                className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 flex items-center gap-2 ${
                                    reviewAction === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                                }`}
                            >
                                {processingAction ? (
                                    <span>Processing...</span>
                                ) : reviewAction === 'approve' ? (
                                    <>
                                        <ShieldCheck size={16} />
                                        <span>Confirm Approval & Issue</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={16} />
                                        <span>Confirm Rejection</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Create / Edit Template */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                    <Palette size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                        {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Certificate Template'}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Customize typography, layout geometry, colors, and signatories.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveTemplate} className="overflow-y-auto flex-1 p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                        Template Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                        placeholder="e.g. Royal Gold Academic"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                        Slug Identifier *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={templateForm.slug}
                                        onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })}
                                        placeholder="e.g. royal-gold-academic"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                        Layout Archetype
                                    </label>
                                    <select
                                        value={templateForm.layout}
                                        onChange={(e) => setTemplateForm({ ...templateForm, layout: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="classic">Classic Academic (Dual Border & Corners)</option>
                                        <option value="modern">Modern Tech (Top Accent Ribbon & Badge)</option>
                                        <option value="executive">Royal Executive (Triple Luxury Border)</option>
                                        <option value="minimal">Minimalist (Clean Accent Frame)</option>
                                    </select>
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={templateForm.isDefault}
                                            onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-4 h-4"
                                        />
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            Set as Default Template for New Issuances
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Colors Grid */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 space-y-3">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                                    Color Palette
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-semibold block mb-1">Primary Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={templateForm.primaryColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, primaryColor: e.target.value })}
                                                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0"
                                            />
                                            <input
                                                type="text"
                                                value={templateForm.primaryColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, primaryColor: e.target.value })}
                                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 font-semibold block mb-1">Accent Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={templateForm.accentColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, accentColor: e.target.value })}
                                                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0"
                                            />
                                            <input
                                                type="text"
                                                value={templateForm.accentColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, accentColor: e.target.value })}
                                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 font-semibold block mb-1">Text Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={templateForm.textColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, textColor: e.target.value })}
                                                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0"
                                            />
                                            <input
                                                type="text"
                                                value={templateForm.textColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, textColor: e.target.value })}
                                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 font-semibold block mb-1">Background</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={templateForm.backgroundColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, backgroundColor: e.target.value })}
                                                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0"
                                            />
                                            <input
                                                type="text"
                                                value={templateForm.backgroundColor}
                                                onChange={(e) => setTemplateForm({ ...templateForm, backgroundColor: e.target.value })}
                                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Typography & Copy */}
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                                    Certificate Copy & Headers
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-semibold block mb-1">Title Heading</label>
                                        <input
                                            type="text"
                                            value={templateForm.titleText}
                                            onChange={(e) => setTemplateForm({ ...templateForm, titleText: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 font-semibold block mb-1">Subtitle Line</label>
                                        <input
                                            type="text"
                                            value={templateForm.subtitleText}
                                            onChange={(e) => setTemplateForm({ ...templateForm, subtitleText: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-500 font-semibold block mb-1">Body Text / Accreditation Statement</label>
                                    <textarea
                                        value={templateForm.bodyText}
                                        onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                                        rows={2}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            {/* Authority & Signatory */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Issuer Authority Name</label>
                                    <input
                                        type="text"
                                        value={templateForm.issuerName}
                                        onChange={(e) => setTemplateForm({ ...templateForm, issuerName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Signatory Name</label>
                                    <input
                                        type="text"
                                        value={templateForm.signatoryName}
                                        onChange={(e) => setTemplateForm({ ...templateForm, signatoryName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Signatory Official Title</label>
                                    <input
                                        type="text"
                                        value={templateForm.signatoryTitle}
                                        onChange={(e) => setTemplateForm({ ...templateForm, signatoryTitle: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Seal Stamp Text</label>
                                    <input
                                        type="text"
                                        value={templateForm.sealText}
                                        onChange={(e) => setTemplateForm({ ...templateForm, sealText: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            {/* Live Miniature Preview in Modal */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-2xl">
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-2 text-center">Form Design Preview</span>
                                <div className="max-w-md mx-auto">
                                    <CertificatePreview
                                        userName="Sample Learner"
                                        courseName="Sample Course Specialization"
                                        date={new Date().toLocaleDateString()}
                                        certId="PREVIEW-MOCK"
                                        template={templateForm}
                                    />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTemplate}
                                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                                >
                                    {savingTemplate ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCertificates;
