import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/UseAuth";

export default function ProtectedRoute() {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null; // AppRoutes shows a global loader
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}