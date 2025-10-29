import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "../api/axios";

const AutoOpenMarker = ({
  report,           // Emergency report data
  icon,             // Default marker icon
  onTheWay,         // Function to mark as on the way
  onResponded,      // Function to mark as responded
  onDecline,        // Function to decline report
  onTheWayIds,      // Array of reports marked "on the way"
  arrivedIds,       // Array of reports marked "arrived"
  setOnTheWayIds,   // Set state for onTheWayIds
  setArrivedIds,    // Set state for arrivedIds
  isHighlighted     // Whether this marker should be highlighted
}) => {
  const markerRef = useRef(null);       // Reference to the Leaflet marker
  const popupRef = useRef(null);        // Reference to the popup
  const hasOpenedRef = useRef(false);   // Track if popup has opened
  const [popupOpen, setPopupOpen] = useState(false); // Track popup open state

  // Get position from report data (handles different data formats)
  const position = report.location?.coordinates 
    ? [report.location.coordinates[0], report.location.coordinates[1]]
    : [report.latitude, report.longitude];

  // Check if this report is in various states
  const isOnTheWay = onTheWayIds.includes(report._id);
  const isArrived = arrivedIds.includes(report._id);

  // Auto-open popup when marker becomes highlighted
  useEffect(() => {
    if (isHighlighted && markerRef.current && !hasOpenedRef.current) {
      const timer = setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup(); // Open the popup
          hasOpenedRef.current = true;   // Mark as opened
          setPopupOpen(true);            // Update state
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  // Close other popups and open this one when highlighted
  useEffect(() => {
    if (isHighlighted && markerRef.current) {
      // Close all other popups on the map
      const map = markerRef.current._map;
      if (map) {
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker && layer !== markerRef.current && layer._popup) {
            layer.closePopup();
          }
        });
      }
      
      // Then open this popup
      const timer = setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
          setPopupOpen(true);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  // Handle "On The Way" button click
  const handleOnTheWay = () => {
    onTheWay(report._id, report); // Call parent function
    if (!isOnTheWay) setOnTheWayIds((prev) => [...prev, report._id]); // Add to on the way list
    // Reopen popup after action
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 0);
  };

  // Handle "Arrived" button click
  const handleArrived = async () => {
    try {
      await axios.patch(`/reports/${report._id}/arrived`, {}, { withCredentials: true });
      if (!isArrived) setArrivedIds((prev) => [...prev, report._id]); // Add to arrived list
    } catch (err) {
      console.error("Arrived notify failed", err);
    }
    // Reopen popup after action
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 0);
  };

  // Handle "Responded" button click
  const handleResponded = () => onResponded(report._id);

  // Handle "Decline" button click
  const handleDecline = () => onDecline(report._id);

  // Handle popup opening
  const handlePopupOpen = () => {
    setPopupOpen(true);
  };

  // Handle popup closing
  const handlePopupClose = () => {
    setPopupOpen(false);
    hasOpenedRef.current = false; // Reset for next time
  };

  // Determine which icon to show based on status and highlight state
  const getCurrentIcon = () => {
    // If popup is closed, use normal status icons
    if (!popupOpen) {
      return isArrived
        ? new L.Icon({ iconUrl: "/icons/arrived.png", iconSize: [35, 35] })
        : isOnTheWay
          ? new L.Icon({ iconUrl: "/icons/otw.png", iconSize: [35, 35] })
          : icon; // Default icon
    }
    
    // If popup is open and highlighted, show special selected icon
    if (isHighlighted && popupOpen) {
      return new L.Icon({ 
        iconUrl: "/icons/selected.png",
        iconSize: [40, 40],
        className: "highlighted-marker"
      });
    }
    
    // Otherwise use normal status-based icons
    return isArrived
      ? new L.Icon({ iconUrl: "/icons/arrived.png", iconSize: [35, 35] })
      : isOnTheWay
        ? new L.Icon({ iconUrl: "/icons/otw.png", iconSize: [35, 35] })
        : icon;
  };

  // Format timestamp to Philippine time
  const formatPHTime = (isoString) =>
    new Date(isoString).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  return (
    <Marker 
      position={position} 
      icon={getCurrentIcon()} 
      ref={markerRef}
      eventHandlers={{
        popupopen: handlePopupOpen,  // When popup opens
        popupclose: handlePopupClose // When popup closes
      }}
    >
      <Popup 
        className="rounded-lg shadow-lg bg-white"
        ref={popupRef}
      >
        <div className="text-sm">
          {/* Show highlight banner only when popup is open and marker is highlighted */}
          {isHighlighted && popupOpen && (
            <div className="text-yellow-700 font-bold mb-2 text-center bg-yellow-200 py-1 rounded-t-lg mx-4 -mx-5 -mt-3">
              ⭐ SELECTED EMERGENCY ⭐
            </div>
          )}
          
          {/* Report header */}
          <div className="flex items-center justify-between">
            <strong className={isHighlighted && popupOpen ? "text-yellow-800" : ""}>
              {report.type} Report
            </strong>
          </div>

          {/* Report details */}
          <div>{report.description}</div>
          <div className="text-gray-500">By: {report.firstName} {report.lastName}</div>
          <div className="text-gray-500">Age: {report.age || "N/A"}</div>
          <div className="text-gray-500">Contact: {report.contactNumber || "N/A"}</div>
          <div className="text-xs text-gray-400 mt-1">
            𝗥𝗲𝗽𝗼𝗿𝘁𝗲𝗱 𝗮𝘁: {formatPHTime(report.createdAt)}
          </div>

          {/* Action buttons - change based on current status */}
          <div className="flex flex-col gap-1 mt-2">
            {/* Step 1: Initial state - not on the way, not arrived */}
            {!isOnTheWay && !isArrived && (
              <div className="flex gap-1 w-full">
                <button
                  onClick={handleOnTheWay}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition text-[10px]"
                >
                  𝗢𝗡 𝗧𝗛𝗘 𝗪𝗔𝗬
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition text-[10px]"
                >
                  𝗗𝗘𝗖𝗟𝗜𝗡𝗘
                </button>
              </div>
            )}

            {/* Step 2: On the way but not arrived yet */}
            {isOnTheWay && !isArrived && (
              <div className="flex gap-1 w-full">
                <button
                  onClick={handleArrived}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition text-[10px]"
                >
                  ARRIVE
                </button>
                <button
                  onClick={handleOnTheWay}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition text-[10px]"
                >
                  𝗦𝗧𝗜𝗟𝗟 𝗢𝗧𝗪
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-[10px]"
                >
                  CANCEL
                </button>
              </div>
            )}

            {/* Step 3: Arrived at location */}
            {isArrived && (
              <div className="flex gap-1 w-full">
                <button
                  onClick={handleResponded}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition text-[10px]"
                >
                  𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗘𝗗
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-[10px]"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AutoOpenMarker;