import React from "react";
import { useState } from "react";

import Sidebar from "./Sidebar";
import Home from "./Home";
import Goal from "./Goal";

function Dashboard() {

  const [activeSection, setActiveSection] = useState("home");
  
  const[allGoals,setAllGoals] = useState([]); //store goals


  const addGoal = (newGoal) =>{ 
//newGoal=goal
    setAllGoals([...allGoals,newGoal]);
  }
 




  return (
    <div className="parent" style={{ width: "100vw", height: "100vh", display:"flex" }}>
    
      <Sidebar setActiveSection={setActiveSection} />


      <div className='right'>
      {activeSection === 'home' && <Home goals={allGoals}/>}
        {activeSection === 'goals' && <Goal addGoal = {addGoal} setActiveSection={setActiveSection}/>}
        {activeSection === 'calendar' && <h1>📅 View Calendar</h1>}
      </div>
    </div>
  );
}

export default Dashboard;
