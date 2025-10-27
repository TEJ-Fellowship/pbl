import React, { useContext } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/SideBar';
import { Outlet } from 'react-router-dom';
import { AuthContext } from './AuthContext';
function Layout() {
const {isLoggedIn}=useContext(AuthContext)
  return (
    <div>
      {isLoggedIn ? (
        <Sidebar/>
      ) : (
        <Navbar />
      )}
      <Outlet />
    </div>
  );
}

export default Layout;
