// apps/frontend/src/pages/Profile.jsx
import { useState, useEffect } from "react";
import FullScreenLoader from "../components/FullScreenLoader.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = JSON.parse(sessionStorage.getItem("tc_user"));
            if (!user) {
                setError("Not logged in");
                setLoading(false);
                return;
            }

            const endpoint =
                user.role === "HOST"
                    ? `${BACKEND}/api/hosts/profile`
                    : `${BACKEND}/api/drivers/profile`;

            try {
                const res = await fetch(endpoint, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch profile");
                }

                const data = await res.json();
                setProfile({ ...data, role: user.role });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <FullScreenLoader />;

    if (error) {
        return (
            <div className="min-h-screen relative flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/top_charger.png')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70"></div>
                <p className="relative z-10 text-red-500 p-6 bg-white/30 rounded">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/top_charger.png')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70"></div>

            {/* Profile Card */}
            <div className="relative z-10 backdrop-blur-sm bg-white/90 p-10 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-green-700 text-white p-4 rounded-full text-4xl mb-3 shadow">
                        👤
                    </div>
                    <h1 className="text-3xl font-bold text-green-900">
                        {profile.role === "HOST" ? "Host Profile" : "Driver Profile"}
                    </h1>
                </div>

                {/* Profile Details */}
                <div className="space-y-4">
                    {profile.role === "HOST" ? (
                        <>
                            <ProfileField label="Business Name" value={profile.host?.businessName} />
                            <ProfileField label="Bank Account IBAN" value={profile.host?.bankAccountIban} />
                            <ProfileField label="Bank Account Name" value={profile.host?.bankAccountName} />
                        </>
                    ) : (
                        <>
                            <ProfileField label="Full Name" value={profile.driver?.fullName} />
                            <ProfileField label="Phone" value={profile.driver?.phone} />
                            <ProfileField label="Solana Public Key" value={profile.driver?.solanaPubkey} />
                            <ProfileField label="Preferred Connector" value={profile.driver?.preferredConnector} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileField({ label, value }) {
    return (
        <div className="border-b pb-2">
            <span className="block text-green-800 font-semibold">{label}</span>
            <span className="text-green-900">{value || "—"}</span>
        </div>
    );
}
