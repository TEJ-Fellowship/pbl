import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";
import axios from "../utils/axios";

export default function HomePage() {
  // Brush & Tool
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  // User & Room
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState("defaultRoom");

  // Turn Timer
  const [remainingTime, setRemainingTime] = useState(30);
  const [activeUser, setActiveUser] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);

  // Socket
  const [socket, setSocket] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/userRoutes/me");
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        // Set default user for testing
        setUser({ 
          id: "user123", 
          _id: "user123",
          name: "TestUser", 
          username: "TestUser" 
        });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const newSocket = io("http://localhost:3001", { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Home connected socket:", newSocket.id);

      if (roomId && user) {
        newSocket.emit("joinRoom", {
          roomId,
          userId: user.id || user._id,
          username: user.name || user.username,
        });
      }
    });

    // Room users update
    newSocket.on("roomUsers", (users) => {
      console.log("Room users updated:", users);
      setRoomUsers(users);
      
      // Set active user if not already set
      if (users.length > 0) {
        // Find current active user or set first user as active
        const currentActive = users.find(u => u.userId === activeUser?.id);
        if (!currentActive) {
          setActiveUser({ id: users[0].userId, name: users[0].username });
        }
      }
    });

    // Timer updates
    newSocket.on("turn:update", ({ remaining }) => {
      setRemainingTime(remaining);
    });

    // Turn updates
    newSocket.on("turn:started", ({ userId, username, duration }) => {
      console.log("Turn started for:", username);
      setActiveUser({ id: userId, name: username });
      setRemainingTime(duration);
    });

    newSocket.on("turn:ended", ({ nextUserId, nextUsername }) => {
      console.log("Turn ended, next user:", nextUsername);
      setActiveUser({ id: nextUserId, name: nextUsername });
    });

    return () => {
      if (roomId && user) {
        newSocket.emit("leaveRoom", { 
          roomId, 
          userId: user.id || user._id 
        });
      }
      newSocket.disconnect();
    };
  }, [roomId, user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
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
        activeUser={activeUser}
        socket={socket}
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
  );
}