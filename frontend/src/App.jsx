import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PendingUsers from "./pages/admin/PendingUsers";
import AllUsers from "./pages/admin/AllUsers";
import ReportsLog from "./pages/admin/ReportsLog";
import Announcement from "./pages/admin/Announcement";

import ResponderDashboard from "./pages/responder/ResponderDashboard";
import ResidentDashboard from "./pages/resident/ResidentDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<PendingUsers />} />
        <Route path="pending-users" element={<PendingUsers />} />
        <Route path="all-users" element={<AllUsers />} />
        <Route path="reports-log" element={<ReportsLog />} />
        <Route path="announcement" element={<Announcement />} />
      </Route>

      {/* Responder */}
      <Route
        path="/responder"
        element={
          <ProtectedRoute allowedRole="responder">
            <ResponderDashboard />
          </ProtectedRoute>
        }
      />

      {/* Resident */}
      <Route
        path="/resident"
        element={
          <ProtectedRoute allowedRole="resident">
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
