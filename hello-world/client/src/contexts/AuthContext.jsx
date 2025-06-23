import { createContext, useContext, useReducer, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        loading: false,
        isAuthenticated: !!action.payload,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOGOUT":
      return { ...state, user: null, isAuthenticated: false, loading: false };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authApi.me();
      dispatch({ type: "SET_USER", payload: response.data.user });
    } catch (error) {
      dispatch({ type: "SET_USER", payload: null });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authApi.login(email, password);

      // Store token in localStorage
      localStorage.setItem("token", response.data.token);

      dispatch({ type: "SET_USER", payload: response.data.user });
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authApi.register(userData);

      // Store token in localStorage
      localStorage.setItem("token", response.data.token);

      dispatch({ type: "SET_USER", payload: response.data.user });
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem("token");
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("token");
      dispatch({ type: "LOGOUT" });
    }
  };

  const acceptInvite = async (token, userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authApi.acceptInvite(token, userData);
      dispatch({ type: "SET_USER", payload: response.data.user });
      return { success: true, user: response.data.user };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to accept invitation";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const sendInvite = async (inviteData) => {
    try {
      const response = await authApi.sendInvite(inviteData);
      return { success: true, invite: response.data.invite };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send invitation";
      return { success: false, error: message };
    }
  };

  const hasPermission = (permission) => {
    return state.user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const isAdmin = () => {
    return hasRole("admin") || hasRole("instructor");
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    acceptInvite,
    sendInvite,
    hasPermission,
    hasRole,
    isAdmin,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
