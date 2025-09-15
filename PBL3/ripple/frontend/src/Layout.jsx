import React from 'react';
import Navbar from './components/Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();
  const publicPaths = ['/', '/login', '/signup'];

  return (
    <div>
      {!publicPaths.includes(location.pathname.toLowerCase()) && <Navbar />}
      <Outlet />
    </div>
  );
};

export default Layout;
