
const Clip = require("../models/Clip");
const { getIo } = require("../socket");

const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];

const uploadClip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No files uploaded" });

    console.log("Uploaded to Cloudinary:", req.file.path);

    const newClip = await Clip.create({
      userId: req.user.id,
      filename: req.file.filename,   // cloudinary public_id
      url: req.file.path,            // cloudinary secure URL
      size: req.file.size || 0,
      duration: 0,
      processingStatus: "pending",
      roomId: req.body.roomId || null,
    });

    const aggregated = reactionTypes.reduce((acc, r) => {
      acc[r] = 0;
      return acc;
    }, {});

    const responseClip = {
      ...newClip.toObject(),
      reactions: aggregated,
      isOwner: true,
    };

    try {
      if (!newClip.roomId) {
        const io = getIo();
        const sanitized = {
          ...newClip.toObject(),
          reactions: aggregated,
        };
        io.emit("feedClipAdded", sanitized);
      }
    } catch (emitErr) {
      console.warn("Socket not ready to emit feedClipAdded", emitErr.message);
    }

    return res.status(201).json(responseClip);
  } catch (err) {
    console.error("Upload error", err);
    return res.status(500).json({ message: "Server error while uploading clip" });
  }
};

module.exports = { uploadClip };
