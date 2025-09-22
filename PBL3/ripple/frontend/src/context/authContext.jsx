import { createContext, useContext, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Fetch current user from server
  useEffect(() => {
    async function fetchUser() {
      try {
        let res = await fetch(`${API_URL}/me`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          // try refresh
          const refreshRes = await fetch(`${API_URL}/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (refreshRes.ok) {
            // retry /me
            res = await fetch(`${API_URL}/me`, {
              method: "GET",
              credentials: "include",
            });
          }
        }

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
        console.error(err);
      }
    }

    fetchUser();
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

// Custom hook to get current user
export const useAuth = () => useContext(AuthContext);
