// apps/frontend/src/pages/SelectRole.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND } from "../context/Constants.js";

export default function SelectRole() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // "hosts" | "drivers"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Host form
  const [businessName, setBusinessName] = useState("");
  const [bankAccountIban, setBankAccountIban] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  // Driver form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

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

    const body =
      role === "hosts"
        ? { businessName, bankAccountIban, bankAccountName }
        : { fullName, phone };

    try {
      // 1) Save role-specific profile
      const res = await fetch(`${BACKEND}/api/${role}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to save profile");
      }

      // 2) Refresh auth/user so guards see the new role immediately
      const me = await fetch(`${BACKEND}/api/auth/me`, {
        credentials: "include",
      });
      if (me.ok) {
        const { user } = await me.json();
        sessionStorage.setItem("tc_user", JSON.stringify(user));
        sessionStorage.setItem("tc_role", user.role);
      }

      // 3) Navigate without full reload
      navigate(role === "hosts" ? "/my-chargers" : "/chargers", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Unknown error");
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
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />

      {/* Content */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-md p-6 sm:p-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-4">
          {role
            ? `Complete ${role === "hosts" ? "Host" : "Driver"} Profile`
            : "Choose Your Role"}
        </h1>

        {!role ? (
          <>
            <p className="text-green-800 mb-6 text-sm sm:text-base">
              Please select whether you are a host (list chargers) or a driver
              (find chargers).
            </p>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect("hosts")}
                className="bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition"
              >
                I am a Host
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("drivers")}
                className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
              >
                I am a Driver
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            {role === "hosts" ? (
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
                  placeholder="Account Holder Name"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  required
                  className="p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-500 w-full"
                />
              </>
            ) : (
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
                {loading ? "Saving..." : "Continue"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
