// hooks/useNetworkStatus.js 
import { useState, useEffect } from "react";

export default function useNetworkStatus() {
  const [status, setStatus] = useState("online"); // Always show online 

  useEffect(() => {
    // For demo purposes, we'll always be "online"
    // This prevents the "No connection" toast from appearing
    setStatus("online");
    
    // Optional: You can still listen for actual offline events but not show toasts
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("online"); // Still show as online for demo
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOnline); // Use same handler to always show online
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOnline);
    };
  }, []);

  return status; // Always returns "online" for your demo
}