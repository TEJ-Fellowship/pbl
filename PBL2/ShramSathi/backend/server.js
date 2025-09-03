import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

import { connectDB, Task, Program } from "./mongo.js";
import User from "./models/user.js";

dotenv.config();

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ================== TASK ROUTES ==================
app.get("/", (req, res) => {
  res.send("Get request is tested and implemented successfully");
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().populate(
      "programId",
      "title description start end"
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);
    console.log("Task is going to be saved");
    await task.save();
    console.log("Task is saved!");
    res.status(201).json({ message: "Task saved successfully!", task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== PROGRAM ROUTES ==================

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("Created uploads folder");
}

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsDir));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Add new program with optional image
app.post("/api/programs", upload.single("image"), async (req, res) => {
  try {
    const body = req.body;

    // Handle tags: array or comma-separated string
    let tags = [];
    if (body.tags) {
      if (Array.isArray(body.tags)) tags = body.tags;
      else tags = body.tags.split(",").map((t) => t.trim());
    }

    const program = new Program({
      ...body,
      tags,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await program.save();
    console.log("Program saved!");
    res.status(201).json(program);
  } catch (err) {
    console.error("Error saving program:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all programs with their tasks
app.get("/api/programs", async (req, res) => {
  try {
    const programs = await Program.find().lean();
    const programsWithTasks = await Promise.all(
      programs.map(async (program) => {
        const tasks = await Task.find({ programId: program._id });
        return { ...program, tasks };
      })
    );
    res.status(200).json(programsWithTasks);
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================== NEWS (RSS) ROUTES ==================
const parser = new Parser({
  customFields: {
    item: ["description"],
  },
});

const feeds = [
  "https://www.onlinekhabar.com/rss/category/news",
  "https://www.setopati.com/feed/",
];

app.get("/news", async (req, res) => {
  try {
    let allNews = [];

    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const news = feed.items.map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.contentSnippet || "",
        }));
        allNews = allNews.concat(news);
      } catch (err) {
        console.error(`Failed to parse feed ${feedUrl}:`, err.message);
      }
    }

    if (allNews.length === 0) {
      return res.status(200).json({ message: "No news available" });
    }

    res.status(200).json(allNews);
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: "Server failed to fetch news" });
  }
});

// ================== GEMINI AI ROUTE ==================
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

app.post("/api/gemini", async (req, res) => {
  const { news, link } = req.body;
  console.log("Backend Gemini News", news);

  try {
    const prompt = `
The following are news headlines from Nepal (in Nepali language). 
Translate them to English and analyze.

Rules:
- Only consider news that can be addressed by small teams, NGOs, or student groups.
- If such news exist:
   - Return a JSON object with this structure:
     {
       "relevantNews": [
         {
           "headline": "<original headline in English>",
           "link": "<original link in English>",
           "summary": "<2-3 line summary>",
           "suggestedProgram": "<one community program>"
         }
       ]
     }
- If NO such news exist:
   - Return exactly this JSON:
     { "message": "There are no news that can be addressed by small teams, NGOs, or student groups." }

News: ${news.map((n) => n.title).join(", ")}
Link: ${news.map((n) => n.link).join(", ")}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.text;
    console.log("Gemini API response:", response);

    let cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedResponse);

    res.json({ text: parsed });
  } catch (err) {
    console.error("Gemini API error:", err.message || err);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

// ================== USER AUTH ==================
app.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  try {
    const newUser = new User({
      username,
      email,
      password: passwordHash,
    });

    await newUser.save();
    res.status(200).json({ message: "New user registered successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "User registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid password" });

    //generate token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.SECRET_KEY
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ================== START SERVER ==================
const port = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
