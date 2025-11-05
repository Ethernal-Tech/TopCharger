// apps/backend/src/app/auth/signin/page.tsx
"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:5173";

export default function SignInPage() {
  const search = useSearchParams();
  const cb = search.get("callbackUrl") ?? `${FRONTEND}/auth/callback`;

  useEffect(() => {
    // forward the same callback url so you return to FE
    signIn("google", { callbackUrl: cb });
  }, [cb]);

  return <div>Redirecting to Google login…</div>;
}
