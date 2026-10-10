const goalService = require('../services/goal.service');

const getTodayGoals = async (req, res) => {
    try {
        const user = req.user;
        const clientDate = req.query.date || req.body.date || null;
        const goals = await goalService.getOrCreateTodayGoals(user.id, clientDate);
        
        const completedCount = goals.filter(g => g.is_completed).length;
        const progress = goals.length === 0 ? 0 : Math.round((completedCount / goals.length) * 100);

        res.status(200).json({
            goals,
            total: goals.length,
            completed: completedCount,
            left: goals.length - completedCount,
            progress
        });
    } catch (error) {
        console.error('[getTodayGoals] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createCustomGoal = async (req, res) => {
    try {
        const user = req.user;
        const { title, target_value, date } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const goal = await goalService.addCustomGoal(user.id, date, title, target_value || 1);
        res.status(201).json({ goal });
    } catch (error) {
        console.error('[createCustomGoal] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const toggleGoal = async (req, res) => {
    try {
        const user = req.user;
        const goalId = req.params.id;

        const updated = await goalService.toggleGoal(user.id, goalId);
        res.status(200).json({ goal: updated });
    } catch (error) {
        console.error('[toggleGoal] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const user = req.user;
        const goalId = req.params.id;

        const result = await goalService.deleteGoal(user.id, goalId);
        res.status(200).json(result);
    } catch (error) {
        console.error('[deleteGoal] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getGoalHistory = async (req, res) => {
    try {
        const user = req.user;
        const days = parseInt(req.query.days) || 7;
        const clientDate = req.query.date || null;

        const history = await goalService.getGoalHistory(user.id, days, clientDate);
        res.status(200).json({ history });
    } catch (error) {
        console.error('[getGoalHistory] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const logStudyTime = async (req, res) => {
    try {
        const user = req.user;
        const minutes = parseInt(req.body.minutes) || 1;
        const clientDate = req.body.date || null;

        const updatedGoals = await goalService.recordActivityGoalProgress(
            user.id,
            'STUDY_TIME',
            minutes,
            { date: clientDate }
        );

        res.status(200).json({ success: true, updatedGoals });
    } catch (error) {
        console.error('[logStudyTime] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getTodayGoals,
    createCustomGoal,
    toggleGoal,
    deleteGoal,
    getGoalHistory,
    logStudyTime
};
