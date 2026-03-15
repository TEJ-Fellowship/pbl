import express from "express";
import Drawing from "../models/Drawing.js"; // Mongoose model
import Cursor from "../models/Cursor.js";   // Mongoose model

const router = express.Router();

// Save a drawing
router.post("/", async (req, res) => {
  try {
    const drawing = new Drawing(req.body);
    await drawing.save();
    res.status(201).json(drawing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all drawings
router.get("/", async (req, res) => {
  try {
    const drawings = await Drawing.find();
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete drawing by ID
router.delete("/:id", async (req, res) => {
  try {
    await Drawing.findByIdAndDelete(req.params.id);
    res.json({ message: "Drawing deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cursors
router.get("/cursors", async (req, res) => {
  try {
    const cursors = await Cursor.find();
    res.json(cursors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a cursor
router.post("/cursors", async (req, res) => {
  try {
    const { userId, x, y, color } = req.body;
    const cursor = await Cursor.findOneAndUpdate(
      { userId },
      { x, y, color },
      { new: true, upsert: true }
    );
    res.json(cursor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
