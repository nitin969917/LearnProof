const prisma = require('../lib/prisma');
const difyService = require('../services/dify.service');

const DIFY_CHAT_APP_API_KEY = process.env.DIFY_CHAT_APP_API_KEY || '';

/**
 * List all chat sessions in a workspace
 */
const getChats = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const chats = await prisma.workspaceChatSession.findMany({
            where: { workspaceId: workspace.id },
            orderBy: { updatedAt: 'desc' }
        });

        res.status(200).json({ success: true, chats });
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Create a new chat session
 */
const createChat = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const { title } = req.body;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const chatSession = await prisma.workspaceChatSession.create({
            data: {
                workspaceId: workspace.id,
                title: title ? title.trim() : 'New Chat'
            }
        });

        res.status(201).json({ success: true, chatSession });
    } catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get messages inside a chat session
 */
const getChatMessages = async (req, res) => {
    const { id, sessionId } = req.params; // Workspace ID, Session ID
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const session = await prisma.workspaceChatSession.findFirst({
            where: { id: parseInt(sessionId), workspaceId: workspace.id }
        });

        if (!session) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        const messages = await prisma.workspaceChatMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'asc' }
        });

        // Parse citations back to JSON objects
        const formattedMessages = messages.map(m => ({
            ...m,
            citations: m.citations ? JSON.parse(m.citations) : []
        }));

        res.status(200).json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Send a chat message and stream the Dify SSE response
 */
const sendChatMessage = async (req, res) => {
    const { id, sessionId } = req.params;
    const { query, conversationId } = req.body;
    const userId = req.user.id;

    if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // 1. Authenticate workspace and session ownership
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const session = await prisma.workspaceChatSession.findFirst({
            where: { id: parseInt(sessionId), workspaceId: workspace.id }
        });

        if (!session) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        // 2. Setup server-sent events streaming headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // 3. Prepare dataset ID context inputs for Dify
        const inputs = {};
        if (workspace.difyDatasetId) {
            // Note: If Dify Chat app is configured to use external dataset_ids parameter, pass it here
            inputs.dataset_ids = [workspace.difyDatasetId];
        }

        let completeAnswer = '';
        let finalCitations = [];
        let difyConvId = conversationId || '';

        // Save User query to DB immediately
        const userMsg = await prisma.workspaceChatMessage.create({
            data: {
                sessionId: session.id,
                role: 'user',
                content: query.trim()
            }
        });

        // 4. Trigger streaming AI response: Use Dify if configured, else fallback to local Gemini stream
        const runDifyChatStream = async () => {
            await difyService.streamChatResponse(
                DIFY_CHAT_APP_API_KEY,
                query.trim(),
                inputs,
                userId,
                difyConvId,
                (tokenData) => {
                    const token = tokenData.answer;
                    completeAnswer += token;
                    difyConvId = tokenData.conversationId || difyConvId;
                    res.write(`data: ${JSON.stringify({ event: 'token', token })}\n\n`);
                },
                async (completionData) => {
                    finalCitations = completionData.citations || [];
                    const normalizedAnswer = completeAnswer.toLowerCase().trim();
                    const isIdk = normalizedAnswer.includes("i don't know") || 
                                   normalizedAnswer.includes("don't have information") || 
                                   normalizedAnswer.includes("no documents uploaded") ||
                                   (finalCitations.length === 0 && normalizedAnswer.length < 150);

                    if (isIdk) {
                        console.log('[Workspace Chat Controller] Dify returned empty/IDK response. Falling back to local OCR-based stream...');
                        // Reset accumulated answer and trigger local fallback stream
                        completeAnswer = '';
                        await runLocalChatStream();
                        return;
                    }

                    const assistantMsg = await prisma.workspaceChatMessage.create({
                        data: {
                            sessionId: session.id,
                            role: 'assistant',
                            content: completeAnswer.trim(),
                            citations: finalCitations.length > 0 ? JSON.stringify(finalCitations) : null
                        }
                    });

                    if (session.title === 'New Chat') {
                        const cleanTitle = query.trim().length > 30 ? query.trim().substring(0, 27) + '...' : query.trim();
                        await prisma.workspaceChatSession.update({
                            where: { id: session.id },
                            data: { title: cleanTitle }
                        });
                    } else {
                        await prisma.workspaceChatSession.update({
                            where: { id: session.id },
                            data: { updatedAt: new Date() }
                        });
                    }

                    res.write(`data: ${JSON.stringify({ 
                        event: 'complete', 
                        messageId: assistantMsg.id, 
                        citations: finalCitations,
                        conversationId: difyConvId
                    })}\n\n`);
                    res.end();
                },
                (streamError) => {
                    console.error('[Workspace Chat Controller] Dify stream error, falling back to local chat stream:', streamError.message || streamError);
                    completeAnswer = '';
                    runLocalChatStream();
                }
            );
        };

        const runLocalChatStream = async () => {
            try {
                // Fetch the last 10 messages from this session for conversation context
                const recentMessages = await prisma.workspaceChatMessage.findMany({
                    where: { sessionId: session.id },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: { role: true, content: true }
                });
                // Reverse to chronological order (exclude the just-saved user message at index 0)
                const chatHistory = recentMessages.reverse().filter(m => m.content && m.content.trim());

                const localAi = require('../services/localAi.service');
                await localAi.streamChat(
                    workspace.id,
                    query.trim(),
                    userId,
                    chatHistory,
                    (tokenData) => {
                        const token = tokenData.answer;
                        completeAnswer += token;
                        res.write(`data: ${JSON.stringify({ event: 'token', token })}\n\n`);
                    },
                    async (completionData) => {
                        finalCitations = completionData.citations || [];
                        const assistantMsg = await prisma.workspaceChatMessage.create({
                            data: {
                                sessionId: session.id,
                                role: 'assistant',
                                content: completeAnswer.trim(),
                                citations: finalCitations.length > 0 ? JSON.stringify(finalCitations) : null
                            }
                        });

                        if (session.title === 'New Chat') {
                            const cleanTitle = query.trim().length > 30 ? query.trim().substring(0, 27) + '...' : query.trim();
                            await prisma.workspaceChatSession.update({
                                where: { id: session.id },
                                data: { title: cleanTitle }
                            });
                        } else {
                            await prisma.workspaceChatSession.update({
                                where: { id: session.id },
                                data: { updatedAt: new Date() }
                            });
                        }

                        res.write(`data: ${JSON.stringify({ 
                            event: 'complete', 
                            messageId: assistantMsg.id, 
                            citations: finalCitations,
                            conversationId: `local-conv-${workspace.id}`
                        })}\n\n`);
                        res.end();
                    },
                    (streamError) => {
                        console.error('[Workspace Chat Controller] Local Gemini stream error:', streamError.message || streamError);
                        res.write(`data: ${JSON.stringify({ event: 'error', error: streamError.message || 'Stream processing failed' })}\n\n`);
                        res.end();
                    }
                );
            } catch (fallbackErr) {
                console.error('[Workspace Chat Controller] Local fallback failed:', fallbackErr.message);
                res.write(`data: ${JSON.stringify({ event: 'error', error: fallbackErr.message || 'Processing failed' })}\n\n`);
                res.end();
            }
        };

        if (DIFY_CHAT_APP_API_KEY && workspace.difyDatasetId) {
            await runDifyChatStream();
        } else {
            await runLocalChatStream();
        }

    } catch (error) {
        console.error('Error handling chat session:', error);
        // If headers weren't sent yet, send 500. Otherwise, write error event and close stream.
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ event: 'error', error: 'Internal server error occurred' })}\n\n`);
            res.end();
        }
    }
};

module.exports = {
    getChats,
    createChat,
    getChatMessages,
    sendChatMessage
};
