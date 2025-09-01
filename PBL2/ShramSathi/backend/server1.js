import express from 'express';
import cors from 'cors';

import Parser from "rss-parser";
import dotenv from "dotenv";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import { connectDB, Task } from './mongo.js';
import { GoogleGenAI } from "@google/genai";
import User from "./models/user.js"

dotenv.config();

// initializing express framework
const app = express();

//middleware
app.use(cors());
app.use(express.json());


const apiKey = process.env.GEMINI_API_KEY;
// console.log("Gemini API Key:", process.env.GEMINI_API_KEY);
const ai = new GoogleGenAI({
  apiKey,
});

const parser = new Parser({
    // This cleans up invalid entities
    customFields: {
      item: ["description"],
    },
  });

  const feeds = [
    "https://www.onlinekhabar.com/rss/category/news",
    "https://www.setopati.com/feed/",
  ];




  /* ROUTE TO FETCH THE LATEST NEWS */
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
  
          if (allNews.length === 0) {
            return res.status(200).json([]); // <-- send empty array instead of object
          }
        } catch (err) {
          console.error(`Failed to parse feed ${feedUrl}:`, err.message);
          // continue to next feed
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






/* GEMINI AI ROUTE */
app.post("/api/gemini", async (req, res) => {
    const { news ,link} = req.body;
    console.log("Backend Gemini News", news);
  
    try {
      // const ai = new GoogleGenAI(); // credentials automatically picked up from JSON
  
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
             link: "<original link in English>",
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
  
      console.log("Our prompt:", prompt);
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      // console.log("Result from Gemini :", result.text);
      // Await the response if it's a promise
      const response = result.text; // Resolve the promise
      console.log("Gemini API response:", response); // Debug log
  
      let cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedResponse);
  
    res.json({ text: parsed });
  
  
    } catch (err) {
      console.error("Gemini API error:", err.message || err);
      res.status(500).json({ error: "Gemini request failed" }); // Always JSON
    }
  });





app.get('/', (req, res) => {
    res.send('Get request is tested and implemented successfully');
})

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks", err});
    }
})

app.post('/api/tasks', async (req, res) => {
    try {
        const task = new Task(req.body);
        console.log('Task is going to be saved');
        await task.save();
        console.log('Task is saved!')
        res.status(201).json({ message: "Task saved successfully!", task });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

app.patch('/api/tasks/:id', async (req, res) => {
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



















/* USER AUTHENTICATION */
//register new user
// app.post("/auth/register",async(req,res)=>{
//   const{username,email,password} = req.body

//   try {
//     const newUser = new User({
//       username,
//       email,
//       password
//     })
//     await newUser.save()
//     res.status(200).send({message:"new user registered successfully"})
//     //here the user password can be easily seen in the database which is not good for any security reasons
//   } catch (error) {
//     console.log(error)
//   }
// })






app.post("/auth/register",async(req,res)=>{
    const{username,email,password} = req.body
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password,saltRounds)
  
    try {
      const newUser = new User({
        username,
        email,
        password:passwordHash
      })
  
      const saveUser = await newUser.save()
      res.status(200).json({message:"new user registered successfully"})
      // res.status(201).json(saveUser)
    } catch (error) {
      console.log(error)
    }
  })





/* route for the login */
app.post('/auth/login',async(req,res)=>{
    const {email,password} = req.body
  
  try {
    const user = await User.findOne({email})
    if(!user) return res.status(400).json({error:"user not found"})
  
    const validedPassword = await bcrypt.compare(password,user.password)
    if(!validedPassword) return res.status(401).json({error:"Invalid password"})


    //generate token
    const token = jwt.sign({
        id:user._id,
        email:user.email
    }, process.env.SECRET_KEY)

    res.status(200).json({message:"Login successfull",token:token})
  
      
  } catch (error) {
    console.log(err)
  }
  
  })









































const port = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
