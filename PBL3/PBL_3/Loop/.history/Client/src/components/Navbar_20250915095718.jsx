import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout(); // clears token in parent
    navigate("/login"); // redirect
  };

  return (
    <div className="w-full bg-gray-800 text-white flex items-center px-6 py-3 shadow-md relative">
  <h1 className="text-xl font-bold absolute left-6">My App</h1>
  <div className="flex space-x-6 mx-auto">
    <Link to="/home" className="hover:text-yellow-300">Home</Link>
    <Link to="/gallery" className="hover:text-yellow-300">Gallery</Link>
    <Link to="/my-room" className="hover:text-yellow-300">My Room</Link>
  </div>
</div>

  );
}
