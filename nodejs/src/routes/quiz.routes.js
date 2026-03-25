const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authMiddleware } = require('../middleware/auth');

router.post('/list', authMiddleware, quizController.getQuizList);
router.post('/start', authMiddleware, quizController.startQuiz);
router.post('/submit', authMiddleware, quizController.submitQuiz);
router.post('/certificates', authMiddleware, quizController.getCertificates);
router.post('/activity-graph', authMiddleware, quizController.getActivityGraph);
router.get('/history', authMiddleware, quizController.getQuizHistory);

module.exports = router;
