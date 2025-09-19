import express from "express";
import Drawing from "../models/Drawing.js";
import Cursor from "../models/Cursor.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Save a new stroke
router.post("/", protect, async (req, res) => {
  try {
    const { roomId, tool, color, size, points } = req.body;

    if (!roomId || !tool || !color || !size || !points || !Array.isArray(points)) {
      return res.status(400).json({
        error: "Missing required fields: roomId, tool, color, size, points"
      });
    }

    if (points.length < 2) {
      return res.status(400).json({
        error: "A stroke must have at least 2 points"
      });
    }

    const validPoints = points.every(point =>
      typeof point.x === 'number' && typeof point.y === 'number'
    );

    if (!validPoints) {
      return res.status(400).json({
        error: "All points must have valid x and y coordinates"
      });
    }

    const drawing = new Drawing({
      roomId,
      tool,
      color,
      size,
      points,
      creator: req.user._id
    });

    await drawing.save();
    res.status(201).json(drawing);
  } catch (err) {
    console.error("Save stroke error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all strokes for a specific room
router.get("/:roomId", protect, async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const drawings = await Drawing.find({ roomId })
      .sort({ createdAt: 1 }) // oldest → newest
      .populate("creator", "username");

    res.json(drawings);
  } catch (err) {
    console.error("Get strokes error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete stroke by ID
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const stroke = await Drawing.findById(id);
    if (!stroke) {
      return res.status(404).json({ error: "Stroke not found" });
    }

    // Optional: allow only creator to delete - comment/uncomment as desired
    // if (String(stroke.creator) !== String(req.user._id)) {
    //   return res.status(403).json({ error: "Not authorized to delete this stroke" });
    // }

    await Drawing.findByIdAndDelete(id);
    res.json({ message: "Stroke deleted", strokeId: id });
  } catch (err) {
    console.error("Delete stroke error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Undo last stroke for a specific room
router.delete("/room/:roomId/undo", protect, async (req, res) => {
  try {
    const { roomId } = req.params;

    const lastStroke = await Drawing.findOne({ roomId }).sort({ createdAt: -1 });

    if (!lastStroke) {
      return res.status(404).json({ message: "No strokes to undo in this room" });
    }

    await Drawing.findByIdAndDelete(lastStroke._id);
    res.json({
      message: "Last stroke undone",
      stroke: lastStroke,
      roomId
    });
  } catch (err) {
    console.error("Undo error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Clear all strokes for a room (optional - for admin use)
router.delete("/room/:roomId/clear", protect, async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await Drawing.deleteMany({ roomId });
    res.json({
      message: "All strokes cleared",
      deletedCount: result.deletedCount,
      roomId
    });
  } catch (err) {
    console.error("Clear room error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Cursor tracking routes (existing functionality)
router.get("/cursors/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const cursors = await Cursor.find({ roomId });
    res.json(cursors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/cursors", async (req, res) => {
  try {
    const { userId, roomId, x, y, color } = req.body;
    const cursor = await Cursor.findOneAndUpdate(
      { userId, roomId },
      { x, y, color, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    res.json(cursor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
