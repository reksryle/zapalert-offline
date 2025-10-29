import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Circle, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import AutoOpenMarker from "../../components/AutoOpenMarker";
import { Bell, Menu, X, Home, LogOut, MapPin } from "lucide-react";
import useEmergencyReports from "../../hooks/useEmergencyReports";
import showAnnouncementToast from "../../utils/showAnnouncementToast";
import useNetworkStatus from "../../hooks/useNetworkStatus";

// ---------------- Map Helper ----------------
// Different icons for different emergency types
const iconMap = {
  Fire: new L.Icon({ iconUrl: "/icons/fire.png", iconSize: [32, 32] }),
  Flood: new L.Icon({ iconUrl: "/icons/flood.png", iconSize: [32, 32] }),
  Crime: new L.Icon({ iconUrl: "/icons/crime.png", iconSize: [32, 32] }),
  Medical: new L.Icon({ iconUrl: "/icons/medical.png", iconSize: [32, 32] }),
  Other: new L.Icon({ iconUrl: "/icons/other.png", iconSize: [32, 32] }),
};
const getIcon = (type) => iconMap[type] || iconMap["Other"];

// Component to force map to center on specific coordinates
const ForceCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (map && map.getCenter) {
        try {
          map.invalidateSize();
          map.setView(center, 16); // Center map and set zoom level
        } catch (err) {
          console.error("Map error:", err);
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
};

// Mini Map Component for Emergency Cards
// Shows a small map preview for each emergency report
const MiniMap = ({ center, report, onClick }) => {
  // Create smaller icons for the mini-map
  const miniIconMap = {
    Fire: new L.Icon({ iconUrl: "/icons/fire.png", iconSize: [24, 24] }),
    Flood: new L.Icon({ iconUrl: "/icons/flood.png", iconSize: [24, 24] }),
    Crime: new L.Icon({ iconUrl: "/icons/crime.png", iconSize: [24, 24] }),
    Medical: new L.Icon({ iconUrl: "/icons/medical.png", iconSize: [24, 24] }),
    Other: new L.Icon({ iconUrl: "/icons/other.png", iconSize: [24, 24] }),
  };
  const getMiniIcon = (type) => miniIconMap[type] || miniIconMap["Other"];

  // Use the actual report location coordinates
  const mapCenter = report.location?.coordinates || center;

  return (
    <div className="h-28 w-40 rounded-lg overflow-hidden cursor-pointer relative" onClick={onClick}>
      <MapContainer 
        center={mapCenter} 
        zoom={16} // Increased zoom for better accuracy
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={mapCenter} icon={getMiniIcon(report.type)}>
          <Popup>{report.type} Emergency</Popup>
        </Marker>
      </MapContainer>
      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
          Click to View
        </div>
      </div>
    </div>
  );
};

// ---------------- Sidebar Component ----------------
const Sidebar = ({ sidebarOpen, setSidebarOpen, handleLogout, links, location }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-[2000] transform transition-all duration-300 ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="flex flex-col items-center justify-center p-6 border-b border-red-100 relative bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white">
      <img src="/icons/zapalert-logo.png" alt="Logo" className="w-20 h-20 mb-2 drop-shadow-lg" />
      <h1 className="text-3xl font-black tracking-wider">ZAPALERT</h1>
      <button type="button" onClick={() => setSidebarOpen(false)} className="absolute top-6 right-6 hover:bg-white/20 p-1 rounded-full transition-all">
        <X size={24} className="text-white" />
      </button>
    </div>

    <nav className="flex-1 p-4 space-y-2">
      {links.map((link) => (
        <button
          key={link.path || link.name}
          onClick={() => {
            if (link.onClick) link.onClick();
            if (link.path) window.location.href = link.path;
            setSidebarOpen(false);
          }}
          className={`flex items-center w-full px-4 py-3 rounded-xl font-medium transition-all ${
            location.pathname === link.path 
              ? "bg-red-50 text-red-700 border border-red-200" 
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {link.icon && link.icon}
          <span className="ml-2">{link.name}</span>
        </button>
      ))}

      {/* Coming Soon Overlay Links */}
      <div className="space-y-2 mt-2">
        <button
          type="button"
          disabled
          className="relative flex items-center w-full px-4 py-3 rounded-xl font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          <img src="/icons/usericon.png" alt="Profile" className="w-5 h-5 mr-3" />
          <span className="ml-2">Profile</span>
          <span className="absolute top-0 right-0 bg-yellow-300 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            Coming Soon
          </span>
        </button>

        <button
          type="button"
          disabled
          className="relative flex items-center w-full px-4 py-3 rounded-xl font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          <img src="/icons/settingsicon.png" alt="Settings" className="w-5 h-5 mr-3" />
          <span className="ml-2">Settings</span>
          <span className="absolute top-0 right-0 bg-yellow-300 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            Coming Soon
          </span>
        </button>
      </div>
    </nav>

    <div className="p-4 border-t border-gray-100">
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center w-full px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all"
      >
        <LogOut size={18} className="mr-2" />
        Logout
      </button>
    </div>
  </div>
);

// ---------------- Emergency Card Component ----------------
// Displays individual emergency report with actions
const EmergencyCard = ({ 
  report, 
  onTheWay, 
  onResponded, 
  onDecline, 
  onArrived, 
  isOnTheWay, 
  isArrived, 
  onMapClick,
  onRemoveCancelled, // Add this prop for removing cancelled reports
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Format timestamp to Philippine time
  const formatPHTime = (isoString) =>
    new Date(isoString).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // Color coding for different emergency types
  const typeColors = {
    Fire: "bg-red-500 text-white",
    Medical: "bg-blue-500 text-white",
    Crime: "bg-orange-500 text-white",
    Flood: "bg-cyan-500 text-white",
    Other: "bg-gray-500 text-white",
  };

  const isPending = false; 
  const isCancelled = report.status === "cancelled"; // Check if report is cancelled
  
  // Handle map click for this specific report
  const handleMapClick = () => {
    onMapClick(report._id, report.location?.coordinates);
  };

  // Handle remove cancelled report
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemoveCancelled(report._id);
    }, 300);
  };

  // Special display for cancelled reports
  if (isCancelled) {
    return (
      <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
        isRemoving ? 'opacity-0 h-0 overflow-hidden' : ''
      }`}>
        {/* Enhanced Cancellation Overlay - More Stylish */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
          <div className="text-center bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-red-200 w-full max-w-md">
            <div className="text-5xl mb-4 text-red-500">❌</div>
            <h3 className="text-xl font-bold text-red-700 mb-3">REPORT CANCELLED</h3>
            
            {/* Enhanced cancellation details with better styling */}
            <div className="mb-4 p-4 bg-red-50/80 rounded-xl border border-red-100 text-left">
              <h4 className="font-semibold text-red-800 text-base mb-3 border-b border-red-200 pb-2">Cancellation Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-red-700">Report Type:</span>
                  <span className="text-red-900">{report.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-red-700">Resident:</span>
                  <span className="text-red-900">{report.firstName} {report.lastName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-red-700">Reason:</span>
                  <span className="text-red-900 mt-1">{report.cancellationReason || "Cancelled by resident"}</span>
                </div>
                {report.cancellationTime && (
                  <div className="flex justify-between">
                    <span className="font-medium text-red-700">Cancelled at:</span>
                    <span className="text-red-900">{formatPHTime(report.cancellationTime)}</span>
                  </div>
                )}
                {report.address && (
                  <div className="flex flex-col">
                    <span className="font-medium text-red-700">Location:</span>
                    <span className="text-red-900 mt-1">{report.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4 bg-gray-100 p-2 rounded-lg">
              Originally reported at: {formatPHTime(report.createdAt)}
            </div>
            
            {/* Remove button with better styling */}
            <button
              onClick={handleRemove}
              className="mt-2 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center mx-auto shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Report
            </button>
          </div>
        </div>
        
        {/* Original Card Content (dimmed) */}
        <div className="p-4 sm:p-6 opacity-60">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`px-3 py-1 rounded-full text-s sm:text-sm font-semibold ${typeColors[report.type] || typeColors.Other}`}>
                {report.type} Report
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 ml-2 whitespace-nowrap">
              {formatPHTime(report.createdAt)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Emergency Details</h3>
              <p className={`text-gray-800 mb-3 text-sm sm:text-base ${!report.description ? "opacity-60 italic" : ""}`}>
                {report.description || "No description provided"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
              <div className="flex flex-row gap-4 items-center">
                <div className="flex-1 space-y-3 text-sm text-gray-700">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">Name:</span>
                    <span>{report.firstName} {report.lastName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">Age:</span>
                    <span>{report.age ?? "N/A"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">Contact:</span>
                    <span>{report.contactNumber ?? "N/A"}</span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-600 font-medium mb-1 text-center">
                    Click to View Map
                  </div>
                  <div className="h-28 w-36 rounded-lg overflow-hidden cursor-pointer shadow-md border-2 border-white" onClick={handleMapClick}>
                    <MiniMap 
                      center={report.location?.coordinates || [10.306711119471714, 123.9011395473235]} 
                      report={report}
                      onClick={handleMapClick}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal emergency report display
  return (
    <div className={`relative bg-white rounded-2xl shadow-lg transition-all hover:shadow-xl ${
      isOnTheWay ? "bg-yellow-50 border-2 border-yellow-300" : ""
    } ${isPending ? "opacity-75" : ""}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-3 py-1 rounded-full text-s sm:text-sm font-semibold ${typeColors[report.type] || typeColors.Other}`}>
              {report.type} Report
            </div>
            {isPending && (
              <div className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-gray-400 text-white animate-pulse">
                PENDING
              </div>
            )}
            {isOnTheWay && (
              <div className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-yellow-400 text-yellow-900 animate-pulse">
                ON THE WAY
              </div>
            )}
            {isArrived && (
              <div className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-green-400 text-green-900">
                ARRIVED
              </div>
            )}
          </div>
          {/* Increased timestamp size */}
          <div className="text-sm text-gray-600 ml-2 whitespace-nowrap font-medium">
            {formatPHTime(report.createdAt)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Emergency Details</h3>
            <p className={`text-gray-800 mb-3 text-sm sm:text-base ${!report.description ? "opacity-60 italic" : ""}`}>
              {report.description || "No description provided"}
            </p>
          </div>

          {/* Combined Info Card with Mini-Map - ALWAYS side by side */}
          <div className="bg-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
            <div className="flex flex-row gap-4 items-center">
              {/* Resident Information - Left side */}
              <div className="flex-1 space-y-3 text-sm text-gray-700">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">Name:</span>
                  <span>{report.firstName} {report.lastName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">Age:</span>
                  <span>{report.age ?? "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">Contact:</span>
                  <span>{report.contactNumber ?? "N/A"}</span>
                </div>
              </div>
              
              {/* Mini-Map - Right side with shadow */}
              <div className="flex-shrink-0">
                {/* "Click to View" note above the mini-map */}
                <div className="text-xs text-gray-600 font-medium mb-1 text-center">
                  Click to View Map
                </div>
                <div className="h-28 w-36 rounded-lg overflow-hidden cursor-pointer shadow-md border-2 border-white" onClick={handleMapClick}>
                  <MiniMap 
                    center={report.location?.coordinates || [10.306711119471714, 123.9011395473235]} 
                    report={report}
                    onClick={handleMapClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Change based on report status */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Show ON THE WAY and DECLINE buttons initially */}
          {!isOnTheWay && !isArrived && (
            <>
              <button
                onClick={() => onTheWay(report._id, report)}
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-md ${
                  isPending
                    ? "bg-yellow-500 text-yellow-900 cursor-not-allowed opacity-75" 
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                disabled={isPending}
              >
                {isPending ? "PENDING..." : "ON THE WAY"}
              </button>
              <button
                onClick={() => onDecline(report._id, report)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md"
              >
                DECLINE
              </button>
            </>
          )}
          
          {/* Show ARRIVE, STILL ON THE WAY, and CANCEL buttons after ON THE WAY is clicked */}
          {isOnTheWay && !isArrived && !isPending && (
            <>
              <button
                onClick={() => onArrived(report._id, report)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-md"
              >
                ARRIVE
              </button>
              <button
                onClick={() => onTheWay(report._id, report)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-md"
              >
                STILL ON THE WAY
              </button>
              <button
                onClick={() => onDecline(report._id, report)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md"
              >
                CANCEL
              </button>
            </>
          )}
          
          {/* Show RESPONDED and CANCEL buttons after ARRIVED */}
          {isArrived && (
            <>
              <button
                onClick={() => onResponded(report._id, report)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-md"
              >
                RESPONDED
              </button>
              <button
                onClick={() => onDecline(report._id, report)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md"
              >
                CANCEL
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Emergency List Component ----------------
// Displays all active emergencies with filtering options
const EmergencyList = ({ onTheWayIds, setOnTheWayIds, arrivedIds, setArrivedIds, onActionClick, onMapClick }) => {
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(false);

  // State for showing/hiding cancelled reports
  const [showCancelled, setShowCancelled] = useState(false);
  
  // State for tracking removed cancelled reports - Load from localStorage
  const [removedCancelledReports, setRemovedCancelledReports] = useState(
    JSON.parse(localStorage.getItem("removedCancelledReports") || "[]")
  );


  // Filter reports based on showCancelled state and removed reports
  const filteredReports = showCancelled 
    ? reports.filter(report => !removedCancelledReports.includes(report._id))
    : reports.filter(report => report.status !== "cancelled" && !removedCancelledReports.includes(report._id));

  // Count active reports (excluding cancelled and removed ones)
  const activeReportsCount = reports.filter(r => 
    r.status !== "cancelled" && !removedCancelledReports.includes(r._id)
  ).length;
  
  // Count cancelled reports (excluding removed ones)
  const cancelledReportsCount = reports.filter(r => 
    r.status === "cancelled" && !removedCancelledReports.includes(r._id)
  ).length;

  // Count responding reports (excluding cancelled reports)
  const respondingCount = onTheWayIds.filter(id => {
    const report = reports.find(r => r._id === id);
    return report && report.status !== "cancelled" && !removedCancelledReports.includes(id);
  }).length;

  // Sync ARRIVED state with database
  useEffect(() => {
    const currentResponder = JSON.parse(localStorage.getItem("zapalert-user"));
    if (!currentResponder?._id) return;

    const alreadyArrived = reports
      .filter((r) =>
        r.responders?.some(
          (res) =>
            res.responderId?.toString() === currentResponder._id &&
            res.action === "arrived"
        )
      )
      .map((r) => r._id);

    setArrivedIds(alreadyArrived);
  }, [reports, setArrivedIds]);

  // Save removed cancelled reports to localStorage
  useEffect(() => {
    localStorage.setItem("removedCancelledReports", JSON.stringify(removedCancelledReports));
  }, [removedCancelledReports]);


  // ---------------- Modified Handlers ----------------
  const handleOnTheWay = (id, report) => {
    markAsOnTheWay(id, report);
    if (!onTheWayIds.includes(id)) {
      const updatedOnTheWayIds = [...onTheWayIds, id];
      setOnTheWayIds(updatedOnTheWayIds);
      localStorage.setItem("onTheWayIds", JSON.stringify(updatedOnTheWayIds)); // Save to localStorage
    }
  };

  const handleResponded = (id, report) => {
    markAsResponded(id);
  };

  const handleDecline = (id, report) => {
    declineReport(id);
    // Remove from onTheWayIds if it was there
    if (onTheWayIds.includes(id)) {
      const updatedOnTheWayIds = onTheWayIds.filter(reportId => reportId !== id);
      setOnTheWayIds(updatedOnTheWayIds);
      localStorage.setItem("onTheWayIds", JSON.stringify(updatedOnTheWayIds));
    }
  };

  const handleArrived = async (id, report) => {
    try {
      await axios.patch(`/reports/${id}/arrived`, {}, { withCredentials: true });
      if (!arrivedIds.includes(id)) setArrivedIds([...arrivedIds, id]);
    } catch (err) {
      console.error("Failed to mark as arrived:", err);
      toast.error("Failed to mark as arrived");
    }
  };

  // Remove individual cancelled report
  const removeCancelledReport = (id) => {
    const updatedRemovedReports = [...removedCancelledReports, id];
    setRemovedCancelledReports(updatedRemovedReports);
    localStorage.setItem("removedCancelledReports", JSON.stringify(updatedRemovedReports));
  };

  // Remove all cancelled reports
  const removeAllCancelledReports = () => {
    const allCancelledIds = reports
      .filter(r => r.status === "cancelled")
      .map(r => r._id);
    const updatedRemovedReports = [...removedCancelledReports, ...allCancelledIds];
    setRemovedCancelledReports(updatedRemovedReports);
    localStorage.setItem("removedCancelledReports", JSON.stringify(updatedRemovedReports));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 relative z-10 min-w-[300px]">
      <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white z-10 py-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Active Emergencies</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* RESPONDING indicator - blinks when there are responding reports */}
          <div className={`px-2 sm:px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full ${respondingCount > 0 ? 'animate-pulse' : ''}`}>
            <span className="text-[10px] mr-1">RESPONDING:</span>
            {respondingCount}
          </div>
          
          {/* ACTIVE indicator - changes opacity based on count lah */}
          <div className={`px-2 sm:px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full ${activeReportsCount === 0 ? 'opacity-40' : ''}`}>
            <span className="text-[10px] mr-1">ACTIVE:</span>
            {activeReportsCount}
          </div>
        </div>
      </div>
      
      <div className="max-h-[60vh] overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              No active emergencies
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              All clear for now
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredReports.map((report) => {
              const isOnTheWay = onTheWayIds.includes(report._id);
              const isArrived = arrivedIds.includes(report._id);
              
              return (
              <EmergencyCard
                key={report._id}
                report={report}
                onTheWay={handleOnTheWay}
                onResponded={handleResponded}
                onDecline={handleDecline}
                onArrived={handleArrived}
                isOnTheWay={isOnTheWay}
                isArrived={isArrived}
                onMapClick={onMapClick}
                onRemoveCancelled={removeCancelledReport}
              />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- Map View Component ----------------
// Shows emergency locations on an interactive map
const MapView = ({
  responderNotifications,
  setResponderNotifications,
  hasNewNotif,
  setHasNewNotif,
  onTheWayIds,
  setOnTheWayIds,
  arrivedIds,
  setArrivedIds,
  highlightedReport // Add this prop
}) => {
  const zapateraCenter = [10.306711119471714, 123.9011395473235]; // Center of Barangay Zapatera
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(true);
  const audioInitialized = useRef(false);
  const announcementAudioRef = useRef(null);
  const hasShownToast = useRef(false);
  const mapRef = useRef();

  // Preload sounds once
  useEffect(() => {
    const allowAudio = () => {
      if (!audioInitialized.current) {
        ["fire", "medical", "crime", "flood", "other"].forEach((type) => {
          const audio = new Audio(`/sounds/${type}.mp3`);
          audio.load();
          audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
        });
        announcementAudioRef.current = new Audio("/sounds/announcement.mp3");
        audioInitialized.current = true;
      }
    };
    window.addEventListener("click", allowAudio, { once: true }); // Initialize audio on first click
    return () => window.removeEventListener("click", allowAudio);
  }, []);

  // Don't show toast again when visiting MapView
  useEffect(() => {
    if (!hasShownToast.current) {
      hasShownToast.current = true;
    }
  }, []);

  // Format time function for emergencies
  const formatPHTime = (isoString) =>
    new Date(isoString).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // Get recent emergencies (non-cancelled, limit to 3)
  const recentEmergencies = reports
    .filter(report => report.status !== "cancelled")
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col relative z-10">
      {/* Map Section */}
      <div className="flex items-center justify-center p-4 sm:p-6 border-b border-gray-100">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Emergency Map</h3>
      </div>

      <div className="h-[300px] sm:h-[400px] relative">
        <MapContainer 
          center={zapateraCenter} 
          zoom={16} 
          scrollWheelZoom 
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <ForceCenter center={zapateraCenter} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Circle center={zapateraCenter} radius={300} pathOptions={{ color: "blue", fillColor: "lightblue", fillOpacity: 0.3 }} />
          {reports.map((report) => {
            if (report.status === "cancelled") return null; // Don't show cancelled reports on map

            return (
              <AutoOpenMarker
                key={report._id}
                report={report}
                icon={getIcon(report.type)}
                onTheWay={(id, r) => {
                  markAsOnTheWay(id, r);
                  if (!onTheWayIds.includes(id)) setOnTheWayIds([...onTheWayIds, id]);
                }}
                onResponded={markAsResponded}
                onDecline={declineReport}
                onTheWayIds={onTheWayIds}
                arrivedIds={arrivedIds}
                setOnTheWayIds={setOnTheWayIds}
                setArrivedIds={setArrivedIds}
                isHighlighted={report._id === highlightedReport} // This is the key change
              />
            );
          })}
        </MapContainer>

        {/* Compact Legend */}
        <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 bg-white rounded-xl p-2 sm:p-3 shadow-lg border border-gray-200">
          <div className="font-bold mb-2 text-gray-900 text-xs sm:text-sm">Legend</div>
          <div className="space-y-1 sm:space-y-2">
            {Object.entries(iconMap).map(([type, icon]) => (
              <div key={type} className="flex items-center gap-1 sm:gap-2">
                <img src={icon.options.iconUrl} alt={type} className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-xs sm:text-sm text-gray-700 font-medium">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Emergencies Section - CHANGED FROM "Recent Notifications" */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <h4 className="font-bold text-gray-900 text-sm sm:text-base">Recent Emergencies</h4>
        </div>
        <div className="max-h-60 overflow-y-auto px-6 pb-4 space-y-3">
          {recentEmergencies.length === 0 ? (
            <p className="text-gray-500 text-xs sm:text-sm">No active emergencies</p>
          ) : (
            recentEmergencies.map((report) => (
              <div key={report._id} className="bg-white p-3 rounded-xl shadow border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    report.type === 'Fire' ? 'bg-red-500 text-white' :
                    report.type === 'Medical' ? 'bg-blue-500 text-white' :
                    report.type === 'Crime' ? 'bg-orange-500 text-white' :
                    report.type === 'Flood' ? 'bg-cyan-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {report.type}
                  </div>
                  <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {formatPHTime(report.createdAt)}
                  </div>
                </div>
                <div className="text-gray-800 text-sm font-medium mb-1">
                  {report.firstName} {report.lastName}
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {report.description || "No description provided"}
                </p>
                {onTheWayIds.includes(report._id) && (
                  <div className="mt-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full animate-pulse inline-block">
                    RESPONDING
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Main Responder Dashboard Component ----------------
const ResponderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true); // Loading state
  const [username, setUsername] = useState(""); // Responder username
  const [fullName, setFullName] = useState(""); // Responder full name
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar visibility
  const [activeTab, setActiveTab] = useState("list"); // "list" or "map" - which view is active
  const networkStatus = useNetworkStatus(); // Network connectivity status
  const wasOffline = useRef(false); // Track if was previously offline
  const onlineTimeout = useRef(null); // Timeout for online status
  const [showTutorial, setShowTutorial] = useState(false); // Tutorial popup visibility
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false); // Notification dropdown visibility
  
  // Add state to track which report to highlight on map
  const [highlightedReport, setHighlightedReport] = useState(null);

  // Notifications state
  const [responderNotifications, setResponderNotifications] = useState(() => {
    const stored = localStorage.getItem("responder-notifications");
    return stored ? JSON.parse(stored) : []; // Load from localStorage
  });
  const [hasNewNotif, setHasNewNotif] = useState(() => {
    const stored = localStorage.getItem("responder-hasNewNotif");
    if (stored !== null) return JSON.parse(stored);
    return responderNotifications.length > 0; // Check if has new notifications
  });

  // Track if we've already shown toasts for notifications
  const shownNotificationIds = useRef(new Set());

  // ---------------- Network Status Monitoring ----------------
  useEffect(() => {
    let id;
    if (networkStatus === "offline") {
      wasOffline.current = true;
      if (onlineTimeout.current) {
        clearTimeout(onlineTimeout.current);
        onlineTimeout.current = null;
      }
      id = toast.loading("No connection", { duration: Infinity }); // Show offline toast
    } else if (networkStatus === "online") {
      if (wasOffline.current) {
        onlineTimeout.current = setTimeout(() => {
          toast.dismiss();
          toast.success("Connected to network"); // Show reconnection toast
          wasOffline.current = false;
          onlineTimeout.current = null;
        }, 2000);
      } else {
        toast.dismiss();
      }
    }
    return () => {
      if (id) toast.dismiss(id);
      if (onlineTimeout.current) clearTimeout(onlineTimeout.current);
    };
  }, [networkStatus]);

  // ---------------- Shared ON THE WAY / ARRIVED states ----------------
  const [onTheWayIds, setOnTheWayIds] = useState(() => {
    const stored = localStorage.getItem("onTheWayIds");
    return stored ? JSON.parse(stored) : []; // Load from localStorage
  });
  const [arrivedIds, setArrivedIds] = useState([]);

  // Save onTheWayIds to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("onTheWayIds", JSON.stringify(onTheWayIds));
  }, [onTheWayIds]);

  const links = [
    { name: "Dashboard", path: "/responder", icon: <Home size={18} /> }
  ];

  // ---------------- Logout Function ----------------
  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      console.warn("Logout failed or already logged out.");
    }
    
    // Clear the tutorial shown flag on logout
    localStorage.removeItem("responderTutorialShown");
    setShowTutorial(false);
    
    localStorage.removeItem("responder-notifications");
    localStorage.removeItem("responder-hasNewNotif");
    navigate("/");
  };

  // Updated handleMapClick to accept both reportId and coordinates
  const handleMapClick = (reportId, coordinates) => {
    setActiveTab("map");
    // Store the report ID to highlight it on the map
    setHighlightedReport(reportId);
  };

  // Clear all notifications
  const handleClearNotifications = () => {
    setResponderNotifications([]);
    localStorage.removeItem("responder-notifications");
    localStorage.removeItem("responder-hasNewNotif");
    setHasNewNotif(false);
    setShowNotificationDropdown(false);
  };

  // ---------------- User Session Check ----------------
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "responder") {
          navigate("/"); // Redirect if not responder
        } else {
          setUsername(res.data.username);
          setFullName(res.data.firstName + " " + res.data.lastName);

          setTimeout(() => {
            setLoading(false);

            // Show tutorial only once per login session (using localStorage)
            if (!localStorage.getItem("responderTutorialShown")) {
              setShowTutorial(true);
              localStorage.setItem("responderTutorialShown", "true");
            }
          }, 2000);
        }
      })
      .catch(() => navigate("/")); // Redirect on error
  }, [navigate]);

  // ---------------- Socket.IO Real-time Communication ----------------
  useEffect(() => {
    if (loading) return;

    const responderSocket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });
    
    // Send both username and fullName to the server
    responderSocket.emit("join-responder", {
      responderId: username,
      responderName: fullName
    });

    // Listen for public announcements
    responderSocket.on("public-announcement", (data) => {
      showAnnouncementToast(data.message);
      const newNotif = {
        message: `ANNOUNCEMENT: ${data.message}`,
        timestamp: new Date().toLocaleString(),
        id: `announcement-${Date.now()}`
      };
      setResponderNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    // Helper function to push notifications
    const pushNotif = (data, template, soundFile) => {
      const message = template
        .replace("[responder]", data.responderName)
        .replace("[type]", data.type)
        .replace("[resident]", data.residentName);
      
      const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotif = {
        message,
        timestamp: new Date().toLocaleString(),
        id: notificationId
      };
      
      new Audio(soundFile).play().catch(() => {});
      setResponderNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);

      // Only show toast if we haven't shown it before for this notification
      if (!shownNotificationIds.current.has(notificationId)) {
        shownNotificationIds.current.add(notificationId);
        toast(message);
      }
    };

    // Listen for various responder actions
    responderSocket.on("responder-declined", (data) =>
      pushNotif(data, "🔴 [responder] declined the [type] report of [resident]", "/sounds/responderdeclined.mp3")
    );
    responderSocket.on("notify-on-the-way", (data) =>
      pushNotif(data, "🟡 [responder] is on its way to the [type] report of [resident]", "/sounds/responderontheway.mp3")
    );
    responderSocket.on("notify-responded", (data) =>
      pushNotif(data, "🟢 [responder] has responded to the [type] report of [resident]", "/sounds/responderresponded.mp3")
    );
    responderSocket.on("notify-arrived", (data) =>
      pushNotif(data, "🔵 [responder] has arrived at the [type] report of [resident]", "/sounds/imhere.mp3")
    );

  // Listen for resident follow-up requests
  responderSocket.on("resident-followup", (data) => {
    const message = `Resident ${data.residentName} requested follow-up for ${data.type} report`;
    
    // Play follow-up sound based on emergency type
    const followupSound = new Audio(`/sounds/followup${data.type.toLowerCase()}.mp3`);
    followupSound.play().catch(() => {});
    
    // Show toast notification
    toast(message, { 
      duration: 6000,
      icon: "🔔",
      style: {
        background: '#dbeafe',
        border: '1px solid #93c5fd',
        color: '#1e40af'
      }
    });
    
    // Add to notifications list
    const newNotif = {
      message,
      timestamp: new Date().toLocaleString(),
      id: `followup-${Date.now()}`
    };
    
    setResponderNotifications((prev) => [newNotif, ...prev]);
    setHasNewNotif(true);
  });

  // Listen for report cancellations
  responderSocket.on("report-cancelled", (data) => {
    const message = `Report for ${data.type} has been cancelled by Resident ${data.residentName}`;
    
    // Show toast notification
    toast(message, { 
      duration: 6000,
      icon: "❌",
      style: {
        background: '#fee2e2',
        border: '1px solid #fecaca',
        color: '#b91c1c'
      }
    });
    
    // Play cancellation sound
    const cancelSound = new Audio("/sounds/cancel.mp3");
    cancelSound.play().catch(() => {});
    
    // Add to notifications list
    const newNotif = {
      message,
      timestamp: new Date().toLocaleString(),
      id: `cancelled-${Date.now()}`
    };
    
    setResponderNotifications((prev) => [newNotif, ...prev]);
    setHasNewNotif(true);
    
    // If this responder had this report in onTheWayIds and there's only one responder, remove it
    if (data.activeResponders <= 1) {
      setOnTheWayIds(prev => prev.filter(id => id !== data.reportId));
    }
  });

  return () => responderSocket.disconnect(); // Cleanup on unmount
  }, [loading, username, fullName]); // Add fullName to dependency array

  // ---------------- Persist notifications in localStorage ----------------
  useEffect(() => {
    localStorage.setItem("responder-notifications", JSON.stringify(responderNotifications));
    localStorage.setItem("responder-hasNewNotif", JSON.stringify(hasNewNotif));
  }, [responderNotifications, hasNewNotif]);

  // ---------------- Loading Screen ----------------
  if (loading) {
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
            @keyframes bounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-15px);} }
            .animate-bounce { animation: bounce 1s infinite; }

            @keyframes spin { 0%{transform:rotate(0deg);}100%{transform:rotate(360deg);} }
            .animate-spin { animation: spin 2s linear infinite; }

            @keyframes blink { 0%,50%,100%{opacity:1;}25%,75%{opacity:0;} }
            .animate-blink { animation: blink 1s infinite; }

            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fadeIn { animation: fadeIn 0.5s ease-in-out forwards; }

            @keyframes popupIn {
              0% { transform: scale(0.8); opacity: 0; }
              60% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-popupIn {
              animation: popupIn 0.4s ease-out forwards;
            }

            @keyframes popupOut {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.8); opacity: 0; }
            }

            .animate-popupOut {
              animation: popupOut 0.3s ease-in forwards;
            }
          `}
        </style>
      </div>
    );
  }

  // ---------------- Main Dashboard Content ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-orange-500 relative">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Glassmorphism Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="relative p-3 text-white/80 hover:text-white transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105"></div>
              <Menu size={20} className="relative z-10 transition-transform duration-300 sm:hidden" />
              <Menu size={24} className="relative z-10 transition-transform duration-300 hidden sm:block" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Responder Dashboard</h1>
              <p className="text-sm sm:text-base text-white/80">Welcome, {fullName}</p>
            </div>
          </div>

        {/* Notification Bell - Fixed positioning with higher z-index */}
        <div className="fixed top-4 right-4 z-50"> {/* Changed to z-50 */}
          <div className="relative inline-block">
            <button
              type="button"
              className="relative bg-white/20 backdrop-blur-lg p-3 rounded-2xl shadow-2xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-110"
              onClick={() => {
                setShowNotificationDropdown((prev) => !prev);
                setHasNewNotif(false);
                localStorage.setItem("responder-hasNewNotif", JSON.stringify(false));
              }}
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5 text-white" />
              {hasNewNotif && responderNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 border-2 border-white animate-pulse shadow-lg"></span>
              )}
            </button>
            
            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border border-red-200 rounded-2xl z-50 overflow-hidden max-h-96"> {/* Changed to z-50 */}
                <div className="p-3 font-bold border-b border-red-100 text-gray-800 bg-gradient-to-r from-red-50 to-orange-50 text-sm">
                  🔔 Notifications 
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {responderNotifications.length === 0 ? (
                    <li className="p-4 text-gray-500 text-center text-sm">
                      <div className="text-2xl mb-1">📭</div>
                      No notifications yet
                    </li>
                  ) : (
                    responderNotifications.map((notification, index) => (
                      <li 
                        key={index} 
                        className="p-3 border-b border-red-50 text-xs text-gray-800 hover:bg-red-25 transition-colors"
                      >
                        <div className="font-medium">{notification.message}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          🕐 {notification.timestamp}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                <button
                  onClick={handleClearNotifications}
                  className="w-full text-center py-3 text-xs text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 rounded-b-2xl transition-all font-semibold"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        links={links}
        location={location}
      />

      {/* Main Content */}
      <div className="p-4 sm:p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation - Mobile Only */}
          <div className="lg:hidden mb-4">
            <div className="flex bg-white/20 backdrop-blur-sm rounded-2xl p-1 border border-white/30">
              <button
                onClick={() => setActiveTab("list")}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === "list"
                    ? "bg-white text-gray-900 shadow-lg"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Emergency List
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === "map"
                    ? "bg-white text-gray-900 shadow-lg"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Map View
              </button>
            </div>
          </div>

          {/* Desktop Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6">
            <EmergencyList 
              onTheWayIds={onTheWayIds}
              setOnTheWayIds={setOnTheWayIds}
              arrivedIds={arrivedIds}
              setArrivedIds={setArrivedIds}
              onActionClick={() => {}}
              onMapClick={handleMapClick} // Pass the updated handler
            />
            <MapView
              responderNotifications={responderNotifications}
              setResponderNotifications={setResponderNotifications}
              hasNewNotif={hasNewNotif}
              setHasNewNotif={setHasNewNotif}
              onTheWayIds={onTheWayIds}
              setOnTheWayIds={setOnTheWayIds}
              arrivedIds={arrivedIds}
              setArrivedIds={setArrivedIds}
              highlightedReport={highlightedReport} // Pass the highlighted report
            />
          </div>

          {/* Mobile Single View */}
          <div className="lg:hidden">
            {activeTab === "list" ? (
            <EmergencyList 
              onTheWayIds={onTheWayIds}
              setOnTheWayIds={setOnTheWayIds}
              arrivedIds={arrivedIds}
              setArrivedIds={setArrivedIds}
              onActionClick={() => {}}
              onMapClick={handleMapClick} // Pass the updated handler
            />
            ) : (
              <MapView
                responderNotifications={responderNotifications}
                setResponderNotifications={setResponderNotifications}
                hasNewNotif={hasNewNotif}
                setHasNewNotif={setHasNewNotif}
                onTheWayIds={onTheWayIds}
                setOnTheWayIds={setOnTheWayIds}
                arrivedIds={arrivedIds}
                setArrivedIds={setArrivedIds}
                highlightedReport={highlightedReport} // Pass the highlighted report
              />
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Tutorial Popup ---------------- */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl max-w-sm w-full p-6 space-y-5 text-gray-800 relative shadow-2xl transform scale-95 animate-popupIn border border-white/30">
              
              {/* Accent bar */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-16 h-1 rounded-full bg-red-600 shadow-md"></div>

              {/* Title */}
              <h3 className="text-2xl font-extrabold text-red-700 text-center">
                Enable Location
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                To use ZapAlert effectively, please turn on your device's location so emergencies can be handled quickly.
              </p>

              {/* Image / GIF */}
              <img
                src="/tutorial/turnlocation.gif"
                alt="Enable Location"
                className="w-full rounded-xl shadow-lg border border-gray-200"
              />

              {/* Button */}
              <button
                onClick={() => {
                  setShowTutorial(false);
                  // Add a smooth exit animation
                  const tutorialElement = document.querySelector('.animate-popupIn');
                  if (tutorialElement) {
                    tutorialElement.style.animation = 'popupOut 0.3s ease-in forwards';
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition transform duration-300"
              >
                Got it
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default ResponderDashboard;