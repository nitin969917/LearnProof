import axios from 'axios';

const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
};

const getHeaders = (token) => {
    if (!token) return {};
    return {
        Authorization: `Bearer ${token}`
    };
};

/**
 * Fetch today's goals and dynamic course suggestions
 */
export const fetchTodayGoals = async (token, clientDate = null) => {
    const url = `${getBackendUrl()}/api/goals/today`;
    const dateParam = clientDate || new Date().toISOString().split('T')[0];
    
    const response = await axios.post(url, {
        idToken: token,
        date: dateParam
    }, {
        headers: getHeaders(token)
    });

    return response.data;
};

/**
 * Add a goal (custom or from smart suggestions)
 */
export const addGoal = async (token, goalData) => {
    const url = `${getBackendUrl()}/api/goals`;
    const dateParam = goalData.date || new Date().toISOString().split('T')[0];

    const payload = typeof goalData === 'string'
        ? { title: goalData, target_value: 1, date: dateParam }
        : { ...goalData, date: dateParam };

    const response = await axios.post(url, {
        idToken: token,
        ...payload
    }, {
        headers: getHeaders(token)
    });

    return response.data?.goal;
};

/**
 * Update an existing goal
 */
export const updateGoal = async (token, goalId, updates) => {
    const url = `${getBackendUrl()}/api/goals/${goalId}/update`;

    const response = await axios.post(url, {
        idToken: token,
        ...updates
    }, {
        headers: getHeaders(token)
    });

    return response.data?.goal;
};

/**
 * Toggle completion of a goal
 */
export const toggleGoal = async (token, goalId) => {
    const url = `${getBackendUrl()}/api/goals/${goalId}/toggle`;

    const response = await axios.post(url, {
        idToken: token
    }, {
        headers: getHeaders(token)
    });

    return response.data?.goal;
};

/**
 * Delete a goal
 */
export const deleteGoal = async (token, goalId) => {
    const url = `${getBackendUrl()}/api/goals/${goalId}`;

    const response = await axios.delete(url, {
        headers: getHeaders(token),
        data: { idToken: token }
    });

    return response.data;
};

/**
 * Fetch real historical daily progress and analytics
 */
export const fetchGoalHistory = async (token, days = 7, date = null) => {
    const url = `${getBackendUrl()}/api/goals/history`;
    const dateParam = date || new Date().toISOString().split('T')[0];

    const response = await axios.post(url, {
        idToken: token,
        days,
        date: dateParam
    }, {
        headers: getHeaders(token)
    });

    return response.data;
};

/**
 * Log study minutes
 */
export const logStudyMinutes = async (token, minutes = 1) => {
    const url = `${getBackendUrl()}/api/goals/log-time`;
    const dateParam = new Date().toISOString().split('T')[0];

    const response = await axios.post(url, {
        idToken: token,
        minutes,
        date: dateParam
    }, {
        headers: getHeaders(token)
    });

    return response.data;
};
