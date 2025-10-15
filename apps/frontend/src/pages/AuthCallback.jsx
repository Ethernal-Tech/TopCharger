// src/pages/auth/callback.jsx
import { useEffect } from "react";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function AuthCallback() {
    useEffect(() => {
        (async () => {
            try {
                console.log("Fetching JWT from backend...");
                const tokenRes = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!tokenRes.ok) {
                    console.warn("Unauthorized, redirecting to login");
                    window.location.href = FRONTEND;
                    return;
                }

                const { token } = await tokenRes.json();
                console.log("JWT received:", token);
                sessionStorage.setItem("tc_token", token);

                // fetch user info
                const meRes = await fetch(`${BACKEND}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!meRes.ok) {
                    console.error("Failed to fetch user info, redirecting to login");
                    window.location.href = FRONTEND;
                    return;
                }

                const { user } = await meRes.json();

                sessionStorage.setItem("tc_user", JSON.stringify(user));

                if (user.role === "UNSET") {
                    window.location.href = `${FRONTEND}/select-role`;
                } else if (user.role === "HOST") {
                    window.location.href = `${FRONTEND}/my-chargers`;
                } else if (user.role === "DRIVER") {
                    window.location.href = `${FRONTEND}/chargers`;
                } else {
                    window.location.href = FRONTEND; // fallback
                }
            } catch (err) {
                console.error("AuthCallback error:", err);
                window.location.href = FRONTEND;
            }
        })();
    }, []);

    return <p>Signing in...</p>;
}
