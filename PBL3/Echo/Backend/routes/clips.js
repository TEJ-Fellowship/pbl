//routes/clips
const express = require("express");
const router = express.Router();
const Clip = require("../models/Clip");
const upload = require("../middleware/upload");
const { uploadClip } = require("../controllers/clipController");
const { authMiddleWare } = require("../utils/middleware");

router.post("/", authMiddleWare, upload.single("audio"), uploadClip); //order matters
const { getIo } = require("../socket"); // expose io from socket.js

router.patch("/:id/reactions", authMiddleWare, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);
    if (!clip) return res.status(404).json({ error: "Clip not found" });

    const { type } = req.body;
    const userId = req.user.id;

    // remove old reaction by same user
    clip.reactions = clip.reactions.filter(
      (r) => r.userId.toString() !== userId
    );
    // push new
    clip.reactions.push({ userId, type });

    await clip.save();

    // aggregate counts
    const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];
    const aggregated = reactionTypes.reduce((acc, r) => {
      acc[r] = clip.reactions.filter((x) => x.type === r).length;
      return acc;
    }, {});

    const updatedClip = {
      ...clip.toObject(),
      reactions: aggregated,
      isOwner: clip.userId.toString() === userId,
    };

    // 👉 broadcast to everyone else
    const io = getIo();
    // create a sanitized version (no isOwner), include userId as string to be safe
    const sanitized = {
      ...updatedClip,
      userId: updatedClip.userId
        ? String(updatedClip.userId)
        : updatedClip.userId,
    };
    // emit sanitized
    io.emit("feedClipUpdated", sanitized);

    res.json(updatedClip);
  } catch (err) {
    console.error("Reaction failed:", err);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];

router.get("/", authMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const clips = await Clip.find({ roomId: null })
      .sort({ createdAt: -1 })
      .lean();

    const withOwnershipAndAggregated = clips.map((c) => {
      const reactionsArray = c.reactions || [];
      // build aggregated counts object
      const aggregated = reactionTypes.reduce((acc, r) => {
        acc[r] = reactionsArray.filter((x) => x.type === r).length;
        return acc;
      }, {});
      return {
        ...c,
        isOwner: c.userId.toString() === userId,
        reactions: aggregated,
      };
    });

    res.json(withOwnershipAndAggregated);
  } catch (err) {
    console.error("Failed to fetch clips:", err);
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

    // broadcast deletion to all connected clients so they can remove it live
    try {
      const { getIo } = require("../socket");
      const io = getIo();
      io.emit("clipDeleted", clip._id); // emit the id only (sanitized)
    } catch (emitErr) {
      console.warn("Socket not ready to emit clipDeleted:", emitErr.message);
    }
    res.json({ message: "Clip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete clip" });
  }
});

module.exports = router;
