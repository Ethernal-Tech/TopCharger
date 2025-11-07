import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/UseAuth.js";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chargers from "./pages/Chargers.jsx";
import Profile from "./pages/Profile.jsx";
import MyChargers from "./pages/MyChargers.jsx";
import SelectRole from "./pages/SelectRole.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Sessions from "./pages/Sessions.jsx";
import Logout from "./pages/Logout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RequireRole from "./components/RequireRole.jsx";

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/top_charger.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/logout" element={<Logout />} />

          {/* Role-specific */}
          <Route element={<RequireRole role="HOST" />}>
            <Route path="/my-chargers" element={<MyChargers />} />
          </Route>
          <Route element={<RequireRole role="DRIVER" />}>
            <Route path="/chargers" element={<Chargers />} />
          </Route>
        </Route>

        {/* Optional 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </>
  );
}
