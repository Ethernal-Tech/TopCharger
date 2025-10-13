// apps/frontend/src/pages/AllChargers.jsx (for DRIVER role)
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BACKEND = "http://localhost:3000";

export default function AllChargers() {
    const [chargers, setChargers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch ALL chargers for drivers
    const fetchChargers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND}/api/chargers`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Failed to fetch chargers: ${res.status}`);
            const data = await res.json();

            const parsed = Array.isArray(data)
                ? data
                : Array.isArray(data.items)
                    ? data.items
                    : Array.isArray(data.chargers)
                        ? data.chargers
                        : [];

            setChargers(parsed);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChargers();
    }, []);

    // Use first charger as map center (fallback if empty)
    const mapCenter = chargers.length
        ? [Number(chargers[0].latitude), Number(chargers[0].longitude)]
        : [45.267136, 19.833549];

    return (
        <div className="min-h-screen bg-green-100 p-6 flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-5xl mb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="bg-blue-700 text-white p-2 rounded mr-2">🚗</div>
                        <h1 className="text-2xl font-bold text-green-900">Available Chargers</h1>
                    </div>
                </div>

                {/* Map */}
                <div className="h-96 w-full rounded-2xl overflow-hidden mb-6">
                    <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                        />
                        {chargers.map((c) => (
                            <Marker
                                key={c.id}
                                position={[Number(c.latitude), Number(c.longitude)]}
                            >
                                <Popup>
                                    <strong>{c.name}</strong><br />
                                    Price: ${c.pricePerKwh.toFixed(2)}<br />
                                    Connector: {c.connector}<br />
                                    Status: {c.available ? "Open" : "Closed"}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Chargers Table */}
                {loading ? (
                    <p className="text-green-900">Loading chargers...</p>
                ) : error ? (
                    <p className="text-red-600">Error: {error}</p>
                ) : chargers.length === 0 ? (
                    <p className="text-green-900">No chargers are available at the moment.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-green-200 text-green-900">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Price ($/kWh)</th>
                                    <th className="p-3">Latitude</th>
                                    <th className="p-3">Longitude</th>
                                    <th className="p-3">Connector</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chargers.map((c) => (
                                    <tr key={c.id} className="border-b hover:bg-green-50 transition-colors">
                                        <td className="p-3 font-semibold text-green-900">{c.name || "-"}</td>
                                        <td className="p-3 text-green-800">
                                            {typeof c.pricePerKwh === "number"
                                                ? `$${c.pricePerKwh.toFixed(2)}`
                                                : "-"}
                                        </td>
                                        <td className="p-3 text-green-800">{c.latitude ?? "-"}</td>
                                        <td className="p-3 text-green-800">{c.longitude ?? "-"}</td>
                                        <td className="p-3 text-green-800">{c.connector || "-"}</td>
                                        <td className="p-3">
                                            <span
                                                className={`px-3 py-1 rounded-full font-semibold ${c.available
                                                        ? "bg-green-600 text-white"
                                                        : "bg-gray-300 text-gray-700"
                                                    }`}
                                            >
                                                {c.available ? "Open" : "Closed"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
