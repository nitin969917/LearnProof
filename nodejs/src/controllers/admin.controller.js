const prisma = require('../lib/prisma');

/**
 * Get aggregated statistics for the admin dashboard
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await prisma.userProfile.count();
        const totalVideos = await prisma.video.count();
        const totalQuizzes = await prisma.quiz.count();
        const totalCertificates = await prisma.certificate.count();

        // Calculate total XP across all users
        const xpSum = await prisma.userProfile.aggregate({
            _sum: { xp: true }
        });
        const totalXP = xpSum._sum.xp || 0;

        // Recent Activity
        const recentActivity = await prisma.userActivityLog.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true, profile_pic: true }
                }
            }
        });

        res.json({
            stats: {
                totalUsers,
                totalVideos,
                totalQuizzes,
                totalCertificates,
                totalXP
            },
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
                    { videos: { some: {} } } // User has some videos
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
                    where: { playlistId: null }, // Standalone videos
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
                    where: { playlistId: null }, // Only include standalone videos directly attached to user
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
 * Get aggregated time-series analytics data
 */
const getAnalyticsData = async (req, res) => {
    try {
        // We will generate the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all users joined in last 30 days
        const recentUsers = await prisma.userProfile.findMany({
            where: { joined_at: { gte: thirtyDaysAgo } },
            select: { joined_at: true }
        });

        // Group signups by day
        const signupsByDay = {};
        recentUsers.forEach(u => {
            const dateStr = u.joined_at.toISOString().split('T')[0];
            signupsByDay[dateStr] = (signupsByDay[dateStr] || 0) + 1;
        });

        // Format for Recharts
        const chartData = Object.keys(signupsByDay).sort().map(date => ({
            date: date,
            newUsers: signupsByDay[date]
        }));

        res.json({ growthChart: chartData });
    } catch (error) {
        console.error('getAnalyticsData Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    deleteUser,
    getContent,
    deleteContent,
    getUserDetails,
    getAnalyticsData
};
