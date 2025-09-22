// src/sockets/sockets.js
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import Loop from "../models/Loop.js";

/**
 * Basic in-memory snapshot store:
 * { [roomId]: { snapshotDataUrl: string, updatedAt: Date } }
 *
 * For production, persist snapshots in DB or object storage.
 */
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
            if (typeof cb === "function")
              return cb({ ok: false, message: "Invalid roomId format" });
            return;
          }
          room = await Room.findById(roomId);
        } else if (roomCode) {
          room = await Room.findOne({ code: roomCode });
        }

        if (!room) {
          if (typeof cb === "function")
            return cb({ ok: false, message: "Room not found" });
          return;
        }

        const rid = room._id.toString();
        socket.join(rid);
        socket.roomId = rid;
        console.log(`📥 ${socket.id} joined room ${rid}`);

        // send last snapshot if exists
        if (roomSnapshots.has(rid)) {
          const { snapshotDataUrl } = roomSnapshots.get(rid);
          socket.emit("canvas-snapshot", { dataURL: snapshotDataUrl });
        }

        if (typeof cb === "function") {
          cb({
            ok: true,
            room: { id: rid, name: room.name, code: room.code },
          });
        }
      } catch (err) {
        console.error("join-room error:", err);
        if (typeof cb === "function")
          cb({ ok: false, message: "Server error joining room" });
      }
    });

    // --- Drawing event ---
    socket.on("drawing", (payload) => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("drawing", payload);
    });

    // --- Shape event ---
    socket.on("shape", (payload) => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("shape", payload);
    });

    // --- Clear canvas ---
    socket.on("clear-canvas", () => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("clear-canvas");
      roomSnapshots.delete(rid);
    });

    // --- Receive snapshot ---
    socket.on("canvas-snapshot", ({ dataURL }) => {
      const rid = socket.roomId;
      if (!rid || !dataURL) return;

      // store only latest snapshot
      roomSnapshots.set(rid, { snapshotDataUrl: dataURL, updatedAt: new Date() });
      console.log(`🖼️ Snapshot stored for room ${rid}`);
    });

    // --- Save loop to DB ---
    socket.on("save-loop", async ({ roomId, imageData, caption }, cb) => {
      try {
        if (!socket.user) {
          if (typeof cb === "function")
            return cb({ ok: false, message: "Unauthorized" });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          if (typeof cb === "function")
            return cb({ ok: false, message: "Invalid roomId" });
          return;
        }

        const loop = await Loop.create({
          room: roomId,
          creator: socket.user.id,
          finalImage: imageData,
          caption: caption || "",
        });

        if (typeof cb === "function") cb({ ok: true, loop });
      } catch (err) {
        console.error("save-loop error:", err);
        if (typeof cb === "function")
          cb({ ok: false, message: "Server error saving loop" });
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", socket.id, "Reason:", reason);
    });
  });
}
