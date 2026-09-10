const prisma = require('../lib/prisma');
const cacheService = require('../services/cache.service');

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

        const cacheKey = `referral:mycode:${userId}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
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

        const responsePayload = {
            success: true,
            referralCode: referral.code,
            category: referral.category,
            title: referral.title,
            creatorName: referral.creatorName,
            targetCollege: referral.targetCollege,
            clicksCount: referral.clicksCount,
            signupCount: referral.signupCount,
            rewardNotes: referral.rewardNotes,
            createdAt: referral.createdAt,
            recentSignups: recentAttributions.map(a => ({
                id: a.referredUser.id,
                name: a.referredUser.name,
                profile_pic: a.referredUser.profile_pic,
                joinedAt: a.createdAt
            }))
        };

        await cacheService.set(cacheKey, responsePayload, 600); // 10 mins cache

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error('Error in getMyReferralCode:', error);
        return res.status(500).json({ error: 'Failed to retrieve personal referral code' });
    }
};

/**
 * Authenticated: Customize or upgrade personal referral code / Ambassador profile
 * PUT /api/referrals/my-code
 * Body: { code, category, title, creatorName, targetCollege }
 */
const updateMyReferralCode = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { code, category, title, creatorName, targetCollege } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const normalizedCode = code ? normalizeCode(code) : null;
        if (normalizedCode && normalizedCode.length < 3) {
            return res.status(400).json({ error: 'Referral code must be at least 3 alphanumeric characters' });
        }

        let existing = await prisma.referralCode.findFirst({
            where: { referrerId: userId }
        });

        // If code is being changed, check uniqueness
        if (normalizedCode && (!existing || existing.code !== normalizedCode)) {
            const conflict = await prisma.referralCode.findUnique({
                where: { code: normalizedCode }
            });
            if (conflict && conflict.referrerId !== userId) {
                return res.status(400).json({ error: `Referral code '${normalizedCode}' is already taken. Try another.` });
            }
        }

        let updated;
        if (existing) {
            updated = await prisma.referralCode.update({
                where: { id: existing.id },
                data: {
                    ...(normalizedCode ? { code: normalizedCode } : {}),
                    ...(category ? { category } : {}),
                    ...(title ? { title: title.trim() } : {}),
                    ...(creatorName ? { creatorName: creatorName.trim() } : {}),
                    ...(targetCollege !== undefined ? { targetCollege: targetCollege?.trim() || null } : {})
                }
            });
        } else {
            updated = await prisma.referralCode.create({
                data: {
                    code: normalizedCode || `USER${userId}${Math.floor(100 + Math.random() * 900)}`,
                    category: category || 'ambassador',
                    title: title?.trim() || `${creatorName || req.user?.name || 'Ambassador'} Campaign`,
                    creatorName: creatorName?.trim() || req.user?.name || null,
                    targetCollege: targetCollege?.trim() || null,
                    referrerId: userId,
                    isActive: true
                }
            });
        }
        await cacheService.del(`referral:mycode:${userId}`);

        return res.status(200).json({
            success: true,
            message: 'Ambassador profile updated successfully',
            referralCode: updated.code,
            category: updated.category,
            title: updated.title,
            creatorName: updated.creatorName,
            targetCollege: updated.targetCollege,
            clicksCount: updated.clicksCount,
            signupCount: updated.signupCount
        });
    } catch (error) {
        console.error('Error in updateMyReferralCode:', error);
        return res.status(500).json({ error: 'Failed to update referral code' });
    }
};

/**
 * Public: Leaderboard for Campus Ambassadors & Creators
 * GET /api/referrals/leaderboard
 */
const getLeaderboard = async (req, res) => {
    try {
        const topAmbassadors = await prisma.referralCode.findMany({
            where: {
                isActive: true,
                signupCount: { gt: 0 }
            },
            orderBy: [
                { signupCount: 'desc' },
                { clicksCount: 'desc' }
            ],
            take: 10,
            select: {
                id: true,
                code: true,
                title: true,
                category: true,
                creatorName: true,
                targetCollege: true,
                signupCount: true,
                clicksCount: true,
                referrer: {
                    select: {
                        name: true,
                        profile_pic: true
                    }
                }
            }
        });

        const formatted = topAmbassadors.map((item, index) => ({
            rank: index + 1,
            name: item.creatorName || item.referrer?.name || 'Anonymous Ambassador',
            avatar: item.referrer?.profile_pic || null,
            college: item.targetCollege || 'Community Lead',
            category: item.category,
            signups: item.signupCount,
            clicks: item.clicksCount
        }));

        return res.status(200).json({
            success: true,
            leaderboard: formatted
        });
    } catch (error) {
        console.error('Error in getLeaderboard:', error);
        return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

/**
 * Public: General Program Metrics for Landing Page
 * GET /api/referrals/public-info
 */
const getPublicProgramInfo = async (req, res) => {
    try {
        const [totalAmbassadors, totalSignupsAgg, totalColleges] = await Promise.all([
            prisma.referralCode.count({ where: { isActive: true } }),
            prisma.referralAttribution.count(),
            prisma.referralCode.groupBy({
                by: ['targetCollege'],
                where: {
                    targetCollege: { not: null },
                    isActive: true
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            totalAmbassadors: Math.max(totalAmbassadors, 120),
            totalStudentsReferred: Math.max(totalSignupsAgg, 1500),
            collegesRepresented: Math.max(totalColleges.length, 35)
        });
    } catch (error) {
        console.error('Error in getPublicProgramInfo:', error);
        return res.status(200).json({
            success: true,
            totalAmbassadors: 120,
            totalStudentsReferred: 1500,
            collegesRepresented: 35
        });
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
 * Admin: Update referral campaign (category, code, target college, title, status)
 * PUT /api/admin/referrals/codes/:id
 */
const updateAdminReferralCode = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            code,
            category,
            title,
            creatorName,
            targetCollege,
            rewardNotes,
            isActive
        } = req.body;

        const referral = await prisma.referralCode.findUnique({ where: { id } });
        if (!referral) {
            return res.status(404).json({ error: 'Referral code not found' });
        }

        let normalizedCode;
        if (code) {
            normalizedCode = normalizeCode(code);
            if (normalizedCode && normalizedCode !== referral.code) {
                const conflict = await prisma.referralCode.findUnique({
                    where: { code: normalizedCode }
                });
                if (conflict && conflict.id !== id) {
                    return res.status(400).json({ error: `Code '${normalizedCode}' is already in use by another user` });
                }
            }
        }

        const updated = await prisma.referralCode.update({
            where: { id },
            data: {
                ...(category ? { category } : {}),
                ...(normalizedCode ? { code: normalizedCode } : {}),
                ...(title !== undefined ? { title: title ? title.trim() : null } : {}),
                ...(creatorName !== undefined ? { creatorName: creatorName ? creatorName.trim() : null } : {}),
                ...(targetCollege !== undefined ? { targetCollege: targetCollege ? targetCollege.trim() : null } : {}),
                ...(rewardNotes !== undefined ? { rewardNotes: rewardNotes ? rewardNotes.trim() : null } : {}),
                ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
            },
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
        });

        return res.status(200).json({
            success: true,
            message: `Referral code updated to ${updated.category} successfully`,
            referralCode: updated
        });
    } catch (error) {
        console.error('Error in updateAdminReferralCode:', error);
        return res.status(500).json({ error: 'Failed to update referral code' });
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

/**
 * Admin: Get all ambassador groups with aggregated metrics
 * GET /api/referrals/admin/groups
 */
const getAdminAmbassadorGroups = async (req, res) => {
    try {
        const groups = await prisma.ambassadorGroup.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                members: {
                    include: {
                        referralCode: {
                            include: {
                                referrer: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        profile_pic: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const formattedGroups = groups.map(group => {
            const membersList = group.members.map(m => m.referralCode).filter(Boolean);
            const totalClicks = membersList.reduce((acc, curr) => acc + (curr.clicksCount || 0), 0);
            const totalSignups = membersList.reduce((acc, curr) => acc + (curr.signupCount || 0), 0);
            const conversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : 0;

            // Find top performer in group
            let topMember = null;
            if (membersList.length > 0) {
                topMember = [...membersList].sort((a, b) => b.signupCount - a.signupCount)[0];
            }

            return {
                id: group.id,
                name: group.name,
                college: group.college,
                description: group.description,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
                membersCount: membersList.length,
                totalClicks,
                totalSignups,
                conversionRate: Number(conversionRate),
                topMember: topMember ? {
                    code: topMember.code,
                    name: topMember.creatorName || (topMember.referrer ? topMember.referrer.name : 'Unknown'),
                    signups: topMember.signupCount
                } : null,
                members: membersList.map(item => ({
                    id: item.id,
                    code: item.code,
                    title: item.title,
                    category: item.category,
                    creatorName: item.creatorName || (item.referrer ? item.referrer.name : null),
                    targetCollege: item.targetCollege,
                    clicksCount: item.clicksCount,
                    signupCount: item.signupCount,
                    isActive: item.isActive,
                    referrer: item.referrer
                }))
            };
        });

        return res.status(200).json({
            success: true,
            groups: formattedGroups
        });
    } catch (error) {
        console.error('Error in getAdminAmbassadorGroups:', error);
        return res.status(500).json({ error: 'Failed to fetch ambassador groups' });
    }
};

/**
 * Admin: Create a new ambassador group (by college or custom name)
 * POST /api/referrals/admin/groups
 * Body: { name, college, description, referralCodeIds: [1, 2, ...] }
 */
const createAdminAmbassadorGroup = async (req, res) => {
    try {
        const { name, college, description, referralCodeIds } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const trimmedName = name.trim();

        // Check uniqueness
        const existing = await prisma.ambassadorGroup.findUnique({
            where: { name: trimmedName }
        });
        if (existing) {
            return res.status(400).json({ error: `A group named "${trimmedName}" already exists` });
        }

        const newGroup = await prisma.ambassadorGroup.create({
            data: {
                name: trimmedName,
                college: college ? college.trim() : null,
                description: description ? description.trim() : null
            }
        });

        // Add initial members if provided
        if (Array.isArray(referralCodeIds) && referralCodeIds.length > 0) {
            const memberData = referralCodeIds.map(codeId => ({
                groupId: newGroup.id,
                referralCodeId: parseInt(codeId)
            }));

            await prisma.ambassadorGroupMember.createMany({
                data: memberData,
                skipDuplicates: true
            });
        }

        return res.status(201).json({
            success: true,
            message: `Ambassador group "${newGroup.name}" created successfully`,
            group: newGroup
        });
    } catch (error) {
        console.error('Error in createAdminAmbassadorGroup:', error);
        return res.status(500).json({ error: 'Failed to create ambassador group' });
    }
};

/**
 * Admin: Get detailed performance breakdown of a specific ambassador group
 * GET /api/referrals/admin/groups/:id
 */
const getAdminAmbassadorGroupDetails = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const group = await prisma.ambassadorGroup.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        referralCode: {
                            include: {
                                referrer: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        profile_pic: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Ambassador group not found' });
        }

        const membersList = group.members.map(m => m.referralCode).filter(Boolean);
        const codeIds = membersList.map(m => m.id);

        const totalClicks = membersList.reduce((acc, curr) => acc + (curr.clicksCount || 0), 0);
        const totalSignups = membersList.reduce((acc, curr) => acc + (curr.signupCount || 0), 0);
        const conversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : 0;

        // Fetch recent signups registered under any member of this group
        let recentAttributions = [];
        if (codeIds.length > 0) {
            recentAttributions = await prisma.referralAttribution.findMany({
                where: { referralCodeId: { in: codeIds } },
                orderBy: { createdAt: 'desc' },
                take: 15,
                include: {
                    referralCode: {
                        select: {
                            code: true,
                            title: true,
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
            });
        }

        return res.status(200).json({
            success: true,
            group: {
                id: group.id,
                name: group.name,
                college: group.college,
                description: group.description,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
                membersCount: membersList.length,
                totalClicks,
                totalSignups,
                conversionRate: Number(conversionRate),
                members: membersList.map(item => ({
                    id: item.id,
                    code: item.code,
                    title: item.title,
                    category: item.category,
                    creatorName: item.creatorName || (item.referrer ? item.referrer.name : null),
                    targetCollege: item.targetCollege,
                    clicksCount: item.clicksCount,
                    signupCount: item.signupCount,
                    isActive: item.isActive,
                    referrer: item.referrer
                }))
            },
            recentAttributions
        });
    } catch (error) {
        console.error('Error in getAdminAmbassadorGroupDetails:', error);
        return res.status(500).json({ error: 'Failed to fetch group performance details' });
    }
};

/**
 * Admin: Update an ambassador group and synchronize its members
 * PUT /api/referrals/admin/groups/:id
 * Body: { name, college, description, referralCodeIds: [1, 2, ...] }
 */
const updateAdminAmbassadorGroup = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, college, description, referralCodeIds } = req.body;

        const group = await prisma.ambassadorGroup.findUnique({ where: { id } });
        if (!group) {
            return res.status(404).json({ error: 'Ambassador group not found' });
        }

        const trimmedName = name ? name.trim() : group.name;

        // Check uniqueness if name changed
        if (trimmedName !== group.name) {
            const conflict = await prisma.ambassadorGroup.findUnique({ where: { name: trimmedName } });
            if (conflict && conflict.id !== id) {
                return res.status(400).json({ error: `A group named "${trimmedName}" already exists` });
            }
        }

        const updated = await prisma.ambassadorGroup.update({
            where: { id },
            data: {
                name: trimmedName,
                ...(college !== undefined ? { college: college ? college.trim() : null } : {}),
                ...(description !== undefined ? { description: description ? description.trim() : null } : {})
            }
        });

        // Sync members if array was provided
        if (Array.isArray(referralCodeIds)) {
            const numericIds = referralCodeIds.map(cid => parseInt(cid)).filter(Boolean);

            // Delete removed members
            await prisma.ambassadorGroupMember.deleteMany({
                where: {
                    groupId: id,
                    referralCodeId: { notIn: numericIds }
                }
            });

            // Insert new members
            const currentMembers = await prisma.ambassadorGroupMember.findMany({
                where: { groupId: id },
                select: { referralCodeId: true }
            });
            const currentCodeIds = new Set(currentMembers.map(m => m.referralCodeId));
            const newCodeIds = numericIds.filter(cid => !currentCodeIds.has(cid));

            if (newCodeIds.length > 0) {
                await prisma.ambassadorGroupMember.createMany({
                    data: newCodeIds.map(codeId => ({
                        groupId: id,
                        referralCodeId: codeId
                    })),
                    skipDuplicates: true
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Ambassador group "${updated.name}" updated successfully`,
            group: updated
        });
    } catch (error) {
        console.error('Error in updateAdminAmbassadorGroup:', error);
        return res.status(500).json({ error: 'Failed to update ambassador group' });
    }
};

/**
 * Admin: Delete an ambassador group
 * DELETE /api/referrals/admin/groups/:id
 */
const deleteAdminAmbassadorGroup = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        await prisma.ambassadorGroup.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Ambassador group deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteAdminAmbassadorGroup:', error);
        return res.status(500).json({ error: 'Failed to delete ambassador group' });
    }
};

/**
 * Admin: Dynamic performance auto-aggregated by college
 * GET /api/referrals/admin/colleges
 */
const getAdminCollegesPerformance = async (req, res) => {
    try {
        const codes = await prisma.referralCode.findMany({
            where: {
                targetCollege: { not: null }
            },
            include: {
                referrer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_pic: true
                    }
                }
            }
        });

        // Group by normalized college name
        const collegeMap = {};

        codes.forEach(code => {
            const rawName = code.targetCollege ? code.targetCollege.trim() : '';
            if (!rawName) return;

            const key = rawName.toLowerCase();
            if (!collegeMap[key]) {
                collegeMap[key] = {
                    collegeName: rawName,
                    totalAmbassadors: 0,
                    totalClicks: 0,
                    totalSignups: 0,
                    ambassadorIds: [],
                    ambassadors: []
                };
            }

            collegeMap[key].totalAmbassadors += 1;
            collegeMap[key].totalClicks += (code.clicksCount || 0);
            collegeMap[key].totalSignups += (code.signupCount || 0);
            collegeMap[key].ambassadorIds.push(code.id);
            collegeMap[key].ambassadors.push({
                id: code.id,
                code: code.code,
                title: code.title,
                category: code.category,
                creatorName: code.creatorName || (code.referrer ? code.referrer.name : null),
                clicksCount: code.clicksCount,
                signupCount: code.signupCount,
                isActive: code.isActive
            });
        });

        const collegesList = Object.values(collegeMap).map(c => {
            const convRate = c.totalClicks > 0 ? ((c.totalSignups / c.totalClicks) * 100).toFixed(1) : 0;
            const topAmbassador = [...c.ambassadors].sort((a, b) => b.signupCount - a.signupCount)[0] || null;

            return {
                collegeName: c.collegeName,
                totalAmbassadors: c.totalAmbassadors,
                totalClicks: c.totalClicks,
                totalSignups: c.totalSignups,
                conversionRate: Number(convRate),
                ambassadorIds: c.ambassadorIds,
                topAmbassador: topAmbassador ? {
                    code: topAmbassador.code,
                    name: topAmbassador.creatorName || topAmbassador.code,
                    signups: topAmbassador.signupCount
                } : null,
                ambassadors: c.ambassadors
            };
        }).sort((a, b) => b.totalSignups - a.totalSignups);

        return res.status(200).json({
            success: true,
            colleges: collegesList
        });
    } catch (error) {
        console.error('Error in getAdminCollegesPerformance:', error);
        return res.status(500).json({ error: 'Failed to fetch college performance metrics' });
    }
};

module.exports = {
    trackClick,
    attributeReferral,
    getMyReferralCode,
    updateMyReferralCode,
    getLeaderboard,
    getPublicProgramInfo,
    getAdminReferralStats,
    getAdminReferralCodes,
    createAdminReferralCode,
    updateAdminReferralCode,
    toggleReferralCodeStatus,
    deleteAdminReferralCode,
    getAdminAmbassadorGroups,
    createAdminAmbassadorGroup,
    getAdminAmbassadorGroupDetails,
    updateAdminAmbassadorGroup,
    deleteAdminAmbassadorGroup,
    getAdminCollegesPerformance
};


