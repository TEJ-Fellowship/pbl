import Room from "../models/Room.js";
import crypto from "crypto";

// Helper: generate random 6-char alphanumeric code
const generateRoomCode = () => crypto.randomBytes(3).toString("hex");

// Create Room
export const createRoom = async (req, res) => {
  const { name } = req.body;
  try {
    if (await Room.findOne({ name })) {
      return res.status(400).json({ message: "Room name already exists" });
    }

    const code = generateRoomCode();

    const room = await Room.create({
      name,
      code,
      players: [req.user._id], // ✅ match schema
      isActive: true,
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("players", "username email");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join Room by Code
export const joinRoomByCode = async (req, res) => {
  const { code } = req.body; // { code: "a1b2c3" }
  try {
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(403).json({ message: "Room is not active" });

    if (!room.players.includes(req.user._id)) {
      room.players.push(req.user._id);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate Room
export const deactivateRoom = async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.isActive = false;
    await room.save();

    res.json({ message: "Room deactivated successfully", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
