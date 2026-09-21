const prisma = require('../lib/prisma');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const matrixService = require('../services/matrix.service');
const cacheService = require('../services/cache.service');
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
            const cacheKey = `matrix:creds:${req.user.id}`;
            const cachedCreds = await cacheService.get(cacheKey);

            if (cachedCreds) {
                responseData.matrixCredentials = cachedCreds;
            } else {
                // Generate deterministic Matrix credentials
                const matrixUsername = `user_${req.user.id}`;
                const matrixPassword = crypto
                    .createHmac('sha256', JWT_SECRET)
                    .update(req.user.uid)
                    .digest('hex');

                // Registers if new, or logs in to get fresh access token
                const matrixCreds = await matrixService.registerUser(matrixUsername, matrixPassword);
                if (matrixCreds) {
                    const credsPayload = {
                        userId: matrixCreds.userId,
                        accessToken: matrixCreds.accessToken,
                        homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                    };
                    responseData.matrixCredentials = credsPayload;
                    // Cache credentials for 12 hours in Redis
                    await cacheService.set(cacheKey, credsPayload, 43200);
                }
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
            const cacheKey = `matrix:creds:${req.user.id}`;
            const cachedCreds = await cacheService.get(cacheKey);

            if (cachedCreds) {
                responseData.matrixCredentials = cachedCreds;
            } else {
                const matrixUsername = `user_${req.user.id}`;
                const matrixPassword = crypto
                    .createHmac('sha256', JWT_SECRET)
                    .update(req.user.uid)
                    .digest('hex');

                const matrixCreds = await matrixService.loginUser(matrixUsername, matrixPassword);
                if (matrixCreds) {
                    const credsPayload = {
                        userId: matrixCreds.userId,
                        accessToken: matrixCreds.accessToken,
                        homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                    };
                    responseData.matrixCredentials = credsPayload;
                    await cacheService.set(cacheKey, credsPayload, 43200);
                }
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

/**
 * Apple Sign-In Handler (Apple Guideline 4.8)
 */
const handleAppleLogin = async (req, res) => {
    try {
        const { identityToken, user: appleUserObj, fullName, email } = req.body;
        if (!identityToken) {
            return res.status(400).json({ error: 'Missing Apple identity token' });
        }

        // Decode the Apple JWT identity token
        const decoded = jwt.decode(identityToken);
        if (!decoded || !decoded.sub) {
            return res.status(400).json({ error: 'Invalid Apple identity token payload' });
        }

        const appleSub = decoded.sub;
        const uid = `apple_${appleSub}`;
        const userEmail = decoded.email || email || `${appleSub}@privaterelay.apple.com`;
        
        let displayName = 'Apple User';
        if (fullName && (fullName.givenName || fullName.familyName)) {
            displayName = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ');
        } else if (email && email.includes('@')) {
            displayName = email.split('@')[0];
        }

        // Check if user already exists by uid or email
        let user = await prisma.userProfile.findUnique({ where: { uid } });
        if (!user && userEmail) {
            user = await prisma.userProfile.findUnique({ where: { email: userEmail } });
        }

        if (!user) {
            user = await prisma.userProfile.create({
                data: {
                    uid,
                    email: userEmail,
                    name: displayName,
                    profile_pic: ''
                }
            });
        }

        // Cache profile
        const cacheKey = `user:profile:${uid}`;
        await cacheService.set(cacheKey, user, 3600);

        // Generate 30-day session token
        const newSessionToken = jwt.sign(
            { uid: user.uid, email: user.email, name: user.name, picture: user.profile_pic || '', id: user.id },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const responseData = {
            ...user,
            token: newSessionToken
        };

        // Provision Matrix chat if enabled
        if (matrixService.ENABLE_MATRIX_CHAT) {
            try {
                const matrixCacheKey = `matrix:creds:${user.id}`;
                const cachedCreds = await cacheService.get(matrixCacheKey);
                if (cachedCreds) {
                    responseData.matrixCredentials = cachedCreds;
                } else {
                    const matrixUsername = `user_${user.id}`;
                    const matrixPassword = crypto
                        .createHmac('sha256', JWT_SECRET)
                        .update(user.uid)
                        .digest('hex');
                    const matrixCreds = await matrixService.registerUser(matrixUsername, matrixPassword);
                    if (matrixCreds) {
                        const credsPayload = {
                            userId: matrixCreds.userId,
                            accessToken: matrixCreds.accessToken,
                            homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                        };
                        responseData.matrixCredentials = credsPayload;
                        await cacheService.set(matrixCacheKey, credsPayload, 43200);
                    }
                }
            } catch (matrixErr) {
                console.warn('Matrix sync warning on Apple login:', matrixErr.message);
            }
        }

        return res.status(200).json(responseData);
    } catch (err) {
        console.error('Apple Sign-In error:', err);
        return res.status(500).json({ error: 'Failed to authenticate with Apple', details: err.message });
    }
};

/**
 * Apple Reviewer Demo Account Handler (For fast Apple App Store approval without 2FA blockers)
 */
const handleDemoReviewerLogin = async (req, res) => {
    try {
        const demoUid = 'apple_reviewer_demo_2026';
        const demoEmail = 'apple-reviewer@learnproofai.com';
        
        let user = await prisma.userProfile.findUnique({ where: { uid: demoUid } });
        if (!user) {
            user = await prisma.userProfile.create({
                data: {
                    uid: demoUid,
                    email: demoEmail,
                    name: 'Apple App Reviewer',
                    profile_pic: 'https://api.dicebear.com/7.x/bottts/svg?seed=AppleReview'
                }
            });
        }

        const newSessionToken = jwt.sign(
            { uid: user.uid, email: user.email, name: user.name, picture: user.profile_pic, id: user.id },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(200).json({
            ...user,
            token: newSessionToken
        });
    } catch (err) {
        console.error('Demo reviewer login error:', err);
        return res.status(500).json({ error: 'Failed to access demo reviewer account' });
    }
};

/**
 * In-App Account Deletion (Apple Guideline 5.1.1(v))
 */
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userUid = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log(`[Account Deletion] Initiating permanent deletion for user ID ${userId}, UID: ${userUid}`);

        // Delete user-related records safely
        await prisma.userActivityLog.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.videoNote.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.videoComment.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.userFcmToken.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.messageReadStatus.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.certificateRequest.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.certificate.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.quiz.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.video.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.playlist.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.supportTicket.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.workspace.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.referralCode.deleteMany({ where: { userId } }).catch(() => {});

        // Delete from social datingPrisma if present
        try {
            const datingPrisma = require('../utils/datingPrisma');
            const socialUser = await datingPrisma.user.findFirst({
                where: { OR: [{ email: req.user.email }, { googleId: userUid }] }
            });
            if (socialUser) {
                await datingPrisma.post.deleteMany({ where: { userId: socialUser.id } }).catch(() => {});
                await datingPrisma.comment.deleteMany({ where: { userId: socialUser.id } }).catch(() => {});
                await datingPrisma.friendship.deleteMany({
                    where: { OR: [{ senderId: socialUser.id }, { receiverId: socialUser.id }] }
                }).catch(() => {});
                await datingPrisma.user.delete({ where: { id: socialUser.id } }).catch(() => {});
            }
        } catch (e) {
            console.warn('[Account Deletion] Social DB delete skipped:', e.message);
        }

        // Delete main UserProfile
        await prisma.userProfile.delete({ where: { id: userId } });

        // Invalidate Redis caches
        await cacheService.del(`user:profile:${userUid}`);
        await cacheService.del(`matrix:creds:${userId}`);
        await cacheService.del(`social:user:email:${req.user.email}`);

        return res.status(200).json({
            success: true,
            message: 'Your account and all associated data have been permanently deleted.'
        });
    } catch (err) {
        console.error('[Account Deletion] Error during account deletion:', err);
        return res.status(500).json({ error: 'Failed to delete account', details: err.message });
    }
};

/**
 * LinkedIn Sign-In Handler (OpenID Connect)
 */
const handleLinkedInLogin = async (req, res) => {
    try {
        const { code, redirectUri, accessToken } = req.body;
        if (!code && !accessToken) {
            return res.status(400).json({ error: 'Missing LinkedIn authorization code or access token' });
        }

        let access_token = accessToken;

        if (!access_token) {
            const clientId = process.env.LINKEDIN_CLIENT_ID || '77qo9l0sx1sbav';
            const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
            if (!clientSecret) {
                console.error('[LinkedIn Auth] Missing LINKEDIN_CLIENT_SECRET in environment');
                return res.status(500).json({ error: 'LinkedIn authentication is not properly configured on server' });
            }
            const targetRedirectUri = redirectUri || process.env.LINKEDIN_REDIRECT_URI || 'https://learnproofai.com/auth/linkedin/callback';

            // 1. Exchange authorization code for LinkedIn access token
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('redirect_uri', targetRedirectUri);

            const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            access_token = tokenResponse.data?.access_token;
            if (!access_token) {
                return res.status(400).json({ error: 'Failed to retrieve access token from LinkedIn' });
            }
        }

        // 2. Fetch User Profile Info via OpenID Connect UserInfo endpoint
        const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const userInfo = userInfoResponse.data;
        console.log('[LinkedIn Auth] UserInfo received:', userInfo.sub, userInfo.email, userInfo.name);

        const linkedinSub = userInfo.sub;
        const uid = `linkedin_${linkedinSub}`;
        const userEmail = userInfo.email ? userInfo.email.toLowerCase() : `${linkedinSub}@linkedin.user`;
        const displayName = userInfo.name || [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') || 'LinkedIn User';
        const pictureUrl = userInfo.picture || '';

        // 3. Check if user already exists by uid or email in UserProfile
        let user = await prisma.userProfile.findUnique({ where: { uid } });
        if (!user && userEmail) {
            user = await prisma.userProfile.findUnique({ where: { email: userEmail } });
        }

        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await prisma.userProfile.create({
                data: {
                    uid,
                    email: userEmail,
                    name: displayName,
                    profile_pic: pictureUrl
                }
            });
        } else if (!user.profile_pic && pictureUrl) {
            user = await prisma.userProfile.update({
                where: { id: user.id },
                data: { profile_pic: pictureUrl }
            });
        }

        // Also ensure user exists in social users DB (datingPrisma)
        try {
            const datingPrisma = require('../utils/datingPrisma');
            const existingSocial = await datingPrisma.user.findFirst({
                where: { OR: [{ email: userEmail }, { googleId: uid }] }
            });
            if (!existingSocial) {
                await datingPrisma.user.create({
                    data: {
                        name: displayName,
                        email: userEmail,
                        googleId: uid,
                        profilePicture: pictureUrl
                    }
                });
            }
        } catch (socialErr) {
            console.warn('[LinkedIn Auth] Social user sync skipped/warning:', socialErr.message);
        }

        // Cache profile in Redis
        const cacheKey = `user:profile:${uid}`;
        await cacheService.set(cacheKey, user, 3600);

        // Generate standard 30-day session token
        const newSessionToken = jwt.sign(
            { uid: user.uid, email: user.email, name: user.name, picture: user.profile_pic || '', id: user.id },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const responseData = {
            ...user,
            token: newSessionToken,
            isNewUser
        };

        // Provision Matrix chat if enabled
        if (matrixService.ENABLE_MATRIX_CHAT) {
            try {
                const matrixCacheKey = `matrix:creds:${user.id}`;
                const cachedCreds = await cacheService.get(matrixCacheKey);
                if (cachedCreds) {
                    responseData.matrixCredentials = cachedCreds;
                } else {
                    const matrixUsername = `user_${user.id}`;
                    const matrixPassword = crypto
                        .createHmac('sha256', JWT_SECRET)
                        .update(user.uid)
                        .digest('hex');
                    const matrixCreds = await matrixService.registerUser(matrixUsername, matrixPassword);
                    if (matrixCreds) {
                        const credsPayload = {
                            userId: matrixCreds.userId,
                            accessToken: matrixCreds.accessToken,
                            homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                        };
                        responseData.matrixCredentials = credsPayload;
                        await cacheService.set(matrixCacheKey, credsPayload, 43200);
                    }
                }
            } catch (matrixErr) {
                console.warn('Matrix sync warning on LinkedIn login:', matrixErr.message);
            }
        }

        return res.status(200).json(responseData);
    } catch (err) {
        console.error('LinkedIn Sign-In error:', err.response?.data || err.message);
        return res.status(500).json({ 
            error: 'Failed to authenticate with LinkedIn', 
            details: err.response?.data?.error_description || err.message 
        });
    }
};

module.exports = {
    loginOrRegister,
    getProfile,
    handleGoogleCallback,
    getPublicStats,
    handleAppleLogin,
    handleDemoReviewerLogin,
    handleLinkedInLogin,
    deleteAccount
};
