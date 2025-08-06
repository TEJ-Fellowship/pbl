import React from "react";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Sidediv from "../components/Sidediv";
import "../css/HomePage.css";
function HomePage({events,setEvents}) {
  return (
    <div className="calendarbody" >
      <Sidediv setEvents={setEvents} events={events}/>
        <Calendar events={events}/>
    </div>
  );
}

export default HomePage;
