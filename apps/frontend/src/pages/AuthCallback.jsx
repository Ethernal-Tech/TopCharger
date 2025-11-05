// apps/frontend/src/pages/AuthCallback.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        // 1) Get JWT from backend (stored as cookie server-side; we just keep a copy)
        const tokenRes = await fetch(`/api/auth/token`, {
          credentials: "include",
        });
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();
        sessionStorage.setItem("tc_token", token);

        // 2) Get current user/session
        const meRes = await fetch(`/api/auth/me`, { credentials: "include" });
        if (!meRes.ok) throw new Error("Failed to get user info");
        const { user } = await meRes.json();

        // 3) Cache user + role locally
        sessionStorage.setItem("tc_user", JSON.stringify(user));
        sessionStorage.setItem("tc_role", user.role);

        // 4) Route by role
        switch (user.role) {
          case "UNSET":
            navigate("/select-role", { replace: true });
            break;
          case "HOST":
            navigate("/my-chargers", { replace: true });
            break;
          case "DRIVER":
            navigate("/chargers", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err.message || "Unknown error");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <FullScreenLoader />;
  if (error) return null;
  return null;
}
