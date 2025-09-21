const montageRouter = require("express").Router();
const User = require("../models/user");
const Clip = require("../models/clip");
const Montage = require("../models/montage");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const https = require("https");
const auth = require("../utils/authMiddleware");

// Set FFmpeg path explicitly
ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");

// Generate montage route
montageRouter.post("/generate", auth, async (request, response) => {
  try {
    const user = request.user;
    const { month, year, musicId } = request.body; // Expected format: { month: 9, year: 2024, musicId: optional }

    console.log(`🎬 Received montage request:`, {
      month,
      year,
      musicId,
      userId: user.id,
    });

    if (!user) {
      return response.status(401).json({ error: "User not authenticated" });
    }

    if (!month || !year) {
      return response
        .status(400)
        .json({ error: "Month and year are required" });
    }

    console.log(
      `🎬 Creating montage for month ${month}/${year} for user ${user.id}`
    );

    // Create start and end date strings for the specified month/year (format: YYYY-MM-DD)
    const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDateStr = `${year}-${month.toString().padStart(2, "0")}-${endDay
      .toString()
      .padStart(2, "0")}`;

    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);

    // Find clips for the specific month (using string date field)
    const clips = await Clip.find({
      user: user.id,
      date: {
        $gte: startDateStr,
        $lte: endDateStr,
      },
    }).sort({ date: 1 });

    console.log(`📹 Found ${clips.length} clips for montage`);

    if (clips.length === 0) {
      return response.status(404).json({
        error: "No clips found for this month",
        message: `No clips found for ${month}/${year}`,
        month: month,
        year: year,
        clipsCount: 0,
      });
    }

    // Check if clips are short (under 10 seconds each) for fast processing
    const totalDuration = clips.reduce(
      (sum, clip) => sum + (clip.duration || 5),
      0
    );
    const isShortClipMontage = totalDuration < 60; // Less than 1 minute total

    console.log(
      `📹 Found ${clips.length} clips (${totalDuration}s total) - Using ${
        isShortClipMontage ? "FAST" : "STANDARD"
      } processing mode`
    );

    // Create montage with optimized processing mode
    const montageResult = await createMontage(
      clips,
      user.id,
      month,
      musicId,
      isShortClipMontage
    );

    // Save montage to database
    const newMontage = new Montage({
      user: user.id,
      month: month,
      year: year,
      videoUrl: montageResult.secure_url,
      musicUrlId: musicId || null, // Save the music ID if provided
      thumbnailUrl:
        montageResult.eager && montageResult.eager[0]
          ? montageResult.eager[0].secure_url
          : null,
      shortClipsIds: clips.map((clip) => clip.id), // Store the clip IDs that were used
    });

    const savedMontage = await newMontage.save();
    console.log(`💾 Montage saved to database with ID: ${savedMontage.id}`);

    response.status(200).json({
      success: true,
      message: "Montage created successfully",
      montageId: savedMontage.id,
      montageUrl: montageResult.secure_url,
      publicId: montageResult.public_id,
      thumbnailUrl:
        montageResult.eager && montageResult.eager[0]
          ? montageResult.eager[0].secure_url
          : null,
      clipsCount: clips.length,
      month: month,
      year: year,
    });
  } catch (error) {
    console.error("❌ Montage creation error:", error);
    response.status(500).json({
      error: "Failed to create montage",
      details: error.message,
    });
  }
});

// Get user's montages
montageRouter.get("/", auth, async (request, response) => {
  try {
    const user = request.user;

    if (!user) {
      return response.status(401).json({ error: "User not authenticated" });
    }

    // Fetch user's montages from database
    const montages = await Montage.find({ user: user.id })
      .populate("shortClipsIds", "videoUrl thumbnailUrl description date")
      .populate("musicUrlId", "title artist genre mood url") // Populate music info
      .sort({ createdAt: -1 }); // Most recent first

    console.log(`📚 Found ${montages.length} montages for user ${user.id}`);

    response.status(200).json({
      success: true,
      message: "Montages retrieved successfully",
      montages: montages,
      count: montages.length,
    });
  } catch (error) {
    console.error("❌ Error fetching montages:", error);
    response.status(500).json({
      error: "Failed to fetch montages",
      details: error.message,
    });
  }
});

// Add music to existing montage (without regenerating video)
montageRouter.post("/add-music/:montageId", auth, async (request, response) => {
  try {
    const { montageId } = request.params;
    const { musicId } = request.body;
    const user = request.user;

    console.log(`🎵 Adding music to montage ${montageId} for user ${user.id}`);

    // Find the existing montage
    const existingMontage = await Montage.findOne({
      _id: montageId,
      user: user.id,
    });

    if (!existingMontage) {
      return response.status(404).json({
        success: false,
        error: "Montage not found",
      });
    }

    if (!musicId) {
      return response.status(400).json({
        success: false,
        error: "Music ID is required",
      });
    }

    // Get music track
    const Music = require("../models/music");
    const musicTrack = await Music.findById(musicId);
    if (!musicTrack) {
      return response.status(404).json({
        success: false,
        error: "Music track not found",
      });
    }

    console.log(
      `🎵 Applying music: ${musicTrack.title} by ${musicTrack.artist}`
    );

    // Create new montage with music
    const newMontageWithMusic = await addMusicToMontage(
      existingMontage.videoUrl,
      musicTrack,
      user.id,
      existingMontage.month
    );

    // Create new montage entry
    const newMontage = new Montage({
      user: user.id,
      month: existingMontage.month,
      year: existingMontage.year,
      videoUrl: newMontageWithMusic.secure_url,
      musicUrlId: musicId,
      thumbnailUrl:
        newMontageWithMusic.eager && newMontageWithMusic.eager[0]
          ? newMontageWithMusic.eager[0].secure_url
          : existingMontage.thumbnailUrl,
      shortClipsIds: existingMontage.shortClipsIds,
    });

    const savedMontage = await newMontage.save();

    response.status(200).json({
      success: true,
      message: "Music added to montage successfully",
      montage: savedMontage,
      montageUrl: newMontageWithMusic.secure_url,
      musicTrack: {
        title: musicTrack.title,
        artist: musicTrack.artist,
        genre: musicTrack.genre,
      },
    });
  } catch (error) {
    console.error("❌ Error adding music to montage:", error);
    response.status(500).json({
      success: false,
      error: "Failed to add music to montage",
      details: error.message,
    });
  }
});

// Helper function to create montage - FIXED VERSION
async function createMontage(
  clips,
  userId,
  month,
  musicId = null,
  isShortClipMontage = false
) {
  return new Promise(async (resolve, reject) => {
    try {
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(
        tempDir,
        `montage_${userId}_${month}_${Date.now()}.mp4`
      );

      console.log(`🎥 Creating montage at: ${outputPath}`);

      // Get music track if provided
      let musicFile = null;
      if (musicId) {
        try {
          const Music = require("../models/music");
          const musicTrack = await Music.findById(musicId);
          if (musicTrack) {
            musicFile = path.join(tempDir, `music_${Date.now()}.mp3`);
            console.log(
              `🎵 Downloading music: ${musicTrack.title} by ${musicTrack.artist}`
            );

            // Download music file
            await new Promise((resolveMusic, rejectMusic) => {
              const file = fs.createWriteStream(musicFile);
              https
                .get(musicTrack.url, (response) => {
                  response.pipe(file);
                  file.on("finish", () => {
                    file.close();
                    console.log(`✅ Music downloaded: ${musicFile}`);
                    resolveMusic();
                  });
                  file.on("error", rejectMusic);
                })
                .on("error", rejectMusic);
            });
          }
        } catch (musicError) {
          console.warn(`⚠️ Could not load music: ${musicError.message}`);
        }
      }

      console.log(
        `🚀 Processing mode: ${
          isShortClipMontage
            ? "SUPER FAST (normalized concat)"
            : "STANDARD (normalized concat)"
        }`
      );

      let tempFiles = [];
      let normalizedFiles = [];

      // Download all clips first
      console.log(`⬇️ Downloading ${clips.length} clips...`);
      const downloadPromises = clips.map(async (clip, i) => {
        const tempFile = path.join(tempDir, `clip_${i}_${Date.now()}.mp4`);
        console.log(`⬇️ Downloading clip ${i + 1}/${clips.length}`);

        await new Promise((resolveDownload, rejectDownload) => {
          const file = fs.createWriteStream(tempFile);
          https
            .get(clip.videoUrl, (response) => {
              response.pipe(file);
              file.on("finish", () => {
                file.close();
                resolveDownload();
              });
              file.on("error", rejectDownload);
            })
            .on("error", rejectDownload);
        });

        return tempFile;
      });

      tempFiles = await Promise.all(downloadPromises);
      console.log(`📁 All ${tempFiles.length} files downloaded`);

      // Normalize all clips to same format/fps/resolution before concatenating
      console.log(`🔄 Normalizing ${tempFiles.length} clips...`);
      const normalizePromises = tempFiles.map(async (file, i) => {
        const normalizedFile = path.join(tempDir, `normalized_${i}_${Date.now()}.mp4`);
        
        return new Promise((resolveNormalize, rejectNormalize) => {
          ffmpeg(file)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size('1280x720') // Standardize resolution
            .fps(30) // Standardize frame rate
            .outputOptions([
              '-preset', isShortClipMontage ? 'veryfast' : 'ultrafast',
              '-crf', '28',
              '-movflags', '+faststart',
              '-pix_fmt', 'yuv420p', // Ensure consistent pixel format
              '-r', '30', // Force frame rate
              '-vsync', 'cfr', // Constant frame rate
              '-async', '1', // Audio sync
            ])
            .on('start', () => {
              console.log(`🔄 Normalizing clip ${i + 1}/${tempFiles.length}`);
            })
            .on('end', () => {
              console.log(`✅ Normalized clip ${i + 1}/${tempFiles.length}`);
              resolveNormalize(normalizedFile);
            })
            .on('error', (err) => {
              console.error(`❌ Error normalizing clip ${i + 1}:`, err);
              rejectNormalize(err);
            })
            .save(normalizedFile);
        });
      });

      normalizedFiles = await Promise.all(normalizePromises);
      console.log(`✅ All ${normalizedFiles.length} clips normalized`);

      // Create list file for FFmpeg concat with normalized files
      const listFilePath = path.join(tempDir, `list_${Date.now()}.txt`);
      const listContent = normalizedFiles
        .map((file) => `file '${file.replace(/\\/g, "/")}'`)
        .join("\n");
      fs.writeFileSync(listFilePath, listContent);

      console.log(`📝 Created concat list with ${normalizedFiles.length} normalized files`);

      // Create FFmpeg command for final concatenation
      let ffmpegCommand = ffmpeg()
        .input(listFilePath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset', isShortClipMontage ? 'veryfast' : 'ultrafast',
          '-crf', '28',
          '-movflags', '+faststart',
          '-threads', '0',
          '-tune', 'zerolatency',
          '-avoid_negative_ts', 'make_zero', // Fix timing issues
        ]);

      // Add background music if available
      if (musicFile && fs.existsSync(musicFile)) {
        console.log(`🎵 Adding background music to montage`);
        ffmpegCommand
          .input(musicFile)
          .complexFilter([
            "[1:a]volume=0.3[bg_music]",
            "[0:a]volume=0.7[orig_audio]", 
            "[orig_audio][bg_music]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio]",
          ])
          .outputOptions(["-map", "0:v", "-map", "[mixed_audio]"]);
      }

      ffmpegCommand
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("🎬 Final FFmpeg concat started:", commandLine.substring(0, 200) + "...");
        })
        .on("progress", (progress) => {
          console.log(
            "🎥 Final processing: " + Math.round(progress.percent || 0) + "% done"
          );
        })
        .on("end", async () => {
          console.log("✅ Video concatenation finished successfully");

          try {
            // Upload montage to Cloudinary with thumbnail generation
            const uploadResult = await cloudinary.uploader.upload(outputPath, {
              resource_type: "video",
              folder: `user_montages/${userId}`,
              public_id: `montage_${month}_${Date.now()}`,
              eager: [
                { width: 400, height: 300, crop: "scale", format: "jpg" },
              ],
            });

            console.log(
              "☁️ Montage uploaded to Cloudinary:",
              uploadResult.secure_url
            );

            // Clean up all temp files
            [...tempFiles, ...normalizedFiles].forEach((file) => {
              if (fs.existsSync(file)) fs.unlinkSync(file);
            });
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
            if (musicFile && fs.existsSync(musicFile)) fs.unlinkSync(musicFile);

            console.log("🧹 Cleanup completed");
            resolve(uploadResult);
          } catch (uploadError) {
            console.error("❌ Upload error:", uploadError);
            reject(uploadError);
          }
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg concatenation error:", err);
          // Clean up temp files on error
          [...tempFiles, ...normalizedFiles].forEach((file) => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
          if (musicFile && fs.existsSync(musicFile)) fs.unlinkSync(musicFile);
          reject(err);
        })
        .run();
    } catch (error) {
      console.error("❌ Montage creation error:", error);
      reject(error);
    }
  });
}

// Helper function to add music to existing montage video
async function addMusicToMontage(existingVideoUrl, musicTrack, userId, month) {
  return new Promise(async (resolve, reject) => {
    try {
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const videoFile = path.join(tempDir, `existing_video_${Date.now()}.mp4`);
      const musicFile = path.join(tempDir, `music_${Date.now()}.mp3`);
      const outputPath = path.join(
        tempDir,
        `montage_with_music_${userId}_${month}_${Date.now()}.mp4`
      );

      console.log(`🎥 Downloading existing video from: ${existingVideoUrl}`);

      // Download existing video
      await new Promise((resolveDownload, rejectDownload) => {
        const file = fs.createWriteStream(videoFile);
        https
          .get(existingVideoUrl, (response) => {
            response.pipe(file);
            file.on("finish", () => {
              file.close();
              console.log(`✅ Video downloaded: ${videoFile}`);
              resolveDownload();
            });
            file.on("error", rejectDownload);
          })
          .on("error", rejectDownload);
      });

      console.log(`🎵 Downloading music from: ${musicTrack.url}`);

      // Download music file
      await new Promise((resolveMusic, rejectMusic) => {
        const file = fs.createWriteStream(musicFile);
        https
          .get(musicTrack.url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
              file.close();
              console.log(`✅ Music downloaded: ${musicFile}`);
              resolveMusic();
            });
            file.on("error", rejectMusic);
          })
          .on("error", rejectMusic);
      });

      // Create FFmpeg command to add background music
      ffmpeg()
        .input(videoFile)
        .input(musicFile)
        .complexFilter([
          // Mix audio: lower the original video audio and overlay with background music
          "[1:a]volume=0.3[bg_music]", // Background music at 30% volume
          "[0:a]volume=0.7[orig_audio]", // Original audio at 70% volume
          "[orig_audio][bg_music]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio]",
        ])
        .outputOptions(["-map", "0:v", "-map", "[mixed_audio]"])
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions([
          "-preset",
          "ultrafast", // Changed from "fast" to "ultrafast"
          "-crf",
          "28", // Increased from 23 to 28 for faster processing
          "-movflags",
          "+faststart",
          "-threads",
          "0", // Use all CPU cores
          "-tune",
          "fastdecode", // Optimize for speed
        ])
        .on("start", (commandLine) => {
          console.log("🎬 FFmpeg started for music overlay:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(
            "🎵 Adding music: " + Math.round(progress.percent || 0) + "% done"
          );
        })
        .on("end", async () => {
          console.log("✅ Music overlay finished");

          try {
            // Upload new montage with music to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(outputPath, {
              resource_type: "video",
              folder: `user_montages/${userId}`,
              public_id: `montage_with_music_${month}_${Date.now()}`,
              eager: [
                { width: 400, height: 300, crop: "scale", format: "jpg" },
              ],
            });

            console.log(
              "☁️ Montage with music uploaded to Cloudinary:",
              uploadResult.secure_url
            );

            // Clean up temp files
            if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
            if (fs.existsSync(musicFile)) fs.unlinkSync(musicFile);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            resolve(uploadResult);
          } catch (uploadError) {
            console.error("❌ Upload error:", uploadError);
            reject(uploadError);
          }
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          // Clean up temp files on error
          if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
          if (fs.existsSync(musicFile)) fs.unlinkSync(musicFile);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          reject(err);
        })
        .output(outputPath)
        .run();
    } catch (error) {
      console.error("❌ Music overlay error:", error);
      reject(error);
    }
  });
}

module.exports = montageRouter;