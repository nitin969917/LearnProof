const jwt = require('jsonwebtoken');
const datingPrisma = require('../utils/datingPrisma');
const { verifyFirebaseToken } = require('./auth');
const cacheService = require('../services/cache.service');

const JWT_SECRET = process.env.JWT_SECRET || 'learnproof_default_secret_9988';

const datingAuth = async (req, res, next) => {
  let idToken = req.body.idToken || req.query.idToken || req.headers['authorization']?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(idToken, JWT_SECRET);
    } catch (jwtErr) {
      // Fallback to Google/Firebase verification
      const googleDecoded = await verifyFirebaseToken(idToken);
      decoded = {
        email: googleDecoded.email,
        uid: googleDecoded.uid,
        name: googleDecoded.name,
        picture: googleDecoded.picture
      };
    }

    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    // ── Redis cache: avoid DB hit on every request ─────────────────────────
    // Each authenticated page load makes 3-5 API calls. Without caching, each
    // call hits the DB just to find the user. Cache for 5 minutes.
    const cacheKey = `social:user:email:${decoded.email}`;
    let user = await cacheService.get(cacheKey);

    if (!user) {
      // Cache miss — fetch from PostgreSQL
      user = await datingPrisma.user.findFirst({
        where: {
          OR: [
            { email: decoded.email },
            { googleId: decoded.uid }
          ]
        }
      });

      if (!user) {
        // Auto-provision: first time this user accesses the Social Hub
        user = await datingPrisma.user.create({
          data: {
            name: decoded.name || decoded.email.split('@')[0],
            email: decoded.email,
            googleId: decoded.uid || null,
            profilePicture: decoded.picture || ''
          }
        });
      } else if (decoded.uid && !user.googleId) {
        // Backfill missing googleId
        user = await datingPrisma.user.update({
          where: { id: user.id },
          data: { googleId: decoded.uid }
        });
      }

      // Cache the user object for 5 minutes
      // Invalidated on profile update (invalidateProfileCache deletes 'social:user:email:*')
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
