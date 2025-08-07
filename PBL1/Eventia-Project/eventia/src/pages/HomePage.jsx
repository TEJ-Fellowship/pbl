import React from "react";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Sidediv from "../components/Sidediv";
import "../css/HomePage.css";
function HomePage({events,setEvents}) {
  return (

    <div className="main-calendar" >
      <Sidediv setEvents={setEvents} events={events}/>
        <Calendar events={events} setEvents={setEvents}/>

    </div>
  );
}

export default HomePage;
