import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../api/axios";

// Component that protects routes - only allows access to users with specific roles
const ProtectedRoute = ({ children, allowedRole }) => {
  const [role, setRole] = useState(null);    // Store user's role
  const [loading, setLoading] = useState(true); // Track loading state

  // Check user session on component mount
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true }) // Get current user info
      .then((res) => {
        setRole(res.data.role); // Store user role
      })
      .catch(() => {
        setRole(null); // No valid session
      })
      .finally(() => {
        setLoading(false); // Loading complete
      });
  }, []);

  // Show loading while checking session
  if (loading) return <div>Loading...</div>;

  // Redirect to home if user doesn't have the required role
  if (role !== allowedRole) {
    return <Navigate to="/" replace />; // Redirect to home page
  }

  // Render the protected content if user has correct role
  return children;
};

export default ProtectedRoute;