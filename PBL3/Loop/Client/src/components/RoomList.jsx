import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios"; // ✅ updated import

export default function RoomList() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinCode, setJoinCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rooms from backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/rooms");
        setRooms(res.data);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const res = await api.post("/rooms", { name: roomName });
      setRooms((prev) => [res.data, ...prev]);
      setRoomName("");
      setShowCreateModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleJoinClick = (room) => {
    setSelectedRoom(room);
    setJoinCode("");
    setShowJoinModal(true);
  };

  const confirmJoin = async () => {
    if (!selectedRoom) return;
    try {
      const res = await api.post("/rooms/join", { code: joinCode });
      // Update participant count locally
      setRooms((prev) =>
        prev.map((r) => (r._id === res.data._id ? res.data : r))
      );
      setShowJoinModal(false);
      navigate(`/room/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join room");
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-[#0f1c14] text-white px-12 py-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Available Rooms</h2>

        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search rooms"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a2b20] px-4 py-2 rounded-full focus:outline-none border border-gray-700"
          />

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
          >
            <Plus className="mr-2" /> Create Room
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="mb-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              className="bg-[#1a2b20] rounded-lg p-6 shadow-md flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold">{room.name}</h3>
                <p className="text-sm text-gray-400">
                  {room.users?.length || 0} participant
                  {(room.users?.length || 0) !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Code: <span className="font-mono">{room.code}</span>
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handleJoinClick(room)}
                  className="bg-green-700 hover:bg-green-600 py-2 px-4 rounded-lg"
                >
                  Join
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(room.code);
                    alert("Copied room code to clipboard");
                  }}
                  className="text-xs text-gray-400 underline"
                >
                  Copy Code
                </button>
              </div>
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
              className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none mb-3"
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
            <h3 className="text-xl font-bold mb-4">Join {selectedRoom.name}</h3>
            <p className="text-sm text-gray-400 mb-3">Enter the room code</p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter code"
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
