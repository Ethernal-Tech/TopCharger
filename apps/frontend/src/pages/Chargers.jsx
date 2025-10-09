// src/pages/ChargersPage.jsx
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const chargers = [
    {
        id: 1,
        name: "Charger 1",
        address: "123 Elm St, San Francisco, CA",
        status: "Open",
        lat: 37.7749,
        lng: -122.4194,
    },
    {
        id: 2,
        name: "Charger 2",
        address: "455 Oak St, San Francisco, CA",
        status: "Occupied",
        lat: 37.7765,
        lng: -122.417,
    },
    {
        id: 3,
        name: "Charger 3",
        address: "789 Pine St, San Francisco, CA",
        status: "Open",
        lat: 37.7725,
        lng: -122.414,
    },
    {
        id: 4,
        name: "Charger 4",
        address: "101 Maple St, San Francisco, CA",
        status: "Open",
        lat: 37.77,
        lng: -122.421,
    },
    {
        id: 5,
        name: "Charger Novi Sad",
        address: "Bulevar Oslobođenja 100, Novi Sad, Serbia",
        status: "Open",
        lat: 45.2671,
        lng: 19.8335,
    },
];

export default function ChargersPage() {
    const [selectedCharger, setSelectedCharger] = useState(chargers[0]);

    return (
        <div className="min-h-screen p-4 flex flex-col md:flex-row gap-4">
            {/* List */}
            <div className="flex-1 space-y-4">
                <h1 className="text-3xl font-bold text-green-800 mb-4">
                    EV Charging Marketplace
                </h1>
                {chargers.map((charger) => (
                    <div
                        key={charger.id}
                        onClick={() => setSelectedCharger(charger)}
                        className="p-4 rounded-lg border cursor-pointer flex justify-between items-center hover:bg-green-50"
                    >
                        <div>
                            <h2 className="font-semibold text-green-900">{charger.name}</h2>
                            <p className="text-green-700">{charger.address}</p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full font-semibold ${charger.status === "Open"
                                ? "bg-green-600 text-white"
                                : "bg-gray-300 text-gray-700"
                                }`}
                        >
                            {charger.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Map */}
            <div className="flex-1 rounded-lg overflow-hidden h-[400px] md:h-auto">
                <MapContainer
                    center={[selectedCharger.lat, selectedCharger.lng]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {chargers.map((charger) => (
                        <Marker key={charger.id} position={[charger.lat, charger.lng]}>
                            <Popup>
                                <strong>{charger.name}</strong>
                                <br />
                                {charger.address}
                                <br />
                                Status: {charger.status}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
