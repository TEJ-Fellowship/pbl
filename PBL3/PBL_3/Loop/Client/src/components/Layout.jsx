import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar /> {/* Always visible */}
      <div className="flex-1">
        <Outlet /> {/* Pages render here */}
      </div>
    </div>
  );
}
