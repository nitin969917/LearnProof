const prisma = require('../lib/prisma');
const youtube = require('../lib/youtube');
const cacheService = require('../services/cache.service');

/**
 * Learning Management Controller
 */
const saveLearning = async (req, res) => {
    const { data } = req.body;
    const { uid } = req.user;

    if (!data) return res.status(400).json({ error: 'Missing data' });

    try {
        const user = req.user;

        const contentType = data.type;

        if (contentType === 'video') {
            const existing = await prisma.video.findUnique({
                where: { userId_vid: { userId: user.id, vid: data.id } }
            });

            if (existing) return res.status(200).json({ message: 'You have already saved this before' });

            const videoDetails = await youtube.getVideosDetails([data.id]);
            const duration_seconds = videoDetails[0]?.contentDetails?.duration 
                ? youtube.parseDuration(videoDetails[0].contentDetails.duration) 
                : 0;

            await prisma.video.create({
                data: {
                    userId: user.id,
                    vid: data.id,
                    name: data.title,
                    url: data.url,
                    description: data.description || '',
                    duration_seconds,
                    imported_at: new Date()
                }
            });

            await prisma.userActivityLog.create({
                data: { userId: user.id, activity_type: `Learning Import: ${data.title}` }
            });

            return res.status(200).json({ message: 'Congo!! You have showed your dedication towards learning' });
        } else if (contentType === 'playlist') {
            let playlist = await prisma.playlist.findFirst({
                where: { pid: data.id, userId: user.id }
            });

            if (playlist) {
                return res.status(200).json({ message: 'Playlist already saved' });
            }

            playlist = await prisma.playlist.create({
                data: {
                    userId: user.id,
                    pid: data.id,
                    name: data.title,
                    url: data.url,
                    thumbnail: data.thumbnail || ''
                }
            });

            // Fetch all video durations for the playlist
            const videoIds = data.videos.map(v => v.video_id);
            const youtubeDetails = [];
            // Batch fetch durations (YouTube API allows 50 IDs max)
            for (let i = 0; i < videoIds.length; i += 50) {
                const batch = videoIds.slice(i, i + 50);
                const details = await youtube.getVideosDetails(batch);
                youtubeDetails.push(...details);
            }

            const durationMap = youtubeDetails.reduce((acc, item) => {
                acc[item.id] = youtube.parseDuration(item.contentDetails.duration);
                return acc;
            }, {});

            const videoPromises = (data.videos || []).map(v =>
                prisma.video.upsert({
                    where: { userId_vid: { userId: user.id, vid: v.video_id } },
                    update: {
                        name: v.title,
                        url: v.url,
                        playlistId: playlist.id,
                        description: v.description || '',
                        position: v.position || 0,
                        duration_seconds: durationMap[v.video_id] || 0
                    },
                    create: {
                        userId: user.id,
                        vid: v.video_id,
                        name: v.title,
                        url: v.url,
                        playlistId: playlist.id,
                        duration_seconds: durationMap[v.video_id] || 0,
                        imported_at: new Date(),
                        description: v.description || '',
                        position: v.position || 0
                    }
                })
            );

            await Promise.all(videoPromises);

            await prisma.userActivityLog.create({
                data: { userId: user.id, activity_type: `Learning Import: ${data.title}` }
            });

            return res.status(201).json({ message: 'Playlist and videos saved' });
        }

        res.status(400).json({ error: 'Invalid content type' });
    } catch (error) {
        console.error('Save learning error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getMyLearnings = async (req, res) => {
    const { page = 1, page_size = 10, searchQuery = '' } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;

        const skip = (parseInt(page) - 1) * parseInt(page_size);
        const take = parseInt(page_size);

        const videoWhere = {
            userId: user.id,
            playlistId: null,
            name: { contains: searchQuery }
        };

        const playlistWhere = {
            userId: user.id,
            name: { contains: searchQuery }
        };

        const [videos, totalVideos, playlists] = await Promise.all([
            prisma.video.findMany({ where: videoWhere, skip, take, orderBy: { imported_at: 'desc' } }),
            prisma.video.count({ where: videoWhere }),
            prisma.playlist.findMany({
                where: playlistWhere,
                include: { videos: true },
                orderBy: { id: 'desc' }
            })
        ]);

        // Format paginated response mimic DRF
        const paginatedVideos = {
            count: totalVideos,
            next: totalVideos > skip + take ? true : null, // Simply true/false or full URL if needed
            previous: skip > 0 ? true : null,
            results: videos
        };

        res.status(200).json({
            videos: paginatedVideos,
            playlists: playlists
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteVideo = async (req, res) => {
    const { videoId } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const video = await prisma.video.findUnique({
            where: { userId_vid: { userId: user.id, vid: videoId } },
            select: { playlistId: true, playlist: { select: { pid: true } } }
        });

        await prisma.video.delete({
            where: { userId_vid: { userId: user.id, vid: videoId } }
        });

        // Invalidate playlist cache if it belongs dummy to one
        if (video?.playlist?.pid) {
            await cacheService.del(`playlist:detail:${user.id}:${video.playlist.pid}`);
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: 'Video not found' });
    }
};

const deletePlaylist = async (req, res) => {
    const { playlistId } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const playlist = await prisma.playlist.findUnique({
            where: { userId_pid: { userId: user.id, pid: playlistId } }
        });

        if (!playlist) throw new Error();

        await prisma.playlist.delete({ where: { id: playlist.id } });
        
        // Invalidate cache
        await cacheService.del(`playlist:detail:${user.id}:${playlistId}`);

        res.status(200).json({ message: 'Playlist and Videos associated with it deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: 'Playlist not found' });
    }
};

const getPlaylistDetail = async (req, res) => {
    const { pid } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const cacheKey = `playlist:detail:${user.id}:${pid}`;
        
        let cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log(`Cache hit for Playlist: ${pid}`);
            return res.status(200).json(cachedData);
        }

        const playlist = await prisma.playlist.findUnique({
            where: { userId_pid: { userId: user.id, pid: pid } },
            include: { 
                videos: { 
                    orderBy: { position: 'asc' },
                    include: {
                        quizzes: {
                            where: { userId: user.id, passed: true },
                            take: 1
                        }
                    }
                } 
            }
        });

        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

        const formattedVideos = playlist.videos.map(v => ({
            ...v,
            passed_quiz: v.quizzes.length > 0
        }));

        const result = {
            playlist: { ...playlist, videos: undefined, duration_goal: playlist.duration_goal },
            videos: formattedVideos
        };

        // Cache for 30 minutes
        await cacheService.set(cacheKey, result, 1800);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const setPlaylistGoal = async (req, res) => {
    const { pid, duration_goal } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const playlist = await prisma.playlist.update({
            where: { userId_pid: { userId: user.id, pid: pid } },
            data: { duration_goal: parseInt(duration_goal) }
        });

        res.status(200).json({ message: 'Roadmap goal updated successfully', duration_goal: playlist.duration_goal });
    } catch (error) {
        res.status(404).json({ error: 'Playlist not found or update failed' });
    }
};

module.exports = {
    saveLearning,
    getMyLearnings,
    deleteVideo,
    deletePlaylist,
    getPlaylistDetail,
    setPlaylistGoal,
};
