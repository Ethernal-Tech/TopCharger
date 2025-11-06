"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

const DEFAULT_CB = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

/**
 * Instantly triggers NextAuth signOut on the backend origin (no confirmation),
 * then redirects back to the frontend (or ?cb override). No UI is rendered.
 */
export default function SignOutPage() {
  const sp = useSearchParams();
  const cb = sp?.get("cb") || DEFAULT_CB;

  useEffect(() => {
    // No prompt: POST to /api/auth/signout internally, then redirect to cb
    signOut({ callbackUrl: cb, redirect: true });
  }, [cb]);

  return null;
}
