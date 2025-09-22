// utils/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api", // adjust if your backend URL differs
});

// ✅ Attach token from sessionStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
