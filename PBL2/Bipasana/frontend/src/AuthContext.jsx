import React, { useEffect, useState, createContext } from "react";
export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  function handleLogout() {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  }
  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  function isTokenValid(token) {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  }

  useEffect(() => {
    const StoredToken = localStorage.getItem("token");
    if (StoredToken && isTokenValid(StoredToken)) {
      setToken(StoredToken);
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem("token");
      setToken(null);
      setIsLoggedIn(false);
    }
  }, []);
  return (
    <AuthContext.Provider
      value={{ isLoggedIn, handleLogout,setIsLoggedIn, user, setUser, token,setToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
