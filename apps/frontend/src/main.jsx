// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from './context/UseAuth.js';
import './index.css';
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chargers from "./pages/Chargers.jsx";
import RegisterSeller from "./pages/RegisterSeller.jsx";
import Profile from "./pages/Profile.jsx";
import AddCharger from "./pages/AddCharger.jsx";
import MyChargers from "./pages/MyChargers.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";
import SelectRole from "./pages/SelectRole.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Sessions from "./pages/Sessions.jsx";
import Logout from "./pages/Logout.jsx";

// ✅ Export to satisfy Fast Refresh
export function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/top_charger.png')" }}
        ></div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70"></div>

        {/* Loader */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chargers" element={<Chargers />} />
        <Route path="/register-seller" element={<RegisterSeller />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add-charger" element={<AddCharger />} />
        <Route path="/my-chargers" element={<MyChargers />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
