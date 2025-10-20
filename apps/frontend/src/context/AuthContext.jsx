// src/context/AuthProvider.jsx
import { createContext, useEffect, useState } from "react";
import { BACKEND } from "./Constants";

const AuthContextInternal = createContext(); // keep internal only

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

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
        <AuthContextInternal.Provider value={{ user, role, loading }}>
            {children}
        </AuthContextInternal.Provider>
    );
};

export default AuthContextInternal; // export default so useAuth.js can import it
