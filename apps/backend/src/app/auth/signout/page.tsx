"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

const FRONTEND = "http://localhost:5173";

export default function SignOutPage() {
    useEffect(() => {
        // Immediately sign out and redirect to frontend
        signOut({ callbackUrl: FRONTEND });
    }, []);

    return <div className="flex items-center justify-center h-screen">Signing out...</div>;
}
