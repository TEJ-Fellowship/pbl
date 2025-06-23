import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Only redirect to login if we're not already on a public page
      const currentPath = window.location.pathname;
      const publicRoutes = ["/login", "/invite", "/"];
      const isPublicRoute = publicRoutes.some(
        (route) => currentPath === route || currentPath.startsWith("/invite/")
      );

      if (!isPublicRoute) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Project API functions
export const projectsApi = {
  getAll: () => api.get("/projects"),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  star: (id) => api.post(`/projects/${id}/star`),
  unstar: (id) => api.delete(`/projects/${id}/star`),
  getStarred: () => api.get("/projects/starred"),
};

// Auth API functions
export const authApi = {
  me: () => api.get("/auth/me"),
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  acceptInvite: (token, userData) =>
    api.post("/auth/accept-invite", { token, ...userData }),
  validateInvite: (token) => api.get(`/auth/invite/${token}/validate`),
  sendInvite: (inviteData) => api.post("/auth/invite", inviteData),
  getUsers: () => api.get("/auth/users"),
  getInvites: () => api.get("/auth/invites"),
  updateUserStatus: (userId, status) =>
    api.patch(`/auth/users/${userId}/status`, { status }),
  deleteInvite: (inviteId) => api.delete(`/auth/invites/${inviteId}`),
  resendInvite: (inviteId) => api.post(`/auth/invites/${inviteId}/resend`),
};

export default api;
