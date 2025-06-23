import axios from "axios";
import config from "../config/config.js";

// Create axios instance with default config
const api = axios.create({
  baseURL: `${config.API_BASE_URL || "http://localhost:5000"}/api`,
  withCredentials: true, // Important for sending cookies
});

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.data?.error || error.message
      );
      return { success: false, error: error.response?.data?.error };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error(
        "Registration failed:",
        error.response?.data?.error || error.message
      );
      return { success: false, error: error.response?.data?.error };
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
      throw error;
    }
  },

  verifyAuth: async () => {
    try {
      const response = await api.get("/auth/verify");
      return response.data;
    } catch (error) {
      console.error(
        "Auth verification failed:",
        error.response?.data || error.message
      );
      // Return a standard unauthenticated response on error
      return { authenticated: false, user: null };
    }
  },
};
