// src/pages/Logout.jsx
import { useEffect } from "react";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      try {
        // 1) Best-effort disconnect extension wallets (Phantom/Solflare)
        try {
          if (window?.phantom?.solana?.disconnect) {
            await window.phantom.solana.disconnect();
          }
          if (window?.solana?.isPhantom && window.solana.disconnect) {
            await window.solana.disconnect();
          }
          if (window?.solflare?.disconnect) {
            await window.solflare.disconnect();
          }
        } catch {}

        // 2) Clear our “recent wallet” cookie on the backend so fast-reconnect won’t kick in
        try {
          await fetch(`${BACKEND}/api/auth/link/solana/clear`, {
            method: "POST",
            credentials: "include",
          });
        } catch {}

        // 3) Nuke frontend session
        try {
          sessionStorage.removeItem("tc_token");
          sessionStorage.removeItem("tc_user");
          sessionStorage.removeItem("tc_role");
          sessionStorage.removeItem("tc_wallet");
        } catch {}

        // 4) Notify any listeners (e.g., Navbar) that wallet is gone
        try {
          window.dispatchEvent(new CustomEvent("tc-wallet-unlinked"));
        } catch {}

        // 5) Redirect to backend auto-signout page (which does POST signout with no prompt)
        const cb = encodeURIComponent(FRONTEND);
        window.location.replace(`${BACKEND}/auth/signout?cb=${cb}`);
      } catch {
        // As a fallback, still bounce to home
        window.location.replace(FRONTEND);
      }
    })();
  }, []);

  return <FullScreenLoader />;
}
