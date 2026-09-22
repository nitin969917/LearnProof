const prisma = require('../lib/prisma');
const redis = require('../lib/redis');
const datingPrisma = require('../utils/datingPrisma');
const cacheService = require('../services/cache.service');

/**
 * Helper to calculate percentage growth
 */
const calcGrowth = (current, previous) => {
    if (!previous || previous === 0) {
        return current > 0 ? '+100%' : '0%';
    }
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
};

/**
 * Helper to get unique active users in a date range
 */
const getUniqueActiveUsersInRange = async (from, to) => {
    try {
        const [activityLogs, updatedVideos, attemptedQuizzes, newUsers] = await Promise.all([
            prisma.userActivityLog.findMany({
                where: { timestamp: { gte: from, lte: to } },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.video.findMany({
                where: { updated_at: { gte: from, lte: to } },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.quiz.findMany({
                where: { attempted_at: { gte: from, lte: to } },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.userProfile.findMany({
                where: { joined_at: { gte: from, lte: to } },
                select: { id: true }
            })
        ]);

        const userSet = new Set();
        activityLogs.forEach(a => userSet.add(a.userId));
        updatedVideos.forEach(v => userSet.add(v.userId));
        attemptedQuizzes.forEach(q => userSet.add(q.userId));
        newUsers.forEach(u => userSet.add(u.id));

        return userSet.size;
    } catch (err) {
        console.error('getUniqueActiveUsersInRange error:', err);
        return 0;
    }
};

/**
 * Get aggregated statistics for the admin dashboard
 */
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // Core counts & sums in parallel
        const [
            totalUsers,
            totalVideos,
            totalPlaylists,
            totalQuizzes,
            totalCertificates,
            totalWorkspaces,
            totalVideoNotes,
            totalWorkspaceNotes,
            xpSum,
            completedVideosCount,
            totalWatchDuration,
            passedQuizzesCount,
            avgQuizScoreResult,
            dau,
            prevDau,
            wau,
            prevWau,
            mau,
            prevMau,
            recentActivity,
            topLearners,
            fcmDeviceGroups,
            appLaunchesCount,
            referredUsersCount,
            activeCampaignsCount,
            onlineSocketUsers,
            recentActiveIn10m,
            activeHeartbeatKeys
        ] = await Promise.all([
            prisma.userProfile.count(),
            prisma.video.count(),
            prisma.playlist.count(),
            prisma.quiz.count(),
            prisma.certificate.count(),
            prisma.workspace.count().catch(() => 0),
            prisma.videoNote.count().catch(() => 0),
            prisma.workspaceNote.count().catch(() => 0),
            prisma.userProfile.aggregate({ _sum: { xp: true } }),
            prisma.video.count({ where: { is_completed: true } }),
            prisma.video.aggregate({ _sum: { duration_seconds: true } }),
            prisma.quiz.count({ where: { passed: true } }),
            prisma.quiz.aggregate({ _avg: { score: true } }),
            getUniqueActiveUsersInRange(todayStart, now),
            getUniqueActiveUsersInRange(yesterdayStart, todayStart),
            getUniqueActiveUsersInRange(sevenDaysAgo, now),
            getUniqueActiveUsersInRange(fourteenDaysAgo, sevenDaysAgo),
            getUniqueActiveUsersInRange(thirtyDaysAgo, now),
            getUniqueActiveUsersInRange(sixtyDaysAgo, thirtyDaysAgo),
            prisma.userActivityLog.findMany({
                take: 30,
                orderBy: { timestamp: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, profile_pic: true }
                    }
                }
            }),
            prisma.userProfile.findMany({
                take: 8,
                orderBy: { xp: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_pic: true,
                    xp: true,
                    level: true,
                    streak_count: true,
                    joined_at: true,
                    _count: {
                        select: {
                            videos: { where: { is_completed: true } },
                            quizzes: { where: { passed: true } },
                            certificates: true
                        }
                    }
                }
            }),
            prisma.userFcmToken.groupBy({
                by: ['deviceType'],
                _count: { id: true }
            }).catch(() => []),
            prisma.appLaunchLog.count().catch(() => 0),
            prisma.referralAttribution.count().catch(() => 0),
            prisma.referralCode.count({ where: { isActive: true } }).catch(() => 0),
            redis.smembers('online_users').catch(() => []),
            prisma.userActivityLog.findMany({
                where: { timestamp: { gte: tenMinsAgo } },
                select: { userId: true },
                distinct: ['userId']
            }).catch(() => []),
            redis.keys('user:heartbeat:*').catch(() => [])
        ]);

        // Calculate Real-Time Currently Active Users
        const liveUserSet = new Set();
        (onlineSocketUsers || []).forEach(id => liveUserSet.add(String(id)));
        (recentActiveIn10m || []).forEach(a => liveUserSet.add(String(a.userId)));
        (activeHeartbeatKeys || []).forEach(k => {
            const uid = k.replace('user:heartbeat:', '');
            if (uid) liveUserSet.add(uid);
        });
        const activeNow = Math.max(liveUserSet.size, 1);

        const totalXP = xpSum._sum.xp || 0;
        const totalNotes = totalVideoNotes + totalWorkspaceNotes;
        const totalWatchHours = ((totalWatchDuration._sum.duration_seconds || 0) / 3600).toFixed(1);
        const videoCompletionRate = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;
        const quizPassRate = totalQuizzes > 0 ? Math.round((passedQuizzesCount / totalQuizzes) * 100) : 0;
        const avgScore = avgQuizScoreResult._avg.score ? Number(avgQuizScoreResult._avg.score.toFixed(1)) : 0;

        // Stickiness (DAU/MAU %)
        const stickinessRatio = mau > 0 ? ((dau / mau) * 100).toFixed(1) : (dau > 0 ? '100' : '0');

        // Device distribution breakdown
        const deviceMap = { web: 0, twa: 0, android: 0, ios: 0, desktop: 0 };
        fcmDeviceGroups.forEach(g => {
            const type = (g.deviceType || 'web').toLowerCase();
            if (deviceMap[type] !== undefined) {
                deviceMap[type] += g._count.id;
            } else {
                deviceMap.web += g._count.id;
            }
        });

        // Signups acquisition
        const organicUsersCount = Math.max(0, totalUsers - referredUsersCount);

        res.json({
            stats: {
                totalUsers,
                totalVideos,
                totalPlaylists,
                totalQuizzes,
                totalCertificates,
                totalXP,
                totalNotes,
                totalWorkspaces,
                completedVideosCount,
                videoCompletionRate,
                totalWatchHours,
                passedQuizzesCount,
                quizPassRate,
                avgScore,
                activeCampaignsCount
            },
            activeUsers: {
                activeNow,
                dau,
                dauGrowth: calcGrowth(dau, prevDau),
                wau,
                wauGrowth: calcGrowth(wau, prevWau),
                mau,
                mauGrowth: calcGrowth(mau, prevMau),
                stickinessRatio: Number(stickinessRatio)
            },
            deviceStats: {
                deviceMap,
                appLaunchesCount,
                totalSubscribers: fcmDeviceGroups.reduce((acc, curr) => acc + curr._count.id, 0)
            },
            acquisition: {
                referredUsers: referredUsersCount,
                organicUsers: organicUsersCount,
                referredPercent: totalUsers > 0 ? Math.round((referredUsersCount / totalUsers) * 100) : 0
            },
            topLearners,
            recentActivity: (recentActivity || []).filter(a => a && a.user && (a.activity_type || '').trim().length > 0)
        });
    } catch (error) {
        console.error('getDashboardStats Error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

/**
 * Get all users with their content counts
 */
const getUsers = async (req, res) => {
    try {
        const users = await prisma.userProfile.findMany({
            orderBy: { joined_at: 'desc' },
            include: {
                _count: {
                    select: { videos: true, certificates: true, quizzes: true }
                }
            }
        });
        res.json({ users });
    } catch (error) {
        console.error('getUsers Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Delete a user and cascade their data
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.userProfile.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'User successfully deleted' });
    } catch (error) {
        console.error('deleteUser Error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

/**
 * Get all imported content across the platform grouped by user
 */
const getContent = async (req, res) => {
    try {
        const usersWithContent = await prisma.userProfile.findMany({
            where: {
                OR: [
                    { playlists: { some: {} } },
                    { videos: { some: {} } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                profile_pic: true,
                playlists: {
                    include: {
                        _count: { select: { videos: true, quizzes: true } },
                        videos: {
                            select: {
                                id: true,
                                name: true,
                                vid: true,
                                watch_progress: true,
                                is_completed: true,
                                _count: { select: { quizzes: true, certificates: true } }
                            }
                        }
                    },
                    orderBy: { imported_at: 'desc' }
                },
                videos: {
                    where: { playlistId: null },
                    include: {
                        _count: { select: { quizzes: true, certificates: true } }
                    },
                    orderBy: { imported_at: 'desc' }
                }
            },
            orderBy: { joined_at: 'desc' }
        });

        res.json({ usersWithContent });
    } catch (error) {
        console.error('getContent Error:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
};

/**
 * Delete a specific video
 */
const deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.video.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Content successfully deleted' });
    } catch (error) {
        console.error('deleteContent Error:', error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
};

/**
 * Get detailed profile and activity for a single user
 */
const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.userProfile.findUnique({
            where: { id: parseInt(id) },
            include: {
                activities: {
                    orderBy: { timestamp: 'desc' },
                    take: 50
                },
                playlists: {
                    include: {
                        _count: { select: { videos: true, quizzes: true } },
                        videos: {
                            select: {
                                id: true,
                                name: true,
                                vid: true,
                                watch_progress: true,
                                is_completed: true,
                                _count: { select: { quizzes: true, certificates: true } }
                            }
                        }
                    },
                    orderBy: { imported_at: 'desc' }
                },
                videos: {
                    where: { playlistId: null },
                    include: {
                        _count: { select: { quizzes: true, certificates: true } }
                    },
                    orderBy: { imported_at: 'desc' }
                },
                _count: {
                    select: { videos: true, quizzes: true, certificates: true, activities: true, playlists: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('getUserDetails Error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

/**
 * Get aggregated time-series analytics data with flexible date ranges (7d, 30d, 90d, 1y)
 */
const getAnalyticsData = async (req, res) => {
    try {
        const { range = '30d' } = req.query;
        let days = 30;
        if (range === '7d') days = 7;
        else if (range === '90d') days = 90;
        else if (range === '1y') days = 365;

        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);

        // Pre-build daily buckets
        const buckets = {};
        for (let i = 0; i <= days; i++) {
            const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            buckets[key] = {
                date: key,
                newUsers: 0,
                activeUsersSet: new Set(),
                quizzesAttempted: 0,
                quizzesPassed: 0,
                videosCompleted: 0,
                certificatesIssued: 0
            };
        }

        // Parallel queries for telemetry in time range
        const [
            recentSignups,
            recentActivities,
            recentQuizzes,
            recentVideos,
            recentCertificates
        ] = await Promise.all([
            prisma.userProfile.findMany({
                where: { joined_at: { gte: startDate } },
                select: { id: true, joined_at: true }
            }),
            prisma.userActivityLog.findMany({
                where: { timestamp: { gte: startDate } },
                select: { userId: true, timestamp: true }
            }),
            prisma.quiz.findMany({
                where: { attempted_at: { gte: startDate } },
                select: { userId: true, attempted_at: true, passed: true }
            }),
            prisma.video.findMany({
                where: { updated_at: { gte: startDate }, is_completed: true },
                select: { userId: true, updated_at: true }
            }),
            prisma.certificate.findMany({
                where: { issued_at: { gte: startDate } },
                select: { issued_at: true }
            })
        ]);

        // Aggregate signups
        recentSignups.forEach(u => {
            const key = u.joined_at.toISOString().split('T')[0];
            if (buckets[key]) {
                buckets[key].newUsers += 1;
                buckets[key].activeUsersSet.add(u.id);
            }
        });

        // Hourly activity tracker (00:00 to 23:00)
        const hourlyMap = new Array(24).fill(0);

        // Aggregate user activities
        recentActivities.forEach(a => {
            const key = a.timestamp.toISOString().split('T')[0];
            if (buckets[key]) {
                buckets[key].activeUsersSet.add(a.userId);
            }
            const hour = new Date(a.timestamp).getHours();
            if (hour >= 0 && hour < 24) {
                hourlyMap[hour] += 1;
            }
        });

        // Aggregate quizzes
        recentQuizzes.forEach(q => {
            const key = q.attempted_at.toISOString().split('T')[0];
            if (buckets[key]) {
                buckets[key].quizzesAttempted += 1;
                if (q.passed) buckets[key].quizzesPassed += 1;
                buckets[key].activeUsersSet.add(q.userId);
            }
            const hour = new Date(q.attempted_at).getHours();
            if (hour >= 0 && hour < 24) {
                hourlyMap[hour] += 1;
            }
        });

        // Aggregate videos
        recentVideos.forEach(v => {
            const key = v.updated_at.toISOString().split('T')[0];
            if (buckets[key]) {
                buckets[key].videosCompleted += 1;
                buckets[key].activeUsersSet.add(v.userId);
            }
        });

        // Aggregate certificates
        recentCertificates.forEach(c => {
            const key = c.issued_at.toISOString().split('T')[0];
            if (buckets[key]) {
                buckets[key].certificatesIssued += 1;
            }
        });

        // Format timeline chart data for Recharts
        const growthChart = Object.keys(buckets).sort().map(key => ({
            date: key,
            newUsers: buckets[key].newUsers,
            activeUsers: buckets[key].activeUsersSet.size,
            quizzesAttempted: buckets[key].quizzesAttempted,
            quizzesPassed: buckets[key].quizzesPassed,
            videosCompleted: buckets[key].videosCompleted,
            certificatesIssued: buckets[key].certificatesIssued
        }));

        // Format 24-hour study distribution
        const hourlyDistribution = hourlyMap.map((count, hour) => {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            return {
                hour: `${String(hour).padStart(2, '0')}:00`,
                label: `${displayHour} ${period}`,
                events: count
            };
        });

        res.json({
            range,
            growthChart,
            hourlyDistribution
        });
    } catch (error) {
        console.error('getAnalyticsData Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
};

const getApps = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const appsDir = path.join(__dirname, '../../apps');
        const files = [
            { name: 'LearnProof-AI.dmg', platform: 'macos', label: 'macOS' },
            { name: 'LearnProof-AI.exe', platform: 'windows', label: 'Windows' }
        ];

        const result = files.map(item => {
            const filePath = path.join(appsDir, item.name);
            const exists = fs.existsSync(filePath);
            if (exists) {
                const stats = fs.statSync(filePath);
                return {
                    name: item.name,
                    platform: item.platform,
                    label: item.label,
                    exists: true,
                    size: stats.size,
                    updatedAt: stats.mtime
                };
            } else {
                return {
                    name: item.name,
                    platform: item.platform,
                    label: item.label,
                    exists: false,
                    size: 0,
                    updatedAt: null
                };
            }
        });

        res.json({ apps: result });
    } catch (error) {
        console.error('getApps Error:', error);
        res.status(500).json({ error: 'Failed to retrieve apps status' });
    }
};

const uploadAppFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({
            message: 'App uploaded successfully',
            file: {
                name: req.file.filename,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('uploadAppFile Error:', error);
        res.status(500).json({ error: 'Failed to upload app file' });
    }
};

/**
 * UGC Content Moderation: Get all reports with counts and enriched content
 */
const getReportedContent = async (req, res) => {
    try {
        const { status, targetType, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClauses = [];
        if (status && status !== 'all') {
            whereClauses.push(`status = '${status.replace(/'/g, "''")}'`);
        }
        if (targetType && targetType !== 'all') {
            whereClauses.push(`"targetType" = '${targetType.replace(/'/g, "''")}'`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Fetch counts
        const [counts] = await datingPrisma.$queryRawUnsafe(`
            SELECT 
                COUNT(*)::int as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int as resolved,
                COUNT(CASE WHEN status = 'dismissed' THEN 1 END)::int as dismissed
            FROM "social_reports"
        `);

        // Fetch reports
        const reports = await datingPrisma.$queryRawUnsafe(`
            SELECT * FROM "social_reports"
            ${whereSql}
            ORDER BY "createdAt" DESC
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `);

        // Enrich post reports with live post & author details
        const postIds = reports
            .filter(r => r.targetType === 'post' && !isNaN(parseInt(r.targetId)))
            .map(r => parseInt(r.targetId));

        let postMap = new Map();
        if (postIds.length > 0) {
            const posts = await datingPrisma.post.findMany({
                where: { id: { in: postIds } },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicture: true,
                            collegeName: true,
                            department: true
                        }
                    },
                    likes: { select: { id: true } },
                    comments: { select: { id: true } }
                }
            });
            posts.forEach(p => postMap.set(p.id, p));
        }

        // Check if any reported users exist
        const userIds = reports
            .filter(r => r.targetType === 'user' && !isNaN(parseInt(r.targetId)))
            .map(r => parseInt(r.targetId));

        let userMap = new Map();
        if (userIds.length > 0) {
            const users = await datingPrisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, email: true, profilePicture: true, collegeName: true }
            });
            users.forEach(u => userMap.set(u.id, u));
        }

        const enrichedReports = reports.map(r => {
            let targetContent = null;
            let targetUser = null;

            if (r.targetType === 'post') {
                const p = postMap.get(parseInt(r.targetId));
                if (p) {
                    targetContent = {
                        id: p.id,
                        content: p.content,
                        image: p.image,
                        createdAt: p.createdAt,
                        likesCount: p.likes?.length || 0,
                        commentsCount: p.comments?.length || 0,
                        author: p.author,
                        exists: true
                    };
                } else {
                    targetContent = {
                        id: parseInt(r.targetId),
                        exists: false,
                        message: 'Post has been removed or deleted'
                    };
                }
            } else if (r.targetType === 'user') {
                const u = userMap.get(parseInt(r.targetId));
                targetUser = u ? { ...u, exists: true } : { exists: false, message: 'User not found' };
            }

            return {
                ...r,
                targetContent,
                targetUser
            };
        });

        res.json({
            reports: enrichedReports,
            counts: {
                total: counts?.total || 0,
                pending: counts?.pending || 0,
                resolved: counts?.resolved || 0,
                dismissed: counts?.dismissed || 0
            }
        });
    } catch (err) {
        console.error('getReportedContent error:', err);
        res.status(500).json({ error: 'Failed to fetch reported content', details: err.message });
    }
};

/**
 * UGC Content Moderation: Take Action on Report
 */
const handleReportAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, deletePost: shouldDeletePost, reasonNote } = req.body;
        const adminEmail = req.user?.email || 'admin';

        const reports = await datingPrisma.$queryRawUnsafe(`
            SELECT * FROM "social_reports" WHERE id = ${parseInt(id)} LIMIT 1
        `);
        const report = reports?.[0];

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const targetId = parseInt(report.targetId);

        if (action === 'delete_post' || shouldDeletePost) {
            if (report.targetType === 'post' && !isNaN(targetId)) {
                try {
                    await datingPrisma.comment.deleteMany({ where: { postId: targetId } });
                    await datingPrisma.post.delete({ where: { id: targetId } });
                    await cacheService.delByPattern('user:feed:*');
                } catch (delErr) {
                    console.warn('Post deletion notice:', delErr.message);
                }
            }
        }

        let newStatus = 'resolved';
        let actionTakenText = action;

        if (action === 'dismiss') {
            newStatus = 'dismissed';
            actionTakenText = 'Dismissed (Content Kept)';
        } else if (action === 'delete_post') {
            newStatus = 'resolved';
            actionTakenText = 'Post Deleted by Admin';
        } else if (action === 'ban_user') {
            newStatus = 'resolved';
            actionTakenText = 'Author Banned & Post Removed';
        } else if (action === 'resolve') {
            newStatus = 'resolved';
            actionTakenText = reasonNote || 'Reviewed and Resolved';
        }

        await datingPrisma.$executeRawUnsafe(`
            UPDATE "social_reports"
            SET 
                status = '${newStatus}',
                "actionTaken" = '${actionTakenText.replace(/'/g, "''")}',
                "resolvedAt" = NOW(),
                "resolvedBy" = '${adminEmail.replace(/'/g, "''")}',
                "updatedAt" = NOW()
            WHERE id = ${parseInt(id)}
        `);

        res.json({
            success: true,
            message: `Report updated: ${actionTakenText}`
        });
    } catch (err) {
        console.error('handleReportAction error:', err);
        res.status(500).json({ error: 'Failed to process report action', details: err.message });
    }
};

/**
 * UGC Content Moderation: Delete Report Log
 */
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        await datingPrisma.$executeRawUnsafe(`
            DELETE FROM "social_reports" WHERE id = ${parseInt(id)}
        `);
        res.json({ success: true, message: 'Report log deleted successfully' });
    } catch (err) {
        console.error('deleteReport error:', err);
        res.status(500).json({ error: 'Failed to delete report log' });
    }
};

/**
 * UGC Content Moderation: Delete Social Post Directly
 */
const deleteSocialPost = async (req, res) => {
    try {
        const { id } = req.params;
        const postId = parseInt(id);
        if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' });

        await datingPrisma.comment.deleteMany({ where: { postId } });
        await datingPrisma.post.delete({ where: { id: postId } });
        await cacheService.delByPattern('user:feed:*');

        // Mark any pending reports for this post as resolved
        await datingPrisma.$executeRawUnsafe(`
            UPDATE "social_reports"
            SET status = 'resolved', "actionTaken" = 'Post Deleted by Admin', "resolvedAt" = NOW(), "resolvedBy" = '${(req.user?.email || 'admin').replace(/'/g, "''")}'
            WHERE "targetType" = 'post' AND "targetId" = '${postId}'
        `);

        res.json({ success: true, message: 'Post and associated comments removed from feed' });
    } catch (err) {
        console.error('deleteSocialPost error:', err);
        res.status(500).json({ error: 'Failed to delete post', details: err.message });
    }
};

/**
 * Main Admin: Get all groups across the platform with metrics, search, and filter
 */
const getAdminGroups = async (req, res) => {
    try {
        const { search = '', privacy = 'all', status = 'all', page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;

        // Build where filter
        const where = {};
        if (search && search.trim()) {
            const s = search.trim();
            where.OR = [
                { name: { contains: s, mode: 'insensitive' } },
                { description: { contains: s, mode: 'insensitive' } },
                { creator: { name: { contains: s, mode: 'insensitive' } } },
                { creator: { email: { contains: s, mode: 'insensitive' } } },
            ];
        }
        if (privacy === 'public') where.isPrivate = false;
        if (privacy === 'private') where.isPrivate = true;
        if (status === 'locked') where.isLocked = true;
        if (status === 'active') where.isLocked = false;

        const [groups, totalMatching, totalGroupsAll, totalMessagesAll, totalMembershipsAll, lockedGroupsCount] = await Promise.all([
            datingPrisma.group.findMany({
                where,
                include: {
                    creator: {
                        select: { id: true, name: true, email: true, profilePicture: true }
                    },
                    members: {
                        select: { id: true, userId: true, role: true, joinedAt: true, user: { select: { id: true, name: true, email: true, profilePicture: true } } }
                    },
                    _count: {
                        select: { messages: true, members: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            datingPrisma.group.count({ where }),
            datingPrisma.group.count(),
            datingPrisma.groupMessage.count(),
            datingPrisma.groupMember.count(),
            datingPrisma.group.count({ where: { isLocked: true } }),
        ]);

        const formattedGroups = groups.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            isPrivate: g.isPrivate,
            entryKey: g.entryKey,
            onlyAdminsCanPost: g.onlyAdminsCanPost,
            isLocked: !!g.isLocked,
            createdAt: g.createdAt,
            creator: g.creator,
            memberCount: g._count.members,
            messageCount: g._count.messages,
            members: g.members.map(m => ({
                id: m.id,
                userId: m.userId,
                role: m.role || 'member',
                joinedAt: m.joinedAt,
                user: m.user
            }))
        }));

        res.json({
            groups: formattedGroups,
            pagination: {
                total: totalMatching,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(totalMatching / limitNum) || 1,
            },
            metrics: {
                totalGroups: totalGroupsAll,
                totalMessages: totalMessagesAll,
                totalMemberships: totalMembershipsAll,
                lockedGroups: lockedGroupsCount,
            }
        });
    } catch (err) {
        console.error('getAdminGroups error:', err);
        res.status(500).json({ error: 'Failed to fetch groups', details: err.message });
    }
};

/**
 * Main Admin: Audit chat history / messages of any group
 */
const getAdminGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 100;

        const messages = await datingPrisma.groupMessage.findMany({
            where: { groupId: parseInt(groupId) },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, profilePicture: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: page * limit,
        });

        res.json(messages.reverse());
    } catch (err) {
        console.error('getAdminGroupMessages error:', err);
        res.status(500).json({ error: 'Failed to fetch group messages', details: err.message });
    }
};

/**
 * Main Admin: Freeze / Lock or Unlock group
 */
const toggleAdminGroupLock = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { isLocked } = req.body;
        const numGroupId = parseInt(groupId);

        const group = await datingPrisma.group.findUnique({
            where: { id: numGroupId }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const updated = await datingPrisma.group.update({
            where: { id: numGroupId },
            data: { isLocked: !!isLocked }
        });

        // Invalidate cache
        await cacheService.delByPattern('user:groups:*');

        const io = req.app.get('io');
        if (io) {
            io.to(`group-${numGroupId}`).emit('groupLockStatusChanged', {
                groupId: numGroupId,
                isLocked: !!isLocked,
                message: isLocked 
                    ? 'This group has been locked by platform administrators. Messaging is temporarily disabled.'
                    : 'This group has been unlocked by platform administrators.'
            });
        }

        res.json({
            success: true,
            message: `Group successfully ${isLocked ? 'locked/frozen' : 'unlocked'}`,
            group: updated
        });
    } catch (err) {
        console.error('toggleAdminGroupLock error:', err);
        res.status(500).json({ error: 'Failed to update lock status', details: err.message });
    }
};

/**
 * Main Admin: Force delete ANY group
 */
const adminDeleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { reason = 'Terms of Service violation or administrative cleanup' } = req.body || {};
        const numGroupId = parseInt(groupId);

        const group = await datingPrisma.group.findUnique({
            where: { id: numGroupId }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Safe cascade transaction targeting ONLY this group
        await datingPrisma.$transaction([
            datingPrisma.groupMessage.deleteMany({ where: { groupId: numGroupId } }),
            datingPrisma.groupMember.deleteMany({ where: { groupId: numGroupId } }),
            datingPrisma.group.delete({ where: { id: numGroupId } }),
        ]);

        await cacheService.delByPattern('user:groups:*');

        const io = req.app.get('io');
        if (io) {
            io.to(`group-${numGroupId}`).emit('groupDeleted', {
                groupId: numGroupId,
                groupName: group.name,
                deletedBy: 'Platform Administrator',
                reason
            });
        }

        res.json({
            success: true,
            message: `Group "${group.name}" permanently deleted by platform administrator.`,
            groupId: numGroupId
        });
    } catch (err) {
        console.error('adminDeleteGroup error:', err);
        res.status(500).json({ error: 'Failed to delete group', details: err.message });
    }
};

/**
 * Main Admin: Force remove a member from any group
 */
const adminRemoveGroupMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const numGroupId = parseInt(groupId);
        const numUserId = parseInt(userId);

        const member = await datingPrisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: numGroupId,
                    userId: numUserId
                }
            },
            include: { user: { select: { name: true } } }
        });

        if (!member) {
            return res.status(404).json({ error: 'User is not a member of this group' });
        }

        await datingPrisma.groupMember.delete({
            where: { id: member.id }
        });

        await cacheService.delByPattern('user:groups:*');

        const io = req.app.get('io');
        if (io) {
            io.to(`group-${numGroupId}`).emit('groupMemberRemoved', {
                groupId: numGroupId,
                userId: numUserId,
                removedBy: 'Platform Administrator'
            });
        }

        res.json({
            success: true,
            message: `Member ${member.user?.name || numUserId} removed from group by platform administrator.`
        });
    } catch (err) {
        console.error('adminRemoveGroupMember error:', err);
        res.status(500).json({ error: 'Failed to remove member', details: err.message });
    }
};

/**
 * Main Admin: Reassign group creator / transfer ownership
 */
const adminTransferGroupOwnership = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { newOwnerId } = req.body;
        const numGroupId = parseInt(groupId);
        const numNewOwnerId = parseInt(newOwnerId);

        const group = await datingPrisma.group.findUnique({
            where: { id: numGroupId },
            include: {
                members: {
                    where: { userId: numNewOwnerId },
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const targetMember = group.members[0];
        if (!targetMember) {
            return res.status(400).json({ error: 'The new owner must be an active member of this group' });
        }

        await datingPrisma.$transaction([
            datingPrisma.group.update({
                where: { id: numGroupId },
                data: { creatorId: numNewOwnerId }
            }),
            datingPrisma.groupMember.update({
                where: { id: targetMember.id },
                data: { role: 'admin' }
            })
        ]);

        await cacheService.delByPattern('user:groups:*');

        const io = req.app.get('io');
        if (io) {
            io.to(`group-${numGroupId}`).emit('groupOwnershipTransferred', {
                groupId: numGroupId,
                newOwnerId: numNewOwnerId,
                newOwnerName: targetMember.user.name,
                transferredBy: 'Platform Administrator'
            });
        }

        res.json({
            success: true,
            message: `Group ownership reassigned to ${targetMember.user.name} by platform administrator.`,
            newOwnerId: numNewOwnerId
        });
    } catch (err) {
        console.error('adminTransferGroupOwnership error:', err);
        res.status(500).json({ error: 'Failed to reassign group owner', details: err.message });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    deleteUser,
    getContent,
    deleteContent,
    getUserDetails,
    getAnalyticsData,
    getApps,
    uploadAppFile,
    getReportedContent,
    handleReportAction,
    deleteReport,
    deleteSocialPost,
    getAdminGroups,
    getAdminGroupMessages,
    toggleAdminGroupLock,
    adminDeleteGroup,
    adminRemoveGroupMember,
    adminTransferGroupOwnership
};
