import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import WalletConnectModal from "./WalletConnectModal.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function Navbar() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

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

  const loadLinkedWallets = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/auth/wallets`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return;
      const { wallets } = await res.json();
      if (Array.isArray(wallets) && wallets.length > 0) {
        setWalletAddress(wallets[0]);
        sessionStorage.setItem("tc_wallet", wallets[0]);
      } else {
        setWalletAddress(null);
        sessionStorage.removeItem("tc_wallet");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLinkedWallets();
  }, [loadLinkedWallets]);

  const tryFastReconnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/link/solana/refresh`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const { publicKey } = await res.json();
        setWalletAddress(publicKey);
        sessionStorage.setItem("tc_wallet", publicKey);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const handleWalletDisconnect = async () => {
    setWalletAddress(null);
    sessionStorage.removeItem("tc_wallet");
    if (window.solana?.disconnect) {
      try {
        await window.solana.disconnect();
      } catch {}
    }
  };

  const handleConnectClick = async () => {
    // First try 5-minute fast path (no chooser, no signing)
    const ok = await tryFastReconnect();
    if (!ok) setModalOpen(true);
  };

  const handleGoogleLogout = async () => {
    navigate("/logout");
  };

  return (
    <>
      <nav className="w-full bg-white/90 backdrop-blur-md shadow-md px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/logo-modified.png"
              alt="TopCharger Logo"
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-2xl font-bold text-green-900">TopCharger</h1>
          </div>

          <div className="flex flex-wrap gap-4 text-green-800 font-medium">
            {googleToken && role === "HOST" && (
              <Link
                to="/my-chargers"
                className="hover:text-green-600 transition"
              >
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

        {/* Right */}
        <div className="flex items-center gap-4 flex-wrap">
          {googleToken && !walletAddress && (
            <button
              onClick={handleConnectClick}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-60"
              disabled={connecting}             
            >
             {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}

          {walletAddress && (
            <>
              <span className="text-sm text-green-900 bg-green-100 px-2 py-1 rounded">
                {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </span>
              <button
                onClick={handleWalletDisconnect}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </>
          )}

          {googleToken && (
            <button
              onClick={handleGoogleLogout}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <WalletConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLinked={(pubkey) => {
          setWalletAddress(pubkey);
          sessionStorage.setItem("tc_wallet", pubkey);
        }}
      />
    </>
  );
}
