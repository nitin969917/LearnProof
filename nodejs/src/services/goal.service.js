const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Format date to YYYY-MM-DD
 */
const getTodayKey = (date = new Date()) => {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Get dynamic smart suggestions based on user's active courses
 */
const getSuggestedGoals = async (userId) => {
    const suggestions = [];

    // 1. Check user's active playlist & uncompleted videos
    const activePlaylist = await prisma.playlist.findFirst({
        where: { userId },
        orderBy: { imported_at: 'desc' },
        include: {
            videos: {
                where: { is_completed: false },
                orderBy: { position: 'asc' },
                take: 3
            }
        }
    });

    if (activePlaylist && activePlaylist.videos.length > 0) {
        const count = activePlaylist.videos.length >= 2 ? 2 : 1;
        const name = activePlaylist.name.length > 28 
            ? `${activePlaylist.name.substring(0, 26)}...` 
            : activePlaylist.name;

        suggestions.push({
            title: `Watch ${count} lesson${count > 1 ? 's' : ''} in "${name}"`,
            description: `Continue learning momentum in your current playlist.`,
            category: 'VIDEO',
            target_value: count,
            xp_reward: 25,
            reference_id: String(activePlaylist.id),
            action_url: `/dashboard/classroom/${activePlaylist.id}`
        });
    } else {
        suggestions.push({
            title: 'Explore and import a course from Discover',
            description: 'Find a high-yield course on YouTube and import it with one tap.',
            category: 'DISCOVER',
            target_value: 1,
            xp_reward: 20,
            reference_id: null,
            action_url: '/dashboard/learning'
        });
    }

    // 2. Retention / Concept Quiz suggestion
    suggestions.push({
        title: 'Complete 1 Topic Quiz with passing score',
        description: 'Test your understanding and turn passive watching into long-term memory.',
        category: 'QUIZ',
        target_value: 1,
        xp_reward: 25,
        reference_id: null,
        action_url: '/dashboard/quiz'
    });

    // 3. Focus study sprint
    suggestions.push({
        title: 'Complete 25 mins of focused study',
        description: 'Deep focus sprint without distractions.',
        category: 'STUDY_TIME',
        target_value: 25,
        xp_reward: 20,
        reference_id: null,
        action_url: '/dashboard/learning'
    });

    // 4. Workspace / Notes review
    suggestions.push({
        title: 'Review 10 flashcards or summary notes',
        description: 'Strengthen memory retrieval and retention.',
        category: 'FLASHCARD',
        target_value: 10,
        xp_reward: 20,
        reference_id: null,
        action_url: '/dashboard/workspaces'
    });

    return suggestions;
};

/**
 * Get user's daily goals for today (WITHOUT forcing automatic defaults)
 */
const getTodayGoals = async (userId, clientDate = null) => {
    const today = getTodayKey(clientDate || new Date());

    // 1. Retrieve the user's actual goals for today
    const goals = await prisma.userDailyGoal.findMany({
        where: { userId, date: today },
        orderBy: [{ is_completed: 'asc' }, { id: 'asc' }]
    });

    // 2. Compute dynamic smart suggestions on the fly (user chooses whether to add them)
    const suggestedGoals = await getSuggestedGoals(userId);

    const completedCount = goals.filter(g => g.is_completed).length;
    const totalCount = goals.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return {
        goals,
        total: totalCount,
        completed: completedCount,
        left: totalCount - completedCount,
        progress,
        suggestedGoals
    };
};

/**
 * Event-Driven Auto Progress Tracker:
 * Advances matching active goals when student completes an activity.
 */
const recordActivityGoalProgress = async (userId, category, amount = 1, metadata = {}) => {
    try {
        const date = getTodayKey(metadata.date || new Date());

        const matchingGoals = await prisma.userDailyGoal.findMany({
            where: {
                userId,
                date,
                category,
                is_completed: false
            }
        });

        if (matchingGoals.length === 0) return [];

        const updatedGoals = [];

        for (const goal of matchingGoals) {
            const newCurrent = Math.min(goal.target_value, goal.current_value + amount);
            const isNowCompleted = newCurrent >= goal.target_value;

            const updated = await prisma.userDailyGoal.update({
                where: { id: goal.id },
                data: {
                    current_value: newCurrent,
                    is_completed: isNowCompleted,
                    completed_at: isNowCompleted ? new Date() : null
                }
            });

            updatedGoals.push(updated);

            if (isNowCompleted) {
                const user = await prisma.userProfile.findUnique({ where: { id: userId } });
                if (user) {
                    const newXp = (user.xp || 0) + goal.xp_reward;
                    const newLevel = Math.floor(newXp / 100) + 1;

                    await prisma.userProfile.update({
                        where: { id: userId },
                        data: { xp: newXp, level: newLevel }
                    });

                    await prisma.userActivityLog.create({
                        data: {
                            userId,
                            activity_type: `Daily Goal Achieved: ${goal.title}`
                        }
                    });
                }

                // Check if all goals are complete
                const remainingIncomplete = await prisma.userDailyGoal.count({
                    where: { userId, date, is_completed: false }
                });

                if (remainingIncomplete === 0) {
                    await prisma.userProfile.update({
                        where: { id: userId },
                        data: { xp: { increment: 50 } }
                    });

                    await prisma.userActivityLog.create({
                        data: {
                            userId,
                            activity_type: `All Daily Goals Completed (+50 XP Bonus)`
                        }
                    });
                }
            }
        }

        return updatedGoals;
    } catch (err) {
        console.error('[recordActivityGoalProgress] Error:', err);
        return [];
    }
};

/**
 * Add a goal (custom or from suggestion)
 */
const addGoal = async (userId, clientDate, goalData) => {
    const today = getTodayKey(clientDate || new Date());

    const title = typeof goalData === 'string' ? goalData.trim() : (goalData.title || '').trim();
    if (!title) throw new Error('Goal title is required');

    return await prisma.userDailyGoal.create({
        data: {
            userId,
            date: today,
            title,
            description: goalData.description || 'Personal learning target set by you.',
            category: goalData.category || 'CUSTOM',
            target_value: Math.max(1, parseInt(goalData.target_value) || 1),
            current_value: 0,
            is_completed: false,
            xp_reward: goalData.xp_reward || 20,
            reference_id: goalData.reference_id ? String(goalData.reference_id) : null,
            action_url: goalData.action_url || null
        }
    });
};

/**
 * Update target or details of an existing goal
 */
const updateGoal = async (userId, goalId, updates) => {
    const goal = await prisma.userDailyGoal.findFirst({
        where: { id: parseInt(goalId), userId }
    });

    if (!goal) throw new Error('Goal not found');

    const data = {};
    if (updates.title) data.title = updates.title.trim();
    if (updates.target_value) data.target_value = Math.max(1, parseInt(updates.target_value));
    if (updates.current_value !== undefined) data.current_value = Math.max(0, parseInt(updates.current_value));

    // Recheck completion
    const target = data.target_value || goal.target_value;
    const current = data.current_value !== undefined ? data.current_value : goal.current_value;
    data.is_completed = current >= target;

    return await prisma.userDailyGoal.update({
        where: { id: goal.id },
        data
    });
};

/**
 * Toggle a goal
 */
const toggleGoal = async (userId, goalId) => {
    const goal = await prisma.userDailyGoal.findFirst({
        where: { id: parseInt(goalId), userId }
    });

    if (!goal) throw new Error('Goal not found');

    const nextCompleted = !goal.is_completed;
    const nextCurrent = nextCompleted ? goal.target_value : 0;

    const updated = await prisma.userDailyGoal.update({
        where: { id: goal.id },
        data: {
            is_completed: nextCompleted,
            current_value: nextCurrent,
            completed_at: nextCompleted ? new Date() : null
        }
    });

    // Adjust XP
    const xpDiff = nextCompleted ? goal.xp_reward : -goal.xp_reward;
    const user = await prisma.userProfile.findUnique({ where: { id: userId } });
    if (user) {
        const nextXp = Math.max(0, (user.xp || 0) + xpDiff);
        const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);
        await prisma.userProfile.update({
            where: { id: userId },
            data: { xp: nextXp, level: nextLevel }
        });
    }

    return updated;
};

/**
 * Delete a goal
 */
const deleteGoal = async (userId, goalId) => {
    const goal = await prisma.userDailyGoal.findFirst({
        where: { id: parseInt(goalId), userId }
    });

    if (!goal) throw new Error('Goal not found');

    await prisma.userDailyGoal.delete({
        where: { id: goal.id }
    });

    return { success: true };
};

/**
 * Real historical analytics & activity aggregation across PostgreSQL
 */
const getGoalHistory = async (userId, days = 7, clientDate = null) => {
    const todayKey = getTodayKey(clientDate || new Date());
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const numDays = Math.min(60, Math.max(7, parseInt(days) || 7));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    const startKey = getTodayKey(startDate);

    // 1. Fetch user's goals
    const allGoals = await prisma.userDailyGoal.findMany({
        where: {
            userId,
            date: { gte: startKey }
        },
        orderBy: { date: 'asc' }
    });

    // 2. Fetch user's activity logs
    const allLogs = await prisma.userActivityLog.findMany({
        where: {
            userId,
            timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'asc' }
    });

    const history = [];
    const baseDate = new Date();

    let totalCompleted = 0;
    let totalTargets = 0;

    for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateKey = getTodayKey(d);
        const isToday = dateKey === todayKey;

        // Day goals
        const dayGoals = allGoals.filter(g => g.date === dateKey);

        // Day activities
        const dayLogs = allLogs.filter(l => {
            const logDate = getTodayKey(l.timestamp);
            return logDate === dateKey;
        });

        const dayActivities = [...new Set(dayLogs.map(l => l.activity_type).filter(Boolean))];

        let dayTotal = dayGoals.length;
        let dayCompleted = dayGoals.filter(g => g.is_completed).length;
        let dayProgress = 0;

        if (dayTotal > 0) {
            dayProgress = Math.round((dayCompleted / dayTotal) * 100);
        } else if (dayActivities.length > 0) {
            // Baseline grounding for past days before explicit goals
            dayTotal = Math.max(1, Math.min(3, dayActivities.length));
            dayCompleted = dayTotal;
            dayProgress = 100;
        }

        totalCompleted += dayCompleted;
        totalTargets += dayTotal;

        const dayOfWeek = daysOfWeek[d.getDay()];
        const month = months[d.getMonth()];
        const dateNum = d.getDate();

        const dateLabel = isToday 
            ? 'Today' 
            : (i === 1 ? 'Yesterday' : `${dayOfWeek}, ${month} ${dateNum}`);

        history.push({
            date: dateKey,
            dateLabel,
            dayShort: dayOfWeek,
            dayNumber: dateNum,
            isToday,
            total: dayTotal,
            completed: dayCompleted,
            progress: dayProgress,
            hasActivity: dayActivities.length > 0 || dayCompleted > 0,
            activityCount: dayActivities.length,
            activities: dayActivities.slice(0, 5),
            goals: dayGoals.map(g => ({
                id: g.id,
                title: g.title,
                category: g.category,
                is_completed: g.is_completed,
                target: g.target_value,
                current: g.current_value
            }))
        });
    }

    // Dynamic streak calculation
    let streakCount = 0;
    const historyReversed = [...history].reverse();
    for (const day of historyReversed) {
        if (day.isToday && day.progress === 0 && !day.hasActivity) {
            continue; // Today is still in progress
        }
        if (day.progress > 0 || day.hasActivity) {
            streakCount++;
        } else {
            break;
        }
    }

    return {
        history,
        stats: {
            currentStreak: Math.max(1, streakCount),
            totalCompleted,
            totalTargets,
            averageRate: history.length > 0 ? Math.round((totalCompleted / Math.max(1, totalTargets)) * 100) : 0
        }
    };
};

module.exports = {
    getTodayKey,
    getTodayGoals,
    getSuggestedGoals,
    recordActivityGoalProgress,
    addGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    getGoalHistory
};
