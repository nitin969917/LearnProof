const { searchYoutube, getYoutubeMetadata } = require('../services/youtube.service');
const axios = require('axios');

/**
 * YouTube Controller
 */
const search = async (req, res) => {
    const { query, type = 'all', sortBy = 'relevance', duration = 'any' } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const result = await searchYoutube(query, 15, { type, sortBy, duration });
    if (result.error) return res.status(500).json({ error: result.error });

    res.status(200).json(result);
};

const autocomplete = async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(200).json({ suggestions: [] });

    try {
        const response = await axios.get(`https://suggestqueries.google.com/complete/search`, {
            params: {
                client: 'firefox',
                ds: 'yt',
                q: query
            }
        });
        const suggestions = response.data && response.data[1] ? response.data[1] : [];
        res.status(200).json({ suggestions });
    } catch (err) {
        console.error('Autocomplete error:', err.message);
        res.status(200).json({ suggestions: [] });
    }
};

const importMetadata = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const result = await getYoutubeMetadata(url);
    if (result.error) {
        console.error('Import metadata error:', result.error);
        return res.status(400).json({ error: result.error });
    }

    res.status(200).json({ success: true, data: result });
};

const recommendPlaylists = async (req, res) => {
    const { subject, language } = req.body;
    if (!subject || !language) return res.status(400).json({ error: 'Missing subject or language' });

    const query = `${subject} course in ${language}`;
    const result = await searchYoutube(query, 6, 'playlist', 'viewCount');

    if (result.error) return res.status(500).json({ error: result.error });

    res.status(200).json(result);
};

module.exports = {
    search,
    autocomplete,
    importMetadata,
    recommendPlaylists,
};
