// Fixed RoomPage.jsx - Using centralized socket context
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CanvasBoard from "./CanvasBoard";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import { useSocket } from "../context/SocketContext";
import axios from "../utils/axios";

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  // Get socket context
  const { 
    isConnected, 
    roomUsers, 
    activeUser, 
    remainingTime, 
    setRemainingTime,
    joinRoom,
    leaveRoom 
  } = useSocket();

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch current user
        console.log("Fetching user data...");
        const userRes = await axios.get("/userRoutes/me");
        const userData = userRes.data;
        
        console.log("User data fetched:", userData);
        setUser(userData);

        // Fetch room data if roomId exists
        if (roomId && roomId !== 'defaultRoom') {
          console.log("Fetching room data for:", roomId);
          const roomRes = await axios.get(`/rooms`);
          const foundRoom = roomRes.data.find(r => r._id === roomId);
          
          if (!foundRoom) {
            setError("Room not found!");
            return;
          }
          
          if (!foundRoom.isActive) {
            setError("This room is not active!");
            return;
          }
          
          setRoom(foundRoom);
          console.log("Room data fetched:", foundRoom);
        } else {
          // Default room for testing
          setRoom({
            _id: roomId || 'defaultRoom',
            name: 'Default Test Room',
            isActive: true
          });
        }

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Failed to load room data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [roomId]);

  // Join room when user and room are loaded and socket is connected
  useEffect(() => {
    if (!user || !room || error || !isConnected) return;

    console.log("Joining room via socket context...");
    const joinData = {
      roomId: room._id,
      userId: user._id, // Use _id consistently
      username: user.username || user.name,
      avatar: user.avatar || null
    };
    
    console.log("RoomPage: Joining room with data:", joinData);
    joinRoom(joinData);

    // Cleanup function
    return () => {
      console.log("RoomPage: Leaving room...");
      leaveRoom(room._id, user._id);
    };
  }, [user, room, error, isConnected, joinRoom, leaveRoom]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate("/my-room")}
            className="bg-blue-500 hover:bg-blue-400 px-6 py-2 rounded"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!user || !room) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if current user is the room creator
  const isCreator = room.creator && 
    ((typeof room.creator === 'object' && room.creator._id === user._id) || 
     (room.creator === user._id));

  const currentUserId = user._id;
  const isMyTurn = activeUser?.id === currentUserId;

  const handleLeaveRoom = () => {
    leaveRoom(room._id, user._id);
    navigate("/my-room");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-50">
          Reconnecting to server...
        </div>
      )}

      {/* Room Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 p-3 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">{room.name}</h1>
          <div className="flex items-center gap-4 text-sm">
            {isCreator && room.code && (
              <span className="text-green-400">
                Code: <span className="font-mono">{room.code}</span>
              </span>
            )}
            <span className="text-gray-300">
              Players: {roomUsers.length}
            </span>
            <span className="text-gray-300">
              Status: <span className={room.isActive ? "text-green-400" : "text-red-400"}>
                {room.isActive ? "Active" : "Inactive"}
              </span>
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <p className={`font-semibold ${isMyTurn ? 'text-green-400' : 'text-yellow-400'}`}>
            {isMyTurn ? "🎨 Your Turn!" : `${activeUser?.name || "Someone"}'s Turn`}
          </p>
          <p className="text-sm text-gray-300">
            Timer: {remainingTime}s remaining
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLeaveRoom}
            className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-20">
        {/* Left Sidebar */}
        <div id="left-sidebar">
          <LeftSidebar tool={tool} setTool={setTool} />
        </div>

        {/* Canvas */}
        <CanvasBoard
          brushColor={brushColor}
          brushSize={brushSize}
          tool={tool}
          roomId={room._id}
          user={user}
          setRemainingTime={setRemainingTime}
          canvasBackgroundColor={canvasBackgroundColor}
        />

        {/* Right Sidebar */}
        <div id="right-sidebar">
          <RightSidebar
            brushColor={brushColor}
            setBrushColor={setBrushColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            remainingTime={remainingTime}
            activeUser={activeUser}
            user={user}
            roomUsers={roomUsers}
            canvasBackgroundColor={canvasBackgroundColor}
            setCanvasBackgroundColor={setCanvasBackgroundColor}
          />
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>User ID: {currentUserId}</div>
          <div>Active User ID: {activeUser?.id}</div>
          <div>Is My Turn: {isMyTurn.toString()}</div>
          <div>Players: {roomUsers.length}</div>
          <div>Socket Connected: {isConnected.toString()}</div>
        </div>
      )}
    </div>
  );
}