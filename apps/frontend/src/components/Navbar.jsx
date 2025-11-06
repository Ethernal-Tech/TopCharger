// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/UseAuth";
import WalletConnectModal from "./WalletConnectModal";

export default function Navbar() {
  const navigate = useNavigate();
  const {
    user,
    role,
    wallet,
    loading,
    walletSync,
    tryFastReconnect,
    disconnectWallet,
  } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  const handleWalletClick = async () => {
    if (!wallet) {
      const ok = await tryFastReconnect();
      if (!ok) setModalOpen(true); // open modal if fast connect fails
    }
  };

  return (
    <>
      <nav className="w-full bg-white/90 backdrop-blur-md shadow-md px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-6 flex-wrap">
          <Link to="/" className="flex-shrink-0 flex items-center gap-3">
            <img
              src="/logo-modified.png"
              alt="TopCharger Logo"
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-2xl font-bold text-green-900">TopCharger</h1>
          </Link>

          {!loading && user && (
            <div className="flex flex-wrap gap-4 text-green-800 font-medium">
              {role === "HOST" && (
                <Link
                  to="/my-chargers"
                  className="hover:text-green-600 transition"
                >
                  My Chargers
                </Link>
              )}
              {role === "DRIVER" && (
                <Link
                  to="/chargers"
                  className="hover:text-green-600 transition"
                >
                  Find Chargers
                </Link>
              )}
              {(role === "HOST" || role === "DRIVER") && (
                <>
                  <Link
                    to="/sessions"
                    className="hover:text-green-600 transition"
                  >
                    Charger Sessions
                  </Link>
                  <Link
                    to="/profile"
                    className="hover:text-green-600 transition"
                  >
                    Profile
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        {user && (
          <div className="flex items-center gap-4 flex-wrap">
            {!wallet && (
              <button
                onClick={handleWalletClick}
                disabled={walletSync}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {walletSync ? "Connecting…" : "Connect Wallet"}
              </button>
            )}

            {wallet && (
              <>
                <span className="text-sm text-green-900 bg-green-100 px-2 py-1 rounded">
                  {wallet.slice(0, 4)}…{wallet.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Disconnect Wallet
                </button>
              </>
            )}

            <button
              onClick={() => navigate("/logout")}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <WalletConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
