/**
 * Educational Content Filter for LearnProof
 * 
 * Rules:
 * 1. Educational Immunity: If ANY educational signal is present (across English, Hindi,
 *    Marathi, Spanish, French, German, Arabic, Japanese, etc.) or from a trusted channel,
 *    it is ALWAYS allowed.
 * 2. Asymmetric Blocking: Content is ONLY blocked if it belongs to non-educational
 *    categories (1, 10, 17, 20, 22, 23, 24) or contains explicit pure entertainment signatures
 *    AND has zero educational intent.
 * 3. Fail-Open: When in doubt, allow. Never block genuine educational content in any language.
 */

const BLOCKED_CATEGORIES = new Set(['1', '10', '17', '20', '22', '23', '24']);

const CATEGORY_NAMES = {
    '1': 'Film & Animation',
    '10': 'Music',
    '17': 'Sports',
    '20': 'Gaming',
    '22': 'People & Blogs',
    '23': 'Comedy',
    '24': 'Entertainment'
};

// Recognized Educational Channels (Auto-Immunity)
const TRUSTED_EDU_CHANNELS = new Set([
    'mit opencourseware', 'stanford', 'harvard', 'freecodecamp.org', 'khan academy',
    'crashcourse', '3blue1brown', 'cs50', 'coursera', 'edx', 'nptel', 'traversy media',
    'fireship', 'bro code', 'corey schafer', 'programming with mosh', 'statquest with josh starmer',
    'kurzgesagt – in a nutshell', 'veritasium', 'ted-ed', 'numberphile', 'computerphile',
    'the coding train', 'sentdex', 'edureka!', 'simplilearn', 'geeksforgeeks', 'codebasics',
    'derek banas', 'academind', 'kevin stratvert', 'web dev simplified', 'clever programmer',
    'chaiaurcode', 'physics wallah', 'unacademy', 'vedantu', 'apna college', 'codehelp - by babbar',
    'gate smashers', 'neso academy', 'saurabh shukla', 'telusko', 'hitesh choudhary',
    'amigoscode', 'web dev simplified', 'dave gray', 'net ninja', 'pedrotech', 'sonny sangha'
]);

// Multilingual Educational Stems (Auto-Immunity Triggers)
const EDU_PATTERNS = [
    // English Pedagogical
    /\b(course|tutorial|lecture|crash course|bootcamp|masterclass|learn|how to|guide|walkthrough|explanation|explained|basics|fundamentals|introduction to|syllabus|lesson|study|exam prep|revision|interview prep|roadmap|cheat sheet|deep dive)\b/i,
    // English Disciplines
    /\b(programming|coding|python|javascript|typescript|c\+\+|java|react|angular|vue|sql|mongodb|docker|kubernetes|aws|cloud|devops|data structure|algorithms|machine learning|deep learning|artificial intelligence|calculus|algebra|geometry|physics|chemistry|biology|neuroscience|organic chemistry|genetics|mechanics|thermodynamics|history|economics|philosophy|finance|accounting|linear algebra|statistics|discrete math)\b/i,
    // Software & Game Dev Education
    /\b(unity tutorial|unreal engine tutorial|blender tutorial|godot tutorial|game dev tutorial|3d modeling tutorial|autocad|figma tutorial|photoshop tutorial)\b/i,
    // Hindi & Marathi & Indic
    /(कक्षा|पाठ|अध्याय|गणित|विज्ञान|इतिहास|सीखें|सिखिए|पढ़ाई|तैयारी|परीक्षा|मार्गदर्शन|व्याख्यान|कोर्स|इयत्ता|शुरुआत से|प्रश्नोत्तरी|समाधान|अभ्यास|गणितीय सूत्र|फॉर्मूला|बोर्ड परीक्षा|पुस्तिका)/i,
    // Spanish & Portuguese
    /\b(curso|clase|aprender|tutorial|lección|guía|matemáticas|ciencia|programación|desde cero|paso a paso|explicación|aula|computación)\b/i,
    // French
    /\b(cours|apprendre|tutoriel|leçon|guide|mathématiques|science|explication|débutant|formation)\b/i,
    // German
    /\b(kurs|lernen|anleitung|lektion|erklärung|mathematik|programmieren|anfänger|vorlesung|übung)\b/i,
    // Arabic
    /(دورة|كورس|تعلم|شرح|درس|محاضرة|مبتدئين|برमجة|رياضيات|علوم)/i,
    // Japanese / Chinese / Korean
    /(講座|入門|基礎|チュートリアル|教程|课程|강의|강좌)/i
];

// Known Entertainment & Music Labels / Channels
const ENTERTAINMENT_CHANNEL_KEYWORDS = [
    'music', 'records', 'entertainment', 'films', 'production', 'series',
    'saregama', 't-series', 'tseries', 'sony music', 'zee music', 'yrf',
    'tips official', 'speed records', 'everest', 'rajshri', 'eros now',
    'shemaroo', 'ultra bollywood', 'geet mp3', 'white hill', 'b4u', 'desi music',
    'planet marathi', 'venus', 'times music', 'aditya music', 'svf', 'wave music',
    'nirmitee', 'studio', 'studios', 'talkies', 'cinema'
];

// Explicit Pure Entertainment Signatures (Required to Block when zero educational intent)
const ENTERTAINMENT_PATTERNS = [
    // Music (English & Global)
    /\b(songs?|singing|singer|vocals|music\s*video|official\s*#?video|official\s*#?audio|video\s*song|audio\s*song|full\s*album|tracklist|jukebox|remix|dj\b|in the mix|mashup|unplugged|slowed\s*\+\s*reverb|lofi|karaoke|dance\s*cover|choreography|lyrics?\s*(video|song)?|feat\.|ft\.|prod\.)\b/i,
    // Music & Songs (Indic: Hindi, Marathi, Punjabi, Bhojpuri, etc.)
    /(गाणी|गाणे|गाना|गाने|गीत|गीते|गाण्यांचे|संगीत|धून|कव्वाली|गज़ल|गजल|लावणी|भजन|आरती|चालीसा|श्लोक|नाच|नृत्य|राग|ढोलकी)/i,
    // Foreign songs & music
    /\b(canción|canciones|música|videoclip|chanson|chansons|musique|اغنية|اغاني|كليب|موسيقى)\b/i,
    // Film / Animation (1)
    /\b(official trailer|teaser trailer|full movie|hindi dubbed movie|movie clip|teaser|trailer 2|cinema release|box office|deleted scene|web series|tv serial|daily soap|natak|short film)\b/i,
    /(चित्रपट|पूरी फिल्म|नाटक|मालिका|एपिसोड)/i,
    // Episode and season markers for TV serials/shows
    /\b(episode\s*\d+|ep\s*\d+|season\s*\d+|s\d+\s*e\d+)\b/i,
    // Gaming (20) - pure gameplay/let's play without tutorial
    /\b(gameplay (part|walkthrough|highlights|live)|let's play|clutch moments|gta v|fortnite|speedrun record|free fire live|pubg mobile|roblox funny|montage)\b/i,
    // Comedy (23)
    /\b(standup comedy|stand up comedy|roast video|roasting|prank on|funny prank|funny video|meme compilation|try not to laugh|hilarious moments|laugh challenge)\b/i,
    /(कॉमेडी|हंसी|मजाक|जोक्स)/i,
    // Entertainment (24)
    /\b(bigg boss|splitsvilla|roadies|kapil sharma|koffee with karan|celebrity gossip|paparazzi|reaction to|celebrity interview|drama episode|full episode \d+)\b/i,
    // Sports (17)
    /\b(match highlights|full match|live match|goal highlights|ufc fight night|wwe (smackdown|raw)|t20 highlights|ipl highlights|world cup highlights|penalty shootout)\b/i,
    // People & Blogs (22)
    /\b(daily vlog|family vlog|my morning routine|day in my life vlog|what i eat in a day|q&a vlog|room tour vlog)\b/i,
    /(व्लॉग|दिनचर्या)/i
];

/**
 * Checks whether content qualifies as educational or is blocked as pure entertainment.
 * 
 * @param {Object} item
 * @param {string} item.title
 * @param {string} [item.description]
 * @param {string} [item.channel]
 * @param {string|number} [item.categoryId]
 * @returns {{ allowed: boolean, reason: string, categoryName?: string }}
 */
const isAllowedEducationalContent = ({ title = '', description = '', channel = '', categoryId = null }) => {
    const cleanTitle = (title || '').trim();
    const cleanChannel = (channel || '').trim().toLowerCase();
    const cleanDesc = (description || '').trim();
    const combinedText = `${cleanTitle} ${cleanDesc} ${cleanChannel}`;

    // 1. Channel Immunity
    if (cleanChannel && TRUSTED_EDU_CHANNELS.has(cleanChannel)) {
        return { allowed: true, reason: 'trusted_channel' };
    }

    // 2. Educational Keywords Immunity (English + Multilingual)
    for (const pattern of EDU_PATTERNS) {
        if (pattern.test(combinedText)) {
            return { allowed: true, reason: 'educational_immunity' };
        }
    }

    // 3. Category Check: If categoryId is an educational category (27: Education, 28: Science & Tech, 26: Howto), always allow!
    if (categoryId && !BLOCKED_CATEGORIES.has(categoryId.toString())) {
        return { allowed: true, reason: 'allowed_category' };
    }

    // 4. If categoryId IS in BLOCKED_CATEGORIES:
    if (categoryId && BLOCKED_CATEGORIES.has(categoryId.toString())) {
        return { 
            allowed: false, 
            reason: 'blocked_category',
            categoryName: CATEGORY_NAMES[categoryId.toString()] || 'Entertainment'
        };
    }

    // 5. Check if title, description, or channel has entertainment signatures
    for (const pattern of ENTERTAINMENT_PATTERNS) {
        if (pattern.test(combinedText)) {
            return { allowed: false, reason: 'pure_entertainment_signature' };
        }
    }

    // 6. Check if channel is a known music/entertainment label or YouTube Music Topic channel
    if (cleanChannel) {
        if (cleanChannel.endsWith('- topic') || /\b-\s*topic\b/i.test(cleanChannel)) {
            return { allowed: false, reason: 'youtube_music_topic_channel' };
        }
        for (const kw of ENTERTAINMENT_CHANNEL_KEYWORDS) {
            if (cleanChannel.includes(kw)) {
                return { allowed: false, reason: 'entertainment_channel_label' };
            }
        }
    }

    // 7. Fail-open for safety (Ensure no education is ever blocked)
    return { allowed: true, reason: 'fail_open' };
};

module.exports = {
    BLOCKED_CATEGORIES,
    CATEGORY_NAMES,
    TRUSTED_EDU_CHANNELS,
    EDU_PATTERNS,
    ENTERTAINMENT_PATTERNS,
    isAllowedEducationalContent
};
