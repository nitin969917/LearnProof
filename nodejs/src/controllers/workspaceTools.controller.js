const prisma = require('../lib/prisma');
const difyService = require('../services/dify.service');

const DIFY_SUMMARY_APP_API_KEY = process.env.DIFY_SUMMARY_APP_API_KEY || '';
const DIFY_QUIZ_APP_API_KEY = process.env.DIFY_QUIZ_APP_API_KEY || '';
const DIFY_FLASHCARD_APP_API_KEY = process.env.DIFY_FLASHCARD_APP_API_KEY || '';

/**
 * Clean AI JSON response (removes ```json ... ``` blocks if present)
 */
const cleanAIJSON = (text) => {
    try {
        if (!text) return '';
        let trimmed = text.trim();
        if (trimmed.startsWith('```json')) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith('```')) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith('```')) {
            trimmed = trimmed.substring(0, trimmed.length - 3);
        }
        return trimmed.trim();
    } catch (e) {
        return text;
    }
};

/**
 * Generate a summary for the workspace materials
 */
const generateSummary = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        let summaryText = '';
        if (DIFY_SUMMARY_APP_API_KEY && workspace.difyDatasetId) {
            try {
                const inputs = {
                    dataset_id: workspace.difyDatasetId,
                    workspace_name: workspace.name
                };
                const outputs = await difyService.runWorkflow(DIFY_SUMMARY_APP_API_KEY, inputs, userId);
                summaryText = outputs.result || outputs.summary || outputs.text || '';
            } catch (difyErr) {
                console.error('[Workspace Tools Controller] Dify summary run failed, falling back to local:', difyErr.message);
                const localAi = require('../services/localAi.service');
                summaryText = await localAi.generateSummary(workspace.id);
            }
        } else {
            const localAi = require('../services/localAi.service');
            summaryText = await localAi.generateSummary(workspace.id);
        }

        // Auto-save the generated summary as a Workspace Note
        const savedNote = await prisma.workspaceNote.create({
            data: {
                workspaceId: workspace.id,
                title: `AI Summary - ${new Date().toLocaleDateString()}`,
                content: summaryText
            }
        });

        res.status(200).json({
            success: true,
            summary: summaryText,
            noteId: savedNote.id
        });

    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Generate an interactive Quiz from workspace materials
 */
const generateQuiz = async (req, res) => {
    const { id } = req.params;
    const { count, format, topic, difficulty } = req.body; // e.g. count: 10, format: 'MCQ' or 'T/F', optional topic/difficulty
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        let quizRaw = '';
        if (DIFY_QUIZ_APP_API_KEY && workspace.difyDatasetId) {
            try {
                const inputs = {
                    dataset_id: workspace.difyDatasetId,
                    count: count || 5,
                    format: format || 'MCQ'
                };
                const outputs = await difyService.runWorkflow(DIFY_QUIZ_APP_API_KEY, inputs, userId);
                quizRaw = outputs.quiz || outputs.result || outputs.text || '';
            } catch (difyErr) {
                console.error('[Workspace Tools Controller] Dify quiz run failed, falling back to local:', difyErr.message);
                const localAi = require('../services/localAi.service');
                quizRaw = await localAi.generateQuiz(workspace.id, count || 5, format || 'MCQ', topic, difficulty);
            }
        } else {
            const localAi = require('../services/localAi.service');
            quizRaw = await localAi.generateQuiz(workspace.id, count || 5, format || 'MCQ', topic, difficulty);
        }
        
        const quizClean = cleanAIJSON(quizRaw);

        let parsedQuestions = [];
        try {
            parsedQuestions = JSON.parse(quizClean);
            // Support object wrapping questions array
            if (parsedQuestions.questions && Array.isArray(parsedQuestions.questions)) {
                parsedQuestions = parsedQuestions.questions;
            }
        } catch (e) {
            return res.status(500).json({ 
                error: 'AI generated invalid quiz JSON format', 
                rawOutput: quizRaw 
            });
        }

        // Save generated quiz to WorkspaceQuiz database table
        const title = topic ? `Quiz: ${topic}` : `AI generated ${format || 'MCQ'} Quiz`;
        const quiz = await prisma.workspaceQuiz.create({
            data: {
                workspaceId: workspace.id,
                title,
                questions: JSON.stringify(parsedQuestions)
            }
        });

        res.status(201).json({
            success: true,
            quizId: quiz.id,
            title: quiz.title,
            questions: parsedQuestions
        });

    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Submit a quiz attempt result to history
 */
const submitQuizAttempt = async (req, res) => {
    const { id, quizId } = req.params;
    const { score, answers } = req.body;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const quiz = await prisma.workspaceQuiz.findFirst({
            where: { id: parseInt(quizId), workspaceId: workspace.id }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        const attempt = await prisma.workspaceQuizAttempt.create({
            data: {
                quizId: quiz.id,
                score: parseFloat(score),
                answers: JSON.stringify(answers)
            }
        });

        res.status(201).json({
            success: true,
            attempt
        });
    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Get or Generate a Knowledge Map for the workspace
 */
const getOrGenerateKnowledgeMap = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        if (workspace.knowledgeMap) {
            try {
                const mapJson = JSON.parse(workspace.knowledgeMap);
                return res.status(200).json({ success: true, knowledgeMap: mapJson });
            } catch (e) {
                console.warn('Failed to parse cached knowledge map, regenerating...');
            }
        }

        const localAi = require('../services/localAi.service');
        const mapRaw = await localAi.generateKnowledgeMap(workspace.id);
        const mapClean = cleanAIJSON(mapRaw);

        // Verify JSON syntax
        let parsedMap = [];
        try {
            parsedMap = JSON.parse(mapClean);
        } catch (e) {
            return res.status(500).json({
                error: 'AI generated invalid knowledge map JSON format',
                rawOutput: mapRaw
            });
        }

        await prisma.workspace.update({
            where: { id: workspace.id },
            data: { knowledgeMap: JSON.stringify(parsedMap) }
        });

        res.status(200).json({
            success: true,
            knowledgeMap: parsedMap
        });
    } catch (error) {
        console.error('Error fetching/generating knowledge map:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Manually regenerate the Knowledge Map (e.g. when new sources are uploaded)
 */
const regenerateKnowledgeMap = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const localAi = require('../services/localAi.service');
        const mapRaw = await localAi.generateKnowledgeMap(workspace.id);
        const mapClean = cleanAIJSON(mapRaw);

        let parsedMap = [];
        try {
            parsedMap = JSON.parse(mapClean);
        } catch (e) {
            return res.status(500).json({
                error: 'AI generated invalid knowledge map JSON format',
                rawOutput: mapRaw
            });
        }

        await prisma.workspace.update({
            where: { id: workspace.id },
            data: { knowledgeMap: JSON.stringify(parsedMap) }
        });

        res.status(200).json({
            success: true,
            knowledgeMap: parsedMap
        });
    } catch (error) {
        console.error('Error regenerating knowledge map:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Generate Flashcards from workspace materials
 */
const generateFlashcards = async (req, res) => {
    const { id } = req.params;
    const { count } = req.body;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        let cardsRaw = '';
        if (DIFY_FLASHCARD_APP_API_KEY && workspace.difyDatasetId) {
            try {
                const inputs = {
                    dataset_id: workspace.difyDatasetId,
                    count: count || 8
                };
                const outputs = await difyService.runWorkflow(DIFY_FLASHCARD_APP_API_KEY, inputs, userId);
                cardsRaw = outputs.flashcards || outputs.result || outputs.text || '';
            } catch (difyErr) {
                console.error('[Workspace Tools Controller] Dify flashcards run failed, falling back to local:', difyErr.message);
                const localAi = require('../services/localAi.service');
                cardsRaw = await localAi.generateFlashcards(workspace.id, count || 8);
            }
        } else {
            const localAi = require('../services/localAi.service');
            cardsRaw = await localAi.generateFlashcards(workspace.id, count || 8);
        }

        const cardsClean = cleanAIJSON(cardsRaw);

        let parsedCards = [];
        try {
            parsedCards = JSON.parse(cardsClean);
            // Support object wrapping flashcards array
            if (parsedCards.flashcards && Array.isArray(parsedCards.flashcards)) {
                parsedCards = parsedCards.flashcards;
            }
        } catch (e) {
            return res.status(500).json({ 
                error: 'AI generated invalid flashcard JSON format', 
                rawOutput: cardsRaw 
            });
        }

        // Save generated cards to database
        const createdCards = [];
        for (const card of parsedCards) {
            if (card.question && card.answer) {
                const createdCard = await prisma.workspaceFlashcard.create({
                    data: {
                        workspaceId: workspace.id,
                        question: card.question.trim(),
                        answer: card.answer.trim()
                    }
                });
                createdCards.push(createdCard);
            }
        }

        res.status(201).json({
            success: true,
            count: createdCards.length,
            flashcards: createdCards
        });

    } catch (error) {
        console.error('Error generating flashcards:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    generateSummary,
    generateQuiz,
    generateFlashcards,
    submitQuizAttempt,
    getOrGenerateKnowledgeMap,
    regenerateKnowledgeMap
};
