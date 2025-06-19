import { useState } from "react";
import { User, Settings } from "lucide-react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      {/* Main Content */}
      <Outlet />

      <Navbar />
    </div>
  );
};

export default AuthLayout;
