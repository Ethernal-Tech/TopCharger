// apps/frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { getMagic } from "@/lib/magic";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    const token = sessionStorage.getItem("tc_token");
    const role = sessionStorage.getItem("tc_role");
    if (token && role) {
      if (role === "HOST") window.location.href = `/my-chargers`;
      else if (role === "DRIVER") window.location.href = `/chargers`;
      else setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Google login → NextAuth signin page with callback back to FE
  const handleGoogleLogin = () => {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `${backend}/auth/signin?callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
  };

  // Magic login via Connect UI (auto-creates embedded wallet)
  // Dashboard.jsx (only the Magic handler)
  const handleMagicLogin = async () => {
    try {
      const magic = getMagic();
      if (!magic) {
        alert("Magic is not configured. Check VITE_MAGIC_PUBLISHABLE_KEY.");
        return;
      }

      // 1) Open Magic's built-in login UI (creates embedded wallet if first time)
      await magic.wallet.connectWithUI();

      // 2) Get CSRF for NextAuth
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      if (!csrfRes.ok) throw new Error("CSRF fetch failed");
      const { csrfToken } = await csrfRes.json();

      // 3) Get Magic DID token
      const did = await magic.user.getIdToken({ lifespan: 300 });

      // 4) Tell NextAuth to create a session via the "magic" credentials provider
      const body = new URLSearchParams({
        csrfToken,
        callbackUrl: `${window.location.origin}/auth/callback`,
        json: "true",
        did,
      });

      const res = await fetch("/api/auth/callback/magic", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Magic callback failed (${res.status}) ${t}`);
      }

      // 5) Now you have a NextAuth session cookie; finish bootstrap
      window.location.href = "/auth/callback";
    } catch (e) {
      console.error("[FE] Magic connect flow failed", e);
      alert(e?.message || "Login failed. Please try again.");
    }
  };

  // Optional: plain Phantom connect (independent of Magic)
  const handleWalletLogin = () => {
    if (window.solana?.isPhantom) {
      window.solana
        .connect()
        .then((resp) =>
          console.log("Connected wallet:", resp.publicKey.toString())
        )
        .catch(console.error);
    } else {
      alert("Phantom Wallet not installed!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-100">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center text-center px-4 sm:px-6 md:px-16 pt-16 sm:pt-24 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/top_charger.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />

      <div className="relative z-10 flex flex-col items-center justify-start max-w-full sm:max-w-4xl">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 sm:mb-8 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
          TopCharger
        </h1>

        <p className="text-lg sm:text-2xl md:text-3xl max-w-full sm:max-w-3xl mb-8 sm:mb-12 text-slate-100">
          Making EV charging{" "}
          <span className="font-extrabold text-emerald-300">simple</span>,{" "}
          <span className="font-extrabold text-emerald-300">open</span>, and{" "}
          <span className="font-extrabold text-emerald-300">everywhere</span>.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-sm items-center justify-center mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full px-6 py-3 rounded-lg shadow bg-emerald-600 text-white hover:bg-emerald-500 transition"
          >
            Login with Google
          </button>

          <button
            onClick={handleMagicLogin}
            className="w-full px-6 py-3 rounded-lg shadow bg-white/10 border border-white/30 text-white hover:bg-white/15 transition"
          >
            Login with Email (Magic)
          </button>

          <button
            onClick={handleWalletLogin}
            className="w-full px-6 py-3 rounded-lg shadow bg-white/10 border border-white/30 text-white hover:bg-white/15 transition"
          >
            Connect Wallet (Phantom)
          </button>
        </div>
      </div>
    </div>
  );
}
