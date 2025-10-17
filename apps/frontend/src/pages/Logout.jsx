// src/pages/LogoutPage.jsx
import { useEffect } from "react";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function LogoutPage() {
    useEffect(() => {
        // Clear frontend session storage
        sessionStorage.removeItem("tc_token");
        sessionStorage.removeItem("tc_user");
        sessionStorage.removeItem("tc_role");

        // Redirect to backend signout, then back to frontend
        window.location.href = `${BACKEND}/api/auth/signout?callbackUrl=${FRONTEND}`;
    }, []);

    return <FullScreenLoader message="Logging out..." />;
}
