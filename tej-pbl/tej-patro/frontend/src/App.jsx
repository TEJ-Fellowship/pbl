import { useState, useEffect } from "react";
import Calendar from "./components/Calendar.jsx";
import CreateEventForm from "./components/CreateEventForm.jsx";
import EventModal from "./components/EventModal.jsx";
import Login from "./components/Login.jsx";
import { fetchEvents } from "./api/event.js";
import { API_URL } from "./config/env.js";
import Navbar from "./components/Navbar.jsx";

function App() {
  console.log("App");
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [showCreateEvent, setCreateEvent] = useState(false);
  const [events, setEvents] = useState([]);
  console.log("showCreateEvent", showCreateEvent);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => res.text())
      .then((userData) => {
        if (cancelled) return;
        if (userData.includes("Not logged in")) {
          setUser(null);
          setEvents([]);
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

  const refetchEvents = () => {
    if (!user) return;
    fetchEvents()
      .then((data) => {
        console.log("Fetched events from server:", data);
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch events:", err);
        setEvents([]);
      });
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchEvents()
      .then((data) => {
        if (cancelled) return;
        console.log("Fetched events from server:", data);
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to fetch events:", err);
          setEvents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
          <CreateEventForm
            onClose={() => setCreateEvent(false)}
            onSuccess={refetchEvents}
          />
        </EventModal>
      )}
      {showLogin ? (
        <Login onBack={() => setShowLogin(false)} />
      ) : (
        <Calendar current={calendarDate} onDateChange={setCalendarDate} events={events} />
      )}
    </div>
  );
}

export default App;
