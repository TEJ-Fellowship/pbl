// src/sockets/sockets.js
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import Loop from "../models/Loop.js";

const roomSnapshots = new Map();

export default function initSockets(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // --- Auth check (JWT) ---
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: decoded.id, username: decoded.username || null };
        console.log("✅ Authenticated socket:", socket.user.id);
      } catch (err) {
        console.warn("❌ Socket auth failed:", err.message);
      }
    } else {
      console.log("⚠️ No token provided in handshake");
    }

    // --- Join room ---
    socket.on("join-room", async ({ roomId, roomCode } = {}, cb) => {
      try {
        let room;

        if (roomId) {
          if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return cb?.({ ok: false, message: "Invalid roomId format" });
          }
          room = await Room.findById(roomId);
        } else if (roomCode) {
          room = await Room.findOne({ code: roomCode });
        }

        if (!room) return cb?.({ ok: false, message: "Room not found" });

        const rid = room._id.toString();
        socket.join(rid);
        socket.roomId = rid;
        console.log(`📥 ${socket.id} joined room ${rid}`);

        // send last snapshot if exists
        if (roomSnapshots.has(rid)) {
          const { snapshotDataUrl } = roomSnapshots.get(rid);
          socket.emit("canvas-snapshot", { dataURL: snapshotDataUrl });
        }

        cb?.({
          ok: true,
          room: { id: rid, name: room.name, code: room.code },
        });
      } catch (err) {
        console.error("join-room error:", err);
        cb?.({ ok: false, message: "Server error joining room" });
      }
    });

    // --- Drawing events ---
    socket.on("begin-path", (data) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("begin-path", { ...data, from: socket.id });
    });

    socket.on("drawing", (payload) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("drawing", payload);
    });

    socket.on("end-path", (data) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("end-path", { ...data, from: socket.id });
    });

    // --- Shape event ---
    socket.on("shape", (payload) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("shape", payload);
    });

    // --- Clear canvas ---
    socket.on("clear-canvas", () => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit("clear-canvas");
      roomSnapshots.delete(socket.roomId);
    });

    // --- Receive snapshot ---
    socket.on("canvas-snapshot", ({ dataURL }) => {
      if (!socket.roomId || !dataURL) return;
      roomSnapshots.set(socket.roomId, {
        snapshotDataUrl: dataURL,
        updatedAt: new Date(),
      });
      console.log(`🖼️ Snapshot stored for room ${socket.roomId}`);
    });

    // --- Save loop to DB ---
    socket.on("save-loop", async ({ roomId, imageData, caption }, cb) => {
      try {
        if (!socket.user)
          return cb?.({ ok: false, message: "Unauthorized" });

        if (!mongoose.Types.ObjectId.isValid(roomId))
          return cb?.({ ok: false, message: "Invalid roomId" });

        const loop = await Loop.create({
          room: roomId,
          creator: socket.user.id,
          finalImage: imageData,
          caption: caption || "",
        });

        cb?.({ ok: true, loop });
      } catch (err) {
        console.error("save-loop error:", err);
        cb?.({ ok: false, message: "Server error saving loop" });
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, "Reason:", reason);
    });
  });
}
