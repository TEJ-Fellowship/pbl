import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const navigate = useNavigate();

  // Generate or retrieve anonymous user ID
  const generateAnonymousUser = () => {
    let anonymousId = localStorage.getItem("anonymousUserId");

    if (!anonymousId) {
      // Generate new UUID for anonymous user
      anonymousId = crypto.randomUUID();
      localStorage.setItem("anonymousUserId", anonymousId);
      localStorage.setItem("anonymousCreatedAt", new Date().toISOString());
    }

    const anonymousUser = {
      id: anonymousId,
      name: "Guest User",
      email: null,
      isAnonymous: true,
      createdAt: localStorage.getItem("anonymousCreatedAt"),
    };

    return anonymousUser;
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          // Verify token is still valid
          const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const realUser = JSON.parse(storedUser);
            setUser(realUser);
            setIsAnonymous(false);
          } else {
            // Token invalid, clear storage and create anonymous user
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");

            const anonUser = generateAnonymousUser();
            setUser(anonUser);
            setIsAnonymous(true);
          }
        } else {
          // No token - create anonymous user
          const anonUser = generateAnonymousUser();
          setUser(anonUser);
          setIsAnonymous(true);

          // Load message count for anonymous user
          const savedCount = localStorage.getItem("anonymousMessageCount");
          setMessageCount(savedCount ? parseInt(savedCount, 10) : 0);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Fallback to anonymous user on error
        const anonUser = generateAnonymousUser();
        setUser(anonUser);
        setIsAnonymous(true);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Increment message count for anonymous users
  const incrementMessageCount = () => {
    if (isAnonymous) {
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      localStorage.setItem("anonymousMessageCount", newCount.toString());

      // Show signup prompt after 5 messages
      if (newCount >= 5) {
        setShowSignupPrompt(true);
      }
    }
  };

  // Clear anonymous user data
  const clearAnonymousData = () => {
    localStorage.removeItem("anonymousUserId");
    localStorage.removeItem("anonymousCreatedAt");
    localStorage.removeItem("anonymousMessageCount");
    setMessageCount(0);
    setShowSignupPrompt(false);
  };

  // Register user (with optional session migration)
  const register = async (name, email, password, migrateSession = true) => {
    try {
      setError(null);

      // Get anonymous user ID if exists
      const anonymousUserId = isAnonymous ? user?.id : null;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          anonymousUserId: migrateSession ? anonymousUserId : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Save tokens and user
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      setUser(data.data.user);
      setIsAnonymous(false);

      // Clear anonymous data after successful migration
      if (migrateSession && anonymousUserId) {
        clearAnonymousData();
      }

      return {
        success: true,
        user: data.data.user,
        migrated: !!anonymousUserId,
      };
    } catch (err) {
      const errorMessage = err.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);

      // Get anonymous user ID from localStorage if exists (for session transfer)
      const anonymousUserId = localStorage.getItem("stripe_anonymous_user_id");

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          anonymousUserId: anonymousUserId || null, // Send for session transfer
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save tokens and user
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      setUser(data.data.user);
      setIsAnonymous(false);

      // Set previous state to anonymous BEFORE updating to authenticated
      // This ensures the login detection in useIntegratedChat works correctly
      if (!localStorage.getItem("previous_is_anonymous")) {
        localStorage.setItem("previous_is_anonymous", "true");
      }
      if (!localStorage.getItem("previous_user_id") && anonymousUserId) {
        localStorage.setItem("previous_user_id", anonymousUserId);
      }

      // Log session migration info if sessions were migrated
      if (data.data.migratedSessions > 0) {
        console.log(
          `✅ ${data.data.migratedSessions} session(s) migrated to your account`
        );
      } else if (anonymousUserId) {
        console.log(
          `ℹ️ No sessions found to migrate (anonymousUserId: ${anonymousUserId})`
        );
      }

      // Clear anonymous user ID after successful transfer (but keep session ID)
      // The session will be transferred to the authenticated user
      if (anonymousUserId) {
        localStorage.removeItem("stripe_anonymous_user_id");
      }

      // Clear other anonymous data after login
      clearAnonymousData();

      return {
        success: true,
        user: data.data.user,
        migratedSessions: data.data.migratedSessions || 0,
      };
    } catch (err) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout user
  const logout = () => {
    // Clear tokens and user
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Clear all chat session data to prevent showing previous user's conversations
    localStorage.removeItem("stripe_integrated_current_session");
    localStorage.removeItem("stripe_current_session");
    localStorage.removeItem("chatHistory");
    localStorage.removeItem("integratedChatHistory");

    // Clear any other session-related keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("session_") || key.includes("chat")) {
        localStorage.removeItem(key);
      }
    });

    // Create new anonymous user after logout
    const anonUser = generateAnonymousUser();
    setUser(anonUser);
    setIsAnonymous(true);
    setMessageCount(0);
    setShowSignupPrompt(false);

    navigate("/");
  };

  // Dismiss signup prompt
  const dismissSignupPrompt = () => {
    setShowSignupPrompt(false);
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get profile");
      }

      // Update user with full profile data
      const updatedUser = data.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMessage = err.message || "Failed to get profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update user
      const updatedUser = { ...user, ...data.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMessage = err.message || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err.message || "Failed to change password";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");

      if (!refreshTokenValue) {
        throw new Error("No refresh token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to refresh token");
      }

      // Save new token
      localStorage.setItem("token", data.data.token);

      return { success: true };
    } catch (err) {
      // Refresh failed, logout user
      logout();
      return { success: false, error: err.message };
    }
  };

  // Get auth token
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user && !isAnonymous,
    isAnonymous,
    messageCount,
    showSignupPrompt,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    refreshToken,
    getToken,
    incrementMessageCount,
    dismissSignupPrompt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
