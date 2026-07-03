const prisma = require('../lib/prisma');
const crypto = require('crypto');
const matrixService = require('../services/matrix.service');
const JWT_SECRET = process.env.JWT_SECRET || 'learnproof_default_secret_9988';

/**
 * Authentication & Profile Controller
 */
const loginOrRegister = async (req, res) => {
    const responseData = {
        ...req.user,
        token: req.newSessionToken || null
    };

    try {
        if (matrixService.ENABLE_MATRIX_CHAT) {
            // Generate deterministic Matrix credentials
            const matrixUsername = `user_${req.user.id}`;
            const matrixPassword = crypto
                .createHmac('sha256', JWT_SECRET)
                .update(req.user.uid)
                .digest('hex');

            // Registers if new, or logs in to get fresh access token
            const matrixCreds = await matrixService.registerUser(matrixUsername, matrixPassword);
            if (matrixCreds) {
                responseData.matrixCredentials = {
                    userId: matrixCreds.userId,
                    accessToken: matrixCreds.accessToken,
                    homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                };
            }
        }
    } catch (err) {
        console.error('Failed to sync Matrix credentials during loginOrRegister:', err.message);
    }

    res.status(200).json(responseData);
};

const getProfile = async (req, res) => {
    const responseData = { ...req.user };

    try {
        if (matrixService.ENABLE_MATRIX_CHAT) {
            const matrixUsername = `user_${req.user.id}`;
            const matrixPassword = crypto
                .createHmac('sha256', JWT_SECRET)
                .update(req.user.uid)
                .digest('hex');

            const matrixCreds = await matrixService.loginUser(matrixUsername, matrixPassword);
            if (matrixCreds) {
                responseData.matrixCredentials = {
                    userId: matrixCreds.userId,
                    accessToken: matrixCreds.accessToken,
                    homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                };
            }
        }
    } catch (err) {
        console.error('Failed to sync Matrix credentials during getProfile:', err.message);
    }

    res.status(200).json(responseData);
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

const getPublicStats = async (req, res) => {
    try {
        const totalUsers = await prisma.userProfile.count();
        res.status(200).json({ totalUsers });
    } catch (error) {
        console.error('getPublicStats Error:', error);
        res.status(500).json({ error: 'Failed to fetch public stats' });
    }
};

module.exports = {
    loginOrRegister,
    getProfile,
    handleGoogleCallback,
    getPublicStats
};
