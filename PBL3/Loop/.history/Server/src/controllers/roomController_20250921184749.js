// ============= FIXED roomController.js =============
import Room from "../models/Room.js";
import crypto from "crypto";

// Helper: generate random 6-char alphanumeric code
const generateRoomCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

// Create Room
export const createRoom = async (req, res) => {
  const { name, description } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Room name is required" });
  }

  try {
    // Check if room name already exists for this user
    const existingRoom = await Room.findOne({ 
      name: name.trim(), 
      creator: req.user._id 
    });
    
    if (existingRoom) {
      return res.status(400).json({ message: "You already have a room with this name" });
    }

    let code;
    let attempts = 0;
    // Generate unique code
    do {
      code = generateRoomCode();
      attempts++;
    } while (await Room.findOne({ code }) && attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ message: "Failed to generate unique room code" });
    }

    const room = await Room.create({
      name: name.trim(),
      code,
      creator: req.user._id,
      players: [req.user._id],
      isActive: true,
      description: description?.trim() || ""
    });

    const populatedRoom = await Room.findById(room._id)
      .populate("creator", "username email")
      .populate("players", "username email");

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("players", "username email")
      .populate("creator", "username email")
      .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Get Room By ID --------------------
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("players", "username email");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Join Room by Code
export const joinRoomByCode = async (req, res) => {
  const { code } = req.body;
  
  if (!code || !code.trim()) {
    return res.status(400).json({ message: "Room code is required" });
  }

  try {
    const room = await Room.findOne({ code: code.trim().toUpperCase() })
      .populate("creator", "username email")
      .populate("players", "username email");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    if (!room.isActive) {
      return res.status(403).json({ message: "Room is not active" });
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      return res.status(403).json({ message: "Room is full" });
    }

    // Add user to room if not already in it
    const userId = req.user._id.toString();
    const isAlreadyInRoom = room.players.some(p => 
      (p._id || p).toString() === userId
    );

    if (!isAlreadyInRoom) {
      room.players.push(req.user._id);
      await room.save();
    }

    // Return updated room
    const updatedRoom = await Room.findById(room._id)
      .populate("creator", "username email")
      .populate("players", "username email");

    res.json(updatedRoom);
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle Room Status
export const toggleRoomStatus = async (req, res) => {
  const { roomId } = req.params;
  
  if (!roomId) {
    return res.status(400).json({ message: "Room ID is required" });
  }

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Only creator can toggle
    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the room creator can change status" });
    }

    room.isActive = !room.isActive;
    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate("creator", "username email")
      .populate("players", "username email");

    res.json(updatedRoom);
  } catch (error) {
    console.error("Toggle room status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Leave Room
export const leaveRoom = async (req, res) => {
  const { roomId } = req.params;

  if (!roomId) return res.status(400).json({ message: "Room ID is required" });

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Remove user from players array
    const userId = req.user._id.toString();
    room.players = room.players.filter(p => (p._id || p).toString() !== userId);

    await room.save();

    res.json({ message: "You have left the room", room });
  } catch (error) {
    console.error("Leave room error:", error);
    res.status(500).json({ message: error.message });
  }
};
