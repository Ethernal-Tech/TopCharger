import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Navbar() {
    const navigate = useNavigate();

    // Initialize state from sessionStorage
    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken, setGoogleToken] = useState(() => sessionStorage.getItem("tc_token"));
    const [role, setRole] = useState(() => {
        const userStr = sessionStorage.getItem("tc_user");
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.role || null;
        } catch {
            return null;
        }
    });

    // Redirect to login if no token
    useEffect(() => {
        if (!googleToken) navigate("/");
    }, [googleToken, navigate]);

    const handleWalletDisconnect = async () => {
        setWalletAddress(null);
        if (window.solana) await window.solana.disconnect();
    };

    const handleGoogleLogout = async () => {
        sessionStorage.removeItem("tc_token");
        sessionStorage.removeItem("tc_user");
        sessionStorage.removeItem("tc_role");
        setGoogleToken(null);
        setRole(null);
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
