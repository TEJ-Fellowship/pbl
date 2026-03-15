const express = require("express");
const { authMiddleWare } = require("../utils/middleware");
const router = express.Router();
const Room = require("../models/room");
const Clip = require("../models/Clip");
const bcrypt = require("bcrypt");
const { getIo } = require("../socket");
// Get all rooms
router.get("/", authMiddleWare, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 }).lean();

    const withOwnerShip = rooms.map((r) => ({
      ...r,
      isOwner:
        r.userId.toString() === req.user.id ||
        (r.members && r.members.includes(req.user.id)),
    }));

    res.json(withOwnerShip);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// Create room
router.post("/", authMiddleWare, async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ error: "name & password required" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newRoom = new Room({
      name,
      passwordHash,
      userId: req.user.id,
    });

    await newRoom.save();
    // backend/routes/room.js (inside POST "/" after newRoom.save())

    const creatorResponse = { ...newRoom.toObject(), isOwner: true };

    // Ensure userId is a string for frontend
    const sanitized = {
      ...newRoom.toObject(),
      userId: newRoom.userId ? String(newRoom.userId) : null,
    };

    // Broadcast to everyone
    try {
      const io = getIo();
      io.emit("roomCreated", sanitized);
    } catch (emitErr) {
      console.warn("Socket not ready to emit roomCreated", emitErr.message);
    }

    res.status(201).json(creatorResponse);
  } catch (error) {
    console.error("Failed to create room", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Join room
router.post("/:id/join", authMiddleWare, async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const isValid = await bcrypt.compare(password, room.passwordHash);
    if (!isValid) return res.status(403).json({ error: "Wrong Password" });
    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }
    res.json({ message: "Joined Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to join room" });
  }
});

// Delete room
router.delete("/:id/", authMiddleWare, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" }); //404 not found
    if (room.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorised" }); //404-Not authorised
    }
    await room.deleteOne();
    // broadcast deletion
    try {
      const io = getIo();
      io.emit("roomDeleted", req.params.id);
    } catch (emitErr) {
      console.warn("Socket not ready to emit roomDeleted", emitErr.message);
    }

    res.json("Deleted successfully");
  } catch (error) {
    console.error("Error deleting room", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add message to room
router.post("/:id/messages", authMiddleWare, async (req, res) => {
  try {
    const { clipId } = req.body; // <-- frontend should send clipId instead of clipUrl
    const clip = await Clip.findById(clipId);
    if (!clip) return res.status(404).json({ error: "Clip not found" });

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const message = {
      userId: req.user.id,
      clipUrl: clip.url,
      createdAt: new Date(),
    };

    room.messages.push(message);
    console.log(
      "POST /api/rooms/:id/messages body:",
      req.body,
      "user:",
      req.user.id
    );
    await room.save();
    console.log("Found clip:", clip?._id, "room:", room?._id);
    const savedMessage = room.messages[room.messages.length - 1];
    // construct response to include _id and roomId
    const responseMessage = {
      _id: savedMessage._id,
      clipUrl: savedMessage.clipUrl,
      createdAt: savedMessage.createdAt,
      roomId: room._id.toString(),
      isOwner: true,
    };
    res.status(201).json(responseMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send voice message" });
  }
});

// Get messages for a room
router.get("/:id/messages", authMiddleWare, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const messages = room.messages.map((m) => ({
      _id: m._id,
      clipUrl: m.clipUrl,
      createdAt: m.createdAt,
      isOwner: m.userId.toString() === req.user.id, // only creator sees as owner
    }));

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Delete messages from room
router.delete(
  "/:roomId/messages/:messageId",
  authMiddleWare,
  async (req, res) => {
    try {
      const { roomId, messageId } = req.params;

      const room = await Room.findById(roomId);
      if (!room) return res.status(404).json({ error: "Room not found" });

      const message = room.messages.id(messageId);
      if (!message) return res.status(404).json({ error: "Message not found" });

      if (message.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      message.deleteOne();
      await room.save();
      const { getIo } = require("../socket");
      const io = getIo();
      io.to(roomId).emit("roomMessageDeleted", messageId);

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
);

module.exports = router;
