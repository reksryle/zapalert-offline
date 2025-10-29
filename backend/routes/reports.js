const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware"); // Import auth checker

// ✅ Define what responder actions look like
const responderActionSchema = new mongoose.Schema({
  responderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Which responder
  fullName: String, // Responder's name
  action: { type: String, enum: ["on the way", "responded", "declined", "arrived"] }, // What they did
  timestamp: { type: Date, default: Date.now }, // When they did it
});

// ✅ Define what emergency reports look like
const reportSchema = new mongoose.Schema({
  type: { type: String, required: true }, // Emergency type (fire, flood, etc.)
  description: { type: String, required: false, default: "" }, // Additional details
  username: { type: String, required: true }, // Who reported it
  firstName: { type: String, required: true }, // Reporter's first name
  lastName: { type: String, required: true }, // Reporter's last name
  age: { type: Number }, // Reporter's age
  contactNumber: { type: String }, // Reporter's phone
  latitude: { type: Number, required: true }, // Location coordinates
  longitude: { type: Number, required: true }, // Location coordinates
  status: { type: String, default: "pending" }, // Current status
  cancellationReason: { type: String }, // Why was it cancelled
  responders: [responderActionSchema], // Array of responder actions
  resolvedAt: { type: Date }, // When it was resolved
  createdAt: { type: Date, default: Date.now }, // When it was reported
});

// ✅ Create Report model for database
const Report = mongoose.model("Report", reportSchema);

// ---------------------------
// POST /api/reports — Submit new emergency report
// ---------------------------
router.post("/", async (req, res) => {
  try {
    // Get all data from request
    const {
      type,
      description = "",
      username,
      firstName,
      lastName,
      age,
      contactNumber,
      latitude,
      longitude,
    } = req.body;

    // Check if required fields are present
    if (!type || !firstName || !lastName || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    let parsedAge = Number(age); // Convert age to number
    if (isNaN(parsedAge)) parsedAge = undefined; // Handle invalid age

    // Create new report in database
    const newReport = new Report({
      type,
      description,
      username,
      firstName,
      lastName,
      age: parsedAge,
      contactNumber,
      latitude,
      longitude,
      status: "pending", // Start as pending
    });

    await newReport.save(); // Save to database
    res.status(201).json({ 
      message: "Report submitted successfully!",
      reportId: newReport._id // Return the new report ID
    });
  } catch (err) {
    console.error("❌ Failed to save report:", err);
    res.status(500).json({ error: "Failed to save report." });
  }
});

// ---------------------------
// GET /api/reports — Get all emergency reports
// ---------------------------
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }); // Get all reports, newest first
    res.json(reports);
  } catch (err) {
    console.error("❌ Failed to fetch reports:", err);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
});

// ---------------------------
// PATCH /api/reports/:id/respond — Mark report as responded
// ---------------------------
router.patch("/:id/respond", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id); // Find report by ID
    if (!report) return res.status(404).json({ error: "Report not found." });

    const io = req.app.get("io"); // Get socket.io for real-time messaging
    const socketMap = req.app.get("socketMap"); // Get connected users map
    const residentSocketId = socketMap.get(report.username); // Find resident's connection

    // Get responder's name from logged in user
    const responderName = req.user
      ? `${req.user.firstName} ${req.user.lastName}`
      : "Responder";

    // Update report status in database
    report.status = "responded";

    // ✅ Track responder action in history
    report.responders.push({
      responderId: req.user._id,
      fullName: responderName,
      action: "responded",
      timestamp: new Date(),
    });

    // ✅ Mark resolved time if not already set
    if (!report.resolvedAt) {
      report.resolvedAt = new Date();
    }

    await report.save(); // Save changes

    // Notify resident that help is coming
    if (residentSocketId) {
      io.to(residentSocketId).emit("responded", {
        type: report.type,
        responderName,
        residentName: `${report.firstName} ${report.lastName}`,
        time: new Date().toISOString(),
      });
      console.log(`📤 Emitted 'responded' to ${report.username}`);
    }

    // Notify other responders about the update
    const currentResponderId = req.user?._id?.toString() || req.user?.responderId || req.user?.username;
    io.sockets.sockets.forEach((socket) => {
      if (
        socket.responderId &&
        currentResponderId &&
        socket.responderId.toString() !== currentResponderId // Don't notify yourself
      ) {
        socket.emit("notify-responded", {
          reportId: report._id,
          type: report.type,
          responderName,
          residentName: `${report.firstName} ${report.lastName}`,
          time: new Date().toISOString(),
        });
      }
    });

    res.json({
      message: "Report marked as responded.",
      reportId: report._id,
      status: report.status,
    });
  } catch (err) {
    console.error("❌ Failed to process responded:", err);
    res.status(500).json({ error: "Failed to mark as responded." });
  }
});

// ---------------------------
// PATCH /api/reports/:id/ontheway — Mark as on the way
// ---------------------------
router.patch("/:id/ontheway", authMiddleware, async (req, res) => {
  try {
    const responderName = req.user
      ? `${req.user.firstName} ${req.user.lastName}`
      : "Responder";

    // Update report and add responder action
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: "on the way",
        $push: {
          responders: {
            responderId: req.user._id,
            fullName: responderName,
            action: "on the way",
            timestamp: new Date(),
          },
        },
      },
      { new: true } // Return updated document
    );
    if (!updated) return res.status(404).json({ error: "Report not found." });

    const io = req.app.get("io");
    const socketMap = req.app.get("socketMap");
    const residentSocketId = socketMap.get(updated.username);

    // Notify resident that responder is on the way
    if (residentSocketId) {
      io.to(residentSocketId).emit("notify-resident", {
        type: updated.type,
        responderName,
        residentName: `${updated.firstName} ${updated.lastName}`,
        time: new Date().toISOString(),
      });
    }

    // Notify other responders
    const currentResponderId = req.user?._id?.toString() || req.user?.responderId || req.user?.username;
    io.sockets.sockets.forEach((socket) => {
      if (
        socket.responderId &&
        currentResponderId &&
        socket.responderId.toString() !== currentResponderId
      ) {
        socket.emit("notify-on-the-way", {
          reportId: updated._id,
          type: updated.type,
          responderName,
          residentName: `${updated.firstName} ${updated.lastName}`,
          time: new Date().toISOString(),
        });
      }
    });

    res.json({ message: "Report marked as on the way", report: updated });
  } catch (err) {
    console.error("❌ Failed to update report to on the way:", err);
    res.status(500).json({ error: "Failed to update report status." });
  }
});

// ---------------------------
// DELETE /api/reports/:id — Decline/Cancel a report
// ---------------------------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found." });

    const io = req.app.get("io");
    const responderName = `${req.user.firstName} ${req.user.lastName}`;
    const reportId = report._id;

    const socketMap = req.app.get("socketMap");
    const residentSocketId = socketMap.get(report.username);

    // Update report status instead of deleting
    report.status = "declined";

    // ✅ Log responder action in history
    report.responders.push({
      responderId: req.user._id,
      fullName: responderName,
      action: "declined",
      timestamp: new Date(),
    });

    // ✅ Mark resolved time if not already set
    if (!report.resolvedAt) {
      report.resolvedAt = new Date();
    }

    await report.save(); // Save changes

    // Notify resident that report was declined
    if (residentSocketId) {
      io.to(residentSocketId).emit("declined", {
        type: report.type,
        responderName,
        residentName: `${report.firstName} ${report.lastName}`,
        time: new Date().toISOString(),
      });
    }

    // Notify other responders about the decline
    const currentResponderId = req.user?._id?.toString();
    io.sockets.sockets.forEach((socket) => {
      if (
        socket.responderId &&
        currentResponderId &&
        socket.responderId.toString() !== currentResponderId
      ) {
        socket.emit("responder-declined", {
          reportId,
          type: report.type,
          responderName,
          residentName: `${report.firstName} ${report.lastName}`,
          time: new Date().toISOString(),
        });
      }
    });

    res.json({
      message: "Report declined (status updated, not deleted).",
      reportId: report._id,
      status: report.status,
    });
  } catch (err) {
    console.error("❌ Failed to process decline:", err);
    res.status(500).json({ error: "Failed to process decline." });
  }
});

// ---------------------------
// PATCH /api/reports/:id/arrived — Mark as arrived at location
// ---------------------------
router.patch("/:id/arrived", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found." });

    const responderName = `${req.user.firstName} ${req.user.lastName}`;

    // ✅ Track responder arrival in database
    report.responders.push({
      responderId: req.user._id,
      fullName: responderName,
      action: "arrived",
      timestamp: new Date(),
    });

    await report.save();

    const io = req.app.get("io");
    const socketMap = req.app.get("socketMap");
    const residentSocketId = socketMap.get(report.username);

    // ✅ Notify resident that responder has arrived
    if (residentSocketId) {
      io.to(residentSocketId).emit("arrived", {
        type: report.type,
        responderName,
        residentName: `${report.firstName} ${report.lastName}`,
        time: new Date().toISOString(),
      });
    }

    // ✅ Notify other responders (not the one who arrived)
    const currentResponderId = req.user?._id?.toString() || req.user?.responderId || req.user?.username;

    io.sockets.sockets.forEach((socket) => {
      if (
        socket.responderId &&
        currentResponderId &&
        socket.responderId.toString() !== currentResponderId
      ) {
        socket.emit("notify-arrived", {
          reportId: report._id,
          type: report.type,
          responderName,
          residentName: `${report.firstName} ${report.lastName}`,
          time: new Date().toISOString(),
        });
      }
    });

    res.json({ message: "Report marked as arrived", reportId: report._id });
  } catch (err) {
    console.error("❌ Failed to mark report as arrived:", err);
    res.status(500).json({ error: "Failed to mark as arrived." });
  }
});

// ---------------------------
// PATCH /api/reports/:id/followup — Resident requests follow-up
// ---------------------------
router.patch("/:id/followup", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found." });

    const io = req.app.get("io");

    // Get responders who are on the way
    const onTheWayResponders = report.responders
      .filter(responder => responder.action === "on the way")
      .map(responder => responder.fullName);

    // Get responders who have declined
    const declinedResponders = report.responders
      .filter(responder => responder.action === "declined")
      .map(responder => responder.fullName);

    // Notify only responders who are on the way and haven't declined
    io.sockets.sockets.forEach((socket) => {
      // Check if this responder should be notified
      const shouldNotify = onTheWayResponders.some(responderName => 
        socket.responderName === responderName && 
        !declinedResponders.includes(responderName)
      );

      if (shouldNotify) {
        socket.emit("resident-followup", {
          reportId: report._id,
          type: report.type,
          residentName: `${report.firstName} ${report.lastName}`,
          time: new Date().toISOString(),
        });
      }
    });

    res.json({ message: "Follow-up request sent to responders on the way" });
  } catch (err) {
    console.error("❌ Failed to send follow-up:", err);
    res.status(500).json({ error: "Failed to send follow-up request." });
  }
});

// ---------------------------
// PATCH /api/reports/:id/cancel — Cancel a report
// ---------------------------
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Get cancellation reason
    
    const report = await Report.findById(id);
    
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    // Count how many responders are currently on the way
    const activeResponders = report.responders.filter(
      responder => responder.action === "on the way"
    ).length;

    // Update report status to cancelled
    report.status = "cancelled";
    report.cancellationReason = reason || "No reason provided";
    report.cancellationTime = new Date();
    await report.save();

    const io = req.app.get("io");
    
    // Notify all responders about the cancellation
    io.emit("report-cancelled", {
      reportId: report._id,
      type: report.type,
      residentName: `${report.firstName} ${report.lastName}`,
      cancellationReason: report.cancellationReason,
      activeResponders: activeResponders,
      time: new Date().toISOString(),
    });

    res.json({ 
      message: "Report cancelled successfully", 
      reportId: report._id,
      cancellationReason: report.cancellationReason,
      activeResponders: activeResponders
    });
  } catch (err) {
    console.error("❌ Failed to cancel report:", err);
    res.status(500).json({ error: "Failed to cancel report." });
  }
});

module.exports = router;