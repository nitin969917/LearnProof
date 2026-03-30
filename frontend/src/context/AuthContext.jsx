import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { googleLogout } from '@react-oauth/google';
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            const storedToken = localStorage.getItem("google_token");
            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    // We trust the backend to handle expiration now for our custom tokens
                    setUser({
                        uid: decoded.uid || decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                    });
                    setToken(storedToken);
                } catch (error) {
                    console.error("Invalid token:", error);
                    localStorage.removeItem("google_token");
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
                picture: decoded.picture
            });
            setToken(sessionToken);
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
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);