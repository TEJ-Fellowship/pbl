import { useState, useEffect, useCallback } from "react";
import Calendar from "./components/Calendar.jsx";
import Login from "./components/Login.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { credentials: "include" });
      const html = await res.text();
      if (html.includes("Not logged in")) {
        setUser(null);
        return;
      }
      const match = html.match(/Name:\s*([^<]+)/);
      if (match) {
        setUser({ displayName: match[1].trim() });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/profile`, { credentials: "include" })
      .then((res) => res.text())
      .then((html) => {
        if (cancelled) return;
        if (html.includes("Not logged in")) {
          setUser(null);
          return;
        }
        const match = html.match(/Name:\s*([^<]+)/);
        setUser(match ? { displayName: match[1].trim() } : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onFocus = () => fetchProfile();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchProfile]);

  const handleLogout = () => {
    window.location.href = `${API_URL}/logout`;
  };

  return (
    <div className="App">
      {showLogin ? (
        <Login onBack={() => setShowLogin(false)} />
      ) : (
        <Calendar
          onLoginClick={() => setShowLogin(true)}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
