const express = require("express");
const Music = require("../models/music");
const authMiddleware = require("../utils/authMiddleware");

const musicRouter = express.Router();

// Get all available music tracks
musicRouter.get("/", async (req, res) => {
  try {
    const music = await Music.find().sort({ createdAt: -1 });
    res.json({ success: true, music });
  } catch (error) {
    console.error("Error fetching music:", error);
    res.status(500).json({ success: false, error: "Failed to fetch music" });
  }
});

// Get music by genre/mood
musicRouter.get("/genre/:genre", async (req, res) => {
  try {
    const { genre } = req.params;
    const music = await Music.find({
      $or: [{ genre: genre }, { tags: { $in: [genre] } }],
    });
    res.json({ success: true, music });
  } catch (error) {
    console.error("Error fetching music by genre:", error);
    res.status(500).json({ success: false, error: "Failed to fetch music" });
  }
});

// Add new music track (admin only)
musicRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, artist, url, duration, genre, tags, mood } = req.body;

    const newMusic = new Music({
      title,
      artist: artist || "Unknown Artist",
      url,
      duration,
      genre,
      tags,
      mood,
    });

    await newMusic.save();
    res.json({ success: true, music: newMusic });
  } catch (error) {
    console.error("Error adding music:", error);
    res.status(500).json({ success: false, error: "Failed to add music" });
  }
});

// Add sample music tracks for testing
musicRouter.post("/seed", async (req, res) => {
  try {
    // Clear existing music
    await Music.deleteMany({});

    // Add sample tracks with working URLs
    const sampleTracks = [
      {
        title: "Happy Montage",
        artist: "Free Music",
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        duration: 180,
        genre: "upbeat",
        mood: "energetic",
        tags: ["happy", "positive", "fun"],
      },
      {
        title: "Chill Vibes",
        artist: "Ambient Sound",
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        duration: 200,
        genre: "chill",
        mood: "calm",
        tags: ["relaxing", "peaceful", "ambient"],
      },
      {
        title: "Epic Adventure",
        artist: "Cinematic Music",
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        duration: 240,
        genre: "epic",
        mood: "adventurous",
        tags: ["cinematic", "dramatic", "powerful"],
      },
      {
        title: "Acoustic Dreams",
        artist: "Folk Artist",
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
        duration: 190,
        genre: "acoustic",
        mood: "nostalgic",
        tags: ["guitar", "warm", "mellow"],
      },
    ];

    const createdTracks = await Music.insertMany(sampleTracks);
    res.json({
      success: true,
      message: `Added ${createdTracks.length} sample music tracks`,
      tracks: createdTracks,
    });
  } catch (error) {
    console.error("Error seeding music:", error);
    res.status(500).json({ success: false, error: "Failed to seed music" });
  }
});

module.exports = musicRouter;
