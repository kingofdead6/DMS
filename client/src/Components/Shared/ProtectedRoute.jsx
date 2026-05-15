import { Navigate, Outlet } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

export function ProtectedRoute() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.usertype === "admin" || decoded.usertype === "superadmin") {
      console.log("Access granted to admin route");
      return <Outlet />;
    }
    return <Navigate to="/login" />;
  } catch (error) {
    return <Navigate to="/login" />;
  }
}

export function SuperadminRoute() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.usertype === "superadmin") return <Outlet />;
    // Admins get redirected to dashboard, not login
    return <Navigate to="/admin/dashboard" />;
  } catch {
    return <Navigate to="/login" />;
  }
}