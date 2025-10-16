// src/components/FullScreenLoader.jsx
import React from "react";

export default function FullScreenLoader({ message = "Loading..." }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-900 font-semibold">{message}</p>
            </div>
        </div>
    );
}
