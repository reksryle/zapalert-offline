import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const ReportIcon = new L.Icon({
  iconUrl: "/icons/marker.png",
  iconSize: [40, 40],
});

const ReportsLog = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("latest");
  const [specificDate, setSpecificDate] = useState("");

  const reportsPerPage = 20;

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reports`
      );
      const nonArchived = response.data.filter((r) => !r.archived);
      setReports(nonArchived);
    } catch (error) {
      toast.error("Failed to fetch reports.");
    }
  };

  const getFullName = (report) => {
    if (report.firstName && report.lastName) {
      return `${report.firstName} ${report.lastName}`;
    }
    return report.username || "N/A";
  };

  const handleExportCSV = () => {
    const rows = reports.map(
      ({
        _id,
        type,
        status,
        description,
        firstName,
        lastName,
        username,
        latitude,
        longitude,
        responders // Include responders in export
      }) => ({
        id: _id,
        type,
        status,
        description,
        fullName:
          firstName && lastName ? `${firstName} ${lastName}` : username || "N/A",
        username: username || "N/A",
        latitude,
        longitude,
        responderActions: responders ? responders.map(r => 
          `${r.fullName || 'Responder'}: ${r.action} at ${new Date(r.timestamp).toLocaleString()}`
        ).join('; ') : 'None'
      })
    );

    const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

    const csv = [
      [
        "ID",
        "Type",
        "Status",
        "Description",
        "Full Name",
        "Username",
        "Latitude",
        "Longitude",
        "Responder Actions"
      ],
      ...rows.map((row) =>
        [
          escapeCSV(row.id),
          escapeCSV(row.type),
          escapeCSV(row.status),
          escapeCSV(row.description),
          escapeCSV(row.fullName),
          escapeCSV(row.username),
          row.latitude,
          row.longitude,
          escapeCSV(row.responderActions)
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-CA");
    a.download = `BRGY_REPORTS-${formattedDate}.csv`;

    a.click();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on the way': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add this function to format action text
  const formatActionText = (action) => {
    const actionMap = {
      'on_the_way': 'On the Way',
      'arrived': 'Arrived',
      'responded': 'Responded',
      'declined': 'Cancelled Response',
      'cancelled': 'Cancelled Response'
    };
    return actionMap[action] || action.replace("_", " ");
  };

  const filteredReports = reports
    .filter((report) => {
      const normalize = (str) => str.toLowerCase().replace(/_/g, " ");

      const matchesStatus =
        statusFilter === "all" ||
        normalize(report.status) === statusFilter ||
        (statusFilter === "resolved" &&
          normalize(report.status) === "responded");

      const matchesKeyword = Object.values(report).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchKeyword.toLowerCase())
      );

      return matchesStatus && matchesKeyword;
    })
    .filter((report) => {
      const created = new Date(report.createdAt);
      const today = new Date();

      if (dateFilter === "latest") return true;
      if (dateFilter === "oldest") return true;
      if (dateFilter === "day") {
        return created.toDateString() === today.toDateString();
      }
      if (dateFilter === "week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return created >= startOfWeek;
      }
      if (dateFilter === "month") {
        return (
          created.getMonth() === today.getMonth() &&
          created.getFullYear() === today.getFullYear()
        );
      }
      if (dateFilter === "specific" && specificDate) {
        return created.toISOString().split("T")[0] === specificDate;
      }
      return true;
    })
    .sort((a, b) => {
      if (dateFilter === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Reports Log</h1>

      {/* Filters - All in one row */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "on the way", "resolved", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium whitespace-nowrap ${
                statusFilter === status
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-transparent shadow-lg"
                  : "bg-white/80 border-red-200 text-gray-700 hover:bg-red-50 hover:border-red-300"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-sm min-w-[140px]"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="day">This Day</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="specific">Choose Date</option>
        </select>
        
        {/* Specific Date Input */}
        {dateFilter === "specific" && (
          <input
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            className="p-2 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-sm min-w-[140px]"
          />
        )}

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search reports..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="p-2 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-sm min-w-[180px] flex-1"
        />
        
        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg text-sm font-medium whitespace-nowrap"
        >
          Export Sheets
        </button>
      </div>

      {/* Table - Removed Responders column */}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left rounded-tl-2xl">Full Name</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Date & Time</th>
              <th className="py-3 px-4 text-left rounded-tr-2xl">View</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map((report) => (
              <tr key={report._id} className="hover:bg-red-50/50 border-b border-red-100 transition-all">
                <td className="py-3 px-4 font-medium">{getFullName(report)}</td>
                <td className="py-3 px-4">{report.type}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                    {report.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {new Date(report.createdAt).toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm hover:underline transition-all"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-6 gap-2">
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-4 py-2 rounded-xl border-2 transition-all ${
              currentPage === idx + 1 
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-transparent shadow-lg" 
                : "bg-white/80 border-red-200 text-gray-700 hover:bg-red-50"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative border-2 border-red-200"
          >
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Report Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="space-y-2">
                <p><strong>Full Name:</strong> {getFullName(selectedReport)}</p>
                <p><strong>Username:</strong> {selectedReport.username || "N/A"}</p>
                <p><strong>Type:</strong> {selectedReport.type}</p>
                <p><strong>Status:</strong> {selectedReport.status.replace("_", " ")}</p>
              </div>
              <div className="space-y-2">
                {selectedReport.resolvedAt && (
                  <p><strong>Resolved At:</strong> {new Date(selectedReport.resolvedAt).toLocaleString()}</p>
                )}
                <p><strong>Description:</strong> {selectedReport.description}</p>
                <p><strong>Location:</strong> {selectedReport.latitude}, {selectedReport.longitude}</p>
                <p><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Add cancellation reason display here */}
            {selectedReport.status === 'cancelled' && selectedReport.cancellationReason && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800 mb-1 text-sm">Cancellation Reason:</p>
                <p className="text-red-700 text-xs break-words whitespace-pre-wrap leading-relaxed">
                  {selectedReport.cancellationReason}
                </p>
              </div>
            )}

            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowActions(true)}
                className="px-5 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg text-sm"
              >
                View Responder Actions
              </button>
            </div>

            <div className="h-56 w-full rounded-xl overflow-hidden border-2 border-red-200">
              <MapContainer
                center={[selectedReport.latitude, selectedReport.longitude]}
                zoom={16}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker
                  position={[selectedReport.latitude, selectedReport.longitude]}
                  icon={ReportIcon}
                >
                  <Popup>Emergency Location</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Responder Actions Modal */}
      {showActions && selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowActions(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative border-2 border-red-200"
          >
            <button
              onClick={() => setShowActions(false)}
              className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Responder Actions</h2>
            
            {selectedReport.responders && selectedReport.responders.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl shadow-inner bg-white/80">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left rounded-tl-2xl">Responder</th>
                      <th className="py-3 px-4 text-left">Action</th>
                      <th className="py-3 px-4 text-left rounded-tr-2xl">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.responders.map((r, idx) => (
                      <tr key={idx} className="hover:bg-red-50/50 border-b border-red-100">
                        <td className="py-3 px-4 font-medium">{r.fullName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.action)}`}>
                            {formatActionText(r.action)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(r.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-white/80 rounded-2xl shadow-inner">
                <p className="text-gray-600">No responder actions logged.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsLog;