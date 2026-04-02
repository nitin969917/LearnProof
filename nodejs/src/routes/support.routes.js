const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { authMiddleware, isAdminMiddleware } = require('../middleware/auth');

// User routes
router.post('/tickets', authMiddleware, supportController.createTicket);
router.get('/tickets', authMiddleware, supportController.getUserTickets);
router.get('/tickets/:id', authMiddleware, supportController.getTicketById);
router.post('/tickets/:id/respond', authMiddleware, supportController.respondToTicket);

// Admin routes
router.get('/admin/tickets', authMiddleware, isAdminMiddleware, supportController.getAllTickets);
router.patch('/admin/tickets/:id', authMiddleware, isAdminMiddleware, supportController.updateTicket);

module.exports = router;
