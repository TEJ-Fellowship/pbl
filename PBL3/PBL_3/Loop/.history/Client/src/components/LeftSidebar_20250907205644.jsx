import React from "react";
import { PenTool, Image, Circle, Square, BarChart2 } from "lucide-react";

export default function LeftSidebar() {
  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
      <button className="p-2 hover:bg-gray-700 rounded">
        <PenTool className="text-white" />
      </button>
      <button className="p-2 hover:bg-gray-700 rounded">
        <Image className="text-white" />
      </button>
      <button className="p-2 hover:bg-gray-700 rounded">
        <Circle className="text-white" />
      </button>
      <button className="p-2 hover:bg-gray-700 rounded">
        <Square className="text-white" />
      </button>
      <button className="p-2 hover:bg-gray-700 rounded">
        <BarChart2 className="text-white" />
      </button>
    </div>
  );
}
