import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";

export default function HomePage() {
  // -------------------- Brush & Tool --------------------
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen"); // pen or eraser

  // -------------------- User & Room --------------------
  const [user, setUser] = useState({ id: "user123", name: "Me" }); // replace with actual logged-in user
  const [roomId, setRoomId] = useState("roomABC"); // replace with dynamic room code if needed

  // -------------------- Turn Timer --------------------
  const [remainingTime, setRemainingTime] = useState(30);
  const [activeUser, setActiveUser] = useState(null);

  // -------------------- Socket --------------------
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected socket:", newSocket.id);

      if (roomId && user) {
        newSocket.emit("joinRoom", {
          roomId,
          userId: user.id,
          username: user.name,
        });
      }
    });

    // Update timer
    newSocket.on("timerUpdate", (time) => {
      setRemainingTime(time);
    });

    // Turn info
    newSocket.on("turnUpdate", ({ userId, username }) => {
      setActiveUser({ id: userId, name: username });
    });

    return () => {
      if (roomId && user) {
        newSocket.emit("leaveRoom", { roomId, userId: user.id });
      }
      newSocket.disconnect();
    };
  }, [roomId, user]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <LeftSidebar tool={tool} setTool={setTool} />

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
      />

      {/* Right Sidebar */}
      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        remainingTime={remainingTime}
        activeUser={activeUser}
        user={user}
      />
    </div>
  );
}
