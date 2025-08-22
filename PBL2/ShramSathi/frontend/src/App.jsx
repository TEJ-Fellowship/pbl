import './App.css';
import DashboardLayout from './components/DashboardLayout.jsx';
import {useState} from "react";
function App() {

  const [activeSection, setActiveSection] = useState("dashboard")

  return (
    <div className="m-0 p-0"> 

      <DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}/>
    </div>

  )
}

export default App 