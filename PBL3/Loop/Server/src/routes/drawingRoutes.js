// Fixed routes/drawingRoutes.js with shape support
import express from "express";
import Drawing from "../models/Drawing.js";
import Cursor from "../models/Cursor.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Save a new stroke (including shapes)
router.post("/", protect, async (req, res) => {
  try {
    const { roomId, tool, color, size, points, startX, startY, endX, endY } = req.body;

    // Validation
    if (!roomId || !tool || !color || !size) {
      return res.status(400).json({
        error: "Missing required fields: roomId, tool, color, size"
      });
    }

    // Validate tool type
    const validTools = ["pen", "eraser", "circle", "square", "rectangle", "triangle", "hexagon", "star"];
    if (!validTools.includes(tool)) {
      return res.status(400).json({
        error: `Invalid tool: ${tool}. Valid tools: ${validTools.join(', ')}`
      });
    }

    let drawingData = {
      roomId,
      tool,
      color,
      size,
      creator: req.user._id
    };

    // Handle different tool types
    if (tool === "pen" || tool === "eraser") {
      // Freehand drawing - requires points array
      if (!points || !Array.isArray(points) || points.length < 2) {
        return res.status(400).json({
          error: "Pen and eraser tools require at least 2 points"
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

      drawingData.points = points;
    } else {
      // Shape drawing - requires start/end coordinates or points
      if (startX !== undefined && startY !== undefined && endX !== undefined && endY !== undefined) {
        // Use explicit coordinates
        drawingData.startX = startX;
        drawingData.startY = startY;
        drawingData.endX = endX;
        drawingData.endY = endY;
        drawingData.points = [
          { x: startX, y: startY },
          { x: endX, y: endY }
        ];
      } else if (points && Array.isArray(points) && points.length >= 2) {
        // Use points array for backward compatibility
        drawingData.points = points;
        drawingData.startX = points[0].x;
        drawingData.startY = points[0].y;
        drawingData.endX = points[points.length - 1].x;
        drawingData.endY = points[points.length - 1].y;
      } else {
        return res.status(400).json({
          error: "Shape tools require either startX/Y, endX/Y coordinates or points array with at least 2 points"
        });
      }
    }

    const drawing = new Drawing(drawingData);
    await drawing.save();
    
    console.log(`Saved ${tool} stroke:`, drawing._id);
    res.status(201).json(drawing);
  } catch (err) {
    console.error("Save stroke error:", err);
    res.status(500).json({ error: "Failed to save stroke", details: err.message });
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

    console.log(`Retrieved ${drawings.length} strokes for room ${roomId}`);
    res.json(drawings);
  } catch (err) {
    console.error("Get strokes error:", err);
    res.status(500).json({ error: "Failed to retrieve strokes", details: err.message });
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

    // Optional: allow only creator to delete their own strokes
    // Uncomment if you want strict ownership
    // if (String(stroke.creator) !== String(req.user._id)) {
    //   return res.status(403).json({ error: "Not authorized to delete this stroke" });
    // }

    await Drawing.findByIdAndDelete(id);
    console.log(`Deleted stroke: ${id}`);
    res.json({ message: "Stroke deleted", strokeId: id });
  } catch (err) {
    console.error("Delete stroke error:", err);
    res.status(500).json({ error: "Failed to delete stroke", details: err.message });
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
    console.log(`Undid last stroke in room ${roomId}:`, lastStroke._id);
    res.json({
      message: "Last stroke undone",
      stroke: lastStroke,
      roomId
    });
  } catch (err) {
    console.error("Undo error:", err);
    res.status(500).json({ error: "Failed to undo stroke", details: err.message });
  }
});

// Clear all strokes for a room (admin function)
router.delete("/room/:roomId/clear", protect, async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await Drawing.deleteMany({ roomId });
    console.log(`Cleared ${result.deletedCount} strokes from room ${roomId}`);
    res.json({
      message: "All strokes cleared",
      deletedCount: result.deletedCount,
      roomId
    });
  } catch (err) {
    console.error("Clear room error:", err);
    res.status(500).json({ error: "Failed to clear room", details: err.message });
  }
});

// Cursor tracking routes
router.get("/cursors/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const cursors = await Cursor.find({ roomId });
    res.json(cursors);
  } catch (err) {
    console.error("Get cursors error:", err);
    res.status(500).json({ error: "Failed to get cursors", details: err.message });
  }
});

router.post("/cursors", async (req, res) => {
  try {
    const { userId, roomId, x, y, color, username } = req.body;
    
    if (!userId || !roomId || typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: "Missing required cursor data" });
    }

    const cursor = await Cursor.findOneAndUpdate(
      { userId, roomId },
      { 
        x, 
        y, 
        color: color || "#000000", 
        username: username || "Anonymous",
        lastUpdated: new Date() 
      },
      { new: true, upsert: true }
    );
    
    res.json(cursor);
  } catch (err) {
    console.error("Update cursor error:", err);
    res.status(500).json({ error: "Failed to update cursor", details: err.message });
  }
});

export default router;