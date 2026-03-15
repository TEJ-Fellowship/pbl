// controllers/loopController.js
import mongoose from "mongoose";
import Loop from "../models/Loop.js";

export const saveLoop = async (req, res) => {
  const { roomId, imageData, strokes, caption } = req.body;

  console.log("SaveLoop request received:", {
    roomId: roomId ? "present" : "missing",
    imageData: imageData ? `${imageData.length} characters` : "missing",
    strokes: Array.isArray(strokes) ? `${strokes.length} strokes` : "invalid/missing",
    caption: caption || "no caption",
    userId: req.user ? req.user._id : "no user"
  });

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - no user found" });
  }

  if (!roomId) {
    return res.status(400).json({ message: "roomId is required" });
  }

  if (!imageData) {
    return res.status(400).json({ message: "imageData is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: "Invalid roomId format" });
  }

  // Validate imageData format (base64 data url)
  if (typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
    return res.status(400).json({ message: "Invalid image data format" });
  }

  // Check image size (base64 encoded)
  const imageSizeBytes = Math.round((imageData.length * 3) / 4);
  const imageSizeMB = imageSizeBytes / (1024 * 1024);

  console.log(`SaveLoop: Image size is ${imageSizeMB.toFixed(2)}MB`);
  if (imageSizeMB > 16) {
    return res.status(413).json({
      message: `Image too large: ${imageSizeMB.toFixed(2)}MB. Maximum allowed: 16MB`
    });
  }

  if (!Array.isArray(strokes)) {
    return res.status(400).json({ message: "strokes must be an array" });
  }

  try {
    const loopData = {
      room: roomId,
      creator: req.user._id,
      finalImage: imageData,
      strokes: strokes.map(stroke => ({
        tool: stroke.tool || 'pen',
        color: stroke.color || '#000000',
        size: stroke.size || 2,
        points: Array.isArray(stroke.points) ? stroke.points : [],
        creator: stroke.creator || req.user._id
      })),
      caption: caption || "Drawing saved from canvas",
      metadata: {
        canvasWidth: null,
        canvasHeight: null,
        totalStrokes: strokes.length
      }
    };

    const loop = await Loop.create(loopData);

    console.log("SaveLoop: Successfully created loop:", loop._id);
    return res.status(201).json({
      _id: loop._id,
      room: loop.room,
      creator: loop.creator,
      caption: loop.caption,
      createdAt: loop.createdAt,
      strokesCount: loop.strokes.length,
      finalImageLength: loop.finalImage.length
    });

  } catch (error) {
    console.error("SaveLoop detailed error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
        details: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry",
        error: error.message
      });
    }

    return res.status(500).json({
      message: "Server error saving loop",
      error: error.message,
      type: error.name
    });
  }
};

export const getLoop = async (req, res) => {
  const { roomId } = req.params;

  console.log("GetLoop request for roomId:", roomId);

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!roomId) {
    return res.status(400).json({ message: "roomId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: "Invalid roomId format" });
  }

  try {
    const loops = await Loop.find({ room: roomId })
      .populate("creator", "username email")
      .sort({ createdAt: -1 });

    console.log(`GetLoop: Found ${loops.length} loops for room ${roomId}`);
    return res.json(loops);
  } catch (error) {
    console.error("GetLoop error:", error.stack || error);
    return res.status(500).json({
      message: "Server error fetching loops",
      error: error.message
    });
  }
};

// NEW: get all loops (for gallery main page)
// GET /api/loop
export const getAllLoops = async (req, res) => {
  try {
    // Optionally, return only loops created by the user:
    // const loops = await Loop.find({ creator: req.user._id }).sort({ createdAt: -1 });

    const loops = await Loop.find().populate("creator", "username email").sort({ createdAt: -1 });
    return res.json(loops);
  } catch (err) {
    console.error("GetAllLoops error:", err);
    return res.status(500).json({ message: "Server error fetching loops", error: err.message });
  }
};
