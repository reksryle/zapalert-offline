// frontend/src/api/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Matches your backend
  withCredentials: true, // Send/receive cookies (zapToken)
});

export default instance;
