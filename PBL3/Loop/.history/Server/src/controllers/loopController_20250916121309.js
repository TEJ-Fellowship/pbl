// controllers/loopController.js
import mongoose from "mongoose";
import Loop from "../models/Loop.js";

export const saveLoop = async (req, res) => {
  const { roomId, imageData } = req.body;

  // Basic checks
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!roomId) return res.status(400).json({ message: "roomId is required" });
  if (!imageData) return res.status(400).json({ message: "imageData is required" });

  // Validate roomId looks like an ObjectId
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: "Invalid roomId format" });
  }

  try {
    const loop = await Loop.create({
      room: roomId,
      creator: req.user._id,
      finalImage: imageData,
    });

    return res.status(201).json(loop);
  } catch (error) {
    // Log full stack to server console for debugging
    console.error("SaveLoop error:", error.stack || error);
    // Return an informative error message for dev
    return res.status(500).json({ message: "Server error saving loop", error: error.message });
  }
};

export const getLoop = async (req, res) => {
  const { roomId } = req.params;

  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!roomId) return res.status(400).json({ message: "roomId is required" });
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: "Invalid roomId format" });
  }

  try {
    const loops = await Loop.find({ room: roomId }).populate("creator", "username email");
    return res.json(loops);
  } catch (error) {
    console.error("GetLoop error:", error.stack || error);
    return res.status(500).json({ message: "Server error fetching loops", error: error.message });
  }
};
