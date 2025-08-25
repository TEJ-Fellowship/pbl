import "./App.css";
import DashboardLayout from "./components/DashboardLayout.jsx";
import { useState } from "react";
import "./App.css";
// import Dashboard from './components/Dashboard'
// import {useState} from "react"


// import LandingPage from "./pages/LandingPage";
// import Dashboard from "./components/Dashboard";


function App() {
  // const [showDashboard, setShowDashboard] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  // <div className="m-0 p-0">

  //   <DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}/>
  // </div>

  // const [activeSection,setActiveSection] = useState("dashboard")

  return (
    <>
      {/* <Dashboard activeSection={activeSection} setActiveSection={setActiveSection}/> */}

      {/* {showDashboard ? (
        <DashboardLayout />
      ) : (
        <LandingPage
          showDashboard={showDashboard}
          setShowDashboard={setShowDashboard}
        />
      )} */}

      <DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}/>
    </>
  );
}

export default App;
