import { useState } from "react"
import './App.css'
import './Dashboard.css'
import Navbar from "./Navbar.jsx";
import Dashboard from "./components/Dashboard";
function App() {
  const [showDashboard, setShowDashboard] = useState(false)
 
  return (
    <>
      
      {/* <Navbar/> */}
      {showDashboard ? <Dashboard /> : <Navbar setShowDashboard={setShowDashboard} />
}      
      
     

    </>
  );
}

export default App;
