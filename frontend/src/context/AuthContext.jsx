import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { googleLogout } from '@react-oauth/google';
import axios from "axios";
import { initMatrixClient, disconnectMatrixClient } from "../utils/matrixClient";

const AuthContext = createContext();

// Setup global response interceptor to handle 401 Unauthorized
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("google_token");
            disconnectMatrixClient();
            // If they are on a dashboard/classroom route, redirect to home page to force re-login
            if (window.location.pathname.startsWith("/dashboard") || window.location.pathname.startsWith("/classroom")) {
                sessionStorage.setItem("redirect_to", window.location.pathname + window.location.search);
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [matrixClient, setMatrixClient] = useState(null);

    useEffect(() => {
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
                        if (window.location.pathname.startsWith("/dashboard") || window.location.pathname.startsWith("/classroom")) {
                            sessionStorage.setItem("redirect_to", window.location.pathname + window.location.search);
                            window.location.href = "/";
                            return;
                        }
                    }
                    setUser({
                        uid: decoded.uid || decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                    });
                    setToken(storedToken);

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
                        console.error("Failed to fetch Matrix profile on load:", err);
                    });

                } catch (error) {
                    console.error("Invalid token:", error);
                    localStorage.removeItem("google_token");
                    setMatrixClient(null);
                    disconnectMatrixClient();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (credentialResponse) => {
        const idToken = credentialResponse.credential;
        
        try {
            // exchange Google Token for a long-lived session token
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/login/`, {
                idToken: idToken
            });

            const sessionToken = res.data.token || idToken; // Fallback to idToken if server didn't issue one
            localStorage.setItem("google_token", sessionToken);
            
            const decoded = jwtDecode(sessionToken);
            setUser({
                uid: decoded.uid || decoded.sub,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
                matrixCredentials: res.data.matrixCredentials
            });
            setToken(sessionToken);

            if (res.data.matrixCredentials) {
                const clientInstance = await initMatrixClient(res.data.matrixCredentials);
                setMatrixClient(clientInstance);
            }
        } catch (err) {
            console.error("Login sync failed", err);
            // Fallback to local only if server is down
            localStorage.setItem("google_token", idToken);
            const decoded = jwtDecode(idToken);
            setUser({
                uid: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            });
            setToken(idToken);
        }
    };

    const logout = () => {
        googleLogout();
        localStorage.removeItem("google_token");
        setUser(null);
        setToken(null);
        setMatrixClient(null);
        disconnectMatrixClient();
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