import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function AuthCallback() {
    const [loading, setLoading] = useState(true); // Loading spinner
    const [error, setError] = useState(null);     // Optional error
    const navigate = useNavigate();
    const ranRef = useRef(false);                 // Prevent double effect

    useEffect(() => {
        if (ranRef.current) return;
        ranRef.current = true;

        const fetchUser = async () => {
            try {
                // Fetch token from backend
                const tokenRes = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!tokenRes.ok) throw new Error("Failed to get token");

                const { token } = await tokenRes.json();
                sessionStorage.setItem("tc_token", token);

                // Fetch user info
                const meRes = await fetch(`${BACKEND}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!meRes.ok) throw new Error("Failed to get user info");

                const { user } = await meRes.json();
                sessionStorage.setItem("tc_user", JSON.stringify(user));
                sessionStorage.setItem("tc_role", user.role);

                // Navigate based on role
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
        };

        fetchUser();
    }, [navigate]);

    // Show spinner while fetching
    if (loading) return <FullScreenLoader message="Signing in..." />;

    // Optionally show error if needed
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-100">
                <p className="text-red-900 font-semibold">{error}</p>
            </div>
        );
    }

    // Never render anything else; redirect happens automatically
    return null;
}
