// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useCallback } from "react";
import { BACKEND } from "./Constants";
import { detectWallets, connectAndSignMessage } from "../utils/solanaWallet";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, role }
  const [role, setRole] = useState(null);
  const [wallet, setWallet] = useState(null); // publicKey string
  const [loading, setLoading] = useState(true);
  const [walletSync, setWalletSync] = useState(false);

  // ✅ Fetch Google auth session + user
  const loadAuth = useCallback(async () => {
    try {
      const tokenRes = await fetch(`${BACKEND}/api/auth/token`, {
        credentials: "include",
      });
      if (!tokenRes.ok) throw new Error("No session");
      const { token } = await tokenRes.json();
      sessionStorage.setItem("tc_token", token);

      const userRes = await fetch(`${BACKEND}/api/auth/me`, {
        credentials: "include",
      });
      if (!userRes.ok) throw new Error("Failed user load");

      const { user } = await userRes.json();
      setUser(user);
      setRole(user.role);
      sessionStorage.setItem("tc_user", JSON.stringify(user));
      sessionStorage.setItem("tc_role", user.role);
    } catch {
      setUser(null);
      setRole(null);
    }
  }, []);

  // ✅ Load linked wallets from backend
  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/auth/wallets`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return;
      const { wallets } = await res.json();
      const pk =
        Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;
      setWallet(pk);
      if (pk) sessionStorage.setItem("tc_wallet", pk);
      else sessionStorage.removeItem("tc_wallet");
    } catch {
      setWallet(null);
    }
  }, []);

  // ✅ First load
  useEffect(() => {
    (async () => {
      await loadAuth();
      await loadWallet();
      setLoading(false);
    })();
  }, [loadAuth, loadWallet]);

  // ✅ Fast non-signing reconnect (5 min cookie)
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
        sessionStorage.setItem("tc_wallet", publicKey);
        return true;
      }
    } catch {
    } finally {
      setWalletSync(false);
    }
    return false;
  }, [user]);

  // ✅ Connect wallet (show modal handled in UI)
  const connectWallet = async (provider, nonce, domain, message) => {
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
    sessionStorage.setItem("tc_wallet", publicKey);
    return publicKey;
  };

  // ✅ Disconnect wallet (keep auth session alive)
  const disconnectWallet = async () => {
    setWallet(null);
    sessionStorage.removeItem("tc_wallet");
    try {
      if (window.solana?.disconnect) await window.solana.disconnect();
      if (window.phantom?.solana?.disconnect)
        await window.phantom.solana.disconnect();
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        wallet,
        loading,
        walletSync,
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
