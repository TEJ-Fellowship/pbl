import { createContext, useEffect, useState, useCallback } from "react";
import { verifyAuth, loginAuth, registerAuth, logoutAuth } from "../api/auth";
import { getUserDashboard } from "../api/users";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const response = await verifyAuth();
        if (response.authenticated) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error verifying auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (data) => {
    const response = await loginAuth(data);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const register = async (data) => {
    const response = await registerAuth(data);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    console.log("AuthContext logout called");
    try {
      const response = await logoutAuth();
      console.log("AuthContext logout response:", response);

      // Always clear user state on logout attempt
      setUser(null);
      console.log("User state cleared");

      return response;
    } catch (error) {
      console.error("AuthContext logout error:", error);
      // Even if logout fails, clear user state
      setUser(null);
      console.log("User state cleared despite error");
      return { success: false, error: error.message };
    }
  };

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await getUserDashboard(user.id);
      if (response.data) {
        // Update user with fresh data from backend
        setUser({
          id: response.data._id || response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          karmaPoints: response.data.karmaPoints || 0,
        });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
