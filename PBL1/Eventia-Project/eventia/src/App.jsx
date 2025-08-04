import React, { useState } from 'react'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import './css/Navbar.css'
import './App.css'

function App() {

  const [theme, setTheme] = useState('light');

  return (
    <>
      <div className={`container ${theme}`}>
        <HomePage />
        <Navbar theme={theme} setTheme={setTheme} />
      </div>
    </>
  )
}

export default App