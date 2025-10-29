import { io } from "socket.io-client";

// Create connection to Socket.IO server for real-time features
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,     // Send cookies for authentication
  autoConnect: false,        // Don't connect automatically - we'll connect when needed
  reconnection: true,        // Automatically reconnect if connection drops
  reconnectionAttempts: Infinity, // Keep trying to reconnect forever
  reconnectionDelay: 1000,   // Wait 1 second between reconnect attempts
  transports: ["websocket"], // Use WebSocket protocol (faster than HTTP polling)
});

export default socket;