// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
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


// Wrapper to delay rendering until auth is confirmed
function AppRoutes() {
  const { loading } = useAuth();


  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-charger.png')" }} // your default background
      >
        <div className="flex flex-col items-center gap-4">
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
