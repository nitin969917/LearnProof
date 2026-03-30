const admin = require('firebase-admin');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'learnproof_default_secret_9988';

/**
 * Verifies Google ID Token. Mimics Django's verify_firebase_token.
 */
const verifyFirebaseToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Map 'sub' to 'uid' to match existing expectations
        payload.uid = payload.sub;

        return payload;
    } catch (error) {
        console.error('Token verification error:', error);
        throw new Error('Invalid Google Token');
    }
};

const prisma = require('../lib/prisma');
const cacheService = require('../services/cache.service');

/**
 * Express Middleware for Auth
 */
const authMiddleware = async (req, res, next) => {
    let idToken = req.body.idToken || req.query.idToken || req.headers['authorization']?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // 1. Try Custom JWT first (Long-lived session)
        try {
            const decoded = jwt.verify(idToken, JWT_SECRET);
            if (decoded && decoded.uid) {
                console.log('Valid Custom JWT session for:', decoded.uid);
                const cacheKey = `user:profile:${decoded.uid}`;
                let user = await cacheService.get(cacheKey);
                if (!user) {
                    user = await prisma.userProfile.findUnique({ where: { uid: decoded.uid } });
                    if (user) await cacheService.set(cacheKey, user, 3600);
                }
                
                if (user) {
                    req.user = { ...decoded, ...user, id: user.id };
                    return next();
                }
            }
        } catch (jwtErr) {
            // Not a custom JWT or expired, fallback to Google
            console.log('Not a custom JWT, falling back to Google verification...');
        }

        // 2. Fallback to Google ID Token Verification
        console.log('Verifying Google token...');
        const decodedToken = await verifyFirebaseToken(idToken);
        const { uid, email, name, picture } = decodedToken;
        console.log('Google token verified for UID:', uid);

        // Auto-create or get user from DB
        const cacheKey = `user:profile:${uid}`;
        let user = await cacheService.get(cacheKey);

        if (!user) {
            user = await prisma.userProfile.findUnique({ where: { uid } });
            if (!user) {
                user = await prisma.userProfile.create({
                    data: {
                        uid,
                        email: email || '',
                        name: name || 'User',
                        profile_pic: picture || ''
                    }
                });
            }
            await cacheService.set(cacheKey, user, 3600);
        }

        // Generate a new custom session token for the client if it was a Google login
        const newSessionToken = jwt.sign(
            { uid, email, name, picture },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Attach user and mark as new login to let controller know to send back the new token
        req.user = { ...decodedToken, ...user, id: user.id };
        req.newSessionToken = newSessionToken;
        
        next();
    } catch (error) {
        console.error('Auth middleware error details:', error);
        return res.status(401).json({ error: 'Unauthorized', details: error.message });
    }
};

/**
 * Express Middleware for Admin Auth
 */
const isAdminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.email) {
        return res.status(403).json({ error: 'Access denied. User not authenticated.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && req.user.email.toLowerCase() === adminEmail.toLowerCase()) {
        return next();
    }

    if (!adminEmail) {
        console.warn('ADMIN_EMAIL is not set in backend .env. Bypassing admin check for development.');
        return next();
    }

    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
};

module.exports = {
    verifyFirebaseToken,
    authMiddleware,
    isAdminMiddleware,
};
