import React from "react";
import { useState,useEffect } from "react";
import axios from 'axios';

import Sidebar from "./Sidebar";
import Home from "./Home";
import Goal from "./Goal";

function Dashboard() {

  const [activeSection, setActiveSection] = useState("home");
  const [allGoals, setAllGoals] = useState([]); //store goals

  useEffect(()=>{
    axios.get('http://localhost:3001/goals').then(res => setAllGoals(res.data))
  },[])







  const addGoal = (goal) => {
    setAllGoals((prevGoals) => [...prevGoals, goal]); // Assuming `setGoals` is used to manage the list of goals
  };

  return (
    <div
      className="parent"
      style={{ width: "100vw", height: "100vh", display: "flex" }}
    >
      <Sidebar setActiveSection={setActiveSection} />

      <div className="right">
        {activeSection === "home" && (
          <Home goals={allGoals} setAllGoals={setAllGoals} />
        )}
        {activeSection === "goals" && (
          <Goal addGoal={addGoal} setActiveSection={setActiveSection} />
        )}
        {activeSection === "calendar" && <h1>📅 View Calendar</h1>}
      </div>
    </div>
  );
}

export default Dashboard;
