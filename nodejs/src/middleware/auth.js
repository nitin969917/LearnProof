const admin = require('firebase-admin');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

/**
 * Express Middleware for Auth
 */
const authMiddleware = async (req, res, next) => {
    let idToken = req.body.idToken || req.query.idToken || req.headers['authorization']?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        console.log('Verifying token...');
        const decodedToken = await verifyFirebaseToken(idToken);
        const { uid, email, name, picture } = decodedToken;
        console.log('Token verified for UID:', uid);

        // Auto-create or get user from DB
        console.log('Finding user in DB...');
        let user = await prisma.userProfile.findUnique({ where: { uid } });

        if (!user) {
            console.log('User not found, creating...');
            user = await prisma.userProfile.create({
                data: {
                    uid,
                    email: email || '',
                    name: name || 'User',
                    profile_pic: picture || ''
                }
            });
            console.log('User created:', user.id);
        }

        // Attach both decoded token and DB user to request
        req.user = { ...decodedToken, ...user, id: user.id };
        next();
    } catch (error) {
        console.error('Auth middleware error details:', error);
        const fs = require('fs');
        const logMsg = `${new Date().toISOString()} - ERROR: ${error.stack}\n`;
        fs.appendFileSync('error.log', logMsg);
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
