// src/pages/Sessions.jsx
import React, { useState, useEffect } from "react";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function Sessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get role from sessionStorage
    const role = sessionStorage.getItem("tc_role") || "driver"; // default to driver

    // Fetch sessions based on role
    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND}/api/sessions?scope=${role}`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch sessions");

            const data = await res.json();
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
    }, [role]);

    if (loading) return <FullScreenLoader />;
    if (error) return <p className="text-red-600 p-6">Error: {error}</p>;
    if (sessions.length === 0) return <p className="text-green-900 p-6">No sessions found.</p>;

    return (
        <div className="min-h-screen bg-default-background p-6 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6 text-white">
                🚗 {role === "host" ? "Hosted" : "Charging"} Sessions
            </h1>
            <div className="w-full max-w-7xl bg-white rounded shadow p-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                    <thead className="bg-green-200">
                        <tr>
                            <th className="p-3">Charger</th>
                            <th className="p-3">Connector</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Started At</th>
                            <th className="p-3">Stopped At</th>
                            <th className="p-3">Energy (kWh)</th>
                            <th className="p-3">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s) => (
                            <tr key={s.id} className="border-b hover:bg-green-50">
                                <td className="p-3 font-semibold">{s.chargerId}</td>
                                <td className="p-3">{s.connectorSnapshot}</td>
                                <td className="p-3">{s.status}</td>
                                <td className="p-3">{new Date(s.startedAt).toLocaleString()}</td>
                                <td className="p-3">{s.stoppedAt ? new Date(s.stoppedAt).toLocaleString() : "-"}</td>
                                <td className="p-3">{s.energyKwh ?? "-"}</td>
                                <td className="p-3">{s.costTotal ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
