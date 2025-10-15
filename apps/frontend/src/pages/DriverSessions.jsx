// src/pages/DriverSessions.jsx
import React, { useState, useEffect } from "react";

const BACKEND = "http://localhost:3000";

export default function DriverSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch driver's sessions
    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND}/api/sessions?scope=driver`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch sessions");

            const data = await res.json();
            // Ensure we get an array
            setSessions(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Start a session
    const startSession = async (chargerId) => {
        try {
            const res = await fetch(`${BACKEND}/api/chargers/${chargerId}/start`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to start session");
            alert("Session started!");
            fetchSessions();
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    // Stop a session
    const stopSession = async (sessionId) => {
        try {
            const res = await fetch(`${BACKEND}/api/sessions/${sessionId}/stop`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to stop session");
            alert("Session stopped!");
            fetchSessions();
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    if (loading) return <p className="text-green-900 p-6">Loading sessions...</p>;
    if (error) return <p className="text-red-600 p-6">Error: {error}</p>;
    if (sessions.length === 0) return <p className="text-green-900 p-6">No sessions found.</p>;

    return (
        <div className="min-h-screen bg-green-100 p-6 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">🚗 My Charging Sessions</h1>
            <div className="w-full max-w-3xl bg-white rounded shadow p-4">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-green-200">
                        <tr>
                            <th className="p-2">Charger</th>
                            <th className="p-2">Connector</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Started At</th>
                            <th className="p-2">Stopped At</th>
                            <th className="p-2">Energy (kWh)</th>
                            <th className="p-2">Cost</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s) => (
                            <tr key={s.id} className="border-b hover:bg-green-50">
                                <td className="p-2 font-semibold">{s.chargerId}</td>
                                <td className="p-2">{s.connectorSnapshot}</td>
                                <td className="p-2">{s.status}</td>
                                <td className="p-2">{new Date(s.startedAt).toLocaleString()}</td>
                                <td className="p-2">{s.stoppedAt ? new Date(s.stoppedAt).toLocaleString() : "-"}</td>
                                <td className="p-2">{s.energyKwh ?? "-"}</td>
                                <td className="p-2">{s.costTotal ?? "-"}</td>
                                <td className="p-2 flex gap-2">
                                    {s.status === "ACTIVE" && (
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                            onClick={() => stopSession(s.id)}
                                        >
                                            Stop
                                        </button>
                                    )}
                                    {s.status === "PENDING" && (
                                        <button
                                            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                            onClick={() => startSession(s.chargerId)}
                                        >
                                            Start
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
