import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000/api", // change if needed
});

// ✅ attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
