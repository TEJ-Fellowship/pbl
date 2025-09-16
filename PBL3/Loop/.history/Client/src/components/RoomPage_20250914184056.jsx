import React from "react";
import { useParams } from "react-router-dom";
import Home from "./Home"; // reuse your canvas/drawing page

export default function RoomPage() {
  const { id } = useParams();

  return (
    <div className="h-full">
      {/* Could show room info on top */}
      <div className="bg-[#1a2b20] p-4 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Room ID: {id}</h2>
        <p className="text-gray-400">You're inside this room 🎨</p>
      </div>

      {/* Reuse Home page for drawing area */}
      <Home />
    </div>
  );
}
