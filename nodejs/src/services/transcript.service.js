const axios = require('axios');

/**
 * Extracts the YouTube video ID from a URL or raw ID.
 */
const extractVideoId = (url) => {
    if (!url) return null;
    // Already a bare 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1).split('?')[0];
        return urlObj.searchParams.get('v') || null;
    } catch {
        const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }
};

/**
 * Decode HTML entities in transcript text.
 */
const decodeEntities = (str) =>
    str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)));

/**
 * Fetch caption tracks list using YouTube's InnerTube API (no API key needed).
 */
const getCaptionTracks = async (videoId) => {
    const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
    const CLIENT_VERSION = '20.10.38';

    const response = await axios.post(
        INNERTUBE_URL,
        {
            context: {
                client: {
                    clientName: 'ANDROID',
                    clientVersion: CLIENT_VERSION,
                },
            },
            videoId,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 14)`,
            },
            timeout: 8000,
        }
    );

    const tracks =
        response.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    return Array.isArray(tracks) ? tracks : [];
};

/**
 * Fetch and parse caption XML from a track baseUrl.
 */
const parseCaptionXml = (xml, langCode) => {
    const segments = [];
    // Match both old <text> and new <p t="..." d="..."> formats
    const oldFormat = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    const newFormat = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;

    let match;
    // Try new format first
    while ((match = newFormat.exec(xml)) !== null) {
        const raw = match[3].replace(/<[^>]+>/g, '').trim();
        const text = decodeEntities(raw);
        if (text) segments.push({ text, offset: parseInt(match[1], 10), lang: langCode });
    }

    // Fallback to old format if nothing found
    if (segments.length === 0) {
        while ((match = oldFormat.exec(xml)) !== null) {
            const text = decodeEntities(match[3]).trim();
            if (text) segments.push({ text, offset: parseFloat(match[1]), lang: langCode });
        }
    }

    return segments;
};

/**
 * Detect the spoken language from transcript text using Unicode block heuristics.
 */
const detectLanguage = (text) => {
    if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
    if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';
    if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
    if (/[\u3040-\u30FF]/.test(text)) return 'Japanese';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean';
    return 'English';
};

/**
 * Main export: Fetches the YouTube transcript for a given video URL.
 * Returns: { transcript, language, isFallback, reason }
 *
 * No API key needed. Uses YouTube's public InnerTube endpoint.
 * Gracefully falls back if transcripts are disabled or unavailable.
 */
const fetchTranscript = async (url, videoId = null) => {
    const vid = videoId || extractVideoId(url);
    if (!vid) {
        return { transcript: null, language: null, isFallback: true, reason: 'Could not extract video ID' };
    }

    try {
        const tracks = await getCaptionTracks(vid);

        if (!tracks || tracks.length === 0) {
            return { transcript: null, language: null, isFallback: true, reason: 'No caption tracks found' };
        }

        // Prefer manual captions over auto-generated; pick first available
        const preferred =
            tracks.find((t) => !t.kind || t.kind !== 'asr') || // manual first
            tracks[0]; // then auto-generated

        const langCode = preferred.languageCode || 'unknown';
        const captionUrl = preferred.baseUrl;

        const captionResponse = await axios.get(captionUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000,
        });

        const segments = parseCaptionXml(captionResponse.data, langCode);

        if (!segments || segments.length === 0) {
            return { transcript: null, language: null, isFallback: true, reason: 'Empty caption data received' };
        }

        const fullText = segments.map((s) => s.text).join(' ').trim();
        const language = detectLanguage(fullText) || langCode;

        // Trim to ~5000 chars (~1200-1500 tokens) — deep context for exhaustive Master generation
        const transcript = fullText.slice(0, 5000);

        console.log(`[Transcript] ✅ Fetched ${transcript.length} chars | lang: ${language} | tracks available: ${tracks.length}`);

        return { transcript, language, isFallback: false };

    } catch (error) {
        console.warn(`[Transcript] ⚠️  Could not fetch transcript for ${vid}: ${error.message}`);
        return { transcript: null, language: null, isFallback: true, reason: error.message };
    }
};

module.exports = { fetchTranscript, extractVideoId };

