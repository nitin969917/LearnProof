const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtube.controller');
const { authMiddleware } = require('../middleware/auth');

router.post('/search', authMiddleware, youtubeController.search);
router.post('/import', authMiddleware, youtubeController.importMetadata);
router.post('/recommend-playlists', authMiddleware, youtubeController.recommendPlaylists);

module.exports = router;
