// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useCallback } from "react";
import { BACKEND } from "./Constants";
import { detectWallets, connectAndSignMessage } from "../utils/solanaWallet";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, role }
  const [role, setRole] = useState(null); // "HOST" | "DRIVER" | "UNSET" | null
  const [wallet, setWallet] = useState(null); // connected wallet pubkey (runtime only)
  const [loading, setLoading] = useState(true); // initial app load
  const [walletSync, setWalletSync] = useState(false); // spinner while trying fast-reconnect

  // -------------------------
  // Auth bootstrap
  // -------------------------
  const loadAuth = useCallback(async () => {
    try {
      // Establish session cookie and get a short token for FE usage if needed
      const tok = await fetch(`${BACKEND}/api/auth/token`, {
        credentials: "include",
      });
      if (!tok.ok) throw new Error("No session");
      const { token } = await tok.json();
      sessionStorage.setItem("tc_token", token);

      // Get user (includes role)
      const me = await fetch(`${BACKEND}/api/auth/me`, {
        credentials: "include",
      });
      if (!me.ok) throw new Error("Failed user load");

      const { user } = await me.json();
      setUser(user);
      setRole(user.role);
      sessionStorage.setItem("tc_user", JSON.stringify(user));
      sessionStorage.setItem("tc_role", user.role);
    } catch {
      setUser(null);
      setRole(null);
    }
  }, []);

  // Optional helper for pages that want the LIST of linked wallets.
  // IMPORTANT: We do NOT set `wallet` here—linked ≠ connected.
  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/auth/wallets`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return [];
      const { wallets } = await res.json();
      return Array.isArray(wallets) ? wallets : [];
    } catch {
      return [];
    }
  }, []);

  // First boot
  useEffect(() => {
    (async () => {
      await loadAuth();
      setLoading(false);
    })();
  }, [loadAuth]);

  // Listen for wallet-link events fired by the modal (and for unlinks)
  useEffect(() => {
    const onLinked = (e) => setWallet(e?.detail?.publicKey || null);
    const onUnlinked = () => setWallet(null);
    window.addEventListener("tc-wallet-linked", onLinked);
    window.addEventListener("tc-wallet-unlinked", onUnlinked);
    return () => {
      window.removeEventListener("tc-wallet-linked", onLinked);
      window.removeEventListener("tc-wallet-unlinked", onUnlinked);
    };
  }, []);

  // -------------------------
  // Wallet helpers
  // -------------------------

  // Fast path (cookie-based) reconnect without re-signing
  const tryFastReconnect = useCallback(async () => {
    if (!user) return false;
    setWalletSync(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/link/solana/refresh`, {
        credentials: "include",
      });

      if (res.ok) {
        const { publicKey } = await res.json();
        setWallet(publicKey);
        return true;
      }
      // 204 = no cookie (not an error) -> open modal
      if (res.status === 204) return false;

      return false;
    } catch {
      return false;
    } finally {
      setWalletSync(false);
    }
  }, [user]);

  // Full connect + link flow (the modal will call this)
  const connectWallet = async (provider, _nonce, _domain, message) => {
    const { publicKey, signatureB58 } = await connectAndSignMessage({
      provider,
      messageUtf8: message,
    });

    const linkRes = await fetch(`${BACKEND}/api/auth/link/solana`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey, message, signature: signatureB58 }),
    });
    if (!linkRes.ok) throw new Error(await linkRes.text());

    setWallet(publicKey);
    return publicKey;
  };

  // Disconnect wallet locally + clear the short-lived fast-reconnect cookie
  const disconnectWallet = async () => {
    setWallet(null);
    try {
      if (window.solana?.disconnect) await window.solana.disconnect();
      if (window.phantom?.solana?.disconnect)
        await window.phantom.solana.disconnect();
      if (window.solflare?.disconnect) await window.solflare.disconnect();
    } catch {
      // ignore disconnect errors
    }
    // Clear the recent-fast-reconnect cookie on the backend if present
    try {
      await fetch(`${BACKEND}/api/auth/link/solana/clear`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } catch {}
    // Inform any listeners
    window.dispatchEvent(new CustomEvent("tc-wallet-unlinked"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        wallet,
        loading,
        walletSync,
        // utilities exposed to UI
        detectWallets,
        loadWallet,
        tryFastReconnect,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
