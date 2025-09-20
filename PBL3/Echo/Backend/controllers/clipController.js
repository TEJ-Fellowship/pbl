// backend/controllers/clipController.js
const Clip = require("../models/Clip");
const fs = require("fs");
const path = require("path");
const { getIo } = require("../socket"); // <-- add this

const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];

const uploadClip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No files uploaded" });
    console.log("Uploaded File", req.file.filename);

    const fileURL = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    // create clip in DB
    const newClip = await Clip.create({
      userId: req.user.id,
      filename: req.file.filename,
      url: fileURL,
      size: req.file.size,
      duration: 0,
      processingStatus: "pending",
      roomId: req.body.roomId || null,
    });

    // Build aggregated reactions object (initially zeros)
    const aggregated = reactionTypes.reduce((acc, r) => {
      acc[r] = 0;
      return acc;
    }, {});

    // Build response object that matches the shape your GET /api/clips returns
    const responseClip = {
      ...newClip.toObject(),
      reactions: aggregated,
      isOwner: true, // sender should see their own clip immediately
    };

    // Broadcast to everyone (feed) only for global clips (roomId === null)
    try {
      if (!responseClip.roomId) {
        const io = getIo();
        io.emit("feedClipAdded", responseClip);
      }
    } catch (emitErr) {
      // safe fallback if socket not initialized yet
      console.warn("Socket not ready to emit feedClipAdded", emitErr.message);
    }

    return res.status(201).json(responseClip);
  } catch (err) {
    console.log("Upload error", err);
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.log("Failed to delete some files", err);
      });
    }
    return res
      .status(500)
      .json({ message: "Server error while uploading clip" });
  }
};

module.exports = { uploadClip };
