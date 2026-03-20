const axios = require('axios');

/**
 * YouTube Data API Helper
 */
const getVideosDetails = async (videoIds) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error('YOUTUBE_API_KEY not found in environment');

        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'contentDetails,snippet',
                id: videoIds.join(','),
                key: apiKey
            }
        });

        return response.data.items;
    } catch (error) {
        console.error('Error fetching YouTube video details:', error.message);
        return [];
    }
};

/**
 * Parse ISO 8601 duration (e.g., PT1H2M30S) to seconds
 */
const parseDuration = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
};

module.exports = {
    getVideosDetails,
    parseDuration
};
