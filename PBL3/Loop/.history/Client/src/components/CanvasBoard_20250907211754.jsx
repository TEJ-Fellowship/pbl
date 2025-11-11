import React, { useRef, useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, push, onChildAdded, remove, set, onValue } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cursors, setCursors] = useState({});
  const userId = useRef(uuidv4());

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  // Listen for drawings from other users
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    const drawingsRef = ref(database, "drawings");

    onChildAdded(drawingsRef, (snapshot) => {
      const { tool, color, size, start, end } = snapshot.val();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

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
        const sizeVal = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        ctx.strokeRect(start.x, start.y, sizeVal, sizeVal);
      } else if (tool === "rectangle") {
        ctx.strokeRect(start.x, startPos.y, end.x - start.x, end.y - start.y);
      }

      setUndoStack((prev) => [...prev, snapshot.key]);
    });
  }, []);

  // Listen for cursor updates
  useEffect(() => {
    const cursorsRef = ref(database, "cursors");
    onValue(cursorsRef, (snapshot) => {
      setCursors(snapshot.val() || {});
    });
  }, []);

  const sendDrawing = (start, end) => {
    const drawingsRef = ref(database, "drawings");
    push(drawingsRef, {
      tool,
      color: brushColor,
      size: brushSize,
      start,
      end,
    });
  };

  const updateCursor = (x, y) => {
    const cursorRef = ref(database, `cursors/${userId.current}`);
    set(cursorRef, { x, y, color: brushColor, userId: userId.current });
  };

  const startDrawingHandler = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    updateCursor(x, y);

    if (tool === "pen") {
      setStartPos({ x, y });
      setDrawing(true);
    } else if (["circle", "square", "rectangle"].includes(tool)) {
      setStartPos({ x, y });
      setDrawing(true);
    }
  };

  const drawHandler = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    updateCursor(x, y);

    if (!drawing) return;
    if (tool !== "pen") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const endPos = { x, y };
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();

    sendDrawing(startPos, endPos);
    setStartPos(endPos);
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

  const undo = () => {
    if (!undoStack.length) return;
    const lastKey = undoStack.pop();
    remove(ref(database, `drawings/${lastKey}`));
    setUndoStack([...undoStack]);
    setRedoStack((prev) => [...prev, lastKey]);
    redrawCanvas();
  };

  const redo = () => {
    if (!redoStack.length) return;
    const lastKey = redoStack.pop();
    // Re-push to Firebase (or retrieve stored info) – simplified example
    setRedoStack([...redoStack]);
  };

  const redrawCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Re-render all drawings from Firebase
    const drawingsRef = ref(database, "drawings");
    onValue(drawingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      Object.values(data).forEach(({ tool, color, size, start, end }) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        if (tool === "pen") {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        } else if (tool === "circle") {
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (tool === "square") {
          const sizeVal = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
          ctx.strokeRect(start.x, start.y, sizeVal, sizeVal);
        } else if (tool === "rectangle") {
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - startPos.y);
        }
      });
    });
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
      {/* Render cursors */}
      {Object.values(cursors).map(
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
        <button
          onClick={undo}
          className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400"
        >
          Undo
        </button>
        <button
          onClick={redo}
          className="bg-green-500 px-2 py-1 rounded hover:bg-green-400"
        >
          Redo
        </button>
      </div>
    </div>
  );
}
