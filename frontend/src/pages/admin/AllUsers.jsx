import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "https://zapalert-backend.onrender.com";

const AllUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [barrioFilter, setBarrioFilter] = useState("All");
  const [searchUsername, setSearchUsername] = useState("");
  const [selectedTab, setSelectedTab] = useState("Profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deletedAccounts, setDeletedAccounts] = useState([]);

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/all-users`, { withCredentials: true });
      setAllUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  };

  // Load deleted accounts from localStorage
  useEffect(() => {
    const savedDeletedAccounts = localStorage.getItem('deletedAccounts');
    if (savedDeletedAccounts) {
      setDeletedAccounts(JSON.parse(savedDeletedAccounts));
    }
  }, []);

  // Save deleted account when user is deleted
  const saveDeletedAccount = (user) => {
    const deletedAccount = {
      ...user,
      deletedAt: new Date().toISOString(),
      deletedDate: new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    const updatedDeletedAccounts = [deletedAccount, ...deletedAccounts];
    setDeletedAccounts(updatedDeletedAccounts);
    localStorage.setItem('deletedAccounts', JSON.stringify(updatedDeletedAccounts));
  };

  // Auto-clean deleted accounts older than 15 days
  useEffect(() => {
    const cleanOldDeletedAccounts = () => {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      const filteredAccounts = deletedAccounts.filter(account => {
        const deletedDate = new Date(account.deletedAt);
        return deletedDate > fifteenDaysAgo;
      });
      
      if (filteredAccounts.length !== deletedAccounts.length) {
        setDeletedAccounts(filteredAccounts);
        localStorage.setItem('deletedAccounts', JSON.stringify(filteredAccounts));
      }
    };

    cleanOldDeletedAccounts();
  }, [deletedAccounts]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const filtered = allUsers.filter((user) => {
      const roleMatch = roleFilter === "All" || user.role?.toLowerCase() === roleFilter.toLowerCase();  
      const statusMatch = statusFilter === "All" || user.status === statusFilter.toLowerCase();
      const barangayMatch = barangayFilter === "All" || user.barangay === barangayFilter;
      const barrioMatch = barrioFilter === "All" || user.barrio === barrioFilter;

      const text = searchUsername.toLowerCase();
      const matchesSearch =
        user.username?.toLowerCase().includes(text) ||
        user.firstName?.toLowerCase().includes(text) ||
        user.lastName?.toLowerCase().includes(text) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(text) ||
        user.contactNumber?.toLowerCase().includes(text) ||
        user.barangay?.toLowerCase().includes(text) ||
        user.barrio?.toLowerCase().includes(text) ||
        user.age?.toString().includes(text);

      return roleMatch && statusMatch && barangayMatch && barrioMatch && matchesSearch;
    });
    setFilteredUsers(filtered);
  }, [roleFilter, statusFilter, barangayFilter, barrioFilter, searchUsername, allUsers]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setSelectedUser(null);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const getRoleColor = (role) => {
    return role === "responder" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  };

  const getStatusColor = (status) => {
    return status === "approved" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800";
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this user?")) return;
    try {
      await axios.patch(`${BASE_URL}/auth/approve/${id}`, {}, { withCredentials: true });
      fetchAllUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Approve failed", error);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;
    try {
      await axios.delete(`${BASE_URL}/auth/reject/${id}`, { withCredentials: true });
      fetchAllUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Reject failed", error);
    }
  };

  const handleDelete = async () => {
    if (!adminPassword) {
      toast.error("Please enter your admin password.");
      return;
    }

    try {
      // CHANGE THIS LINE: Use the new delete endpoint
      await axios.delete(`${BASE_URL}/auth/delete/${userToDelete._id}`, { 
        data: { adminPassword },
        withCredentials: true 
      });
      
      // Save to deleted accounts
      saveDeletedAccount(userToDelete);
      
      fetchAllUsers();
      setSelectedUser(null);
      setShowDeleteModal(false);
      setAdminPassword("");
      toast.success("User deleted successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user.");
    }
  };

    const barangayOptions = [...new Set(allUsers.map((u) => u.barangay))];
    const barrioOptions = [...new Set(allUsers.map((u) => u.barrio).filter(Boolean))].sort();

    return (
      <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-800">All Registered Users</h1>
    
    {/* View Deleted Accounts Button */}
    <button
      onClick={() => setShowDeletedModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg font-semibold text-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Deleted Accounts ({deletedAccounts.length})
    </button>
  </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Resident">Resident</option>
          <option value="Responder">Responder</option>
        </select>

        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
        </select>

        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={barangayFilter} 
          onChange={(e) => setBarangayFilter(e.target.value)}
        >
          <option value="All">All Barangays</option>
          {barangayOptions.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>

        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={barrioFilter} 
          onChange={(e) => setBarrioFilter(e.target.value)}
        >
          <option value="All">All Barrios</option>
          {barrioOptions.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search users..."
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
          <p className="text-gray-600 text-lg">No matching users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <tr>
                <th className="py-3 px-4 rounded-tl-2xl">Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Contact #</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Barrio</th>
                <th className="py-3 px-4 rounded-tr-2xl">Barangay</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className={`border-b border-red-100 hover:bg-red-50/50 cursor-pointer transition-all ${
                    selectedUser?._id === user._id ? "bg-red-100" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedTab("Profile");
                    setAdminPassword("");
                    setShowDeleteModal(false);
                  }}
                  >
                  <td className="py-3 px-4 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{user.contactNumber || "N/A"}</td>
                  <td className="py-3 px-4">{user.age ?? "N/A"}</td>
                  <td className="py-3 px-4">{user.barrio || "—"}</td>
                  <td className="py-3 px-4">{user.barangay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto relative shadow-2xl border border-red-200">
            <button className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors" onClick={() => setSelectedUser(null)}>×</button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">User Information</h2>

            <div className="mb-4">
              <div className="flex border-b border-red-200">
                {["Profile", "Valid ID", "Actions"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 font-semibold transition-all ${
                      selectedTab === tab 
                        ? "border-b-2 border-red-600 text-red-600" 
                        : "text-gray-600 hover:text-red-600"
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {selectedTab === "Profile" && (
              <div className="space-y-3 text-sm">
                <p><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                <p><strong>Username:</strong> {selectedUser.username}</p>
                <p><strong>Contact Number:</strong> {selectedUser.contactNumber}</p>
                <p><strong>Age:</strong> {selectedUser.age}</p>
                <p><strong>Barangay:</strong> {selectedUser.barangay}</p>
                <p><strong>Barrio:</strong> {selectedUser.barrio}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
              </div>
            )}

            {selectedTab === "Valid ID" && (
              <div className="mt-4 flex justify-center">
                {selectedUser.idImagePath ? (
                  <a
                    href={`${BASE_IMAGE_URL}/${selectedUser.idImagePath.replace(/\\/g, "/")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <img
                      src={`${BASE_IMAGE_URL}/${selectedUser.idImagePath.replace(/\\/g, "/")}`}
                      alt="Valid ID"
                      className="w-[350px] h-[220px] object-cover border-2 border-red-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs bg-black/80 text-white rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      View Full Picture
                    </span>
                  </a>
                ) : (
                  <p className="text-center text-gray-500 py-8">No ID uploaded</p>
                )}
              </div>
            )}

            {selectedTab === "Actions" && (
              <div className="mt-6 space-y-4">
                {selectedUser.status === "pending" && (
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                      onClick={() => handleApprove(selectedUser._id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                      onClick={() => handleReject(selectedUser._id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {selectedUser.status === "approved" && (
                  <div className="mt-6 space-y-4">
                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-red-700 font-semibold mb-2">Danger Zone</p>
                      <p className="text-sm text-gray-600">
                        This action cannot be undone. The user will be permanently deleted.
                      </p>
                    </div>
                    
                    <button
                      className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-semibold"
                      onClick={() => {
                        setUserToDelete(selectedUser);
                        setShowDeleteModal(true);
                        setAdminPassword(""); // Clear previous password
                      }}
                    >
                      Delete User
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[60]">
          <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-md mx-4 relative shadow-2xl border border-red-200">
            <button 
              className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors"
              onClick={() => {
                setShowDeleteModal(false);
                setAdminPassword("");
              }}
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
            
            <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-red-700 font-semibold">You are about to delete:</p>
              <p className="text-gray-800 text-lg font-medium">{userToDelete.firstName} {userToDelete.lastName}</p>
              <p className="text-gray-600">Username: {userToDelete.username}</p>
              <p className="text-gray-600">Role: {userToDelete.role}</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your <strong>password</strong> to confirm deletion:
              </p>
              
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your admin password"
                className="w-full p-3 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />

              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition-all font-semibold"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAdminPassword("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`flex-1 py-3 rounded-xl text-white font-semibold transition-all ${
                    adminPassword
                      ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleDelete}
                  disabled={!adminPassword}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Deleted Accounts Modal */}
      {showDeletedModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[70]">
          <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto relative shadow-2xl border border-red-200">
            <button 
              className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors"
              onClick={() => setShowDeletedModal(false)}
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">Recently Deleted Accounts</h2>
            
            {/* Info Note */}
            <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-yellow-700 text-sm">
                <strong>Note:</strong> Deleted accounts are automatically cleared after 15 days.
              </p>
            </div>

            {deletedAccounts.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
                <p className="text-gray-600 text-lg">No deleted accounts found.</p>
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
                      <th className="py-2 px-3 rounded-tr-2xl text-xs">Deleted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedAccounts.map((account, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-50/50 transition-all"
                      >
                        <td className="py-2 px-3 font-medium text-xs">{account.firstName} {account.lastName}</td>
                        <td className="py-2 px-3 text-xs">{account.username}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(account.role)}`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs">{account.contactNumber || "N/A"}</td>
                        <td className="py-2 px-3 text-xs">{account.age ?? "N/A"}</td>
                        <td className="py-2 px-3 text-xs">{account.barrio || "—"}</td>
                        <td className="py-2 px-3 text-xs">{account.barangay}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{account.deletedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Clear All Button - Only show if there are deleted accounts 
        {deletedAccounts.length > 0 && (
          <button
            onClick={() => {
              setDeletedAccounts([]);
              localStorage.setItem('deletedAccounts', JSON.stringify([]));
              toast.success("All deleted accounts cleared!");
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

export default AllUsers;