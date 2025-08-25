import React from 'react'
import Navbar from './components/Navbar'
import { Outlet } from 'react-router-dom'
function Layout ({setIsLoggedIn, isLoggedIn}) {
  return (
    <div>
        <Navbar setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn}/>
        
            <Outlet />
    </div>
  )
}

export default Layout

