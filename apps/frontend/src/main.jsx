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
import { WalletProvider } from "./context/WalletContext.jsx";

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
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  </StrictMode>
);
