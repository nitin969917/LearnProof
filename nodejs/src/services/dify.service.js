const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DIFY_API_URL = process.env.DIFY_API_URL || 'http://localhost:5001/v1';
const DIFY_DATASET_API_KEY = process.env.DIFY_DATASET_API_KEY || '';

/**
 * Provision a new Dataset (Knowledge Base) in Dify
 */
const createDataset = async (name, description = '') => {
    try {
        console.log(`[Dify Service] Creating dataset: ${name}`);
        const response = await axios.post(
            `${DIFY_API_URL}/datasets`,
            {
                name,
                description,
                permission: 'only_me', // Default permission
                indexing_technique: 'high_quality'
            },
            {
                headers: {
                    Authorization: `Bearer ${DIFY_DATASET_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[Dify Service] Dataset created successfully: ${response.data.id}`);
        return response.data;
    } catch (error) {
        console.error('[Dify Service] Create dataset error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create Dify dataset');
    }
};

/**
 * Delete a Dataset from Dify
 */
const deleteDataset = async (datasetId) => {
    try {
        console.log(`[Dify Service] Deleting dataset: ${datasetId}`);
        const response = await axios.delete(
            `${DIFY_API_URL}/datasets/${datasetId}`,
            {
                headers: {
                    Authorization: `Bearer ${DIFY_DATASET_API_KEY}`
                }
            }
        );
        console.log(`[Dify Service] Dataset deleted successfully: ${datasetId}`);
        return response.data;
    } catch (error) {
        console.error('[Dify Service] Delete dataset error:', error.response?.data || error.message);
        // Do not throw on delete if it's already gone (404)
        if (error.response?.status === 404) return { success: true };
        throw new Error(error.response?.data?.message || 'Failed to delete Dify dataset');
    }
};

/**
 * Upload file to Dify Dataset (Ingestion)
 */
const uploadFileToDataset = async (datasetId, filePath, originalName) => {
    try {
        console.log(`[Dify Service] Uploading file to dataset ${datasetId}: ${originalName}`);
        
        // Read file into buffer and wrap in native Blob (supported globally in Node 18+)
        const fileBuffer = fs.readFileSync(filePath);
        let mimeType = 'application/octet-stream';
        const ext = path.extname(originalName).toLowerCase();
        if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (ext === '.txt') mimeType = 'text/plain';
        else if (ext === '.md') mimeType = 'text/markdown';

        const fileBlob = new Blob([fileBuffer], { type: mimeType });
        
        const formData = new FormData();
        formData.append('file', fileBlob, originalName);
        formData.append('data', JSON.stringify({
            indexing_technique: 'high_quality',
            process_rule: {
                mode: 'automatic'
            }
        }));

        const response = await axios.post(
            `${DIFY_API_URL}/datasets/${datasetId}/document/create-by-file`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${DIFY_DATASET_API_KEY}`,
                    // Axios will set boundary automatically when passing FormData
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        
        const docId = response.data.document?.id;
        console.log(`[Dify Service] File uploaded successfully, Dify Document ID: ${docId}`);
        return response.data;
    } catch (error) {
        console.error('[Dify Service] Upload file error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to upload document to Dify');
    }
};

/**
 * Delete a Document from a Dataset in Dify
 */
const deleteDocumentFromDataset = async (datasetId, documentId) => {
    try {
        console.log(`[Dify Service] Deleting document ${documentId} from dataset ${datasetId}`);
        const response = await axios.delete(
            `${DIFY_API_URL}/datasets/${datasetId}/documents/${documentId}`,
            {
                headers: {
                    Authorization: `Bearer ${DIFY_DATASET_API_KEY}`
                }
            }
        );
        console.log(`[Dify Service] Document deleted successfully: ${documentId}`);
        return response.data;
    } catch (error) {
        console.error('[Dify Service] Delete document error:', error.response?.data || error.message);
        if (error.response?.status === 404) return { success: true };
        throw new Error(error.response?.data?.message || 'Failed to delete Dify document');
    }
};

/**
 * Poll the processing status of an ingested document
 */
const getDocumentProcessingStatus = async (datasetId, documentId) => {
    try {
        const response = await axios.get(
            `${DIFY_API_URL}/datasets/${datasetId}/documents/${documentId}/processing-status`,
            {
                headers: {
                    Authorization: `Bearer ${DIFY_DATASET_API_KEY}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('[Dify Service] Get processing status error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to check document processing status');
    }
};

/**
 * Run a Chat Message App in streaming mode (SSE)
 */
const streamChatResponse = async (apiKey, query, inputs, user, conversationId, onToken, onComplete, onError) => {
    try {
        const body = {
            inputs,
            query,
            response_mode: 'streaming',
            user: String(user)
        };
        if (conversationId) {
            body.conversation_id = conversationId;
        }

        console.log(`[Dify Service] Starting streaming chat for user ${user}, conversation: ${conversationId || 'new'}`);

        const response = await axios({
            method: 'POST',
            url: `${DIFY_API_URL}/chat-messages`,
            data: body,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        const stream = response.data;
        let buffer = '';
        let completed = false;

        stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop();

            for (const line of lines) {
                const cleanedLine = line.trim();
                if (!cleanedLine.startsWith('data:')) continue;
                
                try {
                    const data = JSON.parse(cleanedLine.substring(5).trim());
                    
                    if (data.event === 'message') {
                        onToken({
                            answer: data.answer,
                            conversationId: data.conversation_id,
                            messageId: data.message_id
                        });
                    } else if (data.event === 'message_end') {
                        if (!completed) {
                            completed = true;
                            onComplete({
                                conversationId: data.conversation_id,
                                messageId: data.message_id,
                                citations: data.metadata?.retriever_resources || []
                            });
                        }
                    } else if (data.event === 'error') {
                        onError(new Error(data.message || 'Dify stream error'));
                    }
                } catch (err) {
                    // Non-blocking parse error for ping/partial packets
                }
            }
        });

        stream.on('end', () => {
            // Flush any remaining buffer
            if (buffer.trim()) {
                try {
                    if (buffer.trim().startsWith('data:')) {
                        const data = JSON.parse(buffer.trim().substring(5).trim());
                        if (data.event === 'message') {
                            onToken({ answer: data.answer, conversationId: data.conversation_id });
                        }
                    }
                } catch (e) {}
            }
            if (!completed) {
                completed = true;
                onComplete({});
            }
        });

        stream.on('error', (err) => {
            onError(err);
        });
    } catch (err) {
        console.error('[Dify Service] Streaming request failed:', err.response?.data || err.message);
        onError(err.response?.data || err);
    }
};

/**
 * Run a Workflow App in blocking mode
 */
const runWorkflow = async (apiKey, inputs, user) => {
    try {
        console.log(`[Dify Service] Running blocking workflow for user ${user}`);
        const response = await axios.post(
            `${DIFY_API_URL}/workflows/run`,
            {
                inputs,
                response_mode: 'blocking',
                user: String(user)
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.data?.outputs) {
            console.log('[Dify Service] Workflow run completed successfully');
            return response.data.data.outputs;
        }
        throw new Error('No outputs returned from workflow');
    } catch (error) {
        console.error('[Dify Service] Workflow run error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Workflow execution failed');
    }
};

module.exports = {
    createDataset,
    deleteDataset,
    uploadFileToDataset,
    deleteDocumentFromDataset,
    getDocumentProcessingStatus,
    streamChatResponse,
    runWorkflow
};
