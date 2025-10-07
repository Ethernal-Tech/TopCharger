// apps/frontend/src/pages/Login.jsx

import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // You can call your backend API here
        console.log("Login attempt:", { email, password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
                {/* Logo */}
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-green-700 text-white p-2 rounded mr-2">⚡</div>
                    <h1 className="text-xl font-semibold text-green-900">
                        EV Charging Marketplace
                    </h1>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">
                    Login
                </h2>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-green-900 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition-colors"
                    >
                        Log in
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-green-900 mt-4">
                    Don’t have an account?{" "}
                    <a href="/signup" className="font-semibold underline">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
