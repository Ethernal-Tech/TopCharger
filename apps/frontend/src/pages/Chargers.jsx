// apps/frontend/src/pages/Chargers.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BACKEND = "http://localhost:3000";

// Marker icons
const greenIcon = new L.Icon({
    iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const redIcon = new L.Icon({
    iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Fly map helper
function FlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 16);
    }, [position, map]);
    return null;
}

export default function Chargers() {
    const [chargers, setChargers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleChecked, setRoleChecked] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const popupRefs = useRef({});

    // Check driver role
    useEffect(() => {
        const checkRole = async () => {
            try {
                const res = await fetch(`${BACKEND}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok || !data.user || data.user.role !== "DRIVER") {
                    window.location.href = "/";
                    return;
                }
                setRoleChecked(true);
            } catch (err) {
                console.error("Role check failed:", err);
                window.location.href = "/";
            }
        };
        checkRole();
    }, []);

    // Fetch chargers & restore sessions from localStorage
    useEffect(() => {
        if (!roleChecked) return;

        const fetchChargers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BACKEND}/api/chargers`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                const parsed = Array.isArray(data)
                    ? data
                    : Array.isArray(data.items)
                        ? data.items
                        : Array.isArray(data.chargers)
                            ? data.chargers
                            : [];

                // ✅ Restore sessions from localStorage
                const saved = JSON.parse(localStorage.getItem("activeSessions") || "{}");
                const restored = parsed.map(c => {
                    if (saved[c.id]) {
                        return { ...c, available: false, activeSessionId: saved[c.id] };
                    }
                    return c;
                });

                setChargers(restored);
            } catch (err) {
                console.error("Fetching chargers failed:", err);
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchChargers();
    }, [roleChecked]);

    // ✅ Start session
    const startSession = async (chargerId) => {
        try {
            const res = await fetch(`${BACKEND}/api/chargers/${chargerId}/start`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to start session");

            const sessionId = data.session?.id;
            if (!sessionId) throw new Error("Backend did not return session ID");

            // ✅ Save to localStorage
            const activeSessions = JSON.parse(localStorage.getItem("activeSessions") || "{}");
            activeSessions[chargerId] = sessionId;
            localStorage.setItem("activeSessions", JSON.stringify(activeSessions));

            alert("✅ Charging session started!");
            setChargers(chargers.map(c =>
                c.id === chargerId ? { ...c, available: false, activeSessionId: sessionId } : c
            ));
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    // ✅ Stop session
    const stopSession = async (sessionId, chargerId) => {
        try {
            const res = await fetch(`${BACKEND}/api/sessions/${sessionId}/stop`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to stop session");

            // ✅ Remove from localStorage
            const activeSessions = JSON.parse(localStorage.getItem("activeSessions") || "{}");
            delete activeSessions[chargerId];
            localStorage.setItem("activeSessions", JSON.stringify(activeSessions));

            alert("🛑 Charging session stopped!");
            setChargers(chargers.map(c =>
                c.activeSessionId === sessionId ? { ...c, available: true, activeSessionId: null } : c
            ));
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    const mapCenter = chargers.length
        ? [Number(chargers[0].latitude), Number(chargers[0].longitude)]
        : [45.267136, 19.833549];

    if (!roleChecked) return <p className="p-6 text-green-900">Checking access...</p>;
    if (loading) return <p className="p-6 text-blue-900">Loading chargers...</p>;
    if (error) return <p className="p-6 text-red-900">Error: {error}</p>;

    const flyToCharger = (charger) => {
        const position = [Number(charger.latitude), Number(charger.longitude)];
        setSelectedPosition(position);
        const popup = popupRefs.current[charger.id || charger._id];
        if (popup) popup.openPopup();
    };

    return (
        <div className="min-h-screen bg-green-100 p-6 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Nearby Chargers</h1>

            <MapContainer center={mapCenter} zoom={13} style={{ height: "400px", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                {chargers.map((charger) => (
                    <Marker
                        key={charger.id || charger._id}
                        position={[Number(charger.latitude), Number(charger.longitude)]}
                        icon={charger.available ? greenIcon : redIcon}
                        ref={(el) => {
                            if (el) popupRefs.current[charger.id || charger._id] = el.getPopup();
                        }}
                    >
                        <Popup>
                            <strong>{charger.name}</strong>
                            <br />
                            {charger.address || "No address"}
                            <br />
                            Power: {charger.powerKw} kW
                            <br />
                            Price: {charger.pricePerKwh} €/kWh
                            <br />
                            Status: {charger.available ? "Available" : "Occupied"}
                        </Popup>
                    </Marker>
                ))}
                {selectedPosition && <FlyTo position={selectedPosition} />}
            </MapContainer>

            <div className="mt-6 w-full max-w-xl flex flex-col gap-4">
                {chargers.map((charger) => (
                    <div
                        key={charger.id || charger._id}
                        className="bg-white p-4 rounded shadow flex justify-between items-center"
                    >
                        <div>
                            <span
                                className="font-bold text-blue-600 cursor-pointer hover:underline"
                                onClick={() => flyToCharger(charger)}
                            >
                                {charger.name}
                            </span>
                            <br />
                            {charger.address || "No address"}
                            <br />
                            {charger.available ? "Available" : "Occupied"}
                        </div>

                        {charger.available ? (
                            <button
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                onClick={() => startSession(charger.id)}
                            >
                                Start
                            </button>
                        ) : charger.activeSessionId ? (
                            <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                onClick={() => stopSession(charger.activeSessionId, charger.id)}
                            >
                                Stop
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
