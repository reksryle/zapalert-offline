const express = require("express");
const router = express.Router();

// This route needs access to socket.io for real-time messaging
module.exports = (io) => {
  // Send announcement to all connected users
  router.post("/", (req, res) => {
    const { message } = req.body; // Get message from request

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is empty" }); // Check if message is empty
    }

    // Send the message to all connected users via socket.io
    io.emit("public-announcement", {
      message,
      createdAt: new Date(), // Add timestamp
    });

    console.log("📢 Announcement broadcasted:", message);

    res.json({ success: true }); // Send success response
  });

  return router; // Return the router with socket.io access
};