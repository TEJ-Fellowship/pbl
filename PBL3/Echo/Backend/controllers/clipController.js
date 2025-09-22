// backend/controllers/clipController.js (replace uploadClip)
const Clip = require("../models/Clip");
const fs = require("fs");
const path = require("path");
const { getIo } = require("../socket");

const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];

const uploadClip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No files uploaded" });
    console.log("Uploaded File", req.file.filename);

    const fileURL = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    const newClip = await Clip.create({
      userId: req.user.id,
      filename: req.file.filename,
      url: fileURL,
      size: req.file.size,
      duration: 0,
      processingStatus: "pending",
      roomId: req.body.roomId || null,
    });

    // aggregated reactions (all zeros)
    const aggregated = reactionTypes.reduce((acc, r) => {
      acc[r] = 0;
      return acc;
    }, {});

    // Response for uploader: include isOwner true
    const responseClip = {
      ...newClip.toObject(),
      reactions: aggregated,
      isOwner: true,
    };

    // Emit sanitized clip to other clients (do NOT include isOwner)
    try {
      if (!newClip.roomId) {
        const io = getIo();
        const sanitized = {
          ...newClip.toObject(),
          reactions: aggregated,
          // no isOwner field here
        };
        // broadcast to everyone (you can use broadcast from socket side if you track socket id)
        io.emit("feedClipAdded", sanitized);
      }
    } catch (emitErr) {
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
