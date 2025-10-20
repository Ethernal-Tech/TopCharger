// src/components/FullScreenLoader.jsx
import React from "react";

export default function FullScreenLoader() {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: "url('/top_charger.png')" }} // your default background
        >
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
