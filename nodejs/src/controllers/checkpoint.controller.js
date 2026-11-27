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

const normalizeQuestion = (question) =>
    String(question || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u0900-\u097f]+/g, ' ')
        .trim();

const GENERIC_QUESTION = /foundational formula|core method or calculation|calculation rule was applied|domain limits or terms|primary analytical outcome|standard formula derivation|standard analytical formula/i;

const isGenericQuestion = (question) => GENERIC_QUESTION.test(String(question || ''));

const questionsTooSimilar = (a, b) => {
    const na = normalizeQuestion(a);
    const nb = normalizeQuestion(b);
    if (!na || !nb) return false;
    if (na === nb || na.slice(0, 42) === nb.slice(0, 42)) return true;
    const words = (text) => new Set(text.split(' ').filter((word) => word.length > 3));
    const left = words(na);
    const right = words(nb);
    if (left.size < 4 || right.size < 4) return false;
    let shared = 0;
    left.forEach((word) => {
        if (right.has(word)) shared += 1;
    });
    return shared / Math.min(left.size, right.size) >= 0.72;
};

const parseQuestionJson = (text) => {
    if (!text || typeof text !== 'string') return null;
    try {
        return JSON.parse(text);
    } catch (_) {
        try {
            return JSON.parse(repairAIJSONString(text));
        } catch (_) {
            return cleanAIJSON(text);
        }
    }
};

const acceptQuestion = (parsed) => {
    if (!parsed?.question || !Array.isArray(parsed.options) || parsed.options.length < 4 || !parsed.answer) return null;
    if (isGenericQuestion(parsed.question)) return null;
    const { options, answer } = shuffleOptions(parsed.options.slice(0, 4), parsed.answer);
    if (!options.includes(answer)) return null;
    return {
        question: String(parsed.question).trim(),
        options,
        answer,
        explanation: parsed.explanation || ''
    };
};

const generateQuestionsForSlices = async (videoTitle, defs, alreadyAsked) => {
    const slices = defs.map((def) => {
        const spoken = def.chunkText.length > 2200 ? def.chunkText.slice(-2200) : def.chunkText;
        return `SLICE ${def.idx} — student has watched up to ${formatTimeLabel(def.ts)} (this check covers ${formatTimeLabel(def.prevTs)} to ${formatTimeLabel(def.ts)} only):\n${spoken}`;
    }).join('\n\n');

    const forbidden = alreadyAsked.length
        ? `Already asked. Do not repeat or rephrase any of these:\n${alreadyAsked.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
        : 'No questions have been asked yet.';

    const prompt = `You write in-video checks for the lecture "${videoTitle}".

Each slice below is the exact speech the student just watched, and nothing after that timestamp.
${forbidden}

${slices}

For every slice, write ONE multiple-choice question that a student can answer only from that slice.
The question must check a specific fact, term, step, number, name, definition, or distinction that was actually said in that slice.
Do not ask about the lecture title in general. Do not ask what "might" have been taught. Do not reuse the same fact across slices.

Rules:
- Question under 22 words.
- Exactly 4 options, each under 10 words, and all different.
- "answer" must be copied exactly from one option.
- Put the correct option in a different position for each question.
- One-sentence explanation under 20 words, using only that slice.
- Math uses $...$ LaTeX with braces, never glued scripts. Write $0^{i}1^{j}0^{k}$, not 0^i_1^j_0^k. Escape backslashes in JSON as \\\\.
- Return one object per slice, using that slice's index. Skip a slice only if it has no teachable fact.

Respond ONLY with JSON:
{"questions":[{"index":0,"question":"...","options":["...","...","...","..."],"answer":"...","explanation":"..."}]}`;

    try {
        const text = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, prompt, {
            maxOutputTokens: 1800,
            temperature: 0.4,
            responseMimeType: 'application/json'
        });

        const parsed = parseQuestionJson(text);
        const list = Array.isArray(parsed?.questions) ? parsed.questions : [];
        const byIndex = new Map();
        list.forEach((item, position) => {
            const accepted = acceptQuestion(item);
            if (!accepted) return;
            const index = defs.some((def) => def.idx === item.index)
                ? item.index
                : defs[position]?.idx;
            if (index !== undefined && !byIndex.has(index)) byIndex.set(index, accepted);
        });
        return byIndex;
    } catch (e) {
        console.warn(`[CheckpointQ] Slice batch error:`, e.message);
        return new Map();
    }
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

    // Cache key v10: questions come only from the transcript watched up to each pause.
    const cacheKey = `checkpoint-questions:v10:${videoId}`;

    try {
        const cached = await cacheService.get(cacheKey);
        const cachedIsUsable = Array.isArray(cached)
            && cached.length >= 1
            && cached.every((cp) => cp?.question && !isGenericQuestion(cp.question));
        if (cachedIsUsable) {
            console.log(`[CheckpointQ] ✅ Cache hit for ${videoId} (${cached.length} checkpoints)`);
            return res.status(200).json({ checkpoints: cached });
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

        // 4. Each check uses only the speech from the previous pause up to this one.
        const seenQuestions = [];
        const chunkDefs = [];
        let previousTs = teachingStart;
        timestamps.forEach((ts) => {
            if (ts - previousTs < 70) return;
            const sliceSegs = (segments || []).filter((s) => s.offset >= previousTs && s.offset <= ts);
            const chunkText = sliceSegs.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim();
            if (chunkText.length < 80) return;
            chunkDefs.push({ ts, prevTs: previousTs, idx: chunkDefs.length, chunkText });
            previousTs = ts;
        });

        console.log(`[CheckpointQ] Generating ${chunkDefs.length} checks from watched transcript slices...`);

        const BATCH_SIZE = 4;
        const questionsByIndex = new Map();
        for (let i = 0; i < chunkDefs.length; i += BATCH_SIZE) {
            const batch = chunkDefs.slice(i, i + BATCH_SIZE);
            const batchQuestions = await generateQuestionsForSlices(videoTitle, batch, seenQuestions);
            batch.forEach((def) => {
                const question = batchQuestions.get(def.idx);
                if (!question) return;
                const repeated = seenQuestions.some((asked) => questionsTooSimilar(asked, question.question));
                if (repeated) return;
                questionsByIndex.set(def.idx, question);
                seenQuestions.push(question.question);
            });
        }

        // 5. Keep only checks that are about the slice the student just watched.
        const checkpoints = chunkDefs.flatMap((def) => {
            const question = questionsByIndex.get(def.idx);
            if (!question) return [];
            return [{
                id: `cp_${videoId}_${def.idx}`,
                timestamp: def.ts,
                pct: def.ts / totalDuration,
                question: question.question,
                options: question.options,
                answer: question.answer,
                explanation: question.explanation,
                index: def.idx,
                total: questionsByIndex.size
            }];
        }).map((cp, idx, all) => ({ ...cp, index: idx, total: all.length }));

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
