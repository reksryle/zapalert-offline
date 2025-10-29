import toast from "react-hot-toast";

let announcementAudio = null;

const showAnnouncementToast = (message, onClose = () => {}) => {
  // Stop any previous audio
  if (announcementAudio) {
    announcementAudio.pause();
    announcementAudio.currentTime = 0;
  }

  // Play the announcement sound
  announcementAudio = new Audio("/sounds/announcement.mp3");
  announcementAudio.play().catch((err) => {
    console.warn("🔇 Unable to play announcement sound:", err);
  });

  toast.custom(
    (t) => (
      <div
        className={`bg-red-600 text-white p-6 rounded-xl shadow-xl border-2 border-red-800 w-full max-w-md mx-auto text-center transition-all duration-300 ${
          t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
      >
        <div className="text-2xl font-bold mb-2 tracking-wide">ANNOUNCEMENT</div>
        <p className="text-sm text-white break-words whitespace-pre-wrap">{message}</p>

        <button
          onClick={() => {
            toast.dismiss(t.id);
            if (announcementAudio) {
              announcementAudio.pause();
              announcementAudio.currentTime = 0;
            }
            onClose();
          }}
          className="mt-4 px-5 py-2 bg-white text-red-700 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Close
        </button>
      </div>
    ),
    {
      duration: Infinity,
      position: "top-center",
    }
  );
};

export default showAnnouncementToast;
