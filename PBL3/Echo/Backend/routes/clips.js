//routes/clips
const express = require("express");
const router = express.Router();
const Clip = require("../models/Clip");
const upload = require("../middleware/upload");
const { uploadClip } = require("../controllers/clipController");
const { authMiddleWare } = require("../utils/middleware");

router.post("/", authMiddleWare, upload.single("audio"), uploadClip); //order matters
router.patch("/:id/reactions", authMiddleWare, async (req, res) => {
  try {
    const { type } = req.body;
    const clipId = req.params.id;
    const clip = await Clip.findById(clipId);
    if (!clip) return res.status(404).json({ error: "Clip not found" });

    if (type in clip.reactions) {
      clip.reactions[type] += 1;
    } else {
      return res.status(400).json({ error: "Invalid reaction type" });
    }
    await clip.save();
    res.json(clip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});
router.get("/", authMiddleWare, async (req, res) => {
  try {
    const clips = await Clip.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(clips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clips" });
  }
});

module.exports = router;
