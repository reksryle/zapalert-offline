// frontend/src/api/axios.js
import axios from "axios";

// Create a pre-configured axios instance for all API calls
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Backend server URL from environment variables
  withCredentials: true, // Always send/receive cookies (for zapToken authentication)
});

export default instance; // Export for use in other components