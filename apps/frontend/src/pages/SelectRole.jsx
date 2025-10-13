// src/pages/select-role.jsx
import { useState } from "react";

const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function SelectRole() {
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = async (role) => {
        const token = sessionStorage.getItem("tc_token");
        if (!token) {
            alert("Unauthorized, please login again");
            window.location.href = "/";
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BACKEND}/api/${role}/profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ role }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Failed to set role");
            }

            // update local storage
            const updatedUser = await res.json();
            sessionStorage.setItem("tc_user", JSON.stringify(updatedUser));

            // redirect to dashboard
            window.location.href = FRONTEND;
        } catch (err) {
            console.error(err);
            alert("❌ Error setting role: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
                <h1 className="text-3xl font-bold text-green-900 mb-4">
                    Choose Your Role
                </h1>
                <p className="text-green-700 mb-6">
                    This is your first time here. Please select whether you are a host (to list chargers) or a driver (to find chargers).
                </p>
                <div className="flex flex-col gap-4">
                    <button
                        disabled={loading}
                        onClick={() => handleRoleSelect("hosts")}
                        className="bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "I am a Host"}
                    </button>
                    <button
                        disabled={loading}
                        onClick={() => handleRoleSelect("drivers")}
                        className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "I am a Driver"}
                    </button>
                </div>
            </div>
        </div>
    );
}
