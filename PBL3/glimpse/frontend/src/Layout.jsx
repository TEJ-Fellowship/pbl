import React from "react";
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

function Layout({isLoggedIn}) {
  return (
    <div>
      {!isLoggedIn && <Navbar />}
      <Outlet />
    </div>
  );
}

export default Layout;
