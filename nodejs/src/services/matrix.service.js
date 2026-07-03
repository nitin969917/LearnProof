const axios = require('axios');
const crypto = require('crypto');

const HOMESERVER_URL = process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8009';
const SHARED_SECRET = process.env.MATRIX_SHARED_SECRET || '1^ZzuyvWeCevsTm1*fTJEJ4KhcTRtdvod*_5QPLK0BGn*Lsx#H';
const ENABLE_MATRIX_CHAT = process.env.ENABLE_MATRIX_CHAT === 'true' || true; // default true for dev

/**
 * Helper to compute HMAC-SHA1 signature for shared-secret registration
 */
function computeRegisterMac(nonce, username, password, isAdmin = false) {
    const adminFlag = isAdmin ? 'admin' : 'notadmin';
    const macData = `${nonce}\x00${username}\x00${password}\x00${adminFlag}`;
    return crypto.createHmac('sha1', SHARED_SECRET).update(macData).digest('hex');
}

/**
 * Register a user on the Matrix homeserver using the shared secret
 */
async function registerUser(username, password, isAdmin = false) {
    if (!ENABLE_MATRIX_CHAT) return null;

    try {
        // Step 1: Request a registration nonce
        const nonceRes = await axios.get(`${HOMESERVER_URL}/_matrix/client/v3/register`);
        const nonce = nonceRes.data.nonce;

        // Step 2: Compute MAC signature
        const mac = computeRegisterMac(nonce, username, password, isAdmin);

        // Step 3: Register user
        const regRes = await axios.post(`${HOMESERVER_URL}/_matrix/client/v3/register`, {
            nonce,
            username,
            password,
            admin: isAdmin,
            mac,
            auth: {
                type: 'org.matrix.login.shared_secret'
            }
        });

        return {
            userId: regRes.data.user_id,
            accessToken: regRes.data.access_token,
            deviceFlow: true
        };
    } catch (err) {
        // If user already exists, it might return 400 with M_USER_IN_USE.
        // We handle it gracefully or log it.
        if (err.response && err.response.data && err.response.data.errcode === 'M_USER_IN_USE') {
            console.log(`Matrix user ${username} already exists, attempting to log in...`);
            return await loginUser(username, password);
        }
        console.error('Matrix registration failed:', err.response?.data || err.message);
        throw err;
    }
}

/**
 * Login a user and retrieve their access token
 */
async function loginUser(username, password) {
    if (!ENABLE_MATRIX_CHAT) return null;

    try {
        const res = await axios.post(`${HOMESERVER_URL}/_matrix/client/v3/login`, {
            type: 'm.login.password',
            identifier: {
                type: 'm.id.user',
                user: username
            },
            password: password
        });

        return {
            userId: res.data.user_id,
            accessToken: res.data.access_token
        };
    } catch (err) {
        console.error('Matrix login failed:', err.response?.data || err.message);
        throw err;
    }
}

module.exports = {
    registerUser,
    loginUser,
    ENABLE_MATRIX_CHAT
};
