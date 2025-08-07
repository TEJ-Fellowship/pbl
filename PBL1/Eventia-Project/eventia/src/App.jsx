import React, { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import "./css/Navbar.css";
import "./App.css";
import eventsData from "./data.json";
const STORAGE_KEY = "eventia-events";
import GeminiApi from "./GeminiApi";
function App() {
  const saveEventsToStorage = (eventsData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
  };
  const getEventsFromStorage = () => {
    const storedEvents = localStorage.getItem(STORAGE_KEY);
    return storedEvents ? JSON.parse(storedEvents) : null;
  };
  const [theme, setTheme] = useState("light");
  const [events, setEvents] = useState(() => {
    try {
      const storedEvents = getEventsFromStorage();
      return storedEvents || eventsData;
    } catch (error) {
      return eventsData;
    }
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents =
    searchTerm.length > 0
      ? events.filter(
          (event) =>
            event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : events;

  useEffect(() => {
    saveEventsToStorage(events);
  }, [events]);
  return (
    <>
      <div className={`container ${theme}`}>
        <Navbar
          theme={theme}
          setTheme={setTheme}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <HomePage events={filteredEvents} setEvents={setEvents} />
        <GeminiApi events={events}/>
      </div>
    </>
  );
}

export default App;
