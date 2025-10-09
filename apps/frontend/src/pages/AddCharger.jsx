// apps/frontend/src/pages/AddCharger.jsx
import React, { useState } from "react";

export default function AddCharger() {
    const [form, setForm] = useState({
        name: "",
        price: "",
        address: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("New charger submitted:", form);
        alert("✅ Charger added successfully!");
        setForm({ name: "", price: "", address: "" });
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
                        <label className="block text-green-900 mb-1">
                            Price ($ / kWh)
                        </label>
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
                        <label className="block text-green-900 mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="e.g. 123 Green Ave, San Francisco"
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition-colors"
                    >
                        Add Charger
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
