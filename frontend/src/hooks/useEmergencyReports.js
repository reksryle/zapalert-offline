import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// API and Socket URLs from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

// Connect to Socket.IO server for real-time updates
const socket = io(SOCKET_URL, {
  withCredentials: true, // Send cookies for authentication
});

// Map emergency types to sound files
const soundMap = {
  Fire: "/sounds/fire.mp3",
  Medical: "/sounds/medical.mp3",
  Crime: "/sounds/crime.mp3",
  Flood: "/sounds/flood.mp3",
  Other: "/sounds/other.mp3",
};

// Local storage keys for persistence
const HIDDEN_KEY = "responder-hidden-report-ids"; // Reports user has hidden
const LATEST_KEY = "responder-latest-report-ids"; // Latest reports seen

// Global set to track which reports have shown toasts (prevents duplicates)
const globalShownReports = new Set();

// Custom hook for managing emergency reports
const useEmergencyReports = (enableToasts = false) => {
  const [reports, setReports] = useState([]); // All emergency reports
  const [user, setUser] = useState(null);     // Current user data
  const latestIds = useRef(new Set());        // Track latest report IDs

  // Hidden report IDs (persisted in localStorage)
  const hiddenIdsRef = useRef(new Set());

  // Load hidden and latest IDs from localStorage when component mounts
  useEffect(() => {
    try {
      const savedHidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
      hiddenIdsRef.current = new Set(savedHidden);
    } catch { /* ignore errors */ }

    try {
      const savedLatest = JSON.parse(localStorage.getItem(LATEST_KEY) || "[]");
      latestIds.current = new Set(savedLatest);
    } catch { /* ignore errors */ }
  }, []);

  // Save latest IDs to localStorage
  const persistLatest = () => {
    try {
      localStorage.setItem(LATEST_KEY, JSON.stringify([...latestIds.current]));
    } catch { /* ignore errors */ }
  };

  // Preload sound files for emergency alerts
  const audioReady = useRef(false);
  const preloadedAudios = useRef({});
  useEffect(() => {
    const unlockAudio = () => {
      // Preload all emergency sounds
      Object.entries(soundMap).forEach(([type, path]) => {
        const audio = new Audio(path);
        audio.load();
        // Try to play and immediately pause to unlock audio
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
        preloadedAudios.current[type] = audio; // Store for later use
      });
      audioReady.current = true; // Mark audio as ready
    };

    // Unlock audio on first user interaction (browser requirement)
    window.addEventListener("click", unlockAudio, { once: true });
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // Play sound for specific emergency type
  const playSoundForType = (type) => {
    if (!audioReady.current) return; // Audio not ready yet
    const audio = preloadedAudios.current[type] || preloadedAudios.current["Other"];
    if (audio) {
      audio.currentTime = 0; // Reset to start
      audio.play().catch(() => {}); // Play sound
    }
  };

  // Save hidden IDs to localStorage
  const persistHidden = () => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIdsRef.current]));
    } catch { /* ignore errors */ }
  };

  // Hide a report locally (don't show it anymore)
  const hideLocally = (id) => {
    hiddenIdsRef.current.add(id); // Add to hidden set
    persistHidden(); // Save to localStorage
    setReports((prev) => prev.filter((r) => r._id !== id)); // Remove from state
  };

  // Fetch all emergency reports from API
  const fetchReports = async () => {
    try {
      // Ensure hidden list stays synced
      try {
        const saved = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
        for (const id of saved) hiddenIdsRef.current.add(id);
      } catch {}

      // Get reports from API
      const res = await axios.get(`${API_URL}/reports`, {
        withCredentials: true,
      });

      // Filter out responded reports and hidden reports
      const newReports = res.data
        .filter((r) => r.status !== "responded")
        .filter((r) => !hiddenIdsRef.current.has(r._id));

      // Show toasts for new reports (if enabled)
      if (enableToasts) {
        newReports.forEach((r) => {
          // Check if this is a new report we haven't shown yet
          if (!latestIds.current.has(r._id) && !globalShownReports.has(r._id)) {
            toast.success(`📢 New ${r.type} report from ${r.firstName} ${r.lastName}`);
            playSoundForType(r.type); // Play corresponding sound
            latestIds.current.add(r._id); // Mark as seen
            globalShownReports.add(r._id); // Add to global set
          }
        });
        persistLatest(); // Save to localStorage
      }

      setReports(newReports); // Update state with filtered reports
    } catch (err) {
      console.error("❌ Failed to load reports:", err);
    }
  };

  // Fetch current user data
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/session`, {
        withCredentials: true,
      });
      setUser(res.data.user);
    } catch (err) {
      console.error("⚠️ Could not fetch logged-in user:", err);
    }
  };

  // Set up periodic report fetching and initial data load
  useEffect(() => {
    fetchUser(); // Get user data
    fetchReports(); // Get initial reports
    const interval = setInterval(fetchReports, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Clean up global set when component unmounts (optional)
  useEffect(() => {
    return () => {
      // Optional: Clear old entries periodically or keep them for session
      // globalShownReports.clear();
    };
  }, []);

  // Decline an emergency report
  const declineReport = async (id) => {
    try {
      await axios.delete(`${API_URL}/reports/${id}`, {
        withCredentials: true,
      });
      hideLocally(id); // Remove from local display
      toast.success("🗑️ Report declined");
    } catch {
      toast.error("❌ Failed to decline report");
    }
  };

  // Mark report as responded
  const markAsResponded = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/respond`, {}, {
        withCredentials: true,
      });
      hideLocally(id); // Remove from local display
      toast.success("✅ Marked as responded");
    } catch {
      toast.error("❌ Failed to mark as responded");
    }
  };

  // Mark report as "on the way"
  const markAsOnTheWay = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/ontheway`, {}, {
        withCredentials: true,
      });
      toast.success("🚓 Status: On our way");
      fetchReports(); // Refresh reports
    } catch {
      toast.error("❌ Failed to update status");
    }
  };

  // Mark report as arrived at location
  const markAsArrived = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/arrived`, {}, {
        withCredentials: true,
      });
      toast.success("🔵 Status: Arrived at the scene");
      fetchReports(); // Refresh reports
    } catch {
      toast.error("❌ Failed to update arrived status");
    }
  };

  // Return all functions and data for components to use
  return { reports, markAsOnTheWay, markAsResponded, declineReport, markAsArrived };
};

export default useEmergencyReports;