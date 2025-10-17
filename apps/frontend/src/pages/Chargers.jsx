// apps/frontend/src/pages/Chargers.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

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

// Charger card component (hide stop button if session is active)
function ChargerCard({ charger, onStart, onFlyTo }) {
    return (
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
                <span
                    className="font-bold text-blue-600 cursor-pointer hover:underline"
                    onClick={() => onFlyTo(charger)}
                >
                    {charger.name}
                </span>
                <br />
                {charger.address || "No address"}
                <br />
                Power: {charger.powerKw} kW
                <br />
                Price: {charger.pricePerKwh} €/kWh
                <br />
                Status: {charger.available ? "Available" : "Occupied"}
            </div>

            {charger.available ? (
                <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    onClick={() => onStart(charger.id)}
                >
                    Start
                </button>
            ) : null}
        </div>
    );
}

export default function Chargers() {
    const [chargers, setChargers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleChecked, setRoleChecked] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [activeSessions, setActiveSessions] = useState({});
    const [progress, setProgress] = useState({});
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

                const saved = JSON.parse(localStorage.getItem("activeSessions") || "{}");
                setActiveSessions(saved);

                const restored = parsed.map((c) => {
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

    // Start session
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

            const updatedSessions = { ...activeSessions, [chargerId]: sessionId };
            localStorage.setItem("activeSessions", JSON.stringify(updatedSessions));
            setActiveSessions(updatedSessions);

            setChargers(
                chargers.map((c) =>
                    c.id === chargerId ? { ...c, available: false, activeSessionId: sessionId } : c
                )
            );

            // Start mock progress
            setProgress((prev) => ({ ...prev, [chargerId]: 0 }));
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    // Stop session
    const stopSession = async (sessionId, chargerId) => {
        try {
            const res = await fetch(`${BACKEND}/api/sessions/${sessionId}/stop`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to stop session");

            const updatedSessions = { ...activeSessions };
            delete updatedSessions[chargerId];
            localStorage.setItem("activeSessions", JSON.stringify(updatedSessions));
            setActiveSessions(updatedSessions);

            setProgress((prev) => {
                const copy = { ...prev };
                delete copy[chargerId];
                return copy;
            });

            setChargers(
                chargers.map((c) =>
                    c.activeSessionId === sessionId ? { ...c, available: true, activeSessionId: null } : c
                )
            );
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    // Mock progress update
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                const updated = {};
                Object.entries(prev).forEach(([chargerId, value]) => {
                    updated[chargerId] = Math.min(value + Math.random() * 5, 100);
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const mapCenter = chargers.length
        ? [Number(chargers[0].latitude), Number(chargers[0].longitude)]
        : [45.267136, 19.833549];

    const flyToCharger = (charger) => {
        const position = [Number(charger.latitude), Number(charger.longitude)];
        setSelectedPosition(position);
        const popup = popupRefs.current[charger.id || charger._id];
        if (popup) popup.openPopup();
    };

    if (!roleChecked) return <FullScreenLoader message="Checking access..." />;
    if (loading) return <FullScreenLoader message="Loading chargers..." />;
    if (error) return <p className="p-6 text-red-900">Error: {error}</p>;

    return (
        <div className="min-h-screen bg-default-background flex flex-col p-6 gap-4">
            {/* Top section: map + list */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Map */}
                <div className="md:w-2/3 h-[50vh] rounded overflow-hidden shadow-lg">
                    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
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
                </div>

                {/* Charger list */}
                <div className="md:w-1/3 flex flex-col gap-4 overflow-y-auto p-4 max-h-[50vh] rounded shadow-lg bg-white/80">
                    <h1 className="text-2xl font-bold mb-2">Nearby Chargers</h1>
                    {chargers.map((charger) => (
                        <ChargerCard
                            key={charger.id || charger._id}
                            charger={charger}
                            onStart={startSession}
                            onFlyTo={flyToCharger}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom section: active sessions */}
            <div className="mt-4 p-4 rounded shadow-lg bg-white/80">
                <h2 className="text-xl font-bold mb-2">Active Charging Sessions</h2>
                {Object.entries(activeSessions).length === 0 ? (
                    <p>No active sessions</p>
                ) : (
                    Object.entries(activeSessions).map(([chargerId, sessionId]) => {
                        const charger = chargers.find((c) => c.id === chargerId);
                        const prog = progress[chargerId] || 0;

                        return (
                            <div
                                key={sessionId}
                                className="flex items-center justify-between p-2 bg-green-50 rounded mb-2"
                            >
                                <div className="flex-1 mr-4">
                                    <span className="font-semibold">{charger?.name || chargerId}</span>
                                    <div className="w-full bg-gray-300 rounded h-3 mt-1">
                                        <div
                                            className="bg-green-600 h-3 rounded"
                                            style={{ width: `${prog}%` }}
                                        />
                                    </div>
                                </div>
                                <button
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    onClick={() => stopSession(sessionId, chargerId)}
                                >
                                    Stop
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
