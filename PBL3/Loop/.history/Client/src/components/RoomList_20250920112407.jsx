import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

export default function RoomList() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinCode, setJoinCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // reusable fetch
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
  if (!roomName.trim()) return;
  try {
    await api.post("/rooms", { name: roomName });
    setRoomName("");
    setShowCreateModal(false);
    await fetchRooms(); // 🔑 refetch from DB with populated players
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
    if (!selectedRoom.isActive) {
      alert("This room is deactivated and cannot be joined.");
      return;
    }
    try {
      const res = await api.post("/rooms/join", { code: joinCode });
      setShowJoinModal(false);
      await fetchRooms(); // refresh from DB
      navigate(`/room/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join room");
    }
  };

  const toggleRoomStatus = async (roomId) => {
    try {
      await api.patch(`/rooms/${roomId}/toggle`);
      await fetchRooms(); // refresh from DB
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle room status");
    }
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

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a2b20] p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Create New Room</h3>

            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
              className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none mb-3"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded w-full sm:w-auto"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a2b20] p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              Join {selectedRoom.name}
            </h3>
            <p className="text-sm text-gray-400 mb-3">Enter the room code</p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter code"
              className="w-full bg-[#0f1c14] px-3 py-2 rounded border border-gray-600 focus:outline-none mb-4"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={confirmJoin}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded w-full sm:w-auto"
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
