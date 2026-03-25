const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ragService = require('../services/rag.service');
const aiService = require('../services/ai.service');
const fs = require('fs-extra');
const path = require('path');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');

// Configure OpenRouter via LangChain
const chat = new ChatOpenAI({
  modelName: "meta-llama/llama-3.1-70b-instruct", // High-quality default
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://learnproof.ai", // Required by OpenRouter
      "X-Title": "LearnProof AI",
    },
  },
  temperature: 0.3,
});

/**
 * Get all subjects for the current user
 */
const getSubjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjects = await prisma.subject.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { notes: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json({
            subjects: subjects.map(s => ({
                id: s.id,
                name: s.name,
                created_at: s.created_at,
                note_count: s._count.notes
            }))
        });
    } catch (error) {
        console.error('[AskMyNotes] Error getting subjects:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new subject
 */
const createSubject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: 'Subject name is required' });

        // Limit to 10 subjects per user
        const count = await prisma.subject.count({ where: { userId } });
        if (count >= 10) return res.status(400).json({ error: 'You can only create up to 10 subjects.' });

        const subject = await prisma.subject.create({
            data: { userId, name }
        });

        res.json({ id: subject.id, name: subject.name, message: 'Subject created successfully' });
    } catch (error) {
        console.error('[AskMyNotes] Error creating subject:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a subject and its associated files/vector store
 */
const deleteSubject = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId },
            include: { notes: true }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        // Delete physical files
        for (const note of subject.notes) {
            if (await fs.exists(note.file_path)) {
                await fs.unlink(note.file_path);
            }
        }

        // Delete database records (Cascade will handle notes and chats)
        await prisma.subject.delete({ where: { id: subjectId } });

        // Delete vector store
        ragService.deleteSubjectStore(subjectId);

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('[AskMyNotes] Error deleting subject:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all notes for a specific subject
 */
const getSubjectNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId },
            include: {
                notes: {
                    orderBy: { uploaded_at: 'desc' }
                }
            }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        res.json({
            subject_name: subject.name,
            notes: subject.notes.map(n => ({
                id: n.id,
                filename: n.original_name,
                uploaded_at: n.uploaded_at,
                // We'll serve files via a dedicated route if needed, or just paths for internal use
                file_url: `/api/ask-my-notes/files/${n.id}` 
            }))
        });
    } catch (error) {
        console.error('[AskMyNotes] Error getting notes:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handle file upload for a subject
 */
const uploadNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        const note = await prisma.subjectNote.create({
            data: {
                subjectId: subject.id,
                file_path: req.file.path,
                original_name: req.file.originalname
            }
        });

        // Background processing for RAG
        ragService.processAndEmbedFile(req.file.path, subject.id, req.file.originalname)
            .then(success => console.log(`[RAG] Background processing ${req.file.originalname}: ${success}`))
            .catch(err => console.error(`[RAG] Error processing ${req.file.originalname}:`, err.message));

        res.json({ id: note.id, filename: req.file.originalname, message: 'Note uploaded and processing started' });
    } catch (error) {
        console.error('[AskMyNotes] Error uploading note:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * AI Chat using RAG on subject notes (OpenRouter + Pinecone)
 */
const chatWithNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);
        const { query, session_id } = req.body;

        if (!query) return res.status(400).json({ error: 'Query is empty' });

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        
        // 1. Get relevant snippets from Pinecone (Top 3 as requested)
        const results = await ragService.querySubjectIndex(subject.id, query, 3);
        
        let contextText = "";
        let citations = [];
        results.forEach(([doc, score], i) => {
            contextText += `[Source ${i+1}]: ${doc.pageContent}\n\n`;
            citations.push({
                filename: doc.metadata.filename,
                page: doc.metadata.page,
                snippet: doc.pageContent.substring(0, 150) + '...'
            });
        });

        // 2. Get recent chat history for LangChain
        const recentHistory = await prisma.askMyNoteChat.findMany({
            where: { subjectId: subject.id, session_id: session_id || 'default' },
            orderBy: { timestamp: 'desc' },
            take: 5
        });

        const messages = [
            new SystemMessage(`You are a study assistant for '${subject.name}'. 
            Answer ONLY using the provided context and history. 
            If not found, say you don't know based on the notes. 
            Context: \n${contextText}`),
        ];

        // Add history
        recentHistory.reverse().forEach(m => {
            messages.push(new HumanMessage(m.query));
            messages.push(new AIMessage(m.response));
        });

        // Add current query
        messages.push(new HumanMessage(query));

        // 3. Single API call to OpenRouter
        const response = await chat.invoke(messages);
        const finalAnswer = response.content;

        // 4. Save to database
        await prisma.askMyNoteChat.create({
            data: {
                subjectId: subject.id,
                session_id: session_id || 'default',
                query,
                response: finalAnswer,
                citations: JSON.stringify(citations),
                confidence: 90 // Default for LLM synthesis
            }
        });

        res.json({
            response: finalAnswer,
            citations: citations,
            confidence: 90
        });

    } catch (error) {
        console.error('[AskMyNotes] Chat error:', error.message);
        res.status(500).json({ error: 'Error communicating with AI', details: error.message });
    }
};

/**
 * Real-time Streaming AI Chat
 */
const chatWithNotesStream = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);
        const { query, session_id } = req.body;

        if (!query) return res.status(400).json({ error: 'Query is empty' });

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        // SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 1. Get History (Increased memory for better context)
        const recentHistory = await prisma.askMyNoteChat.findMany({
            where: { subjectId: subject.id, session_id: session_id || 'default' },
            orderBy: { timestamp: 'desc' },
            take: 4 // increased from 2
        });
        const historyText = recentHistory.reverse().map(m => `Student: ${m.query}\nAI: ${m.response}`).join('\n') || "None";

        // 3. Standalone Query Generation (Re-writing for better RAG)
        let standaloneQuery = query;
        try {
            const rewriter = await cerebras.chat.completions.create({
                model: 'llama3.1-8b',
                messages: [
                    { role: 'system', content: 'You are a search query optimizer. Given a conversation history and a follow-up question, generate a standalone, descriptive search query (maximum 10 words) to find information in a textbook. Return ONLY the query.' },
                    { role: 'user', content: `History:\n${historyText}\n\nFollow-up Question: ${query}\n\nStandalone Search Query:` }
                ],
                temperature: 0
            });
            standaloneQuery = rewriter.choices[0]?.message?.content?.trim() || query;
            console.log(`[RAG] Re-written query: "${standaloneQuery}"`);
        } catch (err) {
            console.warn("[RAG] Query re-writing failed, using original.");
        }

        // 4. Get Better Context with re-written query
        const results = await ragService.querySubjectIndex(subject.id, standaloneQuery, 8); 

        // Auto-recovery for streaming as well
        if (results.length === 0 && recentHistory.length === 0) {
            const notes = await prisma.subjectNote.findMany({ where: { subjectId: subject.id } });
            if (notes.length > 0) {
                console.log(`[RAG-Auto] (Stream) Empty results for ${subject.name}. Triggering recovery check.`);
                notes.forEach(note => {
                    ragService.processAndEmbedFile(note.file_path, subject.id, note.original_name)
                        .catch(err => console.warn(`[RAG-Auto] Background indexing failed: ${err.message}`));
                });
            }
        }
        let contextText = "";
        let citations = [];
        results.forEach(([doc, score], i) => {
            const snippet = doc.pageContent.replace(/\n/g, ' ').trim();
            const filename = doc.metadata.filename || 'Unknown';
            const pageNum = doc.metadata.page || 'N/A';
            contextText += `---\n[Source ${i+1}] (From ${filename}, Page ${pageNum}):\n${snippet}\n`;
            citations.push({ filename, page: pageNum, snippet: snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet }); 
        });

        // Send metadata AFTER search is done
        res.write(`data: ${JSON.stringify({ type: 'metadata', citations })}\n\n`);

        // 5. Final Synthesis using a more powerful model
        const stream = await cerebras.chat.completions.create({
            model: 'qwen-3-235b-a22b-instruct-2507', 
            stream: true,
            messages: [
                { 
                    role: 'system', 
                    content: `You are an expert Academic Tutor for '${subject.name}'. 
Your goal is to provide comprehensive, well-structured, and accurate responses based on the provided Source Material.

STRICT INSTRUCTIONS:
1. THINK FIRST: Analyze the context and history before responding.
2. SYNTHESIZE: Don't just quote bits. Combine information from multiple sources to create a coherent explanation.
3. CITATIONS: Use [Source N] in-text citations when referencing specific information.
4. FORMATTING: Use Markdown headers (###), bold text for key terms, and bullet points for lists.
5. GROUNDING: If the context is missing specific details, use your general knowledge to fill in the gaps for a complete answer, but PRIORITIZE the notes.
6. STYLE: Be encouraging, professional, and clear.` 
                },
                { role: 'user', content: `HISTORY LOG:\n${historyText}\n\nSTUDY MATERIAL SNIPPETS:\n${contextText}\n\nQUESTION: ${query}` }
            ],
            temperature: 0.3
        });

        let fullContent = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                fullContent += content;
                res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
            }
        }

        // Save to DB and wait before ending response for consistency
        try {
            await prisma.askMyNoteChat.create({
                data: {
                    subjectId: subject.id,
                    session_id: session_id || 'default',
                    query,
                    response: fullContent,
                    citations: JSON.stringify(citations),
                    confidence: fullContent.includes("Not found in your notes") ? 0 : 90
                }
            });
        } catch (dbErr) {
            console.error("[RAG] DB Save stream failed", dbErr);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('[AskMyNotes] Stream error:', error.message);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`);
        res.end();
    }
};

/**
 * Get Smart Suggestions for a subject
 */
const getSmartSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const fullText = await ragService.getFullSubjectText(subject.id);
        if (!fullText.trim()) return res.json({ suggestions: ["Upload notes to get started", "Ask about this subject"] });

        const prompt = `Based on the following notes for '${subject.name}', generate 4 short, engaging "Quick Action" questions or prompts a student might want to ask. 
        Example: "Summarize the key concepts", "Explain the transport layer in 5 points".
        Return ONLY a JSON array of strings.
        
        Material: ${fullText.substring(0, 3000)}`;

        const completion = await cerebras.chat.completions.create({
            model: 'llama3.1-8b',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const suggestions = JSON.parse(completion.choices[0].message.content);
        res.json({ suggestions: suggestions.suggestions || suggestions });

    } catch (error) {
        res.json({ suggestions: ["Summarize my notes", "Key takeaways", "Explain the main topic"] });
    }
};

/**
 * Get chat history for a subject/session
 */
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);
        const { session_id } = req.query;

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const history = await prisma.askMyNoteChat.findMany({
            where: { 
                subjectId: subject.id,
                ...(session_id ? { session_id } : {})
            },
            orderBy: { timestamp: 'asc' }
        });

        res.json({
            history: history.map(m => ({
                query: m.query,
                response: m.response,
                session_id: m.session_id,
                citations: m.citations ? JSON.parse(m.citations) : [],
                confidence: m.confidence,
                timestamp: m.timestamp
            }))
        });
    } catch (error) {
        console.error('[AskMyNotes] History error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all chat sessions for a subject
 */
const getChatSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const chats = await prisma.askMyNoteChat.findMany({
            where: { subjectId: subject.id },
            orderBy: { timestamp: 'desc' }
        });

        const sessionsDict = {};
        chats.forEach(msg => {
            const sid = msg.session_id || 'default';
            if (!sessionsDict[sid]) {
                sessionsDict[sid] = {
                    id: sid,
                    title: msg.query.length > 40 ? msg.query.substring(0, 40) + '...' : msg.query,
                    created_at: msg.timestamp,
                    last_updated: msg.timestamp
                };
            }
        });

        res.json({ 
            sessions: Object.values(sessionsDict).sort((a, b) => 
                new Date(b.last_updated) - new Date(a.last_updated)
            ) 
        });
    } catch (error) {
        console.error('[AskMyNotes] Sessions error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Generate a quiz from subject notes
 */
const generateQuizFromNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);
        const { mcqCount = 5, shortCount = 3 } = req.body;

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const fullText = await ragService.getFullSubjectText(subject.id);
        if (!fullText.trim()) return res.status(400).json({ error: 'No notes available to generate a quiz.' });

        const quiz_prompt = `You are a senior professor. Based on the study material for '${subject.name}', generate a JSON quiz.
    
CRITICAL:
1. Generate EXACTLY ${mcqCount} MCQs (type: "mcq").
2. Generate EXACTLY ${shortCount} Short-Answer Questions (type: "short").
3. Each MCQ must have 4 options, a correct 'answer', and a concise 'explanation'.
4. Each Short-Answer must have a 'answer' (model answer).

JSON SCHEMA:
{
  "questions": [
    { "id": 1, "type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "answer": "...", "explanation": "..." },
    { "id": ${mcqCount}+1, "type": "short", "question": "...", "answer": "..." }
  ]
}

Return ONLY the raw JSON string.

Material:
${fullText.substring(0, 15000)}

Quiz JSON:`;

const completion = await cerebras.chat.completions.create({
            model: 'llama3.1-8b',
            messages: [
                { role: 'system', content: 'You are a senior professor. Generate a JSON quiz based on the material.' },
                { role: 'user', content: quiz_prompt }
            ],
            response_format: { type: 'json_object' }
        });
        
        const quizJson = JSON.parse(completion.choices[0].message.content);
        
        res.json(quizJson);

    } catch (error) {
        console.error('[AskMyNotes] Quiz generation error:', error.message);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
};

/**
 * Serve a specific note file
 */
const serveNoteFile = async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = parseInt(req.params.noteId);

        const note = await prisma.subjectNote.findFirst({
            where: { 
                id: noteId,
                subject: { userId }
            }
        });

        if (!note) return res.status(404).json({ error: 'Note not found' });
        
        if (await fs.exists(note.file_path)) {
            res.sendFile(note.file_path);
        } else {
            res.status(404).json({ error: 'File not found on disk' });
        }
    } catch (error) {
        console.error('[AskMyNotes] Serve file error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

const reindexSubject = async (req, res) => {
    try {
        const userId = req.user.id;
        const subjectId = parseInt(req.params.id);

        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId },
            include: { notes: true }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        // Background re-index for each note
        for (const note of subject.notes) {
            ragService.processAndEmbedFile(note.file_path, subject.id, note.original_name)
                .catch(err => console.error(`[RAG-Auto] Error background processing ${note.original_name}:`, err.message));
        }

        res.json({ message: 'Indexing check started in background.' });
    } catch (error) {
        console.error('[AskMyNotes] Reindex error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSubjects,
    createSubject,
    deleteSubject,
    getSubjectNotes,
    uploadNote,
    chatWithNotes,
    chatWithNotesStream,
    getChatHistory,
    getChatSessions,
    generateQuizFromNotes,
    serveNoteFile,
    getSmartSuggestions,
    reindexSubject
};
