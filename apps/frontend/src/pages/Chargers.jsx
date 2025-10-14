// src/pages/Chargers.jsx
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

// Fly map to selected position
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

    // Check user role
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

    // Fetch chargers
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
                setChargers(parsed);
            } catch (err) {
                console.error("Fetching chargers failed:", err);
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchChargers();
    }, [roleChecked]);

    const mapCenter = chargers.length
        ? [Number(chargers[0].latitude), Number(chargers[0].longitude)]
        : [45.267136, 19.833549];

    if (!roleChecked) return <p className="text-green-900 p-6">Checking access...</p>;
    if (loading) return <p className="text-blue-900 p-6">Loading chargers...</p>;
    if (error) return <p className="text-red-900 p-6">Error: {error}</p>;

    const flyToCharger = (charger) => {
        const position = [Number(charger.latitude), Number(charger.longitude)];
        setSelectedPosition(position);

        // Open popup
        const popup = popupRefs.current[charger.id || charger._id];
        if (popup) popup.openPopup();
    };

    return (
        <div className="min-h-screen bg-green-100 p-6 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">All Chargers</h1>

            {/* Map */}
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
                            {charger.available ? "Available" : "Occupied"}
                        </Popup>
                    </Marker>
                ))}
                {selectedPosition && <FlyTo position={selectedPosition} />}
            </MapContainer>

            {/* List */}
            <div className="mt-6 w-full max-w-xl">
                <h2 className="text-xl font-semibold mb-2">Charger List</h2>
                <ul className="bg-white p-4 rounded shadow space-y-2">
                    {chargers.map((charger) => (
                        <li
                            key={charger.id || charger._id}
                            className="border-b pb-2 flex justify-between items-center"
                        >
                            <div>
                                {/* Name clickable to fly to map */}
                                <span
                                    className="font-bold text-blue-600 cursor-pointer hover:underline"
                                    onClick={() => flyToCharger(charger)}
                                >
                                    {charger.name}
                                </span>
                                <br />
                                {charger.address || "No address"}
                                <br />
                                Lat: {charger.latitude}, Lng: {charger.longitude}
                                <br />
                                <span
                                    className={`text-sm font-medium ${charger.available ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {charger.available ? "Available" : "Occupied"}
                                </span>
                            </div>

                            {charger.available && (
                                <button
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                    onClick={() => {
                                        console.log("Starting charger:", charger.name);
                                        // add start charging logic here
                                    }}
                                >
                                    Start
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
