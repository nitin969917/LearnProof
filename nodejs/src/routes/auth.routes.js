const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

// Auth routes (all protected by firebase token)
router.post('/verify', authMiddleware, authController.loginOrRegister);
router.post('/profile', authMiddleware, authController.getProfile);

module.exports = router;
