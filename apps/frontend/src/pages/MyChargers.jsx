// apps/frontend/src/pages/MyChargers.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function MyChargers() {
    const [chargers, setChargers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        name: "",
        price: "",
        latitude: "",
        longitude: "",
        connector: "TYPE2",
    });
    const [adding, setAdding] = useState(false);

    const mapRef = useRef(null);
    const markerRefs = useRef({});

    const fetchChargers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND}/api/hosts/chargers`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Failed to fetch chargers: ${res.status}`);
            const data = await res.json();
            console.log("Raw chargers from backend:", data);

            const parsed =
                Array.isArray(data) ? data :
                    Array.isArray(data.chargers) ? data.chargers :
                        Array.isArray(data.items) ? data.items :
                            [];

            const sanitized = parsed.map((c) => ({
                ...c,
                latitude: Number(c.latitude),
                longitude: Number(c.longitude),
                pricePerKwh: Number(c.pricePerKwh),
                available: Boolean(c.available),
            }));

            setChargers(sanitized);
        } catch (err) {
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChargers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAdding(true);
        try {
            const payload = {
                name: form.name,
                pricePerKwh: parseFloat(form.price),
                latitude: parseFloat(form.latitude),
                longitude: parseFloat(form.longitude),
                connector: form.connector,
            };
            const res = await fetch(`${BACKEND}/api/hosts/chargers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to add charger");

            alert("✅ Charger added!");
            setForm({ name: "", price: "", latitude: "", longitude: "", connector: "TYPE2" });
            fetchChargers();
        } catch (err) {
            alert("❌ " + err.message);
        } finally {
            setAdding(false);
        }
    };

    const flyToCharger = (lat, lng, id) => {
        if (!lat || !lng) return;
        if (mapRef.current) mapRef.current.flyTo([lat, lng], 15, { duration: 1 });
        setTimeout(() => markerRefs.current[id]?.openPopup(), 500);
    };

    const mapCenter =
        chargers.length > 0
            ? [chargers[0].latitude, chargers[0].longitude]
            : [45.267136, 19.833549];

    // ✅ Show full-screen loader like login (blue style)
    if (loading) {
        return <FullScreenLoader message="Fetching your chargers..." />;
    }

    // ❌ Error fallback
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                    <p className="text-red-600 font-semibold mb-4">Error: {error}</p>
                    <button
                        onClick={fetchChargers}
                        className="bg-green-700 text-white py-2 px-4 rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 flex flex-col items-center relative overflow-hidden">
            {/* Optional overlay for readability */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">
                <div className="bg-white p-6 rounded-2xl shadow-md w-full mb-8">
                    <h1 className="text-2xl font-bold text-green-900 mb-4">⚡ My Chargers</h1>

                    {/* Add Charger Form */}
                    <div className="bg-green-50 p-4 rounded mb-6">
                        <h2 className="text-lg font-semibold text-green-900 mb-2">Add New Charger</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={form.name} onChange={handleChange} placeholder="Charger Name" className="p-2 rounded border border-green-300" required />
                            <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price ($/kWh)" className="p-2 rounded border border-green-300" step="0.01" required />
                            <input name="latitude" type="number" value={form.latitude} onChange={handleChange} placeholder="Latitude" className="p-2 rounded border border-green-300" step="0.0001" required />
                            <input name="longitude" type="number" value={form.longitude} onChange={handleChange} placeholder="Longitude" className="p-2 rounded border border-green-300" step="0.0001" required />
                            <select name="connector" value={form.connector} onChange={handleChange} className="p-2 rounded border border-green-300">
                                <option value="TYPE2">Type2</option>
                                <option value="CCS2">CCS2</option>
                                <option value="CHADEMO">CHAdeMO</option>
                                <option value="CCS1">CCS1</option>
                                <option value="NEMA14_50">NEMA 14-50</option>
                                <option value="SCHUKO">Schuko</option>
                            </select>
                            <button type="submit" disabled={adding} className="bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800">
                                {adding ? "Adding..." : "Add Charger"}
                            </button>
                        </form>
                    </div>

                    {/* Map */}
                    <div className="h-96 w-full rounded-2xl overflow-hidden mb-4">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            whenCreated={(map) => (mapRef.current = map)}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {chargers.map((c) =>
                                c.latitude && c.longitude ? (
                                    <Marker
                                        key={c.id}
                                        position={[c.latitude, c.longitude]}
                                        ref={(ref) => (markerRefs.current[c.id] = ref)}
                                    >
                                        <Popup>
                                            <strong>{c.name}</strong>
                                            <br />
                                            Price: ${c.pricePerKwh}
                                            <br />
                                            Connector: {c.connector}
                                            <br />
                                            Status: {c.available ? "✅ Open" : "❌ Closed"}
                                        </Popup>
                                    </Marker>
                                ) : null
                            )}
                        </MapContainer>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-green-200">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Connector</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chargers.map((c) => (
                                <tr key={c.id} className="border-b hover:bg-green-50">
                                    <td
                                        className="p-3 font-semibold text-green-900 cursor-pointer hover:underline"
                                        onClick={() => flyToCharger(c.latitude, c.longitude, c.id)}
                                    >
                                        {c.name}
                                    </td>
                                    <td className="p-3">${c.pricePerKwh}</td>
                                    <td className="p-3">{c.connector}</td>
                                    <td className="p-3">{c.available ? "✅ Open" : "❌ Closed"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
