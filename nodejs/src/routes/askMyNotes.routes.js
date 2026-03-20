const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const askMyNotesController = require('../controllers/askMyNotes.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Setup multer for note uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'media', 'ask_my_notes');
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf and .txt files are allowed'));
        }
    }
});

// Subject Routes
router.get('/subjects', authMiddleware, askMyNotesController.getSubjects);
router.post('/subjects', authMiddleware, askMyNotesController.createSubject);
router.delete('/subjects/:id', authMiddleware, askMyNotesController.deleteSubject);

// Note Routes
router.get('/subjects/:id/notes', authMiddleware, askMyNotesController.getSubjectNotes);
router.post('/subjects/:id/upload', upload.single('file'), authMiddleware, askMyNotesController.uploadNote);
router.post('/subjects/:id/reindex', authMiddleware, askMyNotesController.reindexSubject);
router.get('/files/:noteId', authMiddleware, askMyNotesController.serveNoteFile);

// Chat Routes
router.post('/subjects/:id/chat', authMiddleware, askMyNotesController.chatWithNotes);
router.post('/subjects/:id/chat-stream', authMiddleware, askMyNotesController.chatWithNotesStream);
router.get('/subjects/:id/chat-history', authMiddleware, askMyNotesController.getChatHistory);
router.get('/subjects/:id/chat-sessions', authMiddleware, askMyNotesController.getChatSessions);
router.get('/subjects/:id/suggestions', authMiddleware, askMyNotesController.getSmartSuggestions);

// Quiz Routes
router.post('/subjects/:id/generate-quiz', authMiddleware, askMyNotesController.generateQuizFromNotes);

module.exports = router;
