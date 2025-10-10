// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal.jsx";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Navbar() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken, setGoogleToken] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

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

    // Phantom wallet login
    const handleWalletSignIn = async () => {
        const { solana } = window;
        if (!solana) return alert("Phantom wallet not found");
        try {
            const resp = await solana.connect();
            setWalletAddress(resp.publicKey.toString());
            setShowLoginModal(false); // close modal
        } catch {
            console.log("User rejected wallet connection");
        }
    };

    // Google login via backend
    const handleGoogleSignIn = () => {
        const callbackUrl = encodeURIComponent(`${FRONTEND}/auth/callback`);
        window.location.href = `${BACKEND}/api/auth/signin/google?callbackUrl=${callbackUrl}`;
    };

    return (
        <>
            <nav className="bg-white/90 backdrop-blur-md shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-green-900">⚡ TopCharger</h1>

                <div className="flex items-center gap-4 relative">
                    {walletAddress && (
                        <span className="bg-green-700 text-white px-3 py-1 rounded font-mono">
                            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                    )}

                    {googleToken && !walletAddress && (
                        <span className="bg-green-700 text-white px-3 py-1 rounded font-mono">
                            Google Logged In
                        </span>
                    )}

                    {!walletAddress && !googleToken && (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {/* Login modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onGoogleSignIn={handleGoogleSignIn}
                onWalletSignIn={handleWalletSignIn}
            />
        </>
    );
}
