// src/sockets/sockets.js
import jwt from "jsonwebtoken";
import Room from "../models/Room.js";
import Loop from "../models/Loop.js";

/**
 * Basic in-memory snapshot store:
 * { [roomIdOrCode]: { snapshotDataUrl: string, updatedAt: Date } }
 *
 * For production, persist in DB or object storage.
 */
const roomSnapshots = new Map();

export default function initSockets(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Attempt auth if token present in handshake query
    const { token } = socket.handshake.query || {};

    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = { id: decoded.id, username: decoded.username || null }; // depends on what you set in JWT
        socket.user = user;
      } catch (err) {
        console.warn("Socket auth failed:", err.message);
      }
    }

    // Join room by either roomId or code
    socket.on("join-room", async ({ roomId, roomCode } = {}, cb) => {
      try {
        let room;
        if (roomId) {
          room = await Room.findById(roomId);
        } else if (roomCode) {
          room = await Room.findOne({ code: roomCode });
        }

        if (!room) {
          return cb && cb({ ok: false, message: "Room not found" });
        }

        // join socket.io room using room._id string
        const rid = room._id.toString();
        socket.join(rid);
        socket.roomId = rid;
        console.log(`${socket.id} joined room ${rid}`);

        // send last snapshot if present
        if (roomSnapshots.has(rid)) {
          const { snapshotDataUrl } = roomSnapshots.get(rid);
          socket.emit("canvas-snapshot", { dataURL: snapshotDataUrl });
        }

        cb && cb({ ok: true, room: { id: rid, name: room.name, code: room.code } });
      } catch (err) {
        console.error("join-room error:", err);
        cb && cb({ ok: false, message: "Server error joining room" });
      }
    });

    // Freehand stroke event (broadcast to room)
    socket.on("drawing", (payload) => {
      const rid = socket.roomId;
      if (!rid) return;
      // broadcast to other clients in same room
      socket.to(rid).emit("drawing", payload);
    });

    // Shape event (circle/rect/triangle/star/hexagon) - broadcast same as drawing
    socket.on("shape", (payload) => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("shape", payload);
    });

    // Clear canvas for everyone in room
    socket.on("clear-canvas", () => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(rid).emit("clear-canvas");
      // clear stored snapshot
      roomSnapshots.delete(rid);
    });

    // Receive snapshot from a client (dataURL) and store for new joiners
    socket.on("canvas-snapshot", ({ dataURL }) => {
      const rid = socket.roomId;
      if (!rid || !dataURL) return;
      roomSnapshots.set(rid, { snapshotDataUrl: dataURL, updatedAt: new Date() });
      // optionally broadcast snapshot to newly joined clients (or all)
      // socket.to(rid).emit("canvas-snapshot", { dataURL });
    });

    // Optional: save final canvas as Loop in DB (if user is authenticated)
    socket.on("save-loop", async ({ roomId, imageData, caption }, cb) => {
      try {
        if (!socket.user) return cb && cb({ ok: false, message: "Unauthorized" });
        const loop = await Loop.create({
          room: roomId,
          creator: socket.user.id,
          finalImage: imageData,
          caption: caption || "",
        });
        return cb && cb({ ok: true, loop });
      } catch (err) {
        console.error("save-loop error:", err);
        return cb && cb({ ok: false, message: "Server error" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected", socket.id, reason);
    });
  });
}
