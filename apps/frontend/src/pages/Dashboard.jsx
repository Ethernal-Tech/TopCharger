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
        window.location.href = `${BACKEND}/api/auth/signin`;
    };

    const handleWalletLogin = () => {
        if (window.solana?.isPhantom) {
            window.solana
                .connect()
                .then((resp) => console.log("Connected wallet:", resp.publicKey.toString()))
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
        <div className="min-h-screen relative flex flex-col items-center text-center px-4 sm:px-6 md:px-16 pt-16 sm:pt-24 overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/top_charger.png')" }}
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70"></div>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center justify-start max-w-full sm:max-w-4xl">
                <h1
                    className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 sm:mb-8
               bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent
               sm:bg-clip-text sm:text-transparent
               text-white sm:text-transparent
               drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
                >
                    TopCharger
                </h1>

                <p className="text-lg sm:text-2xl md:text-3xl max-w-full sm:max-w-3xl mb-8 sm:mb-12 text-slate-100">
                    Making EV charging{" "}
                    <span className="font-extrabold text-emerald-300">simple</span>,{" "}
                    <span className="font-extrabold text-emerald-300">open</span>, and{" "}
                    <span className="font-extrabold text-emerald-300">everywhere</span>.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg shadow 
                        bg-emerald-600 text-white hover:bg-emerald-500 
                        transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M21.35 11.1h-9.18v2.89h5.27c-.23 1.3-1.2 3.81-5.27 3.81-3.17 0-5.77-2.61-5.77-5.81s2.6-5.81 5.77-5.81c1.81 0 3.03.78 3.73 1.46l2.55-2.46C17.05 2.5 15.1 1.7 12.17 1.7 6.72 1.7 2.35 6.08 2.35 11.53s4.37 9.83 9.82 9.83c5.67 0 9.42-3.98 9.42-9.58 0-.64-.07-1.08-.24-1.68z" />
                        </svg>
                        Login with Google
                    </button>

                    <button
                        onClick={handleWalletLogin}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg shadow 
                        bg-white/10 border border-white/30 text-white 
                        hover:bg-white/15 transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M21 7H3a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-1 8H4v-7h16v7z" />
                        </svg>
                        Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
