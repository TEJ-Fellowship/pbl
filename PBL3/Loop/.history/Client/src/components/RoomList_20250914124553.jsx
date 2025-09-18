// components/MyRoomPage.jsx
import React from "react";
import Navbar from "./Navbar";

export default function RoomList() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <h2 className="text-2xl">My Room Page</h2>
      </div>
    </div>
  );
}
