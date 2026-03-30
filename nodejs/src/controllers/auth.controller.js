const prisma = require('../lib/prisma');

/**
 * Authentication & Profile Controller
 */
const loginOrRegister = async (req, res) => {
    // If a new session token was generated (first time Google login/refresh), return it
    res.status(200).json({
        ...req.user,
        token: req.newSessionToken || null
    });
};

const getProfile = async (req, res) => {
    res.status(200).json(req.user);
};

const handleGoogleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=no_code`);

    try {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/google/callback`);
        
        const { tokens } = await client.getToken(code);
        const idToken = tokens.id_token;

        // We can't easily use the authMiddleware here as it's a redirect.
        // We'll redirect to the frontend with the token in the query, 
        // and the frontend will save it and sync.
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${idToken}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.BACKEND_URL || 'http://localhost:5173'}/?error=auth_failed`);
    }
};

module.exports = {
    loginOrRegister,
    getProfile,
    handleGoogleCallback
};
