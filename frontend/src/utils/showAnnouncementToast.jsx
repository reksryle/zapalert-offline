// utils/showAnnouncementToast.jsx
import toast from "react-hot-toast";

// Global audio variable to manage announcement sounds
let announcementAudio = null;

/**
 * Displays a custom announcement toast with sound
 * @param {string} message - The announcement message to display
 * @param {function} onClose - Callback function to execute when toast is closed
 */
const showAnnouncementToast = (message, onClose = () => {}) => {
  // Stop any previous announcement audio to prevent overlapping sounds
  if (announcementAudio) {
    announcementAudio.pause();
    announcementAudio.currentTime = 0;
  }

  // Play the announcement sound effect
  announcementAudio = new Audio("/sounds/announcement.mp3");
  announcementAudio.play().catch((err) => {
    console.warn("🔇 Unable to play announcement sound:", err);
  });

  // Create custom toast component
  toast.custom(
    (t) => (
      <div
        className={`bg-red-600 text-white p-6 rounded-xl shadow-xl border-2 border-red-800 w-full max-w-md mx-auto text-center transition-all duration-300 ${
          t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
      >
        {/* Announcement Header */}
        <div className="text-2xl font-bold mb-2 tracking-wide">ANNOUNCEMENT</div>
        
        {/* Announcement Message */}
        <p className="text-sm text-white break-words whitespace-pre-wrap">{message}</p>

        {/* Close Button */}
        <button
          onClick={() => {
            toast.dismiss(t.id); // Dismiss the toast
            if (announcementAudio) {
              announcementAudio.pause(); // Stop audio
              announcementAudio.currentTime = 0; // Reset audio
            }
            onClose(); // Execute callback
          }}
          className="mt-4 px-5 py-2 bg-white text-red-700 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Close
        </button>
      </div>
    ),
    {
      duration: Infinity, // Toast stays until manually closed
      position: "top-center", // Position at top center of screen
    }
  );
};

export default showAnnouncementToast;