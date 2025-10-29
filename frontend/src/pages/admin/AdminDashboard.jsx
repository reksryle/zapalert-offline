// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import {
  Menu,
  X,
  UserCheck,
  Users,
  FileText,
  Megaphone,
  LogOut,
} from "lucide-react";

// ---------------- Sidebar ----------------
const Sidebar = ({ sidebarOpen, setSidebarOpen, handleLogout, links, location }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-white via-red-50 to-orange-50 text-gray-900 shadow-2xl z-[2000] transform transition-all duration-500 ease-out backdrop-blur-lg ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    {/* Logo Section */}
    <div className="flex flex-col items-center justify-center p-6 border-b border-red-100 relative bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white">
      <img
        src="/icons/zapalert-logo.png"
        alt="Logo"
        className="w-20 h-20 mb-2 drop-shadow-lg"
      />
      <h1 className="text-3xl font-black tracking-wider">ZAPALERT</h1>
      <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        className="absolute top-6 right-6 hover:bg-white/20 p-1 rounded-full transition-all"
      >
        <X size={24} className="text-white" />
      </button>
    </div>

    {/* Navigation Links */}
    <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
      {links.map((link) => (
        <button
          key={link.path || link.name}
          onClick={() => {
            if (link.path) window.location.href = link.path;
            setSidebarOpen(false);
          }}
          className={`flex items-center w-full px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            location.pathname === link.path
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg transform scale-105"
              : "text-gray-700 hover:bg-gradient-to-r hover:from-red-100 hover:to-orange-100 hover:text-red-700"
          }`}
        >
          {link.icon}
          <span className="ml-3">{link.name}</span>
        </button>
      ))}
    </nav>

    {/* Logout */}
    <div className="p-6 border-t border-red-100">
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center w-full px-6 py-4 rounded-2xl font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-red-100 hover:to-orange-100 hover:text-red-700 transition-all duration-300 hover:scale-105"
      >
        <LogOut size={20} className="mr-3" />
        Logout
      </button>
    </div>
  </div>
);

// ---------------- Main Admin Dashboard ----------------
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔑 Links for admin
  const links = [
    { name: "Pending Users", path: "/admin/pending-users", icon: <UserCheck size={20} /> },
    { name: "All Users", path: "/admin/all-users", icon: <Users size={20} /> },
    { name: "Reports Log", path: "/admin/reports-log", icon: <FileText size={20} /> },
    { name: "Announce", path: "/admin/announcement", icon: <Megaphone size={20} /> },
  ];

  // ✅ Loading screen timer
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/auth/check-session", { withCredentials: true });
        if (res.data.role !== "admin") navigate("/");
      } catch (err) {
        console.error("Admin session check failed:", err);
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);

  // ✅ Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-yellow-400 animate-spin"></div>
          <img
            src="/icons/zapalert-logo.png"
            alt="ZapAlert Logo"
            className="w-32 h-32 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-bounce"
          />
        </div>
        <p className="text-white text-2xl font-bold animate-blink">Loading...</p>

        <style>
          {`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            .animate-bounce {
              animation: bounce 1s infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .animate-spin {
              animation: spin 2s linear infinite;
            }
            @keyframes blink {
              0%, 50%, 100% { opacity: 1; }
              25%, 75% { opacity: 0; }
            }
            .animate-blink {
              animation: blink 1s infinite;
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-orange-500 flex">
      {/* Burger Button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-[100] bg-white/20 backdrop-blur-lg text-white p-3 rounded-2xl shadow-2xl hover:scale-110 hover:bg-white/30 transition-all duration-300 border border-white/30"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={async () => {
          try {
            await axios.post("/auth/logout", {}, { withCredentials: true });
          } catch {
            console.warn("Logout failed or already logged out.");
          }
          localStorage.removeItem("zapalertRole");
          localStorage.removeItem("user");
          navigate("/");
        }}
        links={links}
        location={location}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-wide drop-shadow-lg">
            Admin Dashboard
          </h1>
          <p className="text-white/90 text-lg">Manage users, reports, and announcements</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
