const { google } = require('googleapis');
require('dotenv').config();

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

/**
 * Extract video or playlist ID from YouTube URL
 */
const extractId = (url) => {
    const videoMatch = url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (videoMatch) return { type: 'video', id: videoMatch[1] };

    const playlistMatch = url.match(/(?:list=)([a-zA-Z0-9_-]+)/);
    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };

    return { type: null, id: null };
};

/**
 * Convert ISO 8601 duration (e.g., PT1M30S) to readable format
 */
const formatDuration = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get metadata for YouTube video or playlist
 */
const getYoutubeMetadata = async (url, maxPlaylistVideos = null) => {
    try {
        const { type, id } = extractId(url);
        if (!type) return { error: 'Invalid YouTube URL' };

        if (type === 'video') {
            const res = await youtube.videos.list({
                part: 'snippet,contentDetails,statistics',
                id: id
            });

            if (!res.data.items.length) return { error: 'Video not found' };

            const item = res.data.items[0];
            return {
                type: 'video',
                id: id,
                title: item.snippet.title,
                description: item.snippet.description,
                channel: item.snippet.channelTitle,
                published_at: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                duration: formatDuration(item.contentDetails.duration),
                view_count: item.statistics.viewCount || '0',
                like_count: item.statistics.likeCount || '0',
                url: `https://www.youtube.com/watch?v=${id}`
            };
        } else if (type === 'playlist') {
            const plRes = await youtube.playlists.list({
                part: 'snippet,contentDetails',
                id: id
            });

            if (!plRes.data.items.length) return { error: 'Playlist not found' };

            const playlistItem = plRes.data.items[0];

            let videos = [];
            let nextPageToken = null;
            let videosFetched = 0;

            while (true) {
                const currentMax = maxPlaylistVideos ? Math.min(50, maxPlaylistVideos - videosFetched) : 50;
                if (maxPlaylistVideos && currentMax <= 0) break;

                const itemsRes = await youtube.playlistItems.list({
                    part: 'snippet',
                    playlistId: id,
                    maxResults: currentMax,
                    pageToken: nextPageToken
                });

                const pageVideos = itemsRes.data.items
                    .filter(v => v.snippet.resourceId.kind === 'youtube#video')
                    .map(v => ({
                        video_id: v.snippet.resourceId.videoId,
                        title: v.snippet.title,
                        position: v.snippet.position + 1,
                        url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`
                    }));

                if (pageVideos.length) {
                    const videoIds = pageVideos.map(pv => pv.video_id);
                    const descRes = await youtube.videos.list({
                        part: 'snippet',
                        id: videoIds.join(',')
                    });

                    const descMap = {};
                    descRes.data.items.forEach(item => {
                        descMap[item.id] = item.snippet.description || '';
                    });

                    pageVideos.forEach(pv => {
                        pv.description = descMap[pv.video_id] || '';
                        videos.push(pv);
                        videosFetched++;
                    });
                }

                nextPageToken = itemsRes.data.nextPageToken;
                if (!nextPageToken || (maxPlaylistVideos && videosFetched >= maxPlaylistVideos)) break;
            }

            return {
                type: 'playlist',
                id: id,
                title: playlistItem.snippet.title,
                description: playlistItem.snippet.description,
                channel: playlistItem.snippet.channelTitle,
                published_at: playlistItem.snippet.publishedAt,
                thumbnail: playlistItem.snippet.thumbnails.high?.url || playlistItem.snippet.thumbnails.default?.url,
                video_count: playlistItem.contentDetails.itemCount,
                videos: videos,
                total_videos_fetched: videos.length,
                url: `https://www.youtube.com/playlist?list=${id}`
            };
        }
    } catch (error) {
        return { error: `API Error: ${error.message}` };
    }
};

/**
 * Convert ISO 8601 duration (e.g., PT1M30S) to seconds
 */
const parseDurationToSeconds = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Search YouTube for videos and playlists
 */
const searchYoutube = async (query, maxResults = 15, searchType = 'video,playlist', order = 'relevance') => {
    try {
        const res = await youtube.search.list({
            q: query,
            part: 'snippet',
            maxResults: maxResults,
            type: searchType,
            order: order
        });

        const results = [];
        const playlistIds = [];
        const videoIds = [];

        res.data.items.forEach(item => {
            const { snippet, id } = item;
            const kind = id.kind;

            const result = {
                title: snippet.title,
                channel: snippet.channelTitle,
                description: snippet.description || '',
                thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
                published_at: snippet.publishedAt
            };

            if (kind === 'youtube#video') {
                result.type = 'video';
                result.id = id.videoId;
                result.url = `https://www.youtube.com/watch?v=${id.videoId}`;
                videoIds.push(id.videoId);
            } else if (kind === 'youtube#playlist') {
                result.type = 'playlist';
                result.id = id.playlistId;
                result.url = `https://www.youtube.com/playlist?list=${id.playlistId}`;
                playlistIds.push(id.playlistId);
            } else {
                return;
            }

            results.push(result);
        });

        // Fetch durations for videos to filter out shorts
        let filteredResults = results;
        if (videoIds.length) {
            const vRes = await youtube.videos.list({
                part: 'contentDetails',
                id: videoIds.join(',')
            });

            const durationMap = {};
            vRes.data.items.forEach(item => {
                durationMap[item.id] = parseDurationToSeconds(item.contentDetails.duration);
            });

            // Filter out shorts (less than or equal to 60 seconds)
            filteredResults = results.filter(r => {
                if (r.type === 'video') {
                    const duration = durationMap[r.id] || 0;
                    return duration > 60; // Keep only videos longer than 1 minute
                }
                return true; // Keep playlists
            });
        }

        // Fetch playlist video counts
        if (playlistIds.length) {
            const plRes = await youtube.playlists.list({
                part: 'contentDetails',
                id: playlistIds.join(',')
            });

            const plMap = {};
            plRes.data.items.forEach(p => {
                plMap[p.id] = p.contentDetails.itemCount;
            });

            filteredResults.forEach(r => {
                if (r.type === 'playlist') {
                    r.video_count = plMap[r.id] || 0;
                }
            });
        }

        return { results: filteredResults };
    } catch (error) {
        return { error: `Search API Error: ${error.message}` };
    }
};

module.exports = {
    getYoutubeMetadata,
    searchYoutube,
    extractId,
};
