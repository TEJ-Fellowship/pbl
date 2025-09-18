//routes/clips
const express = require("express");
const router = express.Router();
const Clip = require("../models/Clip");
const upload = require("../middleware/upload");
const { uploadClip } = require("../controllers/clipController");
const { authMiddleWare } = require("../utils/middleware");

router.post("/", authMiddleWare, upload.single("audio"), uploadClip); //order matters
// const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];

const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];

router.patch("/:id/reactions", authMiddleWare, async (req, res) => {
  try {
    const { type } = req.body;
    const clipId = req.params.id;

    if (!reactionTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const clip = await Clip.findById(clipId);
    if (!clip) return res.status(404).json({ error: "Clip not found" });

    // Make sure reactions array exists
    clip.reactions = clip.reactions || [];

    // Find existing reaction by this user
    let existingReaction = clip.reactions.find(
      (r) => r.userId && r.userId.toString() === req.user.id
    );

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off reaction
        clip.reactions = clip.reactions.filter(
          (r) => r.userId && r.userId.toString() !== req.user.id
        );
      } else {
        // Change reaction type
        existingReaction.type = type;
      }
    } else {
      // Add new reaction
      clip.reactions.push({ userId: req.user.id, type });
    }

    await clip.save();

    // Aggregate counts for each reaction type
    const aggregated = reactionTypes.reduce((acc, rType) => {
      acc[rType] = clip.reactions.filter((r) => r.type === rType).length;
      return acc;
    }, {});

    res.json({ ...clip.toObject(), reactions: aggregated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

router.get("/", authMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const clips = await Clip.find({ roomId: null })
      .sort({ createdAt: -1 })
      .lean();
    const withOwnership = clips.map((c) => ({
      ...c,
      isOwner: c.userId.toString() === userId,
    }));
    res.json(withOwnership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clips" });
  }
});

router.delete("/:id", authMiddleWare, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);
    if (!clip) return res.status(404).json({ error: "Clip not found" });
    if (clip.userId.toString() != req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this clip" });
    }
    await clip.deleteOne();
    res.json({ message: "Clip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete clip" });
  }
});

module.exports = router;
