// apps/frontend/src/pages/AuthCallback.jsx
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FullScreenLoader from "../components/FullScreenLoader.jsx";
import { BACKEND } from "../context/Constants.js";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        // 1) Ensure backend session alive + short-lived token (optional)
        const tok = await fetch(`${BACKEND}/api/auth/token`, {
          method: "GET",
          credentials: "include",
        });
        if (!tok.ok) throw new Error("Failed to get token");
        const { token } = await tok.json();
        sessionStorage.setItem("tc_token", token);

        // 2) Fetch user
        const me = await fetch(`${BACKEND}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!me.ok) throw new Error("Failed to get user info");

        const { user } = await me.json();
        sessionStorage.setItem("tc_user", JSON.stringify(user));
        sessionStorage.setItem("tc_role", user.role);

        // 3) Optional redirect param support
        const params = new URLSearchParams(location.search);
        const redirect = params.get("redirect");

        if (user.role === "UNSET") {
          navigate("/select-role", { replace: true });
          return;
        }

        if (redirect) {
          navigate(redirect, { replace: true });
          return;
        }

        // 4) Role defaults
        switch (user.role) {
          case "HOST":
            navigate("/my-chargers", { replace: true });
            break;
          case "DRIVER":
            navigate("/chargers", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      } catch (e) {
        console.error("Auth callback error:", e);
        navigate("/", { replace: true });
      }
    })();
  }, [navigate, location.search]);

  return <FullScreenLoader />;
}
