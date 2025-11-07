// src/pages/Logout.jsx
import { useEffect, useRef } from "react";
import FullScreenLoader from "../components/FullScreenLoader.jsx";
import { BACKEND, FRONTEND } from "../context/Constants.js";
import { useAuth } from "../context/UseAuth";

export default function LogoutPage() {
  const ranRef = useRef(false);
  const { disconnectWallet } = useAuth();

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      // Always jump back to the frontend root
      const callback = encodeURIComponent(FRONTEND);
      const signoutUrl = `${BACKEND}/auth/signout?cb=${callback}`;

      try {
        // 1) Best-effort disconnect via context (handles Phantom/Solflare + clears fast-reconnect cookie)
        try {
          await disconnectWallet();
        } catch {
          // ignore
        }

        // 2) Clear any remaining FE session state
        try {
          sessionStorage.removeItem("tc_token");
          sessionStorage.removeItem("tc_user");
          sessionStorage.removeItem("tc_role");
          sessionStorage.removeItem("tc_wallet");
        } catch {
          // ignore
        }

        // 3) Kick NextAuth server-side signout (no prompt) and land back on FE
        window.location.replace(signoutUrl);
      } catch {
        // If anything unexpected happens, land the user home anyway
        window.location.replace(FRONTEND);
      } finally {
        // Safety: if navigation is blocked by the browser for any reason,
        // force-redirect to FE after a short delay.
        setTimeout(() => {
          if (window.location.href !== FRONTEND) {
            try {
              window.location.replace(FRONTEND);
            } catch {}
          }
        }, 4000);
      }
    })();
  }, [disconnectWallet]);

  return <FullScreenLoader />;
}
