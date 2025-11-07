// apps/frontend/src/pages/Sessions.jsx
import React, { useState, useEffect } from "react";
import FullScreenLoader from "../components/FullScreenLoader.jsx";
import { BACKEND } from "../context/Constants.js";


export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Normalize to "host" | "driver"
  const stored = sessionStorage.getItem("tc_role") || "DRIVER";
  const scope = stored.toLowerCase() === "host" ? "host" : "driver";

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND}/api/sessions?scope=${scope}`, {
          method: "GET",
          credentials: "include",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();
        setSessions(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (!ac.signal.aborted) setError(err.message || "Unknown error");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [scope]);

  if (loading) return <FullScreenLoader />;

  if (error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/top_charger.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />
        <p className="relative z-10 text-red-600 p-6 bg-white/70 rounded">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center p-4 sm:p-6 gap-6">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/top_charger.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center gap-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white text-center">
          ⚡ {scope === "host" ? "Hosted" : "Charging"} Sessions
        </h1>

        {sessions.length === 0 ? (
          <p className="text-green-100 p-4 bg-white/30 rounded">
            No sessions found.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="w-full min-w-[700px] sm:min-w-[900px] bg-white/90 rounded shadow p-4">
              <table className="w-full text-left border-collapse text-sm sm:text-base">
                <thead className="bg-green-700 text-white">
                  <tr>
                    <th className="p-2 sm:p-3">Charger</th>
                    <th className="p-2 sm:p-3">Connector</th>
                    <th className="p-2 sm:p-3">Started At</th>
                    <th className="p-2 sm:p-3">Stopped At</th>
                    <th className="p-2 sm:p-3">Energy (kWh)</th>
                    <th className="p-2 sm:p-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-green-50">
                      <td className="p-2 sm:p-3">{s.chargerNameSnapshot}</td>
                      <td className="p-2 sm:p-3">{s.connectorSnapshot}</td>
                      <td className="p-2 sm:p-3">
                        {new Date(s.startedAt).toLocaleString()}
                      </td>
                      <td className="p-2 sm:p-3">
                        {s.stoppedAt
                          ? new Date(s.stoppedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2 sm:p-3">
                        {s.energyKwh != null ? s.energyKwh.toFixed(2) : "-"}
                      </td>
                      <td className="p-2 sm:p-3">
                        {s.costTotal != null ? s.costTotal.toFixed(2) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
