"use client";

import { useEffect } from "react";
import { getProviders, signIn } from "next-auth/react";

const FRONTEND = "http://localhost:5173"; // your frontend URL

export default function SignInPage() {
    useEffect(() => {
        (async () => {

            // Provide callbackUrl to redirect after login
            signIn("google");

        })();
    }, []);

    return <div>Redirecting to Google login...</div>;
}