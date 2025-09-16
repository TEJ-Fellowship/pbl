const express = require("express");
const { authMiddleWare } = require("../utils/middleware");
const router = express.Router();
const Room = require("../models/room");
const bcrypt = require("bcrypt");
// Get all rooms
router.get("/", authMiddleWare, async (req, res) => {
  try {
    const rooms = await Room.find()
      .sort({
        createdAt: -1,
      })
      .lean();
    const withOwnerShip = rooms.map((r) => ({
      ...r,
      isOwner: r.userId.toString() === req.user.id,
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
      return res.status(400).json({ error: "name & password are required " });
    const passwordHash = await bcrypt.hash(password, 10);
    const newRoom = new Room({
      name,
      passwordHash,
      userId: req.user.id,
    });
    await newRoom.save();
    res.status(201).json({ ...newRoom.toObject(), isOwner: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Join room
router.post("/:id/join", authMiddleWare, async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(400).json({ error: "room not found" });
    const isValid = await bcrypt.compare(password, room.passwordHash);
    if (!isValid) return res.status(404).json({ error: "Wrong Password" });
    res.json({ message: "Joined Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to join room" });
  }
});

module.exports = router;
