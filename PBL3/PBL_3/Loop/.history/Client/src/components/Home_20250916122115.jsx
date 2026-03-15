import React, { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";
import axios from "axios";

export default function HomePage({ userToken }) {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen"); // default tool

  // --- Add these state variables ---
  const [currentRoom, setCurrentRoom] = useState(null);

  // --- Fetch current room from backend when component mounts ---
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await axios.get("http://localhost:3001/api/rooms/current", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setCurrentRoom(res.data);
      } catch (err) {
        console.error("Failed to fetch current room:", err);
      }
    }
    if (userToken) fetchRoom();
  }, [userToken]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <LeftSidebar tool={tool} setTool={setTool} />

      {/* Canvas Board */}
      {currentRoom && (
        <CanvasBoard
          brushColor={brushColor}
          brushSize={brushSize}
          tool={tool}
          roomId={currentRoom._id}  // pass roomId from backend
          token={userToken}          // pass token from parent/login
        />
      )}

      {/* Right Sidebar */}
      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  );
}
