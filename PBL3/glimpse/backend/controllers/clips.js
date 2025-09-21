const jwt = require("jsonwebtoken");
const clipsRouter = require("express").Router();
const User = require("../models/user");
const Clip = require("../models/clip");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const { uploadSingle } = require("../utils/uploadMiddleware");
const auth = require("../utils/authMiddleware");

clipsRouter.post("/", auth, uploadSingle("file"), async (request, response) => {
  try {
    const user = request.user;
    if (!user)
      return response.status(401).json({ error: "User not authenticated" });

    if (!request.file)
      return response.status(400).json({ error: "No file uploaded" });

    const result = await cloudinary.uploader.upload(request.file.path, {
      resource_type: "video",
      folder: `user_videos/${user.id}`,
      eager: [{ width: 300, height: 200, crop: "scale", format: "jpg" }],
      transformation: [
        { start_offset: 0, end_offset: 1},
        { aspect_ratio: "4:5", crop: "fill"}
      ]
    });

    fs.unlinkSync(request.file.path);

    const hasThumbnail = result.eager && result.eager[0];

    const clip = new Clip({
      videoUrl: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: hasThumbnail ? result.eager[0].secure_url : null,
      thumbnailPublicId: hasThumbnail ? result.eager[0].public_id : null,
      user: user.id,
      createdAt: new Date(),
    });

    await clip.save();
    response.status(201).json(clip);
  } catch (err) {
    console.error("Full error details:", err);

    if (request.file && request.file.path) {
      try {
        fs.unlinkSync(request.file.path);
      } catch (unlinkErr) {
        console.error("Failed to clean up file:", unlinkErr);
      }
    }

    response.status(500).json({
      error: "Failed to upload video",
      details: err.message,
    });
  }
});

clipsRouter.get("/", auth, async (request, response) => {
  try {
    const user = request.user;
    if (!user) {
      return response.status(401).json({ error: "User not authenticated" });
    }
    const clips = await Clip.find({ user: user.id }).sort({ createdAt: -1 });
    response.json(clips);
  } catch (err) {
    response.status(500).json({ error: "Failed to fetch clips" });
  }
});

clipsRouter.delete("/:id", auth, async (request, response) => {
  try {
    const user = request.user;
    if (!user)
      return response.status(401).json({ error: "User not authenticated" });

    const clip = await Clip.findById(request.params.id);

    if (!clip) return response.status(404).json({ error: "Clip not found" });
    if (clip.user.toString() !== user.id) {
      return response
        .status(403)
        .json({ error: "You are not allowed to delete this clip" });
    }
    try {
      if (clip.publicId) {
        await cloudinary.uploader.destroy(clip.publicId, {
          resource_type: "video",
        });
      }
      if (clip.thumbnailPublicId) {
        await cloudinary.uploader.destroy(clip.thumbnailPublicId, {
          resource_type: "image",
        });
      }
    } catch (cloudinaryError) {
      console.error("⚠️ Cloudinary deletion failed:", cloudinaryError);
    }

    await Clip.findByIdAndDelete(request.params.id);

    response.status(200).json({ message: "Clip deleted successfully" });
  } catch (err) {
    console.error("Delete error details:", {
      message: err.message,
      stack: err.stack,
      clipId: request.params.id,
      userId: request.user?.id,
    });
    response.status(500).json({
      error: "Failed to delete clip",
      details: err.message,
    });
  }
});

module.exports = clipsRouter;
