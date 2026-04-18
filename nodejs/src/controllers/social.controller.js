const prisma = require('../lib/prisma');
const { generateIntuition, translateText } = require('../services/ai.service');
const cacheService = require('../services/cache.service');

/**
 * Social & Feedback Controller
 */
const getNote = async (req, res) => {
    const { videoId } = req.query;
    const { uid } = req.user;

    try {
        const user = req.user;
        const cacheKey = `video:note:${user.id}:${videoId}`;
        
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.status(200).json(cached);

        const note = await prisma.videoNote.findUnique({
            where: { userId_vid: { userId: user.id, vid: videoId } },
            include: { files: true }
        });

        if (!note) {
            const emptyResult = { content: '', files: [] };
            return res.status(200).json(emptyResult);
        }

        await cacheService.set(cacheKey, note, 3600);
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveNote = async (req, res) => {
    const { videoId, content, deleted_file_ids } = req.body;
    const { uid } = req.user;
    const newFiles = req.files || [];

    try {
        const user = req.user;
        const note = await prisma.videoNote.upsert({
            where: { userId_vid: { userId: user.id, vid: videoId } },
            update: { content },
            create: { userId: user.id, vid: videoId, content }
        });

        // Handle deletes
        if (deleted_file_ids) {
            const ids = JSON.parse(deleted_file_ids);
            await prisma.videoNoteFile.deleteMany({
                where: { noteId: note.id, id: { in: ids.map(id => parseInt(id)) } }
            });
        }

        // Handle new files
        for (const file of newFiles) {
            await prisma.videoNoteFile.create({
                data: { 
                    noteId: note.id, 
                    file: file.path,
                    original_name: file.originalname
                }
            });
        }

        const updatedNote = await prisma.videoNote.findUnique({
            where: { id: note.id },
            include: { files: true }
        });

        // Invalidate cache
        await cacheService.del(`video:note:${user.id}:${videoId}`);

        res.status(200).json(updatedNote);
    } catch (error) {
        console.error('Save note error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getComments = async (req, res) => {
    const { videoId } = req.query;

    try {
        const cacheKey = `video:comments:${videoId}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.status(200).json(cached);

        const comments = await prisma.videoComment.findMany({
            where: { vid: videoId, parentId: null },
            include: {
                user: true,
                replies: { include: { user: true } }
            },
            orderBy: { created_at: 'asc' }
        });

        // Map to match frontend expectations (user_name, user_picture)
        const formatted = comments.map(c => ({
            ...c,
            user_name: c.user.name,
            user_picture: c.user.profile_pic,
            user_uid: c.user.uid,
            replies: c.replies.map(r => ({
                ...r,
                user_name: r.user.name,
                user_picture: r.user.profile_pic,
                user_uid: r.user.uid
            }))
        }));

        await cacheService.set(cacheKey, formatted, 600); // 10 mins

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postComment = async (req, res) => {
    const { videoId, content, parent_id } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const comment = await prisma.videoComment.create({
            data: {
                userId: user.id,
                vid: videoId,
                content,
                parentId: parent_id ? parseInt(parent_id) : null
            },
            include: { user: true }
        });

        const result = {
            ...comment,
            user_name: comment.user.name,
            user_picture: comment.user.profile_pic,
            user_uid: comment.user.uid,
            replies: []
        };

        // Invalidate cache
        await cacheService.del(`video:comments:${videoId}`);

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteComment = async (req, res) => {
    const { commentId, videoId } = req.body; // Add videoId to body for easier cache invalidation
    const { uid } = req.user;

    try {
        const user = req.user;
        
        let vid = videoId;
        if (!vid) {
            const comment = await prisma.videoComment.findUnique({ where: { id: parseInt(commentId) } });
            vid = comment?.vid;
        }

        await prisma.videoComment.delete({
            where: { id: parseInt(commentId), userId: user.id }
        });

        // Invalidate cache
        if (vid) {
            await cacheService.del(`video:comments:${vid}`);
        }

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: 'Comment not found' });
    }
};

const getIntuition = async (req, res) => {
    const { videoId, targetLanguage } = req.query;
    const requestedLang = targetLanguage && targetLanguage !== 'auto' ? targetLanguage : 'English';

    try {
        // --- STEP 1: Check Cache for this specific language ---
        const cacheKey = `video:intuition:${videoId}:${requestedLang}`;
        const cached = await cacheService.get(cacheKey);
        if (cached && !req.query.refresh) return res.status(200).json(cached);

        // --- STEP 2: Get or Generate the English "Master" version from DB ---
        let englishIntuition = await prisma.videoIntuition.findUnique({ where: { vid: videoId } });
        
        // Force master regeneration only if missing OR generated without transcript
        const isStale = englishIntuition && !englishIntuition.transcript_used;

        if (!englishIntuition || isStale) {
            const video = await prisma.video.findFirst({ where: { vid: videoId } });
            const title = video ? video.name : 'Unknown Title';
            const description = video ? video.description : 'No description available.';
            const url = video ? video.url : null;

            console.log(`[Intuition] 🔥 Zero-to-Master English generation (from transcript) for ${videoId}...`);
            const { content, isSystemFallback, model_name, transcript_used } = await generateIntuition(title, description, url, 'English');
            const isTranscriptUsed = !!transcript_used;
            
            if (!isSystemFallback) {
                englishIntuition = await prisma.videoIntuition.upsert({
                    where: { vid: videoId },
                    update: { content, model_name, transcript_used: isTranscriptUsed },
                    create: { vid: videoId, content, model_name, transcript_used: isTranscriptUsed }
                });
            } else {
                // Return fallback early if AI failed completely
                return res.status(200).json({ vid: videoId, content, model_name, transcript_used: false });
            }
        }

        // --- STEP 3: Handle Translation if a specific language is requested ---
        if (requestedLang !== 'English') {
            console.log(`[Intuition] 🌏 Rapid FREE translation to ${requestedLang} for ${videoId}...`);
            let { content: translatedContent, model_name: translatorModel } = await translateText(englishIntuition.content, requestedLang);
            
            // If the free translator returned something suspicious (repetitive or broken), 
            // the translateText utility now throws or handles it, but we can also check here if we want.

            const result = {
                ...englishIntuition,
                content: translatedContent,
                model_name: `${englishIntuition.model_name} + ${translatorModel}`,
                language: requestedLang
            };

            await cacheService.set(cacheKey, result, 86400); 
            return res.status(200).json(result);
        }

        // --- STEP 4: Return English master ---
        await cacheService.set(cacheKey, englishIntuition, 86400); 
        res.status(200).json(englishIntuition);
    } catch (error) {
        console.error("[Intuition Error]", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getNote,
    saveNote,
    getComments,
    postComment,
    deleteComment,
    getIntuition,
};
