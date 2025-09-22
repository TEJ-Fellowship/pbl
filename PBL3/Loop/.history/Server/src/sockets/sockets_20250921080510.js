import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import Loop from "../models/Loop.js";

const roomSnapshots = new Map();

export default function initSockets(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: decoded.id };
        console.log("✅ Authenticated socket:", socket.user.id);
      } catch (err) {
        console.warn("❌ Socket auth failed:", err.message);
      }
    }

    socket.on("join-room", async ({ roomId }, cb) => {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        if (cb) return cb({ ok: false, message: "Invalid roomId" });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        if (cb) return cb({ ok: false, message: "Room not found" });
        return;
      }

      socket.join(roomId);
      socket.roomId = roomId;

      // send latest snapshot
      if (roomSnapshots.has(roomId)) {
        const { snapshotDataUrl } = roomSnapshots.get(roomId);
        socket.emit("canvas-snapshot", { dataURL: snapshotDataUrl });
      }

      if (cb) cb({ ok: true, room: { id: room._id.toString(), name: room.name } });
    });

    socket.on("drawing", (payload) => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("drawing", payload);
    });

    socket.on("canvas-snapshot", ({ dataURL }) => {
      const rid = socket.roomId;
      if (!rid || !dataURL) return;
      roomSnapshots.set(rid, { snapshotDataUrl: dataURL, updatedAt: new Date() });
    });

    socket.on("clear-canvas", () => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("clear-canvas");
      roomSnapshots.delete(rid);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
    });
  });
}
