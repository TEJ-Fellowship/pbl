import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Logic to verify session with backend
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const data = await res.json();
      const nextUser = data?.user ?? null;
      setUser(nextUser);
      setIsAuthenticated(Boolean(nextUser));
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. The 'login' function your UI components call after successful form submission
  const login = useCallback(() => {
    // Re-verify with server to get the user object now that cookie is set
    checkAuth();
  }, [checkAuth]);

  // 3. Logout logic
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch {
      // Clear UI state anyway
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 4. Memoize the value to keep the dummy version's performance optimization
  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      loading,
      login,
      logout,
      checkAuth,
    }),
    [isAuthenticated, user, loading, login, logout, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
