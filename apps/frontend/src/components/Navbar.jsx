// src/components/Navbar.jsx
import { useState, useEffect } from "react";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Navbar() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken, setGoogleToken] = useState(null);

    // Check if Google user is already logged in
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include", // send NextAuth cookie
                });
                if (res.ok) {
                    const { token } = await res.json();
                    if (token) setGoogleToken(token); // mark user as logged in
                }
            } catch (err) {
                console.error("Failed to fetch auth token", err);
            }
        })();
    }, []);

    // Phantom wallet login/disconnect
    const handleWalletDisconnect = async () => {
        setWalletAddress(null);
        if (window.solana) await window.solana.disconnect();
    };

    // Google logout
    const handleGoogleLogout = async () => {
        sessionStorage.removeItem("tc_token");
        window.location.href = `${BACKEND}/api/auth/signout?callbackUrl=${FRONTEND}`;
    };

    return (
        <nav className="bg-white/90 backdrop-blur-md shadow-md p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-900">⚡ TopCharger</h1>

            <div className="flex items-center gap-4">
                {walletAddress && (
                    <button
                        onClick={handleWalletDisconnect}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Disconnect Wallet
                    </button>
                )}

                {googleToken && !walletAddress && (
                    <button
                        onClick={handleGoogleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Logout Google
                    </button>
                )}
            </div>
        </nav>
    );
}
