// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "400px",
};

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function Dashboard() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [googleToken, setGoogleToken] = useState(null);
    const [chargers, setChargers] = useState([
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
            address: "Novi Sad, Serbia",
            status: "Open",
            lat: 45.2517,
            lng: 19.8369,
        },
    ]);

    // Detect Phantom wallet
    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            window.solana.connect({ onlyIfTrusted: false }).then((resp) => {
                setWalletAddress(resp.publicKey.toString());
            });
        }
    }, []);

    // Fetch JWT from backend if redirected from Google OAuth
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${BACKEND}/api/auth/token`, {
                    method: "GET",
                    credentials: "include",
                });
                if (res.ok) {
                    const { token } = await res.json();
                    setGoogleToken(token);
                }
            } catch (err) {
                console.error("Google login fetch failed", err);
            }
        })();
    }, []);

    const handleGoogleSignIn = () => {
        const callbackUrl = encodeURIComponent(`${FRONTEND}/auth/callback`);
        window.location.href = `${BACKEND}/api/auth/signin/google?callbackUrl=${callbackUrl}`;
    };

    return (
        <div className="min-h-screen p-4 bg-green-100">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-green-900">TopCharger Dashboard</h1>

                <div className="flex items-center gap-4">
                    {walletAddress && (
                        <span className="bg-green-700 text-white px-3 py-1 rounded font-mono">
                            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                    )}

                    {!walletAddress && !googleToken && (
                        <button
                            onClick={handleGoogleSignIn}
                            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
                        >
                            Sign in with Google
                        </button>
                    )}

                    {googleToken && !walletAddress && (
                        <span className="bg-green-700 text-white px-3 py-1 rounded font-mono">
                            Google Logged In
                        </span>
                    )}
                </div>
            </header>

            {/* Description */}
            <section className="mb-6">
                <p className="text-green-900">
                    Welcome to TopCharger! Here you can add chargers, explore existing charging stations,
                    and see their availability on the map.
                </p>
            </section>

            {/* Add Charger */}
            <section className="mb-6">
                <button className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
                    + Add Charger
                </button>
            </section>

            {/* Map */}
            <section className="mb-6">
                <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap mapContainerStyle={containerStyle} center={{ lat: 45.2517, lng: 19.8369 }} zoom={5}>
                        {chargers.map((c) => (
                            <Marker key={c.id} position={{ lat: c.lat, lng: c.lng }} label={c.name} />
                        ))}
                    </GoogleMap>
                </LoadScript>
            </section>

            {/* Charger Table */}
            <section>
                <h2 className="text-xl font-bold text-green-900 mb-2">Chargers</h2>
                <table className="w-full bg-white rounded shadow overflow-hidden">
                    <thead className="bg-green-700 text-white">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Address</th>
                            <th className="p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chargers.map((c) => (
                            <tr key={c.id} className="border-b">
                                <td className="p-2">{c.name}</td>
                                <td className="p-2">{c.address}</td>
                                <td className="p-2">{c.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
