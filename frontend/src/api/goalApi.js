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
 * Fetch today's dynamic smart goals (and student custom goals)
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
 * Add a student-defined custom goal
 */
export const createCustomGoal = async (token, { title, target_value = 1, date = null }) => {
    const url = `${getBackendUrl()}/api/goals/custom`;
    const dateParam = date || new Date().toISOString().split('T')[0];

    const response = await axios.post(url, {
        idToken: token,
        title,
        target_value,
        date: dateParam
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
 * Fetch real historical daily goals completion data
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

    return response.data?.history || [];
};

/**
 * Log study minutes towards daily study goal
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
