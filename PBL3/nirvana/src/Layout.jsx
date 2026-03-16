import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
function Layout({streak}) {
  return (
    <>
      <Navbar streak={streak} />
      <main className="max-w-5xl mx-auto">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
