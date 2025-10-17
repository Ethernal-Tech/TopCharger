// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";

const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";
const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function Dashboard() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("tc_token");
        const role = sessionStorage.getItem("tc_role");

        if (token && role) {
            // Redirect based on role
            if (role === "HOST") window.location.href = `${FRONTEND}/my-chargers`;
            else if (role === "DRIVER") window.location.href = `${FRONTEND}/chargers`;
            else setLoading(false); // unknown role, stay on dashboard
        } else {
            setLoading(false); // no session, show login UI
        }
    }, []);

    const handleGoogleLogin = () => {
        const callbackUrl = encodeURIComponent(`${FRONTEND}/auth/callback`);
        window.location.href = `${BACKEND}/api/auth/signin/google}`;
    };

    const handleWalletLogin = () => {
        if (window.solana?.isPhantom) {
            window.solana.connect()
                .then(resp => console.log("Connected wallet:", resp.publicKey.toString()))
                .catch(console.error);
        } else {
            alert("Phantom Wallet not installed!");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-green-100">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen relative bg-cover bg-center bg-fixed overflow-hidden"
            style={{ backgroundImage: "url('/bg-charger.png')" }}
        >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-400 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-500 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>

            <div className="relative z-10 flex flex-col items-center justify-start text-center px-4 pt-16">
                <h1 className="text-4xl font-bold text-green-900 mb-4">
                    Welcome to Our Charger Platform ⚡
                </h1>
                <p className="text-green-900 max-w-2xl mb-8">
                    Find and share electric vehicle chargers near you. <br />
                    Join as a host to list your charger, or start driving to access available chargers easily. <br />
                    Fast, secure, and community-driven.
                </p>

                <div className="flex gap-4 flex-wrap justify-center">
                    <button
                        onClick={handleGoogleLogin}
                        className="px-6 py-3 bg-white border border-green-400 rounded-lg shadow hover:bg-green-50 transition"
                    >
                        🔑 Login with Google
                    </button>
                    <button
                        onClick={handleWalletLogin}
                        className="px-6 py-3 bg-white border border-green-400 rounded-lg shadow hover:bg-green-50 transition"
                    >
                        💳 Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
