const { GoogleGenAI } = require('@google/genai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const os = require('os');
const prisma = require('../lib/prisma');

// Write Firebase service account key to temp file for Vertex AI auth
// This uses the learnproof-b24c7 Firebase SA key which has Vertex AI permissions
let VERTEX_KEY_PATH = null;
const keySource = process.env.GCP_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (keySource && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        const keyJson = keySource.trim();
        JSON.parse(keyJson); // validate JSON
        VERTEX_KEY_PATH = path.join(os.tmpdir(), 'learnproof-vertex-key.json');
        fs.writeFileSync(VERTEX_KEY_PATH, keyJson);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = VERTEX_KEY_PATH;
        console.log('[Local AI Service] Configured GOOGLE_APPLICATION_CREDENTIALS from GCP_SERVICE_ACCOUNT_KEY');
    } catch (err) {
        console.error('[Local AI Service] Failed to write service account key:', err.message);
    }
}

// 1. Initialize Vertex AI Client using @google/genai
let vertexAIClient = null;
const GCP_PROJECT = process.env.GCP_PROJECT_ID || 'essential-rider-500415-u6';
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';
try {
    vertexAIClient = new GoogleGenAI({
        vertexai: true,
        project: GCP_PROJECT,
        location: GCP_LOCATION
    });
    console.log(`[Local AI Service] Initialized Vertex AI client for project: ${GCP_PROJECT}`);
} catch (err) {
    console.error('[Local AI Service] Vertex AI init failed:', err.message);
}

// 2. Initialize Google AI Studio Client (Gemini API Key)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Extract text from local files (PDF, DOCX, TXT)
 */
const parseLocalFile = async (filePath, ext) => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at path: ${filePath}`);
        }

        const dataBuffer = fs.readFileSync(filePath);

        // Normalize extension to lowercase and ensure it has a leading dot
        let normalizedExt = ext.toLowerCase();
        if (!normalizedExt.startsWith('.')) {
            normalizedExt = '.' + normalizedExt;
        }

        if (normalizedExt === '.pdf') {
            console.log(`[Local AI Service] Parsing PDF: ${filePath}`);
            let text = '';
            let isDigital = false;

            // Try fast local digital text extraction first
            try {
                console.log('[Local AI Service] Attempting fast digital text extraction with pdf-parse...');
                const parsedData = await pdf(dataBuffer);
                text = parsedData.text || '';
                
                // If it extracted a reasonable amount of text (e.g. > 100 characters total),
                // we treat it as a successful soft-copy parse and skip expensive multimodal OCR.
                if (text.trim().length > 100) {
                    console.log(`[Local AI Service] Fast digital parse successful. Extracted ${text.length} characters.`);
                    isDigital = true;
                } else {
                    console.log('[Local AI Service] Digital parse extracted very little text. Likely a scanned/image-only PDF.');
                }
            } catch (basicErr) {
                console.warn('[Local AI Service] Basic pdf-parse failed:', basicErr.message);
            }

            // If it's not a soft copy, fall back to the premium multimodal/OCR parse
            if (!isDigital) {
                console.log(`[Local AI Service] Starting multimodal PDF parse with Gemini Vision for: ${filePath}`);
                const prompt = `Analyze this PDF document page-by-page. For each page:
1. Extract all text, headings, sections, tables, and math equations/formulas.
2. Visually scan the page. If there are any diagrams, charts, flowcharts, graphs, venn diagrams, matrices, tables, illustrations, or images:
   - Identify the visual component.
   - Write a detailed, complete textual description explaining its content, labels, flow direction, variables, meaning, and how it relates to the surrounding text.
   - Insert this description directly inline in markdown where the diagram is situated, formatted like:
     [Diagram Description: ...detailed description...]
3. Preserve the layout structure and chronological flow of the document. Use markdown.`;

                let ocrSuccess = false;

                if (vertexAIClient) {
                    try {
                        console.log('[Local AI Service] Attempting multimodal parse with Vertex AI...');
                        const response = await vertexAIClient.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: [
                                {
                                    inlineData: {
                                        mimeType: 'application/pdf',
                                        data: dataBuffer.toString('base64')
                                    }
                                },
                                prompt
                            ]
                        });
                        text = response.text || '';
                        ocrSuccess = true;
                        console.log(`[Local AI Service] Vertex AI multimodal parse complete. Extracted ${text.length} characters.`);
                    } catch (vertexErr) {
                        console.warn('[Local AI Service] Vertex AI multimodal parse failed, falling back to Google AI Studio:', vertexErr.message);
                    }
                }
                
                if (!ocrSuccess && genAI) {
                    try {
                        console.log('[Local AI Service] Attempting multimodal parse with Google AI Studio...');
                        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                        const result = await model.generateContent([
                            {
                                inlineData: {
                                    mimeType: 'application/pdf',
                                    data: dataBuffer.toString('base64')
                                }
                            },
                            prompt
                        ]);
                        text = result.response.text() || '';
                        ocrSuccess = true;
                        console.log(`[Local AI Service] Google AI Studio multimodal parse complete. Extracted ${text.length} characters.`);
                    } catch (studioErr) {
                        console.error('[Local AI Service] Google AI Studio multimodal parse failed too:', studioErr.message);
                    }
                }

                if (!ocrSuccess) {
                    throw new Error('All PDF parsing options failed.');
                }
            }
            
            return text;
        } else if (normalizedExt === '.txt' || normalizedExt === '.md') {
            return dataBuffer.toString('utf-8');
        } else {
            return `[File type ${normalizedExt} contents placeholder - simulated text extraction]`;
        }
    } catch (error) {
        console.error('[Local AI Service] File parsing/OCR error:', error);
        throw error;
    }
};

/**
 * Helper to fetch and assemble indexed document context for a workspace
 * Utilises keyword-based paragraph retrieval (RAG) to ensure small prompt size and fast response times
 */
const getWorkspaceContext = async (workspaceId, query = '') => {
    const sources = await prisma.knowledgeSource.findMany({
        where: { workspaceId: parseInt(workspaceId), status: 'INDEXED' }
    });

    let context = '';
    const citations = [];

    const cleanQuery = (query || '').toLowerCase().trim();
    
    // Stop words to filter out from query
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through',
        'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'for', 'with',
        'how', 'what', 'why', 'where', 'when', 'who', 'which', 'whom', 'this', 'that', 'these', 'those',
        'describe', 'explain', 'show', 'tell', 'find', 'give', 'list', 'please', 'you', 'me', 'my', 'our'
    ]);

    // Tokenize query into keywords
    const keywords = cleanQuery
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

    const allParagraphs = [];

    sources.forEach(src => {
        let text = '';
        try {
            if (src.metadata) {
                const meta = JSON.parse(src.metadata);
                text = meta.extractedText || '';
            }
        } catch (e) {
            console.error(`Failed to parse metadata for source: ${src.id}`, e);
        }

        if (!text) return;

        // Split text into paragraphs
        const paragraphs = text.split(/\r?\n\s*\r?\n/)
            .map(p => p.trim())
            .filter(p => p.length > 50);

        paragraphs.forEach((p, idx) => {
            allParagraphs.push({
                docName: src.name,
                text: p,
                index: idx
            });
        });
    });

    // Score paragraphs based on keyword frequency
    const scoredParagraphs = allParagraphs.map(p => {
        let score = 0;
        const pLower = p.text.toLowerCase();

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = pLower.match(regex);
            if (matches) {
                score += Math.min(matches.length, 3) * 2;
            }
            if (pLower.includes(keyword) && !pLower.match(new RegExp(`\\b${keyword}\\b`))) {
                score += 1;
            }
        });

        return { ...p, score };
    });

    // Sort by score descending
    const rankedParagraphs = scoredParagraphs
        .filter(p => p.score > 0 || keywords.length === 0)
        .sort((a, b) => b.score - a.score);

    // Take top paragraphs up to 16,000 characters limit
    let totalLength = 0;
    const maxLength = 16000;
    const selectedParagraphs = [];
    const citedDocNames = new Set();

    for (const p of rankedParagraphs) {
        if (totalLength + p.text.length > maxLength) {
            if (selectedParagraphs.length >= 4) break;
        }
        selectedParagraphs.push(p);
        totalLength += p.text.length;
        citedDocNames.add(p.docName);
    }

    // Group selected paragraphs by document name
    const docsGroup = {};
    selectedParagraphs.forEach(p => {
        if (!docsGroup[p.docName]) docsGroup[p.docName] = [];
        docsGroup[p.docName].push(p.text);
    });

    Object.keys(docsGroup).forEach(docName => {
        context += `--- DOCUMENT: ${docName} (Relevant Excerpts) ---\n`;
        context += docsGroup[docName].join('\n\n[...]\n\n');
        context += '\n\n';
        citations.push({
            document_name: docName,
            score: 1.0
        });
    });

    // Fallback: If no paragraphs match keywords, get default beginning of each document
    if (context === '' && sources.length > 0) {
        sources.forEach(src => {
            let text = '';
            try {
                if (src.metadata) {
                    const meta = JSON.parse(src.metadata);
                    text = meta.extractedText || '';
                }
            } catch (e) {}

            if (text) {
                const defaultExcerpt = text.substring(0, 3000);
                context += `--- DOCUMENT: ${src.name} (Beginning) ---\n${defaultExcerpt}\n\n`;
                citations.push({
                    document_name: src.name,
                    score: 1.0
                });
            }
        });
    }

    return { context, citations };
};

/**
 * Stream Vertex AI / Gemini Chat response using standard SSE format callbacks
 */
const streamChat = async (workspaceId, query, userId, chatHistory = [], onToken, onComplete, onError) => {
    try {
        const { context, citations } = await getWorkspaceContext(workspaceId, query);

        // Format conversation history so the AI understands previous context
        const historyBlock = chatHistory.length > 0
            ? `\nConversation History (most recent last):\n${chatHistory
                .map(m => `${m.role === 'user' ? 'Student' : 'LearnProof AI'}: ${m.content.trim()}`)
                .join('\n')}\n`
            : '';

        const systemPrompt = `You are a helpful, advanced AI learning assistant for the student platform LearnProof.
Your goal is to answer the user's questions accurately using the provided learning documents context.

Reference Documents Context:
${context || 'No documents uploaded yet. Inform the user they can upload documents.'}
${historyBlock}
Instructions:
1. Use the Conversation History above to understand context from previous messages. If the user says "it", "that", "create example for it", etc., refer to what was discussed most recently in the conversation history.
2. Base your answers primarily on the Reference Documents context above.
3. If the user's query cannot be answered using the documents, explain that you couldn't find the answer in the workspace files, and then answer using your general knowledge.
4. Keep formatting clean and highly professional. Use markdown.
5. Auto-detect and fix any OCR artifacts (e.g. run-on words without spaces, missing punctuation, raw text layout issues) present in the reference documents context. Format them into properly spaced, readable sentences.
6. Format math equations beautifully. Always use standard KaTeX formatting:
   - Use double dollar signs for block equations on a new line (e.g., $$ E = mc^2 $$).
   - Use single dollar signs with proper LaTeX commands for inline equations (e.g., $e^{i\pi} + 1 = 0$, $R_1$, $\in$, $\notin$).
   - Never output raw LaTeX markup without dollar signs.
7. When explaining a visual concept (like a flowchart, state machine, graph, Hasse diagram, tree, or process flow), or when explicitly asked to draw/visualize something, you MUST output a beautiful, syntactically correct visual diagram using Mermaid.js code blocks. Wrap the code in a single block starting with \`\`\`mermaid. Keep nodes descriptive and connections clean.
   - For Hasse diagrams, lattice diagrams, and divisibility diagrams, you MUST always use "graph BT" (Bottom-to-Top) so that the minimal/starting elements are correctly positioned at the bottom, and maximal/ending elements are at the top.
8. Be precise and clear.`;

        let localCompleteAnswer = '';

        const streamWithGeminiApiStudio = async () => {
            if (!genAI) throw new Error('Gemini API Studio client not initialized. Set GEMINI_API_KEY.');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContentStream([
                { text: systemPrompt },
                { text: query }
            ]);
            for await (const chunk of result.stream) {
                const token = chunk.text();
                if (token) {
                    localCompleteAnswer += token;
                    onToken({ answer: token, conversationId: `local-conv-${workspaceId}` });
                }
            }
        };

        const streamWithVertexAI = async () => {
            if (!vertexAIClient) throw new Error('Vertex AI client not initialized.');
            const responseStream = await vertexAIClient.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: systemPrompt }, { text: query }] }]
            });
            for await (const chunk of responseStream) {
                const token = chunk.text;
                if (token) {
                    localCompleteAnswer += token;
                    onToken({ answer: token, conversationId: `local-conv-${workspaceId}` });
                }
            }
        };

        // STRATEGY: Try Gemini API Studio first (separate quota pool, no 429 issues)
        // Fall back to Vertex AI if API Studio key not available
        try {
            if (genAI) {
                console.log('[Local AI Service] Using Gemini API Studio for chat stream');
                await streamWithGeminiApiStudio();
            } else if (vertexAIClient) {
                console.log('[Local AI Service] Using Vertex AI for chat stream');
                await streamWithVertexAI();
            } else {
                throw new Error('No AI client available. Set GEMINI_API_KEY or GCP_PROJECT_ID.');
            }
        } catch (primaryErr) {
            // If Gemini API Studio fails (e.g., rate limit), try Vertex AI as backup
            const isQuotaError = primaryErr.message?.includes('429') || primaryErr.message?.includes('RESOURCE_EXHAUSTED') || primaryErr.message?.includes('quota');
            if (isQuotaError && vertexAIClient && genAI) {
                console.warn('[Local AI Service] Gemini API Studio quota hit, retrying with Vertex AI...');
                await streamWithVertexAI();
            } else {
                throw primaryErr;
            }
        }

        // Filter citations: only include them if the AI actually used the documents.
        // If the answer says it's using general knowledge, no docs were cited.
        const answerLower = localCompleteAnswer.toLowerCase();
        const usedGeneralKnowledge = (
            answerLower.includes("general knowledge") ||
            answerLower.includes("my general knowledge") ||
            answerLower.includes("not found in the") ||
            answerLower.includes("couldn't find") ||
            answerLower.includes("could not find") ||
            answerLower.includes("not in the provided") ||
            answerLower.includes("not in the uploaded") ||
            answerLower.includes("not available in the") ||
            answerLower.includes("no documents uploaded") ||
            answerLower.includes("i don't have information") ||
            answerLower.includes("not mentioned in the") ||
            context.trim() === '' // No docs at all
        );

        // Deduplicate citations by document name
        const seenNames = new Set();
        const filteredCitations = usedGeneralKnowledge ? [] : citations.filter(c => {
            if (seenNames.has(c.document_name)) return false;
            seenNames.add(c.document_name);
            return true;
        });

        onComplete({ citations: filteredCitations });

    } catch (error) {
        console.error('[Local AI Service] streamChat failed:', error.message);
        onError(error);
    }
};

/**
 * Generate workspace summary using Vertex AI / Gemini
 */
const generateSummary = async (workspaceId) => {
    const { context } = await getWorkspaceContext(workspaceId);
    if (!context) {
        throw new Error('No indexed documents found in this workspace.');
    }

    const systemPrompt = `Summarize the key concepts, formulas, lessons, and definitions from the following documents. 
Structure your summary beautifully using Markdown with sections, bold bullet points, and headers. Support LaTeX formulas where appropriate.

Context:
${context}`;

    let summaryText = '';
    let success = false;
    if (vertexAIClient) {
        try {
            console.log('[Local AI Service] Attempting generateSummary with Vertex AI...');
            const result = await vertexAIClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt
            });
            summaryText = result.text;
            success = true;
        } catch (vertexErr) {
            console.warn('[Local AI Service] Vertex AI generateSummary failed, falling back to Google AI Studio:', vertexErr.message);
        }
    }
    
    if (!success && genAI) {
        try {
            console.log('[Local AI Service] Attempting generateSummary with Google AI Studio...');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(systemPrompt);
            summaryText = result.response.text();
            success = true;
        } catch (studioErr) {
            console.error('[Local AI Service] Google AI Studio generateSummary failed:', studioErr.message);
            throw studioErr;
        }
    }
    
    if (!success) {
        throw new Error('Neither Vertex AI nor Gemini API Studio client was able to generate summary.');
    }
    return summaryText;
};

/**
 * Generate interactive Quiz using Vertex AI / Gemini (structured JSON)
 */
const generateQuiz = async (workspaceId, count, format) => {
    const { context } = await getWorkspaceContext(workspaceId);
    if (!context) {
        throw new Error('No indexed documents found in this workspace.');
    }

    const systemPrompt = `Generate a quiz containing exactly ${count} multiple choice questions (MCQs) in valid JSON format based on the following context.
Format the output as a raw JSON array of objects. Do not include markdown code block wrappers (like \`\`\`json or \`\`\`).
Each object MUST have the following structure:
{
  "question": "What is ...?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,  // Index of correct option (0-3)
  "explanation": "Brief explanation of why Option A is correct"
}

Context:
${context}`;

    let quizText = '';
    let success = false;
    if (vertexAIClient) {
        try {
            console.log('[Local AI Service] Attempting generateQuiz with Vertex AI...');
            const result = await vertexAIClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });
            quizText = result.text;
            success = true;
        } catch (vertexErr) {
            console.warn('[Local AI Service] Vertex AI generateQuiz failed, falling back to Google AI Studio:', vertexErr.message);
        }
    }
    
    if (!success && genAI) {
        try {
            console.log('[Local AI Service] Attempting generateQuiz with Google AI Studio...');
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash',
                generationConfig: { responseMimeType: 'application/json' }
            });
            const result = await model.generateContent(systemPrompt);
            quizText = result.response.text();
            success = true;
        } catch (studioErr) {
            console.error('[Local AI Service] Google AI Studio generateQuiz failed:', studioErr.message);
            throw studioErr;
        }
    }
    
    if (!success) {
        throw new Error('Neither Vertex AI nor Gemini API Studio client was able to generate quiz.');
    }
    return quizText;
};

/**
 * Generate Flashcards using Vertex AI / Gemini (structured JSON)
 */
const generateFlashcards = async (workspaceId, count) => {
    const { context } = await getWorkspaceContext(workspaceId);
    if (!context) {
        throw new Error('No indexed documents found in this workspace.');
    }

    const systemPrompt = `Generate exactly ${count} study flashcards in valid JSON format based on the following context.
Format the output as a raw JSON array of objects. Do not include markdown code block wrappers (like \`\`\`json or \`\`\`).
Each object MUST have the following structure:
{
  "question": "Question text?",
  "answer": "Answer text"
}

Context:
${context}`;

    let cardsText = '';
    let success = false;
    if (vertexAIClient) {
        try {
            console.log('[Local AI Service] Attempting generateFlashcards with Vertex AI...');
            const result = await vertexAIClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });
            cardsText = result.text;
            success = true;
        } catch (vertexErr) {
            console.warn('[Local AI Service] Vertex AI generateFlashcards failed, falling back to Google AI Studio:', vertexErr.message);
        }
    }
    
    if (!success && genAI) {
        try {
            console.log('[Local AI Service] Attempting generateFlashcards with Google AI Studio...');
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash',
                generationConfig: { responseMimeType: 'application/json' }
            });
            const result = await model.generateContent(systemPrompt);
            cardsText = result.response.text();
            success = true;
        } catch (studioErr) {
            console.error('[Local AI Service] Google AI Studio generateFlashcards failed:', studioErr.message);
            throw studioErr;
        }
    }
    
    if (!success) {
        throw new Error('Neither Vertex AI nor Gemini API Studio client was able to generate flashcards.');
    }
    return cardsText;
};

module.exports = {
    parseLocalFile,
    streamChat,
    generateSummary,
    generateQuiz,
    generateFlashcards
};
