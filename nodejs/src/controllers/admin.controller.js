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
            activeCampaignsCount
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
                take: 15,
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
            prisma.referralCode.count({ where: { isActive: true } }).catch(() => 0)
        ]);

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
            recentActivity
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

module.exports = {
    getDashboardStats,
    getUsers,
    deleteUser,
    getContent,
    deleteContent,
    getUserDetails,
    getAnalyticsData,
    getApps,
    uploadAppFile
};
