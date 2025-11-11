import React, { useState } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";

export default function HomePage() {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);

  return (
    <div className="flex h-screen bg-gray-100">
      <LeftSidebar />

      <CanvasBoard brushColor={brushColor} brushSize={brushSize} />

      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  );
}
