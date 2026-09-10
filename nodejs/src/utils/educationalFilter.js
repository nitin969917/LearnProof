/**
 * Educational Content Filter for LearnProof — WHITELIST-FIRST (Fail-Closed)
 *
 * Architecture:
 *   ALLOW only if:
 *     1. From a known trusted educational channel, OR
 *     2. YouTube Category is explicitly educational (27, 28, 26), OR
 *     3. Title/description contains a strong educational keyword signal.
 *   BLOCK everything else by default.
 */

// ─── YouTube Educational Categories (ONLY these are whitelisted) ──────────────
//   27 = Education, 28 = Science & Technology, 26 = Howto & Style
const ALLOWED_CATEGORIES = new Set(['27', '28', '26']);

const CATEGORY_NAMES = {
    '1': 'Film & Animation', '2': 'Autos & Vehicles', '10': 'Music',
    '15': 'Pets & Animals', '17': 'Sports', '19': 'Travel & Events',
    '20': 'Gaming', '22': 'People & Blogs', '23': 'Comedy',
    '24': 'Entertainment', '25': 'News & Politics',
};

// ─── Trusted Educational Channels (auto-allowed) ──────────────────────────────
const TRUSTED_EDU_CHANNELS = new Set([
    'mit opencourseware', 'stanford', 'harvard', 'freecodecamp.org', 'khan academy',
    'crashcourse', '3blue1brown', 'cs50', 'coursera', 'edx', 'nptel', 'traversy media',
    'fireship', 'bro code', 'corey schafer', 'programming with mosh', 'statquest with josh starmer',
    'kurzgesagt – in a nutshell', 'veritasium', 'ted-ed', 'numberphile', 'computerphile',
    'the coding train', 'sentdex', 'edureka!', 'simplilearn', 'geeksforgeeks', 'codebasics',
    'derek banas', 'academind', 'kevin stratvert', 'web dev simplified', 'clever programmer',
    'chaiaurcode', 'physics wallah', 'unacademy', 'vedantu', 'apna college', 'codehelp - by babbar',
    'gate smashers', 'neso academy', 'saurabh shukla', 'telusko', 'hitesh choudhary',
    'amigoscode', 'dave gray', 'net ninja', 'pedrotech', 'sonny sangha', 'studiobinder',
    'cinecom.net', 'film riot', 'two minute papers', 'minutephysics', 'andrew huberman',
    'medcram', 'osmosis', 'lex fridman', 'paul mcwhorter', 'siraj raval',
]);

// ─── Strong Educational Keyword Signals ───────────────────────────────────────
const EDU_PATTERNS = [
    // Pedagogical terms (English)
    /\b(course|tutorial|lecture|crash course|bootcamp|masterclass|lesson|syllabus|study guide|exam prep|revision|explained|explanation|explainer|deep dive|how to|step by step|beginner|introduction to|getting started|learn(ing)?|teach(ing)?|training|roadmap|cheat sheet|interview prep|guide to)\b/i,
    // Academic disciplines (English)
    /\b(programming|coding|software|web development|frontend|backend|full stack|python|javascript|typescript|c\+\+|java|rust|golang|swift|kotlin|ruby|php|bash|react|angular|vue|next\.?js|node\.?js|sql|nosql|mongodb|postgresql|docker|kubernetes|aws|azure|gcp|devops|git|linux|networking|cybersecurity|data structures|algorithms|machine learning|deep learning|neural network|artificial intelligence|data science|data analysis|statistics|probability|calculus|algebra|geometry|trigonometry|linear algebra|discrete math|physics|chemistry|biology|biochemistry|neuroscience|organic chemistry|genetics|astronomy|ecology|microbiology|anatomy|physiology|economics|finance|accounting|investing|stock market|personal finance|history|geography|political science|philosophy|psychology|sociology|linguistics|grammar|literature|creative writing|ielts|toefl|sat|gre|gmat|upsc|jee|neet|gate|board exam|engineering|3d modeling|ui ux|graphic design|animation|vfx|video editing|photography tutorial|music theory|piano lesson|guitar lesson|drawing tutorial|yoga instruction|meditation guide|fitness training|workout plan|nutrition science|cooking technique|language learning|spanish|french|german|japanese|mandarin|korean|italian|arabic|sign language)\b/i,
    // Hindi, Marathi & Indic educational
    /(कक्षा|पाठ|अध्याय|गणित|विज्ञान|भौतिकी|रसायन|जीव विज्ञान|इतिहास|भूगोल|अर्थशास्त्र|सीखें|सिखिए|पढ़ाई|तैयारी|परीक्षा|मार्गदर्शन|व्याख्यान|कोर्स|इयत्ता|शुरुआत से|प्रश्नोत्तरी|समाधान|अभ्यास|सूत्र|बोर्ड परीक्षा|ट्यूटोरियल|प्रोग्रामिंग|कोडिंग|व्याकरण|शिक्षा|अध्ययन|पाठ्यक्रम|नोट्स|शिक्षक|विद्यार्थी|छात्र|विश्वविद्यालय)/i,
    // Spanish & Portuguese
    /\b(curso|clase|aprender|tutorial|lección|guía|matemáticas|ciencia|programación|desde cero|paso a paso|explicación|universidad|física|química|biología|historia)\b/i,
    // French
    /\b(cours|apprendre|tutoriel|leçon|guide|mathématiques|science|explication|débutant|formation|université|physique|chimie|biologie)\b/i,
    // German
    /\b(kurs|lernen|anleitung|lektion|erklärung|mathematik|programmieren|anfänger|vorlesung|übung|schule|physik|chemie|biologie)\b/i,
    // Arabic
    /(دورة|كورس|تعلم|شرح|درس|محاضرة|مبتدئين|برمجة|رياضيات|علوم|تعليم|فيزياء|كيمياء)/i,
    // Japanese / Chinese / Korean
    /(講座|入門|基礎|チュートリアル|授業|教程|课程|学习|讲解|강의|강좌|수업|학습|튜토리얼)/i,
];

// ─── Hard Block Patterns (always blocked, no exceptions) ─────────────────────
const HARD_BLOCK_PATTERNS = [
    // Adult / Explicit
    /\b(sexy|sex(ual)?|porn|erotic|nude|naked|nsfw|18\+|adult content|explicit|stripping|strip club|twerking|booty|busty|horny|xxx|hentai|onlyfans|hot girl|hot boy|makeout|making out)\b/i,
    // Music entertainment
    /\b(official music video|official video|video song|audio song|full album|jukebox|remix|dj set|mashup|unplugged|slowed reverb|lofi|karaoke|dance cover|choreography|lyric video|music video|mv|official mv|audio release|feat\.|ft\.\s|prod\. by)\b/i,
    /(गाणी|गाणे|गाना|गाने|गीत|संगीत|धून|कव्वाली|गज़ल|लावणी|भजन|आरती|चालीसा|नाच|नृत्य|राग|ढोलकी)/i,
    /\b(canción|canciones|música|videoclip|chanson|musique|اغنية|اغاني|كليب|موسيقى)\b/i,
    // Movies / Films / Serials
    /\b(full movie|bollywood|hollywood|tollywood|kollywood|mollywood|blockbuster|box office|hindi dubbed|dubbed movie|movie trailer|film trailer|official trailer|teaser trailer|cinema release|web series|tv serial|daily soap|natak|ott release|episode \d+|ep\s*\d+|s\d+e\d+|short film|feature film|motion picture|deleted scene|behind the scenes|bloopers|fight scene|love scene|item song|item number|watch online|streaming now)\b/i,
    /\b(movies?|films?)\b(?!\s+(tutorial|course|making|critique|analysis|review|theory|history|studies|technique|school|festival))/i,
    /(मूवी|मूवीज|फिल्म|फिल्में|सिनेमा|चित्रपट|नाटक|मालिका|धारावाहिक|एपिसोड|वेब सीरीज|फुल मूवी|फूल मूवी|ब्लॉकबस्टर|बहू|सास-बहू|ड्रामा)/i,
    // Reality TV / Celebrity
    /\b(bigg boss|splitsvilla|roadies|koffee with karan|kapil sharma|celebrity gossip|paparazzi|celebrity interview|red carpet|filmfare|iifa|diss track|roast of)\b/i,
    // Sports entertainment (highlights - not coaching/technique)
    /\b(match highlights|full match|live match|goal highlights|ufc fight night|wwe (smackdown|raw)|t20 highlights|ipl highlights|world cup highlights|penalty shootout|cricket highlights|football highlights|goal of the week)\b/i,
    // Gaming (non-tutorial)
    /\b(full gameplay|gameplay part \d+|let's play|clutch kill|clutch moments|fortnite gameplay|pubg mobile gameplay|free fire live|roblox funny|gaming highlights|gaming montage|speedrun|no commentary gameplay|playthrough part \d+|dfd (ch|chapter)?\d+|visual novel gameplay)\b/i,
    // Comedy / Prank
    /\b(standup comedy|stand-up comedy|roast video|prank on|funny prank|funny video|meme compilation|try not to laugh|hilarious|laugh challenge|comedy sketch|gone wrong|vine compilation|tiktok compilation|mukbang|food challenge|eating challenge)\b/i,
    /(कॉमेडी|हंसी|मजाक|जोक्स)/i,
    // Vlogs / Lifestyle
    /\b(daily vlog|family vlog|morning routine|day in my life|room tour|house tour|what i eat in a day|travel vlog|couple vlog|shopping haul|unboxing vlog|haul video)\b/i,
    /(व्लॉग|दिनचर्या)/i,
    // Rap / Hip-hop entertainment
    /\b(rap video|rapper|hip hop video|hiphop|freestyle rap|rap cypher|diss track|trap beat|drill music|rap song|rap album|rap single)\b/i,
    /(रैप|राप|हिपहॉप|मराठी रॅप|मराठी रॅपर)/i,
];

// ─── Entertainment Channel Keywords ──────────────────────────────────────────
const ENTERTAINMENT_CHANNEL_KEYWORDS = [
    'music', 'records', 'entertainment', 'vevo', 'saregama', 't-series', 'tseries',
    'sony music', 'zee music', 'yrf', 'tips official', 'speed records', 'everest',
    'rajshri', 'eros now', 'shemaroo', 'ultra bollywood', 'b4u', 'desi music',
    'planet marathi', 'venus', 'times music', 'aditya music', 'svf', 'wave music',
    'nirmitee', 'talkies', 'theatre', 'playmovies', 'hiroshi plays', 'plays',
    'gamer', 'gaming channel', 'gameplay', 'let\'s play', 'stage',
];

/**
 * ITEM-LEVEL check: Is this YouTube video educational?
 * WHITELIST-FIRST — blocked unless proven educational.
 */
const isAllowedEducationalContent = ({ title = '', description = '', channel = '', categoryId = null }) => {
    const cleanTitle = (title || '').trim();
    const cleanChannel = (channel || '').trim().toLowerCase();
    const cleanDesc = (description || '').trim().substring(0, 500);
    const combinedText = `${cleanTitle} ${cleanDesc} ${cleanChannel}`;

    // 1. HARD BLOCKS — always win (check title and channel only, not description)
    for (const pattern of HARD_BLOCK_PATTERNS) {
        if (pattern.test(cleanTitle) || pattern.test(cleanChannel)) {
            return { allowed: false, reason: 'hard_block' };
        }
    }

    // 2. Entertainment channel label → block
    if (cleanChannel) {
        if (cleanChannel.endsWith('- topic') || /\b-\s*topic\b/i.test(cleanChannel)) {
            return { allowed: false, reason: 'youtube_music_topic' };
        }
        for (const kw of ENTERTAINMENT_CHANNEL_KEYWORDS) {
            if (cleanChannel.includes(kw)) {
                return { allowed: false, reason: 'entertainment_channel' };
            }
        }
    }

    // 3. WHITELIST: Trusted educational channel
    if (cleanChannel && TRUSTED_EDU_CHANNELS.has(cleanChannel)) {
        return { allowed: true, reason: 'trusted_channel' };
    }

    // 4. WHITELIST: YouTube educational category (27=Education, 28=Science&Tech, 26=Howto)
    if (categoryId && ALLOWED_CATEGORIES.has(categoryId.toString())) {
        return { allowed: true, reason: 'educational_category' };
    }

    // 5. WHITELIST: Strong educational keyword in title or description
    for (const pattern of EDU_PATTERNS) {
        if (pattern.test(combinedText)) {
            return { allowed: true, reason: 'educational_keyword' };
        }
    }

    // 6. DEFAULT: FAIL CLOSED — no educational signal → block
    return { allowed: false, reason: 'no_educational_signal' };
};

/**
 * QUERY-LEVEL check: Does this search query have educational intent?
 * Blocks entertainment/adult queries before even hitting the YouTube API.
 */
const isEducationalQuery = (query = '') => {
    const q = (query || '').trim();
    if (!q) return { allowed: false, notice: 'Empty query' };

    const ql = q.toLowerCase();

    // Hard-block adult queries
    if (/\b(sexy|sex|porn|nude|naked|nsfw|xxx|hentai|onlyfans|strip|twerk|busty|horny)\b/i.test(ql)) {
        return { allowed: false, notice: 'LearnProof is an educational platform. This search is not allowed.' };
    }

    // Block pure entertainment queries
    if (/\b(song|songs|music video|movie|movies|full movie|film|films|bollywood|hollywood|rap|rapper|hip hop|vlog|meme|funny video|prank|comedy show|celebrity|gossip|serial|web series|match highlights|gameplay|let's play|love story|romantic|item song|trailer|web show|reality show|natak)\b/i.test(ql)) {
        return {
            allowed: false,
            notice: "LearnProof is an educational platform. Please search for academic subjects, courses, or skills (e.g., 'Python Tutorial', 'Calculus', 'World History')."
        };
    }

    // Allow queries with strong educational signals
    for (const pattern of EDU_PATTERNS) {
        if (pattern.test(ql)) return { allowed: true };
    }

    // Allow single known academic subjects / tech keywords
    if (/^(python|javascript|typescript|java|c\+\+|rust|golang|swift|kotlin|ruby|php|bash|react|angular|vue|sql|mongodb|docker|kubernetes|aws|azure|git|linux|html|css|flutter|dart|flutter|calculus|algebra|geometry|trigonometry|physics|chemistry|biology|history|economics|philosophy|psychology|sociology|geography|accounting|finance|statistics|ielts|toefl|sat|gre|gmat|upsc|jee|neet|gate|engineering|figma|blender|unity|photoshop|matlab|excel|tableau|powerbi|spanish|french|german|japanese|mandarin|korean|arabic|italian|anatomy|genetics|neuroscience|nutrition|yoga|meditation|grammar|vocabulary)(\s.*)?$/i.test(ql)) {
        return { allowed: true };
    }

    // Default: block ambiguous queries (require educational intent to be explicit)
    return {
        allowed: false,
        notice: "LearnProof is an educational platform. Please search for a specific subject, course, or tutorial (e.g., 'Python Tutorial', 'Calculus Lecture', 'World History Explained')."
    };
};

module.exports = {
    ALLOWED_CATEGORIES,
    CATEGORY_NAMES,
    TRUSTED_EDU_CHANNELS,
    EDU_PATTERNS,
    HARD_BLOCK_PATTERNS,
    isAllowedEducationalContent,
    isEducationalQuery,
};
