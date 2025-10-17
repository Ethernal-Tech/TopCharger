// src/pages/CreateProfile.jsx
import React, { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function CreateProfile() {
    const [form, setForm] = useState({
        businessName: "",
        address: "",
        phone: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            const res = await fetch(`${BACKEND}/api/hosts/profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // send NextAuth cookie
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.error || "Failed to create profile");
            }

            const data = await res.json();
            console.log("Profile created:", data);
            alert("✅ Host profile created successfully!");

            // Optionally redirect to AddCharger page
            window.location.href = "/AddCharger";
        } catch (err) {
            console.error(err);
            alert("❌ Error creating profile: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-green-700 text-white p-3 rounded-full text-3xl mb-3 shadow">
                        🏢
                    </div>
                    <h1 className="text-2xl font-bold text-green-900 text-center">
                        Create Host Profile
                    </h1>
                    <p className="text-green-700 text-sm text-center">
                        Fill in your business information
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-green-900 mb-1">Business Name</label>
                        <input
                            type="text"
                            name="businessName"
                            value={form.businessName}
                            onChange={handleChange}
                            placeholder="e.g. FastCharge Inc."
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="e.g. 123 Main St, City"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="e.g. +1234567890"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create Profile"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <a
                        href="/dashboard"
                        className="text-green-700 font-semibold underline hover:text-green-900"
                    >
                        Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
