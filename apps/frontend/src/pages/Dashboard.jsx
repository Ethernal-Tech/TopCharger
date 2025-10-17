// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";

const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("tc_token");
        const role = sessionStorage.getItem("tc_role");

        if (token && role) {
            if (role === "HOST") window.location.href = `${FRONTEND}/my-chargers`;
            else if (role === "DRIVER") window.location.href = `${FRONTEND}/chargers`;
            else setLoading(false);
        } else {
            setLoading(false);
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
        <div className="min-h-screen relative flex flex-col items-center text-center px-4 pt-16 overflow-hidden">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center justify-start max-w-4xl">
                {/* Title */}
                <h1 className="text-7xl font-extrabold text-white mb-8">
                    TopCharger
                </h1>

                {/* Subtitle with highlighted words */}
                <p className="text-3xl max-w-3xl mb-12 text-white">
                    Making EV charging{" "}
                    <span className="font-bold text-green-900">simple</span>,{" "}
                    <span className="font-bold text-green-900">open</span>, and{" "}
                    <span className="font-bold text-green-900">everywhere</span>.
                </p>

                {/* Features description */}
                <div className="flex flex-col sm:flex-row justify-start sm:justify-between w-full max-w-7xl mb-12 text-white font-semibold text-2xl px-6 sm:px-0 gap-y-4 sm:gap-x-36">
                    <div className="whitespace-nowrap text-left">Anyone can host</div>
                    <div className="whitespace-nowrap text-center">Find & plug in</div>
                    <div className="whitespace-nowrap text-right">Pay in one app</div>
                </div>

                {/* Login buttons with small SVG icons */}
                <div className="flex gap-4 flex-wrap justify-center">
                    <button
                        onClick={handleGoogleLogin}
                        className="px-6 py-3 bg-white border border-green-400 rounded-lg shadow hover:bg-green-50 transition flex items-center gap-2"
                    >
                        {/* Minimal Google G icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.35 11.1h-9.18v2.89h5.27c-.23 1.3-1.2 3.81-5.27 3.81-3.17 0-5.77-2.61-5.77-5.81s2.6-5.81 5.77-5.81c1.81 0 3.03.78 3.73 1.46l2.55-2.46C17.05 2.5 15.1 1.7 12.17 1.7 6.72 1.7 2.35 6.08 2.35 11.53s4.37 9.83 9.82 9.83c5.67 0 9.42-3.98 9.42-9.58 0-.64-.07-1.08-.24-1.68z" />
                        </svg>
                        Login with Google
                    </button>
                    <button
                        onClick={handleWalletLogin}
                        className="px-6 py-3 bg-white border border-green-400 rounded-lg shadow hover:bg-green-50 transition flex items-center gap-2"
                    >
                        {/* Minimal wallet icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 7H3a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-1 8H4v-7h16v7z" />
                        </svg>
                        Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
