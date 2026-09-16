/**
 * Auth Redirect Manager
 * Handles saving, clearing, and resolving post-authentication redirect targets
 * across OAuth redirect flows (Google OAuth implicit hash fragment, query params,
 * session storage, local storage, and cookies).
 */

let inMemoryTarget = null;

export const normalizeRedirectPath = (path) => {
    if (!path || typeof path !== 'string') return '/dashboard';
    const clean = path.trim();
    if (
        clean === '/ambassador' || 
        clean === '/campus-ambassador' || 
        clean === '/referrals' || 
        clean === '/referral-program' ||
        clean.startsWith('/ambassador/')
    ) {
        return '/ambassador/portal';
    }
    if (clean === '/' || clean === '') {
        return '/dashboard';
    }
    return clean;
};

export const setAuthRedirect = (target) => {
    if (!target || typeof target !== 'string') return;
    const normalized = normalizeRedirectPath(target);
    inMemoryTarget = normalized;
    try {
        sessionStorage.setItem("redirect_to", normalized);
        localStorage.setItem("redirect_to", normalized);
        document.cookie = `redirect_to=${encodeURIComponent(normalized)}; path=/; max-age=1800; SameSite=Lax`;
    } catch (e) {
        console.warn("[AuthRedirect] Failed to set auth redirect:", e);
    }
};

export const clearAuthRedirect = () => {
    inMemoryTarget = null;
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

    // 0. Check in-memory target first
    if (inMemoryTarget && inMemoryTarget.startsWith('/') && inMemoryTarget !== '/') {
        return normalizeRedirectPath(inMemoryTarget);
    }

    // 1. Check URL hash parameters (Google OAuth redirect fragment, e.g. #id_token=...&state=%2Fambassador%2Fportal)
    try {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const state = params.get('state');
            if (state) {
                let decoded = decodeURIComponent(state);
                if (decoded.includes('%')) {
                    try { decoded = decodeURIComponent(decoded); } catch (e) {}
                }
                if (decoded && decoded.startsWith('/') && decoded !== '/') {
                    const normalized = normalizeRedirectPath(decoded);
                    inMemoryTarget = normalized;
                    return normalized;
                }
            }
        }
    } catch (e) {}

    // 2. Check search query parameters (?redirect_to=... or ?state=...)
    try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryTarget = searchParams.get('redirect_to') || searchParams.get('state');
        if (queryTarget) {
            let decoded = decodeURIComponent(queryTarget);
            if (decoded.includes('%')) {
                try { decoded = decodeURIComponent(decoded); } catch (e) {}
            }
            if (decoded && decoded.startsWith('/') && decoded !== '/') {
                const normalized = normalizeRedirectPath(decoded);
                inMemoryTarget = normalized;
                return normalized;
            }
        }
    } catch (e) {}

    // 3. Check pending push notification deep-link
    try {
        const pendingNotif = sessionStorage.getItem('pending_notification_route') || localStorage.getItem('pending_notification_route');
        if (pendingNotif && pendingNotif.startsWith('/') && pendingNotif !== '/' && pendingNotif !== '/dashboard') {
            sessionStorage.removeItem('pending_notification_route');
            localStorage.removeItem('pending_notification_route');
            const normalized = normalizeRedirectPath(pendingNotif);
            inMemoryTarget = normalized;
            return normalized;
        }
    } catch (e) {}

    // 4. Check sessionStorage or localStorage
    try {
        const stored = sessionStorage.getItem("redirect_to") || localStorage.getItem("redirect_to");
        if (stored && stored.startsWith('/') && stored !== '/' && stored !== '/dashboard') {
            const normalized = normalizeRedirectPath(stored);
            inMemoryTarget = normalized;
            return normalized;
        }
    } catch (e) {}

    // 5. Check cookie
    try {
        const match = document.cookie.match(/(?:^|;\s*)redirect_to=([^;]*)/);
        if (match && match[1]) {
            let cookieRedirect = decodeURIComponent(match[1]);
            if (cookieRedirect.includes('%')) {
                try { cookieRedirect = decodeURIComponent(cookieRedirect); } catch (e) {}
            }
            if (cookieRedirect && cookieRedirect.startsWith('/') && cookieRedirect !== '/' && cookieRedirect !== '/dashboard') {
                const normalized = normalizeRedirectPath(cookieRedirect);
                inMemoryTarget = normalized;
                return normalized;
            }
        }
    } catch (e) {}

    return "/dashboard";
};
