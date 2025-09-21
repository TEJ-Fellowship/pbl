// Fixed Home.jsx - Using centralized socket context
import React, { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";
import { useSocket } from "../context/SocketContext";
import axios from "../utils/axios";

export default function HomePage() {
  // Brush & Tool state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  // User & Room state
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState("defaultRoom");

  // Get socket context
  const { 
    isConnected, 
    roomUsers, 
    activeUser, 
    remainingTime, 
    setRemainingTime,
    joinRoom 
  } = useSocket();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/userRoutes/me");
        console.log("Fetched user data:", data);
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        // Set default user for testing - FIXED: consistent ID structure
        setUser({ 
          id: "user123", 
          _id: "user123",
          name: "TestUser", 
          username: "TestUser",
          email: "test@example.com"
        });
      }
    };
    fetchUser();
  }, []);

  // Join room when user is loaded and socket is connected
  useEffect(() => {
    if (user && isConnected && roomId) {
      const joinData = {
        roomId,
        userId: user._id,  // Use _id consistently
        username: user.username || user.name,
        avatar: user.avatar || null
      };
      
      console.log("Home: Joining room with data:", joinData);
      joinRoom(joinData);
    }
  }, [user, isConnected, roomId, joinRoom]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-50">
          Connecting to server...
        </div>
      )}

      {/* Left Sidebar */}
      <div id="left-sidebar">
        <LeftSidebar tool={tool} setTool={setTool} />
      </div>

      {/* Canvas Board */}
      <CanvasBoard
        brushColor={brushColor}
        brushSize={brushSize}
        tool={tool}
        roomId={roomId}
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

      {/* Debug Info - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
          <div>Connected: {isConnected.toString()}</div>
          <div>Room: {roomId}</div>
          <div>Users: {roomUsers.length}</div>
          <div>Active User: {activeUser?.name || 'None'}</div>
          <div>My Turn: {(activeUser?.id === user._id).toString()}</div>
          <div>Time: {remainingTime}s</div>
        </div>
      )}
    </div>
  );
}