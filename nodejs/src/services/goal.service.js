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
 * Get or dynamically generate today's smart daily goals for a user
 */
const getOrCreateTodayGoals = async (userId, clientDate = null) => {
    const today = getTodayKey(clientDate || new Date());

    // 1. Check existing goals for today
    let goals = await prisma.userDailyGoal.findMany({
        where: { userId, date: today },
        orderBy: [{ is_completed: 'asc' }, { id: 'asc' }]
    });

    if (goals.length > 0) {
        return goals;
    }

    // 2. Generate dynamic Smart Goals based on the student's active learning state
    const generatedGoals = [];

    // Goal 1: Active Course / Video Goal
    const activePlaylist = await prisma.playlist.findFirst({
        where: { userId },
        orderBy: { imported_at: 'desc' },
        include: {
            videos: {
                where: { is_completed: false },
                orderBy: { position: 'asc' },
                take: 2
            }
        }
    });

    if (activePlaylist && activePlaylist.videos.length > 0) {
        const remainingCount = activePlaylist.videos.length;
        const target = remainingCount >= 2 ? 2 : 1;
        const courseName = activePlaylist.name.length > 28 
            ? `${activePlaylist.name.substring(0, 26)}...` 
            : activePlaylist.name;

        generatedGoals.push({
            userId,
            date: today,
            title: `Watch ${target} lesson${target > 1 ? 's' : ''} in "${courseName}"`,
            description: `Keep your learning streak moving forward.`,
            category: 'VIDEO',
            target_value: target,
            current_value: 0,
            is_completed: false,
            xp_reward: 25,
            reference_id: String(activePlaylist.id),
            action_url: `/dashboard/classroom/${activePlaylist.id}`
        });
    } else {
        generatedGoals.push({
            userId,
            date: today,
            title: 'Explore and import a course from Discover',
            description: 'Find a high-yield course on YouTube and import it with one tap.',
            category: 'DISCOVER',
            target_value: 1,
            current_value: 0,
            is_completed: false,
            xp_reward: 20,
            reference_id: null,
            action_url: '/dashboard/learning'
        });
    }

    // Goal 2: Retention / Quiz Goal
    generatedGoals.push({
        userId,
        date: today,
        title: 'Complete 1 Topic Quiz with passing score',
        description: 'Test your understanding and turn passive watching into long-term memory.',
        category: 'QUIZ',
        target_value: 1,
        current_value: 0,
        is_completed: false,
        xp_reward: 25,
        reference_id: null,
        action_url: '/dashboard/quiz'
    });

    // Goal 3: Study Focus Time Goal
    generatedGoals.push({
        userId,
        date: today,
        title: 'Spend 25 mins in focused study',
        description: 'Deep focus without context switching or social media distractions.',
        category: 'STUDY_TIME',
        target_value: 25,
        current_value: 0,
        is_completed: false,
        xp_reward: 20,
        reference_id: null,
        action_url: '/dashboard/learning'
    });

    // Save into database
    await prisma.userDailyGoal.createMany({
        data: generatedGoals
    });

    return await prisma.userDailyGoal.findMany({
        where: { userId, date: today },
        orderBy: [{ is_completed: 'asc' }, { id: 'asc' }]
    });
};

/**
 * Event-Driven Auto Progress Tracker:
 * Automatically advances matching active goals when a student completes an activity.
 */
const recordActivityGoalProgress = async (userId, category, amount = 1, metadata = {}) => {
    try {
        const date = getTodayKey(metadata.date || new Date());

        // Find active matching goals for today
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

            // If newly completed, award XP
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

                // Check if all today's goals are now 100% complete
                const remainingIncomplete = await prisma.userDailyGoal.count({
                    where: { userId, date, is_completed: false }
                });

                if (remainingIncomplete === 0) {
                    // Award Daily Sweep Bonus (+50 XP)
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
        console.error('[recordActivityGoalProgress] Error recording goal progress:', err);
        return [];
    }
};

/**
 * Add a custom student-defined goal
 */
const addCustomGoal = async (userId, clientDate, title, target_value = 1) => {
    const today = getTodayKey(clientDate || new Date());

    return await prisma.userDailyGoal.create({
        data: {
            userId,
            date: today,
            title: title.trim(),
            description: 'Custom learning target set by you.',
            category: 'CUSTOM',
            target_value: Math.max(1, parseInt(target_value) || 1),
            current_value: 0,
            is_completed: false,
            xp_reward: 15,
            reference_id: null,
            action_url: null
        }
    });
};

/**
 * Toggle a goal (e.g., custom goal manual check)
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
 * Get real historical progress for past days
 */
const getGoalHistory = async (userId, days = 7, clientDate = null) => {
    const todayKey = getTodayKey(clientDate || new Date());
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const history = [];
    const baseDate = new Date();

    for (let i = 1; i <= days; i++) {
        const past = new Date(baseDate);
        past.setDate(baseDate.getDate() - i);
        const dateKey = getTodayKey(past);

        const dayGoals = await prisma.userDailyGoal.findMany({
            where: { userId, date: dateKey }
        });

        if (dayGoals.length > 0) {
            const completed = dayGoals.filter(g => g.is_completed).length;
            const total = dayGoals.length;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            const dateLabel = i === 1 
                ? 'Yesterday' 
                : `${daysOfWeek[past.getDay()]}, ${months[past.getMonth()]} ${past.getDate()}`;

            history.push({
                date: dateKey,
                dateLabel,
                total,
                completed,
                progress
            });
        }
    }

    return history;
};

module.exports = {
    getTodayKey,
    getOrCreateTodayGoals,
    recordActivityGoalProgress,
    addCustomGoal,
    toggleGoal,
    deleteGoal,
    getGoalHistory
};
