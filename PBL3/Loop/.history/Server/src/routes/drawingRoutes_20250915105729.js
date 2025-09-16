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
    const drawing = await Drawing.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    res.json({ message: "Drawing soft-deleted", drawing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get cursors
router.get("/", async (req, res) => {
  try {
    const drawings = await Drawing.find({ deleted: false });
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update a cursor
router.post("/restore/:id", async (req, res) => {
  try {
    const drawing = await Drawing.findByIdAndUpdate(req.params.id, { deleted: false }, { new: true });
    res.json({ message: "Drawing restored", drawing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
