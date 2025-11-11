import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Home from "./Home";

export default function RoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("rooms") || "[]");
    const found = stored.find((r) => r.id.toString() === id);
    setRoom(found || null);
  }, [id]);

  if (!room) {
    return (
      <div className="h-full flex flex-col justify-center items-center text-white bg-[#0f1c14]">
        <p className="mb-4">Room not found 😢</p>
        <button
          onClick={() => navigate("/my-room")}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
        >
          Back to Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[#1a2b20] p-4 text-white flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{room.name}</h2>
          <p className="text-sm text-gray-400">
            {room.participants} participant
            {room.participants !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/my-room")}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
        >
          Leave Room
        </button>
      </div>

      {/* Drawing canvas (Home component) */}
      <div className="flex-1">
        <Home />
      </div>
    </div>
  );
}
