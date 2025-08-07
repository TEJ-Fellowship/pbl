import { useState } from "react"
import './App.css'
import './Dashboard.css'
import Navbar from "./Navbar.jsx";
import Dashboard from "./components/Dashboard";
function App() {
  const [showDashboard, setShowDashboard] = useState(false)
  // console.log("showDashboard:", showDashboard); // Add this line


  return (
    <>

      {/* <Navbar/> */}
      {showDashboard ? <Dashboard /> : <Navbar setShowDashboard={setShowDashboard} />
      }


      {/* <div style={{  width: "100vw" ,height:"100vh"}}>
        <Dashboard/>
      </div> */}

    </>
  );
}

export default App;
