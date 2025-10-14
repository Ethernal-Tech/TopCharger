import React, { useEffect } from "react";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Dashboard() {
    useEffect(() => {
        // Check if user is already logged in
        const checkUser = async () => {
            try {
                const res = await fetch(`${BACKEND}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok) return; // Not logged in, stay on Dashboard
                const { user } = await res.json();
                if (!user) return; // Not logged in
                // Redirect based on role
                if (user.role === "HOST") window.location.href = `${FRONTEND}/my-chargers`;
                if (user.role === "DRIVER") window.location.href = `${FRONTEND}/chargers`;
            } catch (err) {
                console.error("Failed to check logged-in user:", err);
            }
        };
        checkUser();
    }, []);

    const handleGoogleLogin = () => {
        const callbackUrl = encodeURIComponent(`${FRONTEND}/auth/callback`);
        window.location.href = `${BACKEND}/api/auth/signin/google?callbackUrl=${callbackUrl}&redirect=true`;
    };

    const handleWalletLogin = () => {
        if (window.solana && window.solana.isPhantom) {
            window.solana.connect()
                .then((resp) => console.log("Connected wallet:", resp.publicKey.toString()))
                .catch(err => console.error(err));
        } else {
            alert("Phantom Wallet not installed!");
        }
    };

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
