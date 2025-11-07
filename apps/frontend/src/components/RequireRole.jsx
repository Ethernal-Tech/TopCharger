import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/UseAuth";

export default function RequireRole({ role }) {
  const { role: myRole } = useAuth();
  if (myRole !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}