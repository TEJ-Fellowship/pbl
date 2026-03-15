import express from "express";
import Drawing from "../models/Drawing.js";
import Cursor from "../models/Cursor.js";

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

// Get all drawings (exclude deleted)
router.get("/", async (req, res) => {
  try {
    const drawings = await Drawing.find({ deleted: false });
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-delete a drawing
router.delete("/:id", async (req, res) => {
  try {
    const drawing = await Drawing.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );
    res.json(drawing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore a drawing (redo)
router.post("/restore/:id", async (req, res) => {
  try {
    const drawing = await Drawing.findByIdAndUpdate(
      req.params.id,
      { deleted: false },
      { new: true }
    );
    res.json(drawing);
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
