const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { fetchTranscript } = require('./transcript.service');
const { translate } = require('google-translate-api-x');

// Legacy AI Studio client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Modern Google GenAI client (Vertex AI / Unified)
let vertexAIClient = null;
if (process.env.GCP_PROJECT_ID) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GCP_SERVICE_ACCOUNT_KEY) {
        try {
            const tempKeyPath = path.join(os.tmpdir(), 'gcp-vertex-key.json');
            fs.writeFileSync(tempKeyPath, process.env.GCP_SERVICE_ACCOUNT_KEY.trim());
            process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
            console.log(`[Vertex AI] Auto-configured GOOGLE_APPLICATION_CREDENTIALS using GCP_SERVICE_ACCOUNT_KEY at: ${tempKeyPath}`);
        } catch (err) {
            console.error('[Vertex AI] Failed to write temporary GCP service account key:', err.message);
        }
    }
    console.log(`[Vertex AI] Initializing client for project: ${process.env.GCP_PROJECT_ID} in location: ${process.env.GCP_LOCATION || 'us-central1'}`);
    vertexAIClient = new GoogleGenAI({
        enterprise: true,
        project: process.env.GCP_PROJECT_ID,
        location: process.env.GCP_LOCATION || 'us-central1'
    });
}

/**
 * Helper to call Gemini content generation using either Vertex AI (if configured) or Google AI Studio.
 */
const generateGeminiContent = async (modelName, contents, config = {}) => {
    const timeoutMs = config.timeout || 30000; // 30 seconds timeout for full reliable generations on Google Cloud
    
    const callPromise = (async () => {
        if (vertexAIClient) {
            console.log(`[Google Vertex AI Credits] Calling model: ${modelName}`);
            try {
                const response = await vertexAIClient.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        maxOutputTokens: config.maxOutputTokens || 8192,
                        temperature: config.temperature,
                        responseMimeType: config.responseMimeType
                    }
                });
                return response.text;
            } catch (vertexErr) {
                console.warn(`[Google Vertex AI Credits] ${modelName} call failed:`, vertexErr.message);
                if (genAI) {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            maxOutputTokens: config.maxOutputTokens || 8192,
                            temperature: config.temperature,
                            responseMimeType: config.responseMimeType
                        }
                    });
                    const result = await model.generateContent(contents);
                    return result.response.text();
                }
                throw vertexErr;
            }
        } else {
            console.log(`[Gemini AI Studio] Calling model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    maxOutputTokens: config.maxOutputTokens || 8192,
                    temperature: config.temperature,
                    responseMimeType: config.responseMimeType
                }
            });
            const result = await model.generateContent(contents);
            return result.response.text();
        }
    })();

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Vertex AI request timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([callPromise, timeoutPromise]);
};


const MODELS = {
    GEMINI_FLASH_LITE: 'gemini-2.5-flash-lite', // Primary fast model under Google Cloud startup credits
    GEMINI_FLASH: 'gemini-2.5-flash',           // Balanced model under Google Cloud startup credits
    GEMINI_PRO: 'gemini-2.5-pro',               // Deep reasoning model under Google Cloud startup credits
    // Backward compatibility aliases
    GEMINI_2_5: 'gemini-2.5-flash-lite',
    GEMINI_3: 'gemini-2.5-flash',
    GEMINI_2_5_LITE: 'gemini-2.5-flash',
    GROQ_LLAMA_70B: 'openai/gpt-oss-120b',
    GROQ_LLAMA_8B: 'qwen/qwen3.8-27b',
    GROQ_QWEN_32B: 'qwen/qwen3.6-27b',
    GROQ_LLAMA_4_MAVERICK: 'openai/gpt-oss-20b',
    OPENROUTER_MODEL: 'openrouter/free',
    CEREBRAS_MODEL: 'gpt-oss-120b'
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

/**
 * Clean AI JSON response (removes ```json ... ``` blocks if present)
 */
const cleanAIJSON = (text) => {
    try {
        const trimmed = text.trim();
        const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
        const cleaned = jsonMatch ? jsonMatch[1].trim() : trimmed;
        let parsed = JSON.parse(cleaned);

        // If the AI returned an object containing the array instead of just the array
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const findFirstArray = (obj) => {
                if (Array.isArray(obj)) return obj;
                if (obj && typeof obj === 'object') {
                    for (const key of Object.keys(obj)) {
                        if (Array.isArray(obj[key])) return obj[key];
                        const nested = findFirstArray(obj[key]);
                        if (Array.isArray(nested)) return nested;
                    }
                }
                return null;
            };
            const extractedArray = findFirstArray(parsed);
            if (extractedArray) {
                parsed = extractedArray;
            }
        }

        // Normalize correct answers if AI returned A/B/C/D instead of string
        if (Array.isArray(parsed)) {
            parsed = parsed.map(q => {
                let ans = String(q.answer || "").trim().toLowerCase();
                // Match 'a', 'a)', 'a.', etc.
                const letterMatch = ans.match(/^([a-d])[\)\.]?$/);
                if (letterMatch && q.options && q.options.length === 4) {
                    const idx = letterMatch[1].charCodeAt(0) - 97; // 'a' is 97
                    if (q.options[idx]) {
                        return { ...q, answer: q.options[idx] };
                    }
                }
                return q;
            });
        }

        return parsed;
    } catch (e) {
        // Last resort: try to find anything that looks like a JSON array or object
        try {
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1 && end > start) {
                return JSON.parse(text.substring(start, end + 1));
            }
        } catch (e2) {
            console.error("Deep parse failed for AI JSON:", e2.message);
        }
        console.error("Failed to parse AI JSON. String was:", text);
        throw e;
    }
};

/**
 * Detect subject category based on video metadata and transcript.
 */
const detectSubjectCategory = (title, description, transcriptText) => {
    const text = `${title || ''} ${description || ''} ${transcriptText ? transcriptText.slice(0, 4000) : ''}`.toLowerCase();

    const codingKeywords = [
        'code', 'coding', 'programming', 'python', 'javascript', 'typescript', 'react', 'node', 'java', 'c++',
        'golang', 'rust', 'html', 'css', 'sql', 'database', 'docker', 'kubernetes', 'api', 'git', 'github',
        'backend', 'frontend', 'fullstack', 'algorithm', 'data structure', 'leetcode', 'debugging', 'compiler',
        'machine learning', 'deep learning', 'neural network', 'devops', 'aws', 'cloud', 'linux', 'cybersecurity'
    ];
    const mathScienceKeywords = [
        'math', 'mathematics', 'calculus', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'quantum',
        'theorem', 'equation', 'derivative', 'integral', 'differential', 'astronomy', 'thermodynamics', 'mechanics',
        'statistics', 'probability', 'linear algebra', 'electromagnetism', 'genetics', 'biochemistry'
    ];
    const businessKeywords = [
        'finance', 'economics', 'stock market', 'investing', 'trading', 'crypto', 'accounting', 'marketing',
        'startup', 'entrepreneurship', 'business', 'strategy', 'management', 'macroeconomics', 'microeconomics',
        'valuation', 'venture capital', 'revenue', 'roi'
    ];
    const tutorialKeywords = [
        'tutorial', 'how to', 'guide', 'step by step', 'setup', 'install', 'crash course', 'walkthrough',
        'photoshop', 'figma', 'blender', 'editing', 'premiere pro', 'workflow', 'build with me'
    ];

    const scores = {
        coding: 0,
        math_science: 0,
        business_finance: 0,
        tutorial_workflow: 0,
        theory_humanities: 0
    };

    for (const kw of codingKeywords) {
        if (text.includes(kw)) scores.coding += 1;
    }
    for (const kw of mathScienceKeywords) {
        if (text.includes(kw)) scores.math_science += 1;
    }
    for (const kw of businessKeywords) {
        if (text.includes(kw)) scores.business_finance += 1;
    }
    for (const kw of tutorialKeywords) {
        if (text.includes(kw)) scores.tutorial_workflow += 1;
    }

    let topCategory = 'theory_humanities';
    let maxScore = 0;
    for (const [cat, sc] of Object.entries(scores)) {
        if (sc > maxScore) {
            maxScore = sc;
            topCategory = cat;
        }
    }

    const labels = {
        coding: 'Computer Science & Software Engineering',
        math_science: 'Mathematics & Natural Sciences',
        business_finance: 'Business, Economics & Finance',
        tutorial_workflow: 'Hands-on Applied Workshop & Tutorial',
        theory_humanities: 'Theoretical Foundations & Humanities'
    };

    return { category: topCategory, label: labels[topCategory] };
};

/**
 * Resilient regex extractor to parse intuition JSON when LLMs produce unescaped quotes inside markdown content.
 */
const extractIntuitionWithRegex = (text, defaultCategory = 'theory_humanities', defaultLabel = 'Theoretical Foundations & Humanities') => {
    try {
        const catMatch = text.match(/"subjectCategory"\s*:\s*"([^"]+)"/);
        const labelMatch = text.match(/"categoryLabel"\s*:\s*"([^"]+)"/);
        const timeMatch = text.match(/"estimatedReadTimeMinutes"\s*:\s*(\d+)/);

        const pageRegex = /\{\s*"pageNumber"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)(?="\s*\}\s*(?:,|\]))/g;
        const pages = [];
        let m;
        while ((m = pageRegex.exec(text)) !== null) {
            let content = m[3];
            content = content
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');

            pages.push({
                pageNumber: parseInt(m[1], 10),
                title: (m[2] || '').replace(/^Chapter\s*(\d+)[:\s-]*/i, 'Topic $1: ').trim() || `Topic ${pages.length + 1}`,
                content: content.trim()
            });
        }

        if (pages.length > 0) {
            return {
                subjectCategory: catMatch ? catMatch[1] : defaultCategory,
                categoryLabel: labelMatch ? labelMatch[1] : defaultLabel,
                estimatedReadTimeMinutes: timeMatch ? parseInt(timeMatch[1], 10) : Math.max(3, Math.round(text.split(/\s+/).length / 180)),
                totalPages: pages.length,
                pages: pages
            };
        }
    } catch (err) {
        console.warn("[Intuition] Regex extractor error:", err.message);
    }
    return null;
};

/**
 * Clean and parse paginated intuition JSON.
 */
const cleanIntuitionJSON = (text, defaultCategory = 'theory_humanities', defaultLabel = 'Theoretical Foundations & Humanities') => {
    if (!text || typeof text !== 'string') return null;

    let cleaned = text.trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 1. Try standard JSON.parse first
    try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            const sanitizedPages = parsed.pages.map((p, idx) => ({
                pageNumber: p.pageNumber || (idx + 1),
                title: p.title ? p.title.replace(/^Chapter\s*(\d+)[:\s-]*/i, 'Topic $1: ').trim() : `Topic ${idx + 1}`,
                content: typeof p.content === 'string' ? p.content.trim() : JSON.stringify(p.content)
            }));
            return {
                subjectCategory: parsed.subjectCategory || defaultCategory,
                categoryLabel: parsed.categoryLabel || defaultLabel,
                estimatedReadTimeMinutes: parsed.estimatedReadTimeMinutes || Math.max(3, Math.round(cleaned.split(/\s+/).length / 180)),
                totalPages: sanitizedPages.length,
                pages: sanitizedPages
            };
        }
    } catch (e) {
        console.warn("[Intuition] Standard JSON.parse failed, trying resilient regex extraction:", e.message);
    }

    // 2. Fallback to resilient regex extraction
    const regexParsed = extractIntuitionWithRegex(cleaned, defaultCategory, defaultLabel);
    if (regexParsed) {
        console.log(`[Intuition] Regex extractor recovered ${regexParsed.pages.length} chapters successfully!`);
        return regexParsed;
    }

    return null;
};


/**
 * Helper to call OpenRouter API (OpenAI compatible)
 */
async function callOpenRouter(prompt, jsonMode = false, temperature = 0.1) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_OPENROUTER_API_KEY_HERE") {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://learnproof.vercel.app', // Required by OpenRouter
                'X-Title': 'LearnProof'
            },
            body: JSON.stringify({
                model: MODELS.OPENROUTER_MODEL,
                messages: [{ role: 'user', content: prompt }],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: temperature,
                frequency_penalty: 0.5, // Prevent looping/repetition
                presence_penalty: 0.3,
                max_tokens: 8000
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`OpenRouter API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || typeof data.choices[0].message.content !== 'string') {
            throw new Error(`OpenRouter returned unexpected format: ${JSON.stringify(data)}`);
        }
        return data.choices[0].message.content;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Helper to call Groq API (OpenAI compatible)
 */
async function callGroq(prompt, jsonMode = false, model = MODELS.GROQ_LLAMA_70B, temperature = 0.1) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_GROQ_API_KEY_HERE") {
        throw new Error("GROQ_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: temperature,
                frequency_penalty: 0.5, // Prevent looping/repetition
                presence_penalty: 0.3,
                max_tokens: 8000
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Groq API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Helper to call Cerebras API (OpenAI compatible)
 */
async function callCerebras(prompt, jsonMode = false, temperature = 0.1) {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_CEREBRAS_API_KEY_HERE") {
        throw new Error("CEREBRAS_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
        const response = await fetch(CEREBRAS_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODELS.CEREBRAS_MODEL,
                messages: [{ role: 'user', content: prompt }],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: temperature,
                frequency_penalty: 0.5, // Prevent looping/repetition
                presence_penalty: 0.3,
                max_tokens: 8000
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Cerebras API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || data.choices[0].message.content === undefined || data.choices[0].message.content === null) {
            throw new Error("Cerebras returned an empty response or was interrupted");
        }

        return data.choices[0].message.content;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Generate quiz using Gemini. Mimics quiz_generator.py logic but with actual AI.
 */
const generateQuiz = async (title, description, url = null, intuitionText = null, numQuestions = 10) => {
    // If intuitionText is JSON with pages, extract all chapters to provide the entire lecture context
    let parsedNotes = null;
    try {
        if (typeof intuitionText === 'string' && intuitionText.trim().startsWith('{')) {
            parsedNotes = JSON.parse(intuitionText);
        }
    } catch (e) {}

    let processedIntuition = intuitionText;
    let multiChapterInstructions = '';
    if (parsedNotes && Array.isArray(parsedNotes.pages) && parsedNotes.pages.length > 0) {
        processedIntuition = parsedNotes.pages
            .map(p => `### ${p.title}\n${p.content}`)
            .join('\n\n---\n\n');

        multiChapterInstructions = `
      - MULTI-CHAPTER COVERAGE: The provided study notes contain ${parsedNotes.pages.length} distinct chapters. You MUST distribute your questions evenly across ALL chapters (e.g., at least 1-2 questions from each chapter) to thoroughly test the student's mastery across the entire video.
        `;
    }

    const quizPrompt = `
      Act as an expert educator. Based ONLY on the following video/playlist info and specifically the provided "AI Intuition Summary", generate a highly comprehensive and DIVERSE quiz with BETWEEN 8 and 10 multiple-choice questions (STRICTLY AT MOST 10). 
      
      STRICT CONSTRAINTS:
      - EVERY question must be unique. Do NOT repeat the same concept or wording across questions.
      - Each question must cover a different sub-topic, technical detail, or specific insight from the summary.
      - Vary the question types: 
        1. 25% Conceptual (High-level theory)
        2. 25% Fact-based (Specific details/definitions)
        3. 25% Scenario-based (Applying the knowledge)
        4. 25% Analysis-based (Comparison or troubleshooting)
      ${multiChapterInstructions}
      It is absolutely critical that every single question is directly derived from the concepts explained in the "AI Intuition Summary" below.
      
      Title: ${title}
      URL: ${url || 'Not provided'}
      Description: ${description}
      ${processedIntuition ? `\nAI Intuition Summary (PRIMARY SOURCE):\n${processedIntuition}\n` : ''}
      
      Format the output as a JSON array of objects, where each object has:
      - "question": The question text
      - "options": An array of 4 strings
      - "answer": The exact full text string of the correct option (MUST exactly match one of the 4 strings in 'options'. DO NOT just return the letter A/B/C/D)
      
      Respond ONLY with the JSON array. No preamble, no markdown blocks.
    `;

    // ... inside the loop ...
    // Update temperatures to 0.3 below

    // Helper to deduplicate locally after AI response
    const deduplicateQuestions = (qs) => {
        if (!Array.isArray(qs)) return qs;
        const seen = new Set();
        return qs.filter(q => {
            const normalized = q.question.trim().toLowerCase();
            if (seen.has(normalized)) return false;
            seen.add(normalized);
            return true;
        });
    };

    // Priority: Google Cloud Vertex AI (funded by Google Cloud startup credits)
    const chain = [
        { type: 'gemini', model: MODELS.GEMINI_FLASH_LITE },
        { type: 'gemini', model: MODELS.GEMINI_FLASH },
        { type: 'gemini', model: MODELS.GEMINI_PRO },
        { type: 'groq', model: MODELS.GROQ_LLAMA_70B }
    ];

    for (const provider of chain) {
        try {
            const providerName = provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model));
            console.log(`[Quiz] Attempting with ${providerName}...`);
            let text;
            if (provider.type === 'gemini') {
                text = await generateGeminiContent(provider.model, quizPrompt, {
                    responseMimeType: "application/json",
                    maxOutputTokens: 2000,
                    temperature: 0.3
                });
            } else if (provider.type === 'groq') {
                text = await callGroq(quizPrompt, true, provider.model, 0.3);
            } else if (provider.type === 'cerebras') {
                text = await callCerebras(quizPrompt, true, 0.3);
            } else if (provider.type === 'openrouter') {
                text = await callOpenRouter(quizPrompt, true, 0.3);
            }

            const rawQs = cleanAIJSON(text);
            const cleanQs = deduplicateQuestions(rawQs);

            if (!Array.isArray(cleanQs) || cleanQs.length === 0) {
                throw new Error("AI did not return a valid array of questions");
            }

            return {
                questions: cleanQs,
                isFallback: provider.model !== MODELS.GEMINI_2_5,
                isSystemFallback: false
            };
        } catch (error) {
            const providerName = provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model));
            console.warn(`[Quiz] ${providerName} failed:`, error.message);
            if (provider === chain[chain.length - 1]) throw error; // Re-throw if last in chain
        }
    }
};

/**
 * Helper to strip leading indentation from template literals.
 */
const dedent = (str) => {
    const lines = str.split('\n');
    const minIndent = lines
        .filter(line => line.trim())
        .reduce((min, line) => {
            const match = line.match(/^(\s*)/);
            return match ? Math.min(min, match[1].length) : min;
        }, Infinity);
    
    if (minIndent === Infinity) return str;
    
    return lines
        .map(line => {
            if (line.trim() === '') return '';
            return line.startsWith(' '.repeat(minIndent)) ? line.substring(minIndent) : line.trimStart();
        })
        .join('\n')
        .trim();
};

/**
 * Generate intuition/study notes using the actual video transcript as the primary source.
 * Dynamically scales depth and chapter count based on lecture duration and subject matter.
 */
const generateIntuition = async (title, description, url = null, targetLanguage = null, forceDeepVisual = false, durationSeconds = 0) => {
    // --- STEP 1: Determine Routing Path ---
    const isMultimodalVideoRouting = forceDeepVisual && !!vertexAIClient && !!url;
    
    let hasTranscript = false;
    let transcriptResult = { transcript: null, language: null, isFallback: true };
    let transcriptText = null;

    if (isMultimodalVideoRouting) {
        console.log(`[Intuition] Routing to Direct YouTube Multimodal Analysis (Forced) for URL: ${url}`);
    } else {
        // Attempt to fetch transcript
        transcriptResult = await fetchTranscript(url);
        hasTranscript = !transcriptResult.isFallback && !!transcriptResult.transcript;

        if (hasTranscript) {
            console.log(`[Intuition] Routing to Transcript-Only Analysis. Transcript fetched (${transcriptResult.transcript.length} chars)`);
            transcriptText = transcriptResult.transcript;
        } else {
            console.log(`[Intuition] Transcript unavailable. Falling back to Title+Description text-only analysis.`);
        }
    }

    const detectedLanguage = transcriptResult.language || 'English';
    const finalLanguage = targetLanguage || detectedLanguage;

    // --- STEP 2: Subject & Duration Classification ---
    const subjectInfo = detectSubjectCategory(title, description, transcriptText);
    const durationMin = durationSeconds > 0 ? Math.round(durationSeconds / 60) : 0;

    let targetPages = 2;
    if (durationMin > 0) {
        if (durationMin <= 15) {
            targetPages = 1;
        } else if (durationMin <= 40) {
            targetPages = 2;
        } else if (durationMin <= 75) {
            targetPages = 3;
        } else if (durationMin <= 120) {
            targetPages = 4;
        } else {
            targetPages = Math.min(6, 4 + Math.floor((durationMin - 120) / 45));
        }
    } else if (transcriptText) {
        const chars = transcriptText.length;
        if (chars <= 6000) {
            targetPages = 1;
        } else if (chars <= 18000) {
            targetPages = 2;
        } else if (chars <= 35000) {
            targetPages = 3;
        } else if (chars <= 60000) {
            targetPages = 4;
        } else {
            targetPages = 5;
        }
    } else {
        targetPages = 2;
    }

    // Subject-Specific Pedagogical Guidance
    let categoryGuidance = '';
    switch (subjectInfo.category) {
        case 'coding':
            categoryGuidance = `
- SUBJECT SPECIALIZATION: Computer Science & Software Engineering.
- Provide clean, robust, syntax-highlighted code implementations (with appropriate language tags like \`\`\`python, \`\`\`javascript, etc.).
- Include algorithmic breakdowns, data structure choices, and time/space complexity analysis using LaTeX $O(n)$ notation.
- Emphasize edge cases, common pitfalls, debugging tips, and real-world system architecture tradeoffs.`;
            break;
        case 'math_science':
            categoryGuidance = `
- SUBJECT SPECIALIZATION: Mathematics, Pure Science & Engineering.
- Use rigorous LaTeX notation for ALL equations, variables, and formulas (using $...$ for inline and $$...$$ for block formulas).
- Include formal theorems, axioms, intuitive physical/mathematical explanations, step-by-step mathematical proofs or derivations, and worked practice problems.
- Never write plain text math (e.g. write $\\frac{dy}{dx}$ rather than dy/dx).`;
            break;
        case 'business_finance':
            categoryGuidance = `
- SUBJECT SPECIALIZATION: Business, Economics, Finance & Management.
- Provide structured analytical frameworks (e.g., SWOT, Porter's Five Forces, Unit Economics, Cost-Benefit Analysis).
- Detail financial metrics, formulas (e.g. $ROI = \\frac{\\text{Net Profit}}{\\text{Cost}}$, $LTV/CAC$), and quantitative business dynamics.
- Include empirical case studies, risk assessments, and executive decision-making tradeoffs.`;
            break;
        case 'tutorial_workflow':
            categoryGuidance = `
- SUBJECT SPECIALIZATION: Hands-on Workshop & Technical Workflow.
- Detail prerequisite dependencies, environment configurations, and tools needed.
- Provide comprehensive, step-by-step execution procedures.
- Highlight common errors, configuration gotchas, and production best practices checklist.`;
            break;
        default:
            categoryGuidance = `
- SUBJECT SPECIALIZATION: Academic Theory & Analytical Humanities.
- Provide rigorous conceptual foundations, historical context, core philosophical paradigms, and schools of thought.
- Detail cause-and-effect mechanisms, dialectics, and critical perspectives.
- Include structured synthesis suitable for university exam descriptive answers.`;
            break;
    }

    const transcriptSection = isMultimodalVideoRouting
        ? `\n(Using direct YouTube video link multimodal analysis. Analyze the video frames and audio directly.)\n`
        : (hasTranscript
            ? `\n=== ACTUAL VIDEO TRANSCRIPT (PRIMARY SOURCE — ground truth for all concepts) ===\n${transcriptText}\n=== END OF TRANSCRIPT ===\n`
            : `\n(No transcript available. Synthesize rigorous academic notes based on the video title and description in ${finalLanguage}.)\n`);

    const topicStructureGuidance = targetPages === 1
        ? `Generate 1 deeply detailed, comprehensive topic that covers the complete subject matter thoroughly.`
        : `Generate exactly ${targetPages} distinct, progressive topics that conceptually and practically master the lecture from fundamentals to advanced applications.`;

    const intuitionPrompt = dedent(`
        Act as a Distinguished University Professor, Subject Matter Authority, and Master Educator in ${subjectInfo.label}.
        Your goal is to produce comprehensive, user-friendly, and engaging DIGITAL STUDY NOTES for the video lecture below.
        
        The student should be able to read these notes to achieve total academic mastery and ace examinations.
        
        STRICT RULES & GUIDELINES:
        1. NO TIMELINES OR TIMESTAMPS: Absolutely DO NOT write timestamps or timelines (e.g., do NOT write "[00:14:20]" or "At 12 minutes"). The notes must read like cohesive, structured digital study notes.
        2. EXHAUSTIVE ACADEMIC DEPTH: Avoid superficial summaries or brief 2-sentence points. Explain every concept, theorem, algorithm, or principle thoroughly with underlying mechanisms and technical rigor.
        3. SUBJECT-ADAPTIVE SPECIALIZATION:
        ${categoryGuidance}
        4. MATHEMATICAL RIGOR & LATEX:
           - Wrap ALL mathematical equations, variables, and formulas in standard delimiters.
           - Inline math: $...$ (e.g., $f(x) = \\int e^{-t^2} dt$, $O(n \\log n)$).
           - Block math: $$...$$ (e.g., $$\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e$$).
           - Never output naked LaTeX commands outside dollar signs.
        5. CLEAN MARKDOWN: Use Markdown headers (###, ####), lists (- **Term**: Definition), bolding (**text**), and code blocks with syntax tags. NO raw HTML tags (<br>, <b>, <i>).
        6. TOPIC-BY-TOPIC BREAKDOWN:
           - Target topic count: exactly ${targetPages} topics.
           - ${topicStructureGuidance}
           - Each topic must have a clear, descriptive title (e.g., "Topic 1: Core Theoretical Foundations", "Topic 2: Implementation & Case Studies").
           - Each topic should contain 500-1200 words of rich, high-density study material.
           - CRITICAL JSON ESCAPING: Inside the "content" string, do NOT use unescaped double quotes (use single quotes 'like this' or escaped \\"like this\\").
        
        Video Title: '${title}'
        Video URL: '${url || 'Not provided'}'
        Video Description: '${description}'
        ${transcriptSection}
        
        IMPORTANT: Your entire response MUST be formatted strictly as valid JSON matching this schema:
        {
          "subjectCategory": "${subjectInfo.category}",
          "categoryLabel": "${subjectInfo.label}",
          "estimatedReadTimeMinutes": <estimated total reading time in minutes as integer>,
          "totalPages": ${targetPages},
          "pages": [
            {
              "pageNumber": 1,
              "title": "Topic 1: ...",
              "content": "### 🎯 Core Technical Overview\\nDetailed markdown content...\\n\\n### ⚙️ Mechanics & Implementation\\n..."
            }
          ]
        }
        
        Language: All topic titles and content MUST be written in ${finalLanguage}.
        Respond ONLY with the JSON object. Do not include markdown code block tags or conversational filler.
    `);

    // --- STEP 3: Setup Provider Routing Chain ---
    let chain = [
        { type: 'gemini', model: MODELS.GEMINI_FLASH_LITE },
        { type: 'gemini', model: MODELS.GEMINI_FLASH },
        { type: 'gemini', model: MODELS.GEMINI_PRO },
        { type: 'groq', model: MODELS.GROQ_LLAMA_70B }
    ];

    for (const provider of chain) {
        try {
            const providerName = provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model));
            console.log(`[Intuition] Attempting with ${providerName} (${targetPages} chapters, ${subjectInfo.category})...`);
            let text;
            if (provider.type === 'gemini') {
                if (isMultimodalVideoRouting && vertexAIClient) {
                    const contents = [
                        {
                            fileData: {
                                fileUri: url,
                                mimeType: 'video/mp4'
                            }
                        },
                        {
                            text: intuitionPrompt
                        }
                    ];
                    text = await generateGeminiContent(provider.model, contents, {
                        maxOutputTokens: 8192,
                        temperature: 0.2,
                        responseMimeType: "application/json"
                    });
                } else {
                    text = await generateGeminiContent(provider.model, intuitionPrompt, {
                        maxOutputTokens: 8192,
                        temperature: 0.2,
                        responseMimeType: "application/json"
                    });
                }
            } else if (provider.type === 'groq') {
                text = await callGroq(intuitionPrompt, true, provider.model, 0.2);
            } else if (provider.type === 'cerebras') {
                text = await callCerebras(intuitionPrompt, true, 0.2);
            } else if (provider.type === 'openrouter') {
                text = await callOpenRouter(intuitionPrompt, true, 0.2);
            }

            if (!text || text.trim() === '') {
                throw new Error("Model returned empty or null content");
            }

            let parsedNotes = cleanIntuitionJSON(text, subjectInfo.category, subjectInfo.label);
            if (!parsedNotes) {
                // If model returned markdown directly instead of JSON, wrap it cleanly
                parsedNotes = {
                    subjectCategory: subjectInfo.category,
                    categoryLabel: subjectInfo.label,
                    estimatedReadTimeMinutes: Math.max(3, Math.round(text.split(/\s+/).length / 180)),
                    totalPages: 1,
                    pages: [
                        {
                            pageNumber: 1,
                            title: "Topic 1: Comprehensive Study Notes",
                            content: text.trim()
                        }
                    ]
                };
            }

            return {
                content: JSON.stringify(parsedNotes),
                isFallback: provider.model !== MODELS.GEMINI_2_5,
                isSystemFallback: false,
                transcript_used: hasTranscript,
                model_name: provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'groq' ? provider.model : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model))
            };
        } catch (error) {
            const providerName = provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model));
            console.warn(`[Intuition] ${providerName} failed:`, error.message);
            if (provider === chain[chain.length - 1]) {
                const fallbackData = {
                    subjectCategory: subjectInfo.category,
                    categoryLabel: subjectInfo.label,
                    estimatedReadTimeMinutes: 3,
                    totalPages: 1,
                    pages: [
                        {
                            pageNumber: 1,
                            title: "Topic 1: Core Concepts & Overview",
                            content: `
### 🎯 Core Concept
${title} is a learning resource covering important educational topics in ${subjectInfo.label}.

### 💡 Key Takeaways
- Fundamental principles of the subject matter.
- Practical applications and core methods introduced in the lecture.

### 🧠 Why This Matters
Mastering this topic establishes a solid foundation for advanced studies and examinations.

### 📚 Additional Study Guidance
*(Note: Detailed AI-generated study notes are temporarily regenerating due to high demand. Please review the video description for immediate reference: ${description})*
                            `.trim()
                        }
                    ]
                };
                return {
                    content: JSON.stringify(fallbackData),
                    isFallback: true,
                    isSystemFallback: true
                };
            }
        }
    }
};


/**
 * Helper to translate a single block of text into a target language.
 */
const translateRawBlock = async (text, targetLanguage, targetCode) => {
    if (!text || text.trim() === '') return text;
    try {
        const res = await translate(text, { to: targetCode });
        if (res.text && (res.text.length >= text.length * 0.2 || text.length < 50)) {
            return res.text;
        }
    } catch (err) {
        console.warn(`[Translate] Free translator failed for block:`, err.message);
    }

    // Fallback: Gemini translation
    const translationPrompt = `
        Act as a professional polyglot translator. 
        Translate the following academic content accurately into ${targetLanguage}.
        IMPORTANT: Keep all Markdown formatting (headings, lists, bold text, code blocks, math) intact.
        Do NOT summarize. Provide a 1:1 translation.
        
        TEXT TO TRANSLATE:
        ${text}
    `;

    try {
        return await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, translationPrompt, {
            maxOutputTokens: 8192,
            temperature: 0.2
        });
    } catch (e) {
        try {
            return await callGroq(translationPrompt, false, MODELS.GROQ_LLAMA_70B, 0.3);
        } catch (groqErr) {
            return text; // Return original if fallback fails
        }
    }
};

/**
 * Translate a block of text into a target language using FREE Google Translate.
 * This saves AI API quota for more complex generation tasks.
 */
const translateText = async (text, targetLanguage) => {
    if (!targetLanguage || targetLanguage === 'English' || targetLanguage === 'auto') {
        return { content: text, model_name: 'Original' };
    }

    // Map common names to ISO codes for Google Translate
    const langMap = {
        'Hindi': 'hi',
        'Marathi': 'mr',
        'Bengali': 'bn',
        'Telugu': 'te',
        'Tamil': 'ta',
        'Gujarati': 'gu',
        'Urdu': 'ur',
        'Kannada': 'kn',
        'Odia': 'or',
        'Malayalam': 'ml',
        'Punjabi': 'pa',
        'English': 'en'
    };

    const targetCode = langMap[targetLanguage] || targetLanguage.slice(0, 2).toLowerCase();

    // Check if text is paginated JSON notes
    let parsedNotes = null;
    try {
        if (typeof text === 'string' && text.trim().startsWith('{')) {
            parsedNotes = JSON.parse(text);
        }
    } catch (e) {}

    if (parsedNotes && Array.isArray(parsedNotes.pages) && parsedNotes.pages.length > 0) {
        console.log(`[Translate] Translating ${parsedNotes.pages.length} chapters to ${targetLanguage}...`);
        try {
            const translatedPages = await Promise.all(
                parsedNotes.pages.map(async (page) => {
                    const [translatedTitle, translatedContent] = await Promise.all([
                        translateRawBlock(page.title, targetLanguage, targetCode),
                        translateRawBlock(page.content, targetLanguage, targetCode)
                    ]);
                    return {
                        ...page,
                        title: translatedTitle || page.title,
                        content: translatedContent || page.content
                    };
                })
            );
            const translatedCategoryLabel = await translateRawBlock(parsedNotes.categoryLabel, targetLanguage, targetCode);

            const translatedJson = {
                ...parsedNotes,
                categoryLabel: translatedCategoryLabel || parsedNotes.categoryLabel,
                pages: translatedPages
            };
            return { content: JSON.stringify(translatedJson), model_name: 'Google Translate (Paginated)' };
        } catch (e) {
            console.error("[Translate] Paginated translation error:", e.message);
        }
    }

    // Default plain text translation for non-JSON strings
    try {
        console.log(`[Translate] Using FREE Google Translate to ${targetLanguage} (${targetCode})...`);
        const res = await translate(text, { to: targetCode });

        // Basic check for repetition/shortness in free translator output
        if (res.text && res.text.length < text.length * 0.2 && text.length > 500) {
            throw new Error("Translation looks truncated or corrupted");
        }

        return { content: res.text, model_name: 'Free Google Translate' };
    } catch (err) {
        console.warn(`[Translate] Free Google Translate failed, falling back to Cerebras/Groq:`, err.message);

        // --- FALLBACK: Use LLM as backup if free service is blocked/down ---
        const translationPrompt = `
            Act as a professional polyglot translator. 
            Translate the following academic content exactly into ${targetLanguage}.
            IMPORTANT: Keep all Markdown formatting (headings, lists, bold text) intact.
            Do NOT summarize. Provide a 1:1 translation.
            
            TEXT TO TRANSLATE (in English):
            ${text}
        `;

        try {
            const translated = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, translationPrompt, {
                maxOutputTokens: 8192,
                temperature: 0.2
            });
            return { content: translated, model_name: `${MODELS.GEMINI_FLASH_LITE} (Vertex AI Translation)` };
        } catch (vertexErr) {
            try {
                const translated = await generateGeminiContent(MODELS.GEMINI_FLASH, translationPrompt, {
                    maxOutputTokens: 8192,
                    temperature: 0.2
                });
                return { content: translated, model_name: `${MODELS.GEMINI_FLASH} (Vertex AI Translation)` };
            } catch (llmErr) {
                const translated = await callGroq(translationPrompt, false, MODELS.GROQ_LLAMA_70B, 0.5);
                return { content: translated, model_name: `${MODELS.GROQ_LLAMA_70B} (LLM Translation)` };
            }
        }
    }
};

/**
 * Benchmark all available models for a given title and description.
 */
const benchmarkAllModels = async (title, description, url = null) => {
    const intuitionPrompt = `
        Act as an expert, highly engaging educational tutor.
        Provide a concise yet complete intuition and breakdown of the core concepts for the video.
        
        STRICT FORMATTING RULES:
        1. NO HTML TAGS: Do NOT output raw HTML tags (e.g., do NOT use <br>, <b>, <i>, etc.). Use standard Markdown syntax (like double newlines) for line breaks and paragraphs.
        2. STANDARD MATH FORMATTING: If you write mathematical formulas, variables, equations, or LaTeX commands, you MUST wrap them in standard delimiters:
           - Wrap the ENTIRE equation, function, or formula (including all variables, operators, spacing commands, and fractions) in a single set of delimiters.
           - Use single dollar signs ($...$) for inline math (e.g., $t \\ge A_i$, $P(A \\cup B) = P(A) + P(B)$).
           - Use double dollar signs ($$...$$) for block equations (e.g., $$\\boxed{P(A \\cup B) = P(A) + P(B) - P(A \\cap B)}$$).
           - CRITICAL: Never write LaTeX commands (like \\frac, \\cup, \\cap, \\boxed, \\qquad, \\Omega, \\varnothing, \\cdot, \\setminus) as plain text outside math delimiters. They will fail to render.
           - CRITICAL: Never nest dollar signs inside other delimiters (e.g., do NOT write \\boxed{P$A\\cup B$} or P$A\\cup B$. Instead write $\\boxed{P(A\\cup B)}$ or $P(A\\cup B)$).
           - Do NOT use parenthesis delimiters like (t \\ge A_i) or square brackets like [t \\ge A_i] for math.
        3. STRICT MARKDOWN BOLDING & HEADERS: Ensure every opening bold marker "**" has a matching closing bold marker "**". Do not leave trailing or loose asterisks. Do NOT use single asterisks (*) for headers or titles; always use double asterisks (**) to bold them.
        
        Title: '${title}'
        URL: '${url || 'Not provided'}'
        Description: '${description}'.
        
        Format your response in markdown with these headings. Aim for a high-quality depth of ~600-800 words total:
        ### 🎯 Core Concept
        ### 💡 Key Takeaways
        ### 🧠 Why This Matters
        ### 📚 Deep Dive
        ### 🛠️ Practical Examples
    `;

    const providers = [
        { name: 'Gemini 2.5 Flash', type: 'gemini', model: MODELS.GEMINI_2_5 },
        { name: 'Gemini 3 Flash', type: 'gemini', model: MODELS.GEMINI_3 },
        { name: 'Groq (Llama 3.3 70B)', type: 'groq', model: MODELS.GROQ_LLAMA_70B },
        { name: 'Cerebras (Fast Inference)', type: 'cerebras' },
    ];

    const results = {};
    const promises = providers.map(async (p) => {
        try {
            let text;
            if (p.type === 'gemini') {
                text = await generateGeminiContent(p.model, intuitionPrompt, { maxOutputTokens: 8192 });
            } else if (p.type === 'groq') {
                text = await callGroq(intuitionPrompt, false, p.model);
            } else if (p.type === 'cerebras') {
                text = await callCerebras(intuitionPrompt);
            }
            results[p.name] = { content: text, status: 'success' };
        } catch (error) {
            results[p.name] = { content: error.message, status: 'error' };
        }
    });

    await Promise.all(promises);
    return results;
};

/**
 * Answer student doubt / questions regarding the video lecture in real-time
 */
const answerVideoDoubt = async ({ videoId, title, description, intuition, question, chatHistory = [], language = 'English' }) => {
    const prompt = `
You are an expert AI Professor and Teaching Assistant for LearnProof AI.
A student is watching this educational lecture and asking a doubt or question about the concept.

Video Title: "${title || 'Educational Lecture'}"
Video Description: "${description || 'None'}"
${intuition ? `\nLecture Core Notes & AI Intuition Summary:\n${intuition}\n` : ''}

Student's Question: "${question}"

Conversation Context so far:
${chatHistory.map(m => `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`).join('\n')}

Guidelines:
1. Provide a direct, crystal-clear, pedagogically sound, and engaging answer.
2. Ground your explanation directly in the subject matter of the video.
3. If relevant, provide intuitive analogies, step-by-step logic, code snippets (if programming related), or LaTeX mathematical formulas (inline $...$ or block $$...$$).
4. Keep the tone encouraging, concise (around 150-250 words), structured with bold headings and bullet points where helpful.
5. If the student asks in Hindi, Marathi, or another language, or if specified as ${language}, respond naturally in ${language}.
`;

    // Priority: Google Cloud Vertex AI (funded by startup credits)
    const chain = [
        { type: 'gemini', model: MODELS.GEMINI_FLASH_LITE },
        { type: 'gemini', model: MODELS.GEMINI_FLASH },
        { type: 'gemini', model: MODELS.GEMINI_PRO },
        { type: 'groq', model: MODELS.GROQ_LLAMA_70B }
    ];

    for (const provider of chain) {
        try {
            if (provider.type === 'gemini') {
                const text = await generateGeminiContent(provider.model, prompt, {
                    maxOutputTokens: 1500,
                    temperature: 0.3
                });
                if (text && text.trim()) return text.trim();
            } else if (provider.type === 'groq') {
                const text = await callGroq(prompt, false, provider.model, 0.3);
                if (text && text.trim()) return text.trim();
            } else if (provider.type === 'openrouter') {
                const text = await callOpenRouter(prompt, false, 0.3);
                if (text && text.trim()) return text.trim();
            } else if (provider.type === 'cerebras') {
                const text = await callCerebras(prompt, false, 0.3);
                if (text && text.trim()) return text.trim();
            }
        } catch (err) {
            console.warn(`[Video Doubt AI] ${provider.type} failed, falling back:`, err.message);
        }
    }

    throw new Error('Unable to generate answer right now. Please try again.');
};

module.exports = {
    generateQuiz,
    generateIntuition,
    translateText,
    benchmarkAllModels,
    generateGeminiContent,
    answerVideoDoubt,
    MODELS
};
