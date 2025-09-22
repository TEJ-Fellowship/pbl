// src/components/CanvasBoard.js
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";

export default function CanvasBoard({
  brushColor,
  brushSize,
  tool,
  selectedShape,
  backgroundColor,
  roomId,
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, [brushColor, brushSize, backgroundColor]);

  // --- Socket listeners ---
  useEffect(() => {
    if (!socket) return;

    socket.on("drawing", ({ x, y }) => {
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    });

    socket.on("begin-path", ({ x, y }) => {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    });

    socket.on("end-path", () => {
      ctxRef.current.closePath();
    });

    socket.on("shape", ({ shape, x, y, width, height }) => {
      drawShape(shape, x, y, width, height, false);
    });

    socket.on("clear-canvas", clearCanvas);

    socket.on("canvas-snapshot", ({ dataURL }) => {
      const img = new Image();
      img.src = dataURL;
      img.onload = () =>
        ctxRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    return () => {
      socket.off("drawing");
      socket.off("begin-path");
      socket.off("end-path");
      socket.off("shape");
      socket.off("clear-canvas");
      socket.off("canvas-snapshot");
    };
  }, [socket]);

  // --- Drawing logic ---
  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    socket.emit("begin-path", { x: offsetX, y: offsetY, roomId });
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    ctxRef.current.closePath();
    socket.emit("end-path", { roomId });
    sendSnapshot();
  };

  const draw = (e) => {
    if (!isDrawing || tool !== "brush") return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    socket.emit("drawing", { x: offsetX, y: offsetY, roomId });
  };

  const drawShape = (shape, x, y, width, height, emit = true) => {
    ctxRef.current.beginPath();
    if (shape === "rectangle") {
      ctxRef.current.rect(x, y, width, height);
    } else if (shape === "circle") {
      ctxRef.current.arc(x, y, width / 2, 0, 2 * Math.PI);
    }
    ctxRef.current.stroke();
    ctxRef.current.closePath();

    if (emit) {
      socket.emit("shape", { shape, x, y, width, height, roomId });
    }
  };

  const clearCanvas = () => {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctxRef.current.fillStyle = backgroundColor;
    ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const sendSnapshot = () => {
    const dataURL = canvasRef.current.toDataURL();
    socket.emit("canvas-snapshot", { dataURL, roomId });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseUp={finishDrawing}
      onMouseMove={draw}
      className="border border-gray-400"
    />
  );
}
