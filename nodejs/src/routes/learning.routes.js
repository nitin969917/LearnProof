const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { authMiddleware } = require('../middleware/auth');

router.post('/save', authMiddleware, learningController.saveLearning);
router.post('/my-learnings', authMiddleware, learningController.getMyLearnings);
router.post('/delete-video', authMiddleware, learningController.deleteVideo);
router.post('/delete-playlist', authMiddleware, learningController.deletePlaylist);
router.post('/playlist-detail', authMiddleware, learningController.getPlaylistDetail);

module.exports = router;
