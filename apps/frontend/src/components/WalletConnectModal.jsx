// src/components/WalletConnectModal.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/UseAuth";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL;

export default function WalletConnectModal({ open, onClose }) {
  const { detectWallets, connectWallet, loadWallet } = useAuth();

  const [wallets, setWallets] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setWallets(detectWallets());
    setError("");
    setLoadingId(null);
  }, [open, detectWallets]);

  const linkProvider = async (wallet) => {
    setError("");
    setLoadingId(wallet.id);
    try {
      const nonceRes = await fetch(`${BACKEND}/api/auth/siws/nonce`, {
        credentials: "include",
      });
      const { nonce } = await nonceRes.json();
      const domain = new URL(FRONTEND).host;
      const message = `Link wallet to TopCharger\nDomain: ${domain}\nNonce: ${nonce}\nIssuedAt: ${new Date().toISOString()}`;

      await connectWallet(wallet.provider, nonce, domain, message);
      await loadWallet();
      onClose?.();
    } catch (e) {
      setError(e.message || "Failed to link wallet");
    } finally {
      setLoadingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-green-900 mb-2">
          Connect a Wallet
        </h2>
        <p className="text-sm text-green-800 mb-4">Choose a wallet to link.</p>

        {!wallets.length && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-4">
            No supported wallets detected. Install Phantom or Solflare.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 mb-4">
          {wallets.map((w) => {
            const isLoading = loadingId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => linkProvider(w)}
                disabled={!!loadingId}
                className={`flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-green-50 ${
                  !!loadingId && !isLoading && "opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="font-medium text-green-900">{w.name}</span>
                <span className="text-xs text-green-700">
                  {isLoading ? "Connecting…" : "Connect"}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => (!loadingId ? onClose() : null)}
            disabled={!!loadingId}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
