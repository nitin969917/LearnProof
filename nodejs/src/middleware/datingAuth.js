const jwt = require('jsonwebtoken');
const datingPrisma = require('../utils/datingPrisma');
const { verifyFirebaseToken } = require('./auth');
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
      // Fallback to Google verification
      console.log('[Dating Auth] Not a custom JWT, falling back to Google verification...');
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

    // Provision or fetch SQLite user
    let user = await datingPrisma.user.findFirst({
      where: {
        OR: [
          { email: decoded.email },
          { googleId: decoded.uid }
        ]
      }
    });

    if (!user) {
      user = await datingPrisma.user.create({
        data: {
          name: decoded.name || decoded.email.split('@')[0],
          email: decoded.email,
          googleId: decoded.uid || null,
          profilePicture: decoded.picture || ''
        }
      });
    } else if (decoded.uid && !user.googleId) {
      user = await datingPrisma.user.update({
        where: { id: user.id },
        data: { googleId: decoded.uid }
      });
    }

    req.user = user; // Set SQLite User object
    next();
  } catch (err) {
    console.error('Dating auth error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = datingAuth;
