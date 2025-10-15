"use client";

import { useEffect } from "react";
import { getProviders, signIn } from "next-auth/react";

const FRONTEND = "http://localhost:5173"; // your frontend URL

export default function SignInPage() {
    useEffect(() => {
        (async () => {
            const providers = await getProviders();
            if (providers?.google?.id) {
                // Provide callbackUrl to redirect after login
                signIn(providers.google.id, { callbackUrl: `${FRONTEND}/auth/callback` });
            }
        })();
    }, []);

    return <div>Redirecting to Google login...</div>;
}