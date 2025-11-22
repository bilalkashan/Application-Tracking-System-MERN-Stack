import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("loggedInUser");
  const publicRoutes = ["/home", "/login", "/signup", "/forgetpassword"];

  useEffect(() => {
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [userData]);

  if (isLoading) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  // ✅ If user is logged in and accessing public route, redirect to dashboard
  if (token && user && publicRoutes.includes(location.pathname)) {
    if (user.role === "admin") return <Navigate to="/adminDashboard" replace />;
    if (user.role === "user") return <Navigate to="/userDashboard" replace />;
    if (user.role === "recruiter") return <Navigate to="/recruiterDashboard" replace />;
    if (user.role === "hod") return <Navigate to="/hodDashboard" replace />;
    if (user.role === "coo") return <Navigate to="/cooDashboard" replace />;
    if (user.role === "hr") return <Navigate to="/superAdminDashboard" replace />;
    if (user.role === "interviewer") return <Navigate to="/interviewerDashboard" replace />;
    if (user.role === "sub_recruiter") return <Navigate to="/subRecruiterDashboard" replace />;
  }

  // ❌ If user is NOT logged in and trying to access protected route
  if (!token || !user) {
    if (!publicRoutes.includes(location.pathname)) {
      return <Navigate to="/login" replace />;
    } else {
      return element;
    }
  }

  // ❗ Role-based route protection
  if (allowedRole) {
    // allow passing either a single role string or an array of roles
    const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowed.includes(user.role)) {
      return (
        <h2 style={{ textAlign: "center", color: "red" }}>
          403 - Forbidden: You are not authorized
        </h2>
      );
    }
  }

  return element;
};

export default ProtectedRoute;
