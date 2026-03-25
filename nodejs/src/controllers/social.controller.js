const prisma = require('../lib/prisma');
const { generateIntuition } = require('../services/ai.service');
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
                data: { noteId: note.id, file: file.path }
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
    const { videoId } = req.query;

    try {
        const cacheKey = `video:intuition:${videoId}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.status(200).json(cached);

        let intuition = await prisma.videoIntuition.findUnique({ where: { vid: videoId } });

        if (!intuition) {
            const video = await prisma.video.findFirst({ where: { vid: videoId } });
            const title = video ? video.name : 'Unknown Title';
            const description = video ? video.description : 'No description available.';
            const url = video ? video.url : null;

            const { content, isSystemFallback, model_name } = await generateIntuition(title, description, url);

            // Only cache if it's a real generation, not a hardcoded system fallback
            if (!isSystemFallback) {
                intuition = await prisma.videoIntuition.upsert({
                    where: { vid: videoId },
                    update: { content, model_name },
                    create: { vid: videoId, content, model_name }
                });
            } else {
                // If system fallback, return without saving (allows retry next time)
                return res.status(200).json({ vid: videoId, content, model_name });
            }
        }

        await cacheService.set(cacheKey, intuition, 86400); // 24 hours for intuition

        res.status(200).json(intuition);
    } catch (error) {
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
