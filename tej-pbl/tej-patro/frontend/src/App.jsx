import { useState, useEffect } from "react";
import Calendar from "./components/Calendar.jsx";
import CreateEventForm from "./components/CreateEventForm.jsx";
import EventModal from "./components/EventModal.jsx";
import Login from "./components/Login.jsx";
import { API_URL } from "./config/env.js";
import Navbar from "./components/Navbar.jsx";

function App() {
  console.log("App");
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [showCreateEvent, setCreateEvent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => res.text())
      .then((userData) => {
        if (cancelled) return;
        if (userData.includes("Not logged in")) {
          setUser(null);
          return;
        }
        const userObj = JSON.parse(userData).displayName;
        setUser(userObj);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    window.location.href = `${API_URL}/auth/logout`;
  };

  return (
    <div className="App">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
        onGoToToday={() => setCalendarDate(new Date())}
        onAddEvent={() => setCreateEvent(true)}
      />
      {showCreateEvent && (
        <EventModal title="Create event" onClose={() => setCreateEvent(false)}>
          <CreateEventForm onClose={() => setCreateEvent(false)} />
        </EventModal>
      )}
      {showLogin ? (
        <Login onBack={() => setShowLogin(false)} />
      ) : (
        <Calendar current={calendarDate} onDateChange={setCalendarDate} />
      )}
    </div>
  );
}

export default App;
