import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="w-full bg-blue-800 text-white flex items-center justify-between px-6 py-3 shadow-md">
      <h1 className="text-xl font-bold">My App</h1>

    <div className="w-full bg-blue-800 text-white flex items-center px-6 py-3 shadow-md relative">
  <h1 className="text-xl font-bold absolute left-6">My App</h1>
  <div className="flex space-x-6 mx-auto">
    <Link to="/home" className="hover:text-yellow-300">Home</Link>
    <Link to="/gallery" className="hover:text-yellow-300">Gallery</Link>
    <Link to="/my-room" className="hover:text-yellow-300">My Room</Link>
  </div>
</div>

    </div>
  );
}
