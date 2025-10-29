import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const socket = io(SOCKET_URL, {
  withCredentials: true,
});

const soundMap = {
  Fire: "/sounds/fire.mp3",
  Medical: "/sounds/medical.mp3",
  Crime: "/sounds/crime.mp3",
  Flood: "/sounds/flood.mp3",
  Other: "/sounds/other.mp3",
};

const HIDDEN_KEY = "responder-hidden-report-ids";
const LATEST_KEY = "responder-latest-report-ids";

// 🔧 ADD THIS: Global flag to track if toast was shown for a report
const globalShownReports = new Set();

const useEmergencyReports = (enableToasts = false) => {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const latestIds = useRef(new Set());

  // 🔒 hidden IDs (per responder, persisted locally)
  const hiddenIdsRef = useRef(new Set());

  // load hidden + latest IDs on mount
  useEffect(() => {
    try {
      const savedHidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
      hiddenIdsRef.current = new Set(savedHidden);
    } catch { /* ignore */ }

    try {
      const savedLatest = JSON.parse(localStorage.getItem(LATEST_KEY) || "[]");
      latestIds.current = new Set(savedLatest);
    } catch { /* ignore */ }
  }, []);

  const persistLatest = () => {
    try {
      localStorage.setItem(LATEST_KEY, JSON.stringify([...latestIds.current]));
    } catch { /* ignore */ }
  };

  // 🔊 preload sounds
  const audioReady = useRef(false);
  const preloadedAudios = useRef({});
  useEffect(() => {
    const unlockAudio = () => {
      Object.entries(soundMap).forEach(([type, path]) => {
        const audio = new Audio(path);
        audio.load();
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
        preloadedAudios.current[type] = audio;
      });
      audioReady.current = true;
    };

    window.addEventListener("click", unlockAudio, { once: true });
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  const playSoundForType = (type) => {
    if (!audioReady.current) return;
    const audio = preloadedAudios.current[type] || preloadedAudios.current["Other"];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const persistHidden = () => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIdsRef.current]));
    } catch { /* ignore */ }
  };

  const hideLocally = (id) => {
    hiddenIdsRef.current.add(id);
    persistHidden();
    setReports((prev) => prev.filter((r) => r._id !== id));
  };

  const fetchReports = async () => {
    try {
      // ensure hidden list stays synced
      try {
        const saved = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
        for (const id of saved) hiddenIdsRef.current.add(id);
      } catch {}

      const res = await axios.get(`${API_URL}/reports`, {
        withCredentials: true,
      });

      const newReports = res.data
        .filter((r) => r.status !== "responded")
        .filter((r) => !hiddenIdsRef.current.has(r._id));

      if (enableToasts) {
        newReports.forEach((r) => {
          // 🔧 MODIFIED: Check global set to prevent duplicate toasts
          if (!latestIds.current.has(r._id) && !globalShownReports.has(r._id)) {
            toast.success(`📢 New ${r.type} report from ${r.firstName} ${r.lastName}`);
            playSoundForType(r.type);
            latestIds.current.add(r._id);
            globalShownReports.add(r._id); // 🔧 Add to global set
          }
        });
        persistLatest();
      }

      setReports(newReports);
    } catch (err) {
      console.error("❌ Failed to load reports:", err);
    }
  };

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

  useEffect(() => {
    fetchUser();
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔧 ADD THIS: Clean up global set when component unmounts (optional)
  useEffect(() => {
    return () => {
      // Optional: Clear old entries periodically or keep them for session
      // globalShownReports.clear();
    };
  }, []);

  const declineReport = async (id) => {
    try {
      await axios.delete(`${API_URL}/reports/${id}`, {
        withCredentials: true,
      });
      hideLocally(id);
      toast.success("🗑️ Report declined");
    } catch {
      toast.error("❌ Failed to decline report");
    }
  };

  const markAsResponded = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/respond`, {}, {
        withCredentials: true,
      });
      hideLocally(id);
      toast.success("✅ Marked as responded");
    } catch {
      toast.error("❌ Failed to mark as responded");
    }
  };

  const markAsOnTheWay = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/ontheway`, {}, {
        withCredentials: true,
      });
      toast.success("🚓 Status: On our way");
      fetchReports();
    } catch {
      toast.error("❌ Failed to update status");
    }
  };

  const markAsArrived = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/arrived`, {}, {
        withCredentials: true,
      });
      toast.success("🔵 Status: Arrived at the scene");
      fetchReports();
    } catch {
      toast.error("❌ Failed to update arrived status");
    }
  };

  return { reports, markAsOnTheWay, markAsResponded, declineReport, markAsArrived };
};

export default useEmergencyReports;