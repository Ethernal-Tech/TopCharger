import { createContext, useContext, useEffect, useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true); // true until auth is confirmed

    useEffect(() => {
        (async () => {
            try {
                const tokenRes = await fetch(`${BACKEND}/api/auth/token`, {
                    credentials: "include",
                });
                if (!tokenRes.ok) {
                    setUser(null);
                    setRole(null);
                } else {
                    const { token } = await tokenRes.json();
                    sessionStorage.setItem("tc_token", token);

                    const meRes = await fetch(`${BACKEND}/api/auth/me`, {
                        credentials: "include",
                    });
                    if (!meRes.ok) throw new Error("Failed to fetch user");
                    const { user } = await meRes.json();
                    setUser(user);
                    setRole(user.role);
                    sessionStorage.setItem("tc_user", JSON.stringify(user));
                    sessionStorage.setItem("tc_role", user.role);
                }
            } catch (err) {
                console.error("Auth fetch failed:", err);
                setUser(null);
                setRole(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
