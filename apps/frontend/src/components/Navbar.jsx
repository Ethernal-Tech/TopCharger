import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function Navbar() {
    const navigate = useNavigate();

    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken] = useState(() => sessionStorage.getItem("tc_token"));
    const [role] = useState(() => {
        const userStr = sessionStorage.getItem("tc_user");
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.role || null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!googleToken) navigate("/");
    }, [googleToken, navigate]);

    const handleWalletDisconnect = async () => {
        setWalletAddress(null);
        if (window.solana) await window.solana.disconnect();
    };

    const handleGoogleLogout = async () => {
        navigate("/logout");
    };

    return (
        <nav className="w-full bg-white/90 backdrop-blur-md shadow-md px-4 sm:px-8 py-3 flex items-center justify-between">
            {/* Left: Logo + Links */}
            <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <img
                        src="/logo-modified.png"
                        alt="TopCharger Logo"
                        className="h-12 w-12 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-green-900">TopCharger</h1>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4 text-green-800 font-medium">
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
                        <Link to="/sessions" className="hover:text-green-600 transition">
                            Charger sessions
                        </Link>
                    )}
                    {googleToken && (role === "HOST" || role === "DRIVER") && (
                        <Link to="/profile" className="hover:text-green-600 transition">
                            Profile
                        </Link>
                    )}
                </div>
            </div>

            {/* Right: Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
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
                        className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
}
