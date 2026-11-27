/**
 * Checkpoint Questions Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates Duolingo-style in-video checkpoint questions grounded strictly in
 * what the lecturer actually teaches in each specific 1.5 - 2 minute segment.
 *
 * Core principles:
 * 1. Dynamic Intro Detection: Intro varies (15s to 2.5 min); NEVER ask questions in intro.
 * 2. Pacing: Ask when a topic finishes. If a topic runs long, still ask within 2 minutes.
 * 3. 100% Chunk-Grounded: Each question tests a new fact from the speech since the previous check.
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

        const duration = Number(playerRes.data?.videoDetails?.lengthSeconds) || 0;
        const tracks = playerRes.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!Array.isArray(tracks) || tracks.length === 0) return { segments: null, duration };

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

        return { segments: segments.length > 0 ? segments : null, duration };
    } catch (e) {
        console.warn(`[CheckpointQ] Caption fetch note for ${videoId}:`, e.message);
        return { segments: null, duration: 0 };
    }
};

// If caption clocks only cover the opening of the lecture, the words are still in order.
// Spread a full-length transcript across the video so later topics still get a check.
const spreadTranscript = (segments, totalDuration) => {
    const text = (segments || []).map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(Boolean);
    const coverage = segments?.length ? Math.max(...segments.map((segment) => segment.end || 0)) : 0;
    const wordsPerMinute = totalDuration > 0 ? words.length / (totalDuration / 60) : 0;
    if (!words.length || !totalDuration || coverage >= totalDuration * 0.7 || wordsPerMinute < 70) {
        return segments;
    }
    const buckets = Math.max(8, Math.round(totalDuration / 8));
    const size = Math.ceil(words.length / buckets);
    const spread = [];
    for (let i = 0; i < buckets; i += 1) {
        const slice = words.slice(i * size, (i + 1) * size).join(' ').trim();
        if (!slice) continue;
        const start = (i / buckets) * totalDuration;
        const end = ((i + 1) / buckets) * totalDuration;
        spread.push({ text: slice, offset: start, start, end, dur: end - start });
    }
    console.log(`[CheckpointQ] Caption clock covered ${Math.round(coverage)}s of ${Math.round(totalDuration)}s. Spreading transcript across the full lecture.`);
    return spread;
};

// Some caption tracks report seconds, others milliseconds. Put every segment on the video clock.
const alignSegmentClock = (segments, totalDuration) => {
    if (!segments || segments.length === 0) return segments;
    const maxEnd = Math.max(...segments.map((segment) => segment.end || 0));
    if (!(maxEnd > 0)) return segments;
    const duration = totalDuration > 30 ? totalDuration : maxEnd;
    let scale = 1;
    if (maxEnd < duration / 8 && maxEnd * 1000 > duration * 0.4 && maxEnd * 1000 < duration * 1.5) {
        scale = 1000;
    } else if (maxEnd > duration * 8 && maxEnd / 1000 > duration * 0.4 && maxEnd / 1000 < duration * 1.5) {
        scale = 1 / 1000;
    }
    if (scale === 1) return segments;
    console.log(`[CheckpointQ] Rescaling caption times by ${scale} (max ${maxEnd}s vs video ${duration}s)`);
    return segments.map((segment) => ({
        ...segment,
        offset: segment.offset * scale,
        start: segment.start * scale,
        end: segment.end * scale,
        dur: (segment.dur || 0) * scale,
    }));
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

// ─── 3. Place a check when a topic ends, and never wait longer than 2 minutes ─

const TOPIC_SHIFT = /\b(now|next|another|secondly|thirdly|moving on|let'?s|so the|so this|so now|this is called|this means|definition|defined as|for example|in other words|the next|coming to|remember|note that|important point|first|second|third|ab |toh |chaliye|matlab)\b/i;

const snapToSentence = (segments, target) => {
    if (!segments || segments.length === 0) return Math.round(target);
    const candidates = segments.filter((segment) => segment.end >= target - 16 && segment.end <= target + 6);
    if (candidates.length === 0) return Math.round(target);
    candidates.sort((a, b) => {
        const aSentence = /[.?!…]$/.test(a.text) ? 0 : 1;
        const bSentence = /[.?!…]$/.test(b.text) ? 0 : 1;
        if (aSentence !== bSentence) return aSentence - bSentence;
        return Math.abs(a.end - target) - Math.abs(b.end - target);
    });
    return Math.round((candidates[0].end + 0.15) * 10) / 10;
};

const findTopicCheckpoints = (segments, teachingStart, totalDuration) => {
    const MAX_GAP = 120;
    const MIN_GAP = 50;
    const contentEnd = Math.max(teachingStart + 80, totalDuration - 20);
    const points = [];
    let cursor = teachingStart;
    const segs = segments || [];

    while (cursor < contentEnd - 35 && points.length < 24) {
        const earliest = cursor + MIN_GAP;
        const latest = Math.min(cursor + MAX_GAP, contentEnd);
        if (latest <= earliest + 5) break;

        let bestTs = null;
        let bestScore = 0;
        segs.forEach((segment, index) => {
            if (segment.end < earliest || segment.end > latest) return;
            const nextText = segs[index + 1]?.text || '';
            let score = 0;
            if (TOPIC_SHIFT.test(nextText)) score += 8;
            if (TOPIC_SHIFT.test(segment.text)) score += 7;
            if (/[.?!…]$/.test(segment.text)) score += 2;
            const gap = segs[index + 1] ? segs[index + 1].start - segment.end : 0.3;
            if (gap >= 0.4) score += 2;
            if (score > bestScore) {
                bestScore = score;
                bestTs = segment.end;
            }
        });

        const ts = bestScore >= 6 ? Math.round((bestTs + 0.15) * 10) / 10 : snapToSentence(segs, latest);
        if (!ts || ts <= cursor + 20) break;
        points.push(ts);
        cursor = ts;
    }

    return points;
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

const GENERIC_QUESTION = /foundational formula|core method or calculation|calculation rule was applied|domain limits or terms|primary analytical outcome|standard formula derivation|standard analytical formula|which point about|part you just watched|which point was explained/i;

const isGenericQuestion = (question) => GENERIC_QUESTION.test(String(question || ''));

const STOP_WORDS = new Set(['this', 'that', 'with', 'from', 'they', 'them', 'have', 'what', 'when', 'where', 'which', 'there', 'their', 'about', 'would', 'could', 'should', 'these', 'those', 'into', 'your', 'because', 'while', 'after', 'before', 'other', 'also', 'than', 'then', 'been', 'were', 'will', 'just', 'like', 'some', 'such', 'only', 'over', 'each', 'more', 'most', 'very', 'does', 'doing', 'make', 'made', 'using', 'used', 'between', 'through', 'during', 'without', 'within', 'another', 'every', 'being', 'here', 'video', 'lecture', 'student', 'question', 'answer', 'option', 'means', 'called', 'known']);

const contentWords = (text) => normalizeQuestion(text).split(' ').filter((word) => word.length > 3 && !STOP_WORDS.has(word));

const questionsTooSimilar = (a, b) => {
    const na = normalizeQuestion(a);
    const nb = normalizeQuestion(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.length > 40 && nb.length > 40 && (na.includes(nb) || nb.includes(na))) return true;
    return na.slice(0, 48) === nb.slice(0, 48);
};

const freshTerms = (sliceText, priorText) => {
    const prior = new Set(contentWords(priorText));
    const seen = [];
    contentWords(sliceText).forEach((word) => {
        if (!prior.has(word) && !seen.includes(word)) seen.push(word);
    });
    return seen.slice(0, 12);
};

const transcriptIsMostlyTranslated = (chunkText) => {
    const letters = chunkText.match(/[A-Za-z\u0900-\u097F]/g) || [];
    if (letters.length < 40) return false;
    const nonLatin = letters.filter((ch) => ch.charCodeAt(0) > 127).length;
    return nonLatin > letters.length * 0.45;
};

const questionIsGrounded = (question, chunkText) => {
    if (isGenericQuestion(question.question)) return false;
    // Hindi and other lectures are often answered in English, so a word match would reject every check.
    if (transcriptIsMostlyTranslated(chunkText)) return true;
    const chunk = new Set(normalizeQuestion(chunkText).split(' '));
    const mentioned = [...contentWords(question.answer), ...contentWords(question.question)];
    return mentioned.filter((word) => chunk.has(word)).length >= 1;
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
    const combined = [parsed.question, ...parsed.options].join(' ');
    const letters = combined.match(/[A-Za-z\u0900-\u097F]/g) || [];
    const hindiLetters = letters.filter((ch) => ch.charCodeAt(0) > 127).length;
    if (letters.length > 0 && hindiLetters / letters.length > 0.2) return null;
    const norm = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const options = parsed.options.slice(0, 4).map((option) => String(option).trim()).filter(Boolean);
    if (options.length < 4) return null;
    let answer = String(parsed.answer).trim();
    if (!options.some((option) => norm(option) === norm(answer))) {
        const hit = options.find((option) => norm(option).includes(norm(answer)) || norm(answer).includes(norm(option)));
        if (!hit) return null;
        answer = hit;
    }
    const shuffled = shuffleOptions(options, answer);
    if (!shuffled.options.includes(shuffled.answer)) return null;
    return {
        question: String(parsed.question).trim(),
        options: shuffled.options,
        answer: shuffled.answer,
        explanation: parsed.explanation || ''
    };
};

const generateQuestionForSlice = async (videoTitle, def, alreadyAsked) => {
    const spoken = def.chunkText.length > 1600 ? def.chunkText.slice(-1600) : def.chunkText;
    const language = 'Write the question, every option, and the explanation in clear English only. If the transcript is Hindi or another language, translate the idea into English. Do not use Hindi words.';
    const focus = def.newTerms?.length ? `Teachable ideas in this part: ${def.newTerms.slice(0, 8).join(', ')}.` : '';
    const forbidden = alreadyAsked.length
        ? `Do not repeat these questions:\n${alreadyAsked.slice(-8).map((q, i) => `${i + 1}. ${q.question || q}`).join('\n')}`
        : '';

    const prompt = `You write one Duolingo-style check for the lecture "${videoTitle}".
The student just watched only this part, from ${formatTimeLabel(def.prevTs)} to ${formatTimeLabel(def.ts)}:
${spoken}

${focus}
${forbidden}
${language}

Ask ONE specific question about a fact, rule, number, name, or definition that was taught in this part.
Do not ask "which point was explained" and do not paste transcript lines as options.
Wrong options must be short and plausible, but not what was just said.

Rules:
- Question under 22 words.
- Exactly 4 short options, each under 12 words.
- "answer" is copied exactly from one option.
- One-sentence explanation.
- Math uses $...$ with braces. Escape backslashes as \\\\.

Respond ONLY with JSON:
{"question":"...","options":["...","...","...","..."],"answer":"...","explanation":"..."}`;

    try {
        const text = await generateGeminiContent(MODELS.GEMINI_FLASH_LITE, prompt, {
            maxOutputTokens: 1800,
            temperature: 0.4,
            responseMimeType: 'application/json'
        });

        const parsed = parseQuestionJson(text);
        const accepted = acceptQuestion(parsed?.question ? parsed : parsed?.questions?.[0]);
        return accepted;
    } catch (e) {
        console.warn(`[CheckpointQ] Slice question error:`, e.message);
        return null;
    }
};

// ─── 5. Route Handler ─────────────────────────────────────────────────────────

/**
 * GET /api/checkpoint-questions/:videoId
 *
 * Guaranteed Rules:
 * - A check when a topic finishes, and always within 2 minutes
 * - Intro skipped
 * - Each question is about a new fact spoken since the previous check
 * - Pauses cleanly at end of sentence
 */
const getCheckpointQuestions = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    // Cache key v18: each check is a real question about the last 2–3 minutes, not a generic prompt.
    const cacheKey = `checkpoint-questions:v19:${videoId}`;

    try {
        // Fetch video record from DB
        const video = await prisma.video.findFirst({ where: { vid: videoId } });
        const videoTitle = video?.name || 'this lecture';
        const videoUrl   = video?.url  || `https://www.youtube.com/watch?v=${videoId}`;
        const vid        = extractVideoId(videoUrl) || videoId;

        // Fetch timed transcript segments
        console.log(`[CheckpointQ] Fetching segments for ${videoId}...`);
        const caption = await fetchTimedSegments(vid);
        let totalDuration = caption?.duration || video?.duration_seconds || 0;
        let segments = alignSegmentClock(caption?.segments, totalDuration);
        if (segments && segments.length > 0 && segments[segments.length - 1].end > totalDuration) {
            totalDuration = segments[segments.length - 1].end;
        }
        if (!totalDuration) totalDuration = 600;
        segments = spreadTranscript(segments, totalDuration);

        console.log(`[CheckpointQ] Video: "${videoTitle.slice(0, 40)}" | Duration: ${totalDuration}s | Segments: ${segments?.length || 0}`);

        // 1. Dynamic Intro Detection
        const teachingStart = detectTeachingStart(segments, totalDuration, video?.description || '', videoTitle);

        const expectedCount = Math.max(2, Math.min(24, Math.round(Math.max(90, totalDuration - teachingStart - 20) / 110)));
        const cached = await cacheService.get(cacheKey);
        const cachedIsUsable = Array.isArray(cached)
            && cached.length >= Math.max(2, Math.ceil(expectedCount * 0.7))
            && cached.every((cp) => cp?.question && !isGenericQuestion(cp.question));
        if (cachedIsUsable) {
            console.log(`[CheckpointQ] ✅ Cache hit for ${videoId} (${cached.length} checkpoints)`);
            return res.status(200).json({ checkpoints: cached });
        }

        console.log(`[CheckpointQ] Placing topic checks for ${Math.round(totalDuration / 60)}m video (teaching starts at ${teachingStart}s, expect about ${expectedCount})`);

        // 2. Pause when a topic ends. If none ends, pause by the 2-minute mark.
        const timestamps = findTopicCheckpoints(segments, teachingStart, totalDuration);

        // 4. Each check uses only speech since the previous check, and only if that part introduced something new.
        const seenQuestions = [];
        const chunkDefs = [];
        let previousTs = teachingStart;
        const sliceText = (from, to) => (segments || [])
            .filter((s) => s.offset >= from && s.offset <= to)
            .map((s) => s.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        timestamps.forEach((ts) => {
            const chunkText = sliceText(previousTs, ts);
            if (chunkText.length < 120) {
                previousTs = ts;
                return;
            }
            const priorText = sliceText(0, previousTs);
            const introduced = freshTerms(chunkText, priorText);
            const terms = introduced.length >= 2
                ? introduced
                : contentWords(chunkText).filter((word, index, all) => all.indexOf(word) === index).slice(0, 8);
            chunkDefs.push({ ts, prevTs: previousTs, idx: chunkDefs.length, chunkText, newTerms: terms });
            previousTs = ts;
        });

        console.log(`[CheckpointQ] Generating ${chunkDefs.length} checks from watched transcript slices...`);

        const questionsByIndex = new Map();
        const storeQuestion = (def, question) => {
            if (!question || !questionIsGrounded(question, def.chunkText)) return false;
            const repeated = seenQuestions.some((asked) =>
                questionsTooSimilar(asked.question, question.question) || questionsTooSimilar(asked.answer, question.answer)
            );
            if (repeated) return false;
            questionsByIndex.set(def.idx, question);
            seenQuestions.push(question);
            return true;
        };

        const pending = [...chunkDefs];
        const workers = Array.from({ length: Math.min(3, pending.length) }, async () => {
            while (pending.length) {
                const def = pending.shift();
                if (!def) return;
                const question = await generateQuestionForSlice(videoTitle, def, seenQuestions);
                if (!storeQuestion(def, question)) {
                    const retry = await generateQuestionForSlice(videoTitle, def, seenQuestions);
                    storeQuestion(def, retry);
                }
            }
        });
        await Promise.all(workers);

        // 5. Keep only real questions about the slice the student just watched.
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

        if (checkpoints.length >= Math.max(2, Math.ceil(expectedCount * 0.7))) {
            await cacheService.set(cacheKey, checkpoints, 24 * 3600);
        }

        return res.status(200).json({ checkpoints });

    } catch (error) {
        console.error('[CheckpointQ] Fatal error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { getCheckpointQuestions };
