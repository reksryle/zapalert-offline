import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;

const Announcement = () => {
  const [message, setMessage] = useState("");
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  // Load announcements from localStorage on component mount
  useEffect(() => {
    const savedAnnouncements = localStorage.getItem('recentAnnouncements');
    if (savedAnnouncements) {
      setRecentAnnouncements(JSON.parse(savedAnnouncements));
    }
  }, []);

  // Auto-clean announcements older than 30 days
  useEffect(() => {
    const cleanOldAnnouncements = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredAnnouncements = recentAnnouncements.filter(announcement => {
        const announcementDate = new Date(announcement.postedAt);
        return announcementDate > thirtyDaysAgo;
      });
      
      if (filteredAnnouncements.length !== recentAnnouncements.length) {
        setRecentAnnouncements(filteredAnnouncements);
        localStorage.setItem('recentAnnouncements', JSON.stringify(filteredAnnouncements));
      }
    };

    cleanOldAnnouncements();
  }, [recentAnnouncements]);

  const handlePost = async () => {
    if (!message.trim()) return toast.error("Announcement is empty");

    try {
      await axios.post(`${BASE_URL}/announcement`, { message }, { withCredentials: true });
      
      // Save to recent announcements
      const newAnnouncement = {
        message: message.trim(),
        postedAt: new Date().toISOString(),
        postedDate: new Date().toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      const updatedAnnouncements = [newAnnouncement, ...recentAnnouncements];
      setRecentAnnouncements(updatedAnnouncements);
      localStorage.setItem('recentAnnouncements', JSON.stringify(updatedAnnouncements));
      
      toast.success("Announcement sent to all users!");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send announcement");
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6 max-w-xl mx-auto border border-red-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Public Announcement</h2>
        
        {/* View Recent Announcements Button */}
        <button
          onClick={() => setShowAnnouncementsModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-semibold text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Recent ({recentAnnouncements.length})
        </button>
      </div>

      <textarea
        className="w-full p-4 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white/80 backdrop-blur-sm resize-none text-sm"
        rows={5}
        placeholder="Type your announcement here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        onClick={handlePost}
      >
        Post Announcement
      </button>

      {/* Recent Announcements Modal */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[70]">
          <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto relative shadow-2xl border border-red-200">
            <button 
              className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors"
              onClick={() => setShowAnnouncementsModal(false)}
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Announcements</h2>
            
            {/* Info Note */}
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> Recent announcements are automatically cleared after 30 days.
              </p>
            </div>

            {recentAnnouncements.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
                <p className="text-gray-600 text-lg">No recent announcements found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement, index) => (
                  <div
                    key={index}
                    className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border-2 border-red-100 hover:border-red-200 transition-all shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm">Announcement #{recentAnnouncements.length - index}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {announcement.postedDate}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
       {/* Clear All Button - Only show if there are announcements 
        {recentAnnouncements.length > 0 && (
          <button
            onClick={() => {
              setRecentAnnouncements([]);
              localStorage.setItem('recentAnnouncements', JSON.stringify([]));
              toast.success("All announcements cleared!");
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg font-semibold text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        )}*/}
    </div>
  );
};

export default Announcement;