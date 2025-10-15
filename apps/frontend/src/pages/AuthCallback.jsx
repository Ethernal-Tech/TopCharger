import { useEffect, useState } from "react";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function AuthCallback() {
    const [loading, setLoading] = useState(true);  // Add loading state

    useEffect(() => {
        (async () => {
            try {
                // Fetch JWT from backend
                const tokenRes = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!tokenRes.ok) {
                    window.location.href = FRONTEND;
                    return;
                }

                const { token } = await tokenRes.json();
                sessionStorage.setItem("tc_token", token);

                // Fetch user info
                const meRes = await fetch(`${BACKEND}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!meRes.ok) {
                    window.location.href = FRONTEND;
                    return;
                }

                const { user } = await meRes.json();
                sessionStorage.setItem("tc_user", JSON.stringify(user));
                sessionStorage.setItem("tc_role", user.role);

                // Redirect based on role
                switch (user.role) {
                    case "UNSET":
                        window.location.href = `${FRONTEND}/select-role`;
                        break;
                    case "HOST":
                        window.location.href = `${FRONTEND}/my-chargers`;
                        break;
                    case "DRIVER":
                        window.location.href = `${FRONTEND}/chargers`;
                        break;
                    default:
                        window.location.href = FRONTEND;
                }
            } catch (err) {
                console.error("Auth callback error:", err);
                window.location.href = FRONTEND;
            } finally {
                setLoading(false);  // Set loading to false after logic completes
            }
        })();
    }, []);

    // If loading is true, show the loading spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-green-900 font-semibold">Signing in...</p>
                </div>
            </div>
        );
    }

    // This will never be rendered since the redirect happens
    return null;
}
