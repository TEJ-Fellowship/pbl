import React from 'react'
import ReactDOM from 'react-dom/client'
import Navbar from './Components/Navbar/Navbar'
import HomePage from './Components/Home-page/HomePage.jsx'

const App = () => {
  return (
    <>
    <div className='navbar'>
      <Navbar/>
    </div>
    <HomePage />
    </>
  )
}

export default App
