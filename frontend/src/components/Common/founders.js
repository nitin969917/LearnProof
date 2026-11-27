// Single source of truth for founder contact details (used by /contact and the personal cards).
export const founders = [
    {
        slug: 'nitin',
        path: '/contact-nitin',
        name: 'Nitin Gaikwad',
        role: 'Founder & CTO',
        initials: 'NG',
        avatar: '/founders/nitin.jpg',
        phone: '+91 96991 76009',
        cleanPhone: '919699176009',
        email: 'founder@learnproofai.com',
        linkedin: 'https://www.linkedin.com/in/nitin9699',
        bio: 'Nitin is the creator and lead developer of LearnProof AI, building AI-powered study tools for lifelong learners.',
        focus: ['Product & engineering', 'AI-powered study tools', 'Investor & partner enquiries'],
    },
    {
        slug: 'avishkar',
        path: '/contact-avishkar',
        name: 'Avishkar Kakade',
        role: 'Co-Founder & CEO',
        initials: 'AK',
        avatar: '/founders/avishkar.jpg',
        phone: '+91 90296 56714',
        cleanPhone: '919029656714',
        email: 'kakadeavishkar84@gmail.com',
        linkedin: 'https://www.linkedin.com/in/avishkar-kakade-16536124b/',
        bio: 'Avishkar is the Co-Founder of LearnProof AI, driving strategic vision, growth, and community partnerships.',
        focus: ['Strategy & growth', 'Community partnerships', 'Campus & ambassador programs'],
    },
];

export const companyLinks = {
    website: 'https://learnproofai.com',
    playStore: 'https://play.google.com/store/apps/details?id=com.learnproof.learn_proof_twa',
    appStore: 'https://apps.apple.com/app/learnproof-ai/id6815305441',
    linkedin: 'https://www.linkedin.com/company/learnproof-ai/',
    // Paste the pitch deck URL here to show the "Explore Our Pitch Deck" row. Empty hides it.
    pitchDeck: '',
};

export const getFounder = (slug) => founders.find((f) => f.slug === slug);
