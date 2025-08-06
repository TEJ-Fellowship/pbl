import React, { useState } from 'react'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import './css/Navbar.css'
import './App.css'

function App() {

  const [theme, setTheme] = useState('light');
  const [events,setEvents]=useState([]);

  return (
    <>
      <div className={`container ${theme}`}>
        <Navbar theme={theme} setTheme={setTheme} />
         <HomePage />
      </div>
    </>
  )
}

export default App