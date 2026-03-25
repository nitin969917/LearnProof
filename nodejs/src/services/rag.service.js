const { Pinecone } = require('@pinecone-database/pinecone');
const { PineconeStore } = require('@langchain/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { Document } = require('@langchain/core/documents');
const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
require('dotenv').config();

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'MISSING_KEY',
});

// Configure Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
});

/**
 * Extract text from PDF or TXT files
 */
async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const pagesData = [];

    if (ext === '.pdf') {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const pagerender = (pageData) => {
                return pageData.getTextContent()
                    .then(function(textContent) {
                        let lastY, text = '';
                        for (let item of textContent.items) {
                            if (lastY == item.transform[5] || !lastY) {
                                text += item.str;
                            } else {
                                text += '\n' + item.str;
                            }
                            lastY = item.transform[5];
                        }
                        pagesData.push({ text: text.trim(), page: pageData.pageIndex + 1 });
                        return text;
                    });
            };
            await pdfParse(dataBuffer, { pagerender });
        } catch (error) {
            console.error(`Error reading PDF ${filePath}:`, error.message);
        }
    } else if (ext === '.txt') {
        try {
            const text = await fs.readFile(filePath, 'utf-8');
            if (text.trim()) {
                pagesData.push({ text: text.trim(), page: 1 });
            }
        } catch (error) {
            console.error(`Error reading TXT ${filePath}:`, error.message);
        }
    }
    return pagesData;
}

/**
 * Process a file: extract text, chunk it, and save to Pinecone with subject namespace
 */
async function processAndEmbedFile(filePath, subjectId, filename) {
    console.log(`[RAG-Pinecone] Starting processing: ${filename}`);
    
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
        console.error('[RAG-Pinecone] Missing credentials. Indexing aborted.');
        return false;
    }

    const pagesData = await extractTextFromFile(filePath);
    if (pagesData.length === 0) {
        console.error(`[RAG-Pinecone] No text extracted from ${filename}`);
        return false;
    }

    // Convert pages to LangChain Documents
    const docs = pagesData.map(p => new Document({
        pageContent: p.text,
        metadata: { filename, page: p.page, subjectId: String(subjectId) }
    }));

    // Split documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    try {
        const pineconeIndex = pc.Index(process.env.PINECONE_INDEX);
        
        // Upsert to Pinecone using subjectId as namespace
        await PineconeStore.fromDocuments(splitDocs, embeddings, {
            pineconeIndex,
            namespace: `subject_${subjectId}`,
            maxConcurrency: 5,
        });

        console.log(`[RAG-Pinecone] Successfully indexed ${splitDocs.length} chunks for ${filename} in namespace subject_${subjectId}`);
        return true;
    } catch (error) {
        console.error(`[RAG-Pinecone] Indexing failed for ${filename}:`, error.message);
        return false;
    }
}

/**
 * Search the subject's Pinecone namespace for relevant chunks
 */
async function querySubjectIndex(subjectId, query, topK = 3) {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
        console.error('[RAG-Pinecone] Missing credentials. Retrieval aborted.');
        return [];
    }

    try {
        const pineconeIndex = pc.Index(process.env.PINECONE_INDEX);
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex,
            namespace: `subject_${subjectId}`,
        });

        const results = await vectorStore.similaritySearchWithScore(query, topK);
        
        // Return in same format as before [doc, score]
        return results.map(([doc, score]) => [{
            pageContent: doc.pageContent,
            metadata: doc.metadata
        }, score]);
    } catch (error) {
        console.error(`[RAG-Pinecone] Search failed:`, error.message);
        return [];
    }
}

/**
 * Get all text for a subject (used for group analysis/quizzes)
 * Note: Pinecone doesn't allow "get all" easily without full scan. 
 * We'll keep this as a simple retrieval with a high K for now, 
 * or the user can just use the most relevant chunks.
 */
async function getFullSubjectText(subjectId) {
    const results = await querySubjectIndex(subjectId, "Summarize everything", 50);
    return results.map(([doc]) => doc.pageContent).join('\n\n');
}

/**
 * Delete vectors for a subject
 */
async function deleteSubjectStore(subjectId) {
    try {
        const pineconeIndex = pc.Index(process.env.PINECONE_INDEX);
        await pineconeIndex.namespace(`subject_${subjectId}`).deleteAll();
        console.log(`[RAG-Pinecone] Deleted namespace subject_${subjectId}`);
    } catch (error) {
        console.error(`[RAG-Pinecone] Delete failed for subject_${subjectId}:`, error.message);
    }
}

module.exports = {
    processAndEmbedFile,
    querySubjectIndex,
    getFullSubjectText,
    deleteSubjectStore
};
