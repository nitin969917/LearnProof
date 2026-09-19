const jwt = require('jsonwebtoken');
const datingPrisma = require('../utils/datingPrisma');
const { verifyFirebaseToken } = require('./auth');
const cacheService = require('../services/cache.service');

const JWT_SECRET = process.env.JWT_SECRET || 'learnproof_default_secret_9988';

const datingAuth = async (req, res, next) => {
  let bearerToken = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string') {
    const match = authHeader.match(/^bearer\s+(.+)$/i);
    if (match && match[1]) {
      bearerToken = match[1].trim();
    } else {
      bearerToken = authHeader.replace(/^bearer\s+/i, '').trim();
    }
  }
  let idToken = req.body?.idToken || req.query?.idToken || req.query?.token || req.body?.token || bearerToken;
  
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(idToken, JWT_SECRET);
    } catch (jwtErr) {
      try {
        // Fallback to Google/Firebase verification
        const googleDecoded = await verifyFirebaseToken(idToken);
        decoded = {
          email: googleDecoded.email,
          uid: googleDecoded.uid,
          name: googleDecoded.name,
          picture: googleDecoded.picture
        };
      } catch (fbErr) {
        // Fallback for Apple Sign-In / unverified JWT payload on iOS
        const unverified = jwt.decode(idToken);
        if (unverified && typeof unverified === 'object') {
          const userUid = unverified.uid || unverified.sub || unverified.id;
          if (userUid) {
            decoded = {
              email: unverified.email || `${userUid}@learnproofai.com`,
              uid: String(userUid),
              name: unverified.name || 'Student',
              picture: unverified.picture || ''
            };
          }
        }
        if (!decoded) {
          throw fbErr;
        }
      }
    }

    if (!decoded || (!decoded.email && !decoded.uid)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    const userEmail = decoded.email || `${decoded.uid}@learnproofai.com`;

    // ── Redis cache: avoid DB hit on every request ─────────────────────────
    const cacheKey = `social:user:email:${userEmail}`;
    let user = await cacheService.get(cacheKey);

    if (!user) {
      // Cache miss — fetch from PostgreSQL
      user = await datingPrisma.user.findFirst({
        where: {
          OR: [
            { email: userEmail },
            ...(decoded.uid ? [{ googleId: decoded.uid }] : [])
          ]
        }
      });

      if (!user) {
        // Auto-provision: first time this user accesses the Social Hub
        user = await datingPrisma.user.create({
          data: {
            name: decoded.name || userEmail.split('@')[0],
            email: userEmail,
            googleId: decoded.uid || null,
            profilePicture: decoded.picture || ''
          }
        });
      } else if (decoded.uid && !user.googleId) {
        // Backfill missing googleId safely
        try {
          user = await datingPrisma.user.update({
            where: { id: user.id },
            data: { googleId: decoded.uid }
          });
        } catch (updateErr) {
          console.warn('Could not backfill googleId:', updateErr.message);
        }
      }

      // Cache the user object for 5 minutes
      await cacheService.set(cacheKey, user, 300);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Dating auth error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = datingAuth;
