// TODO: This is a dummy auth context, will replace with the actual auth context later.
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
  } from "react";
  
  const AuthContext = createContext(null);
  
  export function AuthProvider({ children }) {
    // Dummy auth state: start false so guards/redirects work immediately later.
    const [isAuthenticated, setIsAuthenticated] = useState(false);
  
    const login = useCallback(() => {
      setIsAuthenticated(true);
    }, []);
  
    const logout = useCallback(() => {
      setIsAuthenticated(false);
    }, []);
  
    const value = useMemo(
      () => ({ isAuthenticated, login, logout }),
      [isAuthenticated, login, logout]
    );
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error("useAuth must be used inside <AuthProvider>.");
    }
    return ctx;
  }
