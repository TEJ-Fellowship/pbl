import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Home from "./Home";
import api from "../utils/axios"; // ✅ updated import

export default function RoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get("/rooms");
        const found = res.data.find((r) => r._id === id);
        setRoom(found || null);
      } catch (err) {
        console.error("Failed to fetch room", err);
        setRoom(null);
      }
    };
    fetchRoom();
  }, [id]);

  const leaveRoom = async () => {
    try {
      await api.patch(`/rooms/${id}/deactivate`); // mark inactive
    } catch (err) {
      console.error("Failed to leave room", err);
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
            {room.users?.length || 0} participant
            {(room.users?.length || 0) !== 1 ? "s" : ""}
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
        <Home />
      </div>
    </div>
  );
}
