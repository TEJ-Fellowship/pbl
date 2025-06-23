import React, { createContext, useState, useEffect, useContext } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await authApi.verifyAuth();
        if (response.authenticated) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
