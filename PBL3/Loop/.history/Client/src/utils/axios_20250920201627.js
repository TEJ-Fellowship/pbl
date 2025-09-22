// src/utils/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api", // adjust if your backend runs on another port
  withCredentials: true, // include cookies if using auth
});

// Optional: add interceptors for tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
