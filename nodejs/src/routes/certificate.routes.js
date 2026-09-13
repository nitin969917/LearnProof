const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authMiddleware, isAdminMiddleware } = require('../middleware/auth');

// ── User Certificate Routes ──
router.post('/request', authMiddleware, certificateController.requestCertificate);
router.get('/my-requests', authMiddleware, certificateController.getMyRequests);
router.get('/my-certificates', authMiddleware, certificateController.getMyCertificates);
router.get('/templates', authMiddleware, certificateController.getTemplates);

// ── Public PDF Streaming & Verification Download ──
router.get('/:certId/pdf', certificateController.getCertificatePdf);
router.get('/pdf/:certId', certificateController.getCertificatePdf);

// ── Admin Certificate Management Routes ──
router.get('/admin/stats', authMiddleware, isAdminMiddleware, certificateController.getAdminCertificateStats);
router.get('/admin/requests', authMiddleware, isAdminMiddleware, certificateController.getAdminRequests);
router.post('/admin/requests/:id/approve', authMiddleware, isAdminMiddleware, certificateController.approveCertificateRequest);
router.post('/admin/requests/:id/reject', authMiddleware, isAdminMiddleware, certificateController.rejectCertificateRequest);
router.get('/admin/certificates', authMiddleware, isAdminMiddleware, certificateController.getAdminCertificates);
router.post('/admin/certificates/:id/revoke', authMiddleware, isAdminMiddleware, certificateController.revokeCertificate);
router.get('/admin/templates', authMiddleware, isAdminMiddleware, certificateController.getTemplates);
router.post('/admin/templates', authMiddleware, isAdminMiddleware, certificateController.createAdminTemplate);
router.put('/admin/templates/:id', authMiddleware, isAdminMiddleware, certificateController.updateAdminTemplate);
router.delete('/admin/templates/:id', authMiddleware, isAdminMiddleware, certificateController.deleteAdminTemplate);

module.exports = router;
