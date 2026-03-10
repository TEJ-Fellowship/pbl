import { useState, useEffect, useCallback } from "react";
import Calendar from "./components/Calendar.jsx";
import Login from "./components/login.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  const fetchProfile = useCallback(async (options = {}) => {
    const { signal } = options;
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: "include", signal });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (signal?.aborted) return;
      setUser(data?.displayName ? { displayName: data.displayName } : null);
    } catch (err) {
      if (err.name === "AbortError") return;
      setUser(null);
    }
  }, []);
  
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => fetchProfile({ signal: controller.signal }));
    return () => controller.abort();
  }, [fetchProfile]);

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
