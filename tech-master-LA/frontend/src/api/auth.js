import axios from "axios";
import config from "../config/config";

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true, // This is important for cookies
});

const login = async ({ email, password }) => {
  try {
    console.log("login", email, password);
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    // Store token in localStorage for development
    if (response.data.token) {
      console.log("tokennnn", response.data.token);
      localStorage.setItem("authToken", response.data.token);
    }

    console.log("Login response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

const register = async ({ name, email, password, phone, confirmPassword }) => {
  try {
    console.log("register:", name, email, password, phone, confirmPassword);
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      confirmPassword,
      phone,
    });

    // Store token in localStorage for development
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }

    console.log("Registration response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Add an axios interceptor to include the token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const logout = () => {
  localStorage.removeItem("authToken");
};

export { login, register, logout };
