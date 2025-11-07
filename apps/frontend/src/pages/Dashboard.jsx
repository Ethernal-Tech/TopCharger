// src/pages/Dashboard.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FRONTEND, BACKEND } from "../context/Constants.js";
import { useAuth } from "../context/UseAuth.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // wait for AuthContext to bootstrap
    if (!role) return; // unauthenticated or UNSET -> stay here

    if (role === "HOST") navigate("/my-chargers", { replace: true });
    else if (role === "DRIVER") navigate("/chargers", { replace: true });
  }, [loading, role, navigate]);

  const handleGoogleLogin = () => {
    // preserve where the user was trying to go (if any)
    const redirect =
      new URLSearchParams(location.search).get("redirect") ||
      location.state?.redirect ||
      "/";
    const cb = encodeURIComponent(
      `${FRONTEND}/auth/callback?redirect=${encodeURIComponent(redirect)}`
    );
    window.location.href = `${BACKEND}/auth/signin?cb=${cb}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-100">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center text-center px-4 sm:px-6 md:px-16 pt-16 sm:pt-24 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/top_charger.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />
      <div className="relative z-10 flex flex-col items-center justify-start max-w-full sm:max-w-4xl">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 sm:mb-8 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
          TopCharger
        </h1>
        <p className="text-lg sm:text-2xl md:text-3xl max-w-full sm:max-w-3xl mb-8 sm:mb-12 text-slate-100">
          Making EV charging{" "}
          <span className="font-extrabold text-emerald-300">simple</span>,{" "}
          <span className="font-extrabold text-emerald-300">open</span>, and{" "}
          <span className="font-extrabold text-emerald-300">everywhere</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full sm:w-auto px-6 py-3 rounded-lg shadow bg-emerald-600 text-white hover:bg-emerald-500 transition flex items-center justify-center gap-2"
          >
            {/* Google G icon (kept) */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M21.35 11.1h-9.18v2.89h5.27c-.23 1.3-1.2 3.81-5.27 3.81-3.17 0-5.77-2.61-5.77-5.81s2.6-5.81 5.77-5.81c1.81 0 3.03.78 3.73 1.46l2.55-2.46C17.05 2.5 15.1 1.7 12.17 1.7 6.72 1.7 2.35 6.08 2.35 11.53s4.37 9.83 9.82 9.83c5.67 0 9.42-3.98 9.42-9.58 0-.64-.07-1.08-.24-1.68z" />
            </svg>
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}
