import Room from "../models/Room.js";
import crypto from "crypto";

// Helper: generate random 6-char alphanumeric code
const generateRoomCode = () => crypto.randomBytes(3).toString("hex");

// -------------------- Create Room --------------------
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
      creator: req.user._id,          // store creator
      players: [req.user._id],
      isActive: true,
    });

    res.status(201).json(await room.populate("creator", "username email"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Get All Rooms --------------------
export const getRooms = async (req, res) => {
  try {
    // Populate players and creator
    const rooms = await Room.find()
      .populate("players", "username email")
      .populate("creator", "username email");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Join Room by Code --------------------
export const joinRoomByCode = async (req, res) => {
  const { code } = req.body;
  try {
    const room = await Room.findOne({ code }).populate("creator", "username email");

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(403).json({ message: "Room is not active" });

    if (!room.players.some(p => p.toString() === req.user._id.toString())) {
      room.players.push(req.user._id);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Toggle Room Status --------------------
export const toggleRoomStatus = async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Only creator can toggle
    if (room.creator && room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the room creator can change status" });
    }

    room.isActive = !room.isActive; // toggle status
    await room.save();

    res.json(await room.populate("creator", "username email"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
