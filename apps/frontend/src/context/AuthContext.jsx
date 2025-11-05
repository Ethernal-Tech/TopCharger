// apps/frontend/src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";

const AuthContextInternal = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch JWT token (httpOnly cookie validated by backend)
        const tokenRes = await fetch("/api/auth/token", {
          credentials: "include",
        });

        if (!tokenRes.ok) {
          setUser(null);
          setRole(null);
          return;
        }

        const { token } = await tokenRes.json();
        sessionStorage.setItem("tc_token", token);

        // Fetch current user session
        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!meRes.ok) throw new Error("Failed to fetch user info");

        const { user } = await meRes.json();
        setUser(user);
        setRole(user.role);
        sessionStorage.setItem("tc_user", JSON.stringify(user));
        sessionStorage.setItem("tc_role", user.role);
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

export default AuthContextInternal;
