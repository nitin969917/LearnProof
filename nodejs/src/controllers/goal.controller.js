const goalService = require('../services/goal.service');

const getTodayGoals = async (req, res) => {
    try {
        const user = req.user;
        const clientDate = req.query.date || req.body.date || null;
        const result = await goalService.getTodayGoals(user.id, clientDate);
        res.status(200).json(result);
    } catch (error) {
        console.error('[getTodayGoals] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createGoal = async (req, res) => {
    try {
        const user = req.user;
        const { date } = req.body;

        const goal = await goalService.addGoal(user.id, date, req.body);
        res.status(201).json({ goal });
    } catch (error) {
        console.error('[createGoal] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateGoal = async (req, res) => {
    try {
        const user = req.user;
        const goalId = req.params.id;

        const updated = await goalService.updateGoal(user.id, goalId, req.body);
        res.status(200).json({ goal: updated });
    } catch (error) {
        console.error('[updateGoal] Error:', error);
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
        const days = parseInt(req.query.days || req.body.days) || 7;
        const clientDate = req.query.date || req.body.date || null;

        const data = await goalService.getGoalHistory(user.id, days, clientDate);
        res.status(200).json(data);
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
    createGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    getGoalHistory,
    logStudyTime
};
