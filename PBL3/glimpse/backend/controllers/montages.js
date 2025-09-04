// routes/montages.js
import express from "express";
import Montage from "../models/montage.js";
import authMiddleware from "../utils/authMiddleware.js";

const router = express.Router();

// Create montage (after processing job)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { month, year, videoUrl, aiSummary } = req.body;
    const montage = new Montage({
      user: req.user.id,
      month,
      year,
      videoUrl,
      aiSummary
    });
    await montage.save();
    res.json(montage);
  } catch (err) {
    res.status(400).json({ error: "Montage creation failed" });
  }
});

// Get all montages for user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const montages = await Montage.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(montages);
  } catch (err) {
    res.status(500).json({ error: "Fetching montages failed" });
  }
});

export default router;
