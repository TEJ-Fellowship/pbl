import React, { useState } from 'react'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import './css/Navbar.css'
import './App.css'
import eventsData from "./data.json";
function App() {
  const [theme, setTheme] = useState('light');
  const [events,setEvents]=useState(eventsData);

  return (
    <>
      <div className={`container ${theme}`}>
        <Navbar theme={theme} setTheme={setTheme} />
         <HomePage events={events} setEvents={setEvents} />
      </div>
    </>
  )
}

export default App