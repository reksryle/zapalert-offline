// src/socket.js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // keep this if you want manual control
  reconnection: true, // ✅ auto retry when connection drops
  reconnectionAttempts: Infinity, // keep retrying forever
  reconnectionDelay: 1000, // wait 1s between retries
  transports: ["websocket"], // ✅ force WebSocket (faster than polling)
});

export default socket;
