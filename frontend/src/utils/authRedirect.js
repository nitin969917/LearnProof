/**
 * Auth Redirect Manager
 * Handles saving, clearing, and resolving post-authentication redirect targets
 * across OAuth redirect flows (Google OAuth implicit hash fragment, query params,
 * session storage, local storage, and cookies).
 */

export const setAuthRedirect = (target) => {
    if (!target || typeof target !== 'string') return;
    try {
        sessionStorage.setItem("redirect_to", target);
        localStorage.setItem("redirect_to", target);
        document.cookie = `redirect_to=${encodeURIComponent(target)}; path=/; max-age=3600; SameSite=Lax`;
    } catch (e) {
        console.warn("[AuthRedirect] Failed to set auth redirect:", e);
    }
};

export const clearAuthRedirect = () => {
    try {
        sessionStorage.removeItem("redirect_to");
        localStorage.removeItem("redirect_to");
        sessionStorage.removeItem("is_logging_in");
        sessionStorage.removeItem("is_authenticating");
        document.cookie = "redirect_to=; path=/; max-age=0; SameSite=Lax";
    } catch (e) {
        console.warn("[AuthRedirect] Failed to clear auth redirect:", e);
    }
};

export const resolvePostAuthRedirect = () => {
    if (typeof window === 'undefined') return "/dashboard";

    // 1. Check URL hash parameters (Google OAuth redirect fragment, e.g. #id_token=...&state=%2Fambassador%2Fportal)
    try {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const state = params.get('state');
            if (state) {
                const decoded = decodeURIComponent(state);
                if (decoded && decoded.startsWith('/') && decoded !== '/') {
                    return decoded;
                }
            }
        }
    } catch (e) {}

    // 2. Check search query parameters (?redirect_to=... or ?state=...)
    try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryTarget = searchParams.get('redirect_to') || searchParams.get('state');
        if (queryTarget) {
            const decoded = decodeURIComponent(queryTarget);
            if (decoded && decoded.startsWith('/') && decoded !== '/') {
                return decoded;
            }
        }
    } catch (e) {}

    // 3. Check pending push notification deep-link
    try {
        const pendingNotif = sessionStorage.getItem('pending_notification_route') || localStorage.getItem('pending_notification_route');
        if (pendingNotif && pendingNotif.startsWith('/') && pendingNotif !== '/' && pendingNotif !== '/dashboard') {
            sessionStorage.removeItem('pending_notification_route');
            localStorage.removeItem('pending_notification_route');
            return pendingNotif;
        }
    } catch (e) {}

    // 4. Check sessionStorage or localStorage
    try {
        const stored = sessionStorage.getItem("redirect_to") || localStorage.getItem("redirect_to");
        if (stored && stored.startsWith('/') && stored !== '/' && stored !== '/dashboard') {
            return stored;
        }
    } catch (e) {}

    // 5. Check cookie
    try {
        const match = document.cookie.match(/(?:^|;\s*)redirect_to=([^;]*)/);
        if (match && match[1]) {
            const cookieRedirect = decodeURIComponent(match[1]);
            if (cookieRedirect && cookieRedirect.startsWith('/') && cookieRedirect !== '/' && cookieRedirect !== '/dashboard') {
                return cookieRedirect;
            }
        }
    } catch (e) {}

    return "/dashboard";
};
