// CanvasBoard.jsx
import React, { useRef, useEffect, useState } from "react";
import axios from "../utils/axios";
import { io } from "socket.io-client";

export default function CanvasBoard({ brushColor, brushSize, tool, roomId, user, setRemainingTime }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [undoQueue, setUndoQueue] = useState([]);

  const [activeUserId, setActiveUserId] = useState(null); // who's turn it is
  const DRAW_TIME = 30; // seconds

  // ------------------ Canvas resize ------------------
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");

    const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 0;
    const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 0;

    canvas.width = window.innerWidth - leftWidth - rightWidth - 520;
    canvas.height = window.innerHeight - 20;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // ------------------ Init canvas & socket ------------------
  useEffect(() => {
    resizeCanvas();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    const fetchStrokes = async () => {
      try {
        if (!roomId) return;
        const res = await axios.get(`/drawings/${roomId}`);
        setStrokes(res.data || []);
      } catch (err) {
        console.error("Failed to load strokes:", err);
      }
    };

    if (roomId) fetchStrokes();

    socketRef.current = io("http://localhost:3001", { withCredentials: true });

    socketRef.current.on("connect", () => {
      console.log("socket connected", socketRef.current.id);
      if (roomId) socketRef.current.emit("joinRoom", roomId);
    });

    // ---------------- Socket events ----------------
    socketRef.current.on("stroke:created", (payload) => {
      if (!payload) return;
      setStrokes(prev => {
        if (payload._id && prev.some(s => s._id === payload._id)) return prev;
        return [...prev, payload];
      });
    });

    socketRef.current.on("stroke:deleted", ({ strokeId }) => {
      setStrokes(prev => prev.filter(s => s._id !== strokeId));
    });

    socketRef.current.on("cursor:updated", () => {});

    // ----- Turn-based events -----
    socketRef.current.on("turn:started", ({ userId, duration }) => {
      setActiveUserId(userId);
      setRemainingTime(duration);
    });

    socketRef.current.on("turn:update", ({ remaining }) => {
      setRemainingTime(remaining);
    });

    socketRef.current.on("turn:ended", ({ nextUserId }) => {
      setActiveUserId(nextUserId);
    });

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = tool === "pen" ? brushColor : "#ffffff";
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);

  // ------------------ Draw strokes ------------------
  const startDrawing = ({ nativeEvent }) => {
    if ((tool !== "pen" && tool !== "eraser") || user.id !== activeUserId) return;

    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    const newStroke = {
      roomId,
      tool,
      color: tool === "pen" ? brushColor : "#ffffff",
      size: brushSize,
      points: [{ x: offsetX, y: offsetY }],
    };
    setCurrentStroke(newStroke);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !currentStroke) return;
    const { offsetX, offsetY } = nativeEvent;

    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();

    setCurrentStroke(prev => ({
      ...prev,
      points: [...prev.points, { x: offsetX, y: offsetY }]
    }));
  };

  const stopDrawing = async () => {
    if (!isDrawing || !currentStroke) return;

    ctxRef.current.closePath();
    setIsDrawing(false);

    if (currentStroke.points.length > 1) {
      const tempStroke = { ...currentStroke, _id: `temp_${Date.now()}`, isTemp: true };
      setStrokes(prev => [...prev, tempStroke]);

      try {
        const res = await axios.post("/drawings", currentStroke);
        const saved = res.data;

        setStrokes(prev => prev.map(s => (s._id === tempStroke._id ? saved : s)));

        socketRef.current?.emit("stroke:new", saved);
      } catch (err) {
        console.error("Failed to save stroke:", err);
        setStrokes(prev => prev.filter(s => s._id !== tempStroke._id));
        alert("Failed to save stroke. Try again.");
      }
    }

    setCurrentStroke(null);
  };

  // ------------------ Redraw canvas ------------------
  const redrawCanvas = (allStrokes) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach((stroke) => {
      if (stroke.points && stroke.points.length > 1) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();

        stroke.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });

        ctx.stroke();
        ctx.closePath();
      }
    });
  };

  useEffect(() => {
    if (ctxRef.current) redrawCanvas(strokes);
  }, [strokes]);

  // ------------------ Undo ------------------
  const handleUndo = async () => {
    if (strokes.length === 0 || user.id !== activeUserId) return;

    const lastStroke = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));
    setUndoQueue(prev => [...prev, lastStroke._id]);

    try {
      if (lastStroke.isTemp) {
        setUndoQueue(prev => prev.filter(id => id !== lastStroke._id));
        return;
      }
      await axios.delete(`/drawings/${lastStroke._id}`);
      socketRef.current?.emit("stroke:delete", { roomId, strokeId: lastStroke._id });
      setUndoQueue(prev => prev.filter(id => id !== lastStroke._id));
    } catch (err) {
      console.error("Undo failed:", err);
      setStrokes(prev => [...prev, lastStroke]);
      setUndoQueue(prev => prev.filter(id => id !== lastStroke._id));
      alert("Undo failed. Try again.");
    }
  };

  // ------------------ Save to gallery ------------------
  const saveCanvas = async () => {
    const canvas = canvasRef.current;

    if (!canvas || !roomId) {
      alert("Canvas not ready to save!");
      return;
    }

    try {
      const dataURL = canvas.toDataURL("image/png", 0.8);
      const confirmedStrokes = strokes.filter(s => !s.isTemp);
      await axios.post("/loop", {
        roomId,
        imageData: dataURL,
        strokes: confirmedStrokes,
        caption: "Final Drawing",
      });
      alert("Canvas saved to gallery!");
    } catch (err) {
      console.error(err);
      alert("Failed to save canvas.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        className={`bg-white rounded-lg shadow-lg cursor-crosshair ${user.id !== activeUserId ? "opacity-50 cursor-not-allowed" : ""}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0 || user.id !== activeUserId}
          className={`px-4 py-2 rounded text-white ${
            strokes.length === 0
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-400"
          }`}
        >
          Undo {undoQueue.length > 0 && `(${undoQueue.length})`}
        </button>

        <button
          onClick={saveCanvas}
          className="bg-green-400 text-black px-4 py-2 rounded hover:bg-green-300 shadow"
        >
          Save to Gallery
        </button>
      </div>
    </div>
  );
}
