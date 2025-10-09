// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("http://localhost:3000/api/auth/token", {
                    method: "GET",
                    credentials: "include", // send cookies
                });

                if (!res.ok) {
                    // Redirect to login if token fetch fails
                    navigate("/login");
                    return;
                }

                const { token } = await res.json();
                sessionStorage.setItem("tc_token", token); // store token
                navigate("/"); // redirect to dashboard/home
            } catch (err) {
                console.error(err);
                navigate("/login");
            }
        })();
    }, [navigate]);

    return <p>Signing in...</p>;
}
