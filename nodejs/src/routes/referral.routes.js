const express = require('express');
const router = express.Router();
const { authMiddleware, isAdminMiddleware } = require('../middleware/auth');
const referralController = require('../controllers/referral.controller');

// Public: Track referral link click, leaderboard, and public program info
router.post('/track-click', referralController.trackClick);
router.get('/leaderboard', referralController.getLeaderboard);
router.get('/public-info', referralController.getPublicProgramInfo);

// Authenticated: Attribute signup to referral code
router.post('/attribute', authMiddleware, referralController.attributeReferral);

// Authenticated: Get, create, or customize student's personal ambassador referral code
router.get('/my-code', authMiddleware, referralController.getMyReferralCode);
router.put('/my-code', authMiddleware, referralController.updateMyReferralCode);

// Admin Routes (Protected by authMiddleware + isAdminMiddleware)
router.get('/admin/stats', authMiddleware, isAdminMiddleware, referralController.getAdminReferralStats);
router.get('/admin/codes', authMiddleware, isAdminMiddleware, referralController.getAdminReferralCodes);
router.post('/admin/codes', authMiddleware, isAdminMiddleware, referralController.createAdminReferralCode);
router.put('/admin/codes/:id', authMiddleware, isAdminMiddleware, referralController.updateAdminReferralCode);
router.put('/admin/codes/:id/toggle', authMiddleware, isAdminMiddleware, referralController.toggleReferralCodeStatus);
router.delete('/admin/codes/:id', authMiddleware, isAdminMiddleware, referralController.deleteAdminReferralCode);

// Admin: Ambassador Groups & Cohorts Management
router.get('/admin/groups', authMiddleware, isAdminMiddleware, referralController.getAdminAmbassadorGroups);
router.post('/admin/groups', authMiddleware, isAdminMiddleware, referralController.createAdminAmbassadorGroup);
router.get('/admin/groups/:id', authMiddleware, isAdminMiddleware, referralController.getAdminAmbassadorGroupDetails);
router.put('/admin/groups/:id', authMiddleware, isAdminMiddleware, referralController.updateAdminAmbassadorGroup);
router.delete('/admin/groups/:id', authMiddleware, isAdminMiddleware, referralController.deleteAdminAmbassadorGroup);
router.get('/admin/colleges', authMiddleware, isAdminMiddleware, referralController.getAdminCollegesPerformance);

module.exports = router;

