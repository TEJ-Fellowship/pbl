import React, { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";
import axios from "axios";

export default function HomePage({ userToken }) {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [currentRoom, setCurrentRoom] = useState(null);

  // Fetch the current room from backend
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
      <LeftSidebar tool={tool} setTool={setTool} />

      {/* Only render CanvasBoard when room is loaded */}
      {currentRoom && (
        <CanvasBoard
          brushColor={brushColor}
          brushSize={brushSize}
          tool={tool}
          roomId={currentRoom._id} // pass from backend
          token={userToken}         // pass token from backend
        />
      )}

      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  );
}
