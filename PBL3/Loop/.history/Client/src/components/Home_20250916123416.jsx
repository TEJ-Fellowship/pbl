import React, { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";

export default function HomePage() {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [currentRoom, setCurrentRoom] = useState(null);

  // Example: get current room and token (replace with real logic)
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

  // Store roomId in localStorage for gallery page
  useEffect(() => {
    localStorage.setItem("currentRoomId", currentRoom._id);
  }, [currentRoom._id]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <LeftSidebar tool={tool} setTool={setTool} />

      <CanvasBoard
        brushColor={brushColor}
        brushSize={brushSize}
        tool={tool}
        roomId={currentRoom._id}
        token={userToken}
      />

      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  );
}
