const express = require('express');
const router = express.Router();
const { authMiddleware, isAdminMiddleware } = require('../middleware/auth');
const datingAuth = require('../middleware/datingAuth');
const multer = require('multer');

const authController = require('../controllers/auth.controller');
const youtubeController = require('../controllers/youtube.controller');
const learningController = require('../controllers/learning.controller');
const classroomController = require('../controllers/classroom.controller');
const socialController = require('../controllers/social.controller');
const quizController = require('../controllers/quiz.controller');
const adminController = require('../controllers/admin.controller');
const messageController = require('../controllers/message.controller');
const fcmController = require('../controllers/fcm.controller');
const livekitController = require('../controllers/livekit.controller');
const metricsController = require('../controllers/metrics.controller');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'media/video_notes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = require('path').extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

const appStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'apps/');
    },
    filename: (req, file, cb) => {
        const platform = req.query.platform;
        if (platform === 'macos') {
            cb(null, 'LearnProof-AI.dmg');
        } else if (platform === 'windows') {
            cb(null, 'LearnProof-AI.exe');
        } else {
            cb(null, file.originalname);
        }
    }
});
const uploadApp = multer({ storage: appStorage });

// Auth
router.get('/public-stats', authController.getPublicStats);
router.post('/signup/', authMiddleware, authController.loginOrRegister);
router.post('/login/', authMiddleware, authController.loginOrRegister);
router.post('/oauth-login/', authMiddleware, authController.loginOrRegister);
router.post('/profile/', authMiddleware, authController.getProfile);
router.post('/save-fcm-token', authMiddleware, fcmController.saveFcmToken);
router.get('/auth/admin-check', authMiddleware, isAdminMiddleware, (req, res) => {
    res.status(200).json({ isAdmin: true });
});

// Anonymous Push and Metrics
router.post('/v1/devices/anonymous-token', fcmController.saveAnonymousFcmToken);
router.post('/v1/metrics/app-launch', metricsController.logAppLaunch);

// YouTube
router.post('/import/', authMiddleware, youtubeController.importMetadata);
router.post('/youtube-search/', authMiddleware, youtubeController.search);
router.post('/youtube-autocomplete/', authMiddleware, youtubeController.autocomplete);
router.post('/recommend-playlists/', authMiddleware, youtubeController.recommendPlaylists);

// Learning
router.post('/save-learning/', authMiddleware, learningController.saveLearning);
router.post('/my-learnings/', authMiddleware, learningController.getMyLearnings);
router.post('/delete-video/', authMiddleware, learningController.deleteVideo);
router.post('/delete-playlist/', authMiddleware, learningController.deletePlaylist);
router.post('/playlist-detail/', authMiddleware, learningController.getPlaylistDetail);
router.post('/set-playlist-goal/', authMiddleware, learningController.setPlaylistGoal);

// Classroom & Progress
router.post('/continue-watch/', authMiddleware, classroomController.getContinueWatching);
router.post('/complete/', authMiddleware, classroomController.getCompletedLearnings);
router.post('/classroom/', authMiddleware, classroomController.getClassroomVideo);
router.post('/mark-completed/', authMiddleware, classroomController.markVideoCompleted);
router.post('/unmark-completed/', authMiddleware, classroomController.unmarkVideoCompleted);
router.post('/update-progress/', authMiddleware, classroomController.updateProgress);

// Social
router.get('/video-note/', authMiddleware, socialController.getNote);
router.post('/video-note/', upload.array('new_files'), authMiddleware, socialController.saveNote);
router.get('/video-comment/', authMiddleware, socialController.getComments);
router.post('/video-comment/', authMiddleware, socialController.postComment);
router.delete('/video-comment/', authMiddleware, socialController.deleteComment);
router.get('/video-intuition/', authMiddleware, socialController.getIntuition);

// Quiz & Engagement
router.post('/quiz-list/', authMiddleware, quizController.getQuizList);
router.post('/start-quiz/', authMiddleware, quizController.startQuiz);
router.post('/submit-quiz/', authMiddleware, quizController.submitQuiz);
router.post('/certs/', authMiddleware, quizController.getCertificates);
router.post('/activity/', authMiddleware, quizController.getActivityGraph);
router.get('/quiz-history/', authMiddleware, quizController.getQuizHistory);
router.get('/quiz-history/:id', authMiddleware, quizController.getQuizHistoryDetails);
router.delete('/quiz-history/:id', authMiddleware, quizController.deleteQuizHistory);
router.get('/verify-certificate/:certId', quizController.verifyCertificate);

// Admin Routes
router.get('/admin/stats', authMiddleware, isAdminMiddleware, adminController.getDashboardStats);
router.get('/admin/analytics', authMiddleware, isAdminMiddleware, adminController.getAnalyticsData);
router.get('/admin/users', authMiddleware, isAdminMiddleware, adminController.getUsers);
router.get('/admin/users/:id', authMiddleware, isAdminMiddleware, adminController.getUserDetails);
router.delete('/admin/users/:id', authMiddleware, isAdminMiddleware, adminController.deleteUser);
router.get('/admin/content', authMiddleware, isAdminMiddleware, adminController.getContent);
router.delete('/admin/content/:id', authMiddleware, isAdminMiddleware, adminController.deleteContent);
router.post('/admin/send-push', authMiddleware, isAdminMiddleware, fcmController.sendExplicitPush);
router.post('/admin/send-push/', authMiddleware, isAdminMiddleware, fcmController.sendExplicitPush);
router.get('/admin/notification-templates', authMiddleware, isAdminMiddleware, fcmController.getNotificationTemplates);
router.post('/admin/notification-templates', authMiddleware, isAdminMiddleware, fcmController.updateNotificationTemplate);
router.post('/admin/notification-templates/', authMiddleware, isAdminMiddleware, fcmController.updateNotificationTemplate);

// Admin Desktop App Releases
router.get('/admin/apps', authMiddleware, isAdminMiddleware, adminController.getApps);
router.post('/admin/apps/upload', authMiddleware, isAdminMiddleware, uploadApp.single('appFile'), adminController.uploadAppFile);

// Messages & Inbox
router.post('/messages/send/', authMiddleware, isAdminMiddleware, messageController.sendMessage);
router.post('/messages/inbox/', authMiddleware, messageController.getMessages);
router.post('/messages/sent/', authMiddleware, isAdminMiddleware, messageController.getAdminSentMessages);
router.post('/messages/mark-read/', authMiddleware, messageController.markRead);
router.post('/messages/delete/', authMiddleware, isAdminMiddleware, messageController.deleteMessage);
router.get('/messages/users/', authMiddleware, isAdminMiddleware, messageController.getAllUsers);

// Support
const supportRoutes = require('./support.routes');
router.use('/support', supportRoutes);

// Workspaces
const workspaceRoutes = require('./workspace.routes');
router.use('/workspaces', workspaceRoutes);

// LiveKit — Video Rooms
router.get('/livekit/token', datingAuth, livekitController.getToken);
router.get('/livekit/rooms', datingAuth, livekitController.getRooms);
router.delete('/livekit/rooms/:roomName', datingAuth, livekitController.deleteRoom);
router.get('/livekit/rooms/:roomName/participants', datingAuth, livekitController.getParticipants);
router.delete('/livekit/rooms/:roomName/participants/:identity', datingAuth, livekitController.kickParticipant);
router.post('/livekit/rooms/:roomName/participants/:identity/promote', datingAuth, livekitController.promoteParticipant);
router.post('/livekit/rooms/:roomName/participants/:identity/demote', datingAuth, livekitController.demoteParticipant);
router.post('/livekit/rooms/:roomName/stage-requests', datingAuth, livekitController.submitStageRequest);
router.get('/livekit/rooms/:roomName/stage-requests', datingAuth, livekitController.getStageRequests);
router.delete('/livekit/rooms/:roomName/stage-requests/:identity', datingAuth, livekitController.dismissStageRequest);
router.post('/livekit/translate', datingAuth, livekitController.translateText);

module.exports = router;
