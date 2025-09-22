// ============= FIXED RoomList.jsx =============
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to generate unique room codes
const generateRoomCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export default function RoomList() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState(1);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinCode, setJoinCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Persist whenever rooms change
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, userRes] = await Promise.all([
          api.get("/rooms"),
          api.get("/userRoutes/me")
        ]);
        setRooms(roomsRes.data || []);
        setCurrentUser(userRes.data || null);
        console.log("Current user:", userRes.data);
        console.log("Rooms:", roomsRes.data);
      } catch (err) {
        console.error("Failed to fetch rooms or user", err);
      }
    };
    fetchData();
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredRooms.map((room) => {
            // Fixed creator comparison - check all possible ID formats
            const isCreator = currentUser && room.creator && (
              // Direct string comparison
              room.creator === currentUser._id ||
              room.creator === currentUser.id ||
              // Object comparison
              (typeof room.creator === 'object' && room.creator._id === currentUser._id) ||
              (typeof room.creator === 'object' && room.creator._id === currentUser.id) ||
              // String versions
              String(room.creator) === String(currentUser._id) ||
              String(room.creator) === String(currentUser.id)
            );

            console.log(`Room ${room.name}:`, {
              roomCreator: room.creator,
              currentUserId: currentUser?._id,
              isCreator
            });

            return (
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
                  
                  {/* Show room code ONLY to creator */}
                  {isCreator && (
                    <p className="text-xs text-green-400 mt-1 font-mono">
                      Room Code: {room.code}
                    </p>
                  )}
                  
                  <p className="text-sm mt-1">
                    Status:{" "}
                    <span
                      className={room.isActive ? "text-green-400" : "text-red-400"}
                    >
                      {room.isActive ? "Active" : "Deactivated"}
                    </span>
                  </p>
                  
                  {isCreator && (
                    <p className="text-xs text-blue-400 mt-1">👑 Your Room</p>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
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

                  {/* Show controls ONLY to creator */}
                  {isCreator && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRoomStatus(room._id)}
                        className={`flex-1 py-2 px-4 rounded-lg text-center text-sm ${
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
                          alert("Room code copied to clipboard!");
                        }}
                        className="flex-1 py-2 px-4 rounded-lg text-center text-sm bg-blue-600 hover:bg-blue-500"
                      >
                        Copy Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

            <input
              type="number"
              min="1"
              value={participants}
              onChange={(e) => setParticipants(parseInt(e.target.value || "1"))}
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