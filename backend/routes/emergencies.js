const express = require("express");
const router = express.Router();

// Temporary mock emergency data (for testing)
const mockEmergencies = [
  {
    id: 1,
    type: "Fire",
    location: "Zone 1",
    reportedBy: "john123",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: "Flood",
    location: "Zone 5",
    reportedBy: "jane456",
    status: "responded",
    createdAt: new Date().toISOString(),
  },
];

// GET all emergencies - Return the mock data
router.get("/", (req, res) => {
  res.json(mockEmergencies); // Send emergency array directly
});

module.exports = router;