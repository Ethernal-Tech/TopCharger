import { useEffect } from "react";

export default function AuthCallback() {
    useEffect(() => {
        (async () => {
            try {
                console.log("Fetching JWT from backend..."); // <-- debug log
                const res = await fetch("http://localhost:3000/api/auth/token", {
                    method: "GET",
                    credentials: "include", // send cookies
                });

                console.log("Response status:", res.status); // <-- debug log

                if (!res.ok) {
                    console.warn("Unauthorized, redirecting to login"); // <-- debug log
                    // redirect to login page on frontend
                    window.location.href = "http://localhost:5173/login";
                    return;
                }

                const { token } = await res.json();
                console.log("JWT received:", token); // 
                sessionStorage.setItem("tc_token", token); // store JWT
                // redirect to dashboard/home on frontend
                window.location.href = "http://localhost:5173/";
            } catch (err) {
                console.error("AuthCallback error:", err);
                window.location.href = "http://localhost:5173/login";
            }
        })();
    }, []);

    return <p>Signing in...</p>;
}
