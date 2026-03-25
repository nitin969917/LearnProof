const aiService = require('../services/ai.service');

const runBenchmark = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        console.log(`[AI Benchmark] Running benchmark for: "${title}"`);
        const results = await aiService.benchmarkAllModels(title, description);

        res.json(results);
    } catch (error) {
        console.error('[AI Benchmark] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    runBenchmark
};
