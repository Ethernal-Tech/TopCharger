// src/components/FullScreenLoader.jsx
import React from "react";

export default function FullScreenLoader() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/top_charger.png')" }}
            />

            {/* Gradient overlay (matches Dashboard) */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />

            {/* Optional: center vignette for readability */}
            {/* <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35),transparent_55%)]" /> */}

            {/* Spinner */}
            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
