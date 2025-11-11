import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:3001";

const generateUserId = () => Math.random().toString(36).substr(2, 9);

export default function CanvasBoard() {
  

  return (
    <div className="flex-1 flex justify-center items-center bg-white relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 w-full h-full max-w-4xl max-h-full"
        onMouseDown={startDrawingHandler}
        onMouseMove={drawHandler}
        onMouseUp={stopDrawingHandler}
        onMouseLeave={stopDrawingHandler}
      />

      {cursors.map(
        (cursor) =>
          cursor.userId !== userId.current && (
            <div
              key={cursor.userId}
              style={{
                position: "absolute",
                left: cursor.x,
                top: cursor.y,
                width: 10,
                height: 10,
                backgroundColor: cursor.color,
                borderRadius: "50%",
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
              }}
            />
          )
      )}

      <div className="absolute top-4 right-4 flex space-x-2">
        <button onClick={undo} className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400">Undo</button>
        <button onClick={redo} className="bg-red-500 px-2 py-1 rounded hover:bg-red-400">Redo</button>
        <button onClick={redrawCanvas} className="bg-green-500 px-2 py-1 rounded hover:bg-green-400">Redraw</button>
      </div>
    </div>
  );
}
