import React from "react";

export default function Navbar() {
  return (
    <div className="w-full bg-blue-800 text-white flex items-center justify-between px-6 py-3 shadow-md">
      {/* Left: Brand or Title */}
      <h1 className="text-xl font-bold">My App</h1>

      {/* Right: Nav Links */}
      <div className="flex space-x-6">
        <button className="hover:text-yellow-300">Home</button>
        <button className="hover:text-yellow-300">Gallery</button>
        <button className="hover:text-yellow-300">My Room</button>
      </div>
    </div>
  );
}
