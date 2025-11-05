import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/UseAuth";
import ViewWalletButton from "@/components/ViewWalletButton";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const handleLogout = () => {
    navigate("/logout");
  };

  if (loading || !user) return null; // no flicker

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md shadow-md px-4 sm:px-8 py-3 flex items-center justify-between z-50 relative">
      {/* Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/logo-modified.png"
          alt="TopCharger Logo"
          className="h-12 w-12 object-contain"
        />
        <h1 className="text-2xl font-bold text-green-900">TopCharger</h1>
      </div>

      {/* Navigation links */}
      <div className="flex items-center gap-6 text-green-800 font-medium">
        {role === "HOST" && (
          <Link className="hover:text-green-600 transition" to="/my-chargers">
            My Chargers
          </Link>
        )}
        {role === "DRIVER" && (
          <Link className="hover:text-green-600 transition" to="/chargers">
            Find Chargers
          </Link>
        )}

        {(role === "HOST" || role === "DRIVER") && (
          <>
            <Link className="hover:text-green-600 transition" to="/sessions">
              Sessions
            </Link>
            <Link className="hover:text-green-600 transition" to="/profile">
              Profile
            </Link>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* View Wallet (Magic Embedded Wallet UI) */}
        <ViewWalletButton />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
