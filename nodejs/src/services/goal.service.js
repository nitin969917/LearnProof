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
 * Get user's daily goals for a specific date (defaults to today)
 * Completely user-owned — no auto-generated defaults or unwanted suggestions.
 */
const getGoalsByDate = async (userId, clientDate = null) => {
    const date = getTodayKey(clientDate || new Date());

    const goals = await prisma.userDailyGoal.findMany({
        where: { userId, date },
        orderBy: [{ is_completed: 'asc' }, { id: 'asc' }]
    });

    const completedCount = goals.filter(g => g.is_completed).length;
    const totalCount = goals.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return {
        date,
        goals,
        total: totalCount,
        completed: completedCount,
        left: totalCount - completedCount,
        progress
    };
};

/**
 * Backward compatibility alias for today's goals
 */
const getTodayGoals = async (userId, clientDate = null) => {
    return await getGoalsByDate(userId, clientDate);
};

/**
 * Event-Driven Auto Progress Tracker:
 * Automatically advances matching goals when student completes an activity.
 * Generates active Duolingo-style teacher instruction message.
 */
const recordActivityGoalProgress = async (userId, category, amount = 1, metadata = {}) => {
    try {
        const date = getTodayKey(metadata.date || new Date());

        // 1. First attempt to match by specific reference_id (e.g. videoId), if provided
        let targetGoals = [];
        if (metadata.reference_id) {
            targetGoals = await prisma.userDailyGoal.findMany({
                where: {
                    userId,
                    date,
                    category,
                    reference_id: String(metadata.reference_id),
                    is_completed: false
                }
            });
        }

        // 2. If no specific reference_id matched, find any incomplete goal in this category
        if (targetGoals.length === 0) {
            targetGoals = await prisma.userDailyGoal.findMany({
                where: {
                    userId,
                    date,
                    category,
                    is_completed: false
                },
                take: 1
            });
        }

        const updatedGoals = [];

        for (const goal of targetGoals) {
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
            }
        }

        // 3. Calculate remaining video / overall goals for today to generate active coach instruction
        const remainingIncomplete = await prisma.userDailyGoal.count({
            where: { userId, date, is_completed: false }
        });
        const totalGoalsToday = await prisma.userDailyGoal.count({
            where: { userId, date }
        });

        let coachMessage = null;
        if (totalGoalsToday > 0) {
            if (remainingIncomplete === 0) {
                coachMessage = {
                    type: 'GOAL_COMPLETED',
                    title: '🎯 Daily Goal Achieved!',
                    message: "Boom! You completed all scheduled goals for today. Great job keeping your study streak alive!",
                    remaining: 0
                };
            } else if (remainingIncomplete === 1) {
                coachMessage = {
                    type: 'ONE_REMAINING',
                    title: '🔥 Almost There!',
                    message: "Awesome focus! Only 1 lesson remaining to finish today's goal.",
                    remaining: 1
                };
            } else {
                coachMessage = {
                    type: 'PROGRESS_UPDATE',
                    title: '🚀 Great Job!',
                    message: `Lesson completed! ${remainingIncomplete} lessons remaining for today's goal.`,
                    remaining: remainingIncomplete
                };
            }
        }

        return { updatedGoals, remainingIncomplete, coachMessage };
    } catch (err) {
        console.error('[recordActivityGoalProgress] Error:', err);
        return { updatedGoals: [], remainingIncomplete: 0, coachMessage: null };
    }
};

/**
 * Add a clean user-defined or system-synced goal
 */
const addGoal = async (userId, clientDate, goalData) => {
    const date = getTodayKey(clientDate || new Date());

    const title = typeof goalData === 'string' 
        ? goalData.trim() 
        : (goalData.title || '').trim();

    if (!title) throw new Error('Goal title is required');

    const category = typeof goalData === 'object' && goalData.category ? goalData.category : 'CUSTOM';
    const reference_id = typeof goalData === 'object' && goalData.reference_id ? String(goalData.reference_id) : null;
    const action_url = typeof goalData === 'object' && goalData.action_url ? String(goalData.action_url) : null;
    const description = typeof goalData === 'object' && goalData.description ? String(goalData.description) : null;

    return await prisma.userDailyGoal.create({
        data: {
            userId,
            date,
            title,
            description,
            category,
            target_value: 1,
            current_value: 0,
            is_completed: false,
            xp_reward: category === 'VIDEO' ? 25 : 20,
            reference_id,
            action_url
        }
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
 * Historical analytics:
 * If there are no goals on a day, completion is strictly 0% (never fake 100%).
 * Each day contains its real goals and completion stats so users can browse any day.
 */
const getGoalHistory = async (userId, days = 7, clientDate = null) => {
    const todayKey = getTodayKey(clientDate || new Date());
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const numDays = Math.min(60, Math.max(7, parseInt(days) || 7));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    const startKey = getTodayKey(startDate);

    // Fetch user's goals
    const allGoals = await prisma.userDailyGoal.findMany({
        where: {
            userId,
            date: { gte: startKey }
        },
        orderBy: [{ date: 'asc' }, { id: 'asc' }]
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
        const dayTotal = dayGoals.length;
        const dayCompleted = dayGoals.filter(g => g.is_completed).length;

        // CRITICAL FIX: If no goals were set, progress is strictly 0% (NOT 100%)
        const dayProgress = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

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
            goals: dayGoals.map(g => ({
                id: g.id,
                title: g.title,
                is_completed: g.is_completed
            }))
        });
    }

    // Dynamic streak calculation: consecutive days with >= 100% completion
    let streakCount = 0;
    const historyReversed = [...history].reverse();
    for (const day of historyReversed) {
        if (day.isToday && day.progress < 100) {
            continue; // Today is still ongoing
        }
        if (day.total > 0 && day.progress === 100) {
            streakCount++;
        } else {
            break;
        }
    }

    return {
        history,
        stats: {
            currentStreak: streakCount,
            totalCompleted,
            totalTargets,
            averageRate: totalTargets > 0 ? Math.round((totalCompleted / totalTargets) * 100) : 0
        }
    };
};

/**
 * Bulk sync today's scheduled roadmap videos into UserDailyGoal
 */
const syncRoadmapVideos = async (userId, { videos, date, pid, playlistName }) => {
    const dateKey = getTodayKey(date || new Date());
    if (!Array.isArray(videos) || videos.length === 0) {
        return { synced: 0, goals: [] };
    }

    const existingGoals = await prisma.userDailyGoal.findMany({
        where: {
            userId,
            date: dateKey,
            category: 'VIDEO'
        },
        select: { reference_id: true, id: true }
    });

    const existingRefIds = new Set(existingGoals.map(g => g.reference_id).filter(Boolean));
    const createdGoals = [];

    for (const v of videos) {
        const vid = v.vid || v.video_id;
        if (!vid) continue;

        if (!existingRefIds.has(vid)) {
            const goal = await prisma.userDailyGoal.create({
                data: {
                    userId,
                    date: dateKey,
                    title: v.name || v.title || 'Study Video Lesson',
                    description: playlistName ? `From ${playlistName}` : null,
                    category: 'VIDEO',
                    target_value: 1,
                    current_value: v.is_completed ? 1 : 0,
                    is_completed: !!v.is_completed,
                    xp_reward: 25,
                    reference_id: vid,
                    action_url: `/classroom/${vid}`
                }
            });
            createdGoals.push(goal);
            existingRefIds.add(vid);
        }
    }

    const allToday = await getGoalsByDate(userId, dateKey);
    return {
        synced: createdGoals.length,
        createdGoals,
        todayGoals: allToday
    };
};

/**
 * Get active Coach Guidance for student's dashboard & study session
 */
const getTodayCoachGuidance = async (userId, clientDate = null) => {
    const date = getTodayKey(clientDate || new Date());
    
    const goals = await prisma.userDailyGoal.findMany({
        where: { userId, date },
        orderBy: [{ is_completed: 'asc' }, { id: 'asc' }]
    });

    const total = goals.length;
    const completed = goals.filter(g => g.is_completed).length;
    const remaining = total - completed;

    let coachMessage = null;
    if (total > 0) {
        if (remaining === 0) {
            coachMessage = {
                type: 'GOAL_COMPLETED',
                title: '🎯 Daily Goal Smashed!',
                message: `You completed all ${total} study goals for today. Your streak is safe!`,
                remaining: 0
            };
        } else if (remaining === 1) {
            coachMessage = {
                type: 'ONE_REMAINING',
                title: '🔥 Almost There!',
                message: `Only 1 lesson remaining for today's goal! Finish strong.`,
                remaining: 1
            };
        } else {
            coachMessage = {
                type: 'PROGRESS_UPDATE',
                title: '🚀 Keep It Up!',
                message: `${completed} done, ${remaining} lessons remaining to complete today's target.`,
                remaining: remaining
            };
        }
    }

    return {
        date,
        total,
        completed,
        remaining,
        coachMessage,
        goals
    };
};

module.exports = {
    getTodayKey,
    getGoalsByDate,
    getTodayGoals,
    recordActivityGoalProgress,
    addGoal,
    toggleGoal,
    deleteGoal,
    getGoalHistory,
    syncRoadmapVideos,
    getTodayCoachGuidance
};
