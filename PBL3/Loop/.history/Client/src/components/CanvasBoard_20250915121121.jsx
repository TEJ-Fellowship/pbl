import React, { useRef, useEffect, useState } from "react";
import axios from "axios";


const BACKEND_URL = "http://localhost:"; // match your Express port

// Helper to generate unique user ID
const generateUserId = () => Math.random().toString(36).substr(2, 9);

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const userId = useRef(generateUserId());

  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cursors, setCursors] = useState([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;

    loadDrawings();
    loadCursors();
  }, []);

  useEffect(() => {
      const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  // Fetch all drawings from backend
  const loadDrawings = async () => {
    const res = await axios.get(`${BACKEND_URL}/api/drawings`);
    const ctx = canvasRef.current.getContext("2d");
    res.data.forEach((d) => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.size;
      drawShape(ctx, d.tool, d.start, d.end);
    });
    setUndoStack(res.data.map((d) => d._id));
  };

  // Fetch cursors
  const loadCursors = async () => {
    const res = await axios.get(`${BACKEND_URL}/api/drawings/cursors`);
    setCursors(res.data);
  };

  const updateCursor = async (x, y) => {
    await axios.post(`${BACKEND_URL}/api/drawings/cursors`, {
      userId: userId.current,
      x,
      y,
      color: brushColor,
    });
    loadCursors();
  };

  const startDrawingHandler = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    updateCursor(x, y);

    setStartPos({ x, y });
    setDrawing(true);
  };

  const drawHandler = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    updateCursor(x, y);

    if (!drawing) return;
    if (tool !== "pen") return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    sendDrawing(startPos, { x, y });
    setStartPos({ x, y });
  };

  const stopDrawingHandler = (e) => {
    if (!drawing) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (["circle", "square", "rectangle"].includes(tool)) {
      sendDrawing(startPos, { x, y });
    }
    setDrawing(false);
  };

  const sendDrawing = async (start, end) => {
    const res = await axios.post(`${BACKEND_URL}/api/drawings`, {
      tool,
      color: brushColor,
      size: brushSize,
      start,
      end,
    });
    setUndoStack((prev) => [...prev, res.data._id]);
  };

  const drawShape = (ctx, tool, start, end) => {
    if (tool === "pen") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "square") {
      const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
      ctx.strokeRect(start.x, start.y, size, size);
    } else if (tool === "rectangle") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    }
  };

  const undo = async () => {
  if (!undoStack.length) return;

  // Create a copy so we don't mutate state directly
  const newUndoStack = [...undoStack];
  const lastId = newUndoStack.pop();

  await axios.delete(`${BACKEND_URL}/api/drawings/${lastId}`);

  setUndoStack(newUndoStack);
  setRedoStack((prev) => [...prev, lastId]);

  // Only redraw remaining strokes
  const res = await axios.get(`${BACKEND_URL}/api/drawings`);
  const ctx = canvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  res.data.forEach((d) => {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = d.size;
    drawShape(ctx, d.tool, d.start, d.end);
  });
};


  const redrawCanvas = async () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    loadDrawings();
  };

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

      {/* Render other users' cursors */}
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

      {/* Undo/Redo buttons */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={undo}
          className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400"
        >
          Undo
        </button>
        <button
          onClick={() => redrawCanvas()}
          className="bg-green-500 px-2 py-1 rounded hover:bg-green-400"
        >
          Redraw
        </button>
      </div>
    </div>
  );
}
