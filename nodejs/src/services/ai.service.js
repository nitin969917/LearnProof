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
    const timeoutMs = config.timeout || 10000; // 10 seconds timeout for faster Cerebras failover
    
    const callPromise = (async () => {
        if (vertexAIClient) {
            console.log(`[Gemini] Calling Vertex AI client with model: ${modelName}`);
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
                console.warn(`[Gemini] Vertex AI generateContent failed, falling back to Google AI Studio:`, vertexErr.message);
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
            console.log(`[Gemini] Calling Google AI Studio client with model: ${modelName}`);
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
        setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([callPromise, timeoutPromise]);
};


const MODELS = {
    GEMINI_2_5: 'gemini-2.5-flash-lite', // Optimized for low latency & higher rate limits
    GEMINI_3: 'gemini-3-flash-preview',
    GEMINI_2_5_LITE: 'gemini-2.5-flash', // Full flash model as fallback
    GROQ_LLAMA_70B: 'llama-3.3-70b-versatile',
    GROQ_LLAMA_8B: 'llama-3.1-8b-instant',
    GROQ_QWEN_32B: 'qwen/qwen3-32b',
    GROQ_LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    OPENROUTER_MODEL: 'openrouter/free', // Free model router
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
      
      It is absolutely critical that every single question is directly derived from the concepts explained in the "AI Intuition Summary" below.
      
      Title: ${title}
      URL: ${url || 'Not provided'}
      Description: ${description}
      ${intuitionText ? `\nAI Intuition Summary (PRIMARY SOURCE):\n${intuitionText}\n` : ''}
      
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

    // Priority Strategy for Speed (<5s): Cerebras -> Gemini 2.5 -> Groq (70B) -> Groq (8B) -> Gemini 3 -> OpenRouter
    const chain = [
        { type: 'cerebras' },
        { type: 'gemini', model: MODELS.GEMINI_2_5 },
        { type: 'groq', model: MODELS.GROQ_LLAMA_70B },
        { type: 'groq', model: MODELS.GROQ_LLAMA_8B },
        { type: 'gemini', model: MODELS.GEMINI_3 },
        { type: 'groq', model: MODELS.GROQ_QWEN_32B },
        { type: 'openrouter' },
        { type: 'gemini', model: MODELS.GEMINI_2_5_LITE }
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
 * Generate intuition/summary using the actual video transcript as the primary source.
 * Falls back to direct YouTube URL multimodal analysis or title+description.
 */
const generateIntuition = async (title, description, url = null, targetLanguage = null, forceDeepVisual = false) => {
    // --- STEP 1: Determine Routing Path ---
    // Direct video multimodal analysis is ONLY used if explicitly forced by the user (forceDeepVisual = true).
    // By default, we always use the text transcript, falling back to title+description if the transcript is unavailable.
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

    // --- STEP 2: Build Prompt ---
    const transcriptSection = isMultimodalVideoRouting
        ? `
(Using direct YouTube video link multimodal analysis. Do NOT use any transcripts. Analyze the video frames and audio directly.)
`
        : (hasTranscript
            ? `
=== ACTUAL VIDEO TRANSCRIPT (PRIMARY SOURCE — use this as the ground truth for all content) ===
${transcriptText}
=== END OF TRANSCRIPT ===

IMPORTANT LANGUAGE INSTRUCTION: You MUST write your entire response in ${finalLanguage}.
Even though the transcript is in ${detectedLanguage}, the user wants the final explanation in ${finalLanguage}.
Do NOT translate names of core concepts if they are standardized, but explain everything else in ${finalLanguage}.
`
            : `
(No transcript available. Generate intuition based on the video title and description below in ${finalLanguage}. 
IMPORTANT: Use ONLY information that can be inferred from the title and description.)
`);

    const intuitionPrompt = dedent(`
        Act as an Expert Academic Professor and Exam Specialist.
        Your goal is to provide a STERN, HIGHLY TECHNICAL, and CONCISE academic breakdown of the subject matter.
        
        CRITICAL INSTRUCTION: Do NOT just describe what happens in the video (e.g., avoid "The speaker says..."). 
        Instead, use the video as your secondary source of data to EXPLAIN THE CORE SUBJECT ITSELF with academic authority. 
        Structure the content such that a student can directly use it to answer descriptive university exam questions.
        If the video is a tutorial, provide the underlying theory as well.
        
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
        4. BULLET POINT LIST ITEMS & NEWLINES: When writing lists (such as learning objectives/takeaways or exam tip outlines), you MUST format each item on a new line starting with a hyphen and a space (e.g. "- **Concept**: Explanation"). You MUST separate every consecutive list item and every paragraph with double newlines (\\n\\n). Do NOT combine multiple bullet points, lists, or distinct takeaways into a single line or paragraph.
        5. NO PREAMBLE, GREETINGS, OR TITLE: Start your output immediately with the first heading "### 🎯 Core Technical Definition". Do NOT write any introduction (such as "Here is the summary:", "Sure, here is the breakdown:"), titles (like "# Topic Name"), or horizontal rules at the very beginning of the response.
        
        Video Title: '${title}'
        Video URL: '${url || 'Not provided'}'
        Video Description: '${description}'
        ${transcriptSection}
        
        Format your response in beautiful, highly readable markdown. Technical precision and academic depth are paramount, but keep explanations clear, complete, and concise (avoid unnecessary filler).
        
        Break it down exactly into these academic headings:
        ### 🎯 Core Technical Definition
        (Instruction: Provide a formal, academic definition of the subject. Use standard industry/academic terminology. Around 60-80 words of foundational theory.)
        
        ### 💡 Key Learning Objectives & Takeaways
        (Instruction: Provide a list of key concepts covered. Each point must explain the 'Mechanism', 'Process', or 'Rule'. Exactly 3-4 key points, each formatted as a bullet point starting with a hyphen and separated by double newlines.)
        
        ### 🧠 Theoretical Framework & Why It Matters
        (Instruction: Provide deep intuition, the underlying philosophy, and the scientific/industrial logic behind the concept. Around 60-80 words.)
        
        ### 📚 Progressive Deep Dive (The Exam Core)
        (Instruction: Walk through the content progressively. Explain 'How it works' step-by-step with technical rigor. Around 120-150 words.)
        
        ### 🛠️ Practical Scenarios & Comparative Analysis
        (Instruction: Provide concrete examples, use-cases, or code. Around 60-80 words.)
        
        ### 📝 Potential Exam Questions & High-Score Tips
        (Instruction: List 2 likely descriptive exam questions based on this video. Format each question title strictly in bold using double asterisks: **Question X: [Question Text]**, followed by short 'Bullet-Point' outlines of how the user should answer them to get full marks. Do NOT use single asterisks * for question titles or headers. Separate all elements by double newlines.)

        CRITICAL SPEED INSTRUCTION: Be extremely technical but highly concise. Write at most 450-500 words in total. This is crucial for real-time responsiveness.
        IMPORTANT: Your entire response MUST be in ${finalLanguage}.
    `);

    // --- STEP 3: Setup Provider Routing Chain ---
    let chain = [];

    if (isMultimodalVideoRouting) {
        chain = [
            { type: 'gemini', model: MODELS.GEMINI_2_5 },
            { type: 'gemini', model: MODELS.GEMINI_3 },
            { type: 'cerebras' },
            { type: 'groq', model: MODELS.GROQ_LLAMA_70B }
        ];
    } else if (hasTranscript) {
        chain = [
            { type: 'gemini', model: MODELS.GEMINI_2_5 },
            { type: 'cerebras' },
            { type: 'groq', model: MODELS.GROQ_LLAMA_70B },
            { type: 'gemini', model: MODELS.GEMINI_3 },
            { type: 'openrouter' }
        ];
    } else {
        chain = [
            { type: 'gemini', model: MODELS.GEMINI_2_5 },
            { type: 'cerebras' },
            { type: 'groq', model: MODELS.GROQ_LLAMA_70B },
            { type: 'openrouter' }
        ];
    }

    for (const provider of chain) {
        try {
            const providerName = provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model));
            console.log(`[Intuition] Attempting with ${providerName}...`);
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
                        maxOutputTokens: 2048,
                        temperature: 0.2
                    });
                } else {
                    text = await generateGeminiContent(provider.model, intuitionPrompt, {
                        maxOutputTokens: 2048,
                        temperature: 0.2
                    });
                }
            } else if (provider.type === 'groq') {
                text = await callGroq(intuitionPrompt, false, provider.model);
            } else if (provider.type === 'cerebras') {
                text = await callCerebras(intuitionPrompt);
            } else if (provider.type === 'openrouter') {
                text = await callOpenRouter(intuitionPrompt);
            }

            if (!text || text.trim() === '') {
                throw new Error("Model returned empty or null content");
            }

            return {
                content: text.trim(),
                isFallback: provider.model !== MODELS.GEMINI_2_5,
                isSystemFallback: false,
                transcript_used: hasTranscript,
                model_name: provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'groq' ? provider.model : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model))
            };
        } catch (error) {
            const providerName = provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model));
            console.warn(`[Intuition] ${providerName} failed:`, error.message);
            if (provider === chain[chain.length - 1]) {
                return {
                    content: `
### 🎯 Core Concept
${title} is a learning resource covering important educational topics. 

### 💡 Key Takeaways
- Fundamental understanding of the subject matter.
- Practical applications as described in the video.

### 🧠 Why This Matters
Learning this concept helps build a strong foundation for advanced topics.

### 📚 Deep Dive
*(Note: Detailed AI-generated intuition is temporarily unavailable due to high demand/API limits. Please review the video description for more details: ${description})*
                    `.trim(),
                    isFallback: true,
                    isSystemFallback: true
                };
            }
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
            // Using higher temperature and penalty for translation fallback to ensure flow
            const translated = await callCerebras(translationPrompt, false, 0.5);
            return { content: translated, model_name: `${MODELS.CEREBRAS_MODEL} (LLM Translation)` };
        } catch (llmErr) {
            const translated = await callGroq(translationPrompt, false, MODELS.GROQ_LLAMA_70B, 0.5);
            return { content: translated, model_name: `${MODELS.GROQ_LLAMA_70B} (LLM Translation)` };
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

module.exports = {
    generateQuiz,
    generateIntuition,
    translateText,
    benchmarkAllModels
};
