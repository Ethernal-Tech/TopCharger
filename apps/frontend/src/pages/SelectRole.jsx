import { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function SelectRole() {
    const [role, setRole] = useState(null); // "hosts" or "drivers"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Host form state
    const [businessName, setBusinessName] = useState("");
    const [bankAccountIban, setBankAccountIban] = useState("");
    const [bankAccountName, setBankAccountName] = useState("");

    // Driver form state
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [solanaPubkey, setSolanaPubkey] = useState("");

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setError(null);
    };

    const handleBack = () => {
        setRole(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const token = sessionStorage.getItem("tc_token");
        if (!token) {
            alert("Unauthorized, please login again");
            window.location.href = "/";
            return;
        }

        let body = {};
        if (role === "hosts") {
            body = { businessName, bankAccountIban, bankAccountName };
        } else if (role === "drivers") {
            body = { fullName, phone, solanaPubkey, preferredConnector: "TYPE2" };
        }

        try {
            const res = await fetch(`${BACKEND}/api/${role}/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to set profile");
            }

            const updatedUser = await res.json();
            sessionStorage.setItem("tc_user", JSON.stringify(updatedUser));

            // Redirect based on role
            if (role === "hosts") {
                window.location.href = "/my-chargers";
            } else if (role === "drivers") {
                window.location.href = "/chargers";
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/top_charger.png')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70"></div>

            {/* Content */}
            <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-md p-6 sm:p-8 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-4">
                    {role ? `Complete ${role === "hosts" ? "Host" : "Driver"} Profile` : "Choose Your Role"}
                </h1>

                {!role && (
                    <>
                        <p className="text-green-800 mb-6 text-sm sm:text-base">
                            This is your first time here. Please select whether you are a host (to list chargers) or a driver (to find chargers).
                        </p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => handleRoleSelect("hosts")}
                                className="bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition"
                            >
                                I am a Host
                            </button>
                            <button
                                onClick={() => handleRoleSelect("drivers")}
                                className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
                            >
                                I am a Driver
                            </button>
                        </div>
                    </>
                )}

                {role && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                        {role === "hosts" && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Business Name"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    required
                                    className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                                />
                                <input
                                    type="text"
                                    placeholder="Bank Account IBAN"
                                    value={bankAccountIban}
                                    onChange={(e) => setBankAccountIban(e.target.value)}
                                    required
                                    className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                                />
                                <input
                                    type="text"
                                    placeholder="Bank Account Name"
                                    value={bankAccountName}
                                    onChange={(e) => setBankAccountName(e.target.value)}
                                    required
                                    className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                                />
                            </>
                        )}

                        {role === "drivers" && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                                />
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                                />
                                <input
                                    type="text"
                                    placeholder="Solana Public Key"
                                    value={solanaPubkey}
                                    onChange={(e) => setSolanaPubkey(e.target.value)}
                                    required
                                    className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                                />
                            </>
                        )}

                        {error && <p className="text-red-600 text-sm">{error}</p>}

                        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-2">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition w-full sm:w-auto"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800 disabled:opacity-50 transition w-full sm:w-auto"
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
