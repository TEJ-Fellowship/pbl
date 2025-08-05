import React from "react";
import Sidebar from "./Sidebar";
import Home from "./Home";
import { useState } from "react";
import Categories from "./Categories";
function Dashboard() {
  const [activeSection, setActiveSection] = useState("home");
 

  return (
    <div class="parent" style={{ width: "100vw", height: "100vh", display:"flex" }}>
      <Sidebar setActiveSection={setActiveSection} />


      <div style={{ flexGrow: 1, padding: "20px" }}>
      {activeSection === 'home' && <h1>🏠 <Home/></h1>}
        {activeSection === 'categories' && <Categories/>}
        {activeSection === 'goals' && <h1>🎯 Set Your Goals</h1>}
        {activeSection === 'calendar' && <h1>📅 View Calendar</h1>}

      </div>
    </div>
  );
}

export default Dashboard;
