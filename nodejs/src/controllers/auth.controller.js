const prisma = require('../lib/prisma');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const matrixService = require('../services/matrix.service');
const cacheService = require('../services/cache.service');
const emailService = require('../services/email.service');
const JWT_SECRET = process.env.JWT_SECRET || 'learnproof_default_secret_9988';

/**
 * Authentication & Profile Controller
 */
const loginOrRegister = async (req, res) => {
    const isPrem = Boolean(req.user?.is_premium || req.user?.isPremium);
    const expiresAt = req.user?.premium_expires_at || req.user?.premiumExpiresAt;
    const isPremiumActive = isPrem && (!expiresAt || new Date(expiresAt) > new Date());
    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))) : null;

    const responseData = {
        ...req.user,
        is_premium: isPremiumActive,
        isPremium: isPremiumActive,
        premium_tier: req.user?.premium_tier || 'campus_pro',
        premiumTier: req.user?.premium_tier || 'campus_pro',
        premium_expires_at: expiresAt,
        premiumExpiresAt: expiresAt,
        days_remaining: daysRemaining,
        daysRemaining,
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
    const isPrem = Boolean(req.user?.is_premium || req.user?.isPremium);
    const expiresAt = req.user?.premium_expires_at || req.user?.premiumExpiresAt;
    const isPremiumActive = isPrem && (!expiresAt || new Date(expiresAt) > new Date());
    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))) : null;

    const responseData = {
        ...req.user,
        is_premium: isPremiumActive,
        isPremium: isPremiumActive,
        premium_tier: req.user?.premium_tier || 'campus_pro',
        premiumTier: req.user?.premium_tier || 'campus_pro',
        premium_expires_at: expiresAt,
        premiumExpiresAt: expiresAt,
        days_remaining: daysRemaining,
        daysRemaining
    };

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
        const totalUsers = await cacheService.getOrSet('public:stats:total_users', async () => {
            return await prisma.userProfile.count();
        }, 600); // 10 minutes Redis cache
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
        await prisma.userDailyGoal.deleteMany({ where: { userId } }).catch(() => {});

        // Delete from social datingPrisma if present
        try {
            const datingPrisma = require('../utils/datingPrisma');
            const socialUser = await datingPrisma.user.findFirst({
                where: { OR: [{ email: req.user.email }, { googleId: userUid }] }
            });
            if (socialUser) {
                await datingPrisma.message.deleteMany({
                    where: { OR: [{ senderId: socialUser.id }, { receiverId: socialUser.id }] }
                }).catch(() => {});
                await datingPrisma.crush.deleteMany({
                    where: { OR: [{ senderId: socialUser.id }, { receiverId: socialUser.id }] }
                }).catch(() => {});
                await datingPrisma.closeFriendRequest.deleteMany({
                    where: { OR: [{ senderId: socialUser.id }, { receiverId: socialUser.id }] }
                }).catch(() => {});
                await datingPrisma.groupMessage.deleteMany({ where: { senderId: socialUser.id } }).catch(() => {});
                await datingPrisma.groupMember.deleteMany({ where: { userId: socialUser.id } }).catch(() => {});
                await datingPrisma.languageRoom.deleteMany({ where: { hostId: socialUser.id } }).catch(() => {});
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

const renderAuthBridgeHtml = ({ title, message, deepLink, isError = false }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #fff7ed;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            text-align: center;
        }
        .card {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid ${isError ? '#fecaca' : '#fed7aa'};
            border-radius: 28px;
            padding: 36px 28px;
            max-width: 380px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
        }
        .icon-wrap { margin-bottom: 20px; }
        .spinner {
            width: 38px;
            height: 38px;
            border: 3.5px solid rgba(249, 115, 22, 0.2);
            border-top-color: #f97316;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }
        .error-icon {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #fee2e2;
            color: #dc2626;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        p { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .btn {
            display: block;
            width: 100%;
            background: ${isError ? '#ef4444' : '#f97316'};
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            padding: 14px 20px;
            border-radius: 14px;
            box-shadow: 0 4px 14px ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'};
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-wrap">
            ${isError ? '<div class="error-icon">!</div>' : '<div class="spinner"></div>'}
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a id="openBtn" class="btn" href="${deepLink}">${isError ? 'Return to App' : 'Open LearnProof AI'}</a>
    </div>
    <script>
        function launch() {
            try {
                window.location.href = "${deepLink}";
            } catch (_) {}
        }
        launch();
        setTimeout(launch, 300);
        setTimeout(launch, 1000);
    </script>
</body>
</html>`;
};

// GET /api/auth/linkedin/callback
// Native iOS/Android OAuth callback — exchanges code, stores JWT in Redis (for backup polling),
// and delivers to the app via both an HTML bridge page (invoking deep link) and Redis session polling.
const handleLinkedInNativeCallback = async (req, res) => {
    const { code, error, error_description, state } = req.query;

    if (error || !code) {
        const errorMsg = error_description || error || 'Login cancelled';
        if (state) await cacheService.set(`linkedin_session:${state}`, { error: errorMsg }, 300);
        const deepLink = `learnproofai://auth/linkedin?error=${encodeURIComponent(errorMsg)}`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderAuthBridgeHtml({
            title: 'Authentication Cancelled',
            message: errorMsg,
            deepLink,
            isError: true
        }));
    }

    try {
        const clientId = process.env.LINKEDIN_CLIENT_ID || '77qo9l0sx1sbav';
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        if (!clientSecret) {
            const deepLink = `learnproofai://auth/linkedin?error=${encodeURIComponent('Server configuration error')}`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(renderAuthBridgeHtml({
                title: 'Configuration Error',
                message: 'Server configuration error. Please try again later.',
                deepLink,
                isError: true
            }));
        }

        const redirectUri = `${process.env.API_BASE_URL || 'https://api.learnproofai.com'}/api/auth/linkedin/callback`;
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('redirect_uri', redirectUri);

        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const access_token = tokenResponse.data?.access_token;
        if (!access_token) {
            if (state) await cacheService.set(`linkedin_session:${state}`, { error: 'Failed to get access token' }, 300);
            const deepLink = `learnproofai://auth/linkedin?error=${encodeURIComponent('Failed to get access token')}`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(renderAuthBridgeHtml({
                title: 'Authentication Failed',
                message: 'Failed to obtain access token from LinkedIn.',
                deepLink,
                isError: true
            }));
        }

        const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const userInfo = userInfoResponse.data;
        const linkedinSub = userInfo.sub;
        const uid = `linkedin_${linkedinSub}`;
        const userEmail = userInfo.email ? userInfo.email.toLowerCase() : `${linkedinSub}@linkedin.user`;
        const displayName = userInfo.name || [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') || 'LinkedIn User';
        const pictureUrl = userInfo.picture || '';

        let user = await prisma.userProfile.findUnique({ where: { uid } });
        if (!user && userEmail) user = await prisma.userProfile.findUnique({ where: { email: userEmail } });

        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await prisma.userProfile.create({
                data: { uid, email: userEmail, name: displayName, profile_pic: pictureUrl }
            });
        } else if (!user.profile_pic && pictureUrl) {
            user = await prisma.userProfile.update({ where: { id: user.id }, data: { profile_pic: pictureUrl } });
        }

        try {
            const datingPrisma = require('../utils/datingPrisma');
            const existingSocial = await datingPrisma.user.findFirst({ where: { OR: [{ email: userEmail }, { googleId: uid }] } });
            if (!existingSocial) {
                await datingPrisma.user.create({ data: { name: displayName, email: userEmail, googleId: uid, profilePicture: pictureUrl } });
            }
        } catch (e) {}

        const token = jwt.sign(
            { uid: user.uid, email: user.email, name: user.name, picture: user.profile_pic || '', id: user.id },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        await cacheService.set(`user:profile:${uid}`, user, 3600);

        // Store JWT in Redis keyed by OAuth state — app polls this for instant token receipt
        if (state) {
            await cacheService.set(`linkedin_session:${state}`, { token, isNewUser }, 300);
        }

        // Deliver HTML bridge page to close SFSafariViewController / in-app browser cleanly on iOS/Android
        const deepLink = `learnproofai://auth/linkedin?token=${encodeURIComponent(token)}&isNewUser=${isNewUser ? '1' : '0'}`;
        console.log('[LinkedIn Native Callback] Success, returning auth bridge page with deep link');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderAuthBridgeHtml({
            title: 'Authenticated!',
            message: 'Connecting your session to LearnProof AI...',
            deepLink,
            isError: false
        }));

    } catch (err) {
        console.error('[LinkedIn Native Callback] Error:', err.response?.data || err.message);
        const errMsg = err.response?.data?.error_description || err.response?.data?.error || err.message || 'Authentication failed';
        if (state) await cacheService.set(`linkedin_session:${state}`, { error: errMsg }, 300);
        const deepLink = `learnproofai://auth/linkedin?error=${encodeURIComponent(errMsg)}`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderAuthBridgeHtml({
            title: 'Authentication Failed',
            message: errMsg,
            deepLink,
            isError: true
        }));
    }
};

// GET /api/auth/linkedin/session/:sessionId
// App polls this every 1-2s after opening the in-app browser
// Returns { token, isNewUser } when ready, { pending: true } if not yet, { error } on failure
const pollLinkedInSession = async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    try {
        const data = await cacheService.get(`linkedin_session:${sessionId}`);
        if (!data) return res.status(202).json({ pending: true });

        // Retain for 60s so concurrent polls / retries don't drop the token
        try { await cacheService.set(`linkedin_session:${sessionId}`, data, 60); } catch (_) {}

        if (data.error) return res.status(400).json({ error: data.error });
        return res.status(200).json({ token: data.token, isNewUser: data.isNewUser });
    } catch (err) {
        return res.status(500).json({ error: 'Session lookup failed' });
    }
};

/**
 * In-memory fallback OTP storage to guarantee zero-failure OTP handling
 * even during transient Redis disconnects or local testing.
 */
const localOtpStore = new Map();

/**
 * Send 6-Digit Email OTP
 * POST /api/auth/email/send-otp
 */
const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Valid email address is required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        // Rate limiting: allow at most 4 OTP requests every 3 minutes per email
        const rateLimitKey = `ratelimit:email_otp:${cleanEmail}`;
        const attempts = (await cacheService.get(rateLimitKey)) || 0;
        if (attempts >= 4) {
            return res.status(429).json({ error: 'Too many verification code requests. Please wait a few minutes before trying again.' });
        }
        await cacheService.set(rateLimitKey, attempts + 1, 180);

        // Apple App Reviewer & demo account deterministic code for instant approval
        let otpCode;
        if (cleanEmail === 'apple-reviewer@learnproofai.com' || cleanEmail === 'demo@learnproofai.com') {
            otpCode = '123456';
        } else {
            // Generate secure 6-digit numeric code (100000 - 999999)
            otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const otpPayload = {
            code: otpCode,
            email: cleanEmail,
            attempts: 0,
            createdAt: Date.now()
        };

        // Cache for 5 minutes (300 seconds) in Redis
        await cacheService.set(`email_otp:${cleanEmail}`, otpPayload, 300);
        // Also mirror in local memory fallback
        localOtpStore.set(cleanEmail, { ...otpPayload, expiresAt: Date.now() + 300000 });

        // Dispatch email via Resend / EmailService / SMTP
        const emailResult = await emailService.sendOtpEmail(cleanEmail, otpCode);

        if (!emailResult?.success) {
            return res.status(400).json({ error: emailResult?.error || 'Failed to send verification code. Please check your email and try again.' });
        }

        return res.status(200).json({
            success: true,
            message: emailResult?.devMode
                ? `Verification code: ${otpCode}`
                : `Verification code sent to ${cleanEmail}`,
            devMode: Boolean(emailResult?.devMode),
            devCode: emailResult?.devMode ? otpCode : undefined
        });
    } catch (err) {
        console.error('sendEmailOtp error:', err);
        return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }
};

/**
 * Verify 6-Digit Email OTP & Sign In / Register
 * POST /api/auth/email/verify-otp
 */
const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.toString().trim();

        // Check if reviewer demo bypass
        const isReviewerDemo = (cleanEmail === 'apple-reviewer@learnproofai.com' || cleanEmail === 'demo@learnproofai.com') && cleanOtp === '123456';

        let isValid = false;

        if (isReviewerDemo) {
            isValid = true;
        } else {
            // Check Redis
            let record = await cacheService.get(`email_otp:${cleanEmail}`);
            // Fallback to local memory if Redis didn't have it
            if (!record) {
                const localRecord = localOtpStore.get(cleanEmail);
                if (localRecord && localRecord.expiresAt > Date.now()) {
                    record = localRecord;
                }
            }

            if (!record) {
                return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
            }

            if (record.code !== cleanOtp) {
                record.attempts = (record.attempts || 0) + 1;
                if (record.attempts >= 5) {
                    await cacheService.del(`email_otp:${cleanEmail}`);
                    localOtpStore.delete(cleanEmail);
                    return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new code.' });
                }
                await cacheService.set(`email_otp:${cleanEmail}`, record, 300);
                return res.status(400).json({ error: 'Incorrect verification code. Please check your email and try again.' });
            }

            isValid = true;
            // Clear used OTP
            await cacheService.del(`email_otp:${cleanEmail}`);
            localOtpStore.delete(cleanEmail);
        }

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }

        // Find or create UserProfile by email
        let user = await prisma.userProfile.findUnique({ where: { email: cleanEmail } });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const newUid = `email_${crypto.randomBytes(8).toString('hex')}`;
            const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30) || 'Student';
            const displayName = username.charAt(0).toUpperCase() + username.slice(1);
            const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

            user = await prisma.userProfile.create({
                data: {
                    uid: newUid,
                    email: cleanEmail,
                    name: displayName,
                    profile_pic: avatarUrl
                }
            });
        }

        // Sign 30-day session token (matching Google and Apple token payload)
        const sessionToken = jwt.sign(
            {
                uid: user.uid,
                email: user.email,
                name: user.name,
                picture: user.profile_pic,
                id: user.id
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Sync Matrix Chat credentials if enabled
        let matrixCredentials = null;
        try {
            if (matrixService.ENABLE_MATRIX_CHAT) {
                const cacheKey = `matrix:creds:${user.id}`;
                const cachedCreds = await cacheService.get(cacheKey);
                if (cachedCreds) {
                    matrixCredentials = cachedCreds;
                } else {
                    const matrixUsername = `user_${user.id}`;
                    const matrixPassword = crypto
                        .createHmac('sha256', JWT_SECRET)
                        .update(user.uid)
                        .digest('hex');
                    const matrixCreds = await matrixService.registerUser(matrixUsername, matrixPassword);
                    if (matrixCreds) {
                        matrixCredentials = {
                            userId: matrixCreds.userId,
                            accessToken: matrixCreds.accessToken,
                            homeserverUrl: process.env.MATRIX_CLIENT_HOMESERVER_URL || process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009'
                        };
                        await cacheService.set(cacheKey, matrixCredentials, 43200);
                    }
                }
            }
        } catch (mErr) {
            console.warn('[verifyEmailOtp] Matrix sync notice:', mErr.message);
        }

        return res.status(200).json({
            ...user,
            token: sessionToken,
            matrixCredentials,
            isNewUser
        });
    } catch (err) {
        console.error('verifyEmailOtp error:', err);
        return res.status(500).json({ error: 'Failed to complete sign in. Please try again.' });
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
    handleLinkedInNativeCallback,
    pollLinkedInSession,
    sendEmailOtp,
    verifyEmailOtp,
    deleteAccount
};


