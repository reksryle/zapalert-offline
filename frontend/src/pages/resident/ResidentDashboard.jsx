// src/pages/resident/ResidentDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Bell, Menu, X, LogOut, Home } from "lucide-react";
import showAnnouncementToast from "../../utils/showAnnouncementToast";
import useNetworkStatus from "../../hooks/useNetworkStatus";


// ---------------- Map Helpers ----------------
const markerIcon = new L.Icon({
  iconUrl: "/icons/marker.png",
  iconSize: [40, 40],
  iconAnchor: [16, 32],
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 17);
  }, [lat, lng]);
  return null;
};

const RecenterControl = ({ lat, lng }) => {
  const map = useMap();
  
  const handleRecenter = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    map.setView([lat, lng], 17);
    map.flyTo([lat, lng], 18, {
      duration: 1
    });
  };

  return (
    <div className="leaflet-bottom" style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div className="leaflet-control" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={handleRecenter}
          type="button"
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20 whitespace-nowrap"
          title="Find your pinned location"
          style={{ 
            margin: '-5px',
            zIndex: 1000,
            fontSize: '9px',
            minWidth: '120px'
          }}
        >
          <span className="flex items-center justify-center gap-1">
            Find Pinned Location
          </span>
        </button>
      </div>
    </div>
  );
};

// ---------------- Ripple Button Component ----------------
const RippleButton = ({ children, onClick, disabled, className, ...props }) => {
  const [ripples, setRipples] = useState([]);

  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = { 
      x, 
      y, 
      size, 
      id: Date.now() + Math.random() 
    };
    
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    if (onClick && !disabled) {
      onClick(event);
    }
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
      disabled={disabled}
      {...props}
    >
      {children}
      <div className="absolute inset-0 pointer-events-none z-[9999]">
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 40%, transparent 80%)',
              boxShadow: '0 0 15px 5px rgba(255,255,255,0.6)',
              transform: 'scale(0)',
              animation: 'ripple-glow 600ms cubic-bezier(0, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes ripple-glow {
          to {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

// ---------------- Sidebar ----------------
const Sidebar = ({ sidebarOpen, setSidebarOpen, handleLogout, links, location }) => (
  <div
    className={`
      fixed top-0 left-0 h-full w-64 sm-w-72 
      bg-gradient-to-br from-white via-red-50 to-orange-50 
      text-gray-900 shadow-2xl z-[2000] 
      transform transition-all duration-500 ease-out 
      backdrop-blur-lg
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    `}
  >
    {/* Header Section - Logo and Close Button */}
    <div className="flex flex-col items-center justify-center p-6 border-b border-red-100 relative bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white">
      <img 
        src="/icons/zapalert-logo.png" 
        alt="ZapAlert Logo" 
        className="w-20 h-20 mb-2 drop-shadow-lg" 
      />
      <h1 className="text-3xl font-black tracking-wider">ZAPALERT</h1>
      <button 
        type="button" 
        onClick={() => setSidebarOpen(false)} 
        className="absolute top-6 right-6 hover:bg-white/20 p-1 rounded-full transition-all"
        aria-label="Close sidebar"
      >
        <X size={24} className="text-white" />
      </button>
    </div>

    {/* Navigation Links Section */}
    <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
      {links.map((link) => (
        <button
          key={link.path || link.name}
          onClick={() => {
            if (link.onClick) link.onClick();
            if (link.path) window.location.href = link.path;
            setSidebarOpen(false);
          }}
          className={`
            flex items-center w-full px-6 py-4 rounded-2xl font-semibold 
            transition-all duration-300 hover:scale-105 hover:shadow-lg
            ${location.pathname === link.path 
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg transform scale-105" 
              : "text-gray-700 hover:bg-gradient-to-r hover:from-red-100 hover:to-orange-100 hover:text-red-700"
            }
          `}
        >
          {link.icon && link.icon}
          <span className="ml-3">{link.name}</span>
        </button>
      ))}

      {/* Coming Soon Overlay Links */}
      <div className="space-y-3 mt-3">
        <button
          type="button"
          disabled
          className="relative flex items-center w-full px-6 py-4 rounded-2xl font-semibold text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          <img src="/icons/usericon.png" alt="Profile" className="w-5 h-5" />
          <span className="ml-3">Profile</span>
          <span className="absolute top-0 right-0 bg-yellow-300 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            Coming Soon
          </span>
        </button>

        <button
          type="button"
          disabled
          className="relative flex items-center w-full px-6 py-4 rounded-2xl font-semibold text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          <img src="/icons/settingsicon.png" alt="Settings" className="w-5 h-5" />
          <span className="ml-3">Settings</span>
          <span className="absolute top-0 right-0 bg-yellow-300 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            Coming Soon
          </span>
        </button>
      </div>
    </nav>

    {/* Footer Section - Logout Button */}
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

// ---------------- Emergency Form ----------------
const EmergencyForm = ({ location, setLocation, user, networkStatus, setZapStatus, setLoadingState, resetFirstResponder, setCurrentReportId }) => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  const offlineToastId = useRef(null);

  const sendReport = async (reportData, isDraft = false) => {
    try {
      const response = await axios.post("/reports", reportData);
      // Reset first responder tracking for new report
      resetFirstResponder();
      
      // Store the report ID for potential cancellation
      if (response.data.reportId) {
        setCurrentReportId(response.data.reportId);
      }
      
      toast.success(
        isDraft ? "📝 Draft report sent successfully!" : "🚨 Emergency report submitted!"
      );
      setType("");
      setDescription("");
      setPendingReport(null);
      localStorage.removeItem("resident-draft");
    } catch (err) {
      console.error("Report submission failed:", err);
      toast.error("❌ Failed to submit report.");
    } finally {
      setSubmitting(false);
      setZapStatus?.("normal"); // Reset ZAP button status
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.latitude || !location.longitude) {
      alert("Still fetching location. Please wait.");
      return;
    }

    const reportData = {
      type,
      description,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      contactNumber: user.contactNumber,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setSubmitting(true);
    
 
    setLoadingState("submitting");
    setLoadingState("waiting"); // waiting for responder assignment
    sendReport(reportData);
    

  };

  useEffect(() => {
    localStorage.setItem(
      "resident-draft",
      JSON.stringify({ type, description, pendingReport })
    );
  }, [type, description, pendingReport]);

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-3 mx-4 space-y-3 border border-red-100 backdrop-blur-lg mb-4">
      {/* Form Header */}
      <div className="text-center">
        <h2 className="text-lg font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          𝗘𝗺𝗲𝗿𝗴𝗲𝗻𝗰𝘆 𝗗𝗲𝘁𝗮𝗶𝗹𝘀
        </h2>
        <p className="text-gray-600 text-xs mt-1">
          Please provide details about your emergency
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-semibold mb-1 text-gray-700 text-sm">
            Type of Emergency:
          </label>
          <select
            className="w-full border-2 border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-800 font-medium text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">-- Select Emergency Type --</option>
            <option value="Flood">🌊 Flood</option>
            <option value="Fire">🔥 Fire</option>
            <option value="Crime">🚨 Crime</option>
            <option value="Medical">🏥 Medical</option>
            <option value="Other">⚠️ Other</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700 text-sm">
            Description:
          </label>
          <textarea
            className="w-full border-2 border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-800 resize-none text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of the situation..."
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700 text-sm">
            Your Location:
          </label>
          {!location.latitude || !location.longitude ? (
            <div className="h-40 w-full rounded-lg overflow-hidden border-2 border-red-200 shadow-sm flex items-center justify-center bg-white/80 backdrop-blur-sm relative">
              {/* Mini Map Loader */}
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center transition-opacity duration-500 animate-fadeIn">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-red-600 animate-spin"></div>
                  <img
                    src="/icons/zapalert-logo.png"
                    alt="ZapAlert Logo"
                    className="w-10 h-10 animate-bounce"
                  />
                </div>
                <span className="mt-2 text-gray-700 font-medium text-sm">Getting your location...</span>
              </div>
            </div>
          ) : (
          <div className="h-40 w-full rounded-lg overflow-hidden border-2 border-red-200 shadow-sm relative">
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={17}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              />
              <Marker
                position={[location.latitude, location.longitude]}
                icon={markerIcon}
                draggable={!submitting}
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setLocation({ latitude: lat, longitude: lng });
                  },
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[3, -33]}
                  opacity={1}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #e6bebecc, #f1a4a454)", // glassy white-red blend

                      
                      padding: "6px 10px",
                      fontSize: "11px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                      textAlign: "center",
                      lineHeight: 1.3,
                      color: "#b91c1c", // deep red text
                      backdropFilter: "blur(6px)", // glass effect
                    }}
                  >
                    <div style={{ fontWeight: "700", fontSize: "12px", color: "#7f1d1d" }}>
                      Your Location
                    </div>
                    <div style={{ fontSize: "10px", color: "#444" }}>
                      Drag to adjust
                    </div>
                  </div>
                </Tooltip>
              </Marker>
              <RecenterMap lat={location.latitude} lng={location.longitude} />
              <RecenterControl lat={location.latitude} lng={location.longitude} />
            </MapContainer>
          </div>
          )}
        </div>

      </form>
    </div>
  );
};

// ---------------- Main Dashboard ----------------
const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const locationRouter = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({
    firstName: "Unknown",
    lastName: "Resident",
    username: "unknown",
    age: "N/A",
    contactNumber: "N/A",
  });
  

  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("resident-notifications");
    return stored ? JSON.parse(stored) : [];
  });

  const [hasNewNotif, setHasNewNotif] = useState(() => {
    const stored = localStorage.getItem("resident-hasNew");
    return stored ? JSON.parse(stored) : notifications.length > 0;
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentReportId, setCurrentReportId] = useState(null);
  const [cancelledReports, setCancelledReports] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [reportToCancel, setReportToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [arrivedResponderName, setArrivedResponderName] = useState("");

  const networkStatus = useNetworkStatus();
  const wasOffline = useRef(false);
  const onlineTimeout = useRef(null);
  const [zapStatus, setZapStatus] = useState("normal"); 
  const [loadingState, setLoadingState] = useState(null); 

  const audioRef = useRef(null);
  const respondedAudioRef = useRef(null);
  const declinedAudioRef = useRef(null);
  const announcementAudioRef = useRef(null);
  const audioInitialized = useRef(false);
  const firstResponderHandled = useRef(false);

  // ---------------- Network Toast ----------------
  useEffect(() => {
    let id;
    if (networkStatus === "offline") {
      wasOffline.current = true;
      if (onlineTimeout.current) {
        clearTimeout(onlineTimeout.current);
        onlineTimeout.current = null;
      }
      id = toast.loading("No connection", { duration: Infinity });
    } else if (networkStatus === "online") {
      if (wasOffline.current) {
        onlineTimeout.current = setTimeout(() => {
          toast.dismiss();
      toast.success("Connected to network");
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

// ---------------- Session ----------------
useEffect(() => {
  axios
    .get("/auth/session", { withCredentials: true })
    .then((res) => {
      if (res.data.role !== "resident") {
        navigate("/");
      } else {
        setUser(res.data);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          // Check if this is a fresh login (no tutorial shown for this session)
          const hasSeenTutorial = localStorage.getItem("tutorialShownThisSession");
          if (!hasSeenTutorial) {
            setShowTutorial(true);
            localStorage.setItem("tutorialShownThisSession", "true");
          }
        }, 2000);
      }
    })
    .catch(() => navigate("/"));
}, [navigate]);

// ---------------- Geolocation with Barangay Zapatera Boundaries ----------------
useEffect(() => {
  // Barangay Zapatera center coordinates and radius
  const ZAPATERA_CENTER = {
    latitude: 10.306711119471714,
    longitude: 123.9011395473235
  };
  const ZAPATERA_RADIUS = 0.002; // Approximately 200-300 meter radius

  // Function to check if coordinates are within Zapatera
  const isWithinZapatera = (lat, lng) => {
    const latDiff = Math.abs(lat - ZAPATERA_CENTER.latitude);
    const lngDiff = Math.abs(lng - ZAPATERA_CENTER.longitude);
    return latDiff <= ZAPATERA_RADIUS && lngDiff <= ZAPATERA_RADIUS;
  };

  // Function to generate random location within Zapatera
  const getRandomZapateraLoc = () => {
    const randomLat = ZAPATERA_CENTER.latitude + (Math.random() - 0.5) * ZAPATERA_RADIUS * 1.5;
    const randomLng = ZAPATERA_CENTER.longitude + (Math.random() - 0.5) * ZAPATERA_RADIUS * 1.5;
    return {
      latitude: parseFloat(randomLat.toFixed(6)),
      longitude: parseFloat(randomLng.toFixed(6))
    };
  };

  if (!navigator.geolocation) {
    console.log("Geolocation is not supported.");
    // Set a random location within Zapatera for demo
    const demoLocation = getRandomZapateraLoc();
    setLocation(demoLocation);
    return;
  }

  // Try to get current position
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      
      // Check if user is within Zapatera boundaries
      if (isWithinZapatera(userLat, userLng)) {
        setLocation({ 
          latitude: userLat, 
          longitude: userLng 
        });
      } else {
        // User outside Zapatera - use random location within Zapatera for demo
        const demoLocation = getRandomZapateraLoc();
        setLocation(demoLocation);
      }
    },
    (err) => {
      console.error("Location error:", err);
      // Fallback to random location within Zapatera
      const demoLocation = getRandomZapateraLoc();
      setLocation(demoLocation);
    },
    { 
      enableHighAccuracy: false, // Faster for demo
      timeout: 5000,            // Shorter timeout
      maximumAge: 300000        // Accept cached location
    }
  );
}, []);

// ---------------- Audio ----------------
useEffect(() => {
  const initAudio = () => {
    if (!audioInitialized.current) {
      audioRef.current = new Audio("/sounds/ontheway.mp3");
      respondedAudioRef.current = new Audio("/sounds/responded.mp3");
      declinedAudioRef.current = new Audio("/sounds/declined.mp3");
      announcementAudioRef.current = new Audio("/sounds/announcement.mp3");
      // Add arrived sound
      const arrivedAudio = new Audio("/sounds/arrived.mp3");
      arrivedAudio.load();
      audioInitialized.current = true;
    }
  };
  window.addEventListener("click", initAudio, { once: true });
  return () => window.removeEventListener("click", initAudio);
}, []);

// ---------------- Socket ----------------
useEffect(() => {
  if (loading) return;
  const socket = io(import.meta.env.VITE_SOCKET_URL, {
    withCredentials: true,
    query: { username: user.username },
  });
  socket.emit("join-resident", user.username);

  socket.on("notify-resident", (data) => {
    // Check if this is the first response
    const isFirstResponse = !firstResponderHandled.current;
    
    if (isFirstResponse) {
      setLoadingState("onTheWay");
      firstResponderHandled.current = true; // Mark first responder as handled
    }
    
    const message = `🟡 Responder ${data.responderName} is on its way to your ${data.type} report!`;
    toast.success(message, { duration: 6000 });
    audioRef.current?.play().catch(() => {});
    setNotifications(prev => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
    setHasNewNotif(true);
  });

  socket.on("responded", (data) => {
  setLoadingState("responded");
    
    const message = `🟢 Responder ${data.responderName} responded to your ${data.type} report.`;
    toast.success(message, { duration: 6000 });
    respondedAudioRef.current?.play().catch(() => {});
    setNotifications(prev => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
    setHasNewNotif(true);
  });

  socket.on("declined", (data) => {
    const message = `🔴 Responder ${data.responderName} declined your ${data.type} report. Waiting for another response.`;
    toast.error(message, { duration: 6000 });
    declinedAudioRef.current?.play().catch(() => {});
    setNotifications(prev => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
    setHasNewNotif(true);
  });

  socket.on("arrived", (data) => {
    setLoadingState("arrived");
    // Extract first name from responderName
    const firstName = data.responderName.split(' ')[0];
    setArrivedResponderName(firstName);
    
    const message = `🔵 Responder ${data.responderName} has arrived at your location!`;
    toast.success(message, { duration: 6000 });
    
    // Play arrived sound
    const arrivedSound = new Audio("/sounds/arrived.mp3");
    arrivedSound.play().catch(() => {});
    
    setNotifications(prev => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
    setHasNewNotif(true);
  });

  socket.on("public-announcement", (data) => {
    showAnnouncementToast(data.message, () => {
      announcementAudioRef.current.pause();
      announcementAudioRef.current.currentTime = 0;
    });
    setNotifications((prev) => [
      { message: `𝗔𝗡𝗡𝗢𝗨𝗡𝗖𝗘𝗠𝗘𝗡𝗧: ${data.message}`, timestamp: new Date().toLocaleString() },
      ...prev,
    ]);
    setHasNewNotif(true);
  });

  return () => socket.disconnect();
}, [loading, user.username]);

// ---------------- Persist Notifications ----------------
useEffect(() => {
  localStorage.setItem("resident-notifications", JSON.stringify(notifications));
  localStorage.setItem("resident-hasNew", JSON.stringify(hasNewNotif));
}, [notifications, hasNewNotif]);


const handleCancelReport = async (reportId, reason = "") => {
  try {
    setLoadingState("cancelling");
    
    await axios.patch(`/reports/${reportId}/cancel`, { 
      reason: reason || selectedReason || "No reason provided" 
    }, { withCredentials: true });
    
    toast.success("Report cancelled successfully");
    setCancelledReports(prev => [...prev, reportId]);
    setCurrentReportId(null);
    setCancelReason("");
    setSelectedReason("");
    
    // Play cancellation sound
    const cancelSound = new Audio("/sounds/cancelreport.mp3");
    cancelSound.play().catch(() => {});
    
  } catch (err) {
    console.error("Failed to cancel report:", err);
    toast.error("Failed to cancel report");
  } finally {
    setLoadingState(null);
    setShowCancelReason(false);
  }
};

const handleFollowUp = async (reportId) => {
  try {
    await axios.patch(`/reports/${reportId}/followup`, {}, { withCredentials: true });
    toast.success("Follow-up request sent to responders");
  } catch (err) {
    console.error("Failed to send follow-up:", err);
    toast.error("Failed to send follow-up request");
  }
};

// ---------------- Logout ----------------
const handleLogout = async () => {
  try {
    await axios.post("/auth/logout", {}, { withCredentials: true });
  } catch {}
  localStorage.removeItem("resident-notifications");
  localStorage.removeItem("resident-hasNew");
  localStorage.removeItem("tutorialShownThisSession"); // Clear the session flag
  navigate("/");
};

// Function to reset first responder tracking
const resetFirstResponder = () => {
  firstResponderHandled.current = false;
};

const links = [{ name: "Dashboard", path: "/resident", icon: <Home size={20} /> }];

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
            
           /* Add these new animations to your existing style block */
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes popupOut {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0; }
          }
          
          @keyframes pulse-soft {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          .animate-pulse {
            animation: pulse-soft 2s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}

// ---------------- Main Dashboard Content ----------------
return (
  <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-orange-500 flex flex-col overflow-hidden">
    <Toaster 
      position="top-right" 
      toastOptions={{
        className: 'backdrop-blur-lg bg-white/90 border border-red-200',
      }}
    />

    {/* Hamburger Menu Button */}
    <button
      type="button"
      onClick={() => setSidebarOpen(true)}
      className="fixed top-4 left-4 z-[100] bg-white/20 backdrop-blur-lg text-white p-3 rounded-2xl shadow-2xl hover:scale-110 hover:bg-white/30 transition-all duration-300 border border-white/30"
      aria-label="Open navigation menu"
    >
      <Menu size={20} />
    </button>

    {/* Sidebar */}
    <Sidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      handleLogout={handleLogout}
      links={links}
      location={locationRouter}
    />

    {/* Main Content */}
    <div className="flex-1 flex flex-col h-screen">
      {/* Hero Section */}
      <div className="text-center py-4 px-4">
        <div className="rounded-3xl p-4 border border-white/0 flex flex-col items-center">
          <h2 className="text-lg font-bold text-white mb-2">
            𝗥𝗘𝗣𝗢𝗥𝗧 𝗔𝗡 𝗘𝗠𝗘𝗥𝗚𝗘𝗡𝗖𝗬
          </h2>
          <p className="text-white/90 mb-4 text-sm">
            Press the 𝗭𝗔𝗣 button if you need immediate help
          </p>

          {/* ZAP Button with Animated Background */}
          <div className="relative flex items-center justify-center">
            {/* Continuous Radar Waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="absolute w-40 h-40 rounded-full bg-white/70 animate-radar-ping [animation-delay:0s]" />
              <span className="absolute w-44 h-44 rounded-full bg-white/60 animate-radar-ping [animation-delay:0.8s]" />
              <span className="absolute w-48 h-48 rounded-full bg-white/50 animate-radar-ping [animation-delay:1.6s]" />
              <span className="absolute w-52 h-52 rounded-full bg-white/40 animate-radar-ping [animation-delay:2.4s]" />
              <span className="absolute w-56 h-56 rounded-full bg-white/30 animate-radar-ping [animation-delay:3.2s]" />
            </div>

            {/* Main ZAP Button */}
            <RippleButton
              className="relative w-60 h-60 sm:w-48 sm:h-48 rounded-full bg-white/100 text-red-600 text-4xl shadow-2xl flex items-center justify-center font-bold mx-auto hover:scale-105 active:scale-95 transition-all duration-300 z-10"
              onClick={() => {
                const form = document.querySelector("form");
                if (form) {
                  if (navigator.vibrate) navigator.vibrate(200);
                  form.requestSubmit();
                }
              }}
              disabled={!location.latitude || !location.longitude}
            >
              <span className="relative flex items-center justify-center w-full h-full">
                {/* ZAP text with lowered opacity when loading */}
                <span className={`absolute text-4xl font-bold transition-opacity duration-300 ${zapStatus === "loading" || !location.latitude || !location.longitude ? "opacity-40" : "opacity-100"}`}>
                  ZAP
                </span>

                {/* Modern dots loader */}
                {(zapStatus === "loading" || !location.latitude || !location.longitude) && (
                  <div className="absolute flex space-x-2 z-20">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="dot"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          background: "linear-gradient(45deg, #f87171, #f97316)", // gradient color
                        }}
                      />
                    ))}
                    <style>{`
                      .dot {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        display: inline-block;
                        animation: dotPulse 1s ease-in-out infinite;
                      }
                      @keyframes dotPulse {
                        0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                        40% { transform: scale(1); opacity: 1; }
                      }
                    `}</style>
                  </div>
                )}
              </span>
            </RippleButton>
          </div>
        </div>

        <style jsx>{`
          @keyframes radar-ping {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            60% {
              transform: scale(1.6);
              opacity: 0.4;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .animate-radar-ping {
            animation: radar-ping 5s linear infinite;
          }
        `}</style>
      </div>

      {/* Emergency Form Section */}
      <div className="flex-1 overflow-y-auto">
      <EmergencyForm 
        location={location} 
        setLocation={setLocation} 
        user={user} 
        networkStatus={networkStatus} 
        setZapStatus={setZapStatus}
        setLoadingState={setLoadingState}
        resetFirstResponder={resetFirstResponder}
        setCurrentReportId={setCurrentReportId}
      />
          </div>
        </div>

        {/* Notification Bell */}
        <div className="fixed top-4 right-4 z-[1500]">
          <div className="relative inline-block">
            <button
              type="button"
              className="relative bg-white/20 backdrop-blur-lg p-3 rounded-2xl shadow-2xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-110"
              onClick={() => {
                setShowDropdown((prev) => !prev);
                setHasNewNotif(false);
                localStorage.setItem("resident-hasNew", JSON.stringify(false));
              }}
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5 text-white" />
              {hasNewNotif && notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 border-2 border-white animate-pulse shadow-lg"></span>
              )}
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border border-red-200 rounded-2xl z-[200] overflow-hidden max-h-96">
                <div className="p-3 font-bold border-b border-red-100 text-gray-800 bg-gradient-to-r from-red-50 to-orange-50 text-sm">
                  🔔 Notifications 
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="p-4 text-gray-500 text-center text-sm">
                      <div className="text-2xl mb-1">📭</div>
                      No notifications yet
                    </li>
                  ) : (
                    notifications.map((notification, index) => (
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
                  onClick={() => {
                    setNotifications([]);
                    localStorage.removeItem("resident-notifications");
                    localStorage.removeItem("resident-hasNew");
                    setHasNewNotif(false);
                  }}
                  className="w-full text-center py-3 text-xs text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 rounded-b-2xl transition-all font-semibold"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </div>
        </div>

    {/* Loading/Status Overlay */}
    {loadingState && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[5000]">
        <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-3xl shadow-2xl p-8 max-w-sm text-center space-y-6 border-2 border-red-200 mx-4">

          {/* SUBMITTING */}
          {loadingState === "submitting" && (
            <>
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-pulse"></div>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">Sending Alert...</p>
                <p className="text-gray-600 text-sm mt-2">
                  Please wait while we process your emergency report
                </p>
              </div>
            </>
          )}

          {/* WAITING */}
          {loadingState === "waiting" && (
            <>
              <div className="text-6xl animate-bounce">⏳</div>
              <div>
                <p className="text-xl font-bold text-gray-800">Waiting for Responder</p>
                <p className="text-gray-600 text-sm mt-2">
                  We're connecting you with emergency services.
                </p>
              </div>
              <button
                onClick={() => {
                  setReportToCancel(currentReportId);
                  setShowCancelConfirm(true);
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-lg hover:scale-105"
              >
                Cancel Request
              </button>
            </>
          )}

          {/* ON THE WAY */}
          {loadingState === "onTheWay" && (
            <>
              <div className="text-6xl animate-bounce">🚑</div>
              <div>
                <p className="text-xl font-bold text-green-600">Help is on the way!</p>
                <p className="text-gray-600 text-sm mt-2">
                  Emergency responder is heading to your location.
                </p>
              </div>
              {/* ✅ CHANGED: Side-by-side buttons instead of stacked */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setReportToCancel(currentReportId);
                    setShowCancelConfirm(true);
                  }}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-lg hover:scale-105 text-sm"
                >
                  Cancel Request
                </button>
                <button
                  onClick={() => handleFollowUp(currentReportId)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg hover:scale-105 text-sm"
                >
                  Follow Up
                </button>
              </div>
            </>
          )}

          {/* ARRIVED */}
          {loadingState === "arrived" && (
            <>
              <div className="text-6xl animate-bounce">🙋🏾</div>
              <div>
                <p className="text-xl font-bold text-purple-600">
                  Responder {arrivedResponderName} Has Arrived!
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  The emergency responder has arrived at your location.
                </p>
              </div>
              <button
                onClick={() => setLoadingState(null)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg hover:scale-105"
              >
                Close
              </button>
            </>
          )}

          {/* RESPONDED */}
          {loadingState === "responded" && (
            <>
              <div className="text-6xl animate-bounce ">✅</div>
              <div>
                <p className="text-xl font-bold text-green-600">Emergency Responded!</p>
                <p className="text-gray-600 text-sm mt-2">
                  Responder has successfully responded to your emergency
                </p>
              </div>
              <button
                onClick={() => setLoadingState(null)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg hover:scale-105"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    )}
    
    {showTutorial && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl max-w-sm w-full p-6 space-y-5 text-gray-800 relative shadow-2xl transform scale-95 animate-popupIn border border-white/30">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-16 h-1 rounded-full bg-red-600 shadow-md"></div>
          <h3 className="text-2xl font-extrabold text-red-700 text-center">
            Enable Location
          </h3>
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            To use ZapAlert effectively, please turn on your device's location so responders can reach you quickly.
          </p>
          <img
            src="/tutorial/turnlocation.gif"
            alt="Enable Location"
            className="w-full rounded-xl shadow-lg border border-gray-200 animate-float"
          />
          <button
            onClick={() => {
              setShowTutorial(false);
              // Optional: Add a subtle scale down animation when closing
              const tutorialElement = document.querySelector('.animate-popupIn');
              if (tutorialElement) {
                tutorialElement.style.animation = 'popupOut 0.3s ease-in forwards';
                setTimeout(() => setShowTutorial(false), 300);
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition transform duration-300 animate-pulse"
          >
            Got it
          </button>
        </div>
      </div>
    )}

    {/* Cancel Confirmation Modal */}
    {showCancelConfirm && (
      <div
        className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setShowCancelConfirm(false)}
      >
        <div
          className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-xl w-80 max-w-full p-6 border-t-4 border-red-600"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-center text-xl font-bold mb-4 text-gray-800">Cancel Report?</h2>
          <p className="mb-6 text-center text-red-600 font-medium">
            Are you sure you want to cancel this emergency report?
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="px-5 py-2 rounded-xl text-white font-semibold transition-all bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md"
              onClick={() => {
                setShowCancelConfirm(false);
                setShowCancelReason(true);
              }}
            >
              Yes
            </button>
            <button
              className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all font-semibold"
              onClick={() => setShowCancelConfirm(false)}
            >
              No
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Cancel Reason Modal */}
    {showCancelReason && (
      <div
        className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setShowCancelReason(false);
          setCancelReason("");
          setSelectedReason("");
        }}
      >
        <div
          className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-xl w-80 max-w-full p-6 border-t-4 border-red-600"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-center text-xl font-bold mb-4 text-gray-800">Reason for Cancellation</h2>

          {/* Common Reasons */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 cursor-pointer">
              <input
                type="radio"
                name="cancelReason"
                value="False alarm"
                checked={selectedReason === "False alarm"}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="text-red-600"
              />
              <span>False alarm</span>
            </label>

            <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 cursor-pointer">
              <input
                type="radio"
                name="cancelReason"
                value="Situation resolved"
                checked={selectedReason === "Situation resolved"}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="text-red-600"
              />
              <span>Situation resolved</span>
            </label>

            <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 cursor-pointer">
              <input
                type="radio"
                name="cancelReason"
                value="Wrong location"
                checked={selectedReason === "Wrong location"}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="text-red-600"
              />
              <span>Wrong location</span>
            </label>

            <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 cursor-pointer">
              <input
                type="radio"
                name="cancelReason"
                value="Other"
                checked={selectedReason === "Other"}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="text-red-600"
              />
              <span>Other reason</span>
            </label>
          </div>

          {/* Other Reason Input */}
          {selectedReason === "Other" && (
            <div className="mb-4">
              <textarea
                placeholder="Please specify your reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border-2 border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white/80 resize-none text-sm"
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all font-semibold"
              onClick={() => {
                setShowCancelReason(false);
                setCancelReason("");
                setSelectedReason("");
              }}
            >
              Back
            </button>
            <button
              className="px-5 py-2 rounded-xl text-white font-semibold transition-all bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md disabled:opacity-50"
              onClick={() => {
                const finalReason = selectedReason === "Other" ? cancelReason : selectedReason;
                if (!finalReason) {
                  toast.error("Please provide a reason");
                  return;
                }
                handleCancelReport(reportToCancel, finalReason);
              }}
              disabled={!selectedReason || (selectedReason === "Other" && !cancelReason)}
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default ResidentDashboard;

