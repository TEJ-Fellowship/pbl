// CanvasBoard.jsx
import React, { useRef, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

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
  const socket = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const startPosRef = useRef(null); // store last local point
  const lastRemotePosRef = useRef({}); // for smoothing remote by socket id if needed

  // helper: throttle
  const throttle = (fn, limit = 20) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= limit) {
        last = now;
        fn(...args);
      }
    };
  };

  // ------------------ Canvas setup (with DPR scaling) ------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const leftSidebar = document.getElementById("left-sidebar");
      const rightSidebar = document.getElementById("right-sidebar");
      const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 0;
      const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 0;
      const targetWidth = window.innerWidth - leftWidth - rightWidth - 520;
      const targetHeight = window.innerHeight - 20;

      const dpr = window.devicePixelRatio || 1;

      // set logical size (scaled)
      canvas.width = Math.max(1, Math.floor(targetWidth * dpr));
      canvas.height = Math.max(1, Math.floor(targetHeight * dpr));
      // set CSS size
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;

      // reset transform then scale once by DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // redraw background (use CSS size)
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // keep drawing styles consistent
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    // initial resize
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [backgroundColor]);

  // ------------------ Socket setup ------------------
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join-room", { roomId }, (resp) => {
      if (!resp?.ok) console.error("Failed to join room:", resp?.message);
      else console.log("Joined room", resp.room);
    });

    // handlers are defined inside effect so they capture latest refs
    const handleRemoteDrawing = (data) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      // convert relative coords back to absolute in CSS pixels
      const fromRel = (p) => ({
        x: p.x * canvas.clientWidth,
        y: p.y * canvas.clientHeight,
      });

      const start = fromRel(data.start);
      const end = fromRel(data.end);

      // apply eraser mode for remote
      if (data.tool === "eraser") {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = data.size;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      } else {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.closePath();
      }
    };

    const handleRemoteBegin = (data) => {
      // optional: can use to mark lastRemotePosRef for a given remote id
      const canvas = canvasRef.current;
      if (!canvas) return;
      // store last remote pos by socket id if provided (data.from)
      if (data.from) {
        lastRemotePosRef.current[data.from] = { x: data.start.x, y: data.start.y };
      }
    };

    const handleRemoteEnd = (data) => {
      // can be used to finalize any shapes, or for cursor cleanup
      if (data.from && lastRemotePosRef.current[data.from]) {
        delete lastRemotePosRef.current[data.from];
      }
    };

    const handleRemoteShape = (data) => {
      // rehydrate shape coordinates if you used relative coords for shapes (not shown here)
      const ctx = ctxRef.current;
      if (!ctx) return;
      drawShape(ctx, {
        ...data,
        // if you sent relative coords for x/y/w/h, convert them here
      });
    };

    const handleRemoteClear = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    };

    socket.on("drawing", handleRemoteDrawing);
    socket.on("begin-path", handleRemoteBegin);
    socket.on("end-path", handleRemoteEnd);
    socket.on("shape", handleRemoteShape);
    socket.on("clear-canvas", handleRemoteClear);

    socket.on("canvas-snapshot", ({ dataURL }) => {
      if (!dataURL) return;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // draw snapshot stretched to current CSS size
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        // for high-dpi canvas we already used ctx.setTransform(dpr,0,0,dpr,0,0) so drawing in CSS pixels is fine
        ctxRef.current.drawImage(img, 0, 0, w, h);
      };
      img.src = dataURL;
    });

    return () => {
      socket.off("drawing", handleRemoteDrawing);
      socket.off("begin-path", handleRemoteBegin);
      socket.off("end-path", handleRemoteEnd);
      socket.off("shape", handleRemoteShape);
      socket.off("clear-canvas", handleRemoteClear);
      socket.off("canvas-snapshot");
    };
  }, [socket, roomId]);

  // ------------------ Helpers for coordinate normalization ------------------
  const toRelative = (x, y) => {
    const canvas = canvasRef.current;
    return { x: x / canvas.clientWidth, y: y / canvas.clientHeight };
  };

  const fromRelative = (p) => {
    const canvas = canvasRef.current;
    return { x: p.x * canvas.clientWidth, y: p.y * canvas.clientHeight };
  };

  // throttled emitter
  const emitDrawing = useRef(
    throttle((payload) => {
      if (socket && socket.connected) socket.emit("drawing", payload);
    }, 20)
  ).current;

  // ------------------ Drawing functions (use pointer events) ------------------
  const startDrawing = (e) => {
    // supports pointer events; e.nativeEvent for React synthetic events
    const native = e.nativeEvent;
    const x = native.offsetX;
    const y = native.offsetY;
    setIsDrawing(true);
    startPosRef.current = { x, y };

    const ctx = ctxRef.current;
    if (!ctx) return;

    // local begin path
    ctx.beginPath();
    if (tool === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
    }
    ctx.moveTo(x, y);

    // emit beginPath with relative coords
    if (socket && socket.connected) {
      socket.emit("begin-path", {
        tool,
        color: brushColor,
        size: brushSize,
        start: toRelative(x, y),
        from: socket.id, // optional so remote can track by id
        roomId,
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    const native = e.nativeEvent;
    const x = native.offsetX;
    const y = native.offsetY;
    const ctx = ctxRef.current;

    if (tool === "pen" || tool === "eraser") {
      if (tool === "eraser") {
        ctx.lineWidth = brushSize;
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // emit normalized segment (throttled)
      const start = startPosRef.current || { x, y };
      emitDrawing({
        tool,
        color: brushColor,
        size: brushSize,
        start: toRelative(start.x, start.y),
        end: toRelative(x, y),
        roomId,
      });

      startPosRef.current = { x, y };
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const native = e.nativeEvent;
    const x = native.offsetX;
    const y = native.offsetY;
    const ctx = ctxRef.current;

    if (tool === "pen" || tool === "eraser") {
      ctx.closePath();
      if (tool === "eraser") ctx.restore();
    }

    // emit end-path (optional)
    if (socket && socket.connected) {
      socket.emit("end-path", {
        roomId,
        // final end point if you want:
        end: toRelative(x, y),
      });

      // send snapshot to late joiners (you already did this pattern)
      const dataURL = canvasRef.current.toDataURL("image/png");
      socket.emit("canvas-snapshot", { dataURL });
    }
  };

  // optional clear
  const clearAll = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (socket && socket.connected) socket.emit("clear-canvas");
  };

  // drawShape remains mostly same (assumes absolute CSS pixels)
  const drawShape = (ctx, data) => {
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.beginPath();
    switch (data.shape) {
      case "circle": {
        // if x,y,w,h were sent as relative you should convert
        ctx.arc(data.cx, data.cy, data.r, 0, Math.PI * 2);
        break;
      }
      case "square":
        ctx.rect(data.x, data.y, data.w, data.h);
        break;
      case "triangle":
        ctx.moveTo(data.x + data.w / 2, data.y);
        ctx.lineTo(data.x, data.y + data.h);
        ctx.lineTo(data.x + data.w, data.y + data.h);
        ctx.closePath();
        break;
      default:
        break;
    }
    ctx.stroke();
    ctx.closePath();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        id="canvas-board"
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <div className="mt-4 flex space-x-4">
        <button
          onClick={clearAll}
          className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg"
        >
          Clear for All
        </button>
      </div>
    </div>
  );
}
