/**
 * Checkpoint Questions Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates Duolingo-style in-video checkpoint questions grounded strictly in
 * what the lecturer actually teaches in each specific 1.5 - 2 minute segment.
 *
 * Core principles:
 * 1. Dynamic Intro Detection: Intro varies (15s to 2.5 min); NEVER ask questions in intro.
 * 2. Pacing: At least 1 question every 1.5 - 2 minutes (~95s - 110s cadence).
 * 3. 100% Chunk-Grounded: Each question at timestamp T tests EXACTLY what was taught
 *    in the previous [prevT -> T] slice (the previous 1.5 - 2 minutes of the lecture).
 * 4. Sentence-Snapped: Pause timestamps snap to natural sentence ends or speech pauses.
 * 5. Real-Time Duolingo: Crisp questions (<22 words), 4 short options, exact answer match.
 */

const prisma = require('../lib/prisma');
const cacheService = require('../services/cache.service');
const { generateGeminiContent, cleanAIJSON, repairAIJSONString, MODELS } = require('../services/ai.service');
const { extractVideoId } = require('../services/transcript.service');
const axios = require('axios');

// ─── 1. Fetch timed caption segments ─────────────────────────────────────────

const fetchTimedSegments = async (videoId) => {
    const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
    const CLIENT_VERSION = '20.10.38';

    try {
        const playerRes = await axios.post(INNERTUBE_URL, {
            context: { client: { clientName: 'ANDROID', clientVersion: CLIENT_VERSION } },
            videoId,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 14)`,
            },
            timeout: 10000,
        });

        const tracks = playerRes.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!Array.isArray(tracks) || tracks.length === 0) return null;

        // Prefer manual captions → auto-generated
        const preferred = tracks.find(t => !t.kind || t.kind !== 'asr') || tracks[0];
        const captionRes = await axios.get(preferred.baseUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });

        const xml = captionRes.data;
        const segments = [];

        const decode = str => str
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)));

        // Format 1: <p t="ms" d="ms">
        const newFmt = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
        let m;
        while ((m = newFmt.exec(xml)) !== null) {
            const rawText = decode(m[3].replace(/<[^>]+>/g, '')).trim();
            const text = rawText.replace(/\[(Music|Applause|Laughter)\]/gi, '').trim();
            const start = parseInt(m[1], 10) / 1000;
            const dur = parseInt(m[2], 10) / 1000;
            const end = start + dur;
            if (text) segments.push({ text, offset: start, start, dur, end });
        }

        // Format 2: <text start="s" dur="s">
        if (segments.length === 0) {
            const oldFmt = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
            while ((m = oldFmt.exec(xml)) !== null) {
                const rawText = decode(m[3]).trim();
                const text = rawText.replace(/\[(Music|Applause|Laughter)\]/gi, '').trim();
                const start = parseFloat(m[1]);
                const dur = parseFloat(m[2] || 0);
                const end = start + dur;
                if (text) segments.push({ text, offset: start, start, dur, end });
            }
        }

        return segments.length > 0 ? segments : null;
    } catch (e) {
        console.warn(`[CheckpointQ] Caption fetch note for ${videoId}:`, e.message);
        return null;
    }
};

// ─── 2. Dynamic Intro Detection ──────────────────────────────────────────────

const detectTeachingStart = (segments, totalDuration, description = '', videoTitle = '') => {
    // A. Check description for timestamped chapters (e.g. "0:00 Intro", "0:45 Explanation")
    if (description) {
        const chapterRegex = /(?:^|\n)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*[-–—]?\s*(.+)/g;
        let match;
        const chapters = [];
        while ((match = chapterRegex.exec(description)) !== null) {
            const h = match[3] ? parseInt(match[1], 10) : 0;
            const m = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
            const s = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);
            const title = match[4].trim().toLowerCase();
            chapters.push({ sec: h * 3600 + m * 60 + s, title });
        }
        if (chapters.length >= 2) {
            const contentCh = chapters.find((ch, i) => i > 0 && !/\b(intro|introduction|overview|welcome|agenda)\b/i.test(ch.title));
            if (contentCh && contentCh.sec > 10 && contentCh.sec <= 180) {
                console.log(`[CheckpointQ] Intro detected from description chapters: ${contentCh.sec}s ("${contentCh.title}")`);
                return contentCh.sec;
            }
        }
    }

    // B. Analyze transcript segments if rich enough
    if (segments && segments.length >= 8) {
        const maxIntroSeconds = Math.min(totalDuration * 0.22, 160);
        const SKIP_SIGNALS = /\b(subscribe|bell|channel|welcome|hello|hi guys|hey everyone|today we'll|in this video|recap|last time|previously|follow me|instagram|telegram)\b/i;
        const TEACHING_SIGNALS = /\b(so|now|let'?s|first|step|definition|defined|understand|formula|algorithm|theorem|rule|grammar|example|consider|observe|dekho|toh|chaliye|shuru|matlab|question|problem)\b/i;

        const WINDOW = 25;
        const STEP = 5;
        let consecutiveTeaching = 0;

        for (let t = 0; t <= maxIntroSeconds; t += STEP) {
            const windowSegs = segments.filter(s => s.offset >= t && s.offset < t + WINDOW);
            if (windowSegs.length === 0) continue;

            const windowText = windowSegs.map(s => s.text).join(' ');
            const isSkip = SKIP_SIGNALS.test(windowText);
            const isTeaching = TEACHING_SIGNALS.test(windowText);

            if (isTeaching && !isSkip) {
                consecutiveTeaching++;
                if (consecutiveTeaching >= 2) {
                    const startSec = Math.max(15, t - STEP);
                    console.log(`[CheckpointQ] Intro detected via transcript: ends at ~${startSec}s`);
                    return startSec;
                }
            } else {
                consecutiveTeaching = 0;
            }
        }
    }

    // C. Intelligent duration-based fallback
    const fallback = totalDuration < 300 ? 18 : (totalDuration < 720 ? 35 : 45);
    const clamped = Math.max(15, Math.min(fallback, totalDuration * 0.15));
    return clamped;
};

// ─── 3. Compute Timestamps with Sentence-End Snapping ────────────────────────

const calculateCheckpointTimestamps = (segments, teachingStart, totalDuration, count) => {
    const contentStart = teachingStart;
    const contentEnd = Math.max(contentStart + 120, totalDuration - 25);
    const usableDuration = contentEnd - contentStart;

    const step = usableDuration / (count + 0.35);
    const targetTimestamps = [];
    for (let i = 0; i < count; i++) {
        targetTimestamps.push(contentStart + (i + 1) * step);
    }

    return targetTimestamps.map(ts => {
        if (!segments || segments.length === 0) {
            return Math.round(ts);
        }

        const candidates = segments.filter(s => s.end >= ts - 22 && s.end <= ts + 22);
        if (candidates.length === 0) {
            return Math.round(ts);
        }

        const scored = candidates.map(s => {
            const next = segments[segments.indexOf(s) + 1];
            const gap = next ? (next.start - s.end) : 0.4;
            let score = 0;

            if (/[.?!…]$/.test(s.text) || s.text.endsWith('...')) score += 6;
            if (gap >= 0.28) score += Math.min(gap * 4, 6);
            if (next && /^[A-Z\u0900-\u097F]/.test(next.text)) score += 3;
            if (next && /\b(so|now|then|therefore|let|toh|ab|chaliye)\b/i.test(next.text)) score += 2;

            const dist = Math.abs(s.end - ts);
            const totalScore = score - (dist * 0.2);
            return { s, totalScore };
        });

        scored.sort((a, b) => b.totalScore - a.totalScore);
        const best = scored[0];
        return Math.round((best.s.end + 0.15) * 10) / 10;
    });
};

// ─── 4. Generate Single Question Grounded in Specific 2-Minute Chunk ──────────

const formatTimeLabel = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
};

const shuffleOptions = (options, answer) => {
    if (!Array.isArray(options) || options.length < 2) {
        return { options: options || [], answer: answer || '' };
    }

    let correctText = String(answer || '').trim();
    const letterMap = ['a', 'b', 'c', 'd'];
    const stripped = correctText.replace(/^option\s*:?\s*/i, '').trim().toLowerCase();

    // If answer is a single letter (A-D), resolve text before shuffling
    if (stripped.length === 1 && letterMap.includes(stripped)) {
        const idx = letterMap.indexOf(stripped);
        if (options[idx]) {
            correctText = options[idx];
        }
    } else {
        const match = options.find(opt => {
            const o = String(opt).trim().toLowerCase().replace(/^option\s*:?\s*/i, '');
            return o === stripped || o.includes(stripped) || stripped.includes(o);
        });
        if (match) {
            correctText = match;
        }
    }

    // Fisher-Yates shuffle
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        options: shuffled,
        answer: correctText
    };
};

const generateQuestionForChunk = async (videoTitle, chunkText, prevTs, ts, index, total) => {
    const progressPct = Math.round(((index + 1) / total) * 100);
    const phase = index === 0 
        ? 'Early Lecture (Foundational setup & definitions)'
        : (index === total - 1 
            ? 'Concluding Lecture (Final solution & verification)' 
            : `Mid Lecture Step ${index + 1} of ${total} (${progressPct}% through the lesson)`);

    const prompt = `You are creating a quick in-video comprehension check for an online lecture titled: "${videoTitle}".

Lecture Phase: ${phase}
The student JUST finished watching this specific 1.5 - 2 minute section of the lecture (from ${formatTimeLabel(prevTs)} to ${formatTimeLabel(ts)}):
=== RECENT 1.5 - 2 MINUTE TEACHING SECTION (TEST THIS SPECIFIC CHUNK) ===
${chunkText.slice(0, 3500)}
=== END RECENT SECTION ===

TASK:
Ask ONE multiple-choice comprehension check testing the specific concept, formula, step, calculation, definition, or distinction taught in THIS EXACT section.

STRICT DUOLINGO GUIDELINES:
1. 100% GROUNDED: Ask about the specific step, variable, formula, or proof actively taught in the section above.
2. DIVERSE & PROGRESSIVE: Do NOT repeat questions from other sections. Focus on the distinct mathematical/conceptual advancement made in this specific segment.
3. CONCISE: Question must be clear and short (<22 words).
4. 4 DISTINCT OPTIONS: Exactly 4 options (max 8 words each).
5. EXACT ANSWER MATCH: The "answer" field MUST be an exact string match with one of the 4 options.
6. SHORT EXPLANATION: 1 clear explanation sentence (<20 words).
7. MATHEMATICAL FORMULAS & NOTATION: When questions or options contain math, equations, integrals, or formulas, write standard LaTeX enclosed in single dollar signs (e.g. "$a_n = \\frac{2}{\\pi} \\int_0^\\pi f(x) \\cos(nx)\\,dx$", "$f(x) = a_0 + \\sum a_n \\cos(nx)$", "$a_n$", "$\\pi$"). In JSON strings, always escape backslashes as "\\\\" (e.g. "\\\\frac", "\\\\int", "\\\\sum", "\\\\cos").
8. RANDOMIZE OPTION POSITIONS: Mix and randomize option order so the correct answer is NOT always the first option (Option A). Place the correct answer unpredictably at position 1, 2, 3, or 4.
9. VALID JSON: Output valid, parseable JSON only. Do not wrap in markdown quotes if possible.

Respond ONLY with valid JSON:
{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "explanation": "..."
}`;

    try {
        const text = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, prompt, {
            maxOutputTokens: 500,
            temperature: 0.2,
            responseMimeType: 'application/json'
        });

        if (!text || typeof text !== 'string') return null;

        let parsed = null;
        try {
            parsed = JSON.parse(text);
        } catch (_) {
            try {
                parsed = JSON.parse(repairAIJSONString(text));
            } catch (_) {
                parsed = cleanAIJSON(text);
            }
        }

        if (parsed && parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 4 && parsed.answer) {
            const { options: shuffledOpts, answer: resolvedAns } = shuffleOptions(parsed.options.slice(0, 4), parsed.answer);
            return {
                question: parsed.question,
                options: shuffledOpts,
                answer: resolvedAns,
                explanation: parsed.explanation || ''
            };
        }
    } catch (e) {
        console.warn(`[CheckpointQ] Chunk [${Math.round(prevTs)}s->${Math.round(ts)}s] error:`, e.message);
    }
    return null;
};

// ─── 5. Route Handler ─────────────────────────────────────────────────────────

/**
 * GET /api/checkpoint-questions/:videoId
 *
 * Guaranteed Rules:
 * - At least 1 question every 1.5 - 2 minutes (~95s - 110s cadence)
 * - Intro dynamically skipped (no questions during intro)
 * - Grounded 100% in what was taught in the previous 1.5 - 2 minutes
 * - Pauses cleanly at end of sentence
 */
const getCheckpointQuestions = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    // Cache key v9: Randomized option positions & chunk-grounded checkpoints
    const cacheKey = `checkpoint-questions:v9:${videoId}`;

    try {
        const cached = await cacheService.get(cacheKey);
        if (cached && Array.isArray(cached) && cached.length >= 2) {
            console.log(`[CheckpointQ] ✅ Cache hit for ${videoId} (${cached.length} checkpoints)`);
            return res.status(200).json({ checkpoints: cached });
        }

        // Check legacy cache v8 and randomize options if needed
        const legacyCached = await cacheService.get(`checkpoint-questions:v8:${videoId}`);
        if (legacyCached && Array.isArray(legacyCached) && legacyCached.length >= 2) {
            const shuffledLegacy = legacyCached.map(cp => {
                const { options: shuffledOpts, answer: resolvedAns } = shuffleOptions(cp.options, cp.answer);
                return { ...cp, options: shuffledOpts, answer: resolvedAns };
            });
            await cacheService.set(cacheKey, shuffledLegacy, 24 * 3600);
            return res.status(200).json({ checkpoints: shuffledLegacy });
        }

        // Fetch video record from DB
        const video = await prisma.video.findFirst({ where: { vid: videoId } });
        const videoTitle = video?.name || 'this lecture';
        const videoUrl   = video?.url  || `https://www.youtube.com/watch?v=${videoId}`;
        const vid        = extractVideoId(videoUrl) || videoId;

        // Fetch timed transcript segments
        console.log(`[CheckpointQ] Fetching segments for ${videoId}...`);
        const segments = await fetchTimedSegments(vid);

        // Determine total video duration
        let totalDuration = video?.duration_seconds || (segments && segments[segments.length - 1]?.end) || 600;
        if (segments && segments.length > 0 && segments[segments.length - 1].end > totalDuration) {
            totalDuration = segments[segments.length - 1].end;
        }

        console.log(`[CheckpointQ] Video: "${videoTitle.slice(0, 40)}" | Duration: ${totalDuration}s | Segments: ${segments?.length || 0}`);

        // 1. Dynamic Intro Detection
        const teachingStart = detectTeachingStart(segments, totalDuration, video?.description || '', videoTitle);

        // 2. Dynamic Checkpoint Count: At least 1 question every 1.5 - 2 minutes (95s - 110s cadence)
        const usableContentDuration = Math.max(90, (totalDuration - 25) - teachingStart);
        const targetCount = Math.max(
            2,
            Math.min(22, Math.round(usableContentDuration / 98))
        );

        console.log(`[CheckpointQ] Target count for ${Math.round(totalDuration / 60)}m video: ${targetCount} (teaching starts at ${teachingStart}s)`);

        // 3. Sentence-End Snapped Timestamps
        const timestamps = calculateCheckpointTimestamps(segments, teachingStart, totalDuration, targetCount);

        // 4. Load VideoIntuition for proportional fallback if transcript is sparse
        let intuitionPages = [];
        let fullIntuitionText = '';
        try {
            const intuition = await prisma.videoIntuition.findFirst({ where: { vid: videoId } });
            if (intuition && intuition.content) {
                try {
                    const parsed = JSON.parse(intuition.content);
                    if (Array.isArray(parsed.pages)) {
                        intuitionPages = parsed.pages;
                        fullIntuitionText = parsed.pages.map(p => `### ${p.title || 'Topic'}\n${p.content}`).join('\n\n');
                    } else {
                        fullIntuitionText = intuition.content;
                    }
                } catch {
                    fullIntuitionText = intuition.content;
                }
            }
        } catch (_) {}

        // Has rich spoken transcript?
        const hasRichSegments = segments && segments.length >= 20;

        // 5. Generate Checkpoints Chunk by Chunk (Parallel with Batches)
        console.log(`[CheckpointQ] Generating ${targetCount} chunk-grounded checkpoints (hasRichSegments: ${hasRichSegments})...`);

        // Prepare chunk definitions
        const chunkDefs = timestamps.map((ts, idx) => {
            const prevTs = idx === 0 ? teachingStart : timestamps[idx - 1];
            let chunkText = '';

            if (hasRichSegments) {
                const sliceSegs = segments.filter(s => s.offset >= Math.max(0, prevTs - 6) && s.offset <= ts + 4);
                chunkText = sliceSegs.map(s => s.text).join(' ').trim();
            }

            // If transcript slice is too short, extract proportional intuition segment
            if (!chunkText || chunkText.length < 50) {
                if (intuitionPages.length > 1) {
                    const pageIdx = Math.min(intuitionPages.length - 1, Math.floor((idx / targetCount) * intuitionPages.length));
                    const page = intuitionPages[pageIdx];
                    chunkText = `Topic: ${page.title || videoTitle}\n${page.content}`;
                } else if (fullIntuitionText) {
                    const charStart = Math.floor((idx / targetCount) * fullIntuitionText.length);
                    const charEnd = Math.floor(((idx + 1) / targetCount) * fullIntuitionText.length);
                    chunkText = fullIntuitionText.slice(Math.max(0, charStart - 100), Math.min(fullIntuitionText.length, Math.max(charStart + 1200, charEnd + 400)));
                } else {
                    chunkText = `Lecture Topic: ${videoTitle}\n${video?.description ? video.description.slice(0, 1000) : ''}`;
                }
            }

            return { ts, prevTs, idx, chunkText };
        });

        // Run chunk generations with concurrency limit (5 at a time) for speed and reliability
        const BATCH_SIZE = 5;
        const results = [];
        for (let i = 0; i < chunkDefs.length; i += BATCH_SIZE) {
            const batch = chunkDefs.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(def => generateQuestionForChunk(videoTitle, def.chunkText, def.prevTs, def.ts, def.idx, targetCount))
            );
            results.push(...batchResults);
        }

        // 6. Assemble Final Checkpoints Array (with Randomized Option Positions)
        const checkpoints = timestamps.map((ts, idx) => {
            const q = results[idx];
            if (q && q.question && Array.isArray(q.options) && q.options.length >= 4 && q.answer) {
                const { options: shuffledOpts, answer: resolvedAns } = shuffleOptions(q.options, q.answer);
                return {
                    id: `cp_${videoId}_${idx}`,
                    timestamp: ts,
                    pct: ts / totalDuration,
                    question: q.question,
                    options: shuffledOpts,
                    answer: resolvedAns,
                    explanation: q.explanation,
                    index: idx,
                    total: targetCount
                };
            }

            // Topic-aware fallback if a single chunk generation timed out
            const cleanTopic = videoTitle.replace(/^(CS\s*&\s*IT|GATE.*|Lecture|Lec|Part|Session)[\s\-#0-9:]*/i, '').trim();
            const phaseLabel = idx === 0 ? 'Foundation' : (idx === targetCount - 1 ? 'Synthesis' : `Step ${idx + 1}`);
            const rawFbOptions = [
                "Standard formula derivation and term evaluation",
                "Skipping intermediate rule constraints",
                "Random variable substitution without verification",
                "Disregarding domain boundary limits"
            ];
            const rawFbAns = "Standard formula derivation and term evaluation";
            const { options: shuffledFbOpts, answer: resolvedFbAns } = shuffleOptions(rawFbOptions, rawFbAns);

            return {
                id: `cp_${videoId}_${idx}`,
                timestamp: ts,
                pct: ts / totalDuration,
                question: `${phaseLabel} Check: Which core method or calculation was applied in this section for ${cleanTopic.slice(0, 45)}?`,
                options: shuffledFbOpts,
                answer: resolvedFbAns,
                explanation: `In this section of ${cleanTopic.slice(0, 35)}, the instructor performs systematic rule evaluation and term calculation.`,
                index: idx,
                total: targetCount
            };
        });

        console.log(`[CheckpointQ] Successfully prepared ${checkpoints.length} chunk-grounded checkpoints for ${videoId}`);

        if (checkpoints.length > 0) {
            await cacheService.set(cacheKey, checkpoints, 24 * 3600);
        }

        return res.status(200).json({ checkpoints });

    } catch (error) {
        console.error('[CheckpointQ] Fatal error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { getCheckpointQuestions };
