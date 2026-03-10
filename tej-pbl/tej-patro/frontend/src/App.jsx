import { useState, useEffect } from "react";
import Calendar from "./components/Calendar.jsx";
import Login from "./components/Login.jsx";
import { API_URL } from "./config/env.js";
import Navbar from "./components/Navbar.jsx";

function App() {
  console.log("App");
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/profile`, { credentials: "include" })
      .then((res) => res.text())
      .then((html) => {
        if (cancelled) return;
        console.log("html", html);
        if (html.includes("Not logged in")) {
          setUser(null);
          return;
        }
        const nameMatch = html.match(/Name:\s*([^<]+)/);
        const emailMatch = html.match(/Email:\s*([^<]+)/);
        setUser(
          nameMatch
            ? {
                displayName: nameMatch[1].trim(),
                email: emailMatch?.[1]?.trim() ?? null,
              }
            : null,
        );
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    window.location.href = `${API_URL}/logout`;
  };

  return (
    <div className="App">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
        onGoToToday={() => setCalendarDate(new Date())}
      />
      {showLogin ? (
        <Login onBack={() => setShowLogin(false)} />
      ) : (
        <Calendar current={calendarDate} onDateChange={setCalendarDate} />
      )}
    </div>
  );
}

export default App;
