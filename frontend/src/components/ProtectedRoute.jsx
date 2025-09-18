import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Usage:
 * <ProtectedRoute allow={['admin']}><AdminDashboard/></ProtectedRoute>
 * <ProtectedRoute allow={['customer']}><Profile/></ProtectedRoute>
 */
export default function ProtectedRoute({ allow = [], children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in → go to login, then return
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Logged in but wrong role → send to their home
  if (!allow.includes(user.role)) {
    const fallback = user.role === "admin" ? "/admin" : user.role === "customer" ? "/profile" : "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
