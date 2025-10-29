import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "https://zapalert-backend.onrender.com";

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState(null);
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);
  const [declinedAccounts, setDeclinedAccounts] = useState([]);

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/pending-users`, {
        withCredentials: true,
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    }
  };

  const approveUser = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/auth/approve/${id}`, null, {
        withCredentials: true,
      });
      toast.success("User approved successfully!");
      fetchPending();
    } catch (error) {
      toast.error("Failed to approve user.");
      console.error(error);
    }
  };

const rejectUser = async (id) => {
  try {
    // Find the user before deleting to save their info
    const userToReject = pendingUsers.find(user => user._id === id);
    
    // Use the new reject endpoint (no password required)
    await axios.delete(`${BASE_URL}/auth/reject/${id}`, {
      withCredentials: true,
    });
    
    // Save to declined accounts
    if (userToReject) {
      saveDeclinedAccount(userToReject);
    }
    
    toast.success("User rejected and deleted.");
    fetchPending();
  } catch (error) {
    toast.error("Failed to reject user.");
    console.error(error);
  }
};

  const handleRejectClick = (id) => {
    setModalUserId(id);
    setModalOpen(true);
  };

  const handleConfirmReject = () => {
    rejectUser(modalUserId);
    setModalOpen(false);
  };

  // Load declined accounts from localStorage
  useEffect(() => {
    const savedDeclinedAccounts = localStorage.getItem('declinedAccounts');
    if (savedDeclinedAccounts) {
      setDeclinedAccounts(JSON.parse(savedDeclinedAccounts));
    }
  }, []);

  // Save declined account when user is rejected
  const saveDeclinedAccount = (user) => {
    const declinedAccount = {
      ...user,
      declinedAt: new Date().toISOString(),
      declinedDate: new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    const updatedDeclinedAccounts = [declinedAccount, ...declinedAccounts];
    setDeclinedAccounts(updatedDeclinedAccounts);
    localStorage.setItem('declinedAccounts', JSON.stringify(updatedDeclinedAccounts));
  };

  // Auto-clean declined accounts older than 15 days
  useEffect(() => {
    const cleanOldDeclinedAccounts = () => {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      const filteredAccounts = declinedAccounts.filter(account => {
        const declinedDate = new Date(account.declinedAt);
        return declinedDate > fifteenDaysAgo;
      });
      
      if (filteredAccounts.length !== declinedAccounts.length) {
        setDeclinedAccounts(filteredAccounts);
        localStorage.setItem('declinedAccounts', JSON.stringify(filteredAccounts));
      }
    };

    cleanOldDeclinedAccounts();
  }, [declinedAccounts]);

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold text-gray-800">Pending User Requests</h1>
  
  {/* View Declined Users Button */}
  <button
    onClick={() => setShowDeclinedModal(true)}
    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg font-semibold text-sm"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
    Declined Users ({declinedAccounts.length})
  </button>
</div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
          <p className="text-gray-600 text-lg">No pending users.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => {
            const imgURL = `${BASE_IMAGE_URL}/${user.idImagePath.replace(/\\/g, "/")}`;
            return (
              <div
                key={user._id}
                className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center border-2 border-red-100 hover:border-red-200 transition-all"
              >
                {/* Left: User Info */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><b>Username:</b> {user.username}</p>
                    <p><b>Role:</b> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">{user.role}</span></p>
                    <p><b>Status:</b> <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">{user.status}</span></p>
                    <p><b>Age:</b> {user.age}</p>
                    <p><b>Contact No.:</b> {user.contactNumber}</p>
                    <p><b>Barangay:</b> {user.barangay}</p>
                    <p><b>Barrio:</b> {user.barrio}</p>

                  </div>
                </div>

                {/* Right: ID Image + Actions */}
                <div className="flex flex-col items-center gap-4 min-w-[10rem]">
                  <img
                    src={imgURL}
                    alt="Valid ID"
                    className="w-36 h-24 object-cover border-2 border-red-200 rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md"
                    onClick={() => setSelectedImage(imgURL)}
                  />
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => approveUser(user._id)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(user._id)}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-3xl max-h-[90vh] overflow-auto relative shadow-2xl border-2 border-red-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full ID"
              className="rounded-xl max-w-full max-h-[80vh] mx-auto shadow-lg"
            />
            <button
              className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-2xl font-bold bg-white/80 rounded-full p-1 shadow-md"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-xl w-80 max-w-full p-6 border-t-4 border-red-600"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-xl font-bold mb-4 text-gray-800">Reject User?</h2>
            <p className="mb-6 text-center text-red-600 font-medium">
              Are you sure you want to reject this user? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all font-semibold"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-xl text-white font-semibold transition-all bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md"
                onClick={handleConfirmReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Declined Users Modal */}
          {showDeclinedModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[70]">
            <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto relative shadow-2xl border border-red-200">
              <button 
                className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors"
                onClick={() => setShowDeclinedModal(false)}
              >
                ×
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800">Recently Declined Users</h2>
              
              {/* Info Note */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-700 text-sm">
                  <strong>Note:</strong> Declined users are automatically cleared after 15 days.
                </p>
              </div>

              {declinedAccounts.length === 0 ? (
                <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
                  <p className="text-gray-600 text-lg">No declined users found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
                  <table className="min-w-full text-left">
                    <thead className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                      <tr>
                        <th className="py-2 px-3 rounded-tl-2xl text-xs">Name</th>
                        <th className="py-2 px-3 text-xs">Username</th>
                        <th className="py-2 px-3 text-xs">Role</th>
                        <th className="py-2 px-3 text-xs">Contact #</th>
                        <th className="py-2 px-3 text-xs">Age</th>
                        <th className="py-2 px-3 text-xs">Barrio</th>
                        <th className="py-2 px-3 text-xs">Barangay</th>
                        <th className="py-2 px-3 rounded-tr-2xl text-xs">Declined On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {declinedAccounts.map((account, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 hover:bg-gray-50/50 transition-all"
                        >
                          <td className="py-2 px-3 font-medium text-xs">{account.firstName} {account.lastName}</td>
                          <td className="py-2 px-3 text-xs">{account.username}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              account.role === "responder" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {account.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-xs">{account.contactNumber || "N/A"}</td>
                          <td className="py-2 px-3 text-xs">{account.age ?? "N/A"}</td>
                          <td className="py-2 px-3 text-xs">{account.barrio || "—"}</td>
                          <td className="py-2 px-3 text-xs">{account.barangay}</td>
                          <td className="py-2 px-3 text-xs text-gray-600">{account.declinedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}
        {/* Clear All Button - Only show if there are declined accounts 
        {declinedAccounts.length > 0 && (
          <button
            onClick={() => {
              setDeclinedAccounts([]);
              localStorage.setItem('declinedAccounts', JSON.stringify([]));
              toast.success("All declined users cleared!");
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

export default PendingUsers;