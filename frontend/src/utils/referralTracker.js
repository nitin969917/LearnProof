import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const STORAGE_KEY = 'learnproof_referral_code';
const ATTRIBUTED_KEY = 'learnproof_ref_attributed';

/**
 * Intercept referral parameters from URL, store code in localStorage, and track click counter
 */
export const captureReferralParam = async () => {
    try {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref') || urlParams.get('r') || urlParams.get('referral');

        if (refCode) {
            const cleanCode = refCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            if (cleanCode) {
                localStorage.setItem(STORAGE_KEY, cleanCode);

                // Track click only once per session per code
                const sessionKey = `ref_click_recorded_${cleanCode}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    sessionStorage.setItem(sessionKey, '1');
                    axios.post(`${BACKEND_URL}/api/referrals/track-click`, {
                        code: cleanCode
                    }).catch(err => {
                        console.debug('[ReferralTracker] Click track ignored:', err?.message);
                    });
                }
            }
        }
    } catch (err) {
        console.debug('[ReferralTracker] captureReferralParam error:', err?.message);
    }
};

/**
 * Attribute current logged-in user to stored referral code if present
 */
export const attributePendingReferral = async (token) => {
    try {
        if (!token) return;
        const code = localStorage.getItem(STORAGE_KEY);
        if (!code) return;

        const alreadyAttributedCode = localStorage.getItem(ATTRIBUTED_KEY);
        if (alreadyAttributedCode === code) return;

        const res = await axios.post(`${BACKEND_URL}/api/referrals/attribute`, 
            { code },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (res.data?.success) {
            localStorage.setItem(ATTRIBUTED_KEY, code);
            localStorage.removeItem(STORAGE_KEY); // attribution fulfilled
            console.log('[ReferralTracker] Successfully attributed referral:', code);
        }
    } catch (err) {
        // If already attributed or error, mark as processed locally so we don't repeat
        if (err?.response?.status === 400 || err?.response?.data?.alreadyAttributed) {
            localStorage.removeItem(STORAGE_KEY);
        }
        console.debug('[ReferralTracker] Attribution response:', err?.response?.data?.message || err?.message);
    }
};
