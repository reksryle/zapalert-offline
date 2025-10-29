import React from "react";
import { Routes, Route } from "react-router-dom";

// Import all page components
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
      {/* Public Routes - Anyone can access */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin Routes - Only admins can access */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        {/* Nested routes for admin sections */}
        <Route index element={<PendingUsers />} />           {/* Default admin page */}
        <Route path="pending-users" element={<PendingUsers />} />  {/* User approvals */}
        <Route path="all-users" element={<AllUsers />} />          {/* User management */}
        <Route path="reports-log" element={<ReportsLog />} />      {/* Emergency reports */}
        <Route path="announcement" element={<Announcement />} />   {/* Public announcements */}
      </Route>

      {/* Responder Route - Only responders can access */}
      <Route 
        path="/responder" 
        element={
          <ProtectedRoute allowedRole="responder">
            <ResponderDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Resident Route - Only residents can access */}
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