const jwt = require("jsonwebtoken");
const clipsRouter = require("express").Router();
const User = require("../models/user");
const Clip = require("../models/clip");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
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

// Generate montage route
clipsRouter.post("/montage", auth, async (request, response) => {
  try {
    const user = request.user;
    const { month, year } = request.body; // Expected format: { month: "2025-07", year: 2025 }

    if (!user) {
      return response.status(401).json({ error: "User not authenticated" });
    }

    if (!month || !year) {
      return response
        .status(400)
        .json({ error: "Month and year are required" });
    }

    console.log(`🎬 Creating montage for ${month} for user ${user.id}`);

    // Find clips for the specific month and year
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

    const clips = await Clip.find({
      user: user.id,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: 1 });

    if (clips.length === 0) {
      return response
        .status(404)
        .json({ error: "No clips found for this month" });
    }

    console.log(`📹 Found ${clips.length} clips for montage`);

    // Create montage
    const montageResult = await createMontage(clips, user.id, month);

    response.status(200).json({
      message: "Montage created successfully",
      montageUrl: montageResult.secure_url,
      publicId: montageResult.public_id,
      clipsCount: clips.length,
    });
  } catch (error) {
    console.error("❌ Montage creation error:", error);
    response.status(500).json({
      error: "Failed to create montage",
      details: error.message,
    });
  }
});

// Helper function to create montage
async function createMontage(clips, userId, month) {
  return new Promise(async (resolve, reject) => {
    try {
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(
        tempDir,
        `montage_${userId}_${month.replace("-", "_")}_${Date.now()}.mp4`
      );

      console.log(`🎥 Creating montage at: ${outputPath}`);

      // Download video files temporarily
      const tempFiles = [];
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const tempFile = path.join(tempDir, `clip_${i}_${Date.now()}.mp4`);

        // Download from Cloudinary
        const https = require("https");
        const file = fs.createWriteStream(tempFile);

        await new Promise((resolveDownload, rejectDownload) => {
          https
            .get(clip.videoUrl, (response) => {
              response.pipe(file);
              file.on("finish", () => {
                file.close();
                resolveDownload();
              });
            })
            .on("error", rejectDownload);
        });

        tempFiles.push(tempFile);
      }

      // Create FFmpeg command to concatenate videos
      let ffmpegCommand = ffmpeg();

      // Add each video file as input
      tempFiles.forEach((file) => {
        ffmpegCommand = ffmpegCommand.input(file);
      });

      // Configure output
      ffmpegCommand
        .on("start", (commandLine) => {
          console.log("🎬 FFmpeg started:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(
            "🎥 Processing: " + Math.round(progress.percent || 0) + "% done"
          );
        })
        .on("end", async () => {
          console.log("✅ Video concatenation finished");

          try {
            // Upload montage to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(outputPath, {
              resource_type: "video",
              folder: `user_montages/${userId}`,
              public_id: `montage_${month.replace("-", "_")}_${Date.now()}`,
            });

            // Clean up temp files
            tempFiles.forEach((file) => {
              if (fs.existsSync(file)) fs.unlinkSync(file);
            });
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            resolve(uploadResult);
          } catch (uploadError) {
            reject(uploadError);
          }
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          // Clean up temp files on error
          tempFiles.forEach((file) => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          reject(err);
        })
        .complexFilter([
          // Create a filter to concatenate videos
          tempFiles.map((_, index) => `[${index}:v]`).join("") +
            `concat=n=${tempFiles.length}:v=1:a=1[outv][outa]`,
        ])
        .outputOptions(["-map", "[outv]", "-map", "[outa]"])
        .output(outputPath)
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = clipsRouter;
