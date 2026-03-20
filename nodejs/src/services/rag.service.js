const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const VECTOR_STORE_DIR = path.join(process.cwd(), 'vector_stores');
fs.ensureDirSync(VECTOR_STORE_DIR);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Simple delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract text from PDF or TXT files
 */
async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const pagesData = [];

    if (ext === '.pdf') {
        try {
            const dataBuffer = await fs.readFile(filePath);
            
            // Custom page render function to capture page text
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
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
        if (start >= text.length) break;
    }
    return chunks;
}

/**
 * Get embedding for a text string using Gemini with retry
 */
async function getEmbedding(text, maxRetries = 3) {
    let retryCount = 0;
    while (retryCount <= maxRetries) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            if (error.message.includes('429') || error.message.includes('Quota')) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
                    console.log(`[RAG] Rate limited on embedding. Retrying in ${Math.round(waitTime/1000)}s...`);
                    await delay(waitTime);
                    continue;
                }
            }
            console.error('Embedding error:', error.message);
            throw error;
        }
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Load vector store for a specific subject
 */
function loadStore(subjectId) {
    const storePath = path.join(VECTOR_STORE_DIR, `subject_${subjectId}.json`);
    if (fs.existsSync(storePath)) {
        return fs.readJSONSync(storePath);
    }
    return [];
}

/**
 * Save vector store for a specific subject
 */
function saveStore(subjectId, entries) {
    const storePath = path.join(VECTOR_STORE_DIR, `subject_${subjectId}.json`);
    fs.writeJSONSync(storePath, entries);
}

/**
 * Process a file: extract text, chunk it, generate embeddings, and save to subject store
 */
async function processAndEmbedFile(filePath, subjectId, filename) {
    console.log(`[RAG] Starting processing: ${filename}`);
    const pagesData = await extractTextFromFile(filePath);
    if (pagesData.length === 0) {
        console.error(`[RAG] No text extracted from ${filename}`);
        return false;
    }

    // Load existing entries once to check for duplicates
    const existingEntries = loadStore(subjectId);
    
    // Create a set of "already indexed" markers (filename + page + content hash/start)
    const indexedMarkers = new Set(
        existingEntries
            .filter(e => e.metadata && e.metadata.filename === filename)
            .map(e => `${e.metadata.filename}|${e.metadata.page}|${e.pageContent.substring(0, 100)}`)
    );

    const allChunks = [];
    for (const { text, page } of pagesData) {
        const chunks = chunkText(text, 800, 150);
        for (const chunk of chunks) {
            if (chunk.trim()) {
                const marker = `${filename}|${page}|${chunk.substring(0, 100)}`;
                if (!indexedMarkers.has(marker)) {
                    allChunks.push({ chunk, metadata: { filename, page } });
                }
            }
        }
    }
    
    if (allChunks.length === 0) {
        console.log(`[RAG] All chunks for ${filename} are already indexed. Skipping.`);
        return true;
    }

    console.log(`[RAG] Found ${allChunks.length} new chunks to index for ${filename}.`);
    let processed = 0;

    // Batch processing with delay to respect Free Tier quota
    const BATCH_SIZE = 5; 
    const DELAY_BETWEEN_BATCHES = 3500; 

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
        const batch = allChunks.slice(i, i + BATCH_SIZE);
        
        const newEntries = [];
        await Promise.all(batch.map(async (item) => {
            try {
                const embedding = await getEmbedding(item.chunk);
                newEntries.push({ pageContent: item.chunk, metadata: item.metadata, embedding });
            } catch (err) {
                console.error(`[RAG] Embedding failed for chunk: ${err.message.substring(0, 50)}`);
                // Keyword-only fallback
                newEntries.push({ pageContent: item.chunk, metadata: item.metadata, embedding: null });
            }
        }));

        // Load, append, and save incrementally
        const currentEntries = loadStore(subjectId);
        currentEntries.push(...newEntries);
        saveStore(subjectId, currentEntries);

        processed += batch.length;
        console.log(`[RAG] [${filename}] Progress: ${processed}/${allChunks.length} new chunks indexed.`);

        if (i + BATCH_SIZE < allChunks.length) {
            await delay(DELAY_BETWEEN_BATCHES);
        }
    }

    console.log(`[RAG] Finished indexing ${filename}.`);
    return true;
}

/**
 * Search the subject's local vector store using Hybrid Search (Vector + Keyword)
 */
async function querySubjectIndex(subjectId, query, topK = 7) {
    const entries = loadStore(subjectId);
    if (entries.length === 0) {
        console.log(`[RAG] Store empty for subject ${subjectId}, skipping search.`);
        return [];
    }

    // 1. Get Vector Score if possible
    let queryEmbedding = null;
    try {
        queryEmbedding = await getEmbedding(query, 1);
    } catch (err) {
        console.warn(`[RAG] Vector search failed: ${err.message}`);
    }

    // 2. Keyword matching preparation
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    const scored = entries.map(entry => {
        let vectorScore = 0;
        let keywordScore = 0;
        
        // Vector similarity
        if (queryEmbedding && entry.embedding) {
            vectorScore = cosineSimilarity(queryEmbedding, entry.embedding);
        }

        // Keyword matches (Simple overlap)
        if (keywords.length > 0) {
            const content = entry.pageContent.toLowerCase();
            let matches = 0;
            keywords.forEach(word => { if (content.includes(word)) matches++; });
            keywordScore = matches / keywords.length;
        }

        // Hybrid Score: 70% vector, 30% keyword for precision
        // If vector failed, keyword score takes over
        const finalScore = queryEmbedding ? (vectorScore * 0.7 + keywordScore * 0.3) : keywordScore;

        return {
            doc: { pageContent: entry.pageContent, metadata: entry.metadata },
            score: finalScore
        };
    });

    // Sort and limit
    scored.sort((a, b) => b.score - a.score);
    
    // Filter out very low quality matches
    const filtered = scored.filter(s => s.score > 0.05);

    return filtered.slice(0, topK).map(({ doc, score }) => [doc, score]);
}

/**
 * Get all text for a subject (used for quiz generation)
 */
async function getFullSubjectText(subjectId) {
    const entries = loadStore(subjectId);
    return entries.map(e => e.pageContent).join('\n\n');
}

/**
 * Delete the vector store for a subject
 */
function deleteSubjectStore(subjectId) {
    const storePath = path.join(VECTOR_STORE_DIR, `subject_${subjectId}.json`);
    if (fs.existsSync(storePath)) {
        fs.unlinkSync(storePath);
    }
}

module.exports = {
    processAndEmbedFile,
    querySubjectIndex,
    getFullSubjectText,
    deleteSubjectStore
};
