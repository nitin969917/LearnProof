const { searchYoutube, getYoutubeMetadata } = require('../services/youtube.service');
const { generateGeminiContent, MODELS } = require('../services/ai.service');
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

    console.log(`[Smart Course Generator] Recommending playlists for subject: "${subject}" in "${language}" using Vertex AI...`);

    const prompt = `
        You are LearnProof AI, a personalized learning assistant.
        The user wants to learn the subject: "${subject}" in the language: "${language}".
        Generate exactly 6 learning tracks/course playlist recommendations that cover this subject in a structured, progressive way (from basic/fundamental to advanced).
        
        You MUST return your response as a valid JSON array of exactly 6 objects. Do not include markdown formatting or wrapping outside the JSON array itself (no \`\`\`json block, just raw JSON).
        Each object in the array must contain the following keys:
        - "title": A clear, engaging course/playlist title.
        - "channel": A realistic creator/instructor/institution name.
        - "description": A concise, one-sentence description of the course content.
        - "video_count": A realistic estimate of the number of videos (integer, e.g., 8, 12, 20).
        - "search_query": A highly specific YouTube search query that would find high-quality educational videos/playlists for this topic. Include the language name in the query.
    `;

    let recommendations = [];
    try {
        const aiResponse = await generateGeminiContent(MODELS.GEMINI_2_5, prompt, {
            responseMimeType: 'application/json',
            temperature: 0.7
        });
        recommendations = JSON.parse(aiResponse);
        console.log(`[Smart Course Generator] Vertex AI generated ${recommendations.length} recommendations successfully.`);
    } catch (aiErr) {
        console.error('[Smart Course Generator] Vertex AI recommendations generation failed, falling back to standard search:', aiErr.message);
        // Fallback: generate 6 basic topics programmatically
        const topics = [
            `Introduction to ${subject}`,
            `Fundamentals of ${subject}`,
            `Intermediate ${subject} Concepts`,
            `${subject} Practical Examples`,
            `Advanced ${subject} Tutorials`,
            `${subject} Masterclass`
        ];
        recommendations = topics.map((title, idx) => ({
            title,
            channel: 'Educational Channel',
            description: `Learn the concepts of ${title} in ${language}.`,
            video_count: 8 + (idx * 2),
            search_query: `${subject} ${title} in ${language}`
        }));
    }

    // Search YouTube in parallel for each recommended track to fetch real URL/thumbnail
    const resolvedResults = await Promise.all(recommendations.map(async (rec, idx) => {
        try {
            console.log(`[Smart Course Generator] Searching YouTube for query: "${rec.search_query}"...`);
            const ytResult = await searchYoutube(rec.search_query, 3, 'playlist');
            
            let foundPlaylist = null;
            if (ytResult && ytResult.results && ytResult.results.length > 0) {
                foundPlaylist = ytResult.results.find(item => item.type === 'playlist');
                if (!foundPlaylist) {
                    foundPlaylist = ytResult.results[0]; // Fallback to first video/item
                }
            }
            
            if (foundPlaylist) {
                return {
                    id: foundPlaylist.id || `rec-gen-${idx}`,
                    type: foundPlaylist.type || 'playlist',
                    title: rec.title,
                    channel: rec.channel || foundPlaylist.channel,
                    description: rec.description,
                    thumbnail: foundPlaylist.thumbnail,
                    url: foundPlaylist.url,
                    video_count: rec.video_count || foundPlaylist.video_count || 10
                };
            }
        } catch (searchErr) {
            console.error(`[Smart Course Generator] YouTube search failed for query "${rec.search_query}":`, searchErr.message);
        }
        
        // Fallback if search fails or no playlist is found
        return {
            id: `rec-gen-fallback-${idx}`,
            type: 'playlist',
            title: rec.title,
            channel: rec.channel,
            description: rec.description,
            thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.search_query)}`,
            video_count: rec.video_count || 10
        };
    }));

    res.status(200).json({ results: resolvedResults });
};

module.exports = {
    search,
    autocomplete,
    importMetadata,
    recommendPlaylists,
};
