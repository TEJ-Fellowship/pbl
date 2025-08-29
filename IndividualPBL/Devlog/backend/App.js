import { GoogleGenAI } from "@google/genai";

import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
// app.use(cors());

app.use(express.json({ limit: "10mb" })); // <-- Add this

// Use CORS middleware to allow requests from the frontend
// app.use(cors({ origin: "http://localhost:5173" }));

app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from this origin
    methods: ["GET", "POST"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
  })
);

let userAccessToken = null;

app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  try {
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      { client_id, client_secret, code },
      { headers: { Accept: "application/json" } }
    );

    userAccessToken = tokenResponse.data.access_token;
    console.log("Access token stored:", userAccessToken);

    // Redirect browser to frontend
    res.redirect("http://localhost:5173?connected=true");
  } catch (err) {
    console.error(err);
    res.status(500).send("GitHub auth failed");
  }
});

// Fetch repos
app.get("/repos", async (req, res) => {
  if (!userAccessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const userReposFromBackend = await axios.get(
      "https://api.github.com/user/repos",
      {
        headers: { Authorization: `token ${userAccessToken}` },
      }
    );

    res.json({ repos: userReposFromBackend.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch repos" });
  }
});

app.get("/commits/:owner/:repo", async (req, res) => {
  if (!userAccessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { owner, repo } = req.params;
  try {
    const commitsRes = await axios.post(
      `https://api.github.com.repos/${owner}/${repo}/commits`,
      {
        headers: { Authorization: `token ${userAccessToken}` },
      }
    );

    if (commitsRes.data.length > 0) {
      const latestCommit = commitsRes.data[0];
      res.json({
        message: latestCommit.commit.message,
        date: latestCommit.commit.author.date,
      });
    } else {
      res.json({ message: "No commits found", date: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch commits" });
  }
});

app.post("/api/gemini", async (req, res) => {
  console.log("Route /api/gemini hit"); // Debug log
  console.log("Request body:", req.body); // Debug log
  const { logs, repos } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a world class software developer.Analyze the manually entered logs by the user and go through their Github repositories to create a summary on their work and give feedbacks or suggestions and provide the learning path in the following JSON format:
    {

    "summary": "Overview of the developer's recent activities",
    "active_projects":[{
    "name":"Project Name", "description":"Short description about the repo"
    }
    ],
    "top_tech_stacks":["React","Node.js"]
    "recommendation":[
    "You have used react useState a lot, now try to understand about UseContext, advanced state management with Redux,
    "Explore Google Gemini API integration to add more unique features to your projects",
    "Go through the documentation like freecodecamp,w3school,programiz to understand the concept of React more effectively  
    ],

    "achivements":[
    "Completed login/signup of the minor project",
    "Done wireframing",
    "Completed design in figma"
    ]
    }


        Rules:
        - Each "summary" should highlight the general progress from logs.
        - Each "active_projects" must be inferred from the provided repo list.
        - Each "top_tech_stacks" can be based on both logs and repos list.
        - Include 2-3 "recommendations" which is relevant to recent work of the user and helps user to improve their skills.
        - Each "achivements" must be inferred from the logs entered by the user.


        Developer logs:
        "${JSON.stringify(logs, null, 2)}

        Github repositories:
        "${JSON.stringify(repos, null, 2)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    // Await the response if it's a promise
    const response = await result.text; // Resolve the promise
    console.log("Gemini API response:", response); // Debug log

    let cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedResponse);

    res.json({ parsed });
    // res.json({text});

    // } catch (err) {
    //   console.error(err.response?.data || err.message);
    //   res.status(500).json({ error: "Gemini request failed" });
    // }
  } catch (err) {
    console.error("Gemini API error:", err.message || err);
    res.status(500).json({ error: "Gemini request failed" }); // Always JSON
  }
});

app.listen(5000, () => console.log("Backend running on port 5000"));
