import { useEffect, useState } from "react";
import { detectWallets, connectAndSignMessage } from "../utils/solanaWallet";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function WalletConnectModal({ open, onClose, onLinked }) {
  const [wallets, setWallets] = useState([]);
  const [loadingId, setLoadingId] = useState(null); // which wallet is connecting
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoadingId(null);
    setWallets(detectWallets());
  }, [open]);

  const linkWith = async (wallet) => {
    setError("");
    setBusy(true);
    try {
      // nonce
      const nonceRes = await fetch(`${BACKEND}/api/auth/siws/nonce`, {
        credentials: "include",
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      const domain = new URL(FRONTEND).host;
      const message = `Link wallet to TopCharger\nDomain: ${domain}\nNonce: ${nonce}\nIssuedAt: ${new Date().toISOString()}`;

      const { publicKey, signatureB58 } = await connectAndSignMessage({
        provider: wallet.provider,
        messageUtf8: message,
      });

      // link
      const linkRes = await fetch(`${BACKEND}/api/auth/link/solana`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, message, signature }),
      }).catch(() => null);

      // NOTE: variable `signature` not defined. Fix:
    } catch (e) {
      // handled below with corrected code
    }
  };

  const linkProvider = async (wallet) => {
    setError("");
    setLoadingId(wallet.id);
    try {
      const nonceRes = await fetch(`${BACKEND}/api/auth/siws/nonce`, {
        credentials: "include",
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      const domain = new URL(FRONTEND).host;
      const message = `Link wallet to TopCharger\nDomain: ${domain}\nNonce: ${nonce}\nIssuedAt: ${new Date().toISOString()}`;

      const { publicKey, signatureB58 } = await connectAndSignMessage({
        provider: wallet.provider,
        messageUtf8: message,
      });

      const linkRes = await fetch(`${BACKEND}/api/auth/link/solana`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, message, signature: signatureB58 }),
      });

      if (!linkRes.ok) {
        const t = await linkRes.text();
        throw new Error(t || "Failed to link wallet");
      }

      onLinked?.(publicKey);
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
        <p className="text-sm text-green-800 mb-4">
          Choose a wallet to link to your account.
        </p>

        {!wallets.length && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-4">
            No supported wallets detected. Install <b>Phantom</b> or{" "}
            <b>Solflare</b> and refresh the page.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 mb-4">
          {wallets.map((w) => {
            const isLoading = loadingId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => linkProvider(w)}
                disabled={!!loadingId} // prevent double-clicking another wallet mid-flow
                className={`flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-green-50 ${
                  !!loadingId && !isLoading
                    ? "opacity-60 cursor-not-allowed"
                    : ""
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
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
