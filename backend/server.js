const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Allow cross-origin requests
const path = require('path');
const dotenv = require('dotenv'); // Load environment variables
const helmet = require('helmet'); // Security headers
const http = require('http');
const { Server } = require('socket.io'); // Real-time communication
const { User } = require('./models');
const cookieParser = require("cookie-parser"); // Handle cookies

dotenv.config(); // Load .env file

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Create HTTP server for Socket.IO
const server = http.createServer(app);

// ✅ Allowed origins for both Express and Socket.IO
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', "https://zapalert.netlify.app"];

// ✅ Create and configure Socket.IO server for real-time features
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Only these websites can connect
    methods: ['GET', 'POST'], // Allowed HTTP methods
    credentials: true, // Allow cookies
  },
});

// ✅ Map to store connected resident usernames to their socket IDs
const connectedResidents = new Map(); // Track connected residents
const connectedResponders = new Map(); // Track connected responders

// ✅ Store in app context for access in routes
app.set("io", io); // Make io available in routes
app.set("socketMap", connectedResidents); // Make resident map available

// ✅ Socket.IO connection handling - Real-time communication
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);
  
  // Resident joins - Store their connection
  socket.on("join-resident", (username) => {
    connectedResidents.set(username, socket.id);
    console.log(`📍 Resident ${username} connected with socket ID: ${socket.id}`);
  });
  
  // Responder joins - Store their connection with ID and name
  socket.on("join-responder", (responderData) => {
    const { responderId, responderName } = responderData;
    socket.responderId = responderId; // Attach ID to socket
    socket.responderName = responderName; // Attach name to socket
    connectedResponders.set(responderId, socket.id);
    console.log(`📍 Responder ${responderName} (${responderId}) connected with socket ID: ${socket.id}`);
  });
  
  // Disconnect cleanup - Remove from tracking when user disconnects
  socket.on("disconnect", () => {
    for (let [username, id] of connectedResidents.entries()) {
      if (id === socket.id) {
        connectedResidents.delete(username);
        console.log(`🔌 Disconnected resident: ${username}`);
        break;
      }
    }
    for (let [id, sid] of connectedResponders.entries()) {
      if (sid === socket.id) {
        connectedResponders.delete(id);
        console.log(`🔌 Disconnected responder: ${id}`);
        break;
      }
    }
  });
});

// ✅ Middleware setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error('Not allowed by CORS')); // Block request
    }
  },
  credentials: true, // Allow cookies
}));
app.options('*', cors()); // Handle preflight requests

app.use(cookieParser()); // Parse cookies from requests
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resources
}));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// ✅ Serve public static files (like images, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Fix CORS for uploaded images - Allow access to ID images
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any website to access images
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// ✅ MongoDB Connection - Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB successfully'); // Success message
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1); // Exit if database connection fails
});

// ✅ Routes - Connect all API endpoints
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes); // Authentication routes

const reportRoutes = require("./routes/reports");
app.use("/api/reports", reportRoutes); // Emergency report routes

const emergenciesRoutes = require("./routes/emergencies"); 
app.use("/api/emergencies", emergenciesRoutes); // Emergency data routes

const announcementRoute = require("./routes/announcement")(io); // Announcement routes with socket.io
app.use("/api/announcement", announcementRoute);

// ✅ Health Check - Simple endpoint to test if server is working
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    serverTime: new Date().toISOString(),
  });
});

// ✅ Root endpoint - Welcome message
app.get('/', (req, res) => {
  res.json({ 
    message: 'ZAPALERT Backend API is running! 🚀',
    endpoints: {
      signup: 'POST /api/signup',
      login: 'POST /api/login',
      pending: 'GET /api/pending-users'
    }
  });
});

// ✅ Error Handler - Catch all errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ✅ 404 Catch - Handle unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// ✅ Start Server - Launch the application
server.listen(PORT, () => {
  const serverUrl =
    process.env.NODE_ENV === "production"
      ? "https://zapalert-backend.onrender.com" // Production URL
      : `http://localhost:${PORT}`; // Development URL

  console.log(`ZAPALERT Backend running on port ${PORT}`);
  console.log(`Server URL: ${serverUrl}`);
});