import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Navbar() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken, setGoogleToken] = useState(null);
    const [role, setRole] = useState(null); // HOST or DRIVER
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                // Check Google auth token
                const tokenRes = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });
                if (tokenRes.ok) {
                    const { token } = await tokenRes.json();
                    if (token) {
                        setGoogleToken(token);

                        // Fetch user info to get role
                        const meRes = await fetch(`${BACKEND}/api/auth/me`, {
                            method: "GET",
                            credentials: "include",
                        });
                        if (meRes.ok) {
                            const { user } = await meRes.json();
                            setRole(user?.role || null);
                        }
                    } else {
                        // No token, redirect to login/dashboard
                        navigate("/");
                    }
                } else {
                    // Token fetch failed, redirect
                    navigate("/");
                }
            } catch (err) {
                console.error("Failed to fetch auth token or user info", err);
                navigate("/");
            }
        })();
    }, [navigate]);

    const handleWalletDisconnect = async () => {
        setWalletAddress(null);
        if (window.solana) await window.solana.disconnect();
    };

    const handleGoogleLogout = async () => {
        sessionStorage.removeItem("tc_token");
        window.location.href = `${BACKEND}/api/auth/signout?callbackUrl=${FRONTEND}`;
    };

    return (
        <nav className="bg-white/90 backdrop-blur-md shadow-md p-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <h1 className="text-2xl font-bold text-green-900">⚡ TopCharger</h1>

                <div className="flex gap-4 text-green-800 font-medium">
                    {googleToken && role === "HOST" && (
                        <Link to="/my-chargers" className="hover:text-green-600 transition">
                            My Chargers
                        </Link>
                    )}
                    {googleToken && role === "DRIVER" && (
                        <Link to="/chargers" className="hover:text-green-600 transition">
                            Find Chargers
                        </Link>
                    )}
                    {googleToken && (role === "HOST" || role === "DRIVER") && (
                        <Link to="/profile" className="hover:text-green-600 transition">
                            Profile
                        </Link>
                    )}
                </div>
            </div>

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
