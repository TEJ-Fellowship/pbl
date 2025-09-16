import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const DEFAULT_ROOMS = [
  { id: 1, name: "Room 1: Collaborative Canvas", participants: 2 },
  { id: 2, name: "Room 2: Doodle Together", participants: 4 },
  { id: 3, name: "Room 3: Shared Sketchpad", participants: 1 },
  { id: 4, name: "Room 4: Creative Space", participants: 3 },
  { id: 5, name: "Room 5: Drawing Circle", participants: 2 },
  { id: 6, name: "Room 6: Art Jam", participants: 5 },
];

export default function MyRoomPage() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("rooms") || "null");
    if (stored && Array.isArray(stored) && stored.length > 0) {
      setRooms(stored);
    } else {
      localStorage.setItem("rooms", JSON.stringify(DEFAULT_ROOMS));
      setRooms(DEFAULT_ROOMS);
    }
  }, []);

  return (
    <div className="h-full bg-[#0f1c14] text-white px-12 py-8">
      {/* Header row with title + right side controls */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Available Rooms</h2>

        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full">
            <Plus size={18} />
            <span>Create Room</span>
          </button>
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="profile"
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search rooms"
          className="w-full max-w-md bg-[#1a2b20] px-4 py-2 rounded-full focus:outline-none border border-gray-700"
        />
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-[#1a2b20] rounded-lg p-6 shadow-md flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold">{room.name}</h3>
              <p className="text-sm text-gray-400">
                {room.participants} participant
                {room.participants !== 1 ? "s" : ""}
              </p>
            </div>
            <button className="mt-4 bg-green-700 hover:bg-green-600 py-2 rounded-lg">
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
