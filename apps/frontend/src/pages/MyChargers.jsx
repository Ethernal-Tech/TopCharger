// apps/frontend/src/pages/MyChargers.jsx
import React, { useState } from "react";

export default function MyChargers() {
    // Example static charger data (you can later fetch from API)
    const [chargers, setChargers] = useState([
        {
            id: 1,
            name: "Downtown Charger 1",
            price: 0.25,
            address: "123 Green Ave, San Francisco",
            status: "Open",
            timeSlots: ["08:00–12:00", "14:00–18:00"],
        },
        {
            id: 2,
            name: "City Center Charger 2",
            price: 0.30,
            address: "455 Oak St, San Francisco",
            status: "Occupied",
            timeSlots: ["10:00–14:00", "16:00–20:00"],
        },
    ]);

    return (
        <div className="min-h-screen bg-green-100 p-6 flex flex-col items-center">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-4xl mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="bg-green-700 text-white p-2 rounded mr-2">⚡</div>
                        <h1 className="text-2xl font-bold text-green-900">
                            My Chargers
                        </h1>
                    </div>

                    <a
                        href="/add-charger"
                        className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors"
                    >
                        + Add Charger
                    </a>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-green-200 text-green-900">
                                <th className="p-3">Name</th>
                                <th className="p-3">Price ($/kWh)</th>
                                <th className="p-3">Address</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Time Slots</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chargers.map((charger) => (
                                <tr
                                    key={charger.id}
                                    className="border-b hover:bg-green-50 transition-colors"
                                >
                                    <td className="p-3 font-semibold text-green-900">
                                        {charger.name}
                                    </td>
                                    <td className="p-3 text-green-800">
                                        ${charger.price.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-green-800">{charger.address}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 rounded-full font-semibold ${charger.status === "Open"
                                                    ? "bg-green-600 text-white"
                                                    : "bg-gray-300 text-gray-700"
                                                }`}
                                        >
                                            {charger.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-green-800">
                                        {charger.timeSlots.join(", ")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
