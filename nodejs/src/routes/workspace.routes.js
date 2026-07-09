const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists at startup
const UPLOAD_DIR = path.join(__dirname, '../../media/workspaces');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('[Workspace Routes] Created upload directory:', UPLOAD_DIR);
}

// Allowed file types for document ingestion
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt', '.md', '.doc', '.csv'];
const ALLOWED_MIMETYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/octet-stream' // fallback for some OS file pickers
];

// Configure multer storage for workspace source documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'source-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(null, true);
    }
    cb(new Error(`File type "${ext}" is not supported. Allowed types: PDF, DOCX, PPTX, TXT, MD, CSV`), false);
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB file size limit
    fileFilter
});

const workspaceChatController = require('../controllers/workspaceChat.controller');
const workspaceToolsController = require('../controllers/workspaceTools.controller');

// Workspace Routing
router.get('/', authMiddleware, workspaceController.getWorkspaces);
router.post('/', authMiddleware, workspaceController.createWorkspace);
router.get('/:id', authMiddleware, workspaceController.getWorkspaceDetails);
router.delete('/:id', authMiddleware, workspaceController.deleteWorkspace);

// Knowledge Source Ingestion Routing
router.post('/:id/sources', authMiddleware, upload.single('file'), workspaceController.uploadSource);
router.delete('/:id/sources/:sourceId', authMiddleware, workspaceController.deleteSource);
router.get('/:id/sources/:sourceId/preview', authMiddleware, workspaceController.previewSource);

// Notes Routing
router.get('/:id/notes', authMiddleware, workspaceController.getNotes);
router.post('/:id/notes', authMiddleware, workspaceController.createNote);
router.put('/:id/notes/:noteId', authMiddleware, workspaceController.updateNote);
router.delete('/:id/notes/:noteId', authMiddleware, workspaceController.deleteNote);

// AI Chat Routing
router.get('/:id/chats', authMiddleware, workspaceChatController.getChats);
router.post('/:id/chats', authMiddleware, workspaceChatController.createChat);
router.get('/:id/chats/:sessionId/messages', authMiddleware, workspaceChatController.getChatMessages);
router.post('/:id/chats/:sessionId/message', authMiddleware, workspaceChatController.sendChatMessage);

// AI Workflows Routing
router.post('/:id/tools/summary', authMiddleware, workspaceToolsController.generateSummary);
router.post('/:id/tools/quiz', authMiddleware, workspaceToolsController.generateQuiz);
router.post('/:id/tools/flashcards', authMiddleware, workspaceToolsController.generateFlashcards);

module.exports = router;
