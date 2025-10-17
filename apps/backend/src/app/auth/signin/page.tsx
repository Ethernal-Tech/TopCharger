"use client";

import { useEffect } from "react";
import { getProviders, signIn } from "next-auth/react";

export default function SignInPage() {
    useEffect(() => {
        (async () => {

            // Provide callbackUrl to redirect after login
            signIn("google");

        })();
    }, []);

    return <div>Redirecting to Google login...</div>;
}