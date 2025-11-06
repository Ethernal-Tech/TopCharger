"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

const DEFAULT_CB = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function SignInPage() {
  useEffect(() => {
    // read ?cb= from the URL on the client to avoid the searchParams warning
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("cb") || DEFAULT_CB;

    // Immediately start Google OAuth (no extra page)
    signIn("google", { callbackUrl: cb, redirect: true });
  }, []);

  // Optional: tiny loader so there's no blank screen
  return <div style={{ padding: 24 }}>Redirecting to Google…</div>;
}
