// apps/frontend/src/pages/Profile.jsx
import React from "react";

export default function Profile() {
    // Example static data (replace with real user data later)
    const user = {
        name: "John Smith",
        company: "EV Power Solutions",
        accountType: "Seller",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-green-700 text-white p-4 rounded-full text-4xl mb-3 shadow">
                        👤
                    </div>
                    <h1 className="text-2xl font-bold text-green-900">
                        My Profile
                    </h1>
                    <p className="text-green-700 text-sm">
                        EV Charging Marketplace
                    </p>
                </div>

                {/* Info Section */}
                <div className="text-left space-y-4">
                    <div className="border-b pb-2">
                        <span className="block text-green-800 font-semibold">Name</span>
                        <span className="text-green-900">{user.name}</span>
                    </div>

                    <div className="border-b pb-2">
                        <span className="block text-green-800 font-semibold">Company</span>
                        <span className="text-green-900">{user.company}</span>
                    </div>

                    <div>
                        <span className="block text-green-800 font-semibold">Account Type</span>
                        <span className="text-green-900">{user.accountType}</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-8 flex flex-col gap-2">
                    <a
                        href="/chargers"
                        className="bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors"
                    >
                        Go to Chargers
                    </a>
                    <a
                        href="/"
                        className="text-green-700 font-semibold underline hover:text-green-900"
                    >
                        Log out
                    </a>
                </div>
            </div>
        </div>
    );
}
