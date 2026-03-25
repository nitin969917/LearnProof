const { searchYoutube, getYoutubeMetadata } = require('../services/youtube.service');

/**
 * YouTube Controller
 */
const search = async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const result = await searchYoutube(query);
    if (result.error) return res.status(500).json({ error: result.error });

    res.status(200).json(result);
};

const importMetadata = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const result = await getYoutubeMetadata(url);
    if (result.error) return res.status(400).json({ error: result.error });

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
    importMetadata,
    recommendPlaylists,
};
