const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroom.controller');
const { authMiddleware } = require('../middleware/auth');

router.post('/video-detail', authMiddleware, classroomController.getClassroomVideo);
router.post('/mark-completed', authMiddleware, classroomController.markVideoCompleted);
router.post('/unmark-completed', authMiddleware, classroomController.unmarkVideoCompleted);
router.post('/update-progress', authMiddleware, classroomController.updateProgress);
router.post('/continue-watching', authMiddleware, classroomController.getContinueWatching);
router.post('/completed-learnings', authMiddleware, classroomController.getCompletedLearnings);

module.exports = router;
