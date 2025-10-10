const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ dest: "uploads/" }); // temporary storage
const geminiRouter = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

geminiRouter.post("/summarize", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoBuffer = fs.readFileSync(req.file.path);
    const base64Video = videoBuffer.toString("base64");

    const videoData = {
      inlineData: {
        data: base64Video,
        mimeType: "video/mp4",
      },
    };

    const prompt =
      req.body.prompt ||
      "Summarize this montage video in a paragraph, focusing on mood, themes, and main activities.";

    const result = await model.generateContent([prompt, videoData]);
    const summary = result.response.text();

    // cleanup
    fs.unlinkSync(req.file.path);

    res.json({ success: true, summary });
  } catch (err) {
    console.error("Gemini summarization error:", err);
    res.status(500).json({ error: "Failed to summarize video" });
  }
});

module.exports = geminiRouter;
