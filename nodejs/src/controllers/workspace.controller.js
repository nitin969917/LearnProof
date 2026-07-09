const prisma = require('../lib/prisma');
const difyService = require('../services/dify.service');
const fs = require('fs');
const path = require('path');

/**
 * Helper to sanitize workspace name for Dify dataset name requirements
 */
const sanitizeDatasetName = (name) => {
    return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
};

/**
 * Create a new Workspace
 */
const createWorkspace = async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Workspace name is required' });
    }

    try {
        // 1. Create Workspace in database first to get unique ID
        const workspace = await prisma.workspace.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                userId
            }
        });

        // 2. Create Dataset in Dify
        let difyDatasetId = null;
        try {
            const sanitizedName = `lp_${workspace.id}_${sanitizeDatasetName(name)}`;
            const difyDataset = await difyService.createDataset(sanitizedName, description || `LearnProof Workspace for ${name}`);
            difyDatasetId = difyDataset.id;

            // Update database with Dify Dataset ID
            await prisma.workspace.update({
                where: { id: workspace.id },
                data: { difyDatasetId }
            });
        } catch (difyErr) {
            console.error('[Workspace Controller] Failed to create Dify dataset, continuing anyway:', difyErr.message);
        }

        res.status(201).json({
            success: true,
            workspace: {
                ...workspace,
                difyDatasetId
            }
        });
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * List all workspaces for the current user
 */
const getWorkspaces = async (req, res) => {
    const userId = req.user.id;

    try {
        const workspaces = await prisma.workspace.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, workspaces });
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get details of a single workspace including its sources
 */
const getWorkspaceDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId },
            include: {
                sources: {
                    orderBy: { createdAt: 'desc' }
                },
                notes: {
                    orderBy: { updatedAt: 'desc' }
                },
                quizzes: {
                    orderBy: { createdAt: 'desc' }
                },
                flashcards: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        res.status(200).json({ success: true, workspace });
    } catch (error) {
        console.error('Error fetching workspace details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Delete a Workspace
 */
const deleteWorkspace = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        // 1. Delete dataset in Dify (best effort)
        if (workspace.difyDatasetId) {
            try {
                await difyService.deleteDataset(workspace.difyDatasetId);
            } catch (difyErr) {
                console.error('[Workspace Controller] Failed to delete Dify dataset:', difyErr.message);
            }
        }

        // 2. Delete Workspace in Postgres (Cascade will delete local sources)
        // Note: We should delete physical files for local sources
        const sources = await prisma.knowledgeSource.findMany({
            where: { workspaceId: workspace.id }
        });

        for (const source of sources) {
            if (source.fileUrl && fs.existsSync(source.fileUrl)) {
                try {
                    fs.unlinkSync(source.fileUrl);
                } catch (err) {
                    console.error(`Failed to delete local file: ${source.fileUrl}`, err.message);
                }
            }
        }

        await prisma.workspace.delete({
            where: { id: workspace.id }
        });

        res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Upload a document source to the workspace
 */
const uploadSource = async (req, res) => {
    const { id } = req.params; // Workspace ID
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            // Cleanup uploaded file if workspace doesn't exist
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const ext = path.extname(req.file.originalname).toUpperCase().replace('.', '');
        const filename = req.file.originalname;

        // 1. Save KnowledgeSource entry as PROCESSING
        const source = await prisma.knowledgeSource.create({
            data: {
                workspaceId: workspace.id,
                type: ext,
                name: filename,
                fileUrl: req.file.path,
                status: 'PROCESSING'
            }
        });

        // 2. Ingest document: Use Dify if configured, else parse locally via Gemini Fallback
        if (workspace.difyDatasetId) {
            // Trigger asynchronous upload
            difyService.uploadFileToDataset(workspace.difyDatasetId, req.file.path, filename)
                .then(async (difyResponse) => {
                    const docId = difyResponse.document?.id;
                    // Parse text locally anyway so we have fallback context for chat if Dify is down
                    let extractedText = '';
                    try {
                        const localAi = require('../services/localAi.service');
                        extractedText = await localAi.parseLocalFile(req.file.path, ext);
                    } catch (parseErr) {
                        console.error('[Workspace Controller] Optional local parse failed:', parseErr.message);
                    }

                    try {
                        await prisma.knowledgeSource.update({
                            where: { id: source.id },
                            data: {
                                status: 'INDEXED',
                                difyDocumentId: docId,
                                metadata: extractedText ? JSON.stringify({ extractedText }) : null
                            }
                        });
                        console.log(`[Workspace Controller] Ingested document ${filename} to Dify successfully.`);
                    } catch (dbErr) {
                        console.warn(`[Workspace Controller] Database update skipped (document likely deleted):`, dbErr.message);
                    }
                })
                .catch(async (difyErr) => {
                    console.error('[Workspace Controller] Dify upload failed for document, attempting local parse fallback:', filename, difyErr.message);
                    
                    // Attempt local parse fallback since Dify failed
                    try {
                        const localAi = require('../services/localAi.service');
                        const extractedText = await localAi.parseLocalFile(req.file.path, ext);
                        try {
                            await prisma.knowledgeSource.update({
                                where: { id: source.id },
                                data: {
                                    status: 'INDEXED',
                                    metadata: JSON.stringify({ extractedText })
                                }
                            });
                            console.log(`[Workspace Controller] Ingested document ${filename} locally via fallback after Dify failure.`);
                        } catch (dbErr) {
                            console.warn(`[Workspace Controller] Database update skipped (document likely deleted):`, dbErr.message);
                        }
                    } catch (fallbackErr) {
                        try {
                            await prisma.knowledgeSource.update({
                                where: { id: source.id },
                                data: {
                                    status: 'FAILED',
                                    errorMessage: difyErr.message
                                }
                            });
                        } catch (dbErr) {
                            console.warn(`[Workspace Controller] Database update skipped (document likely deleted):`, dbErr.message);
                        }
                    }
                });
        } else {
            // Local Fallback Mode
            const localAi = require('../services/localAi.service');
            localAi.parseLocalFile(req.file.path, ext)
                .then(async (extractedText) => {
                    try {
                        await prisma.knowledgeSource.update({
                            where: { id: source.id },
                            data: {
                                status: 'INDEXED',
                                metadata: JSON.stringify({ extractedText })
                            }
                        });
                        console.log(`[Workspace Controller] Ingested document ${filename} locally via fallback.`);
                    } catch (dbErr) {
                        console.warn(`[Workspace Controller] Database update skipped (document likely deleted):`, dbErr.message);
                    }
                })
                .catch(async (err) => {
                    console.error('[Workspace Controller] Local fallback parsing failed:', err.message);
                    try {
                        await prisma.knowledgeSource.update({
                            where: { id: source.id },
                            data: {
                                status: 'FAILED',
                                errorMessage: `Local parsing failed: ${err.message}`
                            }
                        });
                    } catch (dbErr) {
                        console.warn(`[Workspace Controller] Database update skipped (document likely deleted):`, dbErr.message);
                    }
                });
        }

        // Return immediately with the source row (currently in PROCESSING)
        res.status(202).json({
            success: true,
            source
        });
    } catch (error) {
        console.error('Error uploading source:', error);
        // Cleanup uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Delete a source from the workspace
 */
const deleteSource = async (req, res) => {
    const { id, sourceId } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const source = await prisma.knowledgeSource.findFirst({
            where: { id: parseInt(sourceId), workspaceId: workspace.id }
        });

        if (!source) {
            return res.status(404).json({ error: 'Source not found' });
        }

        // 1. Delete document in Dify (best effort)
        if (workspace.difyDatasetId && source.difyDocumentId) {
            try {
                await difyService.deleteDocumentFromDataset(workspace.difyDatasetId, source.difyDocumentId);
            } catch (difyErr) {
                console.error('[Workspace Controller] Failed to delete Dify document:', difyErr.message);
            }
        }

        // 2. Delete physical file locally
        if (source.fileUrl && fs.existsSync(source.fileUrl)) {
            try {
                fs.unlinkSync(source.fileUrl);
            } catch (err) {
                console.error(`Failed to delete local file: ${source.fileUrl}`, err.message);
            }
        }

        // 3. Delete DB record
        await prisma.knowledgeSource.delete({
            where: { id: source.id }
        });

        res.status(200).json({ success: true, message: 'Source deleted successfully' });
    } catch (error) {
        console.error('Error deleting source:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * List all notes in a workspace
 */
const getNotes = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const notes = await prisma.workspaceNote.findMany({
            where: { workspaceId: workspace.id },
            orderBy: { updatedAt: 'desc' }
        });

        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Create a new Note in a workspace
 */
const createNote = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Note title is required' });
    }

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const note = await prisma.workspaceNote.create({
            data: {
                workspaceId: workspace.id,
                title: title.trim(),
                content: content ? content.trim() : ''
            }
        });

        res.status(201).json({ success: true, note });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Update an existing Note in a workspace
 */
const updateNote = async (req, res) => {
    const { id, noteId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const note = await prisma.workspaceNote.findFirst({
            where: { id: parseInt(noteId), workspaceId: workspace.id }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const updatedNote = await prisma.workspaceNote.update({
            where: { id: note.id },
            data: {
                title: title !== undefined ? title.trim() : note.title,
                content: content !== undefined ? content.trim() : note.content
            }
        });

        res.status(200).json({ success: true, note: updatedNote });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Delete a Note from a workspace
 */
const deleteNote = async (req, res) => {
    const { id, noteId } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const note = await prisma.workspaceNote.findFirst({
            where: { id: parseInt(noteId), workspaceId: workspace.id }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        await prisma.workspaceNote.delete({
            where: { id: note.id }
        });

        res.status(200).json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Preview / stream a document directly in the browser
 */
const previewSource = async (req, res) => {
    const { id, sourceId } = req.params;
    const userId = req.user.id;

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const source = await prisma.knowledgeSource.findFirst({
            where: { id: parseInt(sourceId), workspaceId: workspace.id }
        });

        if (!source) {
            return res.status(404).json({ error: 'Source document not found' });
        }

        if (!source.fileUrl || !fs.existsSync(source.fileUrl)) {
            return res.status(404).json({ error: 'Source file not found on disk' });
        }

        // Determine content-type
        const ext = path.extname(source.fileUrl).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.txt') contentType = 'text/plain';
        else if (ext === '.md') contentType = 'text/markdown';
        else if (ext === '.csv') contentType = 'text/csv';
        else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${source.name}"`);
        res.sendFile(path.resolve(source.fileUrl));
    } catch (error) {
        console.error('Error previewing document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createWorkspace,
    getWorkspaces,
    getWorkspaceDetails,
    deleteWorkspace,
    uploadSource,
    deleteSource,
    previewSource,
    getNotes,
    createNote,
    updateNote,
    deleteNote
};
