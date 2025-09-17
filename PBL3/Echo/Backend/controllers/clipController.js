//controllers/clipController
const Clip = require("../models/Clip");
const fs = require("fs");
const path = require("path");
const uploadClip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No files uploaded" });
    console.log("Uploaded File", req.file.filename);

    const fileURL = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`; //http://localhost:5000/uploads/recording-1694567891234.webm

    const newClip = await Clip.create({
      userId: req.user.id,
      filename: req.file.filename,
      url: fileURL,
      size: req.file.size,
      duration: 0,
      processingStatus: "pending",
      roomId: req.body.roomId || null,
    });

    return res.status(201).json(newClip);
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
