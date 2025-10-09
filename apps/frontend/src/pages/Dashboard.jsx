// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Dashboard() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken, setGoogleToken] = useState(null);

    // Detect Phantom wallet
    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            window.solana.connect({ onlyIfTrusted: false }).then((resp) => {
                setWalletAddress(resp.publicKey.toString());
            });
        }
    }, []);

    // Fetch JWT from backend if redirected from Google OAuth
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });
                if (res.ok) {
                    const { token } = await res.json();
                    setGoogleToken(token);
                }
            } catch (err) {
                console.error("Google login fetch failed", err);
            }
        })();
    }, []);

    const handleGoogleSignIn = () => {
        const callbackUrl = encodeURIComponent(`${FRONTEND}/auth/callback`);
        window.location.href = `${BACKEND}/api/auth/signin/google?callbackUrl=${callbackUrl}`;
    };

    return (
        <div className="min-h-screen p-4 bg-green-100">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-green-900">TopCharger Dashboard</h1>

                <div className="flex items-center gap-4">
                    {walletAddress && (
                        <span className="bg-green-700 text-white px-3 py-1 rounded font-mono">
                            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                    )}

                    {!walletAddress && !googleToken && (
                        <button
                            onClick={handleGoogleSignIn}
                            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
                        >
                            Sign in with Google
                        </button>
                    )}

                    {googleToken && !walletAddress && (
                        <span className="bg-green-700 text-white px-3 py-1 rounded font-mono">
                            Google Logged In
                        </span>
                    )}
                </div>
            </header>

            {/* Description */}
            <section className="mb-6">
                <p className="text-green-900">
                    Welcome to TopCharger! Here you can add chargers, explore existing charging stations,
                    and see their availability on the map.
                </p>
            </section>

            {/* Add Charger */}
            <section className="mb-6">
                <button className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
                    + Add Charger
                </button>
            </section>

        </div>
    );
}
