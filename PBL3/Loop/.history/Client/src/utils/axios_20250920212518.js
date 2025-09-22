// src/utils/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api", // adjust if your backend URL differs
});

// Optional: add interceptors for tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
