const prisma = require('../lib/prisma');
const datingPrisma = require('../utils/datingPrisma');
const { generateIntuition, translateText, answerVideoDoubt } = require('../services/ai.service');
const cacheService = require('../services/cache.service');

/**
 * Social & Feedback Controller
 */
const getNote = async (req, res) => {
    const videoId = req.query.videoId || req.body?.videoId;
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
    const videoId = req.query.videoId || req.body?.videoId;

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
    const videoId = req.query.videoId || req.body?.videoId;
    const targetLanguage = req.query.targetLanguage || req.body?.targetLanguage;
    const deepVisual = req.query.deepVisual || req.body?.deepVisual;
    const requestedLang = targetLanguage && targetLanguage !== 'auto' ? targetLanguage : 'English';
    const isDeepVisual = deepVisual === 'true' || deepVisual === true;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        // --- STEP 1: Check Cache for this specific language ---
        const cacheKey = `video:intuition:${videoId}:${requestedLang}`;
        const cached = await cacheService.get(cacheKey);
        
        // If deepVisual is requested but the cached version is not multimodal, bypass cache to regenerate
        const isCachedMultimodal = cached && cached.model_name && cached.model_name.includes('(multimodal)');
        const isForceRefresh = req.query.refresh === 'true' || req.query.refresh === true || req.body?.refresh === 'true' || req.body?.refresh === true;
        const skipCache = isForceRefresh || (isDeepVisual && !isCachedMultimodal);

        if (cached && !skipCache) return res.status(200).json(cached);

        // --- STEP 2: Get or Generate the English "Master" version from DB ---
        let englishIntuition = await prisma.videoIntuition.findUnique({ where: { vid: videoId } });
        
        // Force master regeneration only if missing, generated without transcript (and not multimodal),
        // or if deep visual analysis is requested but the existing version is transcript-based.
        const isMultimodal = englishIntuition && englishIntuition.model_name && englishIntuition.model_name.includes('(multimodal)');
        const isStale = englishIntuition && (
            (!englishIntuition.transcript_used && !isMultimodal) ||
            (isDeepVisual && !isMultimodal) ||
            isForceRefresh
        );

        if (!englishIntuition || isStale) {
            const video = await prisma.video.findFirst({ where: { vid: videoId } });
            const title = video ? video.name : 'Unknown Title';
            const description = video ? video.description : 'No description available.';
            const url = (video && video.url) ? video.url : (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);
            const durationSeconds = video ? (video.duration_seconds || 0) : 0;

            console.log(`[Intuition] 🔥 Zero-to-Master English generation for ${videoId} (duration: ${durationSeconds}s, url: ${url})...`);
            const { content, isSystemFallback, model_name, transcript_used } = await generateIntuition(title, description, url, 'English', isDeepVisual, durationSeconds);
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

const askVideoDoubt = async (req, res) => {
    const { videoId, question, chatHistory, language } = req.body;
    if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Question is required' });
    }

    try {
        const video = await prisma.video.findFirst({ where: { vid: videoId } });
        const intuition = await prisma.videoIntuition.findUnique({ where: { vid: videoId } });

        const answer = await answerVideoDoubt({
            videoId,
            title: video ? video.name : 'Educational Video',
            description: video ? video.description : '',
            intuition: intuition ? intuition.content : '',
            question: question.trim(),
            chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
            language: language || 'English'
        });

        res.status(200).json({
            success: true,
            answer
        });
    } catch (error) {
        console.error('Error in askVideoDoubt:', error);
        res.status(500).json({ error: error.message || 'Failed to answer doubt' });
    }
};

/**
 * UGC Report Content (Apple Guideline 1.2)
 */
const reportContent = async (req, res) => {
    try {
        const { targetType, targetId, reason, details } = req.body;
        const reporterId = String(req.user?.id || 'anonymous');
        const reporterEmail = req.user?.email || 'anonymous';

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ error: 'Missing required report fields (targetType, targetId, reason)' });
        }

        const reportRecord = {
            targetType: String(targetType),
            targetId: String(targetId),
            reason: String(reason),
            details: String(details || ''),
            reporterId,
            reporterEmail
        };

        try {
            await datingPrisma.$executeRaw`
                INSERT INTO "social_reports" ("targetType", "targetId", "reason", "details", "status", "reporterId", "reporterEmail", "createdAt", "updatedAt")
                VALUES (${reportRecord.targetType}, ${reportRecord.targetId}, ${reportRecord.reason}, ${reportRecord.details}, 'pending', ${reportRecord.reporterId}, ${reportRecord.reporterEmail}, NOW(), NOW())
            `;
        } catch (dbErr) {
            console.error('Failed to insert report into database:', dbErr);
        }

        try {
            await cacheService.set(`report:${Date.now()}`, reportRecord, 86400 * 7);
        } catch (e) {}

        console.log(`[UGC Moderation] New report received and stored:`, reportRecord);

        return res.status(200).json({
            success: true,
            message: 'Report submitted successfully. Our safety team reviews all reports within 24 hours.'
        });
    } catch (err) {
        console.error('reportContent error:', err);
        return res.status(500).json({ error: 'Failed to submit report', details: err.message });
    }
};

/**
 * Helper to ensure we always resolve the internal social_users ID (datingPrisma.user)
 */
const resolveSocialUserId = async (req) => {
    let socialId = req.user?.id;
    const userEmail = req.user?.email;
    const userUid = req.user?.uid || req.user?.googleId;

    if (userEmail || userUid) {
        try {
            const socialUser = await datingPrisma.user.findFirst({
                where: {
                    OR: [
                        ...(userEmail ? [{ email: userEmail }] : []),
                        ...(userUid ? [{ googleId: userUid }] : [])
                    ]
                },
                select: { id: true }
            });
            if (socialUser) {
                socialId = socialUser.id;
            }
        } catch (e) {
            console.warn('[resolveSocialUserId] Lookup warning:', e.message);
        }
    }
    return socialId;
};

/**
 * UGC Block User (Apple Guideline 1.2)
 */
const blockUser = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = await resolveSocialUserId(req);

        if (!targetUserId) {
            return res.status(400).json({ error: 'Missing targetUserId' });
        }

        const numericTargetId = parseInt(targetUserId, 10);
        if (numericTargetId === currentUserId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        // 1. Persist block record in database
        try {
            await datingPrisma.blockedUser.upsert({
                where: {
                    userId_blockedUserId: {
                        userId: currentUserId,
                        blockedUserId: numericTargetId
                    }
                },
                update: {},
                create: {
                    userId: currentUserId,
                    blockedUserId: numericTargetId
                }
            });
        } catch (dbErr) {
            console.warn('[UGC Moderation] DB block upsert warning (falling back):', dbErr.message);
        }

        // 2. Remove any existing friendship or pending connection
        try {
            await datingPrisma.friendship.deleteMany({
                where: {
                    OR: [
                        { senderId: currentUserId, receiverId: numericTargetId },
                        { senderId: numericTargetId, receiverId: currentUserId }
                    ]
                }
            });

            await datingPrisma.closeFriendRequest.deleteMany({
                where: {
                    OR: [
                        { senderId: currentUserId, receiverId: numericTargetId },
                        { senderId: numericTargetId, receiverId: currentUserId }
                    ]
                }
            });
        } catch (fErr) {
            console.warn('[UGC Moderation] Friendship cleanup warning on block:', fErr.message);
        }

        // 3. Update Redis cache
        const cacheKey = `user:${currentUserId}:blocked`;
        let blocked = await cacheService.get(cacheKey);
        if (!Array.isArray(blocked)) {
            blocked = [];
        }

        if (!blocked.includes(numericTargetId) && !blocked.includes(String(numericTargetId))) {
            blocked.push(numericTargetId);
            await cacheService.set(cacheKey, blocked, 86400 * 30);
        }

        // Invalidate friends list cache for all patterns
        await cacheService.del(`user:friendships:${currentUserId}`);
        await cacheService.del(`user:friendships:${numericTargetId}`);
        await cacheService.delByPattern('user:friendships:*').catch(() => {});

        console.log(`[UGC Moderation] User ${currentUserId} blocked user ${numericTargetId}`);

        return res.status(200).json({
            success: true,
            message: 'User has been blocked. They have been removed from your connections.',
            blockedUsers: blocked
        });
    } catch (err) {
        console.error('blockUser error:', err);
        return res.status(500).json({ error: 'Failed to block user', details: err.message });
    }
};

/**
 * UGC Unblock User
 */
const unblockUser = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = await resolveSocialUserId(req);

        if (!targetUserId) {
            return res.status(400).json({ error: 'Missing targetUserId' });
        }

        const numericTargetId = parseInt(targetUserId, 10);

        // 1. Remove block record from database
        try {
            await datingPrisma.blockedUser.deleteMany({
                where: {
                    userId: currentUserId,
                    blockedUserId: numericTargetId
                }
            });
        } catch (dbErr) {
            console.warn('[UGC Moderation] DB unblock warning:', dbErr.message);
        }

        // 2. Update Redis cache
        const cacheKey = `user:${currentUserId}:blocked`;
        let blocked = await cacheService.get(cacheKey);
        if (Array.isArray(blocked)) {
            blocked = blocked.filter(id => id !== numericTargetId && id !== String(numericTargetId));
            await cacheService.set(cacheKey, blocked, 86400 * 30);
        } else {
            blocked = [];
        }

        // Invalidate friends list cache
        await cacheService.del(`user:friendships:${currentUserId}`);
        await cacheService.del(`user:friendships:${numericTargetId}`);
        await cacheService.delByPattern('user:friendships:*').catch(() => {});

        console.log(`[UGC Moderation] User ${currentUserId} unblocked user ${numericTargetId}`);

        return res.status(200).json({
            success: true,
            message: 'User has been unblocked.',
            blockedUsers: blocked
        });
    } catch (err) {
        console.error('unblockUser error:', err);
        return res.status(500).json({ error: 'Failed to unblock user', details: err.message });
    }
};

/**
 * UGC Get Blocked Users (with full user profiles for the UI)
 */
const getBlockedUsers = async (req, res) => {
    try {
        const currentUserId = await resolveSocialUserId(req);

        // Fetch from database with user profile details
        try {
            const blockedRecords = await datingPrisma.blockedUser.findMany({
                where: { userId: currentUserId },
                include: {
                    blockedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicture: true,
                            collegeName: true,
                            department: true,
                            yearOfStudy: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const blockedUsers = blockedRecords
                .filter(b => b.blockedUser)
                .map(b => ({
                    ...b.blockedUser,
                    blockedAt: b.createdAt
                }));

            const blockedUserIds = blockedUsers.map(u => u.id);

            // Sync Redis cache
            const cacheKey = `user:${currentUserId}:blocked`;
            await cacheService.set(cacheKey, blockedUserIds, 86400 * 30);

            return res.status(200).json({
                blockedUsers,
                blockedUserIds
            });
        } catch (dbErr) {
            console.warn('[UGC Moderation] DB getBlockedUsers warning, fallback to cache:', dbErr.message);
            const cacheKey = `user:${currentUserId}:blocked`;
            const blocked = await cacheService.get(cacheKey) || [];
            return res.status(200).json({
                blockedUsers: [],
                blockedUserIds: Array.isArray(blocked) ? blocked : []
            });
        }
    } catch (err) {
        console.error('getBlockedUsers error:', err);
        return res.status(500).json({ error: 'Failed to get blocked users' });
    }
};

module.exports = {
    getNote,
    saveNote,
    getComments,
    postComment,
    deleteComment,
    getIntuition,
    askVideoDoubt,
    reportContent,
    blockUser,
    unblockUser,
    getBlockedUsers
};

