// src/components/RoomList.jsx
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to generate unique room codes
const generateRoomCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export default function RoomList() {
  const navigate = useNavigate();

  // Lazy init from localStorage to avoid overwrite-on-mount
  const [rooms, setRooms] = useState(() => {
    try {
      const raw = localStorage.getItem("rooms");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse rooms from localStorage", e);
      return [];
    }
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState(1);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinCode, setJoinCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Persist whenever rooms change
  useEffect(() => {
    try {
      localStorage.setItem("rooms", JSON.stringify(rooms));
    } catch (e) {
      console.error("Failed to save rooms to localStorage", e);
    }
  }, [rooms]);

  const handleCreateRoom = () => {
    const name = (roomName || "").trim();
    if (!name) return;

    const newRoom = {
      id: Date.now(),
      name,
      participants: Number(participants) || 1,
      code: generateRoomCode(),
    };

    // Prepend so newest appears first
    setRooms((prev) => [newRoom, ...prev]);
    setRoomName("");
    setParticipants(1);
    setShowCreateModal(false);
  };

  const handleJoinClick = (room) => {
    setSelectedRoom(room);
    setJoinCode("");
    setShowJoinModal(true);
  };

  const confirmJoin = () => {
    if (!selectedRoom) return;
    if (joinCode.trim().toUpperCase() !== selectedRoom.code) {
      alert("Invalid room code ❌");
      return;
    }

    // increment participant count (persisted by effect)
    setRooms((prev) =>
      prev.map((r) =>
        r.id === selectedRoom.id
          ? { ...r, participants: (Number(r.participants) || 0) + 1 }
          : r
      )
    );

      setShowJoinModal(false);
    navigate(`/room/${selectedRoom.id}`);
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-[#0f1c14] text-white px-4 sm:px-8 lg:px-12 py-6 sm:py-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold">Available Rooms</h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <input
            id="search-rooms-input"
            name="searchQuery"
            type="text"
            placeholder="Search rooms"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto bg-[#1a2b20] px-4 py-2 rounded-full focus:outline-none border border-gray-700"
          />

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg w-full sm:w-auto justify-center"
          >
            <Plus className="mr-2" /> Create Room
          </button>
        </div>
      </div>

      {/* Room List */}
      {loading ? (
        <p className="text-gray-400">Loading rooms...</p>
      ) : filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="mb-4 text-center">
            {rooms.length === 0
              ? "No rooms available. Create one to get started!"
              : `No rooms match "${searchQuery}".`}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
          >
            Create Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              className="bg-[#1a2b20] rounded-lg p-4 sm:p-6 shadow-md flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-lg sm:text-xl">{room.name}</h3>
                <p className="text-sm text-gray-400">
                  {room.players?.length || 0} player
                  {(room.players?.length || 0) !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Code: <span className="font-mono">{room.code}</span>
                </p>
                <p className="text-sm mt-1">
                  Status:{" "}
                  <span
                    className={room.isActive ? "text-green-400" : "text-red-400"}
                  >
                    {room.isActive ? "Active" : "Deactivated"}
                  </span>
                </p>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                <button
                  onClick={() => handleJoinClick(room)}
                  className={`py-2 px-4 rounded-lg text-center ${
                    room.isActive
                      ? "bg-green-700 hover:bg-green-600"
                      : "bg-gray-600 cursor-not-allowed"
                  }`}
                  disabled={!room.isActive}
                >
                  Join
                </button>

                <button
                  onClick={() => toggleRoomStatus(room._id)}
                  className={`py-2 px-4 rounded-lg text-center ${
                    room.isActive
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-green-600 hover:bg-green-500"
                  }`}
                >
                  {room.isActive ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(room.code);
                    alert("Copied room code to clipboard");
                  }}
                  className="text-xs text-gray-400 underline py-2 px-4 text-center"
                >
                  Copy Code
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------ Create Room Modal ------------------ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a2b20] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-[#0f1c14] px-4 py-2 rounded-lg border border-gray-700 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ Join Room Modal ------------------ */}
      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a2b20] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Join Room: {selectedRoom.name}
            </h3>
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full bg-[#0f1c14] px-4 py-2 rounded-lg border border-gray-700 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmJoin}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600"
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
