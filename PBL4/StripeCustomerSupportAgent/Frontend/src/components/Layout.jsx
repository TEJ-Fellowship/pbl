import React from "react";
import { Outlet } from "react-router-dom";
import LandingSidebar from "./landingPage/LandingSidebar";

const Layout = () => {
  return (
    <div className="bg-background-dark text-text-dark font-display min-h-screen relative">
      {/* Global Sidebar Menu */}
      <div className="fixed top-6 left-6 z-50">
        <LandingSidebar />
      </div>

      {/* Page Content */}
      <div className="relative">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
