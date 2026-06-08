const jwt = require('jsonwebtoken');
const datingPrisma = require('../utils/datingPrisma');
const JWT_SECRET = process.env.JWT_SECRET || 'learnproof_default_secret_9988';

const datingAuth = async (req, res, next) => {
  let idToken = req.body.idToken || req.query.idToken || req.headers['authorization']?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(idToken, JWT_SECRET);
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
