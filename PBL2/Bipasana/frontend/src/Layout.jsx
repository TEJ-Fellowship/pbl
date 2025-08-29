import React from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/SideBar';
import { Outlet } from 'react-router-dom';

function Layout({ setIsLoggedIn, isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? (
        <Sidebar setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Navbar />
      )}
      <Outlet />
    </div>
  );
}

export default Layout;
