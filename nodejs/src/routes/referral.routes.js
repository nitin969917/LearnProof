const express = require('express');
const router = express.Router();
const { authMiddleware, isAdminMiddleware } = require('../middleware/auth');
const referralController = require('../controllers/referral.controller');

// Public: Track referral link click
router.post('/track-click', referralController.trackClick);

// Authenticated: Attribute signup to referral code
router.post('/attribute', authMiddleware, referralController.attributeReferral);

// Authenticated: Get or create student's personal referral code
router.get('/my-code', authMiddleware, referralController.getMyReferralCode);

// Admin Routes (Protected by authMiddleware + isAdminMiddleware)
router.get('/admin/stats', authMiddleware, isAdminMiddleware, referralController.getAdminReferralStats);
router.get('/admin/codes', authMiddleware, isAdminMiddleware, referralController.getAdminReferralCodes);
router.post('/admin/codes', authMiddleware, isAdminMiddleware, referralController.createAdminReferralCode);
router.put('/admin/codes/:id/toggle', authMiddleware, isAdminMiddleware, referralController.toggleReferralCodeStatus);
router.delete('/admin/codes/:id', authMiddleware, isAdminMiddleware, referralController.deleteAdminReferralCode);

module.exports = router;
