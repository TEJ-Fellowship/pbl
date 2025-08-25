import "./App.css";
// import Dashboard from './components/Dashboard'
// import {useState} from "react"
import LandingPage from "./pages/LandingPage";
import Dashboard from "./components/Dashboard";
import { useState } from "react";
function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <>
      {showDashboard ? (
        <Dashboard
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      ) : (
        <LandingPage
          showDashboard={showDashboard}
          setShowDashboard={setShowDashboard}
        />
      )}
    </>
  );
}

export default App;
