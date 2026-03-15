import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

const DEFAULT_ROOMS = [
  { id: 1, name: "Room 1: Collaborative Canvas", participants: 2 },
  { id: 2, name: "Room 2: Doodle Together", participants: 4 },
  { id: 3, name: "Room 3: Shared Sketchpad", participants: 1 },
  { id: 4, name: "Room 4: Creative Space", participants: 3 },
  { id: 5, name: "Room 5: Drawing Circle", participants: 2 },
  { id: 6, name: "Room 6: Art Jam", participants: 5 },
];

export default function R() {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState(1);

  // Load rooms from localStorage or defaults
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("rooms") || "null");
    if (stored && Array.isArray(stored) && stored.length > 0) {
      setRooms(stored);
    } else {
      localStorage.setItem("rooms", JSON.stringify(DEFAULT_ROOMS));
      setRooms(DEFAULT_ROOMS);
    }
  }, []);

  // Save rooms to localStorage when updated
  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  }, [rooms]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;

    const newRoom = {
      id: Date.now(),
      name: roomName,
      participants: participants,
    };

    setRooms((prev) => [...prev, newRoom]);
    setRoomName("");
    setParticipants(1);
    setShowModal(false);
  };

  return (
    <div className="h-full bg-[#0f1c14] text-white px-12 py-8">
      {/* Header row with title + right side controls */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Available Rooms</h2>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full"
          >
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

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#1a2b20] p-6 rounded-lg shadow-lg w-96 relative">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4">Create a Room</h3>

            {/* Room Name */}
            <div className="mb-4">
              <label className="block mb-1">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none"
                placeholder="Enter room name"
              />
            </div>

            {/* Participants */}
            <div className="mb-4">
              <label className="block mb-1">Participants</label>
              <input
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
