import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Sidediv from "../components/Sidediv";
import "../css/HomePage.css";
function HomePage({events,setEvents,selectedCountry}) {
  const [showHolidays, setShowHolidays] = useState(true);
  return (

    <div className="main-calendar" >
      <Sidediv setEvents={setEvents} events={events} showHolidays={showHolidays} setShowHolidays={setShowHolidays} />
      <Calendar events={events} setEvents={setEvents} showHolidays={showHolidays} selectedCountry={selectedCountry} />

    </div>
  );
}

export default HomePage;
