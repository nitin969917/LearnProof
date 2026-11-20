const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const flowpilotService = require('../services/flowpilot.service');

const UPLOAD_DIR = path.join(__dirname, '../../media/workspaces');

/**
 * Extract Table of Contents / Outline for a specific uploaded document in a workspace
 */
const getBookOutline = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const { sourceId, sourceName, fileUrl, workspaceName } = req.body;
    const userId = req.user?.id;

    try {
        let workspace = null;
        try {
            workspace = await prisma.workspace.findFirst({
                where: { id: parseInt(id) },
                include: { sources: true }
            });
        } catch (e) {
            console.warn('[FlowPilot] Local workspace lookup warning:', e.message);
        }

        const source = workspace?.sources?.find(s => s.id === parseInt(sourceId));
        const resolvedSourceName = sourceName || source?.name || workspace?.name || 'Database Management Systems';
        const resolvedWorkspaceName = workspaceName || workspace?.name || '';

        let filePath = null;
        if (source && source.fileUrl) {
            filePath = path.join(UPLOAD_DIR, path.basename(source.fileUrl));
        }

        const outline = await flowpilotService.extractBookOutline(filePath, resolvedSourceName, resolvedWorkspaceName);
        return res.status(200).json({
            success: true,
            sourceName: resolvedSourceName,
            ...outline
        });
    } catch (error) {
        console.error('[FlowPilot Controller] getBookOutline error:', error);
        return res.status(200).json({ success: true, hasOutline: false, chapters: [] });
    }
};

/**
 * Start a new FlowPilot Study Sprint
 */
const startSprint = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const { 
        topic, 
        selectedChapters = [], 
        selectedTopics = [],
        sourceId, 
        sourceName,
        workspaceName,
        targetPersona = 'general', 
        duration = 25 
    } = req.body;
    const userId = req.user?.id;

    try {
        let workspace = null;
        try {
            workspace = await prisma.workspace.findFirst({
                where: { id: parseInt(id) },
                include: { sources: true }
            });
        } catch (e) {
            console.warn('[FlowPilot] Local workspace lookup warning:', e.message);
        }

        let contextText = req.body.contextText || '';
        // If a specific source is selected, read text context if locally available
        if (sourceId && workspace?.sources) {
            const source = workspace.sources.find(s => s.id === parseInt(sourceId));
            if (source && source.fileUrl) {
                const filePath = path.join(UPLOAD_DIR, path.basename(source.fileUrl));
                if (fs.existsSync(filePath)) {
                    const ext = path.extname(filePath).toLowerCase();
                    if (ext === '.pdf') {
                        const pdfParse = require('pdf-parse');
                        const dataBuffer = fs.readFileSync(filePath);
                        const parsed = await pdfParse(dataBuffer, { max: 30 });
                        contextText = parsed.text || '';
                    } else if (['.txt', '.md'].includes(ext)) {
                        contextText = fs.readFileSync(filePath, 'utf8').substring(0, 15000);
                    }
                }
            }
        }

        // Derive meaningful, high-impact topic
        let effectiveTopic = topic ? topic.trim() : '';
        if (!effectiveTopic || effectiveTopic.toLowerCase() === 'new') {
            if (selectedTopics.length > 0) {
                effectiveTopic = selectedTopics.join(' • ');
            } else if (sourceName) {
                effectiveTopic = sourceName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            } else if (workspace?.name && workspace.name.toLowerCase() !== 'new') {
                effectiveTopic = workspace.name;
            } else if (workspaceName && workspaceName.toLowerCase() !== 'new') {
                effectiveTopic = workspaceName;
            } else {
                effectiveTopic = 'Physics & Science Derivations';
            }
        }

        console.log(`[FlowPilot Controller] Generating sprint for topic: "${effectiveTopic}" (Persona: ${targetPersona}, Duration: ${duration}m, Topics: ${selectedTopics.length})...`);

        const sprintData = await flowpilotService.generateSprintPlan({
            topic: effectiveTopic,
            selectedChapters,
            selectedTopics,
            contextText,
            targetPersona,
            duration: parseInt(duration) || 25
        });

        return res.status(200).json({
            success: true,
            workspaceId: workspace?.id || parseInt(id) || 1,
            workspaceName: workspace?.name || workspaceName || 'Subject',
            ...sprintData
        });
    } catch (error) {
        console.error('[FlowPilot Controller] startSprint error:', error);
        return res.status(500).json({ error: 'Failed to generate study sprint', details: error.message });
    }
};

/**
 * Evaluate Socratic Voice Answer in real-time (<1 second)
 */
const evaluateVoice = async (req, res) => {
    const { question, idealAnswer, expectedKeywords, studentSpeech } = req.body;

    try {
        const evaluation = await flowpilotService.evaluateVoiceAnswer({
            question,
            idealAnswer,
            expectedKeywords,
            studentSpeech
        });

        return res.status(200).json({
            success: true,
            ...evaluation
        });
    } catch (error) {
        console.error('[FlowPilot Controller] evaluateVoice error:', error);
        return res.status(500).json({ error: 'Failed to evaluate voice response' });
    }
};

/**
 * Instant S.O.S. Doubt Dissolver
 */
const dissolveDoubt = async (req, res) => {
    const { contextTopic, studentQuestion } = req.body;

    if (!studentQuestion || !studentQuestion.trim()) {
        return res.status(400).json({ error: 'Doubt question is required' });
    }

    try {
        const solution = await flowpilotService.dissolveDoubt({
            contextTopic,
            studentQuestion: studentQuestion.trim()
        });

        return res.status(200).json({
            success: true,
            ...solution
        });
    } catch (error) {
        console.error('[FlowPilot Controller] dissolveDoubt error:', error);
        return res.status(500).json({ error: 'Failed to dissolve doubt' });
    }
};

/**
 * Grade student's physical handwritten paper solution (Rung 4)
 */
const gradeHandwritten = async (req, res) => {
    const { examQuestion, markingRubric, imageBase64 } = req.body;

    try {
        let imageData = imageBase64;
        let mimeType = 'image/jpeg';

        // Check if an image file was uploaded via multipart/form-data
        if (req.file) {
            const fileBuffer = fs.readFileSync(req.file.path);
            imageData = fileBuffer.toString('base64');
            mimeType = req.file.mimetype || 'image/jpeg';
            // Clean up temporary upload file
            fs.unlink(req.file.path, () => {});
        }

        if (!imageData) {
            return res.status(400).json({ error: 'Handwritten paper image is required' });
        }

        let parsedRubric = markingRubric;
        if (typeof markingRubric === 'string') {
            try {
                parsedRubric = JSON.parse(markingRubric);
            } catch (e) {
                parsedRubric = [];
            }
        }

        const evaluation = await flowpilotService.gradeHandwrittenProof({
            examQuestion,
            markingRubric: parsedRubric,
            imageBase64: imageData,
            mimeType
        });

        return res.status(200).json({
            success: true,
            ...evaluation
        });
    } catch (error) {
        console.error('[FlowPilot Controller] gradeHandwritten error:', error);
        return res.status(500).json({ error: 'Failed to grade handwritten paper', details: error.message });
    }
};

/**
 * Complete study sprint: save victory notes, schedule retention, and award XP
 */
const completeSprint = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const { 
        topic, 
        durationMinutes = 25, 
        rungsCompleted = 4, 
        score = 100, 
        summaryMarkdown = '', 
        handwrittenNotes = null 
    } = req.body;
    const userId = req.user.id;

    try {
        let workspace = null;
        try {
            workspace = await prisma.workspace.findFirst({
                where: { id: parseInt(id) }
            });
        } catch (e) {
            console.warn('[FlowPilot] Local workspace lookup warning:', e.message);
        }

        // 1. Save summary into WorkspaceNote if workspace exists locally
        let savedNote = null;
        if (workspace) {
            const noteTitle = `FlowPilot Mastered: ${topic} - ${new Date().toLocaleDateString()}`;
            savedNote = await prisma.workspaceNote.create({
                data: {
                    workspaceId: workspace.id,
                    title: noteTitle,
                    content: summaryMarkdown || `# ${topic}\n\n**Deep Focus Sprint Completed:** ${durationMinutes} minutes\n\n- Mastered ${rungsCompleted}/4 Cognitive Rungs\n- Verified Score: ${score}%\n\n---\n*Saved to your LearnProof Digital Notebook.*`
                }
            }).catch(e => {
                console.warn('[FlowPilot] Could not create local note:', e.message);
                return null;
            });
        }

        // 2. Award XP and log user activity
        const xpEarned = parseInt(durationMinutes) * 10;
        try {
            await prisma.userProfile.update({
                where: { id: userId },
                data: {
                    xp: { increment: xpEarned }
                }
            });

            await prisma.userActivityLog.create({
                data: {
                    userId,
                    activity_type: `flowpilot_sprint_completed_${topic.substring(0, 30)}`
                }
            });
        } catch (xpErr) {
            console.warn('[FlowPilot] Non-critical XP update error:', xpErr.message);
        }

        return res.status(200).json({
            success: true,
            noteId: savedNote.id,
            xpEarned,
            scheduledRetentionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
    } catch (error) {
        console.error('[FlowPilot Controller] completeSprint error:', error);
        return res.status(500).json({ error: 'Failed to complete sprint', details: error.message });
    }
};

module.exports = {
    getBookOutline,
    startSprint,
    evaluateVoice,
    dissolveDoubt,
    gradeHandwritten,
    completeSprint
};
