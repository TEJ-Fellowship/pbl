import { useState, useEffect, useCallback } from "react";
import Calendar from "./components/Calendar.jsx";
import Login from "./components/login.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data?.displayName ? { displayName: data.displayName } : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setUser(data?.displayName ? { displayName: data.displayName } : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onFocus = () => fetchProfile();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchProfile]);

  const handleLogout = () => {
    window.location.href = `${API_URL}/auth/logout`;
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
