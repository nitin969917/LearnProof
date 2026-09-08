import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { googleLogout } from '@react-oauth/google';
import axios from "axios";
import { initMatrixClient, disconnectMatrixClient } from "../utils/matrixClient";
import { disconnectSocialSocket } from "../utils/socialSocket";
import { captureReferralParam, attributePendingReferral } from "../utils/referralTracker";
import { useLiveRoomPipStore } from "../store/liveRoomPipStore";

const AuthContext = createContext();

// Setup global response interceptor to handle 401 Unauthorized
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isLoginRequest = error.config?.url?.includes('/api/login');
            if (!isLoginRequest) {
                localStorage.removeItem("google_token");
                disconnectMatrixClient();
                // If they are on a dashboard/classroom route, redirect to home page to force re-login
                if (window.location.pathname.startsWith("/dashboard") || window.location.pathname.startsWith("/classroom") || window.location.pathname.startsWith("/ambassador")) {
                    sessionStorage.setItem("redirect_to", window.location.pathname + window.location.search);
                    localStorage.setItem("redirect_to", window.location.pathname + window.location.search);
                    window.location.href = "/";
                }
            }
        }
        return Promise.reject(error);
    }
);

// Helper to extract token from URL hash or localStorage synchronously
const getInitialAuth = () => {
    if (typeof window === "undefined") return { user: null, token: null };

    // 1. Check if returning from Google OAuth redirect with hash token
    try {
        const hash = window.location.hash;
        if (hash && (hash.includes("id_token=") || hash.includes("credential="))) {
            const params = new URLSearchParams(hash.substring(1));
            const idToken = params.get("id_token") || params.get("credential");
            if (idToken) {
                const decoded = jwtDecode(idToken);
                const currentTime = Date.now() / 1000;
                if (!decoded.exp || decoded.exp > currentTime) {
                    localStorage.setItem("google_token", idToken);
                    return {
                        user: {
                            id: decoded.id || decoded.uid || decoded.sub,
                            uid: decoded.uid || decoded.sub,
                            email: decoded.email,
                            name: decoded.name,
                            picture: decoded.picture
                        },
                        token: idToken
                    };
                }
            }
        }
    } catch (e) {
        console.warn("Error parsing OAuth hash token on boot:", e);
    }

    // 2. Check stored token in localStorage
    try {
        const storedToken = localStorage.getItem("google_token");
        if (storedToken) {
            const decoded = jwtDecode(storedToken);
            const currentTime = Date.now() / 1000;
            if (decoded.exp && decoded.exp < currentTime) {
                localStorage.removeItem("google_token");
                return { user: null, token: null };
            }
            return {
                user: {
                    id: decoded.id || decoded.uid || decoded.sub,
                    uid: decoded.uid || decoded.sub,
                    email: decoded.email,
                    name: decoded.name,
                    picture: decoded.picture
                },
                token: storedToken
            };
        }
    } catch (e) {
        console.warn("Error parsing stored token on boot:", e);
        localStorage.removeItem("google_token");
    }

    return { user: null, token: null };
};

export const AuthProvider = ({ children }) => {
    const initialAuth = getInitialAuth();
    const [user, setUser] = useState(initialAuth.user);
    const [token, setToken] = useState(initialAuth.token);
    const [loading, setLoading] = useState(false);
    const [matrixClient, setMatrixClient] = useState(null);

    useEffect(() => {
        // Capture any incoming referral query parameter
        captureReferralParam();

        const loadUser = async () => {
            const storedToken = localStorage.getItem("google_token");
            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        console.warn("Stored token is expired, clearing...");
                        localStorage.removeItem("google_token");
                        setMatrixClient(null);
                        disconnectMatrixClient();
                        if (window.location.pathname.startsWith("/dashboard") || window.location.pathname.startsWith("/classroom") || window.location.pathname.startsWith("/ambassador")) {
                            sessionStorage.setItem("redirect_to", window.location.pathname + window.location.search);
                            localStorage.setItem("redirect_to", window.location.pathname + window.location.search);
                            window.location.href = "/";
                            return;
                        }
                    }
                    setUser(prev => ({
                        ...(prev || {}),
                        id: decoded.id || decoded.uid || decoded.sub,
                        uid: decoded.uid || decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                    }));
                    setToken(storedToken);

                    // Attribute referral in background if pending
                    attributePendingReferral(storedToken);

                    // Fetch profile to get Matrix credentials
                    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/profile/`, {
                        idToken: storedToken
                    }).then(res => {
                        if (res.data && res.data.matrixCredentials) {
                            setUser(prev => ({
                                ...prev,
                                matrixCredentials: res.data.matrixCredentials
                            }));
                            initMatrixClient(res.data.matrixCredentials).then(clientInstance => {
                                setMatrixClient(clientInstance);
                            });
                        }
                    }).catch(err => {
                        console.warn("Failed to fetch Matrix profile on load:", err?.message || err);
                    });

                } catch (error) {
                    console.error("Invalid token:", error);
                    localStorage.removeItem("google_token");
                    setMatrixClient(null);
                    disconnectMatrixClient();
                }
            }
        };

        loadUser();
    }, []);

    const login = async (credentialResponse) => {
        const idToken = credentialResponse?.credential || credentialResponse?.id_token;
        if (!idToken) return;

        // 1. Instant Optimistic Auth (< 1ms): decode token immediately & enable instant UI navigation
        try {
            const decoded = jwtDecode(idToken);
            const optimisticUser = {
                id: decoded.id || decoded.uid || decoded.sub,
                uid: decoded.uid || decoded.sub,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            };
            setUser(optimisticUser);
            setToken(idToken);
            localStorage.setItem("google_token", idToken);
            setLoading(false);
        } catch (e) {
            console.error("Optimistic token decode failed:", e);
        }

        // 2. Non-blocking Background Server Sync: exchange for long-lived session token & sync Matrix credentials
        (async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/login/`, {
                    idToken: idToken
                });

                const sessionToken = res.data?.token || idToken;
                localStorage.setItem("google_token", sessionToken);

                const serverDecoded = jwtDecode(sessionToken);
                setUser(prev => ({
                    ...prev,
                    id: serverDecoded.id || serverDecoded.uid || serverDecoded.sub || res.data?.id || prev?.id,
                    uid: serverDecoded.uid || serverDecoded.sub || prev?.uid,
                    email: serverDecoded.email || prev?.email,
                    name: serverDecoded.name || prev?.name,
                    picture: serverDecoded.picture || prev?.picture,
                    matrixCredentials: res.data?.matrixCredentials || prev?.matrixCredentials
                }));
                setToken(sessionToken);

                // Attribute referral in background
                attributePendingReferral(sessionToken);

                if (res.data?.matrixCredentials) {
                    initMatrixClient(res.data.matrixCredentials).then(clientInstance => {
                        setMatrixClient(clientInstance);
                    }).catch(err => {
                        console.warn("Matrix client background init error:", err);
                    });
                }
            } catch (err) {
                console.warn("Background server login sync warning:", err?.message || err);
                attributePendingReferral(idToken);
            }
        })();
    };

    const logout = () => {
        googleLogout();
        localStorage.removeItem("google_token");
        localStorage.removeItem("learnproof_social_user");
        setUser(null);
        setToken(null);
        setMatrixClient(null);
        disconnectMatrixClient();
        disconnectSocialSocket();
        useLiveRoomPipStore.getState().clearActiveRoom();
    };

    const updateUser = (data) => {
        setUser(prev => {
            if (!prev) return null;
            return {
                ...prev,
                ...data
            };
        });
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, matrixClient, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);