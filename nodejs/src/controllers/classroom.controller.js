const prisma = require('../lib/prisma');

/**
 * Classroom Controller
 */
const getClassroomVideo = async (req, res) => {
    const { videoId } = req.body;
    const { uid } = req.user;

    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

    try {
        const user = req.user;
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
                name: video.playlist.name,
                videos: playlistVideos
            };
        }

        await prisma.userActivityLog.create({
            data: { userId: user.id, activity_type: `Watched: ${video.name}` }
        });

        res.status(200).json({
            video: video,
            playlist: playlistData
        });
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
            where: { userId_vid: { userId: user.id, vid: videoId } }
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
            where: { userId_vid: { userId: user.id, vid: videoId } }
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
        const videos = await prisma.video.findMany({
            where: {
                userId: user.id,
                is_completed: false,
                watch_progress: {
                    gt: 0,
                    lt: 90
                }
            },
            orderBy: { imported_at: 'desc' },
            take: 3
        });
        res.status(200).json({ videos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCompletedLearnings = async (req, res) => {
    const { uid } = req.user;

    try {
        const user = req.user;

        const completedVideos = await prisma.video.findMany({
            where: { userId: user.id, is_completed: true },
            take: 3
        });

        const allPlaylists = await prisma.playlist.findMany({
            where: { userId: user.id },
            include: { videos: true }
        });

        const completedPlaylists = allPlaylists.filter(pl =>
            pl.videos.length > 0 && pl.videos.every(v => v.is_completed)
        );

        res.status(200).json({
            videos: completedVideos,
            playlists: completedPlaylists
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getClassroomVideo,
    markVideoCompleted,
    unmarkVideoCompleted,
    updateProgress,
    getContinueWatching,
    getCompletedLearnings,
};
