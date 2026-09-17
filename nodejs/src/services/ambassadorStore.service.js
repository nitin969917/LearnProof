const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'ambassador_hub_data.json');

// Ensure data directory and file exist
function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                activities: {},       // referralCode -> array of activities
                feedback: {},         // referralCode -> array of feedback items
                sessionRequests: {},  // referralCode -> array of session requests
                checklistStates: {}   // referralCode -> { taskId: boolean }
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        }
    } catch (err) {
        console.error('Error ensuring ambassador data file:', err);
    }
}

function readStore() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading ambassador store:', err);
        return { activities: {}, feedback: {}, sessionRequests: {}, checklistStates: {} };
    }
}

function writeStore(data) {
    try {
        ensureDataFile();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing ambassador store:', err);
    }
}

class AmbassadorStoreService {
    getAmbassadorRecord(code) {
        const normalized = (code || '').toUpperCase().trim();
        const store = readStore();
        return {
            activities: store.activities?.[normalized] || [],
            feedback: store.feedback?.[normalized] || [],
            sessionRequests: store.sessionRequests?.[normalized] || [],
            checklistStates: store.checklistStates?.[normalized] || {}
        };
    }

    logActivity(code, { type, title, description, studentsReached, proofUrl, date }) {
        const normalized = (code || '').toUpperCase().trim();
        const store = readStore();
        if (!store.activities[normalized]) {
            store.activities[normalized] = [];
        }

        const newActivity = {
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: type || 'outreach',
            title: title || 'Campus Outreach Activity',
            description: description || '',
            studentsReached: Number(studentsReached) || 0,
            proofUrl: proofUrl || '',
            date: date || new Date().toISOString(),
            status: 'completed',
            xpAwarded: type === 'workshop' ? 50 : type === 'club_collab' ? 50 : 20,
            createdAt: new Date().toISOString()
        };

        store.activities[normalized].unshift(newActivity);
        writeStore(store);
        return newActivity;
    }

    submitFeedback(code, { feedbackType, feedbackText, priority, studentQuote }) {
        const normalized = (code || '').toUpperCase().trim();
        const store = readStore();
        if (!store.feedback[normalized]) {
            store.feedback[normalized] = [];
        }

        const newFeedback = {
            id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            feedbackType: feedbackType || 'product_feedback',
            feedbackText: feedbackText || studentQuote || '',
            priority: priority || 'medium',
            status: 'sent_to_team',
            xpAwarded: 5,
            createdAt: new Date().toISOString()
        };

        store.feedback[normalized].unshift(newFeedback);
        writeStore(store);
        return newFeedback;
    }

    requestCollegeSession(code, { college, department, expectedStudents, preferredDate, contactPerson, sessionType, notes }) {
        const normalized = (code || '').toUpperCase().trim();
        const store = readStore();
        if (!store.sessionRequests[normalized]) {
            store.sessionRequests[normalized] = [];
        }

        const newRequest = {
            id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            college: college || 'College Campus',
            department: department || 'Engineering / CS',
            expectedStudents: Number(expectedStudents) || 50,
            preferredDate: preferredDate || null,
            contactPerson: contactPerson || '',
            sessionType: sessionType || 'offline_workshop',
            notes: notes || '',
            status: 'reviewing',
            createdAt: new Date().toISOString()
        };

        store.sessionRequests[normalized].unshift(newRequest);
        writeStore(store);
        return newRequest;
    }

    updateChecklist(code, taskId, completed) {
        const normalized = (code || '').toUpperCase().trim();
        const store = readStore();
        if (!store.checklistStates[normalized]) {
            store.checklistStates[normalized] = {};
        }
        store.checklistStates[normalized][taskId] = Boolean(completed);
        writeStore(store);
        return store.checklistStates[normalized];
    }

    // ── Admin Management Methods ──
    getAllActivities() {
        const store = readStore();
        const result = [];
        Object.entries(store.activities || {}).forEach(([code, acts]) => {
            acts.forEach(act => {
                result.push({ ...act, referralCode: code });
            });
        });
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    updateActivityStatus(activityId, status) {
        const store = readStore();
        let updated = null;
        Object.keys(store.activities || {}).forEach(code => {
            store.activities[code] = store.activities[code].map(act => {
                if (act.id === activityId) {
                    updated = { ...act, status };
                    return updated;
                }
                return act;
            });
        });
        writeStore(store);
        return updated;
    }

    deleteActivity(activityId) {
        const store = readStore();
        let removed = false;
        Object.keys(store.activities || {}).forEach(code => {
            const before = store.activities[code].length;
            store.activities[code] = store.activities[code].filter(act => act.id !== activityId);
            if (store.activities[code].length < before) removed = true;
        });
        writeStore(store);
        return removed;
    }

    getAllFeedback() {
        const store = readStore();
        const result = [];
        Object.entries(store.feedback || {}).forEach(([code, fbs]) => {
            fbs.forEach(fb => {
                result.push({ ...fb, referralCode: code });
            });
        });
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    updateFeedbackStatus(feedbackId, status) {
        const store = readStore();
        let updated = null;
        Object.keys(store.feedback || {}).forEach(code => {
            store.feedback[code] = store.feedback[code].map(fb => {
                if (fb.id === feedbackId) {
                    updated = { ...fb, status };
                    return updated;
                }
                return fb;
            });
        });
        writeStore(store);
        return updated;
    }

    getAllSessionRequests() {
        const store = readStore();
        const result = [];
        Object.entries(store.sessionRequests || {}).forEach(([code, reqs]) => {
            reqs.forEach(req => {
                result.push({ ...req, referralCode: code });
            });
        });
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    updateSessionStatus(sessionId, status) {
        const store = readStore();
        let updated = null;
        Object.keys(store.sessionRequests || {}).forEach(code => {
            store.sessionRequests[code] = store.sessionRequests[code].map(sess => {
                if (sess.id === sessionId) {
                    updated = { ...sess, status };
                    return updated;
                }
                return sess;
            });
        });
        writeStore(store);
        return updated;
    }
}

module.exports = new AmbassadorStoreService();
