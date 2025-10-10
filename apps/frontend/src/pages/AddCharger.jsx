// src/pages/AddCharger.jsx
import React, { useState } from "react";

const BACKEND = "http://localhost:3000";

export default function AddCharger() {
    const [form, setForm] = useState({
        name: "",
        price: "",
        latitude: "",
        longitude: "",
        connector: "Type2", // default connector
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem("tc_token");
        if (!token) {
            alert("You must be logged in to add a charger.");
            return;
        }

        const payload = {
            name: form.name,
            pricePerKwh: parseFloat(form.price),
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            connector: form.connector,
        };

        try {
            console.log(token);
            setLoading(true);
            const res = await fetch(`${BACKEND}/api/hosts/chargers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error || "Failed to add charger");
            }

            const data = await res.json();
            console.log("Charger created:", data);
            alert("✅ Charger added successfully!");
            setForm({ name: "", price: "", latitude: "", longitude: "", connector: "Type2" });
        } catch (err) {
            console.error(err);
            alert("❌ Error adding charger: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-green-700 text-white p-3 rounded-full text-3xl mb-3 shadow">
                        ⚡
                    </div>
                    <h1 className="text-2xl font-bold text-green-900 text-center">
                        Add New Charger
                    </h1>
                    <p className="text-green-700 text-sm">
                        Fill in charger details below
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-green-900 mb-1">Charger Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Downtown Charger 1"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Price ($ / kWh)</label>
                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="e.g. 0.25"
                            step="0.01"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Latitude</label>
                        <input
                            type="number"
                            name="latitude"
                            value={form.latitude}
                            onChange={handleChange}
                            placeholder="e.g. 37.7749"
                            step="0.0001"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Longitude</label>
                        <input
                            type="number"
                            name="longitude"
                            value={form.longitude}
                            onChange={handleChange}
                            placeholder="e.g. -122.4194"
                            step="0.0001"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-green-900 mb-1">Connector Type</label>
                        <select
                            name="connector"
                            value={form.connector}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="TYPE2">Type2</option>
                            <option value="CCS2">CCS</option>
                            <option value="CHADEMO">CHAdeMO</option>
                            <option value="CCS1">CCS1</option>
                            <option value="NEMA14_50">NEMA 14-50</option>
                            <option value="SCHUKO">Schuko</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Adding..." : "Add Charger"}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-6">
                    <a
                        href="/profile"
                        className="text-green-700 font-semibold underline hover:text-green-900"
                    >
                        Back to Profile
                    </a>
                </div>
            </div>
        </div>
    );
}
