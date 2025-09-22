import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Home from "./Home"; // reuse your existing canvas/home component

export default function RoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("rooms") || "[]");
      const found = stored.find((r) => r.id.toString() === id);
      setRoom(found || null);
    } catch (e) {
        setRoom(null);
      }
  }, [id]);

  const leaveRoom = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("rooms") || "[]");
      const updated = stored.map((r) =>
        r.id.toString() === id
          ? { ...r, participants: Math.max(0, (Number(r.participants) || 1) - 1) }
          : r
      );
      localStorage.setItem("rooms", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update participant count", e);
    }
    navigate("/my-room");
  };

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
      <div className="bg-[#1a2b20] p-4 text-white flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{room.name}</h2>
          <p className="text-sm text-gray-400">
            {room.participants} participant{room.participants !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={leaveRoom}
            className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="flex-1">
        {/* reuse your Home canvas component */}
        <Home roomId={id}/>
      </div>
    </div>
  );
}
