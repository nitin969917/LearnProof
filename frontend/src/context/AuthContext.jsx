import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { googleLogout } from '@react-oauth/google';

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
                    // Check if token is expired
                    if (decoded.exp * 1000 < Date.now()) {
                        localStorage.removeItem("google_token");
                        setUser(null);
                        setToken(null);
                    } else {
                        setUser({
                            uid: decoded.sub,
                            email: decoded.email,
                            name: decoded.name,
                            picture: decoded.picture
                        });
                        setToken(storedToken);
                    }
                } catch (error) {
                    console.error("Invalid token:", error);
                    localStorage.removeItem("google_token");
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = (credentialResponse) => {
        const idToken = credentialResponse.credential;
        localStorage.setItem("google_token", idToken);
        const decoded = jwtDecode(idToken);
        setUser({
            uid: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture
        });
        setToken(idToken);
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