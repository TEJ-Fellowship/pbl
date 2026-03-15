import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to generate unique room codes
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function RoomList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState(1);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinCode, setJoinCode] = useState("");

  // Load rooms from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (stored && Array.isArray(stored)) {
      setRooms(stored);
    }
  }, []);

  // Save rooms to localStorage when updated
  useEffect(() => {
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }, [rooms]);

  // Create a new room
  const handleCreateRoom = () => {
    if (!roomName.trim()) return;

    const newRoom = {
      id: Date.now(),
      name: roomName,
      participants,
      code: generateRoomCode(),
    };

    setRooms((prev) => [...prev, newRoom]);
    setRoomName("");
    setParticipants(1);
    setShowCreateModal(false);
  };

  // Open join modal
  const handleJoinClick = (room) => {
    setSelectedRoom(room);
    setShowJoinModal(true);
  };

  // Confirm join with code check
  const confirmJoin = () => {
    if (joinCode.trim().toUpperCase() === selectedRoom.code) {
      navigate(`/room/${selectedRoom.id}`);
    } else {
      alert("Invalid room code ❌");
    }
    setJoinCode("");
    setShowJoinModal(false);
  };

  return (
    <div className="h-full bg-[#0f1c14] text-white px-12 py-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Available Rooms</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
        >
          <Plus className="mr-2" /> Create Room
        </button>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="mb-4">No rooms available. Create one to get started!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
          >
            Create Room
          </button>
        </div>
      ) : (
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
                <p className="text-xs text-gray-500 mt-2">
                  Code: <span className="font-mono">{room.code}</span>
                </p>
              </div>
              <button
                onClick={() => handleJoinClick(room)}
                className="mt-4 bg-green-700 hover:bg-green-600 py-2 rounded-lg"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#1a2b20] p-6 rounded-lg shadow-lg w-96 relative">
            <h3 className="text-xl font-bold mb-4">Create New Room</h3>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
              className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none mb-4"
            />
            <input
              type="number"
              min="1"
              value={participants}
              onChange={(e) => setParticipants(parseInt(e.target.value))}
              className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
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

      {/* Join Room Modal */}
      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#1a2b20] p-6 rounded-lg shadow-lg w-96 relative">
            <h3 className="text-xl font-bold mb-4">
              Join {selectedRoom.name}
            </h3>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter the code"
              className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmJoin}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
