const prisma = require('../lib/prisma');

/**
 * Clean and normalize referral code format
 */
const normalizeCode = (code) => {
    if (!code) return '';
    return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
};

/**
 * Public: Track click on a referral link
 * POST /api/referrals/track-click
 * Body: { code }
 */
const trackClick = async (req, res) => {
    try {
        const { code } = req.body;
        const normalized = normalizeCode(code);

        if (!normalized) {
            return res.status(400).json({ error: 'Referral code is required' });
        }

        const referral = await prisma.referralCode.findFirst({
            where: {
                code: {
                    equals: normalized,
                    mode: 'insensitive'
                },
                isActive: true
            }
        });

        if (!referral) {
            return res.status(404).json({ error: 'Referral code not found or inactive' });
        }

        // Increment click count atomically
        const updated = await prisma.referralCode.update({
            where: { id: referral.id },
            data: { clicksCount: { increment: 1 } },
            select: {
                id: true,
                code: true,
                title: true,
                category: true,
                creatorName: true,
                targetCollege: true,
                clicksCount: true
            }
        });

        return res.status(200).json({
            success: true,
            referral: updated
        });
    } catch (error) {
        console.error('Error in trackClick:', error);
        return res.status(500).json({ error: 'Failed to record referral click' });
    }
};

/**
 * Authenticated: Attribute new user signup to a referral code
 * POST /api/referrals/attribute
 * Body: { code }
 */
const attributeReferral = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { code } = req.body;
        const normalized = normalizeCode(code);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!normalized) {
            return res.status(400).json({ error: 'Referral code is required' });
        }

        // Check if user is already attributed to any referral code (Strict 1-attribution guarantee)
        const existingAttribution = await prisma.referralAttribution.findUnique({
            where: { referredUserId: userId },
            include: {
                referralCode: {
                    select: { code: true, title: true }
                }
            }
        });

        if (existingAttribution) {
            return res.status(200).json({
                success: true,
                alreadyAttributed: true,
                message: 'User already attributed to a referral code',
                code: existingAttribution.referralCode.code
            });
        }

        // Find the active referral code
        const referral = await prisma.referralCode.findFirst({
            where: {
                code: {
                    equals: normalized,
                    mode: 'insensitive'
                },
                isActive: true
            }
        });

        if (!referral) {
            return res.status(404).json({ error: 'Invalid or inactive referral code' });
        }

        // Prevent self-referral
        if (referral.referrerId === userId) {
            return res.status(400).json({ error: 'You cannot refer yourself' });
        }

        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        // Atomic transaction: create attribution record + increment signup counter
        const [attribution, updatedReferral] = await prisma.$transaction([
            prisma.referralAttribution.create({
                data: {
                    referralCodeId: referral.id,
                    referredUserId: userId,
                    ipAddress: clientIp,
                    metadata: JSON.stringify({ userAgent, timestamp: new Date().toISOString() })
                }
            }),
            prisma.referralCode.update({
                where: { id: referral.id },
                data: { signupCount: { increment: 1 } }
            })
        ]);

        return res.status(201).json({
            success: true,
            message: 'Referral attributed successfully',
            code: referral.code,
            campaign: referral.title || referral.creatorName
        });
    } catch (error) {
        console.error('Error in attributeReferral:', error);
        if (error.code === 'P2002') {
            return res.status(200).json({
                success: true,
                alreadyAttributed: true,
                message: 'Referral attribution already registered'
            });
        }
        return res.status(500).json({ error: 'Failed to attribute referral' });
    }
};

/**
 * Authenticated: Get or create student's personal shareable referral link
 * GET /api/referrals/my-code
 */
const getMyReferralCode = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userName = req.user?.name || 'STUDENT';

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let referral = await prisma.referralCode.findFirst({
            where: { referrerId: userId }
        });

        if (!referral) {
            // Generate clean unique code e.g. NITIN729
            const sanitizedPrefix = userName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'LEARN';
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            let candidateCode = `${sanitizedPrefix}${randomSuffix}`;

            // Ensure uniqueness
            let attempts = 0;
            while (attempts < 5) {
                const check = await prisma.referralCode.findUnique({ where: { code: candidateCode } });
                if (!check) break;
                candidateCode = `${sanitizedPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
                attempts++;
            }

            referral = await prisma.referralCode.create({
                data: {
                    code: candidateCode,
                    category: 'student',
                    title: `${userName}'s Student Referral`,
                    creatorName: userName,
                    referrerId: userId,
                    isActive: true
                }
            });
        }

        // Fetch recent users referred by this student
        const recentAttributions = await prisma.referralAttribution.findMany({
            where: { referralCodeId: referral.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                referredUser: {
                    select: {
                        id: true,
                        name: true,
                        profile_pic: true,
                        joined_at: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            referralCode: referral.code,
            clicksCount: referral.clicksCount,
            signupCount: referral.signupCount,
            recentSignups: recentAttributions.map(a => ({
                id: a.referredUser.id,
                name: a.referredUser.name,
                profile_pic: a.referredUser.profile_pic,
                joinedAt: a.createdAt
            }))
        });
    } catch (error) {
        console.error('Error in getMyReferralCode:', error);
        return res.status(500).json({ error: 'Failed to retrieve personal referral code' });
    }
};

/**
 * Admin: Get overall statistics & KPI overview
 * GET /api/admin/referrals/stats
 */
const getAdminReferralStats = async (req, res) => {
    try {
        const [
            totalCampaigns,
            totalClicksAgg,
            totalSignupsAgg,
            ambassadorsCount,
            creatorsCount,
            studentsCount,
            topReferrers,
            recentAttributions
        ] = await Promise.all([
            prisma.referralCode.count(),
            prisma.referralCode.aggregate({ _sum: { clicksCount: true } }),
            prisma.referralAttribution.count(),
            prisma.referralCode.count({ where: { category: 'ambassador' } }),
            prisma.referralCode.count({ where: { category: 'creator' } }),
            prisma.referralCode.count({ where: { category: 'student' } }),
            prisma.referralCode.findMany({
                orderBy: { signupCount: 'desc' },
                take: 5,
                select: {
                    id: true,
                    code: true,
                    title: true,
                    category: true,
                    creatorName: true,
                    targetCollege: true,
                    clicksCount: true,
                    signupCount: true,
                    isActive: true
                }
            }),
            prisma.referralAttribution.findMany({
                orderBy: { createdAt: 'desc' },
                take: 15,
                include: {
                    referralCode: {
                        select: {
                            code: true,
                            title: true,
                            category: true,
                            creatorName: true,
                            targetCollege: true
                        }
                    },
                    referredUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profile_pic: true,
                            joined_at: true
                        }
                    }
                }
            })
        ]);

        const totalClicks = totalClicksAgg._sum.clicksCount || 0;
        const totalSignups = totalSignupsAgg || 0;
        const conversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : 0;

        return res.status(200).json({
            success: true,
            metrics: {
                totalCampaigns,
                totalClicks,
                totalSignups,
                conversionRate: Number(conversionRate),
                ambassadorsCount,
                creatorsCount,
                studentsCount
            },
            topReferrers,
            recentAttributions
        });
    } catch (error) {
        console.error('Error in getAdminReferralStats:', error);
        return res.status(500).json({ error: 'Failed to fetch referral analytics' });
    }
};

/**
 * Admin: Get paginated list of all referral codes with filters
 * GET /api/admin/referrals/codes
 */
const getAdminReferralCodes = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (category && category !== 'all') {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { creatorName: { contains: search, mode: 'insensitive' } },
                { targetCollege: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [total, codes] = await Promise.all([
            prisma.referralCode.count({ where }),
            prisma.referralCode.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    referrer: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    _count: {
                        select: { attributions: true }
                    }
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            codes
        });
    } catch (error) {
        console.error('Error in getAdminReferralCodes:', error);
        return res.status(500).json({ error: 'Failed to fetch referral codes' });
    }
};

/**
 * Admin: Create custom Referral / Ambassador campaign
 * POST /api/admin/referrals/codes
 */
const createAdminReferralCode = async (req, res) => {
    try {
        const {
            code,
            category = 'ambassador',
            title,
            creatorName,
            targetCollege,
            rewardNotes
        } = req.body;

        const normalizedCode = normalizeCode(code);
        if (!normalizedCode || normalizedCode.length < 3) {
            return res.status(400).json({ error: 'Referral code must be at least 3 alphanumeric characters' });
        }

        const existing = await prisma.referralCode.findUnique({
            where: { code: normalizedCode }
        });

        if (existing) {
            return res.status(400).json({ error: `Referral code '${normalizedCode}' already exists` });
        }

        const newCode = await prisma.referralCode.create({
            data: {
                code: normalizedCode,
                category: category || 'ambassador',
                title: title?.trim() || `${creatorName || normalizedCode} Campaign`,
                creatorName: creatorName?.trim() || null,
                targetCollege: targetCollege?.trim() || null,
                rewardNotes: rewardNotes?.trim() || null,
                isActive: true
            }
        });

        return res.status(201).json({
            success: true,
            referralCode: newCode
        });
    } catch (error) {
        console.error('Error in createAdminReferralCode:', error);
        return res.status(500).json({ error: 'Failed to create referral campaign' });
    }
};

/**
 * Admin: Toggle active status
 * PUT /api/admin/referrals/codes/:id/toggle
 */
const toggleReferralCodeStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const referral = await prisma.referralCode.findUnique({ where: { id } });

        if (!referral) {
            return res.status(404).json({ error: 'Referral code not found' });
        }

        const updated = await prisma.referralCode.update({
            where: { id },
            data: { isActive: !referral.isActive }
        });

        return res.status(200).json({
            success: true,
            isActive: updated.isActive,
            referralCode: updated
        });
    } catch (error) {
        console.error('Error in toggleReferralCodeStatus:', error);
        return res.status(500).json({ error: 'Failed to toggle referral status' });
    }
};

/**
 * Admin: Delete a referral campaign
 * DELETE /api/admin/referrals/codes/:id
 */
const deleteAdminReferralCode = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.referralCode.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Referral code deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteAdminReferralCode:', error);
        return res.status(500).json({ error: 'Failed to delete referral code' });
    }
};

module.exports = {
    trackClick,
    attributeReferral,
    getMyReferralCode,
    getAdminReferralStats,
    getAdminReferralCodes,
    createAdminReferralCode,
    toggleReferralCodeStatus,
    deleteAdminReferralCode
};
