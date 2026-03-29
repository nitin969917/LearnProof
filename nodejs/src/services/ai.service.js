const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { fetchTranscript } = require('./transcript.service');
const { translate } = require('google-translate-api-x');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MODELS = {
    GEMINI_2_5: 'gemini-2.5-flash',
    GEMINI_3: 'gemini-3-flash-preview',
    GEMINI_2_5_LITE: 'gemini-2.5-flash-lite',
    GROQ_LLAMA_70B: 'llama-3.3-70b-versatile',
    GROQ_LLAMA_8B: 'llama-3.1-8b-instant',
    GROQ_QWEN_32B: 'qwen/qwen3-32b',
    GROQ_LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    OPENROUTER_MODEL: 'openrouter/free', // Free model router
    CEREBRAS_MODEL: 'llama3.1-8b' // Ultra-fast inference (Verified ID)
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
            // Find the first value that is an array
            const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayKey) {
                parsed = parsed[arrayKey];
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
async function callOpenRouter(prompt, jsonMode = false) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_OPENROUTER_API_KEY_HERE") {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

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
            temperature: 0.1,
            max_tokens: 8000 // Ensure deep, exhaustive responses (2200+ tokens) without truncation
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenRouter API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Helper to call Groq API (OpenAI compatible)
 */
async function callGroq(prompt, jsonMode = false, model = MODELS.GROQ_LLAMA_70B) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_GROQ_API_KEY_HERE") {
        throw new Error("GROQ_API_KEY is not configured");
    }

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
            temperature: 0.1,
            max_tokens: 8000 // Allow for exhaustive 2200+ token content without truncation
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Groq API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Helper to call Cerebras API (OpenAI compatible)
 */
async function callCerebras(prompt, jsonMode = false) {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_CEREBRAS_API_KEY_HERE") {
        throw new Error("CEREBRAS_API_KEY is not configured");
    }

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
            temperature: 0.1,
            max_tokens: 8000 // Support massive verbosity (2200+ tokens) without truncation
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Cerebras API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Generate quiz using Gemini. Mimics quiz_generator.py logic but with actual AI.
 */
const generateQuiz = async (title, description, url = null, intuitionText = null, numQuestions = 15) => {
    const quizPrompt = `
      Act as an expert educator. Based ONLY on the following video/playlist info and specifically the provided "AI Intuition Summary", generate a highly comprehensive quiz with BETWEEN 15 and 20 multiple-choice questions (STRICTLY AT MOST 20). 
      
      It is absolutely critical that every single question is directly derived from the concepts explained in the "AI Intuition Summary" below. Do not use external knowledge that contradicts or is not mentioned in the summary.
      
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

    // Priority Strategy for Speed (<15s): Cerebras -> Groq (70B) -> Groq (8B) -> Gemini 2.5 -> Gemini 3 -> OpenRouter
    const chain = [
        { type: 'cerebras' },
        { type: 'groq', model: MODELS.GROQ_LLAMA_70B },
        { type: 'groq', model: MODELS.GROQ_LLAMA_8B },
        { type: 'gemini', model: MODELS.GEMINI_2_5 },
        { type: 'gemini', model: MODELS.GEMINI_3 },
        { type: 'groq', model: MODELS.GROQ_QWEN_32B },
        { type: 'openrouter' },
        { type: 'gemini', model: MODELS.GEMINI_2_5_LITE }
    ];

    for (const provider of chain) {
        try {
            console.log(`[Quiz] Attempting with ${provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : provider.model)}...`);
            let text;
            if (provider.type === 'gemini') {
                const model = genAI.getGenerativeModel({
                    model: provider.model,
                    generationConfig: {
                        responseMimeType: "application/json",
                        maxOutputTokens: 2000
                    }
                });
                const result = await model.generateContent(quizPrompt);
                text = (await result.response).text();
            } else if (provider.type === 'groq') {
                text = await callGroq(quizPrompt, true, provider.model);
            } else if (provider.type === 'cerebras') {
                text = await callCerebras(quizPrompt, true);
            } else if (provider.type === 'openrouter') {
                text = await callOpenRouter(quizPrompt, true);
            }

            return {
                questions: cleanAIJSON(text),
                isFallback: provider.model !== MODELS.GEMINI_2_5,
                isSystemFallback: false
            };
        } catch (error) {
            console.warn(`[Quiz] ${provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : provider.model)} failed:`, error.message);
            if (provider === chain[chain.length - 1]) throw error; // Re-throw if last in chain
        }
    }
};

/**
 * Generate intuition/summary using the actual video transcript as the primary source.
 * Falls back to title+description if transcript is unavailable.
 */
const generateIntuition = async (title, description, url = null, targetLanguage = null) => {
    // --- STEP 1: Fetch the real transcript ---
    const transcriptResult = await fetchTranscript(url);
    const hasTranscript = !!(!transcriptResult.isFallback && transcriptResult.transcript);
    const detectedLanguage = transcriptResult.language || 'English';
    const finalLanguage = targetLanguage || detectedLanguage;


    if (hasTranscript) {
        console.log(`[Intuition] Real transcript fetched (${transcriptResult.transcript.length} chars, language: ${detectedLanguage})`);
    } else {
        console.warn(`[Intuition] Transcript unavailable (${transcriptResult.reason}). Falling back to title+description.`);
    }

    // --- STEP 2: Build the prompt with transcript as primary source ---
    const transcriptSection = hasTranscript
        ? `
=== ACTUAL VIDEO TRANSCRIPT (PRIMARY SOURCE — use this as the ground truth for all content) ===
${transcriptResult.transcript}
=== END OF TRASNRIPT ===

IMPORTANT LANGUAGE INSTRUCTION: You MUST write your entire response in ${finalLanguage}.
Even though the transcript is in ${detectedLanguage}, the user wants the final explanation in ${finalLanguage}.
Do NOT translate names of core concepts if they are standardized, but explain everything else in ${finalLanguage}.
`
        : `
(No transcript available. Generate intuition based on the video title and description below in ${finalLanguage}. 
IMPORTANT: Use ONLY information that can be inferred from the title and description.)
`;

    const intuitionPrompt = `
        Act as an expert, highly engaging educational tutor.
        Provide an EXTREMELY COMPREHENSIVE and exhaustive intuition and breakdown of the core concepts covered in this video.
        
        Video Title: '${title}'
        Video URL: '${url || 'Not provided'}'
        Video Description: '${description}'
        ${transcriptSection}
        Format your response in beautiful, highly readable markdown. It is CRITICAL that you are detailed and educational.
        
        Go in-depth and break it down exactly into these clean headings:
        ### 🎯 Core Concept
        (Instruction: Provide an extremely detailed, exhaustive overview of what this video actually teaches - Minimum 500 words)
        
        ### 💡 Key Takeaways
        (Instruction: Provide an exhaustive list of concepts ACTUALLY covered - Minimum 10 points with deep explanations of each)
        
        ### 🧠 Why This Matters
        (Instruction: Provide deep intuition, philosophy, and real-world application - Minimum 400 words)
        
        ### 📚 Deep Dive
        (Instruction: Walk through the content progressively as explained in the video - Minimum 800 words)
        
        ### 🛠️ Practical Examples
        (Instruction: Provide concrete examples, scenarios, or code snippets from the video - Minimum 400 words)
        
        Make sure the explanation is illuminating and leaves absolutely no stone unturned. Quantity AND Quality are paramount. 
        IMPORTANT: Your entire response MUST be in ${finalLanguage}.
      `;

    // Master English generation uses Cerebras first for maximum speed.
    // This master is then translated cheaply via Google Translate.
    const chain = hasTranscript
        ? [
            { type: 'cerebras' },
            { type: 'gemini', model: MODELS.GEMINI_2_5 },
            { type: 'gemini', model: MODELS.GEMINI_3 },
            { type: 'groq', model: MODELS.GROQ_LLAMA_70B },
            { type: 'openrouter' }
          ]
        : [
            { type: 'cerebras' },
            { type: 'groq', model: MODELS.GROQ_LLAMA_70B },
            { type: 'gemini', model: MODELS.GEMINI_2_5 },
            { type: 'openrouter' }
          ];

    for (const provider of chain) {
        try {
            console.log(`[Intuition] Attempting with ${provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : provider.model)}...`);
            let text;
            if (provider.type === 'gemini') {
                const model = genAI.getGenerativeModel({
                    model: provider.model,
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                });
                const result = await model.generateContent(intuitionPrompt);
                text = (await result.response).text();
            } else if (provider.type === 'groq') {
                text = await callGroq(intuitionPrompt, false, provider.model);
            } else if (provider.type === 'cerebras') {
                text = await callCerebras(intuitionPrompt);
            } else if (provider.type === 'openrouter') {
                text = await callOpenRouter(intuitionPrompt);
            }

            return {
                content: text,
                isFallback: provider.model !== MODELS.GEMINI_2_5,
                isSystemFallback: false,
                transcript_used: hasTranscript,
                model_name: provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : (provider.type === 'groq' ? provider.model : (provider.type === 'openrouter' ? MODELS.OPENROUTER_MODEL : provider.model))
            };
        } catch (error) {
            console.warn(`[Intuition] ${provider.type === 'groq' ? provider.model : (provider.type === 'cerebras' ? MODELS.CEREBRAS_MODEL : provider.model)} failed:`, error.message);
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
        return { content: res.text, model_name: 'Free Google Translate' };
    } catch (err) {
        console.warn(`[Translate] Free Google Translate failed, falling back to Cerebras/Groq:`, err.message);
        
        // --- FALLBACK: Use LLM as backup if free service is blocked/down ---
        const translationPrompt = `
            You are a professional translator. Translate this exactly into ${targetLanguage}.
            Maintain all markdown formatting.
            
            TEXT:
            ${text}
        `;

        try {
            const translated = await callCerebras(translationPrompt);
            return { content: translated, model_name: `${MODELS.CEREBRAS_MODEL} (LLM Fallback)` };
        } catch (llmErr) {
            const translated = await callGroq(translationPrompt, false, MODELS.GROQ_LLAMA_70B);
            return { content: translated, model_name: `${MODELS.GROQ_LLAMA_70B} (LLM Fallback)` };
        }
    }
};

/**
 * Benchmark all available models for a given title and description.
 */
const benchmarkAllModels = async (title, description, url = null) => {
    const intuitionPrompt = `
        Act as an expert, highly engaging educational tutor.
        Provide a maximally comprehensive and exhaustive intuition and breakdown of the core concepts for the video.
        
        Title: '${title}'
        URL: '${url || 'Not provided'}'
        Description: '${description}'.
        
        Format your response in markdown with these headings. You MUST be extremely detailed and verbose (aim for a high-quality depth of ~1500-2000 words total):
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
                const model = genAI.getGenerativeModel({ model: p.model, generationConfig: { maxOutputTokens: 8192 } });
                const result = await model.generateContent(intuitionPrompt);
                text = (await result.response).text();
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
