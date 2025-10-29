const express = require("express");
const bcrypt = require("bcryptjs"); // For password encryption
const multer = require("multer"); // For file uploads
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken"); // For creating security tokens

const router = express.Router();
const { User, Admin } = require("../models"); // Import database models

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // Secret key for tokens

// Configure file upload for ID images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in uploads folder
  },
  filename: (req, file, cb) => {
    // Create unique filename to avoid conflicts
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ SIGNUP - Create new user account
router.post("/signup", upload.single("validId"), async (req, res) => {
  try {
    // Get all user data from request
    const {
      firstName, lastName, username, password, age,
      contactNumber, barangay, barrio, role
    } = req.body;

    // Validate phone number format
    const contactRegex = /^09\d{9}$/;
    if (!contactRegex.test(contactNumber)) {
      return res.status(400).json({ message: "Contact number must start with 09 and be 11 digits long." });
    }

    if (!req.file) return res.status(400).json({ message: "Valid ID is required." }); // Check if ID image was uploaded

    if (!age || age < 7 || age > 100) {
      return res.status(400).json({ message: "Age must be between 7 and 100." });
    }

    // Check if username already exists
    const existing = await User.findOne({ username: { $regex: `^${username}$`, $options: "i" } });
    if (existing) return res.status(400).json({ message: "Username already exists." });

    // Encrypt password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const newUser = new User({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      age,
      contactNumber,
      barangay: barangay || "Zapatera",
      barrio,
      role,
      status: "pending", // New users need admin approval
      idImagePath: req.file.path, // Store file path
      submittedAt: new Date(),
    });

    await newUser.save(); // Save to database

    res.status(201).json({ message: "Signup successful. Await admin approval." });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup." });
  }
});

// ✅ LOGIN - Verify user and create session
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user in database
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid username or password." });

    // Check if account is approved
    if (user.status !== "approved") {
      return res.status(403).json({ message: `Account is ${user.status}. Wait for admin approval.` });
    }

    // Compare password with encrypted version
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid username or password." });

    // Create security token (like a digital ID card)
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      { expiresIn: "10y" } // Token lasts 10 years
    );

    // Set token as HTTP-only cookie (secure)
    res.cookie("zapToken", token, {
      httpOnly: true, // Prevent JavaScript access
      secure: true,   // Only send over HTTPS
      sameSite: "None", // Allow cross-site requests
      maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years expiry
    })
    .json({
      message: "Login successful",
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      contactNumber: user.contactNumber,
      address: user.address,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ✅ SESSION CHECK - Verify if user is still logged in
router.get("/session", async (req, res) => {
  try {
    const token = req.cookies?.zapToken; // Get token from cookies
    if (!token) return res.status(401).json({ message: "No token." });

    // Verify token is still valid
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId); // Get user from database
    if (!user) return res.status(404).json({ message: "User not found." });

    // Return current user info
    res.json({
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      contactNumber: user.contactNumber,
      address: user.address,
    });
  } catch (err) {
    console.error("Session check failed:", err);
    res.status(401).json({ message: "Invalid or expired token." });
  }
});

// Alternative session check endpoint
router.get("/check-session", (req, res) => {
  const token = req.cookies?.zapToken;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ userId: decoded.userId, role: decoded.role }); // Return basic user info
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
});

// ✅ LOGOUT - Clear the session cookie
router.post("/logout", (req, res) => {
  res.clearCookie("zapToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  res.json({ message: "Logged out successfully." });
});

// ✅ GET pending users - For admin to see who needs approval
router.get("/pending-users", async (req, res) => {
  try {
    const users = await User.find({ status: "pending" }); // Find all pending users
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending users." });
  }
});

// ✅ APPROVE user - Admin approves a pending user
router.patch("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from URL

    // Update user status to approved
    const user = await User.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ message: "User approved.", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve user." });
  }
});

// ✅ REJECT user - Admin rejects a pending user
router.delete("/reject/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only allow rejecting pending users
    if (user.status !== "pending") {
      return res.status(400).json({ message: "Can only reject pending users." });
    }

    // Delete the uploaded ID image file
    if (user.idImagePath) {
      const absolutePath = path.resolve(user.idImagePath);
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    }

    await User.findByIdAndDelete(req.params.id); // Remove user from database
    res.json({ message: "User rejected successfully" });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ message: "Server error during rejection" });
  }
});

// ✅ DELETE approved user - Remove user with admin password verification
router.delete("/delete/:id", async (req, res) => {
  try {
    const { adminPassword } = req.body; // Get admin password from request
    
    // Check if admin is logged in
    const token = req.cookies?.zapToken;
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Verify admin token
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = await User.findById(decoded.userId);
    
    // Check if user is actually an admin
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    if (!adminPassword) {
      return res.status(400).json({ message: "Admin password is required." });
    }

    // Verify admin password for extra security
    const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin password." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete uploaded ID image file
    if (user.idImagePath) {
      const absolutePath = path.resolve(user.idImagePath);
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    }

    await User.findByIdAndDelete(req.params.id); // Remove user from database
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid authentication token." });
    }
    
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// ✅ GET all users - For admin to see all users
router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find(); // Get all users from database
    res.json(users);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

module.exports = router;