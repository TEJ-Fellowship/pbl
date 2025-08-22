import './App.css';
import DashboardLayout from './components/DashboardLayout.jsx';
import {useState} from "react";
function App() {

  const [activeSection, setActiveSection] = useState("dashboard")

  return (
    <>
    <DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}/>
    </>
  )
}

export default App 