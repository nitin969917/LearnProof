const prisma = require('../lib/prisma');
const cacheService = require('../services/cache.service');

/**
 * Classroom Controller
 */
const getClassroomVideo = async (req, res) => {
    const { videoId } = req.body;
    const { uid } = req.user;

    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

    try {
        const user = req.user;
        const cacheKey = `classroom:v1:${user.id}:${videoId}`;
        
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            console.log(`Cache hit for video: ${videoId}`);
            return res.status(200).json(cached);
        }

        const video = await prisma.video.findUnique({
            where: { userId_vid: { userId: user.id, vid: videoId } },
            include: { playlist: true }
        });

        if (!video) return res.status(404).json({ error: 'Video Not found' });

        let playlistData = null;
        if (video.playlist) {
            const playlistVideos = await prisma.video.findMany({
                where: { userId: user.id, playlistId: video.playlistId },
                orderBy: { position: 'asc' }
            });
            playlistData = {
                pid: video.playlist.pid,
                name: video.playlist.name,
                videos: playlistVideos
            };
        }

        await prisma.userActivityLog.create({
            data: { userId: user.id, activity_type: `Watched: ${video.name}` }
        });

        const result = {
            video: video,
            playlist: playlistData
        };

        await cacheService.set(cacheKey, result, 3600);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markVideoCompleted = async (req, res) => {
    const { videoId } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const video = await prisma.video.findUnique({
            where: { userId_vid: { userId: user.id, vid: videoId } },
            include: { playlist: true }
        });

        if (!video) return res.status(404).json({ error: 'Video not found' });

        await prisma.video.update({
            where: { id: video.id },
            data: { is_completed: true, watch_progress: 100 }
        });

        const newXp = user.xp + 10;
        const newLevel = Math.floor(newXp / 100) + 1;

        await prisma.userProfile.update({
            where: { id: user.id },
            data: { xp: newXp, level: newLevel }
        });

        await prisma.userActivityLog.create({
            data: { userId: user.id, activity_type: `Completed: ${video.name}` }
        });

        // Invalidate caches
        await cacheService.del(`user:profile:${uid}`);
        await cacheService.del(`user:continue:${user.id}`);
        await cacheService.del(`user:completed:${user.id}`);
        await cacheService.delByPattern(`classroom:v1:${user.id}:*`);
        if (video.playlist?.pid) {
            await cacheService.del(`playlist:detail:${user.id}:${video.playlist.pid}`);
        }
        await cacheService.delByPattern(`user:learnings:${user.id}:*`);
        await cacheService.del(`user:quiz-list:${user.id}`);

        res.status(200).json({ message: 'Video marked as completed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unmarkVideoCompleted = async (req, res) => {
    const { videoId } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const video = await prisma.video.findUnique({
            where: { userId_vid: { userId: user.id, vid: videoId } },
            include: { playlist: true }
        });

        if (!video) return res.status(404).json({ error: 'Video not found' });

        if (video.is_completed) {
            await prisma.video.update({
                where: { id: video.id },
                data: { is_completed: false, watch_progress: 0 }
            });

            let newXp = user.xp;
            if (newXp >= 10) newXp -= 10;
            const newLevel = Math.floor(newXp / 100) + 1;

            await prisma.userProfile.update({
                where: { id: user.id },
                data: { xp: newXp, level: newLevel }
            });

            await prisma.userActivityLog.create({
                data: { userId: user.id, activity_type: `Unmarked: ${video.name}` }
            });

            // Invalidate caches
            await cacheService.del(`user:profile:${uid}`);
            await cacheService.del(`user:continue:${user.id}`);
            await cacheService.del(`user:completed:${user.id}`);
            await cacheService.delByPattern(`classroom:v1:${user.id}:*`);
            if (video.playlist?.pid) {
                await cacheService.del(`playlist:detail:${user.id}:${video.playlist.pid}`);
            }
            await cacheService.delByPattern(`user:learnings:${user.id}:*`);
            await cacheService.del(`user:quiz-list:${user.id}`);
        }

        res.status(200).json({ message: 'Video unmarked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProgress = async (req, res) => {
    const { videoId, progress } = req.body;
    const { uid } = req.user;

    if (!videoId || progress === undefined) return res.status(400).json({ error: 'Missing data' });

    try {
        const user = req.user;
        const video = await prisma.video.findUnique({
            where: { userId_vid: { userId: user.id, vid: videoId } }
        });

        if (!video) return res.status(404).json({ error: 'Video not found' });

        if (!video.is_completed && parseFloat(progress) > video.watch_progress) {
            await prisma.video.update({
                where: { id: video.id },
                data: { watch_progress: parseFloat(progress) }
            });
            
            // Invalidate continue watching cache
            await cacheService.del(`user:continue:${user.id}`);
            await cacheService.delByPattern(`classroom:v1:${user.id}:*`);
            await cacheService.delByPattern(`user:learnings:${user.id}:*`);
            await cacheService.del(`user:quiz-list:${user.id}`);
        }

        res.status(200).json({ message: 'Progress updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getContinueWatching = async (req, res) => {
    const { uid } = req.user;

    try {
        const user = req.user;
        const cacheKey = `user:continue:${user.id}`;
        
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.status(200).json({ videos: cached });

        const videos = await prisma.video.findMany({
            where: {
                userId: user.id,
                is_completed: false,
                watch_progress: {
                    gt: 0,
                    lt: 90
                }
            },
            select: {
                id: true,
                vid: true,
                name: true,
                url: true,
                watch_progress: true,
                is_completed: true,
                imported_at: true
            },
            orderBy: { imported_at: 'desc' },
            take: 3
        });
        
        await cacheService.set(cacheKey, videos, 600); // Cache for 10 mins

        res.status(200).json({ videos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCompletedLearnings = async (req, res) => {
    const { uid } = req.user;

    try {
        const user = req.user;
        const cacheKey = `user:completed:${user.id}`;
        
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.status(200).json(cached);

        const completedVideos = await prisma.video.findMany({
            where: { userId: user.id, is_completed: true },
            orderBy: { updated_at: 'desc' },
            take: 3
        });

        const completedPlaylists = await prisma.playlist.findMany({
            where: {
                userId: user.id,
                videos: {
                    some: {},
                    none: { is_completed: false }
                }
            },
            include: {
                videos: {
                    select: {
                        id: true,
                        vid: true,
                        is_completed: true
                    }
                }
            }
        });

        const result = {
            videos: completedVideos,
            playlists: completedPlaylists
        };

        await cacheService.set(cacheKey, result, 600); // Cache for 10 mins

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const prepareNotesPdf = async (req, res) => {
    try {
        const { title, pages, subjectCategory } = req.body;
        const { buildStudyNotesPDF } = require('../services/pdfGenerator.service');
        const crypto = require('crypto');

        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({ error: 'No note pages provided' });
        }

        const sanitizedTitle = (title || 'Lecture_Study_Notes')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .slice(0, 60);

        const fileName = `${sanitizedTitle}_Study_Notes.pdf`;
        const downloadId = crypto.randomBytes(16).toString('hex');

        const doc = buildStudyNotesPDF({
            title: title || 'Lecture Study Notes',
            pages,
            subjectCategory: subjectCategory || 'Digital Study Guide'
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', async () => {
            try {
                const pdfBuffer = Buffer.concat(chunks);
                const base64Data = pdfBuffer.toString('base64');
                await cacheService.set(`pdf:dl:${downloadId}`, base64Data, 900); // 15 mins expiry

                res.status(200).json({
                    success: true,
                    downloadId,
                    fileName,
                    downloadUrl: `/api/classroom/download-file/${downloadId}/${fileName}`,
                    pdfBase64: base64Data
                });
            } catch (err) {
                console.error('[ClassroomController] Error caching PDF buffer:', err);
                if (!res.headersSent) res.status(500).json({ error: 'Failed to buffer PDF' });
            }
        });
        doc.end();
    } catch (error) {
        console.error('[ClassroomController] Error preparing PDF:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to prepare PDF document' });
    }
};

const downloadNotesFile = async (req, res) => {
    try {
        const { downloadId, fileName } = req.params;
        const base64Data = await cacheService.get(`pdf:dl:${downloadId}`);

        if (!base64Data) {
            return res.status(404).send('Download link expired or not found. Please click Download PDF again.');
        }

        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const safeFileName = fileName || 'Study_Notes.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('[ClassroomController] Error serving download file:', error);
        if (!res.headersSent) res.status(500).send('Error serving file');
    }
};

const generateNotesPdf = async (req, res) => {
    try {
        const { title, pages, subjectCategory } = req.body;
        const { buildStudyNotesPDF } = require('../services/pdfGenerator.service');

        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({ error: 'No note pages provided' });
        }

        const sanitizedTitle = (title || 'Lecture_Study_Notes')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .slice(0, 60);

        const fileName = `${sanitizedTitle}_Study_Notes.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        const doc = buildStudyNotesPDF({
            title: title || 'Lecture Study Notes',
            pages,
            subjectCategory: subjectCategory || 'Digital Study Guide'
        });

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('[ClassroomController] Error generating notes PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF document' });
        }
    }
};

const cacheRenderedPdf = async (req, res) => {
    try {
        const { fileName, pdfBase64 } = req.body;
        const crypto = require('crypto');

        if (!pdfBase64) {
            return res.status(400).json({ error: 'No PDF data provided' });
        }

        const downloadId = crypto.randomBytes(16).toString('hex');
        const safeFileName = (fileName || 'Study_Notes.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');

        await cacheService.set(`pdf:dl:${downloadId}`, pdfBase64, 900); // 15 mins

        res.status(200).json({
            success: true,
            downloadId,
            fileName: safeFileName,
            downloadUrl: `/api/classroom/download-file/${downloadId}/${safeFileName}`
        });
    } catch (error) {
        console.error('[ClassroomController] Error caching rendered PDF:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to cache PDF' });
    }
};

module.exports = {
    getClassroomVideo,
    markVideoCompleted,
    unmarkVideoCompleted,
    updateProgress,
    getContinueWatching,
    getCompletedLearnings,
    generateNotesPdf,
    prepareNotesPdf,
    cacheRenderedPdf,
    downloadNotesFile
};


