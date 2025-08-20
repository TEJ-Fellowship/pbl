import './App.css'
import Dashboard from './components/Dashboard'
import {useState} from "react"
function App() {

  const [activeSection,setActiveSection] = useState("dashboard")

  return (
    <>
    <Dashboard activeSection={activeSection} setActiveSection={setActiveSection}/>
    </>
  )
}

export default App 