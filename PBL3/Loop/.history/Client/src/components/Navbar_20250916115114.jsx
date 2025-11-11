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
      {/* Logo */}
      <h1 className="text-xl font-bold absolute left-6">Loop</h1>

      {/* Links */}
  <div className="flex space-x-6 mx-auto">
    <Link to="/home" className="hover:text-yellow-300">Home</Link>
    <Link to="/gallery" className="hover:text-yellow-300">Gallery state={{ roomId: currentRoom._id, }}</Link>
    <Link to="/my-room" className="hover:text-yellow-300">My Room</Link>
  </div>

      {/* Right side: Invite button (only on Home) + Profile */}
      <div className="flex items-center space-x-4 absolute right-6">
        {location.pathname === "/home" && (
          <button
            onClick={() => alert("Invite link copied!")}
            className="bg-yellow-400 text-black px-3 py-1 rounded-lg hover:bg-yellow-300 shadow"
          >
            Invite
          </button>
        )}

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-600"
          >
            {user?.username || "Profile"}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-2 font-medium border-b border-gray-200">
                {user?.username}
</div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
