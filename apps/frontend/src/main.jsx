import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // <-- add this
import './index.css';
import Dashboard from "./pages/Dashboard.jsx";
import Chargers from "./pages/Chargers.jsx";
import RegisterSeller from './pages/RegisterSeller.jsx';
import Profile from "./pages/Profile.jsx";
import AddCharger from './pages/AddCharger.jsx';
import MyChargers from './pages/MyChargers.jsx';
import Navbar from './components/Navbar.jsx';
import WalletProvider from "./context/WalletProvider.jsx";
import AuthCallback from "./pages/AuthCallback";
import CreateProfile from "./pages/CreateProfile.jsx";
import SelectRole from "./pages/SelectRole.jsx";
import DriverSessions from "./pages/DriverSessions.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WalletProvider>
      <BrowserRouter>
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
          <Route path="/driver-sessions" element={<DriverSessions />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  </StrictMode>
);
