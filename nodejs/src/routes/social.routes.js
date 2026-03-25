const express = require('express');
const router = express.Router();
const multer = require('multer');
const socialController = require('../controllers/social.controller');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({ dest: 'media/video_notes/' });

router.get('/note', authMiddleware, socialController.getNote);
router.post('/note', authMiddleware, upload.array('new_files'), socialController.saveNote);
router.get('/comments', authMiddleware, socialController.getComments);
router.post('/comments', authMiddleware, socialController.postComment);
router.delete('/comments', authMiddleware, socialController.deleteComment);
router.get('/intuition', authMiddleware, socialController.getIntuition);

module.exports = router;
