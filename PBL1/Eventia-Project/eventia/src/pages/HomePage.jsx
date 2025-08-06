import React from "react";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Sidediv from "../components/Sidediv";
import "../css/HomePage.css";
function HomePage() {
  return (
    <div className="calendarbody">
      <Sidediv/>
        <Calendar />
        
    </div>
  );
}

export default HomePage;
